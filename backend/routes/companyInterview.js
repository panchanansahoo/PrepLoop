import express from 'express';
import Groq from 'groq-sdk';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { authenticateToken } from '../middleware/auth.js';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { aiCallWithRetry } from '../utils/aiClient.js';
import { getRandomQuestionSet, getFilteredQuestions, getQuestionCount } from '../services/companyQuestionService.js';

const router = express.Router();
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

// Multer config for STT audio uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: os.tmpdir(),
    filename: (req, file, cb) => cb(null, `stt_${Date.now()}${path.extname(file.originalname) || '.webm'}`)
  }),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, file.mimetype.startsWith('audio/'));
  }
});

// ─── Company Category Classification ───
const COMPANY_CATEGORIES = {
  big4: ['deloitte', 'kpmg', 'ey', 'pwc'],
  faang: ['google', 'amazon', 'meta', 'microsoft', 'apple', 'netflix'],
  indian_it: ['tcs', 'infosys', 'wipro', 'hcl', 'techmahindra', 'cognizant'],
  startup: ['flipkart', 'paytm', 'swiggy', 'zomato', 'razorpay', 'cred', 'meesho'],
};

function getCompanyCategory(company) {
  const id = company.toLowerCase();
  for (const [cat, list] of Object.entries(COMPANY_CATEGORIES)) {
    if (list.some(c => id.includes(c))) return cat;
  }
  return 'general';
}

// ─── Distinct Interviewer Personas ───
const PERSONA_PROFILES = {
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

const DEFAULT_ADVANCED_OPTIONS = {
  interviewerIntensity: 'balanced',
  followUpDepth: 'standard',
  answerPace: 'balanced',
  realInterviewerMode: false,
  resumeInterviewMode: 'balanced',
  focusTopics: [],
  questionCount: 8,
};

function normalizeAdvancedOptions(input = {}) {
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

  const resumeInterviewMode = ['balanced', 'walkthrough', 'project-deep-dive'].includes(input?.resumeInterviewMode)
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
  const questionCount = Number.isFinite(count) && count >= 4 && count <= 12
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

function formatResumeContext(resumeContext) {
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

// ─── Enhanced Interviewer Persona System ───
const getInterviewerPersona = (company, role, stage, difficulty, questionNumber, totalQuestions, advancedOptions = {}, resumeContext = null) => {
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

  return `
You are a senior interviewer at ${company} conducting a ${stage} round interview for a ${role} position.
Difficulty level: ${difficulty}. This is question ${questionNumber} of ${totalQuestions}.

## IMPORTANT — Candidate Context
The candidate is most likely a STUDENT or RECENT GRADUATE preparing for campus placements or their first job.
- They may have LIMITED or NO professional work experience.
- Their experience comes from: college projects, hackathons, internships, coursework, open-source contributions, personal side projects, competitive programming, or academic research.
- They might be nervous — this could be one of their first mock interviews.
- Frame questions around their LEARNING journey, not their professional career.
- NEVER assume they have had a full-time job before. Use "project" or "experience" instead of "at work" or "in production".

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
};

// ─── Start Interview ───
router.post('/start', authenticateToken, async (req, res) => {
  const {
    company,
    role,
    stage,
    difficulty,
    totalQuestions = 8,
    useRealQuestions = false,
    advancedOptions,
    resumeContext,
  } = req.body;
  const normalizedAdvanced = normalizeAdvancedOptions(advancedOptions);
  const requestedCount = Number(totalQuestions);
  const resolvedTotalQuestions = Number.isFinite(requestedCount) && requestedCount >= 4 && requestedCount <= 12
    ? Math.round(requestedCount)
    : normalizedAdvanced.questionCount;
  const personalizedQuestionSource = resumeContext ? 'resume' : 'ai';

  // If useRealQuestions, pre-load a question set from the company bank
  let questionBank = [];
  let questionSource = 'ai';
  if (useRealQuestions) {
    questionBank = getRandomQuestionSet(company, role, stage, difficulty, resolvedTotalQuestions);
    if (questionBank.length > 0) {
      questionSource = 'database';
      console.log(`📋 Loaded ${questionBank.length} real questions for ${company} (${stage}/${role}/${difficulty})`);
    } else {
      console.log(`⚠️ No real questions found for ${company} ${stage}/${role}/${difficulty}, falling back to AI`);
    }
  }

  try {
    // If we have real questions, use the first one with AI-generated greeting
    if (questionSource === 'database' && questionBank.length > 0) {
      const firstQ = questionBank[0];
      const greeting = `Hi! Welcome to your ${stage} interview at ${company}. I'm excited to get started! Here's your first question:`;
      const questionText = `${greeting}\n\n${firstQ.question}`;

      // If groq is available, generate a natural greeting wrapping the real question
      if (groq) {
        try {
          const completion = await aiCallWithRetry({
            operation: () =>
              groq.chat.completions.create({
                model: 'llama-3.1-8b-instant',
                messages: [
                  {
                    role: 'system',
                    content: `You are a senior interviewer at ${company}. Speak naturally like a real person in a live interview.

Rules:
- One short greeting sentence, then ask this exact interview question.
- Do not alter the core meaning of the question.
- Keep spoken output under 35 words.
- Use contractions where natural. Avoid hype, emojis, and robotic phrases.
- Ask exactly one question.

Question to ask:
"${firstQ.question}"

Respond as JSON:
{
  "question": "Natural spoken greeting + exact question",
  "tips": ["Tip 1", "Tip 2"],
  "thinkTime": 30,
  "interviewerReaction": "greeting"
}`
                  }
                ],
                response_format: { type: 'json_object' },
                temperature: 0.7
              }),
            timeoutMs: 12000,
            maxRetries: 2,
            baseDelayMs: 250,
          });
          const result = JSON.parse(completion.choices[0].message.content);
          return res.json({
            ...result,
            context: { company, role, stage, difficulty, totalQuestions: resolvedTotalQuestions, advancedOptions: normalizedAdvanced },
            thinkTime: result.thinkTime || 30,
            interviewerReaction: 'greeting',
            questionSource: 'database',
            questionMeta: { id: firstQ.id, tags: firstQ.tags, difficulty: firstQ.difficulty, frequencyScore: firstQ.frequencyScore },
            questionBank: questionBank.map(q => q.id), // Send IDs so frontend can track which questions to request
          });
        } catch (e) {
          // Fall through to use raw question
        }
      }

      return res.json({
        question: questionText,
        context: { company, role, stage, difficulty, totalQuestions: resolvedTotalQuestions, advancedOptions: normalizedAdvanced },
        tips: firstQ.hints?.length > 0 ? firstQ.hints : ['Take a moment to collect your thoughts', 'Structure your answer clearly'],
        interviewerReaction: 'greeting',
        thinkTime: 30,
        questionSource: 'database',
        questionMeta: { id: firstQ.id, tags: firstQ.tags, difficulty: firstQ.difficulty, frequencyScore: firstQ.frequencyScore },
        questionBank: questionBank.map(q => q.id),
      });
    }

    if (!groq) {
      // Stage-specific fallback questions
      const fallbackQuestions = {
        'HR': `Hey! Welcome to your HR interview at ${company}. I'm really excited to get to know you! Let's start simple — tell me a bit about yourself, what you're studying, and what excites you about this ${role} role at ${company}?`,
        'Behavioral': `Hey! Welcome to your behavioral interview. I'd love to hear about your experiences. Can you tell me about a challenging project or assignment you worked on — maybe in college or during an internship?`,
        'DSA / Coding': `Hey! Welcome to your coding round. Let's start with a classic problem — given an array of integers, can you walk me through how you'd find two numbers that add up to a target sum? Think about both approach and time complexity.`,
        'System Design': `Hey! Welcome to your system design round at ${company}. Let's start with something fun — how would you design a URL shortening service like bit.ly? Don't worry about getting it perfect, just think out loud!`,
        'Technical': `Hey! Welcome to your technical interview. Let's start — can you explain the difference between a process and a thread? You might have covered this in your OS course!`,
        'OA': `Welcome to your online assessment simulation. Here's your first problem: Given a string, find the length of the longest substring without repeating characters. Take your time to think about your approach.`,
        'Managerial': `Hey! Welcome to the managerial round. I'd like to understand how you work with others. Can you tell me about a time you led or coordinated a team project — maybe in college or a hackathon?`,
      };
      return res.json({
        question: fallbackQuestions[stage] || `Hey! Great to have you here for this ${stage} interview at ${company}. Let's start easy — tell me about a project you've worked on that you're proud of!`,
        context: { company, role, stage, difficulty, totalQuestions: resolvedTotalQuestions, advancedOptions: normalizedAdvanced },
        tips: ['Take a moment to collect your thoughts', 'Structure your answer: context → approach → result'],
        interviewerReaction: 'greeting',
        thinkTime: 30,
        questionSource: personalizedQuestionSource,
      });
    }

    const completion = await aiCallWithRetry({
      operation: () =>
        groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: getInterviewerPersona(company, role, stage, difficulty, 1, resolvedTotalQuestions, normalizedAdvanced, resumeContext) + `

Respond as JSON:
{
  "question": "Your opening greeting + first question (Extremely natural, max 2-3 sentences total)",
  "tips": ["Tip 1", "Tip 2"],
  "thinkTime": 30,
  "interviewerReaction": "greeting"
}`
            },
            { role: 'user', content: `Start the ${stage} interview for ${role} at ${company}. Greet warmly first.` }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.8
        }),
      timeoutMs: 12000,
      maxRetries: 2,
      baseDelayMs: 250,
    });

    const result = JSON.parse(completion.choices[0].message.content);
    res.json({
      ...result,
      context: { company, role, stage, difficulty, totalQuestions: resolvedTotalQuestions, advancedOptions: normalizedAdvanced },
      thinkTime: result.thinkTime || 30,
      interviewerReaction: result.interviewerReaction || 'greeting',
      questionSource: personalizedQuestionSource,
    });
  } catch (error) {
    console.error('Interview start error:', error.message?.substring(0, 200));
    // Graceful fallback — serve stage-specific opening question
    const fallbackQuestions = {
      'HR': `Hey! Welcome to your HR interview at ${company}. I'm really excited to get to know you! Tell me about yourself — what are you studying and what excites you about this ${role} role at ${company}?`,
      'Behavioral': `Hey! Welcome to your behavioral round. I'd love to hear about your experiences. Tell me about a challenging project or assignment you worked on and how you handled it.`,
      'DSA / Coding': `Hey! Welcome to your coding round. Let's start — given an array of integers, how would you find two numbers that add up to a target sum? Walk me through your approach and time complexity.`,
      'System Design': `Hey! Welcome to your system design interview at ${company}. How would you design a URL shortening service? Think about key components and storage — don't worry about getting it perfect!`,
      'Technical': `Hey! Welcome to your technical interview. Let's start — can you explain the difference between a process and a thread? You might remember this from your OS class!`,
      'OA': `Welcome to your online assessment. Your first problem: Given a string, find the length of the longest substring without repeating characters. Take your time to think carefully!`,
      'Managerial': `Hey! Welcome to the managerial round. Tell me about a time you led or coordinated a group project in college. How did you handle it?`,
    };
    res.json({
      question: fallbackQuestions[stage] || `Hey! Great to have you here for this ${stage} interview at ${company}. Tell me about a project you've worked on that you're proud of!`,
      context: { company, role, stage, difficulty, totalQuestions: resolvedTotalQuestions, advancedOptions: normalizedAdvanced },
      tips: ['Take a moment to collect your thoughts', 'Structure your answer clearly'],
      interviewerReaction: 'greeting',
      thinkTime: 30,
      questionSource: personalizedQuestionSource,
    });
  }
});

// ─── Adaptive Difficulty Engine ───
function getCompanyChallengeProfile(company = '', stage = '') {
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

function getAdaptiveDifficultyPrompt(lastScore, averageScore, cumulativeScores, company = '', stage = '') {
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

function buildInterviewMemoryPrompt(conversationHistory = [], previousQuestion = '', userAnswer = '') {
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

function buildFocusSignal(previousQuestion = '', userAnswer = '') {
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

// ─── Follow-up with realistic interviewer behavior ───
router.post('/follow-up', authenticateToken, async (req, res) => {
  const { company, role, stage, difficulty, previousQuestion, userAnswer, conversationHistory, questionNumber = 2, totalQuestions = 8, lastScore, averageScore, cumulativeScores, code, codeLanguage, useRealQuestions = false, questionBankIds, currentQuestionId, advancedOptions, resumeContext } = req.body;
  const normalizedAdvanced = normalizeAdvancedOptions(advancedOptions);
  const personalizedQuestionSource = resumeContext ? 'resume' : 'ai';

  // If using real questions, get the next question from the bank
  let nextRealQuestion = null;
  let realQuestionMeta = null;
  if (useRealQuestions && questionBankIds && questionBankIds.length > 0) {
    const nextIdx = questionNumber - 1; // questionNumber is 1-indexed, and we want the next one
    if (nextIdx < questionBankIds.length) {
      const { getQuestionById } = await import('../services/companyQuestionService.js');
      nextRealQuestion = getQuestionById(questionBankIds[nextIdx]);
      if (nextRealQuestion) {
        realQuestionMeta = { id: nextRealQuestion.id, tags: nextRealQuestion.tags, difficulty: nextRealQuestion.difficulty, frequencyScore: nextRealQuestion.frequencyScore };
      }
    }
  }

  // Get reference answer for current question if available
  let referenceAnswer = null;
  if (useRealQuestions && currentQuestionId) {
    const { getQuestionById: getQ } = await import('../services/companyQuestionService.js');
    const currentQ = getQ(currentQuestionId);
    if (currentQ?.answer) referenceAnswer = currentQ.answer;
  }

  try {
    if (!groq) {
      const reactions = [
        "That's a solid approach! I like how you structured that.",
        "Interesting perspective. Let me dig a bit deeper.",
        "Good thinking! I can see you've worked through problems like this before.",
        "I appreciate the detail there. Let's explore a different angle.",
        "Nice! You covered the key points well.",
        "Great answer! I can tell you have hands-on experience with this.",
        "I like your thought process. Let me push you a bit further."
      ];
      // Diverse follow-ups per stage — rotates based on questionNumber
      const stageQuestions = {
        'Technical': [
          'Can you explain the difference between an abstract class and an interface? When would you pick one over the other?',
          'How does garbage collection work in your preferred language? What are the different algorithms?',
          'What is the difference between concurrency and parallelism? Can you give a real-world example?',
          'Explain how a hash map works internally. What happens during a collision?',
          'What are SOLID principles? Can you walk me through each one with a quick example?',
          'How would you debug a production issue where the application is running slow but CPU usage is normal?',
          'What is the CAP theorem? How does it apply to database selection?',
          'Explain the event loop in Node.js. How does it handle asynchronous operations?',
        ],
        'DSA / Coding': [
          'Given a linked list, how would you detect if it has a cycle? Walk me through your approach.',
          'How would you find the kth largest element in an unsorted array? What data structure helps here?',
          'Explain how you would serialize and deserialize a binary tree. What traversal order would you use?',
          'Given a string of parentheses, how would you check if they are balanced? What about multiple types?',
          'How would you merge two sorted arrays in-place? Think about doing it without extra space.',
          'Describe how you would implement an LRU cache. What data structures would you combine?',
          'How would you find the longest increasing subsequence in an array? Discuss both approaches.',
          'Given a matrix of 0s and 1s, how would you count the number of islands?',
        ],
        'System Design': [
          'How would you design a real-time chat application like WhatsApp? Think about message delivery guarantees.',
          'Walk me through designing a news feed system like Instagram. How would you handle ranking?',
          'How would you design a rate limiter for an API? What algorithms could you use?',
          'Design a notification system that handles millions of users. How do you handle delivery at scale?',
          'How would you design a key-value store like Redis? What about persistence and replication?',
          'Walk me through designing a search autocomplete system. How would you optimize for latency?',
          'How would you design a video streaming platform? Think about CDN and adaptive bitrate.',
          'Design a parking lot system. Start with the object model, then think about scaling.',
        ],
        'Behavioral': [
          'Tell me about a time you worked on a challenging group project in college. How did you handle disagreements?',
          'Describe a hackathon, competition, or event you participated in. What was your role?',
          'Can you share an example where you had to learn something completely new under a tight deadline?',
          'Tell me about a project that didn\'t go as planned. What did you learn from it?',
          'Describe a time when you had to balance multiple assignments or deadlines. How did you prioritize?',
          'Share an experience where you helped a classmate or junior understand something difficult.',
          'Tell me about a time you took initiative on something — maybe a club, project, or side hustle.',
          'Describe how you handled a situation where you were unsure how to approach a problem or assignment.',
        ],
        'HR': [
          'What motivates you to pursue a career in tech? What gets you excited about building things?',
          'Where do you see yourself in 3 to 5 years? How does this role fit into that vision?',
          'What made you choose your branch or field of study? Do you enjoy it?',
          'What kind of work environment do you think you\'d thrive in? Do you prefer working solo or in teams?',
          'Tell me about a value or principle that guides how you work and learn.',
          'What are you most proud of from your time in college — could be academic or extracurricular!',
          'How would your friends or classmates describe you in three words?',
          'What questions do you have for me about the team, the role, or what it\'s like to work at this company?',
        ],
        'Managerial': [
          'Have you ever had to coordinate or lead a team? Maybe a college project, club, or event?',
          'Tell me about a time you had to convince your team to go with your idea. How did you handle it?',
          'How do you keep yourself and your team motivated during a stressful period, like exams or a project deadline?',
          'If you had to organize a technical event or workshop, how would you plan it?',
          'How would you handle a situation where a team member isn\'t contributing fairly in a group project?',
          'What is your approach to managing your time when you have multiple deadlines?',
          'Do you enjoy mentoring juniors? Tell me about a time you helped someone learn something.',
          'Tell me about a tough decision you made — maybe about choosing between two projects, events, or even career options.',
        ],
        'OA': [
          'Given an array of integers, find the contiguous subarray with the maximum sum. Explain your approach.',
          'How would you determine if a string is a valid palindrome, considering only alphanumeric characters?',
          'Write an algorithm to find all permutations of a given string. What is the time complexity?',
          'Given two sorted arrays, find the median of the combined array in O(log n) time.',
          'How would you implement a stack that supports getMin() in O(1) time?',
          'Given a 2D grid, find the shortest path from top-left to bottom-right. What algorithm would you use?',
          'Design an algorithm to rotate a matrix 90 degrees clockwise in-place.',
          'How would you detect a duplicate in an array of n+1 integers where each integer is between 1 and n?',
        ],
      };
      const questions = stageQuestions[stage] || stageQuestions['Technical'];
      const qIdx = ((questionNumber || 1) - 1) % questions.length;
      const isLast = questionNumber >= totalQuestions;

      return res.json({
        feedback: reactions[Math.floor(Math.random() * reactions.length)],
        followUpQuestion: isLast ? '' : (nextRealQuestion ? nextRealQuestion.question : questions[qIdx]),
        closingRemark: isLast ? `Thank you so much for your time today! You've given some really thoughtful answers. We'll be in touch soon with next steps. Best of luck!` : undefined,
        score: 65 + Math.floor(Math.random() * 25),
        strengths: [
          ['Clear communication', 'Structured thinking', 'Good examples'][Math.floor(Math.random() * 3)],
          ['Technical depth', 'Problem-solving mindset', 'Practical approach'][Math.floor(Math.random() * 3)]
        ],
        improvements: [
          ['Add more specific metrics', 'Consider edge cases', 'Discuss trade-offs'][Math.floor(Math.random() * 3)],
          ['Mention real-world experience', 'Think about scalability', 'Explore alternatives'][Math.floor(Math.random() * 3)]
        ],
        interviewerReaction: ['encouraging', 'impressed', 'probing', 'neutral'][Math.floor(Math.random() * 4)],
        thinkTime: 30 + Math.floor(Math.random() * 30),
        hint: ['Think about time vs space trade-offs', 'Consider the edge cases first', 'Try working through a small example', 'What would happen at scale?'][Math.floor(Math.random() * 4)],
        questionSource: nextRealQuestion ? 'database' : personalizedQuestionSource,
        questionMeta: realQuestionMeta || null,
      });
    }

    const isLastQuestion = questionNumber >= totalQuestions;
    const focusSignal = buildFocusSignal(previousQuestion, userAnswer);

    // Build code review context if code was submitted
    const codeContext = code ? `

## Code Submitted by Candidate
Language: ${codeLanguage || 'unknown'}
\`\`\`
${code}
\`\`\`
Evaluate this code as part of your response:
- Correctness: does it solve the problem?
- Time complexity (Big-O)
- Space complexity
- Code quality, readability, edge case handling
- Suggest an optimized version if applicable
Include your evaluation in "codeFeedback" in the JSON response.` : '';

    const adaptivePrompt = getAdaptiveDifficultyPrompt(lastScore, averageScore, cumulativeScores, company, stage);
    const memoryPrompt = buildInterviewMemoryPrompt(conversationHistory, previousQuestion, userAnswer);

    const focusPrompt = `

  ## Candidate Response Focus Signal
  - Signal: ${focusSignal.label}
  - Guidance: ${focusSignal.note}

  If signal is "over-verbose" or "possibly-off-topic":
  - Start with a polite redirect phrase like "Let me pause you there" or "Let's narrow that down".
  - Ask one specific question tied directly to the original prompt.

  If signal is "under-answered" or "empty":
  - Ask one simpler anchor question.
  - Offer one short cue, then stop talking.
  `;

    // Build reference answer context if using real questions
    const referenceContext = referenceAnswer ? `

## Reference Answer (for your evaluation only, DO NOT reveal this to the candidate):
"${referenceAnswer.substring(0, 500)}"
Use this as a benchmark to evaluate the candidate's answer. Score higher if they cover the key points from the reference.` : '';

    // Build real question injection if available
    const realQuestionInstruction = (nextRealQuestion && !isLastQuestion) ? `

## IMPORTANT: Use This Exact Question as Your Follow-Up
You MUST use this question as your follow-up (present it naturally, in your own words, but keep the core question intact):
"${nextRealQuestion.question}"
Do NOT generate a different question. Transitions should be natural.` : '';

    const messages = [
      {
        role: 'system',
        content: getInterviewerPersona(company, role, stage, difficulty, questionNumber, totalQuestions, normalizedAdvanced, resumeContext) + adaptivePrompt + memoryPrompt + codeContext + referenceContext + realQuestionInstruction + `

The candidate just answered a question. You must:
1. React naturally to their answer (say something like "Makes sense", "Got it")
2. Give extremely brief, actionable feedback internally (do not speak the "feedback" block aloud)
3. ${isLastQuestion ? 'This is the LAST answer. Provide a short, warm closing compliment.' : 'Ask a follow-up that digs deeper OR moves to a new topic naturally. Keep the spoken "followUpQuestion" to 1-2 sentences MAX.'}
4. Provide score, strengths, improvements
5. Include a subtle hint for the next question
6. Suggest think time in seconds

IMPORTANT: The "followUpQuestion" and "closingRemark" must sound like a real human speaking on a Zoom call. No robotic transitions. Keep it under 3 sentences.
NATURAL SPEECH CONSTRAINTS:
- No generic filler like "Great question" or "Moving to the next question".
- Do not mention being AI.
- Keep tone professional but conversational.
- Use one focused question, not a list.
- Avoid repeating the candidate's full answer back.
` + focusPrompt + `

Respond as JSON:
{
  "feedback": "Internal evaluation of their answer (2 sentences)",
  "followUpQuestion": "${isLastQuestion ? 'empty string since this is the last question' : 'Your spoken next question (natural, casual, max 2 sentences)'}",
  ${isLastQuestion ? '"closingRemark": "A warm, natural spoken closing thanking them (max 2 sentences)",' : ''}
  "score": 0-100,
  "strengths": ["specific things done well"],
  "improvements": ["specific things to improve"],
  "interviewerReaction": "encouraging|impressed|probing|neutral|challenging",
  "thinkTime": 30-90,
  "hint": "A gentle nudge if stuck (1 sentence)",
  "difficultyLevel": "easy|medium|hard",
  "adaptiveNote": "Brief explanation of difficulty adjustment"${code ? ',\n  "codeFeedback": {"correctness": "pass|fail|partial", "timeComplexity": "O(...)", "spaceComplexity": "O(...)", "quality": 0-10, "issues": ["issue1"], "optimizedApproach": "brief suggestion"}' : ''}
}`
      },
      ...(conversationHistory || []).map(h => ({
        role: h.role === 'interviewer' ? 'assistant' : 'user',
        content: h.content
      })),
      { role: 'assistant', content: previousQuestion },
      { role: 'user', content: code ? `${userAnswer}\n\n[Code submitted in ${codeLanguage || 'unknown'}]:\n${code}` : userAnswer }
    ];

    const completion = await aiCallWithRetry({
      operation: () =>
        groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages,
          response_format: { type: 'json_object' },
          temperature: 0.75
        }),
      timeoutMs: 12000,
      maxRetries: 2,
      baseDelayMs: 250,
    });

    const result = JSON.parse(completion.choices[0].message.content);
    res.json({
      ...result,
      interviewerReaction: result.interviewerReaction || 'neutral',
      thinkTime: result.thinkTime || 45,
      hint: result.hint || 'Try breaking the problem into smaller parts',
      difficultyLevel: result.difficultyLevel || 'medium',
      adaptiveNote: result.adaptiveNote || null,
      codeFeedback: result.codeFeedback || null,
      questionSource: nextRealQuestion ? 'database' : personalizedQuestionSource,
      questionMeta: realQuestionMeta || null,
      referenceAnswer: referenceAnswer || null,
    });
  } catch (error) {
    console.error('Follow-up error:', error.message?.substring(0, 200));
    // Graceful fallback — contextual follow-up
    const fallbackFollowUps = {
      'HR': 'That\'s interesting! Can you tell me about your career goals? Where do you see yourself in a few years after starting your career?',
      'Behavioral': 'Good insight. Can you give me another example where you showed leadership or took initiative — maybe in a college project or extracurricular?',
      'DSA / Coding': 'Nice approach. Now, can you think of a way to optimize that solution? What would the time and space complexity be?',
      'System Design': 'Good thinking. How would your design handle 10x the current traffic? What would you scale first?',
      'Technical': 'Solid answer. Can you explain how this concept applies in a distributed systems context?',
      'OA': 'Good. Here\'s a follow-up: what if the input size was 10 million? How would you optimize?',
      'Managerial': 'Great example. How did you handle any disagreements within the team during that project?',
    };
    res.json({
      feedback: 'That\'s a thoughtful response! I can see you\'ve given this real thought.',
      followUpQuestion: fallbackFollowUps[stage] || 'Can you walk me through how you would optimize that solution? What trade-offs would you consider?',
      score: 72 + Math.floor(Math.random() * 15),
      strengths: ['Clear communication', 'Structured thinking'],
      improvements: ['Add more specific examples', 'Consider edge cases'],
      interviewerReaction: 'encouraging',
      thinkTime: 45,
      hint: 'Try breaking the problem into smaller parts'
    });
  }
});

// ─── Get a hint for current question ───
router.post('/hint', authenticateToken, async (req, res) => {
  const { company, role, stage, currentQuestion, conversationHistory } = req.body;

  try {
    if (!groq) {
      return res.json({
        hint: "Try breaking this down step by step. What's the simplest version you could solve first?",
        approach: "Consider starting with a brute force solution, then optimize.",
        keyTopics: ["Time complexity", "Space-time tradeoff", "Edge cases"]
      });
    }

    const completion = await aiCallWithRetry({
      operation: () =>
        groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `You are a helpful interviewer at ${company}. The candidate is stuck on a ${stage} question for ${role}. 
Give a gentle nudge WITHOUT giving away the answer.

Respond as JSON:
{
  "hint": "A gentle nudge (1-2 sentences)",
  "approach": "Suggested approach without the full answer",
  "keyTopics": ["Topic 1", "Topic 2", "Topic 3"]
}`
            },
            ...(conversationHistory || []).slice(-4).map(h => ({
              role: h.role === 'interviewer' ? 'assistant' : 'user',
              content: h.content
            })),
            { role: 'user', content: `I'm stuck on: "${currentQuestion}". Can you give me a hint?` }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7
        }),
      timeoutMs: 12000,
      maxRetries: 2,
      baseDelayMs: 250,
    });

    const result = JSON.parse(completion.choices[0].message.content);
    res.json(result);
  } catch (error) {
    console.error('Hint error:', error.message);
    res.status(500).json({ error: 'Failed to generate hint' });
  }
});

// ─── Real-time nudge for AICopilot NudgeBar ───
router.post('/nudge', authenticateToken, async (req, res) => {
  const { currentQuestion, partialAnswer, stage, company, role } = req.body;

  try {
    if (!groq || !partialAnswer || partialAnswer.length < 20) {
      return res.json({ nudge: null });
    }

    const completion = await aiCallWithRetry({
      operation: () =>
        groq.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: `You are a real-time interview coach. Based on the candidate's partial answer to a ${stage} question at ${company}, give ONE brief coaching tip (max 15 words). Focus on what they should add or fix RIGHT NOW.
Respond as JSON: { "nudge": "your tip", "type": "structure|depth|confidence|filler|pace" }`
            },
            {
              role: 'user',
              content: `Question: ${currentQuestion}\nPartial answer so far: ${partialAnswer.substring(0, 500)}`
            }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
          max_tokens: 60
        }),
      timeoutMs: 12000,
      maxRetries: 2,
      baseDelayMs: 250,
    });

    const result = JSON.parse(completion.choices[0].message.content);
    res.json(result);
  } catch (error) {
    console.error('Nudge error:', error.message?.substring(0, 100));
    res.json({ nudge: null });
  }
});

// ─── Evaluate overall interview session ───
function clampScore(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function averageScore(values = []) {
  const numericValues = values.map(Number).filter(Number.isFinite);
  if (numericValues.length === 0) return null;
  return Math.round(numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length);
}

function buildSpeechAnalysis(speechHistory = []) {
  if (!Array.isArray(speechHistory) || speechHistory.length === 0) return null;

  return {
    overallWPM: averageScore(speechHistory.map(sample => sample.wpm || 0)) || 0,
    totalFillers: speechHistory.reduce((sum, sample) => sum + (sample.totalFillers || 0), 0),
    clarityTrend: speechHistory.map(sample => clampScore(sample.clarityScore, 80)),
    confidenceTrend: speechHistory.map(sample => clampScore(sample.confidenceScore, 75)),
  };
}

function detectQuestionCategory(questionMeta = {}, stage = '', question = '') {
  const tags = Array.isArray(questionMeta?.tags) ? questionMeta.tags.join(' ') : '';
  const normalized = `${stage} ${tags} ${question}`.toLowerCase();

  if (normalized.includes('system design') || normalized.includes('system-design') || normalized.includes('design a ')) {
    return 'system-design';
  }

  if (
    normalized.includes('behavior') ||
    normalized.includes('behaviour') ||
    normalized.includes('culture') ||
    normalized.includes('team') ||
    normalized.includes('tell me about') ||
    normalized.includes('conflict')
  ) {
    return 'behavioral';
  }

  if (
    normalized.includes('coding') ||
    normalized.includes('code') ||
    normalized.includes('implement') ||
    normalized.includes('algorithm') ||
    normalized.includes('leetcode')
  ) {
    return 'coding';
  }

  if (normalized.includes('hr') || normalized.includes('recruiter')) {
    return 'hr';
  }

  return 'technical';
}

function extractInterviewQaPairs(conversation = []) {
  const qaPairs = [];
  let currentQuestion = null;

  for (const message of (conversation || [])) {
    if (message.role === 'interviewer' && !currentQuestion) {
      currentQuestion = {
        question: message.content,
        questionSource: message.questionSource,
        questionMeta: message.questionMeta,
        timestamp: message.timestamp,
      };
      continue;
    }

    if (message.role === 'candidate' && currentQuestion) {
      qaPairs.push({
        ...currentQuestion,
        answer: message.content,
        answerTimestamp: message.timestamp,
      });
      currentQuestion = null;
      continue;
    }

    if (message.role === 'interviewer' && currentQuestion) {
      currentQuestion = {
        question: message.content,
        questionSource: message.questionSource,
        questionMeta: message.questionMeta,
        timestamp: message.timestamp,
      };
      continue;
    }

    if (message.role === 'feedback' && qaPairs.length > 0) {
      const latestPair = qaPairs[qaPairs.length - 1];
      latestPair.inlineScore = message.score;
      latestPair.strengths = Array.isArray(message.strengths) ? message.strengths : [];
      latestPair.improvements = Array.isArray(message.improvements) ? message.improvements : [];
      latestPair.feedback = message.content;
    }
  }

  return qaPairs;
}

function collectTopItems(groups = [], limit = 4) {
  const counts = new Map();

  for (const group of groups) {
    for (const item of (group || [])) {
      const key = String(item || '').trim();
      if (!key) continue;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([item]) => item);
}

function defaultIdealAnswerPoints(category) {
  switch (category) {
    case 'system-design':
      return ['Clarify scale and constraints', 'Explain architecture trade-offs', 'Discuss reliability and latency'];
    case 'behavioral':
      return ['Use a clear STAR structure', 'Describe your specific actions', 'Quantify the result or lesson learned'];
    case 'coding':
      return ['State the approach before coding', 'Cover complexity and edge cases', 'Explain how you would test the solution'];
    case 'hr':
      return ['Answer directly and authentically', 'Connect the answer to the role', 'Show a mature reason for your decision'];
    default:
      return ['Lead with the core idea', 'Support it with a concrete example', 'Mention trade-offs or edge cases'];
  }
}

function buildDeterministicInterviewReport({ company, role, stage, qaPairs, sessionScores = [], speechHistory = [] }) {
  const questionBreakdown = qaPairs.map((qa, index) => {
    const answer = String(qa.answer || '').trim();
    const category = detectQuestionCategory(qa.questionMeta, stage, qa.question);
    const answerLength = answer.length;
    const heuristicsScore = clampScore(
      qa.inlineScore ?? sessionScores[index] ?? (answerLength === 0 ? 25 : 45 + Math.min(35, Math.round(answerLength / 18))),
      60
    );

    const strengths = qa.strengths?.length
      ? qa.strengths
      : [
        answerLength > 160 ? 'Provided enough detail to communicate the main idea' : 'Answered directly without going off track',
        category === 'behavioral' ? 'Showed self-awareness in the example' : 'Kept the explanation understandable'
      ].slice(0, answerLength > 80 ? 2 : 1);

    const improvements = qa.improvements?.length
      ? qa.improvements
      : [
        answerLength < 120 ? 'Add more depth and concrete supporting detail' : 'Tighten the answer so the main point lands faster',
        category === 'coding' ? 'Call out complexity and edge cases explicitly' : 'Use one concrete example or measurable outcome'
      ].slice(0, 2);

    const feedback = qa.feedback || (
      heuristicsScore >= 80
        ? 'This answer was solid and relevant. The next step is making the reasoning even sharper with one concrete example or trade-off.'
        : heuristicsScore >= 60
          ? 'The answer covered the basics, but it stayed too general in places. Add more specifics and structure to make the response more convincing.'
          : 'The answer did not yet demonstrate enough depth for this question. Slow down, structure the response, and cover the core concepts more explicitly.'
    );

    return {
      questionNumber: index + 1,
      question: qa.question?.substring(0, 300),
      candidateAnswer: answer.substring(0, 600),
      score: heuristicsScore,
      category,
      feedback,
      strengths,
      improvements,
      idealAnswerPoints: defaultIdealAnswerPoints(category),
      questionSource: qa.questionSource,
      questionMeta: qa.questionMeta,
    };
  });

  const overallScore = averageScore(questionBreakdown.map(item => item.score)) ?? averageScore(sessionScores) ?? 70;

  const categoryBuckets = {
    technicalSkills: [],
    communication: questionBreakdown.map(item => Math.min(100, item.score + (item.candidateAnswer?.length > 120 ? 6 : -4))),
    problemSolving: [],
    cultureFit: [],
  };

  for (const question of questionBreakdown) {
    if (['technical', 'coding', 'system-design'].includes(question.category)) {
      categoryBuckets.technicalSkills.push(question.score);
      categoryBuckets.problemSolving.push(Math.min(100, question.score + (question.category === 'coding' ? 4 : 0)));
    }

    if (['behavioral', 'hr'].includes(question.category)) {
      categoryBuckets.cultureFit.push(question.score);
      categoryBuckets.communication.push(Math.min(100, question.score + 4));
    }
  }

  const categoryScores = {
    technicalSkills: averageScore(categoryBuckets.technicalSkills) ?? Math.max(55, overallScore - 3),
    communication: averageScore(categoryBuckets.communication) ?? overallScore,
    problemSolving: averageScore(categoryBuckets.problemSolving) ?? Math.max(50, overallScore - 2),
    cultureFit: averageScore(categoryBuckets.cultureFit) ?? Math.max(55, overallScore + 2),
  };

  const strengths = collectTopItems(questionBreakdown.map(item => item.strengths), 4);
  const improvements = collectTopItems(questionBreakdown.map(item => item.improvements), 4);

  const weakestCategory = Object.entries(categoryScores).sort((left, right) => left[1] - right[1])[0]?.[0] || 'technicalSkills';
  const weakestCategoryLabel = weakestCategory
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, match => match.toUpperCase());

  const verdict = overallScore >= 85
    ? 'Strong Hire'
    : overallScore >= 70
      ? 'Would Advance'
      : overallScore >= 55
        ? 'Borderline'
        : 'Would Not Advance';

  const verdictEmoji = overallScore >= 85 ? '🌟' : overallScore >= 70 ? '👍' : overallScore >= 55 ? '🤔' : '👎';

  return {
    overallScore,
    summary: `You completed ${qaPairs.length} ${stage || 'interview'} questions for the ${role || 'role'} at ${company || 'the company'}. The clearest pattern was ${strengths[0] || 'solid baseline communication'}, while the biggest gap was ${improvements[0] || 'adding more depth to answers'}.`,
    verdict,
    verdictEmoji,
    strengths,
    improvements,
    recommendation: `Prioritize ${weakestCategoryLabel.toLowerCase()} practice in your next mock session and make each answer more specific.`,
    questionBreakdown,
    categoryScores,
    detailedBreakdown: categoryScores,
    recommendations: [
      {
        area: weakestCategoryLabel,
        action: `Spend one focused session improving ${weakestCategoryLabel.toLowerCase()} with question-by-question review.`
      }
    ],
    companyFitScore: clampScore(Math.round((categoryScores.communication + categoryScores.cultureFit) / 2), overallScore),
    companyFitNotes: `Your fit improves when your answers are concrete and structured; right now the main opportunity is stronger specificity in weaker areas.`,
    suggestedTopics: [
      { topic: weakestCategoryLabel, priority: 'high', reason: `This was your lowest scoring area in the interview.` },
      { topic: 'Answer structure and specificity', priority: 'medium', reason: 'Several answers would benefit from clearer supporting detail.' },
      { topic: stage || 'Interview fundamentals', priority: 'medium', reason: `Practice more questions in the ${stage || 'current'} format.` }
    ],
    practiceQuestions: [
      `Redo the weakest answer from this ${stage || 'interview'} round and make it 30% more specific.`,
      `Practice one ${weakestCategoryLabel.toLowerCase()} question and explain your reasoning out loud.`,
      `Answer a follow-up question that forces you to discuss trade-offs and edge cases.`,
      `Give the same answer again, but this time include a concrete example or metric.`,
      `Record one mock answer and critique its structure, clarity, and completeness.`
    ],
    studyPlan: [
      { day: 'Day 1-2', focus: weakestCategoryLabel, tasks: ['Review the weakest answers', 'Rewrite them with more specifics', 'Practice them aloud once'] },
      { day: 'Day 3-4', focus: 'Question structure', tasks: ['Use a repeatable framework', 'Add trade-offs and edge cases', 'Tighten long explanations'] },
      { day: 'Day 5', focus: stage || 'Interview practice', tasks: ['Run one timed mock round', 'Compare answers to ideal points'] },
      { day: 'Day 6', focus: 'Communication', tasks: ['Record 3 answers', 'Remove filler and tighten openings'] },
      { day: 'Day 7', focus: 'Review & Practice', tasks: ['Redo the full mock', 'Check progress against the weakest category'] }
    ],
    speechAnalysis: buildSpeechAnalysis(speechHistory),
  };
}

function normalizeInterviewReport(rawReport, { company, role, stage, qaPairs, sessionScores = [], speechHistory = [] }) {
  const report = rawReport || {};
  const baseQuestionBreakdown = Array.isArray(report.questionBreakdown) ? report.questionBreakdown : [];

  const questionBreakdown = (baseQuestionBreakdown.length > 0 ? baseQuestionBreakdown : buildDeterministicInterviewReport({ company, role, stage, qaPairs, sessionScores, speechHistory }).questionBreakdown)
    .map((item, index) => {
      const qa = qaPairs[index] || {};
      return {
        ...item,
        questionNumber: item.questionNumber || index + 1,
        question: item.question || qa.question?.substring(0, 300) || `Question ${index + 1}`,
        score: clampScore(item.score, clampScore(qa.inlineScore ?? sessionScores[index], 70)),
        category: item.category || detectQuestionCategory(qa.questionMeta, stage, qa.question),
        feedback: item.feedback || qa.feedback || 'The answer addressed part of the question, but more specificity would strengthen it.',
        strengths: Array.isArray(item.strengths) && item.strengths.length > 0 ? item.strengths : (qa.strengths || []),
        improvements: Array.isArray(item.improvements) && item.improvements.length > 0 ? item.improvements : (qa.improvements || []),
        idealAnswerPoints: Array.isArray(item.idealAnswerPoints) && item.idealAnswerPoints.length > 0 ? item.idealAnswerPoints : defaultIdealAnswerPoints(item.category || detectQuestionCategory(qa.questionMeta, stage, qa.question)),
        candidateAnswer: item.candidateAnswer || String(qa.answer || '').substring(0, 600),
        questionSource: item.questionSource || qa.questionSource,
        questionMeta: item.questionMeta || qa.questionMeta,
      };
    });

  const derivedCategoryScores = {
    technicalSkills: averageScore(questionBreakdown.filter(item => ['technical', 'coding', 'system-design'].includes(item.category)).map(item => item.score)) ?? averageScore(sessionScores) ?? 70,
    communication: averageScore(questionBreakdown.map(item => Math.min(100, item.score + (item.candidateAnswer?.length > 120 ? 5 : -3)))) ?? averageScore(sessionScores) ?? 70,
    problemSolving: averageScore(questionBreakdown.filter(item => ['technical', 'coding', 'system-design'].includes(item.category)).map(item => Math.min(100, item.score + 3))) ?? averageScore(sessionScores) ?? 68,
    cultureFit: averageScore(questionBreakdown.filter(item => ['behavioral', 'hr'].includes(item.category)).map(item => item.score)) ?? averageScore(sessionScores) ?? 72,
  };

  const categoryScores = report.categoryScores || report.detailedBreakdown || derivedCategoryScores;
  const normalizedCategoryScores = {
    technicalSkills: clampScore(categoryScores.technicalSkills, derivedCategoryScores.technicalSkills),
    communication: clampScore(categoryScores.communication, derivedCategoryScores.communication),
    problemSolving: clampScore(categoryScores.problemSolving, derivedCategoryScores.problemSolving),
    cultureFit: clampScore(categoryScores.cultureFit, derivedCategoryScores.cultureFit),
  };

  const overallScore = clampScore(
    report.overallScore,
    averageScore(questionBreakdown.map(item => item.score)) ?? averageScore(sessionScores) ?? 70
  );

  const strengths = Array.isArray(report.strengths) && report.strengths.length > 0
    ? report.strengths
    : collectTopItems(questionBreakdown.map(item => item.strengths), 4);

  const improvements = Array.isArray(report.improvements) && report.improvements.length > 0
    ? report.improvements
    : collectTopItems(questionBreakdown.map(item => item.improvements), 4);

  const recommendation = report.recommendation || report.recommendations?.[0]?.action || improvements[0] || 'Review the weaker answers and make them more specific.';
  const verdict = report.verdict || (overallScore >= 85 ? 'Strong Hire' : overallScore >= 70 ? 'Would Advance' : overallScore >= 55 ? 'Borderline' : 'Would Not Advance');
  const verdictEmoji = report.verdictEmoji || (overallScore >= 85 ? '🌟' : overallScore >= 70 ? '👍' : overallScore >= 55 ? '🤔' : '👎');

  return {
    ...report,
    overallScore,
    summary: report.summary || `You completed ${questionBreakdown.length} questions for the ${role || 'role'} at ${company || 'the company'}, with the clearest strengths in ${strengths.slice(0, 2).join(' and ') || 'communication and structure'}.`,
    verdict,
    verdictEmoji,
    strengths,
    improvements,
    recommendation,
    questionBreakdown,
    categoryScores: normalizedCategoryScores,
    detailedBreakdown: normalizedCategoryScores,
    recommendations: Array.isArray(report.recommendations) && report.recommendations.length > 0
      ? report.recommendations
      : [{ area: 'Next Focus', action: recommendation }],
    companyFitScore: clampScore(report.companyFitScore, Math.round((normalizedCategoryScores.communication + normalizedCategoryScores.cultureFit) / 2)),
    companyFitNotes: report.companyFitNotes || `Your fit for ${company || 'this company'} improves when you make strong answers more concrete and consistent.`,
    suggestedTopics: Array.isArray(report.suggestedTopics) && report.suggestedTopics.length > 0
      ? report.suggestedTopics
      : [{ topic: 'Specific answer depth', priority: 'high', reason: 'Several answers need clearer supporting detail.' }],
    practiceQuestions: Array.isArray(report.practiceQuestions) && report.practiceQuestions.length > 0
      ? report.practiceQuestions
      : ['Redo one weak answer and make it more specific.', 'Practice one follow-up question on your weakest topic.'],
    studyPlan: Array.isArray(report.studyPlan) && report.studyPlan.length > 0
      ? report.studyPlan
      : [{ day: 'Day 1', focus: 'Review', tasks: ['Rework the weakest answers from this mock interview'] }],
    speechAnalysis: report.speechAnalysis || buildSpeechAnalysis(speechHistory),
  };
}

async function generateInterviewReport({ company, role, stage, conversation, sessionScores = [], speechHistory = [] }) {
  const qaPairs = extractInterviewQaPairs(conversation);
  const fallbackReport = buildDeterministicInterviewReport({ company, role, stage, qaPairs, sessionScores, speechHistory });

  if (!groq || qaPairs.length === 0) {
    return normalizeInterviewReport(fallbackReport, { company, role, stage, qaPairs, sessionScores, speechHistory });
  }

  const qaText = qaPairs.map((qa, index) => {
    const tags = Array.isArray(qa.questionMeta?.tags) ? qa.questionMeta.tags.join(', ') : 'none';
    return [
      `Question ${index + 1}`,
      `Source: ${qa.questionSource || 'ai'}`,
      `Difficulty: ${qa.questionMeta?.difficulty || 'unknown'}`,
      `Tags: ${tags}`,
      `Question: ${qa.question?.substring(0, 400) || 'N/A'}`,
      `Candidate Answer: ${String(qa.answer || '').substring(0, 900) || 'No answer provided'}`,
      `Inline Score: ${qa.inlineScore ?? sessionScores[index] ?? 'N/A'}`,
      `Inline Strengths: ${(qa.strengths || []).join('; ') || 'N/A'}`,
      `Inline Improvements: ${(qa.improvements || []).join('; ') || 'N/A'}`
    ].join('\n');
  }).join('\n\n');

  try {
    const completion = await aiCallWithRetry({
      operation: () =>
        groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `You are a senior interview panel creating the final report for a ${stage} interview at ${company} for the ${role} role.
Evaluate the candidate fairly for their experience level. Ground every judgment in the ACTUAL question-answer pairs provided. Do not invent strengths or weaknesses that are not supported by the transcript.

Return valid JSON with this shape:
{
  "overallScore": 0-100,
  "summary": "3-4 sentence accurate summary tied to what the candidate actually said",
  "verdict": "Strong Hire / Would Advance / Borderline / Would Not Advance",
  "verdictEmoji": "🌟 or 👍 or 🤔 or 👎",
  "strengths": ["Specific strength 1", "Specific strength 2", "Specific strength 3"],
  "improvements": ["Specific improvement 1", "Specific improvement 2", "Specific improvement 3"],
  "recommendation": "One practical next recommendation",
  "questionBreakdown": [
    {
      "questionNumber": 1,
      "question": "The original question",
      "score": 0-100,
      "category": "technical|behavioral|system-design|hr|coding",
      "feedback": "2-3 sentence explanation tied to this specific answer",
      "strengths": ["Specific strength"],
      "improvements": ["Specific improvement"],
      "idealAnswerPoints": ["Point they should have covered", "Another point"]
    }
  ],
  "categoryScores": {
    "technicalSkills": 0-100,
    "communication": 0-100,
    "problemSolving": 0-100,
    "cultureFit": 0-100
  },
  "recommendations": [
    { "area": "Area name", "action": "Specific actionable next step" }
  ],
  "companyFitScore": 0-100,
  "companyFitNotes": "1-2 sentences on fit for this company/role",
  "suggestedTopics": [
    { "topic": "Topic", "priority": "high|medium|low", "reason": "Why this topic matters based on the transcript" }
  ],
  "practiceQuestions": [
    "Five targeted practice questions based on weak areas"
  ],
  "studyPlan": [
    { "day": "Day 1-2", "focus": "Focus area", "tasks": ["Task 1", "Task 2"] }
  ]
}`
            },
            {
              role: 'user',
              content: `Analyze this interview using only the evidence below:\n\n${qaText}`
            }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3
        }),
      timeoutMs: 12000,
      maxRetries: 2,
      baseDelayMs: 250,
    });

    const parsed = JSON.parse(completion.choices[0].message.content);
    return normalizeInterviewReport(
      {
        ...fallbackReport,
        ...parsed,
        questionBreakdown: parsed.questionBreakdown || fallbackReport.questionBreakdown,
        categoryScores: parsed.categoryScores || parsed.detailedBreakdown || fallbackReport.categoryScores,
        detailedBreakdown: parsed.detailedBreakdown || parsed.categoryScores || fallbackReport.detailedBreakdown,
        strengths: parsed.strengths || fallbackReport.strengths,
        improvements: parsed.improvements || fallbackReport.improvements,
        recommendation: parsed.recommendation || fallbackReport.recommendation,
        recommendations: parsed.recommendations || fallbackReport.recommendations,
        suggestedTopics: parsed.suggestedTopics || fallbackReport.suggestedTopics,
        practiceQuestions: parsed.practiceQuestions || fallbackReport.practiceQuestions,
        studyPlan: parsed.studyPlan || fallbackReport.studyPlan,
      },
      { company, role, stage, qaPairs, sessionScores, speechHistory }
    );
  } catch (error) {
    console.error('Interview report generation error:', error.message);
    return normalizeInterviewReport(fallbackReport, { company, role, stage, qaPairs, sessionScores, speechHistory });
  }
}

router.post('/evaluate', authenticateToken, async (req, res) => {
  const { company, role, stage, conversation, sessionScores, speechHistory } = req.body;

  try {
    const report = await generateInterviewReport({ company, role, stage, conversation, sessionScores, speechHistory });
    res.json(report);
  } catch (error) {
    console.error('Evaluation error:', error.message);
    res.status(500).json({ error: 'Failed to evaluate interview' });
  }
});

// ─── Detailed per-question report ───
router.post('/detailed-report', authenticateToken, async (req, res) => {
  const { company, role, stage, conversation, sessionScores, speechHistory } = req.body;

  try {
    const report = await generateInterviewReport({ company, role, stage, conversation, sessionScores, speechHistory });
    res.json(report);
  } catch (error) {
    console.error('Detailed report error:', error.message);
    res.status(500).json({ error: 'Failed to generate detailed report' });
  }
});

// ─── Analyze speech for pace, fillers, clarity ───
router.post('/speech-feedback', authenticateToken, async (req, res) => {
  const { transcript, duration } = req.body;

  try {
    const words = transcript.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const wpm = duration > 0 ? Math.round((wordCount / duration) * 60) : 0;

    const fillerWords = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'literally', 'so', 'right', 'i mean', 'kind of', 'sort of'];
    const fillerCount = {};
    let totalFillers = 0;
    const lowerTranscript = transcript.toLowerCase();
    fillerWords.forEach(fw => {
      const regex = new RegExp(`\\b${fw}\\b`, 'gi');
      const matches = lowerTranscript.match(regex);
      if (matches && matches.length > 0) {
        fillerCount[fw] = matches.length;
        totalFillers += matches.length;
      }
    });

    const fillerRate = wordCount > 0 ? (totalFillers / wordCount * 100).toFixed(1) : 0;

    let paceAssessment = 'Good';
    if (wpm < 100) paceAssessment = 'Too slow — try to speak more confidently';
    else if (wpm > 180) paceAssessment = 'Too fast — slow down for clarity';
    else if (wpm >= 130 && wpm <= 160) paceAssessment = 'Excellent pace!';

    let clarityScore = 85;
    if (totalFillers > 5) clarityScore -= totalFillers * 2;
    if (wpm < 90 || wpm > 190) clarityScore -= 10;
    clarityScore = Math.max(0, Math.min(100, clarityScore));

    const avgWordLength = words.length > 0 ? words.reduce((a, w) => a + w.length, 0) / words.length : 0;
    let confidenceScore = 70;
    if (wpm >= 120 && wpm <= 170) confidenceScore += 10;
    if (totalFillers <= 2) confidenceScore += 10;
    if (avgWordLength > 4.5) confidenceScore += 5;
    if (wordCount > 50) confidenceScore += 5;
    confidenceScore = Math.min(100, confidenceScore);

    res.json({
      wordCount, wpm, paceAssessment, fillerCount, totalFillers,
      fillerRate: `${fillerRate}%`, clarityScore, confidenceScore,
      tips: [
        totalFillers > 3 ? `Reduce filler words (found ${totalFillers}: ${Object.keys(fillerCount).join(', ')})` : 'Great job minimizing filler words!',
        wpm < 120 ? 'Speak a bit faster to maintain engagement' : wpm > 170 ? 'Slow down slightly' : 'Your pace is great!',
        'Pause briefly between key points for emphasis',
        confidenceScore < 70 ? 'Try to sound more assertive' : 'Good confidence level!'
      ]
    });
  } catch (error) {
    console.error('Speech feedback error:', error.message);
    res.status(500).json({ error: 'Failed to analyze speech' });
  }
});

// ─── AI Copilot suggestions ───
router.post('/copilot-suggest', authenticateToken, async (req, res) => {
  const { company, role, stage, currentQuestion, partialAnswer, jobDescription } = req.body;

  try {
    if (!groq) {
      return res.json({
        starPrompts: { situation: "Provide context", task: "Describe your goal", action: "Explain steps taken", result: "Share impact" },
        keywords: ["leadership", "metrics", "scaling"],
        gapIndicators: ["Add more specific numbers"],
        strengthIndicators: ["Good problem definition"],
        structureSuggestion: "Start with the problem, then your approach, then results.",
        followUpPredictions: ["Can you elaborate on the negative impacts?"]
      });
    }

    const completion = await aiCallWithRetry({
      operation: () =>
        groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `You are an expert AI interview copilot helping a candidate in a ${stage} interview at ${company} for ${role}.
The candidate is currently answering this question: "${currentQuestion}".
Their partial answer so far: "${partialAnswer || '(Not started yet)'}".
Job Description context: "${jobDescription || 'Standard software engineering role'}".

Analyze their answer in real-time and provide brief, punchy suggestions to guide them.

Respond strictly in this JSON format:
{
  "starPrompts": {
    "situation": "Brief prompt to establish context (e.g. 'Set the scene with X')",
    "task": "Brief prompt for the challenge",
    "action": "Brief prompt for their specific actions",
    "result": "Brief prompt to share metrics/outcomes"
  },
  "keywords": ["keyword1", "keyword2", "technology3"],
  "gapIndicators": ["Missing metric for X", "Clarify your specific role"],
  "strengthIndicators": ["Clear problem statement", "Good use of tech stack"],
  "structureSuggestion": "1 short sentence suggesting how to structure the rest of the answer.",
  "followUpPredictions": ["Potential follow-up 1", "Potential follow-up 2"]
}`
            }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.6
        }),
      timeoutMs: 12000,
      maxRetries: 2,
      baseDelayMs: 250,
    });

    const result = JSON.parse(completion.choices[0].message.content);
    res.json(result);
  } catch (error) {
    console.error('Copilot suggest error:', error.message);
    res.status(500).json({ error: 'Failed to generate copilot suggestions' });
  }
});

// ─── Text-to-Speech (Orpheus TTS) ───
router.post('/tts', authenticateToken, async (req, res) => {
  const { text, persona } = req.body;

  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: 'Text is required' });
  }

  // Voice selection based on interviewer persona
  const voiceMap = {
    friendly: 'diana',
    analytical: 'tara',
    formal: 'charlie',
    casual: 'leo',
    default: 'diana'
  };
  const selectedVoice = voiceMap[persona] || voiceMap.default;

  try {
    if (!groq) {
      return res.status(503).json({ error: 'AI service unavailable', fallback: true });
    }

    if (text.length > 1500) {
      return res.status(413).json({ error: 'Text too long for TTS', fallback: true });
    }

    // Primary: Orpheus with persona-selected voice
    const response = await groq.audio.speech.create({
      model: 'canopylabs/orpheus-v1-english',
      input: text,
      voice: selectedVoice,
      response_format: 'wav',
    });

    const buffer = Buffer.from(await response.arrayBuffer());

    if (buffer.length < 100) {
      return res.status(500).json({ error: 'TTS returned empty audio', fallback: true });
    }

    res.set({
      'Content-Type': 'audio/wav',
      'Content-Length': buffer.length,
      'Cache-Control': 'no-cache',
    });
    res.send(buffer);
  } catch (error) {
    console.error('Orpheus TTS error:', error.message?.substring(0, 200));

    // Fallback: try PlayAI
    try {
      const response = await groq.audio.speech.create({
        model: 'playai-tts',
        input: text,
        voice: 'Arista-PlayAI',
        response_format: 'wav',
      });
      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length > 100) {
        res.set({ 'Content-Type': 'audio/wav', 'Content-Length': buffer.length, 'Cache-Control': 'no-cache' });
        return res.send(buffer);
      }
    } catch (fallbackErr) {
      console.error('PlayAI fallback failed:', fallbackErr.message?.substring(0, 200));
    }

    res.status(500).json({ error: 'TTS failed', fallback: true });
  }
});

// ─── Speech-to-Text (Whisper) ───
router.post('/stt', authenticateToken, upload.single('audio'), async (req, res) => {
  const filePath = req.file?.path;

  try {
    if (!groq) {
      if (filePath) fs.unlinkSync(filePath);
      return res.status(503).json({ error: 'AI service unavailable' });
    }

    if (!filePath) {
      return res.status(400).json({ error: 'Audio file is required' });
    }

    const transcription = await groq.audio.transcriptions.create({
      model: 'whisper-large-v3-turbo',
      file: fs.createReadStream(filePath),
      response_format: 'json',
    });

    // Clean up temp file
    try { fs.unlinkSync(filePath); } catch { }

    res.json({
      text: transcription.text || '',
      language: transcription.language || 'en',
    });
  } catch (error) {
    console.error('STT error:', error.message);
    try { if (filePath) fs.unlinkSync(filePath); } catch { }
    res.status(500).json({ error: 'STT failed' });
  }
});

// ─── Save Interview Session ───
router.post('/save-session', authenticateToken, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(200).json({ message: 'Guest session not saved' });

  const {
    type = 'single', company, role, stage, difficulty,
    conversation, scores, overallScore, summaryData,
    speechMetrics, emotionData, proctoringViolations,
    rounds, completedAt
  } = req.body;

  try {
    const { data, error } = await supabaseAdmin
      .from('interview_sessions')
      .insert({
        user_id: userId,
        session_type: type,
        company,
        role,
        stage: type === 'multi-round' ? 'Multi-Round' : stage,
        difficulty,
        conversation: conversation || [],
        scores: scores || [],
        overall_score: overallScore || 0,
        summary_data: summaryData || {},
        speech_metrics: speechMetrics || null,
        emotion_data: emotionData || null,
        proctoring_violations: proctoringViolations || [],
        rounds: rounds || null,
        completed_at: completedAt || new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, sessionId: data.id });
  } catch (error) {
    console.error('Save session error:', error.message);
    res.status(500).json({ error: 'Failed to save session' });
  }
});

// ─── List User's Interview Sessions ───
router.get('/sessions', authenticateToken, async (req, res) => {
  const userId = req.user?.id;
  const { limit = 20, offset = 0, company, stage } = req.query;

  try {
    let query = supabaseAdmin
      .from('interview_sessions')
      .select('id, session_type, company, role, stage, difficulty, overall_score, completed_at, created_at')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (company) query = query.eq('company', company);
    if (stage) query = query.eq('stage', stage);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('List sessions error:', error.message);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// ─── Get Session Detail ───
router.get('/sessions/:id', authenticateToken, async (req, res) => {
  const userId = req.user?.id;

  try {
    const { data, error } = await supabaseAdmin
      .from('interview_sessions')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Session not found' });
    res.json(data);
  } catch (error) {
    console.error('Get session error:', error.message);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// ─── Analytics Aggregation ───
router.get('/analytics', authenticateToken, async (req, res) => {
  const userId = req.user?.id;

  try {
    const { data: sessions, error } = await supabaseAdmin
      .from('interview_sessions')
      .select('overall_score, company, stage, difficulty, completed_at, scores, speech_metrics, emotion_data, proctoring_violations')
      .eq('user_id', userId)
      .order('completed_at', { ascending: true });

    if (error) throw error;

    const totalSessions = sessions?.length || 0;
    if (totalSessions === 0) {
      return res.json({
        totalSessions: 0, averageScore: 0, scoreTrend: [],
        companyBreakdown: {}, stageBreakdown: {}, recentImprovement: 0
      });
    }

    const scores = sessions.map(s => s.overall_score || 0);
    const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

    // Score trend over time
    const scoreTrend = sessions.map(s => ({
      date: s.completed_at,
      score: s.overall_score || 0,
      company: s.company,
      stage: s.stage
    }));

    // Breakdown by company
    const companyBreakdown = {};
    sessions.forEach(s => {
      if (!companyBreakdown[s.company]) companyBreakdown[s.company] = { count: 0, totalScore: 0 };
      companyBreakdown[s.company].count++;
      companyBreakdown[s.company].totalScore += s.overall_score || 0;
    });
    Object.keys(companyBreakdown).forEach(k => {
      companyBreakdown[k].avgScore = Math.round(companyBreakdown[k].totalScore / companyBreakdown[k].count);
    });

    // Breakdown by stage
    const stageBreakdown = {};
    sessions.forEach(s => {
      if (!stageBreakdown[s.stage]) stageBreakdown[s.stage] = { count: 0, totalScore: 0 };
      stageBreakdown[s.stage].count++;
      stageBreakdown[s.stage].totalScore += s.overall_score || 0;
    });
    Object.keys(stageBreakdown).forEach(k => {
      stageBreakdown[k].avgScore = Math.round(stageBreakdown[k].totalScore / stageBreakdown[k].count);
    });

    // Recent improvement (last 5 vs first 5)
    const first5 = scores.slice(0, Math.min(5, scores.length));
    const last5 = scores.slice(Math.max(0, scores.length - 5));
    const recentImprovement = Math.round(
      (last5.reduce((a, b) => a + b, 0) / last5.length) -
      (first5.reduce((a, b) => a + b, 0) / first5.length)
    );

    res.json({
      totalSessions,
      averageScore,
      scoreTrend,
      companyBreakdown,
      stageBreakdown,
      recentImprovement
    });
  } catch (error) {
    console.error('Analytics error:', error.message);
    res.status(500).json({ error: 'Failed to compute analytics' });
  }
});

export default router;
