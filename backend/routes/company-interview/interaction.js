import express from 'express';
import _Groq from 'groq-sdk';
import _multer from 'multer';
import _fs from 'fs';
import _path from 'path';
import _os from 'os';
import _crypto from 'crypto';
import { optionalAuth, _authenticateToken } from '../../middleware/auth.js';
import { _supabaseAdmin } from '../../db/supabaseClient.js';
import { aiCallWithRetry } from '../../utils/aiClient.js';
import { _getRandomQuestionSet, _getFilteredQuestions, _getQuestionCount } from '../../services/companyQuestionService.js';
import { _buildInitialVoiceTelemetry, buildVoiceTelemetrySnapshot } from '../../utils/voiceTelemetry.js';
import { buildAnswerFeedbackPrompt, normalizeInterviewFeedback } from '../../utils/interviewFeedback.js';
import { evaluateFresherAnswer } from '../../services/interviewAnswerEvaluator.js';
import { customInterviewLimiter } from '../../middleware/apiRateLimiter.js';
import nvidiaVoiceService from '../../services/nvidiaVoiceService.js';
import { groq, createGroqChatCompletion, _safeDeleteUploadFile, _MAX_HISTORY_TURNS, truncateConversationHistory, deterministicScore, deterministicPick, safeJsonParse, _UPLOAD_DIR, _upload, _COMPANY_CATEGORIES, _getCompanyCategory, _PERSONA_PROFILES, _DEFAULT_ADVANCED_OPTIONS, _INTERVIEW_RUNTIME_MODES, normalizeInterviewRuntimeMode, buildInterviewRuntime, _STAGE_ALIASES, resolveInterviewStage, resolveResumeInterviewModeForExperience, normalizeAdvancedOptions, _formatResumeContext, FRESHER_INTERVIEW_TOTAL_QUESTIONS, HR_CLOSING_MESSAGE, _STATIC_INTERVIEW_QUESTIONS, _STATIC_INTERVIEW_CLOSINGS, FRESHER_HR_FIXED, _FRESHER_HR_TOPICS, FRESHER_HR_CLOSINGS, FRESHER_TECHNICAL_FIXED, _FRESHER_TECHNICAL_TOPICS, getStaticInterviewQuestions, getStaticInterviewQuestion, getStaticInterviewClosing, _getFresherTechnicalQuestion, getFresherTechnicalAIPrompt, _getFresherHRQuestion, _getFresherHRAIPrompt, getFresherHRClosing, _INTERVIEWER_NAMES, _pickFallbackInterviewerName, _getResumeProjectPrompt, _getTopSkillPrompt, buildHrResponseSnippet, _getFresherScriptedQuestion, _getFresherQuestionTopic, _getFresherFallbackQuestion, isFinalNoAnswer, getInterviewerPersona, _getCompanyChallengeProfile, getAdaptiveDifficultyPrompt, buildInterviewMemoryPrompt, buildFocusSignal, generateFresherHRQuestion, generateFresherTechnicalQuestion, generateFresherScriptedQuestion } from './helpers.js';
import { computeNextMood, getMoodProfile, getMicroReaction, MOODS } from '../../services/interviewerMoodEngine.js';
import { getCompanyInterviewStyle } from '../../data/companyInterviewStyles.js';
import { callFastReply, callTurnScoring } from '../../services/llmRouter.js';
import quotaGuard from '../../services/quotaGuard.js';

const router = express.Router();

export const scoreDistributionStats = {
  totalScores: 0,
  buckets: { '<50': 0, '50-64': 0, '65-79': 0, '80-89': 0, '>=90': 0 },
  sum: 0,
  min: 100,
  max: 0,
};

export function recordTurnScore(score) {
  if (typeof score !== 'number' || isNaN(score)) return;
  scoreDistributionStats.totalScores++;
  scoreDistributionStats.sum += score;
  scoreDistributionStats.min = Math.min(scoreDistributionStats.min, score);
  scoreDistributionStats.max = Math.max(scoreDistributionStats.max, score);

  if (score < 50) scoreDistributionStats.buckets['<50']++;
  else if (score < 65) scoreDistributionStats.buckets['50-64']++;
  else if (score < 80) scoreDistributionStats.buckets['65-79']++;
  else if (score < 90) scoreDistributionStats.buckets['80-89']++;
  else scoreDistributionStats.buckets['>=90']++;

  const avg = Math.round(scoreDistributionStats.sum / scoreDistributionStats.totalScores);
  if (scoreDistributionStats.totalScores % 5 === 0) {
    console.log(`[Score Calibration] N=${scoreDistributionStats.totalScores} Avg=${avg} Min=${scoreDistributionStats.min} Max=${scoreDistributionStats.max} Buckets:`, JSON.stringify(scoreDistributionStats.buckets));
  }
}

// ─── Follow-up with realistic interviewer behavior ───
router.post('/follow-up', customInterviewLimiter, optionalAuth, async (req, res) => {
  const requestStartTime = Date.now();
  const { company, role, stage: rawStage, interviewMode, interviewRuntimeMode, interviewType, difficulty, previousQuestion, userAnswer, conversationHistory, questionNumber = 2, totalQuestions = 8, lastScore, averageScore, cumulativeScores, sessionScores, code, codeLanguage, useRealQuestions = false, questionBankIds, currentQuestionId, advancedOptions, resumeContext, experienceLevel = 'fresher', questionSource, allQuestions: providedQuestions, questionSetCode: rawQuestionSetCode, token, attemptId, interviewerMood: clientMood = MOODS.NEUTRAL, wasRescued = false, rescueCount = 0 } = req.body || {};
  const _questionSetCode = token || rawQuestionSetCode;
  let allQuestions = providedQuestions;
  const stage = resolveInterviewStage(rawStage, interviewMode, interviewType);
  const resolvedRuntimeMode = normalizeInterviewRuntimeMode(interviewRuntimeMode);
  const runtime = buildInterviewRuntime(resolvedRuntimeMode);

  // Fix #8: Declare safeQuestionNumber BEFORE buildCanonicalFollowUpPayload so the
  // closure can reference it without a ReferenceError (const is not hoisted).
  const parsedQuestionNumber = Number(questionNumber);
  let safeQuestionNumber = Number.isFinite(parsedQuestionNumber) && parsedQuestionNumber >= 1
    ? Math.floor(parsedQuestionNumber)
    : 2;
  const parsedTotalQuestions = Number(totalQuestions);
  const safeTotalQuestions = Number.isFinite(parsedTotalQuestions) && parsedTotalQuestions >= 1
    ? Math.min(20, Math.floor(parsedTotalQuestions))
    : 8;

  if (questionSource !== 'admin-custom' && safeQuestionNumber > safeTotalQuestions + 1) {
    return res.status(400).json({ error: 'Invalid interview question sequence' });
  }

  const buildCanonicalFollowUpPayload = (payload = {}) => {
    const turn = Number(payload?.questionMeta?.sequence);
    return {
      ...payload,
      mode: resolvedRuntimeMode,
      status: payload.complete ? 'completed' : 'in_progress',
      turn: Number.isFinite(turn) ? turn : null,
      nextQuestion: payload.nextQuestion || payload.followUpQuestion || null,
      telemetry: payload.telemetry || buildVoiceTelemetrySnapshot({
        previousTelemetry: req.body?.telemetry || {},
        turnNumber: Number.isFinite(turn) ? turn : safeQuestionNumber,
        previousStage: req.body?.previousStage || req.body?.telemetry?.currentStage || stage,
        nextStage: stage,
        responseLatencyMs: Date.now() - requestStartTime,
        mode: resolvedRuntimeMode,
      }),
    };
  };
  const withRuntime = (payload) => ({
    ...buildCanonicalFollowUpPayload(payload),
    interviewRuntimeMode: resolvedRuntimeMode,
    runtime,
  });
  let customAttempt = null;
  let customCurrentQuestionText = '';

  try {
    // ─── Admin Custom Question Set Flow ───
    if (questionSource === 'admin-custom' && !_questionSetCode) {
      return res.status(400).json({ error: 'Custom interview code is required' });
    }
    if (questionSource === 'admin-custom' && _questionSetCode) {
      const { data: attempt, error: attemptError } = await _supabaseAdmin
        .from('admin_interview_attempts')
        .select('id, question_set_id, user_id, stage, current_question_index, current_question_started_at, responses, expires_at, completed_at, question_snapshot')
        .eq('id', attemptId || '')
        .single();
      if (attemptError || !attempt) {
        return res.status(404).json({ error: 'Interview attempt not found' });
      }
      customAttempt = attempt;
      if (new Date(attempt.expires_at).getTime() <= Date.now()) {
        return res.status(410).json({ error: 'This interview attempt has expired' });
      }
      if (attempt.completed_at) {
        return res.status(409).json({ error: 'This interview attempt is already complete' });
      }
      if (attempt.user_id && attempt.user_id !== req.user?.id) {
        return res.status(403).json({ error: 'Interview attempt belongs to another user' });
      }

      const { data: questionSet, error: questionSetError } = await _supabaseAdmin
        .from('admin_question_sets')
        .select('questions, is_active, requires_login, share_code')
        .eq('id', attempt.question_set_id)
        .single();
      if (questionSetError || !questionSet || !questionSet.is_active || questionSet.share_code !== _questionSetCode) {
        return res.status(410).json({ error: 'This interview is no longer available' });
      }
      if (questionSet.requires_login && !req.user) {
        return res.status(401).json({ error: 'Login required for this interview' });
      }
      // The attempt snapshot keeps the admin's published sequence stable even
      // if the question set is edited while this candidate is interviewing.
      allQuestions = Array.isArray(attempt.question_snapshot) && attempt.question_snapshot.length > 0
        ? attempt.question_snapshot
        : (Array.isArray(questionSet.questions) ? questionSet.questions : []);
      if (allQuestions.length === 0) {
        return res.status(400).json({ error: 'Question set has no questions configured' });
      }
      const nextQuestionIndex = attempt.current_question_index + 1;
      const attemptComplete = nextQuestionIndex >= allQuestions.length;
      const currentQuestionItem = allQuestions[attempt.current_question_index];
      const currentQuestionText = typeof currentQuestionItem === 'string'
        ? currentQuestionItem
        : (currentQuestionItem?.question || '');
      customCurrentQuestionText = currentQuestionText;
      const configuredTimeLimit = Number(currentQuestionItem?.timeLimit);
      const elapsedForQuestion = Math.max(
        0,
        Math.round((Date.now() - new Date(attempt.current_question_started_at).getTime()) / 1000),
      );
      const storedResponses = Array.isArray(attempt.responses) ? attempt.responses : [];
      const answerText = String(userAnswer || '').trim();
      if (answerText.length > 20000) {
        return res.status(400).json({ error: 'Interview response is too large' });
      }
      const nextResponses = answerText
        ? [...storedResponses, {
          role: 'candidate',
          status: 'answered',
          question: currentQuestionText,
          content: answerText,
          questionIndex: attempt.current_question_index,
          elapsedSeconds: elapsedForQuestion,
          overTime: Number.isFinite(configuredTimeLimit) && elapsedForQuestion > configuredTimeLimit + 10,
          code: typeof code === 'string' ? code.slice(0, 50000) : undefined,
          timestamp: new Date().toISOString(),
        }]
        : [...storedResponses, {
          role: 'candidate',
          status: 'skipped',
          question: currentQuestionText,
          content: '',
          questionIndex: attempt.current_question_index,
          elapsedSeconds: elapsedForQuestion,
          timestamp: new Date().toISOString(),
        }];
      const updatePayload = attemptComplete
        ? { completed_at: new Date().toISOString(), completion_reason: 'completed', responses: nextResponses }
        : {
          current_question_index: nextQuestionIndex,
          current_question_started_at: new Date().toISOString(),
          responses: nextResponses,
        };
      const { data: updatedAttempt, error: updateError } = await _supabaseAdmin
        .from('admin_interview_attempts')
        .update(updatePayload)
        .eq('id', attempt.id)
        .eq('current_question_index', attempt.current_question_index)
        .is('completed_at', null)
        .select('id')
        .maybeSingle();
      if (updateError || !updatedAttempt) {
        return res.status(409).json({ error: 'Interview attempt has already advanced' });
      }
      safeQuestionNumber = nextQuestionIndex + 1;
    }
    if (questionSource === 'admin-custom' && Array.isArray(allQuestions) && allQuestions.length > 0) {
      const qIndex = safeQuestionNumber - 1;
      const isComplete = qIndex >= allQuestions.length;
      const evaluated = evaluateFresherAnswer(userAnswer, customAttempt?.stage || stage, code);

      const feedbackOptions = [
        'Good answer, thank you for sharing that.',
        'That is clear and well-explained.',
        'Thank you for your response. Let us proceed.',
        'Great points! I appreciate the detail you provided.',
        'Understood, thank you for walking me through your thoughts.'
      ];
      let feedbackMessage = deterministicPick(feedbackOptions, safeQuestionNumber);

      const nextQItem = !isComplete ? allQuestions[qIndex] : null;
      const nextQText = !isComplete
        ? (typeof nextQItem === 'string' ? nextQItem : (nextQItem?.question || 'Next question'))
        : '';

      if (nvidiaVoiceService.isConfigured() && typeof userAnswer === 'string' && userAnswer.trim().length > 5) {
        try {
          const naturalTransition = await nvidiaVoiceService.generateInterviewerTransition({
            currentQuestion: customCurrentQuestionText,
            candidateAnswer: userAnswer,
            nextQuestion: isComplete ? '' : nextQText,
            interviewerName: req.body?.interviewerName || 'Interviewer',
          });
          if (naturalTransition) {
            feedbackMessage = naturalTransition;
          }
        } catch {
          // Keep deterministic feedback on failure
        }
      }

      if (isComplete) {
        return res.json(withRuntime({
          feedback: feedbackMessage || 'Thank you! You have answered all the questions for this interview.',
          followUpQuestion: '',
          closingRemark: 'That concludes our interview session today. Thank you for your time!',
          complete: true,
          score: evaluated.score,
          strengths: evaluated.strengths,
          improvements: evaluated.improvements,
          interviewerReaction: 'encouraging',
          thinkTime: 0,
          questionSource: 'admin-custom',
          questionMeta: {
            id: null,
            track: 'admin-custom',
            sequence: null,
          },
        }));
      }

      const nextQContext = typeof nextQItem === 'object' ? nextQItem?.context : null;
      const nextQTopics = typeof nextQItem === 'object' && Array.isArray(nextQItem?.expectedTopics) ? nextQItem.expectedTopics : [];
      const nextQTimeLimit = typeof nextQItem === 'object' ? nextQItem?.timeLimit : null;

      return res.json(withRuntime({
        feedback: feedbackMessage,
        followUpQuestion: nextQText,
        complete: false,
        score: evaluated.score,
        strengths: evaluated.strengths,
        improvements: evaluated.improvements,
        interviewerReaction: 'probing',
        thinkTime: nextQTimeLimit || 30,
        tips: nextQTopics.length > 0 ? [`Focus on: ${nextQTopics.join(', ')}`] : ['Keep your response structured and clear.'],
        questionSource: 'admin-custom',
        questionMeta: {
          id: `admin-q-${safeQuestionNumber}`,
          track: 'admin-custom',
          sequence: safeQuestionNumber,
          context: nextQContext,
          expectedTopics: nextQTopics,
        },
      }));
    }
  const normalizedAdvanced = resolveResumeInterviewModeForExperience(
    normalizeAdvancedOptions(advancedOptions),
    experienceLevel,
    resumeContext
  );
  const fresherScriptMode = normalizedAdvanced.resumeInterviewMode === 'fresher-hr-tech';
  const personalizedQuestionSource = resumeContext ? 'resume' : 'ai';
  const isFresherTechnical = fresherScriptMode && stage === 'Technical';
  const isFresherHR = fresherScriptMode && stage === 'HR';
  const staticQuestions = getStaticInterviewQuestions(stage);

  // Fresher-HR Hybrid Mode: Q1 fixed, Q2-Q11 AI-generated (different each interview), Q12 wrap-up, Q13 closing
    if (isFresherHR) {
      const qNum = safeQuestionNumber;
      const isQ12 = qNum === 12;
      const isQ13 = qNum === 13;
      const isQ2To11 = qNum >= 2 && qNum <= 11;
      const isQ1 = qNum === 1;
      const isLastQuestion = qNum > 13;

      const feedbackOptions = [
        'That\'s great to hear! Thank you for sharing that.',
        'I appreciate your openness and clear example there.',
        'That shows real self-awareness and growth mindset.',
        'Wonderful! You gave a thoughtful and genuine answer.',
        'Excellent! You\'ve demonstrated great interpersonal awareness.',
        'That\'s really thoughtful. I like how you framed that.',
      ];
      const feedbackMessage = deterministicPick(feedbackOptions, qNum);

      let followUpQuestion = '';
      let closingRemark = undefined;
      let isComplete = false;

      if (isLastQuestion) {
        isComplete = true;
        closingRemark = FRESHER_HR_CLOSINGS.NO;
      } else if (isQ13) {
        // Q13: Check if candidate had questions; if yes, provide closing; if no, show default closing
        const hasQuestions = userAnswer && userAnswer.toLowerCase().includes('yes');
        closingRemark = getFresherHRClosing(hasQuestions);
        isComplete = true;
      } else if (isQ12) {
        // Q12: Ask fixed wrap-up question
        followUpQuestion = FRESHER_HR_FIXED.Q12 || 'Do you have any questions for me about the role, the team, or our company?';
      } else if (isQ1) {
        // Safety fallback: if caller sends qNum=1, return opening question
        const aiQuestion = await generateFresherHRQuestion(1, resumeContext);
        followUpQuestion = aiQuestion || 'Let\'s start with a behavioral question.';
      } else if (isQ2To11) {
        // Q2-Q11: Generate the exact next question requested by qNum
        const aiQuestion = await generateFresherHRQuestion(qNum, resumeContext);
        followUpQuestion = aiQuestion || 'Let\'s continue to the next question.';
      } else {
        // Should not reach here
        followUpQuestion = 'Do you have any questions for me?';
      }

      const nextQNumForMeta = isComplete ? null : qNum;
      const isNextQuestionAIGenerated = nextQNumForMeta !== null && nextQNumForMeta >= 2 && nextQNumForMeta <= 11;

      const evaluated = evaluateFresherAnswer(userAnswer, 'HR', code);

      return res.json(withRuntime({
        feedback: feedbackMessage,
        followUpQuestion: isComplete ? '' : followUpQuestion,
        closingRemark: isComplete ? closingRemark : undefined,
        complete: isComplete,
        score: evaluated.score,
        strengths: evaluated.strengths,
        improvements: evaluated.improvements,
        interviewerReaction: isComplete ? 'encouraging' : 'probing',
        thinkTime: 20,
        hint: 'Answer naturally and relate your response to your experience and values.',
        difficultyLevel: 'medium',
        adaptiveNote: `Fresher-HR Q${Math.min(qNum, 13)} of 13 (AI-generated behavioral sequence).`,
        questionSource: 'fresher-hr-dynamic',
        questionMeta: {
          id: nextQNumForMeta === null ? null : `fresher-hr-q-${nextQNumForMeta}`,
          track: 'fresher-hr',
          sequence: nextQNumForMeta,
          isAIGenerated: isNextQuestionAIGenerated,
        },
      }));
    }
  // Fresher-Technical Hybrid Mode: Q1 fixed, Q2-Q11 AI-generated, Q12-Q13 fixed
  if (isFresherTechnical) {
    const qNum = safeQuestionNumber;
    const isQ12 = qNum === 12;
    const isQ13 = qNum === 13;
    const isQ2To11 = qNum >= 2 && qNum <= 11;
    const isLastQuestion = qNum > FRESHER_INTERVIEW_TOTAL_QUESTIONS;

    const feedbackOptions = [
      'That\'s a solid approach! I like how you explained that.',
      'Good thinking! I can see you have hands-on experience.',
      'I appreciate the detail there. Let\'s explore a bit more.',
      'Nice! You covered the key points clearly.',
      'Excellent! You have a practical understanding.'
    ];
    const fillerOptions = ['Hmm. ', 'Right. ', 'Okay, ', 'Got it. ', 'Make sense. '];
    const feedbackMessage = deterministicPick(fillerOptions, qNum * 3) + deterministicPick(feedbackOptions, qNum);

    let followUpQuestion = '';
    let closingRemark = undefined;
    let isComplete = false;

    if (isLastQuestion) {
      isComplete = true;
      closingRemark = FRESHER_TECHNICAL_FIXED.Q13_NO; // Default: no follow-up questions
    } else if (isQ13) {
      // Q13: Check if candidate had questions; if yes, provide closing; if no, show default closing
      const hasQuestions = userAnswer && userAnswer.toLowerCase().includes('yes');
      closingRemark = hasQuestions ? FRESHER_TECHNICAL_FIXED.Q13_YES : FRESHER_TECHNICAL_FIXED.Q13_NO;
      isComplete = true;
    } else if (isQ12) {
      // Q12: Ask fixed wrap-up question
      followUpQuestion = FRESHER_TECHNICAL_FIXED.Q12;
    } else if (isQ2To11) {
      // Q2-Q11: Generate the exact next question requested by qNum
      followUpQuestion = await generateFresherTechnicalQuestion(qNum, resumeContext);
      if (!followUpQuestion) {
        // Fallback if AI generation fails
        const topicData = getFresherTechnicalAIPrompt(qNum);
        followUpQuestion = `Let's move on to the next topic: ${topicData?.topic}. Can you tell me more about this?`;
      }
    } else {
      // Should not reach here
      followUpQuestion = FRESHER_TECHNICAL_FIXED.Q12;
    }

    const nextQNumForMeta = isComplete ? null : qNum;
    const evaluated = evaluateFresherAnswer(userAnswer, 'Technical', code);

    return res.json(withRuntime({
      feedback: feedbackMessage,
      followUpQuestion: isComplete ? '' : followUpQuestion,
      closingRemark: isComplete ? closingRemark : undefined,
      complete: isComplete,
      score: evaluated.score,
      strengths: evaluated.strengths,
      improvements: evaluated.improvements,
      interviewerReaction: isComplete ? 'encouraging' : 'probing',
      thinkTime: 20,
      hint: 'Explain your reasoning step by step, then mention trade-offs or real-world use cases.',
      difficultyLevel: 'medium',
      adaptiveNote: `Fresher-Technical Q${qNum} of ${FRESHER_INTERVIEW_TOTAL_QUESTIONS} (Hybrid: ${isQ2To11 ? 'AI-generated' : isQ12 ? 'wrap-up' : isQ13 ? 'conclusion' : 'fixed'}).`,
      questionSource: 'fresher-technical-hybrid',
      questionMeta: {
        id: nextQNumForMeta === null ? null : `fresher-technical-q-${nextQNumForMeta}`,
        track: 'fresher-technical',
        sequence: nextQNumForMeta,
        isAIGenerated: nextQNumForMeta !== null && nextQNumForMeta >= 2 && nextQNumForMeta <= 11,
      },
    }));
  }

  if ((questionSource === 'scripted' || !groq) && staticQuestions.length > 0) {
    const nextQuestion = getStaticInterviewQuestion(stage, safeQuestionNumber);
    const isLastQuestion = safeQuestionNumber > staticQuestions.length;
    const safeQuestionIdx = Math.min(Math.max(safeQuestionNumber - 1, 0), staticQuestions.length - 1);
    const resolvedNextQuestion = isLastQuestion
      ? ''
      : (nextQuestion || staticQuestions[safeQuestionIdx] || '');

    return res.json(withRuntime({
      feedback: stage === 'HR'
        ? 'That was a thoughtful response. Let us continue the discussion with the next HR question.'
        : 'Good response. Let us continue with the next technical question.',
      followUpQuestion: resolvedNextQuestion,
      closingRemark: isLastQuestion ? getStaticInterviewClosing(stage) : undefined,
      complete: isLastQuestion,
      score: stage === 'HR' ? 78 : 80,
      strengths: stage === 'HR'
        ? ['Clear communication', 'Relevant examples']
        : ['Structured thinking', 'Technical clarity'],
      improvements: stage === 'HR'
        ? ['Add one concrete example', 'Keep answers concise and outcome-focused']
        : ['Mention complexity clearly', 'Call out edge cases earlier'],
      interviewerReaction: isLastQuestion ? 'encouraging' : 'probing',
      thinkTime: 20,
      hint: stage === 'HR'
        ? 'Answer naturally and relate your response to your experience.'
        : 'Explain your reasoning step by step, then mention trade-offs.',
      difficultyLevel: 'medium',
      adaptiveNote: `Scripted ${String(stage).toLowerCase()} sequence question ${Math.min(safeQuestionNumber, staticQuestions.length)} of ${staticQuestions.length}.`,
      questionSource: 'scripted',
      questionMeta: { id: `${String(stage).toLowerCase()}-q-${Math.min(safeQuestionNumber, staticQuestions.length)}`, track: String(stage).toLowerCase(), sequence: Math.min(safeQuestionNumber, staticQuestions.length) },
    }));
  }
  
  // Fresher topics mapping
  const getFresherTopic = (qNum) => {
    switch (qNum) {
      case 2: return "Resume & Experience: Ask them to elaborate on a project listed in their resume (or a general past project if no resume).";
      case 3: return "Technical Skills: Ask them about a specific language or framework they are confident in, and how they used it practically.";
      case 4: return "Object-Oriented Programming (OOP) Core: Ask them to explain a foundational OOP concept (like the 4 pillars) with a real-world example.";
      case 5: return "OOP Applied: Ask them to compare two OOP concepts (like Interface vs Abstract Class) and when to use each.";
      case 6: return "SQL / Databases: Ask them about foundational SQL concepts (like JOINs or Normalization).";
      case 7: return "Database Design: Ask them about Primary/Foreign Keys, Indexes, or typical database performance optimization.";
      case 8: return "Programming Language / Core: Ask them to explain a core programming language concept (e.g., pass-by-value vs pass-by-reference).";
      case 9: return "OS Fundamentals: Ask an operating system fundamental (like Process vs Thread or Memory Management).";
      case 10: return "Networking / Web: Ask about REST APIs, HTTP methods, or the client-server request cycle.";
      case 11: return "Data Structures: Ask about a fundamental data structure (arrays, linked lists, stacks, queues, trees) and when to use it.";
      case 12: return "Wrap Up: Ask if they have any questions for you about the company, team, or the role.";
      case 13: return "Conclusion: Warmly answer the candidate's questions and strictly conclude the interview.";
      default: return "Technical Deep Dive";
    }
  };

  // If using real questions, get the next question from the bank
  let nextRealQuestion = null;
  let realQuestionMeta = null;
  if (useRealQuestions && questionBankIds && questionBankIds.length > 0) {
    const nextIdx = safeQuestionNumber - 1; // questionNumber is 1-indexed, and we want the next one
    if (nextIdx < questionBankIds.length) {
      const { getQuestionById } = await import('../../services/companyQuestionService.js');
      nextRealQuestion = await getQuestionById(questionBankIds[nextIdx]);
      if (nextRealQuestion) {
        realQuestionMeta = { id: nextRealQuestion.id, tags: nextRealQuestion.tags, difficulty: nextRealQuestion.difficulty, frequencyScore: nextRealQuestion.frequencyScore };
      }
    }
  }

  // Get reference answer for current question if available
  let referenceAnswer = null;
  if (useRealQuestions && currentQuestionId) {
    const { getQuestionById: getQ } = await import('../../services/companyQuestionService.js');
    const currentQ = await getQ(currentQuestionId);
    if (currentQ?.answer) referenceAnswer = currentQ.answer;
  }

  if (!groq) {
      const reactions = [
        "Makes sense, I like how you broke that down.",
        "That's interesting. I see where you're going with that.",
        "Got it, that's a very practical way to look at it.",
        "Right, that aligns with how we'd think about it here.",
        "Nice, I appreciate the detail you went into there.",
        "Good insight. Let's explore a slightly different angle on that.",
        "Ah, I see. That's a clever way to handle it."
      ];
      // Diverse follow-ups per stage — rotates based on questionNumber
      const stageQuestions = {
        'Technical': [
          'So tell me — when you think about abstract classes versus interfaces, how do you usually decide which one to use?',
          'I\'m curious how garbage collection works in the language you use most. Can you walk me through it?',
          'Concurrency and parallelism often get mixed up. How would you explain the difference using a real-world example?',
          'If you had to explain how a hash map works internally, including handling collisions, how would you describe it?',
          'Have you come across the SOLID principles? If so, could you pick one and give me a quick example of how you\'d apply it?',
          'Imagine a scenario where your app is running really slow in production, but CPU usage looks completely normal. How would you start debugging that?',
          'I\'d love to hear your thoughts on the CAP theorem. How does it actually influence the way you pick a database?',
          'Can you walk me through the event loop in Node.js? I\'m curious how you think about its async behavior.',
        ],
        'DSA / Coding': [
          'Alright, let\'s talk about linked lists. If you needed to detect a cycle in one, how would you approach it?',
          'If you had an unsorted array and needed to find the kth largest element, what data structure would you lean towards?',
          'How would you go about serializing and deserializing a binary tree? What traversal makes the most sense to you?',
          'Suppose you have a string of parentheses. How would you check if they\'re balanced, especially if there are multiple types?',
          'If you had to merge two sorted arrays entirely in-place, without extra space, how would you do that?',
          'I\'m curious how you\'d implement an LRU cache from scratch. What data structures would you bring together for that?',
          'How would you tackle finding the longest increasing subsequence in an array? Just walk me through your initial thoughts.',
          'Given a matrix of 0s and 1s, what would be your strategy to count the number of islands?',
        ],
        'System Design': [
          'So, if you had to design a real-time chat app like WhatsApp from scratch, what would your architecture look like, especially for message delivery guarantees?',
          'Walk me through how you\'d design a news feed system similar to Instagram. I\'m particularly interested in how you\'d handle the ranking.',
          'If we needed an API rate limiter, how would you design that? What specific algorithms come to mind?',
          'Imagine designing a notification system that scales to millions of users. How would you ensure messages actually get delivered?',
          'How would you approach designing a key-value store similar to Redis? I\'m curious about your thoughts on replication.',
          'If you were tasked with building a search autocomplete system, what would your strategy be to keep the latency as low as possible?',
          'Let\'s say we\'re building a video streaming platform. How would you handle CDN and adaptive bitrate streaming?',
          'Walk me through designing a system for a parking lot. How would you set up the initial object model before we talk about scaling?',
        ],
        'Behavioral': [
          'Tell me about a time you worked on a challenging group project. How did you navigate any disagreements within the team?',
          'I\'d love to hear about a hackathon or competition you joined. What was your specific role and what did you build?',
          'Can you share a time when you had to pick up a completely new skill or technology under a really tight deadline?',
          'We\'ve all had projects that didn\'t go quite as planned. Can you tell me about one of yours and what your main takeaway was?',
          'Tell me about a period where you had to juggle multiple deadlines. How did you figure out what to prioritize?',
          'I\'m curious — can you share an experience where you helped a classmate or a junior team member understand something tricky?',
          'Tell me about a time you just decided to take the initiative on something, maybe a club, a side hustle, or a new project.',
          'Describe a situation where you honestly weren\'t sure how to approach a problem. How did you get yourself unblocked?',
        ],
        'HR': [
          'So, what actually motivates you to pursue a career in tech? What gets you excited to sit down and build things?',
          'I know it\'s a bit of a cliché, but where do you honestly see yourself in a few years, and how does this role fit into that?',
          'What really made you choose your specific branch of study? Has it turned out to be what you expected?',
          'What kind of day-to-day work environment do you feel you do your best work in? Are you more of a solo worker or highly collaborative?',
          'Can you tell me about a specific value or principle that really guides the way you approach your work?',
          'Looking back at your college experience so far, what\'s something you\'re genuinely really proud of?',
          'If I were to ask your close friends or classmates to describe you in a few words, what do you think they\'d say?',
          'So, before we wrap up — what questions do you have for me about what it\'s actually like working here?',
        ],
        'Managerial': [
          'Have you ever had to step up and coordinate a team, maybe for a college event or a major project? How did that go?',
          'Tell me about a time you really had to convince your team to go with your approach. How did you handle the pushback?',
          'When things get really stressful, like during finals or a tight project deadline, how do you keep yourself and everyone else motivated?',
          'If you were suddenly put in charge of organizing a technical workshop, what would your first few steps look like?',
          'How have you handled a situation where someone on your team just wasn\'t pulling their weight on a project?',
          'When everything feels like a priority and you have multiple deadlines, what\'s your actual system for managing your time?',
          'Do you enjoy the mentorship side of things? Tell me about a time you actively helped someone learn a new concept.',
          'Tell me about a genuinely tough decision you had to make recently, whether it was about a project, a job, or your studies.',
        ],
        'OA': [
          'Alright, so given an array of integers, how would you find the contiguous subarray that gives the maximum sum? Just talk me through your thought process.',
          'If you needed to check if a string is a valid palindrome, ignoring all non-alphanumeric characters, how would you approach it?',
          'Walk me through the algorithm you\'d use to find all permutations of a string. How does the time complexity look?',
          'If you have two sorted arrays and need to find the overall median in O(log n) time, how would you tackle that?',
          'I\'m curious how you\'d implement a stack that can return the minimum element in O(1) time. What\'s the trick there?',
          'Given a 2D grid, what algorithm would you reach for first to find the shortest path from the top-left to the bottom-right?',
          'How would you design an algorithm to rotate a matrix 90 degrees clockwise directly in-place?',
          'If you have an array of n+1 integers, where each integer is between 1 and n, how would you reliably detect a duplicate?',
        ],
      };
      const questions = stageQuestions[stage] || stageQuestions['Technical'];
      const qIdx = ((safeQuestionNumber || 1) - 1) % questions.length;
      const isLast = safeQuestionNumber > safeTotalQuestions;

      return res.json(withRuntime({
        feedback: deterministicPick(reactions, safeQuestionNumber),
        followUpQuestion: isLast ? '' : (nextRealQuestion ? nextRealQuestion.question : questions[qIdx]),
        closingRemark: isLast ? `Thank you so much for your time today! You've given some really thoughtful answers. We'll be in touch soon with next steps. Best of luck!` : undefined,
        score: deterministicScore(65, 25, safeQuestionNumber + (userAnswer?.length || 0)),
        strengths: [
          deterministicPick(['Clear communication', 'Structured thinking', 'Good examples'], safeQuestionNumber),
          deterministicPick(['Technical depth', 'Problem-solving mindset', 'Practical approach'], safeQuestionNumber + 1)
        ],
        improvements: [
          deterministicPick(['Add more specific metrics', 'Consider edge cases', 'Discuss trade-offs'], safeQuestionNumber),
          deterministicPick(['Mention real-world experience', 'Think about scalability', 'Explore alternatives'], safeQuestionNumber + 1)
        ],
        interviewerReaction: deterministicPick(['encouraging', 'impressed', 'probing', 'neutral'], safeQuestionNumber),
        thinkTime: deterministicScore(30, 30, safeQuestionNumber),
        hint: deterministicPick(['Think about time vs space trade-offs', 'Consider the edge cases first', 'Try working through a small example', 'What would happen at scale?'], safeQuestionNumber),
        questionSource: nextRealQuestion ? 'database' : personalizedQuestionSource,
        questionMeta: realQuestionMeta || null,
      }));
    }

    const effectiveTotalQuestions = fresherScriptMode ? FRESHER_INTERVIEW_TOTAL_QUESTIONS : safeTotalQuestions;
    const isLastQuestion = safeQuestionNumber > effectiveTotalQuestions;

    // ─── Dead-End Detection & Rescue (Phase 3B) ───
    const answerWords = String(userAnswer || '').trim().split(/\s+/).filter(Boolean);
    const deadEndKeywords = [
      /\b(i don'?t know|no idea|not sure|can'?t remember|have no clue|no clue)\b/i,
      /\b(skip this|pass on this|give up|pass)\b/i,
      /\b(i do not have a response|i have no answer|no response)\b/i,
    ];
    const isExplicitDeadEnd = deadEndKeywords.some((p) => p.test(String(userAnswer || '')));
    const isTooShort = answerWords.length > 0 && answerWords.length < 15 && !code;
    const isStuckAnswer = isExplicitDeadEnd || isTooShort;

    if (isStuckAnswer && !wasRescued && Number(rescueCount || 0) === 0 && !isLastQuestion && previousQuestion) {
      const scaffoldHint = stage.includes('Coding') || stage.includes('DSA')
        ? "Let me rephrase that — what if I told you the answer involves a hash map or two-pointer approach? How would you structure that?"
        : stage.includes('System Design')
          ? "Let's break this down together — if we start with a simple client and a single database, what would be the first bottleneck you'd address?"
          : "Let me rephrase that — what if you think back to a specific coursework or team project experience? Walk me through what happened there.";

      return res.json(withRuntime({
        rescueMode: true,
        rescued: true,
        rescueCount: 1,
        score: 45,
        feedback: {
          content: "Let's take a step back and break this question down together.",
          score: 45,
          strengths: ["Willingness to explore another angle"],
          improvements: ["Break down complex problems into smaller components when stuck"],
        },
        followUpQuestion: scaffoldHint,
        microReaction: "No problem at all — let's break this down together.",
        interviewerMood: MOODS.CURIOUS,
        moodProfile: getMoodProfile(MOODS.CURIOUS),
        thinkTime: 35,
        hint: "Think about the simplest case first.",
        difficultyLevel: "easy",
        adaptiveNote: "Candidate stuck. Rescue mode activated with scaffolding.",
        complete: false,
      }));
    }

    if (fresherScriptMode) {
      const evaluated = evaluateFresherAnswer(userAnswer, stage, code);

      if (isLastQuestion) {
        const shouldClose = isFinalNoAnswer(userAnswer);

        if (!shouldClose) {
          const loopQuestion = `${buildHrResponseSnippet(userAnswer, company)} Do you have any other questions before we close today?`;

          return res.json(withRuntime({
            feedback: 'Good question. You are thinking in the right direction, and I appreciate your curiosity.',
            followUpQuestion: loopQuestion,
            closingRemark: '',
            complete: false,
            score: evaluated.score,
            strengths: evaluated.strengths,
            improvements: evaluated.improvements,
            interviewerReaction: 'encouraging',
            thinkTime: 20,
            hint: 'A concise, role-focused question is usually strongest at this stage.',
            difficultyLevel: 'medium',
            adaptiveNote: 'Scripted fresher flow waiting for explicit final "No" before closing.',
            questionSource: 'ai-scripted',
            questionMeta: { id: 'fresher-q-12-loop', track: 'fresher-hr-tech', sequence: 12 },
          }));
        }

        return res.json(withRuntime({
          feedback: 'Thank you for sharing your responses. You communicated clearly and handled the discussion with good composure.',
          followUpQuestion: '',
          closingRemark: HR_CLOSING_MESSAGE,
          complete: true,
          score: evaluated.score,
          strengths: evaluated.strengths,
          improvements: evaluated.improvements,
          interviewerReaction: 'encouraging',
          thinkTime: 0,
          hint: '',
          difficultyLevel: 'medium',
          adaptiveNote: 'Scripted fresher HR + fundamentals sequence complete.',
          questionSource: 'ai-scripted',
          questionMeta: { id: `fresher-q-${effectiveTotalQuestions + 1}`, track: 'fresher-hr-tech', sequence: effectiveTotalQuestions + 1 },
        }));
      }

      const nextQuestion = await generateFresherScriptedQuestion(safeQuestionNumber, company, resumeContext, userAnswer);

      return res.json(withRuntime({
        feedback: 'Good response. Your points were clear; adding one concrete result would make it stronger.',
        followUpQuestion: nextQuestion,
        complete: false,
        score: evaluated.score,
        strengths: evaluated.strengths,
        improvements: evaluated.improvements,
        interviewerReaction: safeQuestionNumber >= 11 ? 'encouraging' : 'probing',
        thinkTime: safeQuestionNumber >= 11 ? 20 : 35,
        hint: safeQuestionNumber >= 11 ? 'Ask about team structure, growth path, or first-90-day expectations.' : 'Use a simple structure: context, action, result.',
        difficultyLevel: 'medium',
        adaptiveNote: `Scripted fresher sequence question ${safeQuestionNumber} of ${effectiveTotalQuestions}.`,
        questionSource: 'ai-scripted',
        questionMeta: { id: `fresher-q-${safeQuestionNumber}`, track: 'fresher-hr-tech', sequence: safeQuestionNumber },
      }));
    }

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
    const feedbackPrompt = buildAnswerFeedbackPrompt();

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
    let realQuestionInstruction = '';
    
    if (fresherScriptMode && !isLastQuestion) {
      const topic = getFresherTopic(safeQuestionNumber);
      realQuestionInstruction = `

## CRITICAL: Fresher Interview Sequence
You are currently on Question ${safeQuestionNumber} of 12.
For this turn, you MUST evaluate the candidate's last answer and provide feedback.
Then, generating your next question, YOU MUST ASK A QUESTION STRICTLY ABOUT THIS TOPIC: "${topic}".
Do NOT ask a generic follow-up. Transition naturally to this new topic. Keep the question clear and suitable for a fresher level.`;
    } else if (nextRealQuestion && !isLastQuestion) {
      realQuestionInstruction = `

## IMPORTANT: Use This Exact Question as Your Follow-Up
You MUST use this question as your follow-up (present it naturally, in your own words, but keep the core question intact):
"${nextRealQuestion.question}"
Do NOT generate a different question. Transitions should be natural.`;
    }

    const messages = [
      {
        role: 'system',
        content: getInterviewerPersona(company, role, stage, difficulty, safeQuestionNumber, effectiveTotalQuestions, normalizedAdvanced, resumeContext, experienceLevel) + adaptivePrompt + memoryPrompt + codeContext + referenceContext + realQuestionInstruction + `

The candidate just answered a question. You must:
1. React naturally to their answer (say something like "Makes sense", "Got it")
2. Give extremely brief, actionable feedback internally (do not speak the "feedback" block aloud)
3. ${isLastQuestion ? 'This is the LAST answer. Provide a short, warm closing compliment.' : 'Ask a follow-up that digs deeper OR moves to a new topic naturally. Keep the spoken "followUpQuestion" to 1-2 sentences MAX.'}
4. Provide score, strengths, improvements
5. Include a subtle hint for the next question
6. Suggest think time in seconds

IMPORTANT: The "followUpQuestion" and "closingRemark" must sound exactly like a real human speaking casually on a Zoom call. No robotic transitions. Keep it under 3 sentences.
NATURAL SPEECH CONSTRAINTS (STRICT):
- Start with a natural reaction like "Makes sense," "Got it," "That's interesting," or "I see where you're going with that."
- Then smoothly transition into the question using conversational phrasing: "So tell me...", "I'm curious...", "Walk me through...", "What's your take on..."
- NEVER use generic robotic fillers like "Good response," "Great question," "Moving to the next question," or "Let us continue."
- Do not mention being AI.
- Keep the tone professional but warm and conversational.
- Ask ONE clear, focused question at a time. No multi-part questions.
- Do NOT repeat the candidate's full answer back to them.
- Avoid meta prompts such as "walk me through your approach step by step" unless the stage is explicitly DSA/Coding or System Design.
- Do not repeat the exact same follow-up wording twice in a row.
- For fresher Technical interviews, vary the angle across project, coursework, internship, fundamentals, and trade-offs instead of asking for the same concrete example repeatedly.
- Prefer concrete, topic-specific follow-ups tied to the current stage (e.g., OOP/DBMS/OS/networking for Technical; STAR context for Behavioral).
` + focusPrompt + feedbackPrompt + `

SCORING CALIBRATION RUBRIC (0-100 scale, USE FULL RANGE, DO NOT CLUSTER AROUND 70):
* 90-100: Exceptional, accurate response demonstrating thorough understanding, edge cases, trade-offs, and clear communication.
* 75-89: Solid, competent response that answers the core problem correctly with minor omissions.
* 55-74: Partial answer, vague explanations, or missing key trade-offs and edge cases.
* 30-54: Weak, incorrect, or heavily confused understanding of fundamental concepts.
* 0-29: Off-topic, blank, or completely non-functional response.

Respond as JSON:
{
  "feedback": "Internal evaluation of their answer (2 sentences)",
  "microReaction": "Spoken natural micro-reaction (1 sentence, e.g. 'Interesting approach.', 'Hmm, let me push back on that.', 'That is exactly right.')",
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
      ...truncateConversationHistory(conversationHistory || []).map(h => ({
        role: (h.role === 'interviewer' || h.role === 'clarification') ? 'assistant' : 'user',
        content: h.content
      })),
      { role: 'assistant', content: previousQuestion },
      { role: 'user', content: code ? `${userAnswer}\n\n[Code submitted in ${codeLanguage || 'unknown'}]:\n${code}` : userAnswer }
    ];

    const completion = await aiCallWithRetry({
      operation: () =>
        createGroqChatCompletion({
          model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
          messages,
          response_format: { type: 'json_object' },
          temperature: 0.75,
          max_tokens: 1000,
        }),
      timeoutMs: 30000,
      maxRetries: 2,
      baseDelayMs: 250,
    });

    const llmDurationMs = Date.now() - requestStartTime;
    console.log(`[Interview Latency] Q${safeQuestionNumber} LLM: ${llmDurationMs}ms (model: ${process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'})`);

    const rawContent = completion.choices[0].message.content;
    const result = safeJsonParse(rawContent);
    if (!result) {
      console.error('Follow-up JSON parse failed, raw:', rawContent?.substring(0, 300));
      throw new Error('AI returned malformed JSON');
    }
    const normalizedResult = normalizeInterviewFeedback(result, {
      stage,
      question: previousQuestion,
      answer: userAnswer,
    });
    const parsedScore = Number(result?.score);
    const resolvedScore = Number.isFinite(parsedScore)
      ? Math.max(0, Math.min(100, Math.round(parsedScore)))
      : 75;
    recordTurnScore(resolvedScore);

    const allScores = Array.isArray(cumulativeScores) && cumulativeScores.length > 0
      ? cumulativeScores
      : (Array.isArray(sessionScores) ? sessionScores : []);
    const updatedScores = [...allScores, resolvedScore];
    const moodResult = computeNextMood(clientMood, {
      score: resolvedScore,
      wordCount: answerWords.length,
      cumulativeScores: updatedScores,
    });
    const nextMood = moodResult.nextMood;
    const microReaction = getMicroReaction(nextMood, {
      customRemark: result?.microReaction,
      seed: safeQuestionNumber,
    });

    const companyStyle = getCompanyInterviewStyle(company);
    const wrapUpSequence = isLastQuestion ? [
      "That is all the formal questions I have for you today.",
      `Do you have any questions for me about the role, the team, or engineering at ${company}?`,
      `Thank you so much for your time today. We'll be in touch within a week with our decision and next steps.`,
    ] : null;

    res.json(withRuntime({
      ...normalizedResult,
      score: resolvedScore,
      companyStyle,
      // Completion is decided by the server's question budget, never by the
      // model: without this the frontend never learns the interview is over.
      complete: isLastQuestion,
      followUpQuestion: isLastQuestion ? '' : normalizedResult.followUpQuestion,
      closingRemark: isLastQuestion
        ? (result.closingRemark || getStaticInterviewClosing(stage))
        : undefined,
      closingSequence: isLastQuestion ? wrapUpSequence : undefined,
      multiPartClosing: isLastQuestion ? wrapUpSequence : undefined,
      interviewerReaction: result.interviewerReaction || 'neutral',
      interviewerMood: nextMood,
      moodProfile: getMoodProfile(nextMood),
      microReaction,
      thinkTime: result.thinkTime || 45,
      hint: normalizedResult.hint || 'Try breaking the problem into smaller parts',
      difficultyLevel: result.difficultyLevel || 'medium',
      adaptiveNote: result.adaptiveNote || null,
      codeFeedback: result.codeFeedback || null,
      questionSource: fresherScriptMode ? 'ai-scripted' : (nextRealQuestion ? 'database' : personalizedQuestionSource),
      questionMeta: fresherScriptMode ? { id: `fresher-q-${safeQuestionNumber}`, track: 'fresher-hr-tech', sequence: safeQuestionNumber } : (realQuestionMeta || null),
      referenceAnswer: referenceAnswer || null,
    }));
  } catch (error) {
    console.error('Follow-up error:', error.message?.substring(0, 200));
    if (res.headersSent) return;
    // Graceful fallback — contextual follow-up
    const technicalFallbackQuestions = experienceLevel === 'fresher'
      ? [
          'Can you connect that to a class project, internship, or side project you worked on?',
          'Can you give one concrete example from something you built or studied?',
          'Can you walk me through a specific project or coursework example that shows that in practice?',
          'What was the most challenging technical roadblock you encountered when implementing that, and how did you resolve it?',
          'If you had to test and validate this implementation thoroughly, what edge cases would you prioritize?',
          'How would you explain that concept in simple terms to a non-technical stakeholder or new team member?',
          'What performance or memory considerations would you keep in mind as this code scales up?',
          'Looking back, is there anything in your approach or design you would do differently now?',
          'How does this approach compare to an alternative method you considered or learned about?',
          'Can you walk me through the error handling or failure recovery strategy for this scenario?',
          'What tools, libraries, or debugging strategies did you find most useful during this process?',
          'Do you have any questions for me about the technical challenges our team tackles daily?'
        ]
      : [
          'Can you walk me through your approach step by step, including trade-offs?',
          'What alternative would you consider, and why?',
          'How would you apply that in a real system or team setting?',
          'What happens when concurrent access increases by an order of magnitude in this architecture?',
          'How would you instrument observability, telemetry, and metrics for this component in production?',
          'What failure modes or data consistency issues would you anticipate and mitigate?',
          'Can you break down the space and time complexity trade-offs you chose here?',
          'How would you structure unit and integration tests to prevent regressions in this logic?',
          'What security vulnerabilities or input sanitization concerns must be guarded against here?',
          'If this had to integrate with an asynchronous event-driven pipeline, what changes would you make?',
          'How would you manage schema migrations or backward compatibility for this design over time?',
          'Do you have any technical or architectural questions about our engineering stack?'
        ];
    const pickTechnicalFallbackQuestion = (seed = 0) => {
      const index = Math.abs(seed) % technicalFallbackQuestions.length;
      return technicalFallbackQuestions[index];
    };
    const hrFallbackQuestions = [
      'That makes sense. Can you tell me a bit more about your career goals and what you hope to achieve in the next few years?',
      'Can you tell me about a time you had to adapt quickly when project requirements suddenly changed?',
      'Describe a situation where you worked with a teammate who had a contrasting perspective or work style.',
      'What is an achievement or milestone you are particularly proud of, and what made it significant to you?',
      'How do you manage competing priorities when multiple deadlines land at the exact same time?',
      'Can you share an example of feedback you received in the past and how you put it into practice?',
      'What kind of work environment or team dynamic brings out your best performance?',
      'Do you have any questions for me about our culture, team, or expectations?'
    ];
    const pickHrFallbackQuestion = (seed = 0) => {
      const idx = Math.abs(seed) % hrFallbackQuestions.length;
      return hrFallbackQuestions[idx];
    };
    const fallbackFollowUps = {
      'HR': pickHrFallbackQuestion(safeQuestionNumber - 1),
      'Behavioral': 'Got it. Can you give me another example where you really had to take the initiative — maybe on a college project or in a club?',
      'DSA / Coding': 'I see your approach. How might you optimize that solution further? I\'m curious about the time and space complexity there.',
      'System Design': 'Good thinking. If we suddenly got 10x the traffic, how would your design handle it? What\'s the first thing you\'d scale?',
      'Technical': pickTechnicalFallbackQuestion(safeQuestionNumber - 1),
      'OA': 'Right. Here\'s a quick follow-up: what if the input size was 10 million? How would you change your approach?',
      'Managerial': 'That\'s a good example. How did you handle it if someone on the team disagreed with the approach you took?',
    };
    const defaultFallbackByExperience = pickTechnicalFallbackQuestion(safeQuestionNumber - 1);
    const fallbackFeedback = normalizeInterviewFeedback({
      feedback: 'That answer is a good start, but it needs one concrete example and a clearer takeaway.',
      strengths: [],
      improvements: [],
      hint: 'Add one real example and finish with the result or lesson learned.',
    }, {
      stage,
      question: previousQuestion,
      answer: userAnswer,
    });
    const fallbackScore = deterministicScore(72, 15, safeQuestionNumber + (userAnswer?.length || 0));
    const fallbackWordCount = String(userAnswer || '').trim().split(/\s+/).filter(Boolean).length;
    const fallbackMoodResult = computeNextMood(clientMood, { score: fallbackScore, wordCount: fallbackWordCount });
    const fallbackMicroReaction = getMicroReaction(fallbackMoodResult.nextMood, { seed: safeQuestionNumber });
    const fallbackIsComplete = safeQuestionNumber > safeTotalQuestions;
    const fallbackCompanyStyle = getCompanyInterviewStyle(company);
    const fallbackClosingSeq = fallbackIsComplete ? [
      "That is all the formal questions I have for you today.",
      `Do you have any questions for me about the role, the team, or engineering at ${company}?`,
      `Thank you so much for your time today. We'll be in touch within a week with next steps.`,
    ] : undefined;

    res.json(withRuntime({
      ...fallbackFeedback,
      companyStyle: fallbackCompanyStyle,
      complete: fallbackIsComplete,
      followUpQuestion: fallbackIsComplete
        ? ''
        : (fallbackFollowUps[stage] || defaultFallbackByExperience),
      closingRemark: fallbackIsComplete
        ? getStaticInterviewClosing(stage)
        : undefined,
      closingSequence: fallbackClosingSeq,
      multiPartClosing: fallbackClosingSeq,
      score: fallbackScore,
      interviewerReaction: 'encouraging',
      interviewerMood: fallbackMoodResult.nextMood,
      moodProfile: getMoodProfile(fallbackMoodResult.nextMood),
      microReaction: fallbackMicroReaction,
      thinkTime: 45,
    }));
  }
});


// ─── Get a hint for current question ───
router.post('/hint', optionalAuth, async (req, res) => {
  const { company, role, stage, currentQuestion, conversationHistory } = req.body || {};

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
        createGroqChatCompletion({
          model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
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
              content: String(h.content || '').substring(0, 500)
            })),
            { role: 'user', content: `I'm stuck on: "${currentQuestion}". Can you give me a hint?` }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
          max_tokens: 300,
        }),
      timeoutMs: 30000,
      maxRetries: 2,
      baseDelayMs: 250,
    });

    const result = safeJsonParse(completion.choices?.[0]?.message?.content || '');
    if (!result) throw new Error('Failed to parse hint response');
    res.json(result);
  } catch (error) {
    console.error('Hint error:', error.message);
    if (res.headersSent) return;
    res.status(500).json({ error: 'Failed to generate hint' });
  }
});


// ─── Rephrase Interview Question ───
router.post('/rephrase', optionalAuth, async (req, res) => {
  const { question, currentQuestion, company = 'Tech Company', stage = 'Technical' } = req.body || {};
  const targetQuestion = question || currentQuestion;

  try {
    if (!groq || !targetQuestion) {
      return res.status(400).json({ error: 'Missing requirements for rephrase' });
    }

    const completion = await aiCallWithRetry({
      operation: () =>
        createGroqChatCompletion({
          model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `You are an interviewer from ${company} conducting a ${stage} interview.
The candidate is struggling to answer the current question or is silent.
Rephrase the question to be simpler, more direct, and easier to understand.
Do not change the core topic, just make it more approachable.

Output ONLY a JSON object with this shape:
{
  "rephrased": "The simpler version of the question"
}`
            },
            { role: 'user', content: `Original question: "${targetQuestion}"` }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
          max_tokens: 300,
        }),
      timeoutMs: 8000,
      maxRetries: 2,
      baseDelayMs: 250,
    });

    const result = safeJsonParse(completion.choices?.[0]?.message?.content || '');
    if (!result) throw new Error('Failed to parse rephrase response');
    res.json(result);
  } catch (error) {
    console.error('Rephrase error:', error.message);
    if (res.headersSent) return;
    res.status(500).json({ error: 'Failed to rephrase question' });
  }
});


// ─── Real-time nudge for AICopilot NudgeBar ───
router.post('/nudge', optionalAuth, async (req, res) => {
  const { currentQuestion, partialAnswer, stage, company, role: _role } = req.body || {};

  try {
    if (!groq || !partialAnswer || partialAnswer.length < 20) {
      return res.json({ nudge: null });
    }

    const completion = await aiCallWithRetry({
      operation: () =>
        createGroqChatCompletion({
          model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
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
          max_tokens: 300,
        }),
      timeoutMs: 30000,
      maxRetries: 2,
      baseDelayMs: 250,
    });

    const result = safeJsonParse(completion.choices?.[0]?.message?.content || '');
    if (!result) throw new Error('Failed to parse nudge response');
    res.json(result);
  } catch (error) {
    console.error('Nudge error:', error.message?.substring(0, 100));
    if (res.headersSent) return;
    res.json({ nudge: null });
  }
});


// ─── AI Copilot suggestions ───
router.post('/copilot-suggest', optionalAuth, async (req, res) => {
  const { company, role, stage, currentQuestion, partialAnswer, jobDescription } = req.body || {};

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
        createGroqChatCompletion({
          model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
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

    const result = safeJsonParse(completion.choices?.[0]?.message?.content || '');
    if (!result) throw new Error('Failed to parse copilot response');
    res.json(result);
  } catch (error) {
    console.error('Copilot suggest error:', error.message);
    if (res.headersSent) return;
    res.status(500).json({ error: 'Failed to generate copilot suggestions' });
  }
});


// ─── Interruption & Clarification Handling (Phase 3C) ───
router.post('/clarify', customInterviewLimiter, optionalAuth, async (req, res) => {
  const {
    clarificationQuestion,
    currentQuestion = '',
    context = '',
    company = 'Google',
    role = 'Software Engineer',
    stage = 'Technical',
  } = req.body || {};

  const query = String(clarificationQuestion || '').trim();
  if (!query) {
    return res.status(400).json({ error: 'clarificationQuestion is required' });
  }

  try {
    if (!groq) {
      return res.json({
        clarification: 'Good clarification. You can assume standard input bounds and focus on optimal asymptotic complexity.',
        restateQuestion: true,
        spokenClarification: 'Good question. You can assume standard inputs and focus on an optimal solution.',
      });
    }

    const completion = await aiCallWithRetry({
      operation: () =>
        createGroqChatCompletion({
          model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `You are a real-time interviewer at ${company} conducting a ${stage} interview for ${role}.
The candidate just interrupted to ask a brief clarifying question:
Current Question: "${currentQuestion}"
Context: "${context}"

Instructions:
- Provide a direct, natural clarification in 1-2 sentences. Speak like a real senior engineer on a call.
- Answer scope, constraints, edge case assumptions, or format expectations clearly without solving the problem for them.
- Decide whether to restate the core question afterwards (true/false).
Respond in JSON:
{
  "clarification": "Clear and helpful 1-2 sentence clarification.",
  "restateQuestion": true,
  "spokenClarification": "Natural spoken response addressing their doubt directly."
}`,
            },
            {
              role: 'user',
              content: query,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.6,
          max_tokens: 250,
        }),
      timeoutMs: 8000,
      maxRetries: 1,
      baseDelayMs: 200,
    });

    const parsed = safeJsonParse(completion.choices?.[0]?.message?.content || '');
    const clarification = parsed?.clarification || 'Good question. You can assume typical scale and standard constraints.';
    const restateQuestion = parsed?.restateQuestion !== false;
    const spokenClarification = parsed?.spokenClarification || clarification;

    return res.json({
      clarification,
      restateQuestion,
      spokenClarification,
    });
  } catch (error) {
    console.error('Clarify endpoint error:', error.message?.substring(0, 150));
    return res.json({
      clarification: 'Good clarification. For this problem, assume valid inputs and optimize for the common case.',
      restateQuestion: true,
      spokenClarification: 'Good question. Assume standard valid inputs and focus on optimal complexity.',
    });
  }
});


// ─── Live Code Review During Coding Questions (Phase 7A) ───
router.post('/code-review-live', customInterviewLimiter, optionalAuth, async (req, res) => {
  const {
    code = '',
    language = 'javascript',
    currentQuestion = '',
    company = 'Google',
    role = 'Software Engineer',
  } = req.body || {};

  const cleanCode = String(code || '').trim();
  if (!cleanCode || cleanCode.length < 20) {
    return res.json({ observation: '' });
  }

  try {
    if (!groq) {
      let heuristic = 'I see your initial setup — looks clean.';
      if (/Map|HashMap|dict|unordered_map/i.test(cleanCode)) {
        heuristic = 'I see you are using a hash map — good choice for O(1) lookups.';
      } else if (/Set|HashSet/i.test(cleanCode)) {
        heuristic = 'Using a set to track seen elements is a smart approach.';
      } else if (/while|for/i.test(cleanCode) && /left|right|pointer/i.test(cleanCode)) {
        heuristic = 'Two-pointer approach — good direction to keep space optimal.';
      }
      return res.json({ observation: heuristic });
    }

    const completion = await aiCallWithRetry({
      operation: () =>
        createGroqChatCompletion({
          model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `You are an expert technical interviewer at ${company} interviewing a candidate for ${role} and watching them write live code for: "${currentQuestion}".
Current language: ${language}.
Provide ONE brief, natural, insightful 1-line spoken observation or encouraging comment about their data structure choice, base case handling, or algorithmic direction.
RULES:
- Maximum 1 sentence (under 18 words).
- Casual, encouraging, senior engineering tone (e.g. "I see you're using a HashMap — good choice for O(1) lookup.", "Nice base-case check on empty input.")
- NO spoilers or full solutions.
Respond in JSON:
{
  "observation": "1-sentence spoken observation"
}`,
            },
            {
              role: 'user',
              content: cleanCode.substring(0, 1200),
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.6,
          max_tokens: 150,
        }),
      timeoutMs: 8000,
      maxRetries: 1,
      baseDelayMs: 200,
    });

    const parsed = safeJsonParse(completion.choices?.[0]?.message?.content || '');
    const observation = String(parsed?.observation || '').trim();
    return res.json({ observation });
  } catch (err) {
    console.error('Code review live error:', err.message?.substring(0, 150));
    return res.json({ observation: '' });
  }
});


// ─── Fast Spoken Reply (Ultra-Low Latency Conversational Turn) ───
router.post('/fast-reply', customInterviewLimiter, optionalAuth, async (req, res) => {
  const startTime = Date.now();
  const clientAbortController = new AbortController();
  res.on('close', () => {
    if (!res.writableEnded) {
      clientAbortController.abort();
    }
  });

  const {
    company = 'Tech Company',
    role = 'Software Engineer',
    stage: rawStage = 'Technical',
    interviewMode,
    interviewType,
    previousQuestion = '',
    userAnswer = '',
    questionNumber = 2,
    totalQuestions = 8,
    _experienceLevel = 'fresher',
    lastScore,
    averageScore,
    cumulativeScores,
    conversationHistory = [],
    runningSummary = '',
  } = req.body || {};

  const stage = resolveInterviewStage(rawStage, interviewMode, interviewType);
  const adaptivePrompt = getAdaptiveDifficultyPrompt(lastScore, averageScore, cumulativeScores, company, stage);
  const parsedQuestionNumber = Number(questionNumber);
  const safeQuestionNumber = Number.isFinite(parsedQuestionNumber) && parsedQuestionNumber >= 1
    ? Math.floor(parsedQuestionNumber)
    : 2;
  const parsedTotalQuestions = Number(totalQuestions);
  const safeTotalQuestions = Number.isFinite(parsedTotalQuestions) && parsedTotalQuestions >= 1
    ? Math.min(20, Math.floor(parsedTotalQuestions))
    : 8;

  const isLastQuestion = safeQuestionNumber >= safeTotalQuestions;

  if (isLastQuestion) {
    const closingRemark = "That is all the formal questions I have for you today. Thank you so much for your time!";
    const wrapUpSequence = [
      "That is all the formal questions I have for you today.",
      `Do you have any questions for me about the role, the team, or engineering at ${company}?`,
      "Thank you so much for your time today. We'll be in touch within a week with our decision.",
    ];
    return res.json({
      microReaction: "Thank you for walking me through that.",
      followUpQuestion: "",
      closingRemark,
      closingSequence: wrapUpSequence,
      complete: true,
      thinkTime: 0,
      latencyMs: Date.now() - startTime,
    });
  }

  try {
    if (clientAbortController.signal.aborted || res.writableEnded) return;

    const reply = await callFastReply({
      previousQuestion,
      userAnswer,
      company,
      role,
      stage,
      questionNumber: safeQuestionNumber,
      totalQuestions: safeTotalQuestions,
      adaptivePrompt,
      history: conversationHistory,
      runningSummary,
      signal: clientAbortController.signal,
      userId: req.user?.id || null,
      ip: req.ip || null,
    });

    if (clientAbortController.signal.aborted || res.writableEnded) return;
    return res.json(reply);
  } catch (err) {
    if (clientAbortController.signal.aborted || res.writableEnded) return;
    console.warn('[Fast Reply] Router exception, using fallback:', err.message?.substring(0, 100));

    const fallbackTransitions = [
      'Got it, thanks for walking me through that.',
      'Understood, that makes sense.',
      'I see where you are going with that.',
      'Fair enough, that gives me good context.',
    ];
    const microReaction = deterministicPick(fallbackTransitions, safeQuestionNumber);
    const followUpFallback = 'Could you explain the key trade-offs and edge cases with that approach?';

    return res.json({
      microReaction,
      followUpQuestion: followUpFallback,
      complete: false,
      thinkTime: 45,
      latencyMs: Date.now() - startTime,
      modelUsed: 'deterministic-fallback',
      provider: 'deterministic-fallback',
    });
  }
});

// ─── Asynchronous Turn Evaluation & Rubric Scoring ───
router.post('/evaluate-turn', customInterviewLimiter, optionalAuth, async (req, res) => {
  const startTime = Date.now();
  const clientAbortController = new AbortController();
  res.on('close', () => {
    if (!res.writableEnded) {
      clientAbortController.abort();
    }
  });

  const {
    company = 'Tech Company',
    role = 'Software Engineer',
    stage: rawStage = 'Technical',
    previousQuestion = '',
    userAnswer = '',
    code = '',
    codeLanguage = '',
    questionNumber = 2,
    questionDifficulty = '',
    interviewerMood: clientMood = MOODS.NEUTRAL,
    sessionId = null,
  } = req.body || {};

  const userCapCheck = quotaGuard.checkUserCap({
    userId: req.user?.id || null,
    ip: req.ip || null,
  });
  if (!userCapCheck.allowed) {
    return res.status(429).json({
      error: userCapCheck.reason,
      code: 'DAILY_CAP_REACHED',
      turnsRemaining: 0,
    });
  }

  const stage = resolveInterviewStage(rawStage);
  const safeQuestionNumber = Math.max(1, Number(questionNumber) || 2);

  let difficultyTag = String(questionDifficulty || '').toLowerCase().trim();
  if (!['easy', 'medium', 'hard', 'staff_architectural'].includes(difficultyTag)) {
    if (/staff|principal|lead|architect/i.test(role) || stage === 'System Design') {
      difficultyTag = 'staff_architectural';
    } else if (safeQuestionNumber <= 1 || stage === 'HR') {
      difficultyTag = 'easy';
    } else if (safeQuestionNumber >= 4 || stage === 'DSA / Coding') {
      difficultyTag = 'hard';
    } else {
      difficultyTag = 'medium';
    }
  }

  try {
    if (clientAbortController.signal.aborted || res.writableEnded) {
      console.log(`[Async Turn Eval] Turn Q${safeQuestionNumber} aborted before processing. Discarding.`);
      return;
    }

    const evalResult = await callTurnScoring({
      previousQuestion,
      userAnswer,
      code,
      codeLanguage,
      company,
      role,
      stage,
      questionNumber: safeQuestionNumber,
      difficultyTag,
      sessionId,
      signal: clientAbortController.signal,
      userId: req.user?.id || null,
      ip: req.ip || null,
    });

    if (clientAbortController.signal.aborted || res.writableEnded) return;

    if (!evalResult?.turnRecorded) {
      quotaGuard.recordUserTurn({
        userId: req.user?.id || null,
        ip: req.ip || null,
      });
    }

    recordTurnScore(evalResult.score);

    const moodResult = computeNextMood(clientMood, {
      score: evalResult.score,
      wordCount: (userAnswer || '').split(/\s+/).filter(Boolean).length,
    });

    return res.json({
      ...evalResult,
      interviewerMood: moodResult.nextMood,
      questionDifficulty: difficultyTag,
      scoreDistribution: scoreDistributionStats,
    });
  } catch (err) {
    if (clientAbortController.signal.aborted || res.writableEnded) return;
    console.warn('[Async Turn Eval] Error, using heuristic evaluation:', err.message?.substring(0, 100));
    quotaGuard.recordUserTurn({
      userId: req.user?.id || null,
      ip: req.ip || null,
    });
    const words = (userAnswer || '').split(/\s+/).filter(Boolean).length;
    let fallbackScore = 70;
    if (words > 35) fallbackScore = 80;
    else if (words < 15) fallbackScore = 50;

    recordTurnScore(fallbackScore);
    return res.json({
      score: fallbackScore,
      dimensions: { correctness: 3, depth: 3, communication: 3, rawWeighted: 3.0 },
      evalModelUsed: 'heuristic-fallback',
      evalProvider: 'heuristic-fallback',
      isFallbackModel: true,
      questionDifficulty: difficultyTag,
      feedback: 'Answer recorded.',
      strengths: ['Good communication'],
      improvements: ['Elaborate with more concrete examples'],
      interviewerReaction: 'neutral',
      latencyMs: Date.now() - startTime,
    });
  }
});

export default router;
