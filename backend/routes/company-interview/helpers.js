import _express from 'express';
import Groq from 'groq-sdk';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { optionalAuth as _optionalAuth, authenticateToken as _authenticateToken } from '../../middleware/auth.js';
import { supabaseAdmin as _supabaseAdmin } from '../../db/supabaseClient.js';
import { aiCallWithRetry } from '../../utils/aiClient.js';
import { getRandomQuestionSet as _getRandomQuestionSet, getFilteredQuestions as _getFilteredQuestions, getQuestionCount as _getQuestionCount } from '../../services/companyQuestionService.js';
import { buildInitialVoiceTelemetry as _buildInitialVoiceTelemetry, buildVoiceTelemetrySnapshot as _buildVoiceTelemetrySnapshot } from '../../utils/voiceTelemetry.js';
import { buildAnswerFeedbackPrompt as _buildAnswerFeedbackPrompt, normalizeInterviewFeedback as _normalizeInterviewFeedback } from '../../utils/interviewFeedback.js';
import { evaluateFresherAnswer as _evaluateFresherAnswer } from '../../services/interviewAnswerEvaluator.js';

export const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

export function safeDeleteUploadFile(filePath) {
  if (!filePath) return;
  const resolvedUploadDir = path.resolve(UPLOAD_DIR);
  const resolvedPath = path.resolve(filePath);
  if (!resolvedPath.startsWith(resolvedUploadDir + path.sep) && resolvedPath !== resolvedUploadDir) {
    return;
  }

  try {
    if (fs.existsSync(resolvedPath)) fs.unlinkSync(resolvedPath);
  } catch {
    // Best-effort cleanup only.
  }
}


// ─── Helpers ───

/** Truncate conversation history to the last N turns (each turn = 1 user + 1 assistant message). */
export const MAX_HISTORY_TURNS = 6;
export function truncateConversationHistory(history) {
  if (!Array.isArray(history) || history.length === 0) return [];
  const maxMessages = MAX_HISTORY_TURNS * 2;
  return history.length > maxMessages ? history.slice(-maxMessages) : history;
}

/** Deterministic pseudo-random for scoring — avoids Math.random() non-determinism. */
export function deterministicScore(base, range, seed) {
  const s = typeof seed === 'string' ? seed.length : Number(seed) || 0;
  const hash = ((s * 2654435761) >>> 0) % range;
  return base + hash;
}

/** Deterministic array pick using seed instead of Math.random(). */
export function deterministicPick(arr, seed) {
  if (!arr.length) return arr[0];
  const s = typeof seed === 'string' ? seed.length : Number(seed) || 0;
  const idx = ((s * 2654435761) >>> 0) % arr.length;
  return arr[idx];
}

/** Safely parse JSON from AI response, returning null on failure. */
export function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    // Try to extract JSON from markdown code fences
    const fenced = text?.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced?.[1]) {
      try { return JSON.parse(fenced[1].trim()); } catch { /* fall through */ }
    }
    return null;
  }
}

// Multer config for STT audio uploads
export const UPLOAD_DIR = os.tmpdir();
export const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => cb(null, `stt_${Date.now()}_${crypto.randomBytes(8).toString('hex')}.webm`)
  }),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('audio/')) return cb(null, false);
    cb(null, true);
  }
});

// ─── Company Category Classification ───
export const COMPANY_CATEGORIES = {
  big4: ['deloitte', 'kpmg', 'ey', 'pwc'],
  faang: ['google', 'amazon', 'meta', 'microsoft', 'apple', 'netflix'],
  indian_it: ['tcs', 'infosys', 'wipro', 'hcl', 'techmahindra', 'cognizant'],
  startup: ['flipkart', 'paytm', 'swiggy', 'zomato', 'razorpay', 'cred', 'meesho'],
};

export function getCompanyCategory(company) {
  const id = company.toLowerCase();
  for (const [cat, list] of Object.entries(COMPANY_CATEGORIES)) {
    if (list.some(c => id.includes(c))) return cat;
  }
  return 'general';
}

// ─── Distinct Interviewer Personas ───
export const PERSONA_PROFILES = {
  big4: {
    name: 'Senior Partner',
    style: 'Formal & Structured',
    description: 'You speak like a senior consulting partner — formal but warm, structured, and analytical. You use frameworks (MECE, issue trees) and expect structured answers.',
    followUpStyle: 'Ask structured follow-ups using consulting frameworks. Challenge assumptions with data questions.',
    challengeMode: 'When an answer lacks structure, say: "I appreciate the direction, but can you structure that more systematically?"',
  },
  faang: {
    name: 'Staff Engineer',
    style: 'Technical & Deep',
    description: 'You speak like a staff engineer at a top tech company — technically rigorous, direct but friendly. You expect deep technical depth and system-level thinking.',
    followUpStyle: 'Dive deep into implementation details. Ask about time/space complexity, alternatives, and what happens at 10x scale.',
    challengeMode: 'When an answer is surface-level, say: "Good start, but go deeper. What about edge cases? What are the trade-offs?"',
  },
  startup: {
    name: 'CTO / Co-founder',
    style: 'Conversational & Product-minded',
    description: 'You speak like a startup CTO — casual, direct, product-focused. You care about speed, product thinking, and cultural fit.',
    followUpStyle: 'Ask about practical implementation, MVP approach, user impact, and prioritization.',
    challengeMode: 'When an answer is too theoretical, say: "Cool idea, but how would you actually ship this? What\'s your MVP?"',
  },
  indian_it: {
    name: 'Technical Lead',
    style: 'Professional & Fundamentals-focused',
    description: 'You speak like a technical lead at a large IT services company — professional, focused on fundamentals and problem-solving.',
    followUpStyle: 'Test foundational knowledge with follow-ups on CS fundamentals. Ask to compare approaches.',
    challengeMode: 'When an answer misses fundamentals, say: "That\'s partially correct. What are the underlying principles at play here?"',
  },
  general: {
    name: 'Hiring Manager',
    style: 'Balanced & Professional',
    description: 'You speak like an experienced hiring manager — balanced between technical and behavioral assessment.',
    followUpStyle: 'Mix of technical depth and behavioral probing. Ask about real experiences and problem-solving.',
    challengeMode: 'When an answer needs improvement, say: "Good effort. Can you think of a scenario where your approach might not work?"',
  },
};

export const DEFAULT_ADVANCED_OPTIONS = {
  interviewerIntensity: 'balanced',
  followUpDepth: 'standard',
  answerPace: 'balanced',
  realInterviewerMode: false,
  resumeInterviewMode: 'balanced',
  focusTopics: [],
  questionCount: 13,
};

export const INTERVIEW_RUNTIME_MODES = ['full_realtime'];

export function normalizeInterviewRuntimeMode(mode) {
  const normalized = String(mode || '').trim().toLowerCase();
  if (INTERVIEW_RUNTIME_MODES.includes(normalized)) return normalized;

  const envMode = String(process.env.AI_INTERVIEW_MODE || '').trim().toLowerCase();
  if (INTERVIEW_RUNTIME_MODES.includes(envMode)) return envMode;

  return 'full_realtime';
}

export function buildInterviewRuntime(mode) {
  if (mode === 'full_realtime') {
    return {
      mode,
      realtime: true,
      strategy: 'realtime_voice_bridge',
      transport: 'websocket',
      bargeInEnabled: true,
      targetFirstAudioMs: 800,
    };
  }

  return {
    mode: 'full_realtime',
    realtime: true,
    strategy: 'realtime_voice_bridge',
    transport: 'websocket',
    bargeInEnabled: true,
    targetFirstAudioMs: 800,
  };
}

export const STAGE_ALIASES = {
  hr: 'HR',
  behavioral: 'Behavioral',
  behaviour: 'Behavioral',
  technical: 'Technical',
  dsa: 'DSA / Coding',
  coding: 'DSA / Coding',
  'dsa / coding': 'DSA / Coding',
  systemdesign: 'System Design',
  'system design': 'System Design',
  oa: 'OA',
  managerial: 'Managerial',
};

export function resolveInterviewStage(...candidates) {
  for (const value of candidates) {
    const raw = String(value || '').trim();
    if (!raw) continue;

    const lower = raw.toLowerCase();
    if (STAGE_ALIASES[lower]) return STAGE_ALIASES[lower];

    const compact = lower.replace(/[_-]/g, '').replace(/\s+/g, '');
    if (STAGE_ALIASES[compact]) return STAGE_ALIASES[compact];

    return raw;
  }

  return 'Technical';
}

export function resolveResumeInterviewModeForExperience(normalizedAdvanced, experienceLevel, resumeContext) {
  const normalizedLevel = String(experienceLevel || '').toLowerCase();
  const hasResumeContext = Boolean(resumeContext && typeof resumeContext === 'object');

  if (normalizedLevel === 'experienced' && hasResumeContext && normalizedAdvanced.resumeInterviewMode === 'balanced') {
    return {
      ...normalizedAdvanced,
      resumeInterviewMode: 'project-deep-dive',
    };
  }

  return normalizedAdvanced;
}

export function normalizeAdvancedOptions(input = {}) {
  const intensity = ['supportive', 'balanced', 'challenging'].includes(input?.interviewerIntensity)
    ? input.interviewerIntensity
    : DEFAULT_ADVANCED_OPTIONS.interviewerIntensity;

  const depth = ['standard', 'deep'].includes(input?.followUpDepth)
    ? input.followUpDepth
    : DEFAULT_ADVANCED_OPTIONS.followUpDepth;

  const pace = ['slow', 'balanced', 'fast'].includes(input?.answerPace)
    ? input.answerPace
    : DEFAULT_ADVANCED_OPTIONS.answerPace;

  const realInterviewerMode = Boolean(input?.realInterviewerMode);

  const resumeInterviewMode = ['balanced', 'walkthrough', 'project-deep-dive', 'fresher-hr-tech'].includes(input?.resumeInterviewMode)
    ? input.resumeInterviewMode
    : DEFAULT_ADVANCED_OPTIONS.resumeInterviewMode;

  const rawTopics = Array.isArray(input?.focusTopics)
    ? input.focusTopics
    : typeof input?.focusTopics === 'string'
      ? input.focusTopics.split(',')
      : [];

  const focusTopics = rawTopics
    .map(t => String(t || '').trim())
    .filter(Boolean)
    .slice(0, 5);

  const count = Number(input?.questionCount);
  const questionCount = Number.isFinite(count) && count >= 4 && count <= 20
    ? Math.round(count)
    : DEFAULT_ADVANCED_OPTIONS.questionCount;

  return {
    interviewerIntensity: intensity,
    followUpDepth: depth,
    answerPace: pace,
    realInterviewerMode,
    resumeInterviewMode,
    focusTopics,
    questionCount,
  };
}

export function formatResumeContext(resumeContext) {
  if (!resumeContext || typeof resumeContext !== 'object') return '';

  const headline = String(resumeContext.candidateHeadline || '').trim();
  const summary = String(resumeContext.summary || '').trim();
  const coreSkills = Array.isArray(resumeContext.coreSkills) ? resumeContext.coreSkills.slice(0, 8) : [];
  const projectHighlights = Array.isArray(resumeContext.projectHighlights) ? resumeContext.projectHighlights.slice(0, 4) : [];
  const likelyQuestionAreas = Array.isArray(resumeContext.likelyQuestionAreas) ? resumeContext.likelyQuestionAreas.slice(0, 5) : [];

  if (!headline && !summary && coreSkills.length === 0 && projectHighlights.length === 0) {
    return '';
  }

  return `

## Candidate Resume Context
- Headline: ${headline || 'Not provided'}
- Summary: ${summary || 'Not provided'}
- Core skills: ${coreSkills.length > 0 ? coreSkills.join(', ') : 'Not provided'}
- Project highlights: ${projectHighlights.length > 0 ? projectHighlights.join(' | ') : 'Not provided'}
- Likely question areas: ${likelyQuestionAreas.length > 0 ? likelyQuestionAreas.join(', ') : 'Not provided'}

STRICT resume usage rules:
- Personalize questions using the candidate's actual projects, skills, and technologies from the resume context.
- Prefer asking about one specific project, internship, tool, or achievement instead of generic questions.
- Ask follow-ups that test depth on claims made in the resume.
- If the resume mentions a project, ask how it was built, trade-offs made, metrics achieved, failures handled, or what they would improve.
- If the resume context is thin, gracefully fall back to standard interview behavior without mentioning the missing data.
`;
}

export const FRESHER_INTERVIEW_TOTAL_QUESTIONS = 13;
export const HR_CLOSING_MESSAGE = 'Thank you for your time today. It was a pleasure getting to know you and your background. We will review everything and our recruitment team will be in touch with you shortly. Have a great day!';

export const STATIC_INTERVIEW_QUESTIONS = {
  HR: [
    'Hey, welcome! Thanks for taking the time to chat with us today. So this is going to be a pretty relaxed conversation — I just want to learn a bit about you, your interests, and what gets you excited. Let\'s start simple — tell me a bit about yourself and your journey so far.',
    'What attracted you to this role and to our company in particular?',
    'Can you tell me about a project or achievement that you’re most proud of, and why?',
    'Describe a time when you faced a difficult problem or challenge. How did you handle it?',
    'Tell me about a time you had to work closely with someone whose working style was very different from yours.',
    'How do you usually handle stress or pressure, for example during exams, deadlines, or multiple tasks?',
    'What are your key strengths, and how will they help you succeed in this role?',
    'What is one area you’re actively trying to improve, and what are you doing about it?',
    'Imagine you are assigned to a technology or location you did not expect. How would you approach that situation?',
    'Do you have any questions for me about the role, team, or company?',
  ],
  Technical: [
    'Can you explain the difference between an abstract class and an interface? When would you pick one over the other?',
    'How does garbage collection work in your preferred language? What are the different algorithms?',
    'What is the difference between concurrency and parallelism? Can you give a real-world example?',
    'Explain how a hash map works internally. What happens during a collision?',
    'What are SOLID principles? Can you walk me through each one with a quick example?',
    'How would you debug a production issue where the application is running slow but CPU usage is normal?',
    'What is the CAP theorem? How does it apply to database selection?',
    'Explain the event loop in Node.js. How does it handle asynchronous operations?',
  ],
};

export const STATIC_INTERVIEW_CLOSINGS = {
  HR: HR_CLOSING_MESSAGE,
  Technical: 'Thank you for your time today. We will review your technical discussion and get back to you with next steps soon.',
};

// Fresher Technical Interview Fixed Questions

// Fresher HR Interview Fixed Questions
// Q1: Fixed intro question
// Q2-Q11: AI-generated from behavioral topics (different each interview)
// Q12: Fixed wrap-up
// Q13: Fixed conclusion (YES/NO branching)

export const FRESHER_HR_FIXED = {
  Q1: 'Hey, welcome! Thanks for joining me today. So this will be a pretty relaxed conversation — I want to get to know you, your interests, and what motivates you. Let\'s kick things off — tell me a bit about yourself and your journey so far.',
  Q12: 'Do you have any questions for me about the role, the team, or our company?',
};

// AI Prompt Templates for Fresher HR Q2-Q11 (Behavioral Topics)
export const FRESHER_HR_TOPICS = {
  2: { topic: 'Role Interest & Motivation', prompt: 'Ask the candidate what attracted them to this role and to your company in particular. Focus on their genuine interest and alignment with company values.' },
  3: { topic: 'Project & Achievement', prompt: 'Ask the candidate to describe a project or achievement they\'re most proud of, and why. Push them to explain their specific contribution and impact.' },
  4: { topic: 'Problem-Solving & Challenges', prompt: 'Ask the candidate to describe a time when they faced a difficult problem or challenge and how they handled it. Focus on their approach, learning, and outcome.' },
  5: { topic: 'Teamwork & Collaboration', prompt: 'Ask the candidate to tell you about a time they had to work closely with someone whose working style was very different from theirs. Explore how they adapted and the result.' },
  6: { topic: 'Stress Management', prompt: 'Ask the candidate how they usually handle stress or pressure, for example during exams, deadlines, or multiple simultaneous tasks. Listen for their coping strategies and resilience.' },
  7: { topic: 'Strengths & Fit', prompt: 'Ask the candidate to share their key strengths and explain how they will help them succeed in this specific role. Encourage them to give concrete examples.' },
  8: { topic: 'Growth & Development', prompt: 'Ask the candidate what is one area they\'re actively trying to improve and what concrete steps they\'re taking to develop in that area. Look for self-awareness and commitment.' },
  9: { topic: 'Adaptability & Flexibility', prompt: 'Ask the candidate to imagine they are assigned to a technology or location they did not expect. How would they approach that situation? Explore their flexibility and positive attitude.' },
  10: { topic: 'Culture & Fit', prompt: 'Ask the candidate how they define a positive work environment and what aspects of our company culture (mission, values, team dynamics) appeal to them most. Probe their values alignment.' },
  11: { topic: 'Career Goals & Aspirations', prompt: 'Ask the candidate where they see themselves in 3-5 years and how this role fits into their career vision. Look for realistic ambition and alignment with company growth paths.' },
};
export const FRESHER_HR_CLOSINGS = {
  YES: 'Thank you for your thoughtful questions! We really appreciate your interest. We\'ll review our discussion and get back to you soon with next steps.',
  NO: 'Thank you so much for your time today! You\'ve given some really thoughtful answers. We\'ll review our discussion and be in touch soon. Best of luck!',
};

export const FRESHER_TECHNICAL_FIXED = {
  Q1: 'Hey, welcome! So today we\'re going to have a technical chat — we\'ll cover things like databases, OOP, web concepts, that kind of stuff. But first, I\'d love to hear a bit about you. Tell me about yourself and what technologies you\'ve been most interested in lately.',
  Q12: 'Do you have any questions for me about the role, the team, or our company?',
  Q13_YES: 'Thank you for your thoughtful questions! We really appreciate your interest. We\'ll review our discussion and get back to you soon with next steps.',
  Q13_NO: 'Thank you so much for your time today! You\'ve given some really thoughtful technical answers. We\'ll review our discussion and be in touch soon. Best of luck!',
};

// AI Prompt Templates for Fresher Technical Q2-Q11
export const FRESHER_TECHNICAL_TOPICS = {
  2: { topic: 'Resume & Projects', prompt: 'Ask the candidate to elaborate on a specific project from their resume. Focus on their role, the tech stack used, and what they learned. Keep it conversational and encouraging.' },
  3: { topic: 'Top Skill', prompt: 'Ask the candidate about the programming language or framework they are most confident in, and ask them to explain a concept they recently learned or used practically.' },
  4: { topic: 'OOP Fundamentals', prompt: 'Ask the candidate to explain one or two foundational OOP concepts (e.g., encapsulation, inheritance, polymorphism, or abstraction) with a real-world example they can think of.' },
  5: { topic: 'Interface vs Abstract Class', prompt: 'Ask the candidate to compare interfaces and abstract classes: What is the difference? When would they use one over the other? Keep the question clear and focused.' },
  6: { topic: 'Primary Key vs Foreign Key', prompt: 'Ask the candidate to explain the difference between primary keys and foreign keys in a database. Ask them to give a simple table example to illustrate.' },
  7: { topic: 'Database Normalization', prompt: 'Ask the candidate what database normalization is and why it matters. Ask them to describe one or two normal forms (1NF, 2NF, 3NF) they\'ve heard of.' },
  8: { topic: 'Language Strengths', prompt: 'Ask the candidate to explain a core concept or strength of their preferred programming language (e.g., memory management, type system, async model). Keep it practical.' },
  9: { topic: 'GET vs POST', prompt: 'Ask the candidate to explain the difference between HTTP GET and POST requests. Push them to mention when to use each and any security implications.' },
  10: { topic: 'Process vs Thread', prompt: 'Ask the candidate to compare processes and threads: What are the key differences? When would you use one over the other? Ask for a clear, straightforward answer.' },
  11: { topic: 'Data Structures', prompt: 'Ask the candidate to explain one fundamental data structure they are comfortable with (e.g., arrays, linked lists, stacks, queues, trees) and when they would use it in practice.' },
};

export function getStaticInterviewQuestions(stage = '') {
  return STATIC_INTERVIEW_QUESTIONS[String(stage || '').trim()] || [];
}

export function getStaticInterviewQuestion(stage = '', questionNumber = 1) {
  const questions = getStaticInterviewQuestions(stage);
  const index = Number(questionNumber) - 1;
  if (!Number.isFinite(index) || index < 0 || index >= questions.length) return '';
  return questions[index];
}

export function getStaticInterviewClosing(stage = '') {
  return STATIC_INTERVIEW_CLOSINGS[String(stage || '').trim()] || 'Thank you for your time today. We will review everything and follow up soon.';
}

export function getFresherTechnicalQuestion(qNum) {
  if (qNum === 1) return FRESHER_TECHNICAL_FIXED.Q1;
  if (qNum === 12) return FRESHER_TECHNICAL_FIXED.Q12;
  return null; // Q2-Q11 and Q13 require AI or special handling
}

export function getFresherTechnicalAIPrompt(qNum) {
  return FRESHER_TECHNICAL_TOPICS[qNum];
}


export function getFresherHRQuestion(qNum) {
  if (qNum === 1) return FRESHER_HR_FIXED.Q1;
  if (qNum === 12) return FRESHER_HR_FIXED.Q12;
  return null; // Q2-Q11 and Q13 require AI or special handling
}

export function getFresherHRAIPrompt(qNum) {
  return FRESHER_HR_TOPICS[qNum];
}

export async function generateFresherHRQuestion(qNum, _resumeContext = null) {
  if (qNum === 1) return FRESHER_HR_FIXED.Q1;
  if (qNum === 12) return FRESHER_HR_FIXED.Q12;
  if (qNum === 13) return null; // Handled separately

  if (!groq || qNum < 2 || qNum > 11) return null;

  const topicData = FRESHER_HR_TOPICS[qNum];
  if (!topicData) return null;

  try {
    const resumeContext_ = _resumeContext || {};
    const contextStr = resumeContext_.summary ? `Candidate context: ${resumeContext_.summary}. ` : '';
    const systemPrompt = `You are a friendly HR interviewer conducting a fresher-level HR interview. ${topicData.prompt}`;
    const userPrompt = `${contextStr}Generate a single, clear HR behavioral interview question for Q${qNum} on the topic: ${topicData.topic}. The question should be appropriate for a fresher (recent grad) and encourage them to share a real example or anecdote. Return ONLY the question, no numbering or explanation.`;

    const completion = await aiCallWithRetry({
      operation: () =>
        groq.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 150,
        }),
    });

    return completion?.choices?.[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.error(`Error generating fresher-HR Q${qNum}:`, err.message);
    return null;
  }
}
export function getFresherHRClosing(hasQuestions) {
  return hasQuestions ? FRESHER_HR_CLOSINGS.YES : FRESHER_HR_CLOSINGS.NO;
}

export async function generateFresherTechnicalQuestion(qNum, _resumeContext = null) {
  if (qNum === 1) return FRESHER_TECHNICAL_FIXED.Q1;
  if (qNum === 12) return FRESHER_TECHNICAL_FIXED.Q12;
  if (qNum === 13) return null; // Handled separately

  if (!groq || qNum < 2 || qNum > 11) return null;

  const topicData = FRESHER_TECHNICAL_TOPICS[qNum];
  if (!topicData) return null;

  try {
    const resumeContext_ = _resumeContext || {};
    const contextStr = resumeContext_.summary ? `Candidate context: ${resumeContext_.summary}. ` : '';
    const systemPrompt = `You are a friendly technical interviewer conducting a fresher-level interview. ${topicData.prompt}`;
    const userPrompt = `${contextStr}Generate a single, clear technical interview question for Q${qNum} on the topic: ${topicData.topic}. The question should be appropriate for a fresher (recent grad). Return ONLY the question, no numbering or explanation.`;

    const completion = await aiCallWithRetry({
      operation: () =>
        groq.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 150,
        }),
    });

    return completion?.choices?.[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.error(`Error generating fresher-technical Q${qNum}:`, err.message);
    return null;
  }
}

export const INTERVIEWER_NAMES = [
  'Riya Sharma',
  'Ananya Rao',
  'Neha Kapoor',
  'Rahul Verma',
  'Karan Malhotra',
  'Priya Nair',
  'Arjun Mehta',
  'Sanya Gupta',
  'Vikram Iyer',
  'James Mitchell',
  'Sarah Chen',
  'David Park',
  'Emily Torres',
];

export function pickFallbackInterviewerName() {
  return INTERVIEWER_NAMES[crypto.randomInt(INTERVIEWER_NAMES.length)];
}

export async function generateInterviewerName(company = '') {
  if (!groq) return pickFallbackInterviewerName();

  try {
    const completion = await aiCallWithRetry({
      operation: () =>
        groq.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: `Generate one realistic professional name for an interviewer at ${company || 'a tech company'}. The name should be diverse and realistic — could be any ethnicity. Return ONLY JSON as {"name":"First Last"}. No titles, no extra text.`,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.5,
        }),
      timeoutMs: 9000,
      maxRetries: 1,
      baseDelayMs: 200,
    });

    const parsed = safeJsonParse(completion.choices?.[0]?.message?.content || '{}');
    const name = String(parsed?.name || '').trim();
    if (!name || name.split(/\s+/).length < 2) return pickFallbackInterviewerName();
    return name;
  } catch {
    return pickFallbackInterviewerName();
  }
}

export function getResumeProjectPrompt(_resumeContext) {
  return 'Tell me about one project from your resume that you are most proud of. What problem were you solving, and what was your specific contribution?';
}

export function getTopSkillPrompt(_resumeContext) {
  return 'Which technical skill mentioned in your resume are you most confident in, and where have you applied it practically?';
}

export function buildHrResponseSnippet(candidateQuestion = '', company = '') {
  const q = String(candidateQuestion || '').trim();
  if (!q) {
    return `That's a great question! In ${company}, we look for learning agility, ownership, and clear communication during the early months.`;
  }

  if (/team|culture|work environment|manager/i.test(q)) {
    return `That's a great question! The team culture is collaborative and feedback-driven, and new hires receive strong mentorship from peers and leads.`;
  }

  if (/growth|learn|career|promotion|roadmap/i.test(q)) {
    return `That's a great question! We set clear growth goals, run regular feedback check-ins, and provide opportunities to take increasing ownership.`;
  }

  if (/tech|stack|project|role|responsibilit/i.test(q)) {
    return `That's a great question! The role involves shipping real features end-to-end, collaborating closely with engineers, and learning production best practices.`;
  }

  return `That's a great question! We value curiosity, structured problem-solving, and communication, and we support freshers with onboarding and guidance.`;
}

export function getFresherScriptedQuestion(questionNumber, company, resumeContext, userAnswer = '') {
  if (questionNumber === 2) return getResumeProjectPrompt(resumeContext);
  if (questionNumber === 3) return getTopSkillPrompt(resumeContext);
  if (questionNumber === 4) return 'So tell me — when you think about OOP, what are the key concepts that come to mind? And have you actually used any of these in something you\'ve built?';
  if (questionNumber === 5) return 'I\'m curious how you\'d compare an interface and an abstract class. When would you typically pick one over the other?';
  if (questionNumber === 6) return 'When you\'re working with SQL, how do primary keys and foreign keys actually differ in practice?';
  if (questionNumber === 7) return 'Can you walk me through why database normalization is useful? What exact problem does it solve when you\'re designing tables?';
  if (questionNumber === 8) return 'I\'m curious, which programming language do you usually prefer for problem solving? What makes it strong for you personally?';
  if (questionNumber === 9) return 'How would you explain the difference between GET and POST in HTTP? When would you use each one?';
  if (questionNumber === 10) return 'Can you explain the difference between a process and a thread using a practical example you\'ve come across?';
  if (questionNumber === 11) return 'Tell me about one fundamental data structure you feel really comfortable with. When would you typically use it?';
  if (questionNumber === 12) return 'So before we wrap up — do you have any questions for me about the role, the team, or what it\'s like working here?';
  if (questionNumber === 13) {
    const snippet = buildHrResponseSnippet(userAnswer, company);
    return `${snippet} Are there any other questions you have before we finish up today?`;
  }
  return '';
}

export function getFresherQuestionTopic(questionNumber) {
  if (questionNumber === 2) return 'Resume project deep-dive';
  if (questionNumber === 3) return 'Top technical skill from resume';
  if (questionNumber === 4) return 'OOP fundamentals with examples';
  if (questionNumber === 5) return 'Interface vs abstract class';
  if (questionNumber === 6) return 'Primary key vs foreign key';
  if (questionNumber === 7) return 'Database normalization';
  if (questionNumber === 8) return 'Preferred language strengths';
  if (questionNumber === 9) return 'HTTP GET vs POST';
  if (questionNumber === 10) return 'Process vs thread';
  if (questionNumber === 11) return 'Fundamental data structures';
  return '';
}

export function getFresherFallbackQuestion(questionNumber, company, resumeContext, userAnswer = '') {
  if (questionNumber === 2) return getResumeProjectPrompt(resumeContext);
  if (questionNumber === 3) return 'Which technical skill from your resume are you most comfortable talking about? How have you actually used it in practice?';
  if (questionNumber === 4) return 'I\'d love to hear how you think about OOP principles. Can you explain them using one of your own projects as an example?';
  if (questionNumber === 5) return 'If you were looking at a real codebase, how would you distinguish an interface from an abstract class?';
  if (questionNumber === 6) return 'When you\'re designing tables in SQL, how do primary keys and foreign keys actually work together?';
  if (questionNumber === 7) return 'Why do developers usually normalize databases? What specific issue does it help us avoid?';
  if (questionNumber === 8) return 'What programming language do you usually reach for, and why do you find it helps you solve problems well?';
  if (questionNumber === 9) return 'I\'m curious how you distinguish between GET and POST in HTTP. When would you definitely choose one over the other?';
  if (questionNumber === 10) return 'Could you explain process versus thread with a simple, practical example from your own understanding?';
  if (questionNumber === 11) return 'Can you walk me through one data structure you\'re fairly comfortable with? When is it most useful?';
  if (questionNumber === 12) return 'So before we wrap up, do you have any questions for me about the role or the team?';
  if (questionNumber === 13) {
    const snippet = buildHrResponseSnippet(userAnswer, company);
    return `${snippet} Do you have any final questions before we wrap up?`;
  }

  return '';
}

export async function generateFresherScriptedQuestion(questionNumber, company, resumeContext, userAnswer = '') {
  const topic = getFresherQuestionTopic(questionNumber);
  if (!topic) return getFresherScriptedQuestion(questionNumber, company, resumeContext, userAnswer);

  const resumePrompt = formatResumeContext(resumeContext);
  const runSeed = `${Date.now()}-${crypto.randomInt(1e9)}`;
  const topicAngles = {
    2: [
      'Ask about the most impactful project and the candidate\'s exact role.',
      'Focus on what problem the project solved and how it was built.',
      'Ask for the architecture/implementation story behind one resume project.',
    ],
    3: [
      'Ask how the skill was used in a real project or assignment.',
      'Ask why they consider it their strongest skill and how they proved it.',
      'Ask for one example where that skill helped them solve a problem.',
    ],
    4: [
      'Ask for the four principles and one example from their own work.',
      'Ask them to explain OOP using a simple project scenario.',
      'Ask how OOP helps them organize code in practice.',
    ],
    5: [
      'Ask for the core difference and one practical use case for each.',
      'Ask when they would choose one over the other in a project.',
      'Ask them to compare both using a coding example.',
    ],
    6: [
      'Ask what each key does in a database table design.',
      'Ask how primary and foreign keys help relate tables.',
      'Ask for a practical example of using both keys together.',
    ],
    7: [
      'Ask why normalization matters for data consistency.',
      'Ask what issue normalization solves in a database schema.',
      'Ask how they would explain normalization in simple terms.',
    ],
    8: [
      'Ask which language they prefer and why it fits their problem-solving style.',
      'Ask what makes their preferred language practical for coding tasks.',
      'Ask how they would describe the strengths of their favorite language.',
    ],
    9: [
      'Ask the difference between GET and POST with a real API example.',
      'Ask when they would choose GET over POST and why.',
      'Ask how request semantics differ between GET and POST.',
    ],
    10: [
      'Ask for a practical example that shows process vs thread.',
      'Ask how a process and a thread differ in execution and memory.',
      'Ask why the distinction matters in real systems.',
    ],
    11: [
      'Ask them to explain one data structure they know well and when to use it.',
      'Ask how they would choose between different data structures for a problem.',
      'Ask for a practical example where they used a specific data structure.',
    ],
  };
  const chosenAngleList = topicAngles[questionNumber] || [];
  const chosenAngle = chosenAngleList.length > 0
    ? chosenAngleList[crypto.randomInt(chosenAngleList.length)]
    : 'Ask the topic naturally and keep it fresher-friendly.';

  const styleHints = [
    'Keep it natural, warm, and concise.',
    'Make it sound like a real HR interviewer on a video call.',
    'Do not repeat the exact same wording used in previous runs.',
    'Ask only one focused question.',
  ];

  const userPrompt = `
Generate the next fresher interview question for question ${questionNumber} of 12 at ${company}.

Topic: ${topic}
Angle to use this run: ${chosenAngle}
Run seed: ${runSeed}
${resumePrompt}

Requirements:
- Keep the question to 1-2 sentences max.
- Preserve the topic exactly, but vary the wording each interview.
- Use the angle above, but paraphrase it naturally.
- For resume-based topics, ask about the candidate's resume/project/skill in a conversational way.
- For fundamentals topics, ask a clear fresher-friendly question with a practical angle.
- Do not mention that you are generating a question.
- Return ONLY JSON: {"question":"..."}

${styleHints.join('\n')}
`;

  try {
    const completion = await aiCallWithRetry({
      operation: () =>
        groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'You generate concise, realistic fresher interview questions. Return only JSON.',
            },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.9,
        }),
      timeoutMs: 10000,
      maxRetries: 1,
      baseDelayMs: 200,
    });

    const parsed = safeJsonParse(completion.choices?.[0]?.message?.content || '{}');
    const question = String(parsed?.question || '').trim();
    if (question) return question;
  } catch {
    // fall through to the deterministic backup below
  }

  return getFresherFallbackQuestion(questionNumber, company, resumeContext, userAnswer);
}

export function isFinalNoAnswer(userAnswer = '') {
  const normalized = String(userAnswer || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) return false;

  const directNoPatterns = [
    'no',
    'nope',
    'nah',
    'none',
    'nothing',
    'no questions',
    'no more questions',
    'not really',
    'thats all',
    'that is all',
    'all good',
    'no thats all',
    'no that is all',
    'no thanks',
    'no thank you'
  ];

  if (directNoPatterns.some((pattern) => normalized === pattern)) {
    return true;
  }

  if (normalized.startsWith('no ') || normalized.startsWith('nah ') || normalized.startsWith('nope ')) {
    return true;
  }

  return /\b(no|none|nothing|no questions|no more questions|not really|that(?: is|'s)? all)\b/.test(normalized);
}

// ─── Enhanced Interviewer Persona System ───
export const getInterviewerPersona = (company, role, stage, difficulty, questionNumber, totalQuestions, advancedOptions = {}, resumeContext = null, experienceLevel = 'fresher') => {
  const category = getCompanyCategory(company);
  const persona = PERSONA_PROFILES[category] || PERSONA_PROFILES.general;
  const normalizedAdvanced = normalizeAdvancedOptions(advancedOptions);
  const resumePrompt = formatResumeContext(resumeContext);
  const resumeModeInstruction = normalizedAdvanced.resumeInterviewMode === 'walkthrough'
    ? 'If resume context is available, begin by walking through the candidate resume journey chronologically before drilling down.'
    : normalizedAdvanced.resumeInterviewMode === 'project-deep-dive'
      ? 'If resume context is available, prioritize deep technical drilling on one standout project before broadening out.'
      : 'Use a balanced mix of resume walkthrough and project-specific probing when resume context is available.';

  const intensityInstruction = normalizedAdvanced.interviewerIntensity === 'supportive'
    ? 'Keep pressure low. Encourage frequently, give confidence-building nudges, and avoid overly aggressive challenge prompts.'
    : normalizedAdvanced.interviewerIntensity === 'challenging'
      ? 'Increase rigor. Ask sharper follow-ups, challenge vague claims, and require explicit trade-offs or constraints.'
      : 'Keep a balanced interview tone with challenge + support in equal measure.';

  const followUpDepthInstruction = normalizedAdvanced.followUpDepth === 'deep'
    ? 'Ask deeper second-order follow-ups: edge cases, scale limits, failure modes, and alternatives before moving on.'
    : 'Use one direct follow-up per answer, then progress naturally.';

  const paceInstruction = normalizedAdvanced.answerPace === 'slow'
    ? 'Speak and pace questions more gently. Give room for thinking.'
    : normalizedAdvanced.answerPace === 'fast'
      ? 'Keep momentum high with concise prompts and quick transitions.'
      : 'Maintain a moderate conversational pace.';

  const topicInstruction = normalizedAdvanced.focusTopics.length > 0
    ? `Prioritize these candidate-selected focus topics whenever relevant: ${normalizedAdvanced.focusTopics.join(', ')}.`
    : 'No special focus topics selected; use standard stage coverage.';

  const realInterviewerInstruction = normalizedAdvanced.realInterviewerMode
    ? 'Operate like a real onsite interviewer: ask one focused question at a time, avoid over-helping, and only provide hints when explicitly requested.'
    : 'You may use a coaching tone when it helps confidence and learning momentum.';

  const normalizedExperience = String(experienceLevel || '').toLowerCase();
  const candidateContext = normalizedExperience === 'experienced'
    ? `The candidate is an EXPERIENCED professional.\n- Assume real production/project ownership and ask depth on architecture, trade-offs, failures, and impact metrics.\n- Probe resume-backed decisions, scale, and team collaboration across delivered work.\n- Keep standards higher on practical judgment and execution details.`
    : `The candidate is most likely a STUDENT or RECENT GRADUATE preparing for campus placements or their first job.\n- They may have LIMITED or NO professional work experience.\n- Their experience comes from: college projects, hackathons, internships, coursework, open-source contributions, personal side projects, competitive programming, or academic research.\n- They might be nervous — this could be one of their first mock interviews.\n- Frame questions around their LEARNING journey, not their professional career.\n- NEVER assume they have had a full-time job before. Use "project" or "experience" instead of "at work" or "in production".`;

  return `
You are a senior interviewer at ${company} conducting a ${stage} round interview for a ${role} position.
Difficulty level: ${difficulty}. This is question ${questionNumber} of ${totalQuestions}.

## IMPORTANT — Candidate Context
${candidateContext}

## Your Interviewer Profile
- **Role**: ${persona.name} at ${company}
- **Style**: ${persona.style}
- **Personality**: ${persona.description}

## Advanced Session Controls
- Interviewer intensity: ${normalizedAdvanced.interviewerIntensity}
- Follow-up depth: ${normalizedAdvanced.followUpDepth}
- Pacing preference: ${normalizedAdvanced.answerPace}
- Real interviewer mode: ${normalizedAdvanced.realInterviewerMode ? 'enabled' : 'disabled'}
- Resume interview mode: ${normalizedAdvanced.resumeInterviewMode}
- Focus topics: ${normalizedAdvanced.focusTopics.length > 0 ? normalizedAdvanced.focusTopics.join(', ') : 'None'}
- ${intensityInstruction}
- ${followUpDepthInstruction}
- ${paceInstruction}
- ${realInterviewerInstruction}
- ${resumeModeInstruction}
- ${topicInstruction}
${resumePrompt}

## Engagement Rules - STRICT
- **BE EXTREMELY CONVERSATIONAL AND HUMAN.** Speak like a friendly senior on a video call, not a corporate robot.
- **LIMIT RESPONSES TO 1-3 SENTENCES MAX.** Brevity is critical. Do not give long monologues.
- **SOUND INTELLIGENT AND INSIGHTFUL.** Your questions should demonstrate deep domain expertise. Reference real-world engineering practices, industry trends, and practical scenarios from companies like ${company}.
- **ASK SMART CONTEXTUAL FOLLOW-UPS.** You MUST explicitly reference specific words, tools, or approaches the candidate just mentioned. Do not just ask a generic follow-up. For example: "You mentioned using Redis for caching — what specific eviction policy did you choose?" or "I see you used React context for state — why didn't you use Redux or Zustand?"
- **SHOW INTELLECTUAL CURIOSITY.** React with genuine interest: "Oh interesting, so you're saying...", "That's a clever approach — have you considered...", "I like that thinking. What about..."
- Be SUPPORTIVE and ENCOURAGING — treat this like a mentorship conversation, not an interrogation.
- If real interviewer mode is enabled, keep encouragement short and professional; do not provide unsolicited coaching or model answers.
- React naturally, referencing SPECIFIC things the candidate said. Say things like "Smart approach!", "That's a great insight", "Ah, I see where you're going with this", or "Nice, that's exactly how we'd think about it at ${company}."
- If the candidate seems nervous or gives a short answer, gently encourage them: "No worries, take your time" or "That's a great start — what if I give you a specific scenario to think through?"
- NEVER use robotic transition phrases like "Moving on to my next question" or "Thank you for that detailed answer."
- Keep language realistic for live interviews: no emojis, no dramatic hype, no motivational speeches.
- ${persona.followUpStyle}
- ${persona.challengeMode}
- When the candidate does well: show genuine, brief enthusiasm that acknowledges their insight ("That's a really mature understanding of the trade-offs!").
- When they struggle: be kind and supportive, guide them with smart hints. Say things like "Think about what data structure gives you O(1) lookups" or "Consider the CAP theorem here."
- Build on previous answers — create a flowing, intellectually stimulating conversation.

## Interview Flow
${questionNumber === 1 ? `- OPENING: Greet briefly and professionally. Example: "Hi, I'm [Name] from ${company}. Let's get started." Then ask your first question immediately.` : ''}
${questionNumber === totalQuestions ? `- FINAL QUESTION: Signal this casually and warmly: "Awesome, just one last question and we're done — you're doing great!"` : ''}
${questionNumber > 1 && questionNumber < totalQuestions ? `- Transition naturally from the previous answer. Keep it feeling like an ongoing chat.` : ''}

## Stage-Specific Guidelines — FOLLOW STRICTLY
${stage === 'Technical' ? `- Ask general technical knowledge questions: OOP concepts, databases, networking, OS, design patterns, language fundamentals
- Frame questions around what they've LEARNED: "What did you learn about [topic] in your coursework?" or "Have you used [concept] in any project?"
- ${category === 'faang' ? 'Probe for understanding of fundamentals, then gradually go deeper.' : ''}
- ${category === 'big4' ? 'Focus on problem-solving approach and structured thinking.' : ''}
- ${category === 'indian_it' ? 'Test core CS fundamentals: OOPS, DBMS, OS, SQL, networking — the kind asked in campus placements.' : ''}
- DO NOT ask behavioral or HR-style questions` : ''}
${stage === 'DSA / Coding' ? `- Ask DATA STRUCTURES AND ALGORITHMS coding problems ONLY
- Present a coding problem with clear constraints (input size, expected complexity)
- Topics: arrays, strings, linked lists, trees, graphs, DP, sorting, searching, recursion, greedy
- Ask about time/space complexity
- ${category === 'faang' ? 'Leetcode medium-to-hard. Expect optimal Big-O. Ask about edge cases.' : ''}
- ${category === 'indian_it' ? 'Leetcode easy-to-medium. Basic DS: arrays, strings, stacks, queues, trees.' : ''}
- ${category === 'startup' ? 'Practical coding. Focus on clean code and working solutions.' : ''}
- If student is stuck, offer a gentle hint like "What data structure comes to mind for fast lookups?"
- DO NOT ask behavioral, HR, or system design questions. ONLY coding/algorithm problems.` : ''}
${stage === 'System Design' ? `- Ask system design questions relevant to ${company}'s domain
- Start with requirements, then high-level architecture, then deep dive
- Keep in mind the candidate is a student — start simple and build up
- Probe trade-offs, scaling ideas, database choices
- ${category === 'faang' ? 'Component design, data models, API design. Guide them if they get stuck.' : ''}
- ${category === 'startup' ? 'MVP design, practical architecture, iteration speed.' : ''}
- DO NOT ask coding/DSA or behavioral questions. ONLY system design.` : ''}
${stage === 'HR' ? `- Ask ONLY culture-fit, motivation, and personal questions appropriate for a STUDENT/FRESHER
- Examples: "Tell me about yourself — what are you studying and what excites you about tech?", "Why ${company}?", "Where do you see yourself in 3-5 years?", "What kind of work environment do you thrive in?"
- Ask about: college life, favorite subjects, career aspirations, what they want to learn, hobbies, extracurriculars
- DO NOT ask about salary expectations, current role, or reasons for leaving — they're students!
- ${category === 'big4' ? 'Assess communication skills, curiosity, and willingness to learn.' : ''}
- ${category === 'startup' ? 'Ownership mentality, learning agility, passion for building things.' : ''}
- Be warm, conversational, and genuinely interested in them as a person
- ⚠️ DO NOT ask ANY technical, coding, DSA, or system design questions. STRICTLY HR.` : ''}
${stage === 'Behavioral' ? `- Ask ONLY behavioral/situational questions using STAR method, but framed for STUDENTS
- Examples: "Tell me about a challenging group project in college", "Describe a hackathon or competition you participated in", "Tell me about a time you had to learn something new very quickly for a deadline"
- ${category === 'faang' ? 'Ownership, taking initiative, learning from failure — framed around academic/project experiences.' : ''}
- ${category === 'big4' ? 'Teamwork, communication, handling pressure during exams or project deadlines.' : ''}
- Probe for specifics: "What was YOUR role in the team?", "What did you learn from that?"
- ⚠️ DO NOT ask technical, coding, or DSA questions. STRICTLY behavioral.` : ''}
${stage === 'OA' ? `- Simulate online assessment: coding/aptitude problems
- Clear problem statements with input/output examples
- Focus on problem-solving, logic, code correctness` : ''}
${stage === 'Managerial' ? `- For students: focus on leadership in college activities, event organization, team coordination
- Decision-making, prioritization in academic/project settings
- Mix of behavioral and high-level technical judgment` : ''}
`;
};

// ─── Adaptive Difficulty Engine ───
export function getCompanyChallengeProfile(company = '', stage = '') {
  const id = String(company || '').toLowerCase();
  const isFaang = ['google', 'amazon', 'meta', 'microsoft', 'apple', 'netflix'].includes(id);
  const isStartup = ['flipkart', 'paytm', 'swiggy', 'zomato', 'razorpay', 'cred', 'meesho'].includes(id);
  const isBig4 = ['deloitte', 'kpmg', 'ey', 'pwc'].includes(id);
  const isIndianIT = ['tcs', 'infosys', 'wipro', 'hcl', 'techmahindra', 'cognizant'].includes(id);

  if (isFaang) {
    return {
      highThreshold: 78,
      lowThreshold: 58,
      styleNote: 'FAANG-style rigor: push depth early and probe trade-offs aggressively.',
    };
  }

  if (isStartup) {
    return {
      highThreshold: 74,
      lowThreshold: 56,
      styleNote: 'Startup-style pragmatism: prioritize shipping decisions, constraints, and impact.',
    };
  }

  if (isBig4) {
    return {
      highThreshold: 76,
      lowThreshold: 57,
      styleNote: 'Consulting-style structure: reward clarity and framework-based thinking.',
    };
  }

  if (isIndianIT) {
    return {
      highThreshold: 72,
      lowThreshold: 54,
      styleNote: 'Fundamentals-first interview bar: reinforce core concepts before advanced probing.',
    };
  }

  if (String(stage || '').toLowerCase().includes('hr') || String(stage || '').toLowerCase().includes('behavioral')) {
    return {
      highThreshold: 70,
      lowThreshold: 52,
      styleNote: 'People-focused round: prioritize clarity, ownership, and concrete examples.',
    };
  }

  return {
    highThreshold: 75,
    lowThreshold: 55,
    styleNote: 'Balanced interview curve: calibrate pressure based on response quality.',
  };
}

export function getAdaptiveDifficultyPrompt(lastScore, averageScore, cumulativeScores, company = '', stage = '') {
  if (!lastScore && !averageScore) return '';

  const trend = cumulativeScores && cumulativeScores.length >= 2
    ? (cumulativeScores[cumulativeScores.length - 1] - cumulativeScores[cumulativeScores.length - 2])
    : 0;
  const profile = getCompanyChallengeProfile(company, stage);
  const highThreshold = profile.highThreshold;
  const lowThreshold = profile.lowThreshold;

  let adaptiveInstruction = '\n## Adaptive Difficulty (IMPORTANT)\n';
  adaptiveInstruction += `Company challenge profile: ${profile.styleNote}\n`;

  if (averageScore >= highThreshold || lastScore >= highThreshold + 5) {
    adaptiveInstruction += `The candidate is performing EXCELLENTLY (last: ${lastScore}/100, avg: ${averageScore}/100, trend: ${trend > 0 ? 'improving' : 'stable'}).
- INCREASE difficulty significantly. Ask harder, more nuanced questions.
- Probe for edge cases, system-level thinking, and trade-off analysis.
- Challenge assumptions. Push for optimal solutions.
- Set "difficultyLevel": "hard", "adaptiveNote": brief explanation of why you're increasing difficulty.`;
  } else if (averageScore >= lowThreshold + 5 || lastScore >= lowThreshold + 5) {
    adaptiveInstruction += `The candidate is performing MODERATELY (last: ${lastScore}/100, avg: ${averageScore}/100, trend: ${trend > 0 ? 'improving' : trend < 0 ? 'declining' : 'stable'}).
- Keep difficulty STEADY at current level.
- Ask clarifying follow-ups that test depth on the same topic.
- If trend is improving, slightly increase complexity.
- Set "difficultyLevel": "medium", "adaptiveNote": brief explanation.`;
  } else {
    adaptiveInstruction += `The candidate is STRUGGLING (last: ${lastScore}/100, avg: ${averageScore}/100).
- DECREASE difficulty. Ask simpler, more foundational questions.
- Give a gentle hint or framework before asking.
- Build confidence — acknowledge what they got right before probing further.
- Set "difficultyLevel": "easy", "adaptiveNote": brief explanation of how you're adjusting.`;
  }

  return adaptiveInstruction;
}

export function buildInterviewMemoryPrompt(conversationHistory = [], previousQuestion = '', userAnswer = '') {
  const recentTurns = Array.isArray(conversationHistory) ? conversationHistory.slice(-6) : [];
  const recentCandidate = recentTurns.filter((t) => t.role === 'candidate').slice(-2);
  const recentFeedback = recentTurns.filter((t) => t.role === 'feedback').slice(-2);

  const candidateSummaries = recentCandidate.map((t, idx) => `Candidate_${idx + 1}: ${String(t.content || '').slice(0, 180)}`);
  const feedbackSummaries = recentFeedback.map((t, idx) => `Feedback_${idx + 1}: strengths=${(t.strengths || []).join(', ') || 'n/a'}; improvements=${(t.improvements || []).join(', ') || 'n/a'}`);

  return `

## Interview Continuity Memory
- Previous question: ${String(previousQuestion || '').slice(0, 220) || 'n/a'}
- Latest answer snapshot: ${String(userAnswer || '').slice(0, 220) || 'n/a'}
${candidateSummaries.length > 0 ? `- Recent candidate turns:\n${candidateSummaries.join('\n')}` : '- Recent candidate turns: n/a'}
${feedbackSummaries.length > 0 ? `- Recent coaching feedback:\n${feedbackSummaries.join('\n')}` : '- Recent coaching feedback: n/a'}

Memory usage rules:
- Reference exactly one specific detail from recent context when asking the next question.
- Do not repeat the same probe category twice in a row unless the candidate still missed it.
- If recent feedback flagged an improvement area, prioritize it in the next follow-up.
`;
}

export function buildFocusSignal(previousQuestion = '', userAnswer = '') {
  const questionText = String(previousQuestion || '').toLowerCase();
  const answerText = String(userAnswer || '').toLowerCase().trim();
  const answerWords = answerText.split(/\s+/).filter(Boolean);

  if (!answerText) {
    return {
      label: 'empty',
      note: 'Candidate did not provide an answer. Ask a simpler re-entry question and offer one concrete prompt.',
    };
  }

  if (answerWords.length < 14) {
    return {
      label: 'under-answered',
      note: 'Candidate answer is too short. Ask one focused probing follow-up with a gentle cue.',
    };
  }

  const questionKeywords = new Set(
    questionText
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 5)
  );

  const answerKeywords = new Set(
    answerText
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 5)
  );

  const overlap = [...questionKeywords].filter((w) => answerKeywords.has(w)).length;
  const overlapRatio = questionKeywords.size > 0 ? overlap / questionKeywords.size : 1;

  if (answerWords.length > 180) {
    return {
      label: 'over-verbose',
      note: 'Candidate answer is too long. Politely interrupt and narrow to one concrete aspect.',
    };
  }

  if (overlapRatio < 0.12) {
    return {
      label: 'possibly-off-topic',
      note: 'Candidate may be drifting from the question. Refocus to original prompt with one concise clarifier.',
    };
  }

  return {
    label: 'on-track',
    note: 'Candidate is broadly on track. Continue natural probing.',
  };
}

// Backwards-compatible underscore-prefixed aliases (some modules import legacy names)
export const _COMPANY_CATEGORIES = COMPANY_CATEGORIES;
export const _getCompanyCategory = getCompanyCategory;
export const _PERSONA_PROFILES = PERSONA_PROFILES;
export const _DEFAULT_ADVANCED_OPTIONS = DEFAULT_ADVANCED_OPTIONS;
export const _INTERVIEW_RUNTIME_MODES = INTERVIEW_RUNTIME_MODES;
export const _MAX_HISTORY_TURNS = MAX_HISTORY_TURNS;
export const _truncateConversationHistory = truncateConversationHistory;
export const _deterministicScore = deterministicScore;
export const _deterministicPick = deterministicPick;
export const _safeDeleteUploadFile = safeDeleteUploadFile;
export const _safeJsonParse = safeJsonParse;
export const _UPLOAD_DIR = UPLOAD_DIR;
export const _upload = upload;
export const _STAGE_ALIASES = STAGE_ALIASES;
export const _resolveInterviewStage = resolveInterviewStage;
export const _resolveResumeInterviewModeForExperience = resolveResumeInterviewModeForExperience;
export const _normalizeAdvancedOptions = normalizeAdvancedOptions;
export const _formatResumeContext = formatResumeContext;
export const _HR_CLOSING_MESSAGE = HR_CLOSING_MESSAGE;
export const _STATIC_INTERVIEW_QUESTIONS = STATIC_INTERVIEW_QUESTIONS;
export const _STATIC_INTERVIEW_CLOSINGS = STATIC_INTERVIEW_CLOSINGS;
export const _FRESHER_HR_FIXED = FRESHER_HR_FIXED;
export const _FRESHER_HR_TOPICS = FRESHER_HR_TOPICS;
export const _FRESHER_HR_CLOSINGS = FRESHER_HR_CLOSINGS;
export const _FRESHER_TECHNICAL_FIXED = FRESHER_TECHNICAL_FIXED;
export const _FRESHER_TECHNICAL_TOPICS = FRESHER_TECHNICAL_TOPICS;
export const _getStaticInterviewQuestions = getStaticInterviewQuestions;
export const _getStaticInterviewQuestion = getStaticInterviewQuestion;
export const _getStaticInterviewClosing = getStaticInterviewClosing;
export const _getFresherTechnicalQuestion = getFresherTechnicalQuestion;
export const _getFresherHRQuestion = getFresherHRQuestion;
export const _getFresherTechnicalAIPrompt = getFresherTechnicalAIPrompt;
export const _getFresherHRAIPrompt = getFresherHRAIPrompt;
export const _getFresherHRClosing = getFresherHRClosing;
export const _INTERVIEWER_NAMES = INTERVIEWER_NAMES;
export const _pickFallbackInterviewerName = pickFallbackInterviewerName;
export const _getResumeProjectPrompt = getResumeProjectPrompt;
export const _getTopSkillPrompt = getTopSkillPrompt;
export const _buildHrResponseSnippet = buildHrResponseSnippet;
export const _getFresherScriptedQuestion = getFresherScriptedQuestion;
export const _getFresherQuestionTopic = getFresherQuestionTopic;
export const _getFresherFallbackQuestion = getFresherFallbackQuestion;
export const _isFinalNoAnswer = isFinalNoAnswer;
export const _getInterviewerPersona = getInterviewerPersona;
export const _getCompanyChallengeProfile = getCompanyChallengeProfile;
export const _getAdaptiveDifficultyPrompt = getAdaptiveDifficultyPrompt;
export const _buildInterviewMemoryPrompt = buildInterviewMemoryPrompt;
export const _buildFocusSignal = buildFocusSignal;
export const _normalizeInterviewRuntimeMode = normalizeInterviewRuntimeMode;
export const _buildInterviewRuntime = buildInterviewRuntime;
export const _FRESHER_INTERVIEW_TOTAL_QUESTIONS = FRESHER_INTERVIEW_TOTAL_QUESTIONS;

