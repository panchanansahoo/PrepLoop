import express from 'express';
import _Groq from 'groq-sdk';
import _multer from 'multer';
import _fs from 'fs';
import _path from 'path';
import _os from 'os';
import _crypto from 'crypto';
import { optionalAuth, authenticateToken } from '../../middleware/auth.ts';
import { supabaseAdmin } from '../../db/supabaseClient.js';
import { aiCallWithRetry } from '../../utils/aiClient.js';
import { getRandomQuestionSet, _getFilteredQuestions, _getQuestionCount } from '../../services/companyQuestionService.ts';
import { buildInitialVoiceTelemetry, _buildVoiceTelemetrySnapshot } from '../../utils/voiceTelemetry.js';
import { _buildAnswerFeedbackPrompt, _normalizeInterviewFeedback } from '../../utils/interviewFeedback.js';
import { _evaluateFresherAnswer } from '../../services/interviewAnswerEvaluator.js';
import { customInterviewLimiter } from '../../middleware/apiRateLimiter.js';
import { isInterviewLinkExpired, verifyInterviewPasscode, verifyInterviewInviteeEmail } from '../../utils/privateInterviewAccess.js';
import { getCompanyInterviewStyle } from '../../data/companyInterviewStyles.js';
import { redactTranscriptTurns } from '../../services/resumeRedactor.js';
import { quotaGuard, DEGRADATION_MODES } from '../../services/quotaGuard.js';
import { getSessionScorer } from '../../services/llmRouter.js';
import { groq, createGroqChatCompletion, _safeDeleteUploadFile, _MAX_HISTORY_TURNS, _truncateConversationHistory, _deterministicScore, _deterministicPick, safeJsonParse, _UPLOAD_DIR, _upload, _COMPANY_CATEGORIES, _getCompanyCategory, _PERSONA_PROFILES, _DEFAULT_ADVANCED_OPTIONS, _INTERVIEW_RUNTIME_MODES, normalizeInterviewRuntimeMode, buildInterviewRuntime, _STAGE_ALIASES, resolveInterviewStage, resolveResumeInterviewModeForExperience, normalizeAdvancedOptions, _formatResumeContext, FRESHER_INTERVIEW_TOTAL_QUESTIONS, _HR_CLOSING_MESSAGE, _STATIC_INTERVIEW_QUESTIONS, _STATIC_INTERVIEW_CLOSINGS, _FRESHER_HR_FIXED, _FRESHER_HR_TOPICS, _FRESHER_HR_CLOSINGS, _FRESHER_TECHNICAL_FIXED, _FRESHER_TECHNICAL_TOPICS, getStaticInterviewQuestions, getStaticInterviewQuestion, _getStaticInterviewClosing, getFresherTechnicalQuestion, getFresherHRQuestion, _getFresherTechnicalAIPrompt, _getFresherHRAIPrompt, _getFresherHRClosing, _INTERVIEWER_NAMES, _pickFallbackInterviewerName, _getResumeProjectPrompt, _getTopSkillPrompt, _buildHrResponseSnippet, _getFresherScriptedQuestion, _getFresherQuestionTopic, _getFresherFallbackQuestion, _isFinalNoAnswer, getInterviewerPersona, _getCompanyChallengeProfile, _getAdaptiveDifficultyPrompt, _buildInterviewMemoryPrompt, _buildFocusSignal, generateInterviewerName } from './helpers.js';

const router = express.Router();

// ─── Quota Guard Status Endpoint ───
router.get('/quota-status', optionalAuth, (req, res) => {
  const status = quotaGuard.getStatus();
  const userCap = quotaGuard.checkUserCap({ userId: req.user?.id || null, ip: req.ip || null });
  return res.json({
    ...status,
    userCap,
  });
});

// ─── Start Interview ───
export function sanitizeOpeningQuestion(rawQuestion, stage = 'Behavioral', candidateName = '', interviewerName = 'Arjun Mehta') {
  if (!rawQuestion || typeof rawQuestion !== 'string') return rawQuestion;
  let q = rawQuestion.trim();

  // Replace any literal placeholders like [Name], [Your Name], [Interviewer Name]
  if (interviewerName) {
    q = q.replace(/\[(?:Your Name|Name|Interviewer Name|Interviewer)\]/gi, interviewerName);
  }
  if (candidateName) {
    q = q.replace(/\[(?:Candidate Name|Candidate|User Name)\]/gi, candidateName);
  }

  // Strip interview agenda/schedule breakdowns and time allocations
  q = q.replace(/(?:We'll|We will|We have|I have)\s+spend\s+[^.?!]+:[^.?!]+[.?!]/gi, '');
  q = q.replace(/(?:We'll|We will|We have|I have)\s+spend\s+about\s+[^.?!]+[.?!]/gi, '');
  q = q.replace(/(?:We'll|We will|Today we will)\s+spend\s+[^.?!]+[.?!]/gi, '');
  q = q.replace(/quick introductions,[^.?!]+[.?!]/gi, '');
  q = q.replace(/around twenty-five minutes[^.?!]+[.?!]/gi, '');
  q = q.replace(/around \d+ minutes[^.?!]+[.?!]/gi, '');
  q = q.replace(/I'm listening for clear examples[^.?!]+[.?!]/gi, '');
  q = q.replace(/We'll start with quick introductions[^.?!]+[.?!]/gi, '');

  // Strip format check / gatekeeper questions
  const metaPatterns = [
    /Any questions about the format(?: before we start| before we begin)?\??/gi,
    /Any questions before we start\??/gi,
    /Any questions before we begin\??/gi,
    /Do you have any questions before we (?:start|begin|jump in|get started)\??/gi,
    /Are you ready to (?:start|begin)\??/gi,
    /Shall we (?:start|begin)\??/gi,
    /Ready to (?:start|begin)\??/gi,
  ];
  for (const pattern of metaPatterns) {
    q = q.replace(pattern, '').trim();
  }

  // Ensure there is a real opening interview question asked
  const hasRealQuestion = /(introduce yourself|tell me about yourself|walk me through|can you tell me|what brings you|how would you|given an?|design an?|explain the)/i.test(q);
  const normalizedStage = String(stage || '').toLowerCase();

  if (!hasRealQuestion || (!q.trim().endsWith('?') && !q.trim().endsWith('.'))) {
    if (normalizedStage.includes('behavioral') || normalizedStage.includes('hr')) {
      q = q.replace(/[.\s]+$/, '') + '. Please introduce yourself in a minute or two, focusing on your background and what brings you to this opportunity.';
    } else if (normalizedStage.includes('technical')) {
      q = q.replace(/[.\s]+$/, '') + '. To kick things off, please introduce yourself and walk me through a technical project you built recently.';
    }
  }

  return q.replace(/\s{2,}/g, ' ').trim();
}

router.post('/start', customInterviewLimiter, optionalAuth, async (req, res) => {
  const _requestStartTime = Date.now();
  const {
    company,
    role,
    stage: rawStage,
    interviewMode,
    interviewRuntimeMode,
    interviewType,
    difficulty,
    totalQuestions = 8,
    experienceLevel = 'fresher',
    useRealQuestions = false,
    advancedOptions,
    resumeContext,
    focusArea,
    questionSetCode: rawQuestionSetCode,
    token,
    questionSetPasscode,
  } = req.body || {};
  const questionSetCode = token || rawQuestionSetCode;
  const stage = resolveInterviewStage(rawStage, interviewMode, interviewType);
  const resolvedRuntimeMode = normalizeInterviewRuntimeMode(interviewRuntimeMode);
  const runtime = buildInterviewRuntime(resolvedRuntimeMode);
  let normalizedAdvanced = null;
  let interviewTotalQuestions = 8;
  let personalizedQuestionSource = 'ai';
  const companyStyle = getCompanyInterviewStyle(company);
  const buildCanonicalStartPayload = (payload = {}) => {
    const turn = Number(payload?.questionMeta?.sequence);
    return {
      ...payload,
      mode: resolvedRuntimeMode,
      status: 'in_progress',
      complete: false,
      turn: Number.isFinite(turn) ? turn : 1,
      initialQuestion: payload.question || payload.initialQuestion || null,
      nextQuestion: payload.nextQuestion || null,
      warmupLine: payload.warmupLine || companyStyle.warmupLine || `Hey! Thanks for making time today. Ready to dive in?`,
      companyStyle,
      interviewerMood: 'neutral',
      degradationMode: quotaGuard.getCurrentMode(),
      speculationAllowed: quotaGuard.isSpeculationAllowed(),
      telemetry: payload.telemetry || buildInitialVoiceTelemetry(stage, resolvedRuntimeMode),
    };
  };
  let recordedUsage = false;
  const recordInterviewUsage = () => {
    if (!recordedUsage) {
      recordedUsage = true;
      quotaGuard.recordUserInterview({
        userId: req.user?.id || null,
        ip: req.ip || null,
      });
    }
  };
  const withRuntime = (payload) => {
    recordInterviewUsage();
    return {
      ...buildCanonicalStartPayload(payload),
      interviewRuntimeMode: resolvedRuntimeMode,
      runtime,
    };
  };

  try {
    // ─── Quota Guard Enforcement ───
    const userCapCheck = quotaGuard.checkUserCap({
      userId: req.user?.id || null,
      ip: req.ip || null,
    });
    if (!userCapCheck.allowed) {
      return res.status(429).json({
        error: userCapCheck.reason,
        code: 'DAILY_CAP_REACHED',
        interviewsRemaining: 0,
      });
    }

    // Protect in-progress sessions by reserving 15% buffer against new sessions
    const currentDegradationMode = quotaGuard.getCurrentMode({ isNewSession: true });
    if (currentDegradationMode === DEGRADATION_MODES.WAITLIST) {
      return res.status(429).json({
        error: 'Daily interview quota exhausted. Slots are full for today; please book a slot or try again tomorrow.',
        code: 'WAITLIST_ACTIVE',
        mode: 'waitlist',
      });
    }

  // Admin Custom Question Set Mode
  if (questionSetCode) {
    const { data: questionSet, error: qsError } = await supabaseAdmin
      .from('admin_question_sets')
      .select('id, title, description, share_code, interview_type, difficulty, requires_login, questions, settings, is_active, expires_at, max_attempts, passcode_hash, allowed_emails')
      .eq('share_code', questionSetCode)
      .eq('is_active', true)
      .single();

    if (qsError || !questionSet) {
      return res.status(404).json({ error: 'Question set not found or inactive' });
    }

    if (questionSet.requires_login && !req.user) {
      return res.status(401).json({ error: 'Login required for this interview' });
    }
    if (isInterviewLinkExpired(questionSet.expires_at)) {
      return res.status(410).json({ error: 'This interview link has expired' });
    }
    if (!verifyInterviewPasscode(questionSetPasscode, questionSet.passcode_hash)) {
      return res.status(401).json({ error: 'The interview passcode is incorrect' });
    }

    const allowedEmails = Array.isArray(questionSet.allowed_emails)
      ? questionSet.allowed_emails
      : (Array.isArray(questionSet.settings?.allowedEmails) ? questionSet.settings.allowedEmails : []);
    if (allowedEmails.length > 0) {
      const candidateEmail = req.user?.email || req.body?.userEmail;
      if (!candidateEmail || !verifyInterviewInviteeEmail(candidateEmail, allowedEmails)) {
        return res.status(403).json({ error: 'Your email address is not on the authorized invitee list for this interview' });
      }
    }

    const questions = Array.isArray(questionSet.questions) ? questionSet.questions : [];
    if (questions.length === 0) {
      return res.status(400).json({ error: 'Question set has no questions configured' });
    }

    const firstQ = questions[0];
    const firstQText = typeof firstQ === 'string' ? firstQ : (firstQ?.question || 'Tell me about yourself.');
    const firstQContext = typeof firstQ === 'object' ? firstQ?.context : null;
    const firstQTopics = typeof firstQ === 'object' && Array.isArray(firstQ?.expectedTopics) ? firstQ.expectedTopics : [];
    const firstQTimeLimit = typeof firstQ === 'object' ? firstQ?.timeLimit : null;

    const interviewerName = questionSet.settings?.interviewerName || (await generateInterviewerName(questionSet.settings?.companyName || company || 'PrepLoop'));
    const attemptId = _crypto.randomUUID();
    const { error: attemptError } = await supabaseAdmin
      .from('admin_interview_attempts')
      .insert({
        id: attemptId,
        question_set_id: questionSet.id,
        user_id: req.user?.id || null,
        stage,
        question_snapshot: questions,
        current_question_started_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      });
    if (attemptError) {
      console.error('Failed to create custom interview attempt:', attemptError.code || attemptError.message);
      return res.status(500).json({ error: 'Failed to start custom interview' });
    }

    const { data: attemptClaimed, error: claimError } = await supabaseAdmin
      .rpc('claim_admin_interview_attempt', { p_share_code: questionSet.share_code });
    if (claimError || !attemptClaimed) {
      await supabaseAdmin.from('admin_interview_attempts').delete().eq('id', attemptId);
      if (claimError) {
        console.error('Failed to reserve custom interview attempt:', claimError.code || claimError.message);
        return res.status(503).json({ error: 'Private interview access is not ready. Please contact the interviewer.' });
      }
      return res.status(429).json({ error: 'This interview has reached its maximum number of attempts' });
    }

    return res.json(withRuntime({
      question: firstQText,
      questionSetId: questionSet.id,
      attemptId,
      questionSetCode: questionSet.share_code,
      context: {
        company: questionSet.settings?.companyName || company || 'Company',
        role: questionSet.settings?.roleName || role || 'Candidate',
        stage: questionSet.interview_type || 'Technical',
        difficulty: questionSet.difficulty || 'medium',
        totalQuestions: questions.length,
        questionSetTitle: questionSet.title,
        customInstructions: questionSet.settings?.customInstructions || '',
      },
      tips: firstQTopics.length > 0
        ? [`Key topics: ${firstQTopics.join(', ')}`]
        : ['Answer clearly and directly.', 'Use specific examples where possible.'],
      interviewerReaction: 'greeting',
      thinkTime: firstQTimeLimit || 30,
      questionSource: 'admin-custom',
      questionMeta: {
        id: 'admin-q-1',
        track: 'admin-custom',
        sequence: 1,
        interviewerName,
        context: firstQContext,
        expectedTopics: firstQTopics,
      },
    }));
  }
  normalizedAdvanced = resolveResumeInterviewModeForExperience(
    normalizeAdvancedOptions(advancedOptions),
    experienceLevel,
    resumeContext
  );
  const fresherScriptMode = normalizedAdvanced.resumeInterviewMode === 'fresher-hr-tech';
  const requestedCount = Number(totalQuestions);
  const resolvedTotalQuestions = Number.isFinite(requestedCount) && requestedCount >= 4 && requestedCount <= 12
    ? Math.round(requestedCount)
    : normalizedAdvanced.questionCount;
  interviewTotalQuestions = fresherScriptMode ? FRESHER_INTERVIEW_TOTAL_QUESTIONS : resolvedTotalQuestions;
  personalizedQuestionSource = resumeContext ? 'resume' : 'ai';
  const staticQuestions = getStaticInterviewQuestions(stage);
  const isFresherTechnical = fresherScriptMode && stage === 'Technical';
  const isFresherHR = fresherScriptMode && stage === 'HR';

  // Fresher-HR Fixed Mode: Q1-Q10 fixed behavioral, Q11 wrap-up, Q12 conclusion
  if (isFresherHR) {
    const interviewerName = await generateInterviewerName(company);
    const openingQuestion = getFresherHRQuestion(1);
    return res.json(withRuntime({
      question: openingQuestion,
      context: {
        company,
        role,
        stage: 'Fresher-HR',
        difficulty: 'medium',
        totalQuestions: FRESHER_INTERVIEW_TOTAL_QUESTIONS,
        advancedOptions: { ...normalizedAdvanced, questionCount: FRESHER_INTERVIEW_TOTAL_QUESTIONS },
        interviewRuntimeMode: resolvedRuntimeMode,
      },
      tips: ['Introduce your background clearly and keep your answer structured.', 'Use one concrete example when possible.'],
      interviewerReaction: 'greeting',
      thinkTime: 30,
      questionSource: 'fresher-hr-fixed',
      questionMeta: { id: 'fresher-hr-q-1', track: 'fresher-hr', sequence: 1, interviewerName },
    }));
  }

  // Fresher-Technical Hybrid Mode: Q1 fixed, Q2-Q10 AI-generated, Q11-Q12 fixed
  if (isFresherTechnical) {
    const interviewerName = await generateInterviewerName(company);
    const openingQuestion = getFresherTechnicalQuestion(1);
    return res.json(withRuntime({
      question: openingQuestion,
      context: {
        company,
        role,
        stage: 'Fresher-Technical',
        difficulty: 'medium',
        totalQuestions: FRESHER_INTERVIEW_TOTAL_QUESTIONS,
        advancedOptions: { ...normalizedAdvanced, questionCount: FRESHER_INTERVIEW_TOTAL_QUESTIONS },
        interviewRuntimeMode: resolvedRuntimeMode,
      },
      tips: ['Introduce your background, core strengths, and one project highlight.', 'Keep your response clear and structured.'],
      interviewerReaction: 'greeting',
      thinkTime: 30,
      questionSource: 'fresher-technical-hybrid',
      questionMeta: { id: 'fresher-technical-q-1', track: 'fresher-technical', sequence: 1, interviewerName },
    }));
  }

  if (!groq && staticQuestions.length > 0) {
    const interviewerName = await generateInterviewerName(company);
    const openingQuestion = getStaticInterviewQuestion(stage, 1);
    return res.json(withRuntime({
      question: openingQuestion,
      context: {
        company,
        role,
        stage,
        difficulty,
        totalQuestions: staticQuestions.length,
        advancedOptions: { ...normalizedAdvanced, questionCount: staticQuestions.length },
        interviewRuntimeMode: resolvedRuntimeMode,
      },
      tips: stage === 'HR'
        ? ['Introduce yourself clearly and keep your answer structured.', 'Use one concrete example when possible.']
        : ['Start with a direct answer, then explain your reasoning.', 'Mention trade-offs and edge cases where relevant.'],
      interviewerReaction: 'greeting',
      thinkTime: 30,
      questionSource: 'scripted',
      questionMeta: { id: `${String(stage).toLowerCase()}-q-1`, track: String(stage).toLowerCase(), sequence: 1, interviewerName },
    }));
  }

  let questionBank = [];
  let questionSource = 'ai';
  if (useRealQuestions && !fresherScriptMode) {
    questionBank = await getRandomQuestionSet(company, role, stage, difficulty, interviewTotalQuestions);
    if (questionBank.length > 0) {
      questionSource = 'database';
    }
  }

  if (fresherScriptMode) {
      const interviewerName = await generateInterviewerName(company);
      return res.json(withRuntime({
        question: `Good afternoon, my name is ${interviewerName}, I work as an HR executive with ${company}, and I'll be conducting your HR discussion today. We'll mainly talk about your background, your interests, and see how you fit with our organisation. To begin with, could you introduce yourself and walk me through your background?`,
        context: {
          company,
          role,
          stage,
          difficulty,
          totalQuestions: interviewTotalQuestions,
          advancedOptions: { ...normalizedAdvanced, questionCount: FRESHER_INTERVIEW_TOTAL_QUESTIONS },
          interviewRuntimeMode: resolvedRuntimeMode,
        },
        tips: ['Introduce your background, core strengths, and one project highlight.', 'Keep your response clear and structured.'],
        interviewerReaction: 'greeting',
        thinkTime: 30,
        questionSource: 'ai-scripted',
        questionMeta: { id: 'fresher-q-1', track: 'fresher-hr-tech', sequence: 1, interviewerName },
      }));
    }

    if (questionSource === 'database' && questionBank.length > 0) {
      const firstQ = questionBank[0];
      return res.json(withRuntime({
        question: `Hi! Welcome to your ${stage} interview at ${company}. Here's your first question: ${firstQ.question}`,
        context: {
          company,
          role,
          stage,
          difficulty,
          totalQuestions: interviewTotalQuestions,
          advancedOptions: normalizedAdvanced,
          interviewRuntimeMode: resolvedRuntimeMode,
        },
        tips: firstQ.hints?.length > 0 ? firstQ.hints : ['Take a moment to collect your thoughts', 'Structure your answer clearly'],
        interviewerReaction: 'greeting',
        thinkTime: 30,
        questionSource: 'database',
        questionMeta: { id: firstQ.id, tags: firstQ.tags, difficulty: firstQ.difficulty, frequencyScore: firstQ.frequencyScore },
        questionBank: questionBank.map((q) => q.id),
      }));
    }

    if (!groq) {
      const fallbackQuestions = {
        HR: `Hey! Welcome to your HR interview at ${company}. Please introduce yourself in a minute or two, focusing on your background and what brings you to this opportunity.`,
        Behavioral: `Hey! Welcome to your Behavioral interview at ${company}. Please introduce yourself in a minute or two, focusing on your background and what brings you to this opportunity.`,
        'DSA / Coding': 'Given an array of integers, how would you find two numbers that sum to a target?',
        'System Design': 'How would you design a URL shortening service?',
        Technical: 'Can you explain the difference between a process and a thread?',
        OA: 'Given a string, find the length of the longest substring without repeating characters.',
        Managerial: 'Tell me about a time you coordinated a team project.',
      };

      return res.json(withRuntime({
        question: fallbackQuestions[stage] || `Welcome! Tell me about a project you're proud of.`,
        context: {
          company,
          role,
          stage,
          difficulty,
          totalQuestions: interviewTotalQuestions,
          advancedOptions: normalizedAdvanced,
          interviewRuntimeMode: resolvedRuntimeMode,
        },
        tips: ['Take a moment to collect your thoughts', 'Structure your answer clearly'],
        interviewerReaction: 'greeting',
        thinkTime: 30,
        questionSource: personalizedQuestionSource,
      }));
    }

    const interviewerName = req.body?.interviewerName || (await generateInterviewerName(company));
    const candidateName = req.body?.userName || req.user?.user_metadata?.full_name || req.user?.name || '';
    const candidateGreeting = candidateName ? ` ${candidateName}` : '';

    const completion = await aiCallWithRetry({
      operation: () =>
        createGroqChatCompletion({
          model: 'openai/gpt-oss-120b',
          messages: [
            {
              role: 'system',
              content: getInterviewerPersona(company, role, stage, difficulty, 1, interviewTotalQuestions, normalizedAdvanced, resumeContext, experienceLevel) +
                (focusArea && typeof focusArea === 'string'
                  ? `\n\nTARGETED PRACTICE FOCUS: Prioritize questions that assess "${focusArea.trim().slice(0, 100)}" and give the candidate opportunities to improve in this area.`
                  : '') + `

CRITICAL INSTRUCTIONS FOR OPENING QUESTION (Turn 1):
- Your name is ${interviewerName}.
- Greet briefly and warmly (e.g. "Hi${candidateGreeting}, I'm ${interviewerName} from ${company}. Welcome to your ${stage} interview!").
- MANDATORY: Immediately ask the opening interview question without any agenda, time breakdown, or format questions.
- IMMEDIATELY ask the first interview question:
  * For Behavioral or HR: "Please introduce yourself in a minute or two, focusing on your background and what brings you to this opportunity." (or an equivalent direct self-introduction question).
  * For Technical: Greet and ask them to introduce themselves and walk through a recent technical project.
  * For DSA / System Design: Greet and present the problem scenario immediately.

Respond as JSON:
{
  "question": "Your brief greeting + immediate first interview question",
  "tips": ["Tip 1", "Tip 2"],
  "thinkTime": 30,
  "interviewerReaction": "greeting"
}`,
            },
            {
              role: 'user',
              content: `Start the ${stage} interview for ${role} at ${company}. Your name is ${interviewerName}.${candidateName ? ` The candidate's name is ${candidateName}.` : ''} Greet warmly and immediately ask the opening interview question (for Behavioral/HR, ask them to introduce themselves in a minute or two, focusing on their background and what brings them to this opportunity).`,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
          max_tokens: 400,
        }),
      timeoutMs: 30000,
      maxRetries: 2,
      baseDelayMs: 250,
    });

    const parsedResult = safeJsonParse(completion.choices?.[0]?.message?.content || '');
    if (!parsedResult) throw new Error('Failed to parse AI start response');
    const result = {
      ...parsedResult,
      question: sanitizeOpeningQuestion(parsedResult.question, stage, candidateName, interviewerName),
      questionMeta: {
        ...(parsedResult.questionMeta || {}),
        interviewerName,
      },
    };
    return res.json(withRuntime({
      ...result,
      context: {
        company,
        role,
        stage,
        difficulty,
        totalQuestions: interviewTotalQuestions,
        advancedOptions: normalizedAdvanced,
        interviewRuntimeMode: resolvedRuntimeMode,
      },
      thinkTime: result.thinkTime || 30,
      interviewerReaction: result.interviewerReaction || 'greeting',
      questionSource: personalizedQuestionSource,
      questionMeta: null,
    }));
  } catch (error) {
    console.error('Interview start error:', error.message?.substring(0, 200));
    if (questionSetCode) {
      return res.status(500).json({ error: 'Failed to start custom interview' });
    }
    return res.json(withRuntime({
      question: `Hi! Welcome to your ${stage || 'interview'} at ${company || 'PrepLoop'}. Tell me about yourself and your background.`,
      context: {
        company: company || 'Company',
        role: role || 'Candidate',
        stage: stage || 'Technical',
        difficulty: difficulty || 'medium',
        totalQuestions: interviewTotalQuestions,
        advancedOptions: normalizedAdvanced,
        interviewRuntimeMode: resolvedRuntimeMode,
      },
      tips: ['Take a moment to collect your thoughts', 'Structure your answer clearly'],
      interviewerReaction: 'greeting',
      thinkTime: 30,
      questionSource: personalizedQuestionSource,
    }));
  }
});

// ─── Generate Interview Questions from Job Description (JD) ───
router.post('/jd-questions', optionalAuth, async (req, res) => {
  const { jobDescription } = req.body || {};
  if (!jobDescription || typeof jobDescription !== 'string' || jobDescription.trim().length < 40) {
    return res.status(400).json({ error: 'Please provide a job description with at least 40 characters.' });
  }

  const jdText = jobDescription.trim().slice(0, 8000);

  const fallbackSkills = [];
  const commonTech = ['React', 'Node.js', 'TypeScript', 'JavaScript', 'Python', 'Java', 'SQL', 'PostgreSQL', 'AWS', 'Docker', 'Kubernetes', 'GraphQL', 'System Design', 'Git', 'REST API', 'Microservices', 'Tailwind', 'Next.js', 'Redis', 'Kafka'];
  for (const tech of commonTech) {
    if (new RegExp('\\b' + tech.replace('.', '\\.') + '\\b', 'i').test(jdText)) {
      fallbackSkills.push(tech);
    }
  }
  if (fallbackSkills.length === 0) fallbackSkills.push('Problem Solving', 'Data Structures', 'Communication', 'System Design');

  let parsed = {
    company: 'Target Company',
    role: 'Software Engineer',
    experience: '2-4 years',
    skills: fallbackSkills.slice(0, 6),
    rounds: ['Technical', 'System Design', 'HR']
  };

  let questions = [
    {
      question: `Can you walk me through your experience building scalable applications with ${fallbackSkills[0] || 'modern tech stacks'}?`,
      difficulty: 'Medium',
      topic: fallbackSkills[0] || 'Technical Overview',
      round: 'Technical'
    },
    {
      question: 'How do you approach debugging a high-latency issue or bottleneck in a production system?',
      difficulty: 'Medium',
      topic: 'Troubleshooting & Performance',
      round: 'Technical'
    },
    {
      question: 'Design a high-throughput backend architecture or data pipeline for this role. What tradeoffs would you make?',
      difficulty: 'Hard',
      topic: 'System Design',
      round: 'System Design'
    },
    {
      question: 'Tell me about a challenging technical decision you had to advocate for with your team or stakeholders.',
      difficulty: 'Medium',
      topic: 'Collaboration & Leadership',
      round: 'HR'
    },
    {
      question: 'What attracted you to this role and how does your background align with what the team needs?',
      difficulty: 'Easy',
      topic: 'Role Alignment',
      round: 'HR'
    }
  ];

  if (groq) {
    try {
      const completion = await aiCallWithRetry({
        operation: () =>
          createGroqChatCompletion({
            model: 'llama-3.3-70b-versatile',
            messages: [
              {
                role: 'system',
                content: `You are an expert technical recruiter and hiring manager.
Analyze the following Job Description (JD) and extract key metadata, then generate 5-8 tailored interview questions across interview rounds (e.g. Technical, System Design, HR).
Return ONLY a valid JSON object matching this exact schema:
{
  "parsed": {
    "company": "Company Name (extracted or 'Company')",
    "role": "Role Title (e.g. Senior Frontend Engineer)",
    "experience": "Experience range (e.g. 3-5 years or Fresher)",
    "skills": ["Skill1", "Skill2", "Skill3", "Skill4"],
    "rounds": ["Technical", "System Design", "HR"]
  },
  "questions": [
    {
      "question": "The specific question text tailored to this JD",
      "difficulty": "Easy" | "Medium" | "Hard",
      "topic": "Skill or domain topic",
      "round": "Technical" | "System Design" | "HR"
    }
  ]
}`
              },
              {
                role: 'user',
                content: `Job Description:\n${jdText}`
              }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.6,
            max_tokens: 1500,
          }),
        timeoutMs: 15000,
        maxRetries: 2,
        baseDelayMs: 300,
      });

      const raw = completion.choices?.[0]?.message?.content || '';
      const parsedAi = safeJsonParse(raw);
      if (parsedAi?.parsed && Array.isArray(parsedAi?.questions) && parsedAi.questions.length > 0) {
        parsed = {
          company: parsedAi.parsed.company || parsed.company,
          role: parsedAi.parsed.role || parsed.role,
          experience: parsedAi.parsed.experience || parsed.experience,
          skills: Array.isArray(parsedAi.parsed.skills) && parsedAi.parsed.skills.length > 0 ? parsedAi.parsed.skills : parsed.skills,
          rounds: Array.isArray(parsedAi.parsed.rounds) && parsedAi.parsed.rounds.length > 0 ? parsedAi.parsed.rounds : parsed.rounds,
        };
        questions = parsedAi.questions;
      }
    } catch (err) {
      console.warn('AI JD question generation fallback used:', err.message);
    }
  }

  return res.json({ parsed, questions });
});

router.post('/attempt/:id/terminate', optionalAuth, async (req, res) => {
  try {
    const reason = ['user_ended', 'silent_termination', 'technical_error'].includes(req.body?.reason)
      ? req.body.reason
      : 'user_ended';
    const { data: attempt, error } = await supabaseAdmin
      .from('admin_interview_attempts')
      .select('id, user_id, completed_at, submitted_at')
      .eq('id', req.params.id)
      .single();
    if (error || !attempt) return res.status(404).json({ error: 'Interview attempt not found' });
    if (attempt.user_id && attempt.user_id !== req.user?.id) {
      return res.status(403).json({ error: 'Interview attempt belongs to another user' });
    }
    if (attempt.submitted_at) return res.status(409).json({ error: 'Interview attempt is already submitted' });
    if (!attempt.completed_at) {
      const { error: updateError } = await supabaseAdmin
        .from('admin_interview_attempts')
        .update({ completed_at: new Date().toISOString(), completion_reason: reason })
        .eq('id', attempt.id)
        .is('completed_at', null);
      if (updateError) throw updateError;
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Terminate interview attempt error:', error.code || error.message);
    res.status(500).json({ error: 'Failed to terminate interview attempt' });
  }
});


// ─── Save Interview Session ───
router.post('/save-session', optionalAuth, async (req, res) => {
  const userId = req.user?.id;
  const {
    type = 'single', company, role, stage, difficulty,
    conversation, scores, overallScore, summaryData,
    speechMetrics, emotionData, proctoringViolations,
    rounds, completedAt,
    questionSetId, attemptId, userName, userEmail, duration
  } = req.body || {};
  const sessionId = String(attemptId || req.body.sessionId || req.body.id || ('sess_' + _crypto.randomUUID()));

  if (!userId) {
    return res.status(200).json({
      success: true,
      guest: true,
      sessionId,
      message: 'Guest session stored locally'
    });
  }

  const idempotencyKey = String(req.headers['idempotency-key'] || '').trim();
  let reservedSessionId = null;

  try {
    if (idempotencyKey) {
      if (!/^[a-zA-Z0-9._:-]{8,160}$/.test(idempotencyKey)) {
        return res.status(400).json({ error: 'Invalid idempotency key' });
      }
      reservedSessionId = _crypto.randomUUID();
      const { error: reservationError } = await supabaseAdmin
        .from('interview_submission_keys')
        .insert({
          user_id: userId,
          idempotency_key: idempotencyKey,
          resource_id: reservedSessionId,
        });
      if (reservationError?.code === '23505') {
        const { data: existingKey, error: lookupError } = await supabaseAdmin
          .from('interview_submission_keys')
          .select('resource_id')
          .eq('user_id', userId)
          .eq('idempotency_key', idempotencyKey)
          .single();
        if (lookupError || !existingKey) throw lookupError || new Error('Idempotency reservation unavailable');
        const { data: existingSession } = await supabaseAdmin
          .from('interview_sessions')
          .select('id')
          .eq('id', existingKey.resource_id)
          .maybeSingle();
        if (existingSession) return res.json({ success: true, sessionId: existingSession.id, duplicate: true });
        reservedSessionId = existingKey.resource_id;
      } else if (reservationError) {
        throw reservationError;
      }
    }

    let customAttempt = null;
    if (questionSetId) {
      if (!attemptId) {
        return res.status(400).json({ error: 'A valid custom interview attempt is required' });
      }
      const { data: attempt, error: attemptError } = await supabaseAdmin
        .from('admin_interview_attempts')
        .select('id, question_set_id, user_id, expires_at, completed_at, submitted_at')
        .eq('id', attemptId)
        .eq('question_set_id', questionSetId)
        .single();
      if (attemptError || !attempt) {
        return res.status(404).json({ error: 'Interview attempt not found' });
      }
      if (attempt.user_id !== userId || !attempt.completed_at || attempt.submitted_at) {
        return res.status(409).json({ error: 'Interview attempt is not eligible for saving' });
      }
      if (new Date(attempt.expires_at).getTime() <= Date.now()) {
        return res.status(410).json({ error: 'This interview attempt has expired' });
      }
      customAttempt = attempt;
    }
    const sessionId = String(attemptId || req.body.sessionId || req.body.id || reservedSessionId || ('sess_' + _crypto.randomUUID()));
    const numericScore = Math.round(Number(overallScore) || 0);
    const durationMinutes = duration ? Math.max(1, Math.round(duration / 60)) : null;
    const safeConversation = Array.isArray(conversation) ? conversation : [];
    const recommendationsText = typeof summaryData === 'string'
      ? summaryData
      : (summaryData?.summary || summaryData?.feedback || summaryData?.recommendations || '');

    const metricsPayload = {
      scores: scores || [],
      overallScore: numericScore,
      summaryData: summaryData || {},
      speechMetrics: speechMetrics || null,
      emotionData: emotionData || null,
      proctoringViolations: proctoringViolations || [],
      rounds: rounds || null,
      role: role || 'Software Engineer',
      stage: type === 'multi-round' ? 'Multi-Round' : (stage || 'Technical'),
      sessionType: type,
      company: company || 'General',
      difficulty: difficulty || 'medium',
      duration: duration || null,
    };

    const sessionInsertPayload = {
      ...(reservedSessionId ? { id: reservedSessionId } : {}),
      user_id: userId,
      session_id: sessionId,
      interview_type: type === 'multi-round' ? 'Multi-Round' : (stage || type || 'Technical'),
      media_type: 'video',
      difficulty_level: difficulty || 'medium',
      company_focus: company || 'General',
      duration_minutes: durationMinutes,
      transcript: redactTranscriptTurns(safeConversation),
      performance_metrics: metricsPayload,
      interview_score: numericScore,
      status: 'completed',
      recommendations: recommendationsText,
      completed_at: completedAt || new Date().toISOString(),
      ai_model_version: getSessionScorer(sessionId)
        ? `${getSessionScorer(sessionId).provider}:${getSessionScorer(sessionId).model}`
        : (summaryData?.reportModelUsed || 'openai/gpt-oss-20b'),
      pinned_scorer: getSessionScorer(sessionId) || (summaryData?.reportModelUsed ? { provider: summaryData?.reportProvider, model: summaryData?.reportModelUsed } : null),
    };

    const { data, error } = await supabaseAdmin
      .from('interview_sessions')
      .insert(sessionInsertPayload)
      .select()
      .single();

    if (error) throw error;

    // Mirror to mock_interviews so general history and analytics see it immediately
    try {
      const interviewerQuestions = safeConversation
        .filter(m => m.role === 'interviewer' || m.role === 'system')
        .map(m => m.content || m.text || '');
      const candidateResponses = safeConversation
        .filter(m => m.role === 'candidate' || m.role === 'user')
        .map(m => m.content || m.text || '');

      await supabaseAdmin
        .from('mock_interviews')
        .insert({
          user_id: userId,
          interview_type: type === 'multi-round' ? 'Multi-Round' : (stage || type || 'Technical'),
          difficulty: difficulty || 'medium',
          company: company || 'General',
          role: role || 'Software Engineer',
          duration: duration ? Math.round(duration) : null,
          questions: interviewerQuestions,
          responses: candidateResponses,
          ai_feedback: recommendationsText,
          overall_score: numericScore,
          communication_score: summaryData?.communicationScore ?? (scores?.[0] || null),
          technical_score: summaryData?.technicalScore ?? (scores?.[1] || null),
          problem_solving_score: summaryData?.problemSolvingScore ?? (scores?.[2] || null),
          started_at: req.body.startedAt || completedAt || new Date().toISOString(),
          completed_at: completedAt || new Date().toISOString()
        });
    } catch (mockErr) {
      console.warn('Failed to mirror to mock_interviews (non-critical):', mockErr.message);
    }

    if (questionSetId) {
      try {
        await supabaseAdmin.from('admin_interview_submissions').insert({
          question_set_id: questionSetId,
          attempt_id: customAttempt.id,
          user_id: userId || null,
          user_name: userName || req.user?.user_metadata?.full_name || req.user?.email || null,
          user_email: userEmail || req.user?.email || null,
          responses: conversation || [],
          scores: scores || {},
          overall_score: overallScore || 0,
          duration: duration || 0,
          completed_at: completedAt || new Date().toISOString()
        });
      } catch (subErr) {
        console.error('Failed to record admin interview submission:', subErr);
      }
    }

    res.json({ success: true, sessionId: data.id });
  } catch (error) {
    console.error('Save session error:', error.message);
    if (res.headersSent) return;
    res.status(500).json({ error: 'Failed to save session' });
  }
});


// ─── Interview Checkpoints ───
router.get('/checkpoints/:sessionId', authenticateToken, async (req, res) => {
  const sessionKey = String(req.params.sessionId || '').trim();
  if (!/^[a-zA-Z0-9_-]{8,120}$/.test(sessionKey)) {
    return res.status(400).json({ error: 'Invalid interview session key' });
  }

  const { data, error } = await supabaseAdmin
    .from('interview_session_checkpoints')
    .select('payload, version, updated_at')
    .eq('user_id', req.user.id)
    .eq('session_key', sessionKey)
    .maybeSingle();

  if (error) {
    console.error('Load interview checkpoint error:', error.message);
    return res.status(500).json({ error: 'Failed to load interview checkpoint' });
  }
  return res.json({ checkpoint: data || null });
});

router.put('/checkpoints/:sessionId', authenticateToken, async (req, res) => {
  const sessionKey = String(req.params.sessionId || '').trim();
  const payload = req.body?.payload;
  const version = Number(req.body?.version);
  if (!/^[a-zA-Z0-9_-]{8,120}$/.test(sessionKey) || !payload || typeof payload !== 'object') {
    return res.status(400).json({ error: 'Invalid interview checkpoint' });
  }
  if (!Number.isInteger(version) || version < 1 || version > 1000000) {
    return res.status(400).json({ error: 'Invalid checkpoint version' });
  }

  const { data: existing, error: existingError } = await supabaseAdmin
    .from('interview_session_checkpoints')
    .select('version')
    .eq('user_id', req.user.id)
    .eq('session_key', sessionKey)
    .maybeSingle();
  if (existingError) {
    console.error('Read interview checkpoint version error:', existingError.message);
    return res.status(500).json({ error: 'Failed to save interview checkpoint' });
  }
  if (existing?.version >= version) {
    return res.json({ saved: false, version: existing.version });
  }

  const { data, error } = await supabaseAdmin
    .from('interview_session_checkpoints')
    .upsert({
      user_id: req.user.id,
      session_key: sessionKey,
      payload,
      version,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,session_key' })
    .select('version, updated_at')
    .single();
  if (error) {
    console.error('Save interview checkpoint error:', error.message);
    return res.status(500).json({ error: 'Failed to save interview checkpoint' });
  }
  return res.json({ saved: true, checkpoint: data });
});

router.delete('/checkpoints/:sessionId', authenticateToken, async (req, res) => {
  const sessionKey = String(req.params.sessionId || '').trim();
  if (!/^[a-zA-Z0-9_-]{8,120}$/.test(sessionKey)) {
    return res.status(400).json({ error: 'Invalid interview session key' });
  }
  const { error } = await supabaseAdmin
    .from('interview_session_checkpoints')
    .delete()
    .eq('user_id', req.user.id)
    .eq('session_key', sessionKey);
  if (error) {
    console.error('Delete interview checkpoint error:', error.message);
    return res.status(500).json({ error: 'Failed to clear interview checkpoint' });
  }
  return res.json({ deleted: true });
});


// ─── List User's Interview Sessions ───
router.get('/sessions', optionalAuth, async (req, res) => {
  const userId = req.user?.id;
  const { limit = 20, offset = 0, company, stage } = req.query;

  if (!userId) {
    return res.json([]);
  }

  try {
    let query = supabaseAdmin
      .from('interview_sessions')
      .select('id, session_id, interview_type, company_focus, difficulty_level, interview_score, performance_metrics, transcript, recommendations, completed_at, created_at')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (company) query = query.ilike('company_focus', `%${company}%`);

    const { data, error } = await query;
    if (error) throw error;

    let sessions = (data || []).map(s => {
      const pm = s.performance_metrics || {};
      return {
        id: s.id,
        session_id: s.session_id,
        session_type: pm.sessionType || 'single',
        company: s.company_focus || pm.company || 'General',
        role: pm.role || 'Software Engineer',
        stage: pm.stage || s.interview_type || 'Technical',
        difficulty: s.difficulty_level || pm.difficulty || 'medium',
        overall_score: s.interview_score ?? pm.overallScore ?? 0,
        score: s.interview_score ?? pm.overallScore ?? 0,
        conversation: s.transcript || [],
        summary: s.recommendations || pm.summaryData?.summary || pm.summaryData?.feedback || '',
        summary_data: pm.summaryData || {},
        completed_at: s.completed_at || s.created_at,
        created_at: s.created_at || s.completed_at
      };
    });

    if (stage) {
      sessions = sessions.filter(s => String(s.stage).toLowerCase() === String(stage).toLowerCase());
    }

    // Fallback or merge with mock_interviews if empty
    if (sessions.length === 0) {
      let mockQuery = supabaseAdmin
        .from('mock_interviews')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

      if (company) mockQuery = mockQuery.ilike('company', `%${company}%`);

      const { data: mockData } = await mockQuery;
      if (Array.isArray(mockData) && mockData.length > 0) {
        sessions = mockData.map(m => ({
          id: String(m.id),
          session_id: String(m.id),
          session_type: 'single',
          company: m.company || 'General',
          role: m.role || 'Software Engineer',
          stage: m.interview_type || 'Technical',
          difficulty: m.difficulty || 'medium',
          overall_score: m.overall_score || 0,
          score: m.overall_score || 0,
          conversation: (m.questions || []).map((q) => ({
            role: 'interviewer',
            content: q
          })).concat((m.responses || []).map((r) => ({
            role: 'candidate',
            content: r
          }))),
          summary: m.ai_feedback || '',
          summary_data: { feedback: m.ai_feedback },
          completed_at: m.completed_at || m.started_at,
          created_at: m.started_at || m.completed_at
        }));
      }
    }

    res.json(sessions);
  } catch (error) {
    console.error('List sessions error:', error.message);
    if (res.headersSent) return;
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});


// ─── Get Session Detail ───
router.get('/sessions/:id', optionalAuth, async (req, res) => {
  const userId = req.user?.id;
  const rawId = String(req.params.id || '');
  const cleanId = rawId.replace(/^(interview_session_|mock_interview_)/, '');

  try {
    let session = null;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);
    let query = supabaseAdmin.from('interview_sessions').select('*');
    if (userId) {
      query = query.eq('user_id', userId);
    }
    if (isUuid) {
      query = query.eq('id', cleanId);
    } else {
      query = query.or(`session_id.eq.${cleanId},session_id.eq.${rawId}`);
    }

    const { data, error } = await query.maybeSingle();
    if (!error && data) {
      const pm = data.performance_metrics || {};
      session = {
        id: data.id,
        session_id: data.session_id,
        session_type: pm.sessionType || 'single',
        company: data.company_focus || pm.company || 'General',
        role: pm.role || 'Software Engineer',
        stage: pm.stage || data.interview_type || 'Technical',
        difficulty: data.difficulty_level || pm.difficulty || 'medium',
        overall_score: data.interview_score ?? pm.overallScore ?? 0,
        score: data.interview_score ?? pm.overallScore ?? 0,
        conversation: data.transcript || [],
        summary: data.recommendations || pm.summaryData?.summary || pm.summaryData?.feedback || '',
        summary_data: pm.summaryData || {},
        scores: pm.scores || [],
        speech_metrics: data.speech_metrics || pm.speechMetrics || null,
        emotion_data: data.emotion_data || pm.emotionData || null,
        proctoring_violations: data.proctoring_violations || pm.proctoringViolations || [],
        rounds: data.rounds || pm.rounds || null,
        completed_at: data.completed_at || data.created_at,
        created_at: data.created_at || data.completed_at
      };
    } else {
      // Fallback to mock_interviews
      let mockQuery = supabaseAdmin.from('mock_interviews').select('*');
      if (userId) mockQuery = mockQuery.eq('user_id', userId);
      const isNum = !isNaN(Number(cleanId));
      if (isNum) {
        mockQuery = mockQuery.eq('id', Number(cleanId));
      } else {
        mockQuery = mockQuery.eq('id', cleanId);
      }

      const { data: mockData } = await mockQuery.maybeSingle();

      if (mockData) {
        session = {
          id: String(mockData.id),
          session_id: String(mockData.id),
          session_type: 'single',
          company: mockData.company || 'General',
          role: mockData.role || 'Software Engineer',
          stage: mockData.interview_type || 'Technical',
          difficulty: mockData.difficulty || 'medium',
          overall_score: mockData.overall_score || 0,
          score: mockData.overall_score || 0,
          conversation: (mockData.questions || []).map(q => ({ role: 'interviewer', content: q })).concat(
            (mockData.responses || []).map(r => ({ role: 'candidate', content: r }))
          ),
          summary: mockData.ai_feedback || '',
          summary_data: { feedback: mockData.ai_feedback },
          completed_at: mockData.completed_at || mockData.started_at,
          created_at: mockData.started_at || mockData.completed_at
        };
      }
    }

    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (error) {
    console.error('Get session error:', error.message);
    if (res.headersSent) return;
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});


// ─── Delete Session ───
router.delete('/sessions/:id', authenticateToken, async (req, res) => {
  const userId = req.user?.id;
  const sessionId = req.params.id;

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId);
    if (isUuid) {
      await supabaseAdmin
        .from('interview_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', userId);
    } else {
      await supabaseAdmin
        .from('interview_sessions')
        .delete()
        .eq('session_id', sessionId)
        .eq('user_id', userId);
    }

    // Also delete from mock_interviews if present
    await supabaseAdmin
      .from('mock_interviews')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', userId);

    res.json({ success: true, deleted: true });
  } catch (error) {
    console.error('Delete session error:', error.message);
    if (res.headersSent) return;
    res.status(500).json({ error: 'Failed to delete session' });
  }
});


export default router;
