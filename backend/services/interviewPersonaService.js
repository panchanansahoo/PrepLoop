// ─── JSON parser (markdown-aware) ───
import crypto from 'crypto';

export function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    const fenced = text?.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced?.[1]) {
      try { return JSON.parse(fenced[1].trim()); } catch { /* fall through */ }
    }
    return null;
  }
}

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

// ─── Default Options & Runtime ───

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

// ─── Stage Resolution ───

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

// ─── Advanced Options Normalization ───

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

// ─── Resume Context Formatting ───

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

// ─── Interviewer Persona Builder ───

export function getInterviewerPersona(company, role, stage, difficulty, questionNumber, totalQuestions, advancedOptions = {}, resumeContext = null, experienceLevel = 'fresher') {
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
- **ASK SMART FOLLOW-UPS.** Don't accept surface-level answers. Probe with incisive questions: "What would happen if the load doubled?", "How would you handle the failure case?", "What's the trade-off between these two approaches?"
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
}

// ─── Static Interview Questions & Closings ───

export const HR_CLOSING_MESSAGE = 'Thank you for your time today. It was a pleasure getting to know you and your background. We will review everything and our recruitment team will be in touch with you shortly. Have a great day!';

export const STATIC_INTERVIEW_QUESTIONS = {
  HR: [
    'Good afternoon, my name is Abhishek Sen, I work as an HR executive with Wipro, and I\'ll be conducting your HR discussion today. We\'ll mainly talk about your background, your interests, and see how you fit with our organisation. To begin with, could you introduce yourself and walk me through your background?',
    'What attracted you to this role and to our company in particular?',
    'Can you tell me about a project or achievement that you\'re most proud of, and why?',
    'Describe a time when you faced a difficult problem or challenge. How did you handle it?',
    'Tell me about a time you had to work closely with someone whose working style was very different from yours.',
    'How do you usually handle stress or pressure, for example during exams, deadlines, or multiple tasks?',
    'What are your key strengths, and how will they help you succeed in this role?',
    'What is one area you\'re actively trying to improve, and what are you doing about it?',
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

import { aiCallWithRetry } from '../utils/aiClient.js';

// ─── Interviewer Name Generation ───

export const INTERVIEWER_NAMES = [
  'Abhishek Sen',
  'Riya Sharma',
  'Ananya Rao',
  'Neha Kapoor',
  'Rahul Verma',
  'Karan Malhotra',
  'Priya Nair',
  'Arjun Mehta',
  'Sanya Gupta',
  'Vikram Iyer',
];

export function pickFallbackInterviewerName() {
  return INTERVIEWER_NAMES[crypto.randomInt(INTERVIEWER_NAMES.length)];
}

export async function generateInterviewerName(company = '', groq = null) {
  if (!groq) return pickFallbackInterviewerName();

  try {
    const completion = await aiCallWithRetry({
      operation: () =>
        groq.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: `Generate one realistic professional Indian HR name for a ${company || 'tech'} interview. Return ONLY JSON as {"name":"First Last"}. No titles, no extra text.`,
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

// ─── Company Challenge Profile ───

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

// ─── Adaptive Difficulty ───

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

// ─── Interview Memory Prompt ───

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

// ─── Focus Signal ───

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
