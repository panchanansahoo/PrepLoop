import express from 'express';
import Groq from 'groq-sdk';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { optionalAuth, authenticateToken } from '../../middleware/auth.js';
import { supabaseAdmin } from '../../db/supabaseClient.js';
import { aiCallWithRetry } from '../../utils/aiClient.js';
import { getRandomQuestionSet, getFilteredQuestions, getQuestionCount } from '../../services/companyQuestionService.js';
import { buildInitialVoiceTelemetry, buildVoiceTelemetrySnapshot } from '../../utils/voiceTelemetry.js';
import { buildAnswerFeedbackPrompt, normalizeInterviewFeedback } from '../../utils/interviewFeedback.js';
import { evaluateFresherAnswer } from '../../services/interviewAnswerEvaluator.js';
import { groq, safeDeleteUploadFile, MAX_HISTORY_TURNS, truncateConversationHistory, deterministicScore, deterministicPick, safeJsonParse, UPLOAD_DIR, upload, COMPANY_CATEGORIES, getCompanyCategory, PERSONA_PROFILES, DEFAULT_ADVANCED_OPTIONS, INTERVIEW_RUNTIME_MODES, normalizeInterviewRuntimeMode, buildInterviewRuntime, STAGE_ALIASES, resolveInterviewStage, resolveResumeInterviewModeForExperience, normalizeAdvancedOptions, formatResumeContext, FRESHER_INTERVIEW_TOTAL_QUESTIONS, HR_CLOSING_MESSAGE, STATIC_INTERVIEW_QUESTIONS, STATIC_INTERVIEW_CLOSINGS, FRESHER_HR_FIXED, FRESHER_HR_TOPICS, FRESHER_HR_CLOSINGS, FRESHER_TECHNICAL_FIXED, FRESHER_TECHNICAL_TOPICS, getStaticInterviewQuestions, getStaticInterviewQuestion, getStaticInterviewClosing, getFresherTechnicalQuestion, getFresherTechnicalAIPrompt, getFresherHRQuestion, getFresherHRAIPrompt, getFresherHRClosing, INTERVIEWER_NAMES, pickFallbackInterviewerName, getResumeProjectPrompt, getTopSkillPrompt, buildHrResponseSnippet, getFresherScriptedQuestion, getFresherQuestionTopic, getFresherFallbackQuestion, isFinalNoAnswer, getInterviewerPersona, getCompanyChallengeProfile, getAdaptiveDifficultyPrompt, buildInterviewMemoryPrompt, buildFocusSignal } from './helpers.js';

const router = express.Router();

// ─── Start Interview ───
router.post('/start', optionalAuth, async (req, res) => {
  const requestStartTime = Date.now();
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
  } = req.body;
  const stage = resolveInterviewStage(rawStage, interviewMode, interviewType);
  const resolvedRuntimeMode = normalizeInterviewRuntimeMode(interviewRuntimeMode);
  const runtime = buildInterviewRuntime(resolvedRuntimeMode);
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
      telemetry: payload.telemetry || buildInitialVoiceTelemetry(stage, resolvedRuntimeMode),
    };
  };
  const withRuntime = (payload) => ({
    ...buildCanonicalStartPayload(payload),
    interviewRuntimeMode: resolvedRuntimeMode,
    runtime,
  });
  const normalizedAdvanced = resolveResumeInterviewModeForExperience(
    normalizeAdvancedOptions(advancedOptions),
    experienceLevel,
    resumeContext
  );
  const fresherScriptMode = normalizedAdvanced.resumeInterviewMode === 'fresher-hr-tech';
  const requestedCount = Number(totalQuestions);
  const resolvedTotalQuestions = Number.isFinite(requestedCount) && requestedCount >= 4 && requestedCount <= 12
    ? Math.round(requestedCount)
    : normalizedAdvanced.questionCount;
  const interviewTotalQuestions = fresherScriptMode ? FRESHER_INTERVIEW_TOTAL_QUESTIONS : resolvedTotalQuestions;
  const personalizedQuestionSource = resumeContext ? 'resume' : 'ai';
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
        totalQuestions: 12,
        advancedOptions: { ...normalizedAdvanced, questionCount: 12 },
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

  if (staticQuestions.length > 0) {
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

  try {
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
        HR: `Hey! Welcome to your HR interview at ${company}. Tell me about yourself and what excites you about this role.`,
        Behavioral: `Hey! Welcome to your behavioral interview. Tell me about a challenging project and how you handled it.`,
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

    const completion = await aiCallWithRetry({
      operation: () =>
        groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: getInterviewerPersona(company, role, stage, difficulty, 1, interviewTotalQuestions, normalizedAdvanced, resumeContext, experienceLevel) + `

Respond as JSON:
{
  "question": "Your opening greeting + first question",
  "tips": ["Tip 1", "Tip 2"],
  "thinkTime": 30,
  "interviewerReaction": "greeting"
}`,
            },
            { role: 'user', content: `Start the ${stage} interview for ${role} at ${company}.` },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.8,
        }),
      timeoutMs: 12000,
      maxRetries: 2,
      baseDelayMs: 250,
    });

    const result = safeJsonParse(completion.choices?.[0]?.message?.content || '');
    if (!result) throw new Error('Failed to parse AI start response');
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
    return res.json(withRuntime({
      question: `Hi! Welcome to your ${stage} interview at ${company}. Tell me about yourself and your background.`,
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


export default router;
