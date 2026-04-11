import express from 'express';
import Groq from 'groq-sdk';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { aiCallWithRetry } from '../utils/aiClient.js';

const router = express.Router();
const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

const DEFAULT_WEAKNESS_AREAS = [
  'communication',
  'clarity',
  'technical_depth',
  'problem_solving',
  'debugging',
  'code_review',
  'behavioral_storytelling',
  'system_design',
  'confidence',
];

const COMPANY_CATEGORIES = {
  faang: ['google', 'amazon', 'meta', 'microsoft', 'apple', 'netflix'],
  consulting: ['deloitte', 'kpmg', 'ey', 'pwc'],
  startup: ['flipkart', 'swiggy', 'zomato', 'razorpay', 'meesho', 'cred', 'zepto'],
  indian_it: ['tcs', 'infosys', 'wipro', 'hcl', 'techmahindra', 'cognizant'],
};

const DEBUG_REVIEW_CHALLENGES = {
  debug: [
    {
      title: 'Cache Misses In Production',
      language: 'javascript',
      prompt: 'Users report repeated slow requests. Debug the snippet and explain root cause + fix.',
      starterCode: "const cache = {};\nfunction getUser(id) {\n  if (cache.id) return cache.id;\n  const user = db.fetchUser(id);\n  cache.id = user;\n  return user;\n}",
      rubric: [
        'Identifies incorrect dynamic key access',
        'Explains stale cache or memory implications',
        'Provides safe patch with tests',
      ],
    },
  ],
  review: [
    {
      title: 'PR Review: Order Service',
      language: 'typescript',
      prompt: 'Review the snippet like a staff engineer. Call out reliability and maintainability risks.',
      starterCode: "export async function checkout(order, paymentClient) {\n  const payment = paymentClient.charge(order.total);\n  await db.orders.insert(order);\n  await db.payments.insert(payment);\n  return { ok: true };\n}",
      rubric: [
        'Catches missing await and transaction boundaries',
        'Mentions idempotency and retry safety',
        'Proposes concrete refactor plan',
      ],
    },
  ],
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toArray(value) {
  if (Array.isArray(value)) return value;
  return [];
}

function asString(value, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function wordCount(text) {
  return asString(text)
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function normalizeSkillLevel(value = 'intermediate') {
  const normalized = asString(value, 'intermediate').toLowerCase();
  if (['beginner', 'intermediate', 'advanced'].includes(normalized)) return normalized;
  return 'intermediate';
}

function isMissingRelationError(error) {
  const message = asString(error?.message || error?.details || '').toLowerCase();
  return (
    error?.code === '42P01'
    || message.includes('does not exist')
    || message.includes('could not find the table')
    || message.includes('in the schema cache')
  );
}

function scoreTextSimilarity(base, candidate) {
  const a = new Set(asString(base).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
  const b = new Set(asString(candidate).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  a.forEach((item) => {
    if (b.has(item)) intersection += 1;
  });
  return Math.round((intersection / Math.max(a.size, b.size)) * 100);
}

function companyCategory(company) {
  const value = asString(company).toLowerCase();
  for (const [category, names] of Object.entries(COMPANY_CATEGORIES)) {
    if (names.some((name) => value.includes(name))) return category;
  }
  return 'general';
}

function buildFallbackResumeQuestions({ resumeText = '', resumeProfile = {}, company = 'target company', role = 'Software Engineer' }) {
  const lines = asString(resumeText)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const projects = toArray(resumeProfile.projectHighlights).slice(0, 4);
  const skills = toArray(resumeProfile.coreSkills).slice(0, 6);

  const seedProject = projects[0] || lines.find((line) => /project|built|developed|intern/i.test(line)) || 'your strongest project';
  const seedSkill = skills[0] || 'your core technical stack';

  return {
    projectQuestions: [
      `Walk me through ${seedProject} end-to-end. What trade-offs did you make and why?`,
      `If you had two more weeks, what would you improve in ${seedProject}?`,
      `What was the hardest bug in ${seedProject}, and how did you debug it?`,
      `How did you measure impact for ${seedProject}?`,
    ],
    hrQuestions: [
      `Why ${company} and why ${role} at this stage of your career?`,
      'Tell me about a time you handled disagreement in a team setting.',
      'How do you prioritize when deadlines collide?',
      'What kind of mentorship helps you perform at your best?',
    ],
    technicalQuestions: [
      `Deep dive into ${seedSkill}: when would you avoid it and choose an alternative?`,
      'Explain one architecture decision you made and how it scaled under load.',
      'How would you test your most critical module for regressions?',
      'Describe your review checklist before merging production code.',
    ],
  };
}

function buildReplayTranscript(conversation = [], startedAt = null, totalDurationSeconds = null) {
  const messages = toArray(conversation).filter((item) => item && typeof item === 'object');
  if (messages.length === 0) return [];

  const baseTime = startedAt ? new Date(startedAt).getTime() : Date.now();
  const derivedDuration = Number(totalDurationSeconds) > 0 ? Number(totalDurationSeconds) : messages.length * 42;
  const step = Math.max(15, Math.round(derivedDuration / Math.max(messages.length, 1)));

  return messages.map((message, index) => {
    const offsetSec = typeof message.timestampSeconds === 'number' ? message.timestampSeconds : index * step;
    const ts = new Date(baseTime + offsetSec * 1000);
    return {
      turn: index + 1,
      role: asString(message.role, 'candidate'),
      text: asString(message.content, ''),
      timestamp: ts.toISOString(),
      timestampLabel: `${String(Math.floor(offsetSec / 60)).padStart(2, '0')}:${String(offsetSec % 60).padStart(2, '0')}`,
    };
  });
}

function buildMistakeMarkers(transcript = []) {
  const markers = [];

  transcript.forEach((entry) => {
    if (entry.role !== 'candidate') return;
    const text = entry.text || '';
    const words = wordCount(text);

    if (words > 0 && words < 10) {
      markers.push({
        turn: entry.turn,
        severity: 'medium',
        category: 'answer_depth',
        reason: 'Answer too short for interview depth.',
        fix: 'Use a 3-part structure: approach, trade-off, result.',
        timestamp: entry.timestamp,
      });
    }

    const fillerCount = (text.match(/\b(um|uh|like|you know|basically)\b/gi) || []).length;
    if (fillerCount >= 3) {
      markers.push({
        turn: entry.turn,
        severity: fillerCount >= 6 ? 'high' : 'medium',
        category: 'communication',
        reason: `High filler density (${fillerCount}).`,
        fix: 'Pause silently instead of using fillers; answer in short chunks.',
        timestamp: entry.timestamp,
      });
    }

    if (/i think|maybe|probably|sort of|kind of/i.test(text)) {
      markers.push({
        turn: entry.turn,
        severity: 'low',
        category: 'confidence',
        reason: 'Hedging language reduced confidence signal.',
        fix: 'State a clear recommendation first, then caveats.',
        timestamp: entry.timestamp,
      });
    }

    if (!/because|therefore|so that|trade-?off|impact|result/i.test(text) && words >= 20) {
      markers.push({
        turn: entry.turn,
        severity: 'medium',
        category: 'reasoning_clarity',
        reason: 'Answer lacked explicit rationale or impact framing.',
        fix: 'Add a rationale phrase and close with outcome/impact.',
        timestamp: entry.timestamp,
      });
    }
  });

  return markers.slice(0, 20);
}

function aggregateWeaknessFromSessions(sessions = []) {
  const scoresByArea = {};
  DEFAULT_WEAKNESS_AREAS.forEach((area) => {
    scoresByArea[area] = [];
  });

  sessions.forEach((session) => {
    const detailed = session.performance_metrics || {};

    Object.entries(detailed).forEach(([key, value]) => {
      const area = asString(key).toLowerCase().replace(/\s+/g, '_');
      if (!scoresByArea[area]) scoresByArea[area] = [];
      if (Number.isFinite(Number(value))) {
        scoresByArea[area].push(clamp(Number(value), 0, 100));
      }
    });

    const overallScore = Number(
      session.overall_score ?? session.interview_score,
    );
    if (Number.isFinite(overallScore)) {
      scoresByArea.communication.push(clamp(overallScore - 4, 0, 100));
      scoresByArea.problem_solving.push(clamp(overallScore - 2, 0, 100));
      scoresByArea.confidence.push(clamp(overallScore - 6, 0, 100));
    }
  });

  const heatmap = Object.entries(scoresByArea)
    .map(([area, values]) => {
      const avg = values.length > 0
        ? values.reduce((sum, score) => sum + score, 0) / values.length
        : 60;
      const weakness = clamp(Math.round(100 - avg), 0, 100);
      return {
        area,
        score: Math.round(avg),
        weakness,
        intensity: weakness >= 45 ? 'high' : weakness >= 25 ? 'medium' : 'low',
      };
    })
    .sort((a, b) => b.weakness - a.weakness);

  return heatmap;
}

function buildAdaptiveDailyPlan(heatmap = [], days = 7) {
  const topWeaknesses = heatmap.slice(0, 4);
  const fallback = [
    { area: 'communication', weakness: 45 },
    { area: 'problem_solving', weakness: 40 },
    { area: 'technical_depth', weakness: 35 },
    { area: 'confidence', weakness: 32 },
  ];
  const focus = topWeaknesses.length > 0 ? topWeaknesses : fallback;

  return Array.from({ length: days }, (_, index) => {
    const area = focus[index % focus.length];
    const level = area.weakness >= 45 ? 'intense' : area.weakness >= 30 ? 'focused' : 'light';
    return {
      day: index + 1,
      focusArea: area.area,
      level,
      tasks: [
        `Run a 20-minute drill on ${area.area.replace(/_/g, ' ')}`,
        'Record one answer and self-score against rubric',
        'Write two improvement notes and one action for tomorrow',
      ],
      targetOutcome: area.weakness >= 45
        ? 'Reduce repeated mistakes and improve structure consistency'
        : 'Sharpen clarity and speed under interview pressure',
    };
  });
}

function buildRoundFlow({ company, role, difficulty, includeDebugMode = false }) {
  const category = companyCategory(company);

  const base = [
    {
      round: 1,
      name: 'Screening / Intro',
      durationMinutes: 20,
      objective: 'Assess communication clarity, motivation, and role alignment.',
      signals: ['clarity', 'intent', 'baseline technical grounding'],
      questionMix: ['resume walkthrough', 'motivation', 'basic technical checks'],
    },
    {
      round: 2,
      name: 'Technical Round',
      durationMinutes: 45,
      objective: 'Evaluate core fundamentals, trade-off awareness, and execution quality.',
      signals: ['problem solving', 'technical depth', 'structured thinking'],
      questionMix: ['core CS concepts', 'practical implementation', 'scenario-based follow-ups'],
    },
    {
      round: 3,
      name: 'Behavioral / Culture',
      durationMinutes: 30,
      objective: 'Evaluate ownership, collaboration style, and growth mindset.',
      signals: ['ownership', 'teamwork', 'coachability'],
      questionMix: ['STAR stories', 'failure handling', 'conflict management'],
    },
  ];

  if (category === 'faang') {
    base.splice(2, 0, {
      round: 3,
      name: 'DSA + System Design Deep Dive',
      durationMinutes: difficulty === 'Hard' ? 70 : 55,
      objective: 'Stress-test algorithmic rigor and design trade-offs.',
      signals: ['complexity reasoning', 'edge case handling', 'scale thinking'],
      questionMix: ['leetcode-style coding', 'architecture sketch', 'optimization follow-ups'],
    });
    base[3].round = 4;
  }

  if (category === 'consulting') {
    base.splice(1, 0, {
      round: 2,
      name: 'Case Structuring Round',
      durationMinutes: 35,
      objective: 'Test issue decomposition and hypothesis-driven communication.',
      signals: ['MECE structure', 'business judgment', 'communication discipline'],
      questionMix: ['framework-based case', 'estimation', 'prioritization'],
    });
    base[2].round = 3;
    base[3].round = 4;
  }

  if (includeDebugMode) {
    base.push({
      round: base.length + 1,
      name: 'Debugging & Code Review',
      durationMinutes: 40,
      objective: 'Evaluate debugging process, observability mindset, and PR review quality.',
      signals: ['root cause analysis', 'risk spotting', 'fix prioritization'],
      questionMix: ['bug hunt', 'incident triage', 'code review critique'],
    });
  }

  return {
    company,
    role,
    difficulty,
    roundCount: base.length,
    rounds: base,
    prepChecklist: [
      'Prepare one resume project deep-dive with trade-offs and metrics',
      'Practice clarifying questions before answering',
      'Use a concise answer structure: context -> action -> impact',
      'Review debugging stories and code review examples',
    ],
  };
}

async function groqJson(systemPrompt, userPrompt, fallback) {
  if (!groq) return fallback;

  try {
    const completion = await aiCallWithRetry({
      operation: () =>
        groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
        }),
      timeoutMs: 12000,
      maxRetries: 2,
      baseDelayMs: 250,
    });

    return JSON.parse(completion.choices[0].message.content);
  } catch (error) {
    console.error('Groq JSON generation failed:', error.message);
    return fallback;
  }
}

// 1) Resume-to-question generator
router.post('/resume/question-generator', authenticateToken, async (req, res) => {
  try {
    const levelHint = asString(req.body.experienceLevel || req.body.skillLevel, 'fresher').toLowerCase();
    const normalizedExperienceLevel = ['beginner', 'intermediate', 'advanced'].includes(levelHint)
      ? levelHint
      : levelHint || 'fresher';

    const {
      resumeText = '',
      resumeProfile = {},
      company = 'target company',
      role = 'Software Engineer',
    } = req.body || {};

    const fallback = buildFallbackResumeQuestions({ resumeText, resumeProfile, company, role });

    const generated = await groqJson(
      'You are an expert interviewer. Generate personalized follow-up questions from resume context. Return JSON only with keys: projectQuestions, hrQuestions, technicalQuestions. Each key must be an array of exactly 6 concise interview questions.',
      `Company: ${company}\nRole: ${role}\nExperience level: ${normalizedExperienceLevel}\nResume profile: ${JSON.stringify(resumeProfile || {})}\nResume text: ${resumeText}`,
      fallback,
    );

    res.json({
      company,
      role,
      experienceLevel: normalizedExperienceLevel,
      projectQuestions: toArray(generated.projectQuestions).slice(0, 6),
      hrQuestions: toArray(generated.hrQuestions).slice(0, 6),
      technicalQuestions: toArray(generated.technicalQuestions).slice(0, 6),
      generatedAt: new Date().toISOString(),
      source: groq ? 'ai' : 'fallback',
    });
  } catch (error) {
    console.error('Resume question generator error:', error.message);
    res.status(500).json({ error: 'Failed to generate resume interview questions' });
  }
});

// 2) Interview replay with transcript + timestamps + mistake markers
router.post('/replay/analyze', authenticateToken, async (req, res) => {
  try {
    const {
      conversation = [],
      startedAt = null,
      durationSeconds = null,
      includeAiMarkers = true,
    } = req.body || {};

    const transcript = buildReplayTranscript(conversation, startedAt, durationSeconds);
    const fallbackMarkers = buildMistakeMarkers(transcript);

    let aiMarkers = [];
    if (includeAiMarkers && groq && transcript.length > 0) {
      const generated = await groqJson(
        'You are a senior interview coach. Extract mistakes from a transcript with timestamps. Return JSON with a markers array. Each marker must contain: turn, severity(low|medium|high), category, reason, fix, timestamp.',
        JSON.stringify({ transcript }),
        { markers: [] },
      );
      aiMarkers = toArray(generated.markers).slice(0, 12);
    }

    res.json({
      transcript,
      mistakeMarkers: aiMarkers.length > 0 ? aiMarkers : fallbackMarkers,
      summary: {
        totalTurns: transcript.length,
        candidateTurns: transcript.filter((entry) => entry.role === 'candidate').length,
        markerCount: aiMarkers.length > 0 ? aiMarkers.length : fallbackMarkers.length,
      },
    });
  } catch (error) {
    console.error('Replay analysis error:', error.message);
    res.status(500).json({ error: 'Failed to analyze interview replay' });
  }
});

router.get('/replay/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { data: session, error } = await supabaseAdmin
      .from('interview_sessions')
      .select('id, user_id, transcript, created_at, completed_at')
      .eq('id', sessionId)
      .eq('user_id', req.user.id)
      .single();

    if (error || !session) {
      return res.status(404).json({ error: 'Interview session not found' });
    }

    const duration = session.completed_at
      ? Math.max(60, Math.round((new Date(session.completed_at).getTime() - new Date(session.created_at).getTime()) / 1000))
      : null;

    const transcript = buildReplayTranscript(session.transcript || [], session.created_at, duration);
    const markers = buildMistakeMarkers(transcript);

    res.json({
      sessionId,
      transcript,
      mistakeMarkers: markers,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Replay fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch replay data' });
  }
});

// 3) Weakness heatmap + adaptive daily plan
router.get('/weakness/heatmap', authenticateToken, async (req, res) => {
  try {
    const limit = clamp(Number(req.query.limit) || 30, 5, 100);
    const querySessions = async (scoreColumn) => supabaseAdmin
      .from('interview_sessions')
      .select(scoreColumn)
      .eq('user_id', req.user.id)
      .limit(limit);

    let { data: sessions, error } = await querySessions('overall_score');

    // Backward compatibility for older schema that used interview_score.
    if (error && String(error.message || '').includes('overall_score')) {
      ({ data: sessions, error } = await querySessions('interview_score'));
    }

    if (error) throw error;

    const heatmap = aggregateWeaknessFromSessions(sessions || []);
    const adaptiveDailyPlan = buildAdaptiveDailyPlan(heatmap, 7);

    res.json({
      sampleSize: (sessions || []).length,
      heatmap,
      adaptiveDailyPlan,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Weakness heatmap error:', error.message);
    res.status(500).json({ error: 'Failed to compute weakness heatmap' });
  }
});

// 4) Company-specific round simulation flow
router.post('/company/round-simulation-flow', authenticateToken, async (req, res) => {
  try {
    const skillLevel = normalizeSkillLevel(req.body.skillLevel);
    const requestedDifficulty = asString(req.body.difficulty, '');
    const inferredDifficulty = requestedDifficulty || (skillLevel === 'beginner'
      ? 'Easy'
      : skillLevel === 'advanced'
        ? 'Hard'
        : 'Medium');

    const {
      company = 'Google',
      role = 'Software Engineer',
      includeDebugMode = true,
      customFocus = [],
    } = req.body || {};

    const fallback = buildRoundFlow({ company, role, difficulty: inferredDifficulty, includeDebugMode });

    const generated = await groqJson(
      'You design realistic interview loops. Return JSON with keys: roundCount, rounds(array), prepChecklist(array). Each round must include: round, name, durationMinutes, objective, signals(array), questionMix(array).',
      JSON.stringify({ company, role, difficulty: inferredDifficulty, includeDebugMode, customFocus, skillLevel }),
      fallback,
    );

    const resolvedRoadmap = {
      company,
      role,
      difficulty: inferredDifficulty,
      skillLevel,
      roundCount: Number(generated.roundCount) || fallback.roundCount,
      rounds: toArray(generated.rounds).length > 0 ? generated.rounds : fallback.rounds,
      prepChecklist: toArray(generated.prepChecklist).length > 0 ? generated.prepChecklist : fallback.prepChecklist,
    };

    res.json({
      ...resolvedRoadmap,
      roadmap: resolvedRoadmap,
      source: groq ? 'ai' : 'fallback',
    });
  } catch (error) {
    console.error('Round simulation flow error:', error.message);
    res.status(500).json({ error: 'Failed to generate company-specific round flow' });
  }
});

// 6) Clarifying-question + communication scoring rubric
router.post('/communication/rubric-score', authenticateToken, async (req, res) => {
  try {
    const answers = toArray(req.body.answers);
    const transcriptText = asString(req.body.transcript || req.body.answer);
    const raw = answers.length > 0
      ? answers.join('\n')
      : transcriptText;

    const totalWords = wordCount(raw);
    const clarifyingCount = (raw.match(/\b(clarify|confirm|if i understood|do you mean|can i assume|before i start)\b/gi) || []).length;
    const fillerCount = (raw.match(/\b(um|uh|like|you know|basically)\b/gi) || []).length;
    const structureCount = (raw.match(/\b(first|second|third|finally|in summary|overall)\b/gi) || []).length;
    const confidencePenalty = (raw.match(/\b(maybe|i think|probably|not sure|kind of|sort of)\b/gi) || []).length;

    const answerCount = Math.max(answers.length, 1);
    const avgWordsPerAnswer = Math.round(totalWords / answerCount);

    const communication = clamp(5 - Math.floor(fillerCount / 6) + Math.floor(structureCount / 4), 1, 5);
    const clarifying = clamp(1 + clarifyingCount, 1, 5);
    const conciseness = avgWordsPerAnswer >= 30 && avgWordsPerAnswer <= 110 ? 4 : avgWordsPerAnswer < 20 ? 2 : 3;
    const confidence = clamp(5 - Math.floor(confidencePenalty / 4), 1, 5);
    const listening = clamp(2 + Math.floor(clarifyingCount / 2), 1, 5);

    const rubric = {
      communication,
      clarifying_questions: clarifying,
      conciseness,
      confidence,
      active_listening: listening,
    };

    const overall = Math.round((Object.values(rubric).reduce((sum, score) => sum + score, 0) / Object.keys(rubric).length) * 20);

    const fallback = {
      rubric,
      overall,
      strengths: [
        clarifying >= 4 ? 'You ask clarification questions proactively.' : 'You stay responsive in the conversation.',
        communication >= 4 ? 'Your communication cadence is interview-ready.' : 'You keep answers understandable.',
      ],
      improvements: [
        fillerCount > 5 ? 'Reduce fillers with intentional pauses.' : 'Keep answer structure explicit (context -> action -> impact).',
        confidence < 4 ? 'Lead with a recommendation before caveats.' : 'Push for deeper technical rationale on key claims.',
      ],
      rawSignals: {
        totalWords,
        answerCount,
        avgWordsPerAnswer,
        clarifyingCount,
        fillerCount,
        structureCount,
        confidencePenalty,
      },
    };

    const generated = await groqJson(
      'You are an interview communication evaluator. Return JSON with keys: rubric(object with communication, clarifying_questions, conciseness, confidence, active_listening each 1-5), overall(0-100), strengths(array), improvements(array).',
      JSON.stringify({ transcript: raw }),
      fallback,
    );

    res.json({
      ...fallback,
      ...generated,
      source: groq ? 'ai+heuristic' : 'heuristic',
    });
  } catch (error) {
    console.error('Communication rubric error:', error.message);
    res.status(500).json({ error: 'Failed to score communication rubric' });
  }
});

// 7) Debugging and code-review interview mode
router.post('/debug-code-review/start', authenticateToken, async (req, res) => {
  try {
    const mode = asString(req.body.mode, 'debug').toLowerCase() === 'review' ? 'review' : 'debug';
    const language = asString(req.body.language, 'javascript');
    const difficulty = asString(req.body.difficulty, 'medium');
    const company = asString(req.body.company, 'target company');

    const fallback = DEBUG_REVIEW_CHALLENGES[mode][0];

    const generated = await groqJson(
      'You create interview coding challenges. Return JSON with keys: title, language, prompt, starterCode, rubric(array of bullet strings). Keep challenge realistic and concise.',
      JSON.stringify({ mode, language, difficulty, company }),
      fallback,
    );

    res.json({
      mode,
      challenge: {
        title: asString(generated.title, fallback.title),
        language: asString(generated.language, language),
        prompt: asString(generated.prompt, fallback.prompt),
        starterCode: asString(generated.starterCode, fallback.starterCode),
        rubric: toArray(generated.rubric).length > 0 ? generated.rubric : fallback.rubric,
      },
      source: groq ? 'ai' : 'fallback',
    });
  } catch (error) {
    console.error('Debug/code-review start error:', error.message);
    res.status(500).json({ error: 'Failed to start debug/code-review interview mode' });
  }
});

router.post('/debug-code-review/evaluate', authenticateToken, async (req, res) => {
  try {
    const {
      mode = 'debug',
      challengePrompt = '',
      candidateResponse = '',
      submittedCode = '',
    } = req.body || {};

    const responseText = `${candidateResponse}\n${submittedCode}`.trim();
    const words = wordCount(responseText);

    const rootCauseScore = /root cause|because|caused by|bug is/i.test(responseText) ? 25 : 10;
    const tradeoffScore = /trade-?off|risk|impact|regression/i.test(responseText) ? 20 : 8;
    const actionScore = /fix|patch|refactor|test|rollback|monitor/i.test(responseText) ? 30 : 12;
    const clarityScore = words >= 60 ? 25 : words >= 25 ? 18 : 10;

    const heuristic = clamp(rootCauseScore + tradeoffScore + actionScore + clarityScore, 0, 100);

    const fallback = {
      score: heuristic,
      breakdown: {
        root_cause: rootCauseScore,
        risk_assessment: tradeoffScore,
        fix_quality: actionScore,
        communication: clarityScore,
      },
      verdict: heuristic >= 80 ? 'strong' : heuristic >= 60 ? 'pass' : 'needs_improvement',
      feedback: [
        rootCauseScore >= 20 ? 'Root cause identification is strong.' : 'Make root cause explicit early in your answer.',
        actionScore >= 25 ? 'Fix path is practical and test-aware.' : 'Propose concrete patch + validation plan.',
        tradeoffScore >= 15 ? 'Risk and trade-off awareness is visible.' : 'Add regression and rollback considerations.',
      ],
      mode,
      challengePrompt,
    };

    const generated = await groqJson(
      'You evaluate debug/code-review interview answers. Return JSON with keys: score(0-100), breakdown(object with root_cause, risk_assessment, fix_quality, communication), verdict(strong|pass|needs_improvement), feedback(array).',
      JSON.stringify({ mode, challengePrompt, candidateResponse, submittedCode }),
      fallback,
    );

    res.json({
      ...fallback,
      ...generated,
      source: groq ? 'ai+heuristic' : 'heuristic',
    });
  } catch (error) {
    console.error('Debug/code-review evaluation error:', error.message);
    res.status(500).json({ error: 'Failed to evaluate debug/code-review response' });
  }
});

// 8/9) Peer mock interview matching + mentor booking
router.post('/peer/profile', authenticateToken, async (req, res) => {
  try {
    const payload = {
      user_id: req.user.id,
      role_target: asString(req.body.roleTarget, 'Software Engineer'),
      company_target: asString(req.body.companyTarget, ''),
      language_preference: asString(req.body.languagePreference, 'english'),
      skill_level: normalizeSkillLevel(req.body.skillLevel),
      availability: Array.isArray(req.body.availability) ? req.body.availability : [],
      bio: asString(req.body.bio, ''),
      active: req.body.active !== false,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('peer_mock_profiles')
      .upsert(payload, { onConflict: 'user_id' })
      .select('*')
      .single();

    if (error) throw error;
    res.json({ profile: data });
  } catch (error) {
    console.error('Peer profile upsert error:', error.message);
    res.status(500).json({ error: 'Failed to save peer profile' });
  }
});

router.get('/peer/matches', authenticateToken, async (req, res) => {
  try {
    const role = asString(req.query.role, '').toLowerCase();
    const company = asString(req.query.company, '').toLowerCase();
    const language = asString(req.query.language, '').toLowerCase();
    const skillLevel = normalizeSkillLevel(req.query.skillLevel);
    const limit = clamp(Number(req.query.limit) || 10, 1, 25);

    const { data: profiles, error } = await supabaseAdmin
      .from('peer_mock_profiles')
      .select('*')
      .eq('active', true)
      .neq('user_id', req.user.id)
      .limit(100);

    if (error) throw error;

    const ranked = toArray(profiles)
      .map((profile) => {
        let score = 0;

        if (role) score += scoreTextSimilarity(role, profile.role_target);
        if (company) score += scoreTextSimilarity(company, profile.company_target || '');
        if (language) score += asString(profile.language_preference).toLowerCase() === language ? 40 : 0;
        score += normalizeSkillLevel(profile.skill_level) === skillLevel ? 30 : 0;

        const sharedSignals = [];
        if (scoreTextSimilarity(role, profile.role_target) >= 30) sharedSignals.push('role alignment');
        if (scoreTextSimilarity(company, profile.company_target || '') >= 30) sharedSignals.push('company alignment');
        if (asString(profile.language_preference).toLowerCase() === language) sharedSignals.push('language match');
        if (normalizeSkillLevel(profile.skill_level) === skillLevel) sharedSignals.push('skill-level proximity');

        return {
          ...profile,
          matchScore: clamp(Math.round(score / 2), 0, 100),
          sharedSignals,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);

    res.json({ matches: ranked });
  } catch (error) {
    console.error('Peer matches error:', error.message);
    res.status(500).json({ error: 'Failed to fetch peer matches' });
  }
});

router.post('/peer/request', authenticateToken, async (req, res) => {
  try {
    const payload = {
      user_id: req.user.id,
      role_target: asString(req.body.roleTarget, 'Software Engineer'),
      company_target: asString(req.body.companyTarget, ''),
      language_preference: asString(req.body.languagePreference, 'english'),
      skill_level: normalizeSkillLevel(req.body.skillLevel),
      requested_slot: req.body.requestedSlot || null,
      notes: asString(req.body.notes, ''),
      status: 'open',
    };

    const { data, error } = await supabaseAdmin
      .from('peer_mock_requests')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;
    res.json({ request: data });
  } catch (error) {
    console.error('Peer request create error:', error.message);
    res.status(500).json({ error: 'Failed to create peer mock request' });
  }
});

router.post('/peer/request/:id/connect', authenticateToken, async (req, res) => {
  try {
    const requestId = Number(req.params.id);
    if (!Number.isFinite(requestId)) {
      return res.status(400).json({ error: 'Invalid request id' });
    }

    const { data: requestRow, error: requestError } = await supabaseAdmin
      .from('peer_mock_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError || !requestRow) {
      return res.status(404).json({ error: 'Peer request not found' });
    }

    if (requestRow.user_id === req.user.id) {
      return res.status(400).json({ error: 'You cannot connect to your own request' });
    }

    if (requestRow.status !== 'open') {
      return res.status(409).json({ error: 'This request is no longer open' });
    }

    const { data, error } = await supabaseAdmin
      .from('peer_mock_requests')
      .update({ status: 'matched', matched_user_id: req.user.id })
      .eq('id', requestId)
      .eq('status', 'open')
      .select('*')
      .single();

    if (error) throw error;
    res.json({ request: data, message: 'Peer mock match confirmed' });
  } catch (error) {
    console.error('Peer request connect error:', error.message);
    res.status(500).json({ error: 'Failed to connect to peer request' });
  }
});

router.get('/mentor/slots', optionalAuth, async (req, res) => {
  try {
    const companyFocus = asString(req.query.companyFocus, '');
    const roleFocus = asString(req.query.roleFocus, '');
    const language = asString(req.query.language, '');
    const skillBand = asString(req.query.skillBand, '');

    let query = supabaseAdmin
      .from('mentor_mock_slots')
      .select('*')
      .eq('is_booked', false)
      .gte('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true })
      .limit(100);

    if (companyFocus) query = query.ilike('company_focus', `%${companyFocus}%`);
    if (roleFocus) query = query.ilike('role_focus', `%${roleFocus}%`);
    if (language) query = query.eq('language', language);
    if (skillBand) query = query.eq('skill_band', normalizeSkillLevel(skillBand));

    const { data, error } = await query;
    if (error) {
      if (isMissingRelationError(error)) {
        console.warn('mentor_mock_slots table missing; returning empty slots list');
        return res.json({ slots: [] });
      }
      throw error;
    }

    res.json({ slots: data || [] });
  } catch (error) {
    console.error('Mentor slots error:', error.message);
    res.status(500).json({ error: 'Failed to fetch mentor slots' });
  }
});

router.post('/mentor/slots', authenticateToken, async (req, res) => {
  try {
    const startsAt = req.body.startsAt;
    const endsAt = req.body.endsAt;

    if (!startsAt || !endsAt) {
      return res.status(400).json({ error: 'startsAt and endsAt are required' });
    }

    const payload = {
      mentor_id: req.user.id,
      company_focus: asString(req.body.companyFocus, ''),
      role_focus: asString(req.body.roleFocus, ''),
      language: asString(req.body.language, 'english'),
      skill_band: normalizeSkillLevel(req.body.skillBand),
      topic: asString(req.body.topic, ''),
      starts_at: startsAt,
      ends_at: endsAt,
      is_booked: false,
    };

    const { data, error } = await supabaseAdmin
      .from('mentor_mock_slots')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;
    res.json({ slot: data });
  } catch (error) {
    console.error('Mentor slot create error:', error.message);
    res.status(500).json({ error: 'Failed to create mentor slot' });
  }
});

router.post('/mentor/book', authenticateToken, async (req, res) => {
  try {
    const slotId = Number(req.body.slotId);
    if (!Number.isFinite(slotId)) {
      return res.status(400).json({ error: 'slotId is required' });
    }

    const { data: slot, error: slotError } = await supabaseAdmin
      .from('mentor_mock_slots')
      .select('*')
      .eq('id', slotId)
      .single();

    if (slotError || !slot) {
      return res.status(404).json({ error: 'Mentor slot not found' });
    }

    if (slot.is_booked) {
      return res.status(409).json({ error: 'Slot already booked' });
    }

    const { data: updatedSlot, error: updateError } = await supabaseAdmin
      .from('mentor_mock_slots')
      .update({ is_booked: true })
      .eq('id', slotId)
      .eq('is_booked', false)
      .select('*')
      .single();

    if (updateError || !updatedSlot) {
      return res.status(409).json({ error: 'Slot became unavailable' });
    }

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('mentor_mock_bookings')
      .insert({
        slot_id: slotId,
        mentor_id: slot.mentor_id,
        user_id: req.user.id,
        booking_notes: asString(req.body.notes, ''),
        status: 'booked',
      })
      .select('*')
      .single();

    if (bookingError) throw bookingError;

    res.json({ booking });
  } catch (error) {
    console.error('Mentor booking error:', error.message);
    res.status(500).json({ error: 'Failed to book mentor mock slot' });
  }
});

// 10) Doubt threads under problem/pattern/interview round
router.get('/doubts', optionalAuth, async (req, res) => {
  try {
    const targetType = asString(req.query.targetType, '');
    const targetId = asString(req.query.targetId, '');
    const limit = clamp(Number(req.query.limit) || 50, 1, 100);

    let query = supabaseAdmin
      .from('doubt_threads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (targetType) query = query.eq('target_type', targetType);
    if (targetId) query = query.eq('target_id', targetId);

    const { data, error } = await query;
    if (error) {
      if (isMissingRelationError(error)) {
        console.warn('doubt_threads table missing; returning empty thread list');
        return res.json({ threads: [] });
      }
      throw error;
    }

    res.json({ threads: data || [] });
  } catch (error) {
    console.error('List doubts error:', error.message);
    res.status(500).json({ error: 'Failed to fetch doubt threads' });
  }
});

router.post('/doubts', authenticateToken, async (req, res) => {
  try {
    const targetType = asString(req.body.targetType, '');
    const targetId = asString(req.body.targetId, '');
    const title = asString(req.body.title, '');
    const content = asString(req.body.content, '');

    if (!targetType || !targetId || !title || !content) {
      return res.status(400).json({ error: 'targetType, targetId, title, and content are required' });
    }

    if (!['problem', 'pattern', 'interview_round'].includes(targetType)) {
      return res.status(400).json({ error: 'Invalid targetType' });
    }

    const { data, error } = await supabaseAdmin
      .from('doubt_threads')
      .insert({
        user_id: req.user.id,
        target_type: targetType,
        target_id: targetId,
        title,
        content,
        tags: Array.isArray(req.body.tags) ? req.body.tags : [],
      })
      .select('*')
      .single();

    if (error) throw error;
    res.json({ thread: data });
  } catch (error) {
    console.error('Create doubt thread error:', error.message);
    res.status(500).json({ error: 'Failed to create doubt thread' });
  }
});

router.get('/doubts/:threadId/replies', optionalAuth, async (req, res) => {
  try {
    const threadId = Number(req.params.threadId);
    if (!Number.isFinite(threadId)) {
      return res.status(400).json({ error: 'Invalid thread id' });
    }

    const { data, error } = await supabaseAdmin
      .from('doubt_replies')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    if (error) {
      if (isMissingRelationError(error)) {
        console.warn('doubt_replies table missing; returning empty reply list');
        return res.json({ replies: [] });
      }
      throw error;
    }
    res.json({ replies: data || [] });
  } catch (error) {
    console.error('List doubt replies error:', error.message);
    res.status(500).json({ error: 'Failed to fetch doubt replies' });
  }
});

router.post('/doubts/:threadId/replies', authenticateToken, async (req, res) => {
  try {
    const threadId = Number(req.params.threadId);
    const content = asString(req.body.content, '');

    if (!Number.isFinite(threadId) || !content) {
      return res.status(400).json({ error: 'Valid thread id and content are required' });
    }

    const { data, error } = await supabaseAdmin
      .from('doubt_replies')
      .insert({
        thread_id: threadId,
        user_id: req.user.id,
        content,
        is_mentor_reply: Boolean(req.body.isMentorReply),
      })
      .select('*')
      .single();

    if (error) throw error;
    res.json({ reply: data });
  } catch (error) {
    console.error('Create doubt reply error:', error.message);
    res.status(500).json({ error: 'Failed to add doubt reply' });
  }
});

router.post('/doubts/:threadId/upvote', authenticateToken, async (req, res) => {
  try {
    const threadId = Number(req.params.threadId);
    if (!Number.isFinite(threadId)) {
      return res.status(400).json({ error: 'Invalid thread id' });
    }

    const { data: existingVote } = await supabaseAdmin
      .from('doubt_votes')
      .select('id')
      .eq('thread_id', threadId)
      .eq('user_id', req.user.id)
      .maybeSingle();

    let action = 'upvoted';
    if (existingVote?.id) {
      const { error: deleteError } = await supabaseAdmin
        .from('doubt_votes')
        .delete()
        .eq('id', existingVote.id);
      if (deleteError) throw deleteError;
      action = 'removed';
    } else {
      const { error: insertError } = await supabaseAdmin
        .from('doubt_votes')
        .insert({ thread_id: threadId, user_id: req.user.id });
      if (insertError) throw insertError;
    }

    const { count: votesCount, error: countError } = await supabaseAdmin
      .from('doubt_votes')
      .select('*', { count: 'exact', head: true })
      .eq('thread_id', threadId);

    if (countError) throw countError;

    const nextVotes = Number(votesCount) || 0;
    const { data: thread, error: updateError } = await supabaseAdmin
      .from('doubt_threads')
      .update({ upvotes: nextVotes, updated_at: new Date().toISOString() })
      .eq('id', threadId)
      .select('*')
      .single();

    if (updateError) throw updateError;

    res.json({ action, thread });
  } catch (error) {
    console.error('Doubt upvote error:', error.message);
    res.status(500).json({ error: 'Failed to update upvote' });
  }
});

export default router;
