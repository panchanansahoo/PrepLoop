/**
 * Real-time Interview WebSocket Service
 * Handles instant answer processing, live feedback, and streaming responses
 */
import { WebSocketServer } from 'ws';
import crypto from 'crypto';
import { verifySupabaseToken } from '../middleware/auth.ts';
import { InterviewStateMachineService } from './interviewStateMachine.js';
import { InterviewScoringService } from './interviewScoringService.ts';
import InterviewMoodEngine, { computeNextMood, transitionMood, getMoodProfile, getMicroReaction, MOODS } from './interviewerMoodEngine.js';
import InterviewFollowUpRulesService from './interviewFollowUpRulesService.js';
import { InterviewPromptService } from './interviewPromptService.js';
import { evaluateFresherAnswer } from './interviewAnswerEvaluator.js';
import { callTurnScoring } from './llmRouter.js';
import { interviewTelemetryService } from './interviewTelemetryService.js';

// Lazy-initialize Groq to avoid duplicate SDK instances across the process.
// Uses a promise-based singleton so the first call initializes, subsequent calls reuse.
let _groqPromise = null;
function getGroqClient() {
  if (_groqPromise) return _groqPromise;
  _groqPromise = (async () => {
    try {
      const { default: Groq } = await import('groq-sdk');
      return process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
    } catch {
      return null;
    }
  })();
  return _groqPromise;
}

export const DEFAULT_RECONNECT_TTL_MS = 60_000;

export function getReconnectTtlMs() {
  const parsed = Number(process.env.INTERVIEW_RECONNECT_TTL_MS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_RECONNECT_TTL_MS;
}

class RealtimeInterviewService {
  constructor() {
    this.wss = null;
    this.sessions = new Map(); // sessionId -> { ws, context, state }
    this.disconnectedSessions = new Map(); // sessionId -> { context, state, disconnectedAt, timeoutTimer }
  }

  initialize(server, { noServer = false } = {}) {
    this.wss = noServer
      ? new WebSocketServer({ noServer: true })
      : new WebSocketServer({ server, path: '/ws/interview' });

    this.wss.on('connection', async (ws, req) => {
      const userId = await this.extractUserId(req);
      if (!userId) {
        ws.close(1008, 'Unauthorized: Valid Supabase auth token required');
        return;
      }
      ws._userId = userId;

      let requestedSessionId = null;
      try {
        if (req?.url) {
          const parsedUrl = new URL(req.url, 'http://localhost');
          requestedSessionId = parsedUrl.searchParams.get('sessionId');
        }
      } catch {
        /* ignore url parse error */
      }

      let sessionId = requestedSessionId;
      let resumed = false;

      if (sessionId && this.disconnectedSessions.has(sessionId)) {
        const saved = this.disconnectedSessions.get(sessionId);
        if (saved.userId && saved.userId !== userId) {
          ws.close(1008, 'Unauthorized: Cannot resume session belonging to another user');
          return;
        }
        if (saved.timeoutTimer) clearTimeout(saved.timeoutTimer);
        this.disconnectedSessions.delete(sessionId);

        if (saved.context) {
          saved.context.turns = saved.context.turns || 0;
          saved.context.scoreHistory = saved.context.scoreHistory || [];
          saved.context.consecutiveLowScores = saved.context.consecutiveLowScores || 0;
          saved.context.consecutiveHighScores = saved.context.consecutiveHighScores || 0;
          saved.context.currentDifficulty = saved.context.currentDifficulty || saved.context.difficulty || 'medium';
          saved.context.difficulty = saved.context.currentDifficulty;
          saved.context.mood = saved.context.mood || saved.context.moodState || MOODS.NEUTRAL;
          saved.context.moodState = saved.context.mood;
          saved.context.rubricHistory = Array.isArray(saved.context.rubricHistory) ? saved.context.rubricHistory : [];
          saved.context.usedProblemIds = Array.isArray(saved.context.usedProblemIds) ? saved.context.usedProblemIds : [];
        }

        const restoredSession = {
          ws,
          userId,
          context: saved.context,
          state: saved.state || 'idle',
          turns: saved.context?.turns || 0,
          scoreHistory: saved.context?.scoreHistory || [],
          consecutiveLowScores: saved.context?.consecutiveLowScores || 0,
          consecutiveHighScores: saved.context?.consecutiveHighScores || 0,
          currentDifficulty: saved.context?.currentDifficulty || 'medium',
          mood: saved.context?.mood || MOODS.NEUTRAL,
          moodState: saved.context?.moodState || MOODS.NEUTRAL,
          rubricHistory: saved.context?.rubricHistory || [],
          usedProblemIds: saved.context?.usedProblemIds || [],
        };
        this.sessions.set(sessionId, restoredSession);
        resumed = true;
        console.log(`[RealtimeInterview] Resumed session: ${sessionId}`);
      } else {
        sessionId = sessionId || this.generateSessionId();
        console.log(`[RealtimeInterview] New connection: ${sessionId}`);

        const newContext = {
          conversation: [],
          questionIndex: 0,
          company: 'General',
          role: 'Software Engineer',
          stage: 'intake',
          interviewType: 'dsa',
          difficulty: 'medium',
          currentDifficulty: 'medium',
          turns: 0,
          scoreHistory: [],
          consecutiveLowScores: 0,
          consecutiveHighScores: 0,
          mood: MOODS.NEUTRAL,
          moodState: MOODS.NEUTRAL,
          rubricHistory: [],
          usedProblemIds: [],
          problemStatement: '',
          problemRequirements: [],
          tags: [],
        };

        // Initialize session
        this.sessions.set(sessionId, {
          ws,
          userId,
          context: newContext,
          state: 'idle',
          turns: 0,
          scoreHistory: [],
          consecutiveLowScores: 0,
          consecutiveHighScores: 0,
          currentDifficulty: 'medium',
          mood: MOODS.NEUTRAL,
          moodState: MOODS.NEUTRAL,
          rubricHistory: [],
          usedProblemIds: [],
        });
      }

      const activeSession = this.sessions.get(sessionId);
      ws._sessionId = sessionId;

      // Send connected / resumed message
      ws.send(JSON.stringify({
        type: resumed ? 'resumed' : 'connected',
        sessionId,
        context: activeSession.context,
        timestamp: Date.now(),
      }));

      // Handle messages
      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          const activeId = ws._sessionId || sessionId;
          await this.handleMessage(activeId, message);
        } catch (err) {
          console.error('[RealtimeInterview] Message error:', err);
          ws.send(JSON.stringify({
            type: 'error',
            error: err.message,
          }));
        }
      });

      // Handle disconnect with 60s grace period
      ws.on('close', () => {
        const activeId = ws._sessionId || sessionId;
        console.log(`[RealtimeInterview] Disconnected: ${activeId}`);
        const currentSession = this.sessions.get(activeId);
        if (currentSession) {
          const ttlMs = getReconnectTtlMs();
          const timeoutTimer = setTimeout(() => {
            if (this.disconnectedSessions.has(activeId)) {
              console.log(`[RealtimeInterview] Session grace window (${ttlMs}ms) expired, purging session: ${activeId}`);
              this.disconnectedSessions.delete(activeId);
            }
          }, ttlMs);

          this.disconnectedSessions.set(activeId, {
            userId: currentSession.userId || ws._userId,
            context: currentSession.context,
            state: currentSession.state,
            disconnectedAt: Date.now(),
            timeoutTimer,
          });
          this.sessions.delete(activeId);
        }
      });

      ws.on('error', (err) => {
        console.error(`[RealtimeInterview] WebSocket error:`, err);
      });
    });

    console.log('[RealtimeInterview] WebSocket server initialized');
  }

  handleUpgrade(request, socket, head) {
    if (!this.wss) {
      socket.destroy();
      return;
    }
    this.wss.handleUpgrade(request, socket, head, (ws) => {
      this.wss?.emit('connection', ws, request);
    });
  }

  async handleMessage(sessionId, message) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const { ws, context: _context } = session;

    switch (message.type) {
      case 'start':
        await this.handleStart(session, message);
        break;

      case 'answer':
        await this.handleAnswer(session, message);
        break;

      case 'transcript':
        await this.handleTranscript(session, message);
        break;

      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        break;

      case 'resume':
        await this.handleResume(sessionId, session, message);
        break;

      default:
        console.warn(`[RealtimeInterview] Unknown message type: ${message.type}`);
    }
  }

  handleResume(currentSessionId, session, message) {
    const { targetSessionId, sessionId } = message;
    const resumeId = targetSessionId || sessionId;
    if (!resumeId) {
      session.ws.send(JSON.stringify({ type: 'error', error: 'Missing sessionId for resume' }));
      return;
    }

    if (this.disconnectedSessions.has(resumeId)) {
      const saved = this.disconnectedSessions.get(resumeId);
      if (saved.userId && session.userId && saved.userId !== session.userId) {
        session.ws.send(JSON.stringify({
          type: 'resume_failed',
          reason: 'Unauthorized: Session belongs to another user',
          sessionId: resumeId,
        }));
        return;
      }
      if (saved.timeoutTimer) clearTimeout(saved.timeoutTimer);
      this.disconnectedSessions.delete(resumeId);

      this.sessions.delete(currentSessionId);
      session.ws._sessionId = resumeId;

      if (saved.context) {
        saved.context.turns = saved.context.turns || 0;
        saved.context.scoreHistory = saved.context.scoreHistory || [];
        saved.context.consecutiveLowScores = saved.context.consecutiveLowScores || 0;
        saved.context.consecutiveHighScores = saved.context.consecutiveHighScores || 0;
        saved.context.currentDifficulty = saved.context.currentDifficulty || saved.context.difficulty || 'medium';
        saved.context.difficulty = saved.context.currentDifficulty;
        saved.context.mood = saved.context.mood || saved.context.moodState || MOODS.NEUTRAL;
        saved.context.moodState = saved.context.mood;
        saved.context.rubricHistory = Array.isArray(saved.context.rubricHistory) ? saved.context.rubricHistory : [];
        saved.context.usedProblemIds = Array.isArray(saved.context.usedProblemIds) ? saved.context.usedProblemIds : [];
      }

      this.sessions.set(resumeId, {
        ws: session.ws,
        userId: session.userId || saved.userId,
        context: saved.context,
        state: saved.state || 'idle',
        turns: saved.context?.turns || 0,
        scoreHistory: saved.context?.scoreHistory || [],
        consecutiveLowScores: saved.context?.consecutiveLowScores || 0,
        consecutiveHighScores: saved.context?.consecutiveHighScores || 0,
        currentDifficulty: saved.context?.currentDifficulty || 'medium',
        mood: saved.context?.mood || MOODS.NEUTRAL,
        moodState: saved.context?.moodState || MOODS.NEUTRAL,
        rubricHistory: saved.context?.rubricHistory || [],
        usedProblemIds: saved.context?.usedProblemIds || [],
      });

      session.ws.send(JSON.stringify({
        type: 'resumed',
        sessionId: resumeId,
        context: saved.context,
        state: saved.state,
        timestamp: Date.now(),
      }));
    } else {
      session.ws.send(JSON.stringify({
        type: 'resume_failed',
        reason: 'Session expired or not found',
        sessionId: resumeId,
      }));
    }
  }

  async handleStart(session, message) {
    const { ws, context } = session;
    const {
      company,
      role,
      stage,
      experienceLevel,
      interviewType,
      difficulty,
      totalQuestions,
      problemStatement,
      problemRequirements,
      tags,
      usedProblemIds: rawUsedProblemIds,
    } = message;
    const initialDifficulty = difficulty || 'medium';
    const usedProblemIds = (Array.isArray(rawUsedProblemIds) ? rawUsedProblemIds : (context.usedProblemIds || [])).map(String).filter(Boolean);

    // Update context
    Object.assign(context, {
      conversation: context.conversation || [],
      questionIndex: 0,
      company: company || 'General',
      role: role || 'Software Engineer',
      stage: stage || 'intake',
      experienceLevel: experienceLevel || 'fresher',
      interviewType: interviewType || 'dsa',
      difficulty: initialDifficulty,
      currentDifficulty: initialDifficulty,
      totalQuestions: Number(totalQuestions) || 10,
      turns: 0,
      topicFollowUpCount: 0,
      scoreHistory: [],
      consecutiveLowScores: 0,
      consecutiveHighScores: 0,
      mood: MOODS.NEUTRAL,
      moodState: MOODS.NEUTRAL,
      rubricHistory: [],
      usedProblemIds,
      problemStatement: problemStatement || '',
      problemRequirements: Array.isArray(problemRequirements) ? problemRequirements : [],
      tags: Array.isArray(tags) ? tags : [],
    });

    session.turns = 0;
    session.scoreHistory = [];
    session.consecutiveLowScores = 0;
    session.consecutiveHighScores = 0;
    session.currentDifficulty = initialDifficulty;
    session.mood = MOODS.NEUTRAL;
    session.moodState = MOODS.NEUTRAL;
    session.rubricHistory = [];
    session.usedProblemIds = context.usedProblemIds;

    // Generate first question
    const question = await this.generateQuestion(context);
    context.currentQuestion = question;
    if (!context.problemStatement) {
      context.problemStatement = question;
    }
    const qText = typeof question === 'string' ? question : question?.question || '';
    const problemId = context.problemId || `q_${crypto.createHash('md5').update(qText).digest('hex').slice(0, 10)}`;
    context.problemId = problemId;
    if (!context.usedProblemIds.includes(problemId)) {
      context.usedProblemIds.push(problemId);
    }
    session.usedProblemIds = context.usedProblemIds;

    // Send question
    ws.send(JSON.stringify({
      type: 'question',
      question,
      questionIndex: 1,
      problemId,
      usedProblemIds: context.usedProblemIds,
      stage: context.stage,
      difficulty: context.currentDifficulty || context.difficulty,
      currentDifficulty: context.currentDifficulty || context.difficulty,
      mood: context.moodState || context.mood,
      consecutiveLowScores: context.consecutiveLowScores || 0,
      consecutiveHighScores: context.consecutiveHighScores || 0,
      timestamp: Date.now(),
    }));

    context.conversation.push({
      role: 'interviewer',
      content: question,
      stageLabel: context.stageLabel || context.stage || 'Core Round',
      timestamp: Date.now(),
    });
    context.questionIndex = 1;
  }

  async handleAnswer(session, message) {
    const { ws, context } = session;
    const { answer, code, language } = message;

    context.conversation = context.conversation || [];
    context.turns = (context.turns || 0) + 1;
    context.stage = context.stage || 'Technical';
    context.consecutiveLowScores = context.consecutiveLowScores || 0;
    context.consecutiveHighScores = context.consecutiveHighScores || 0;
    context.currentDifficulty = context.currentDifficulty || context.difficulty || 'medium';
    context.difficulty = context.currentDifficulty;
    context.questionIndex = Number.isFinite(context.questionIndex) ? context.questionIndex : 1;
    context.moodState = context.moodState || context.mood || MOODS.NEUTRAL;
    context.mood = context.moodState;

    // Add answer to conversation
    context.conversation.push({
      role: 'candidate',
      content: answer,
      code,
      language,
      stageLabel: context.stageLabel || context.stage || 'Core Round',
      timestamp: Date.now(),
    });

    // Send processing indicator
    ws.send(JSON.stringify({
      type: 'processing',
      timestamp: Date.now(),
    }));

    const problemStatement = context.problemStatement || context.currentQuestion || '';
    const problemRequirements = context.problemRequirements || [];
    const tags = context.tags || [];

    // Baseline heuristic evaluation as immediate safety fallback
    const fallbackEval = evaluateFresherAnswer(answer, context.stage, code, {
      problemStatement,
      problemRequirements,
      tags,
    });

    // Generate calibrated feedback (via callTurnScoring 3D rubric)
    const feedback = await this.generateFeedback(context, answer, {
      code,
      language,
      problemStatement,
      problemRequirements,
      tags,
      sessionId: ws?._sessionId || context.sessionId || null,
      userId: session.userId || ws?._userId || null,
    });

    // Calibrated score resolution: use 3D rubric score if finite, else fall back to semantic heuristic
    const finalScore = Number.isFinite(feedback?.score)
      ? feedback.score
      : fallbackEval.score;

    const finalRubric = feedback?.rubric || fallbackEval.rubric;
    const finalStrengths = Array.isArray(feedback?.strengths) && feedback.strengths.length > 0
      ? feedback.strengths
      : fallbackEval.strengths;
    const finalImprovements = Array.isArray(feedback?.improvements) && feedback.improvements.length > 0
      ? feedback.improvements
      : fallbackEval.improvements;
    const feedbackComment = feedback?.comment || fallbackEval.feedbackSummary;
    const nextStep = feedback?.nextStep || fallbackEval?.nextStep || null;
    const misconceptionsDetected = Array.isArray(feedback?.misconceptionsDetected) && feedback.misconceptionsDetected.length > 0
      ? feedback.misconceptionsDetected
      : Array.isArray(fallbackEval?.misconceptionsDetected) ? fallbackEval.misconceptionsDetected : [];

    // 1. Track calibrated score in history
    context.scoreHistory = context.scoreHistory || [];
    const previousScore = context.scoreHistory.length > 0
      ? (typeof context.scoreHistory[context.scoreHistory.length - 1] === 'number'
          ? context.scoreHistory[context.scoreHistory.length - 1]
          : context.scoreHistory[context.scoreHistory.length - 1]?.score)
      : null;

    context.scoreHistory.push({ score: finalScore, turn: context.turns });

    // Track Rubric History (capped at last 10 turns)
    const rubricEntry = {
      turn: context.turns,
      ...(finalRubric || {}),
      score: finalScore,
    };
    context.rubricHistory = context.rubricHistory || [];
    context.rubricHistory.push(rubricEntry);
    if (context.rubricHistory.length > 10) {
      context.rubricHistory.splice(0, context.rubricHistory.length - 10);
    }
    session.rubricHistory = context.rubricHistory;

    // 2. Score trend analysis
    const scoreTrend = InterviewScoringService.calculateTrendFromHistory(context.scoreHistory);

    // 3. Adaptive difficulty progression (InterviewScoringService.deriveAdaptiveDifficulty)
    const currentDiff = context.currentDifficulty || context.difficulty || 'medium';
    const adaptiveDiff = InterviewScoringService.deriveAdaptiveDifficulty(
      currentDiff,
      finalScore / 10,
      context.turns,
      scoreTrend,
      context.experienceLevel
    );
    if (adaptiveDiff?.changed && adaptiveDiff.newDifficulty) {
      context.currentDifficulty = adaptiveDiff.newDifficulty;
      context.difficulty = adaptiveDiff.newDifficulty;
    } else {
      context.currentDifficulty = currentDiff;
      context.difficulty = currentDiff;
    }

    // 4. Follow-up decision rules (InterviewFollowUpRulesService.decideBranch)
    const followUpDecision = InterviewFollowUpRulesService.decideBranch({
      analysis: {
        score: finalScore,
        rubric: finalRubric,
        strengths: finalStrengths,
        improvements: finalImprovements,
      },
      interviewContext: {
        ...context,
        currentDifficulty: context.currentDifficulty,
        previousDifficulty: currentDiff,
        previousScore: previousScore ?? finalScore,
        hasPriorScore: previousScore !== null,
      },
      candidateResponse: answer || '',
      candidateCode: code || '',
      scoreHistory: context.scoreHistory,
      scoreTrend,
      turnNumber: context.turns,
    });

    // 5. Emotional intelligence / Interviewer Mood state transition (InterviewMoodEngine.transitionMood)
    const wordCount = String(answer || '').trim().split(/\s+/).filter(Boolean).length;
    const cumulativeScores = context.scoreHistory.map((entry) =>
      typeof entry === 'number' ? entry : entry?.score ?? 0
    );
    let consecutiveLow = 0;
    for (let i = cumulativeScores.length - 1; i >= 0; i -= 1) {
      if (cumulativeScores[i] < 50) consecutiveLow += 1;
      else break;
    }

    const currentMood = context.mood || context.moodState || MOODS.NEUTRAL;
    const moodTransitionFn = typeof InterviewMoodEngine?.transitionMood === 'function'
      ? InterviewMoodEngine.transitionMood
      : typeof transitionMood === 'function'
        ? transitionMood
        : computeNextMood;

    const { nextMood } = moodTransitionFn(currentMood, {
      score: finalScore,
      wordCount,
      cumulativeScores,
      consecutiveLowScores: consecutiveLow,
      trend: scoreTrend?.trend || scoreTrend,
      scoreTrend,
    });
    const moodProfile = getMoodProfile(nextMood);
    context.mood = nextMood;
    context.moodState = nextMood;

    context.usedReactions = context.usedReactions || new Set();
    const microReaction = getMicroReaction(nextMood, {
      seed: context.turns,
      usedReactions: context.usedReactions,
    });

    // 6. Proportional / Adaptive state machine stage progression (InterviewStateMachineService.advanceState)
    const nextState = InterviewStateMachineService.advanceState(
      {
        ...context,
        turns: context.turns,
        totalQuestions: context.totalQuestions,
        stage: context.stage,
        interviewType: context.interviewType,
        difficulty: context.currentDifficulty,
        currentDifficulty: context.currentDifficulty,
        consecutiveLowScores: context.consecutiveLowScores || 0,
        consecutiveHighScores: context.consecutiveHighScores || 0,
        lastScoredDifficulty: context.lastScoredDifficulty || null,
        probedTopics: context.probedTopics || [],
      },
      {
        score: finalScore,
        rawScore: finalScore,
        difficulty: context.currentDifficulty,
        turnType: 'scored',
        forceEnabled: context.forceEnabled ?? true,
      }
    );
    context.stage = nextState.stage;
    context.stageLabel = nextState.stageLabel || context.stageLabel;
    context.consecutiveLowScores = typeof nextState.consecutiveLowScores === 'number'
      ? nextState.consecutiveLowScores
      : consecutiveLow;
    context.consecutiveHighScores = typeof nextState.consecutiveHighScores === 'number'
      ? nextState.consecutiveHighScores
      : 0;
    context.lastScoredDifficulty = nextState.lastScoredDifficulty || null;
    context.probedTopics = Array.isArray(nextState.probedTopics) ? nextState.probedTopics : (context.probedTopics || []);

    // Sync session root fields and session.state
    session.turns = context.turns;
    session.scoreHistory = context.scoreHistory;
    session.consecutiveLowScores = context.consecutiveLowScores;
    session.consecutiveHighScores = context.consecutiveHighScores;
    session.currentDifficulty = context.currentDifficulty;
    session.mood = context.mood;
    session.moodState = context.moodState;
    session.probedTopics = context.probedTopics;
    if (session.state && typeof session.state === 'object') {
      session.state.turns = context.turns;
      session.state.scoreHistory = context.scoreHistory;
      session.state.consecutiveLowScores = context.consecutiveLowScores;
      session.state.consecutiveHighScores = context.consecutiveHighScores;
      session.state.currentDifficulty = context.currentDifficulty;
      session.state.mood = context.mood;
      session.state.rubricHistory = context.rubricHistory;
      session.state.probedTopics = context.probedTopics;
    }

    // 7. Generate next question (informed by follow-up decision)
    const nextQuestion = await this.generateNextQuestion(context, followUpDecision);
    context.currentQuestion = nextQuestion;
    const nextQText = typeof nextQuestion === 'string' ? nextQuestion : nextQuestion?.question || '';
    const nextProblemId = `q_${crypto.createHash('md5').update(nextQText).digest('hex').slice(0, 10)}`;
    context.problemId = nextProblemId;
    context.usedProblemIds = context.usedProblemIds || [];
    if (!context.usedProblemIds.includes(nextProblemId)) {
      context.usedProblemIds.push(nextProblemId);
    }
    session.usedProblemIds = context.usedProblemIds;
    if (session.state && typeof session.state === 'object') {
      session.state.usedProblemIds = context.usedProblemIds;
    }

    if (nextQText) {
      const updatedState = InterviewStateMachineService.recordProbedTopic(
        { probedTopics: context.probedTopics || [] },
        nextQText
      );
      context.probedTopics = updatedState.probedTopics;
      session.probedTopics = context.probedTopics;
      if (session.state && typeof session.state === 'object') {
        session.state.probedTopics = context.probedTopics;
      }
    }

    // Send feedback with calibrated 3D rubric and evidence quote
    ws.send(JSON.stringify({
      type: 'feedback',
      feedback: feedbackComment,
      score: finalScore,
      rubric: finalRubric,
      strengths: finalStrengths,
      improvements: finalImprovements,
      nextStep,
      misconceptionsDetected,
      evidenceQuote: feedback?.evidenceQuote || null,
      stage: context.stage,
      difficulty: context.currentDifficulty,
      currentDifficulty: context.currentDifficulty,
      problemId: context.problemId,
      usedProblemIds: context.usedProblemIds,
      microReaction,
      mood: {
        state: context.moodState,
        expression: moodProfile.expression,
        avatarOverlay: moodProfile.avatarOverlay,
        ttsProsody: moodProfile.ttsProsody,
        reaction: microReaction,
      },
      adaptiveDifficulty: adaptiveDiff,
      followUpDecision: {
        nextAction: followUpDecision?.nextAction,
        branchReason: followUpDecision?.branchReason,
        recoveryDetected: Boolean(followUpDecision?.recoveryDetected),
        recoveryPhrase: followUpDecision?.recoveryPhrase || null,
        momentum: followUpDecision?.momentum || 'neutral',
      },
      consecutiveLowScores: context.consecutiveLowScores,
      consecutiveHighScores: context.consecutiveHighScores,
      turns: context.turns,
      rubricHistory: context.rubricHistory,
      timestamp: Date.now(),
    }));

    // Send next question
    ws.send(JSON.stringify({
      type: 'question',
      question: nextQuestion,
      questionIndex: context.questionIndex + 1,
      problemId: nextProblemId,
      usedProblemIds: context.usedProblemIds,
      stage: context.stage,
      difficulty: context.currentDifficulty,
      currentDifficulty: context.currentDifficulty,
      mood: context.moodState,
      consecutiveLowScores: context.consecutiveLowScores,
      consecutiveHighScores: context.consecutiveHighScores,
      followUpAction: followUpDecision?.nextAction || 'deepen',
      recoveryPhrase: followUpDecision?.recoveryPhrase || null,
      timestamp: Date.now(),
    }));

    context.conversation.push({
      role: 'feedback',
      content: feedbackComment,
      score: finalScore,
      rubric: finalRubric,
      stageLabel: context.stageLabel || context.stage || 'Core Round',
      timestamp: Date.now(),
    });

    context.conversation.push({
      role: 'interviewer',
      content: nextQuestion,
      stageLabel: context.stageLabel || context.stage || 'Core Round',
      timestamp: Date.now(),
    });

    context.questionIndex++;
  }

  handleTranscript(session, message) {
    const { ws } = session;
    const { text, isFinal } = message;

    // Echo transcript for confirmation (optional)
    ws.send(JSON.stringify({
      type: 'transcript_ack',
      text,
      isFinal,
      timestamp: Date.now(),
    }));
  }

  async generateQuestion(context) {
    const groq = await getGroqClient();
    if (!groq) {
      return this.getFallbackQuestion(context);
    }

    try {
      const difficulty = context.currentDifficulty || context.difficulty || 'medium';
      const prompt = `You are a ${context.company} interviewer conducting a ${context.stage} interview for a ${context.role} position at difficulty level ${difficulty}.

Generate ONE interview question appropriate for this stage.

Rules:
- Be concise and clear
- Match the difficulty to the stage
- No markdown, just the question text

Question:`;

      const completion = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 200,
      }, { signal: AbortSignal.timeout(6000) });

      return completion.choices[0]?.message?.content?.trim() || this.getFallbackQuestion(context);
    } catch (err) {
      if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
        interviewTelemetryService.logEvent('interview.turn.llm_timeout', {
          model: 'llama-3.1-8b-instant',
          context: 'generateFirstQuestion',
        });
      }
      console.error('[RealtimeInterview] Question generation error:', err);
      return this.getFallbackQuestion(context);
    }
  }

  async generateNextQuestion(context, followUpDecision = null) {
    const groq = await getGroqClient();
    if (!groq) {
      const fallback = this.getFallbackQuestion(context);
      if (followUpDecision?.recoveryPhrase && !fallback.includes(followUpDecision.recoveryPhrase)) {
        return `${followUpDecision.recoveryPhrase} ${fallback}`;
      }
      return fallback;
    }

    try {
      const lastCandidate = Array.isArray(context?.conversation)
        ? [...context.conversation].reverse().find(m => m.role === 'candidate')
        : null;
      const candidateResponse = lastCandidate?.content || '';
      const transcript = Array.isArray(context?.conversation)
        ? context.conversation.map(m => ({ role: m.role, text: m.content }))
        : [];

      let prompt = '';
      if (typeof InterviewPromptService?.buildFollowUpPrompt === 'function') {
        try {
          prompt = InterviewPromptService.buildFollowUpPrompt({
            problemStatement: context.problemStatement || context.currentQuestion || 'Technical interview problem',
            transcript,
            candidateResponse,
            interviewType: context.interviewType || 'dsa',
            interviewContext: {
              ...context,
              rubricHistory: context.rubricHistory || [],
              adaptiveFollowUp: followUpDecision,
            },
            interviewMode: 'full_realtime',
          });
        } catch {
          prompt = '';
        }
      }

      if (!prompt) {
        let guidance = 'Increase depth gradually';
        if (followUpDecision?.nextAction === 'targeted_correction') {
          guidance = 'Address missed concepts with a targeted corrective follow-up';
        } else if (followUpDecision?.nextAction === 'star_completion') {
          guidance = 'Ask the candidate to elaborate on the missing STAR components (Situation, Task, Action, or Result)';
        } else if (followUpDecision?.nextAction === 'confidence_rebuild') {
          guidance = 'Ask an encouraging, foundational follow-up to rebuild candidate confidence';
        } else if (followUpDecision?.nextAction === 'depth_probe') {
          guidance = 'Probe deeper into the technical mechanics, edge cases, and trade-offs';
        } else if (followUpDecision?.nextAction === 'affirm_recovery') {
          guidance = 'Acknowledge the candidate recovery and build on the improved direction';
        }

        prompt = `Based on the conversation, generate the next interview question.
Stage: ${context.stage || 'Technical'}
Difficulty: ${context.currentDifficulty || context.difficulty || 'medium'}
Guidance: ${guidance}

Rules:
- Build on previous answers
- Increase depth gradually
- Be concise
- No markdown

Next question:`;
      }

      const recentConversation = context.conversation.slice(-6).map(m => ({
        role: m.role === 'interviewer' ? 'assistant' : 'user',
        content: m.content,
      }));

      const completion = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          ...recentConversation,
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 200,
      }, { signal: AbortSignal.timeout(6000) });

      const rawContent = completion.choices[0]?.message?.content?.trim();
      let generated = '';
      if (rawContent && (rawContent.startsWith('{') || rawContent.includes('"message"'))) {
        try {
          const parsed = JSON.parse(rawContent);
          generated = parsed.message || parsed.question || rawContent;
        } catch {
          generated = rawContent;
        }
      } else {
        generated = rawContent || this.getFallbackQuestion(context);
      }

      if (followUpDecision?.recoveryPhrase && !generated.includes(followUpDecision.recoveryPhrase)) {
        generated = `${followUpDecision.recoveryPhrase} ${generated}`;
      }
      return generated;
    } catch (err) {
      if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
        interviewTelemetryService.logEvent('interview.turn.llm_timeout', {
          model: 'llama-3.1-8b-instant',
          context: 'generateNextQuestion',
        });
      }
      console.error('[RealtimeInterview] Next question error:', err);
      const fallback = this.getFallbackQuestion(context);
      if (followUpDecision?.recoveryPhrase && !fallback.includes(followUpDecision.recoveryPhrase)) {
        return `${followUpDecision.recoveryPhrase} ${fallback}`;
      }
      return fallback;
    }
  }

  async generateFeedback(context, answer, options = {}) {
    // 1. Resolve previous question from conversation history
    let previousQuestion = '';
    if (Array.isArray(context?.conversation)) {
      for (let i = context.conversation.length - 1; i >= 0; i--) {
        const item = context.conversation[i];
        if (item && item.role === 'interviewer') {
          previousQuestion = item.content;
          break;
        }
      }
      if (!previousQuestion && context.conversation.length >= 2) {
        previousQuestion = context.conversation[context.conversation.length - 2]?.content || '';
      }
    }

    const code = options.code || '';
    const codeLanguage = options.language || '';
    const sessionId = options.sessionId || context?.sessionId || null;
    const userId = options.userId || context?.userId || null;
    const company = context?.company || 'Tech Company';
    const role = context?.role || 'Software Engineer';
    const stage = context?.stage || 'Technical';
    const difficultyTag = context?.currentDifficulty || context?.difficulty || 'medium';
    const questionNumber = context?.turns || 1;
    const problemStatement = options.problemStatement || context?.problemStatement || previousQuestion;
    const problemRequirements = options.problemRequirements || context?.problemRequirements || [];
    const tags = options.tags || context?.tags || [];

    try {
      const scoringResult = await callTurnScoring({
        previousQuestion: problemStatement || previousQuestion,
        problemStatement,
        problemRequirements,
        tags,
        userAnswer: answer,
        code,
        codeLanguage,
        company,
        role,
        stage,
        questionNumber,
        difficultyTag,
        sessionId,
        userId,
      });

      if (scoringResult && Number.isFinite(scoringResult.score)) {
        return {
          comment: scoringResult.feedback || 'Answer recorded.',
          score: scoringResult.score,
          rubric: scoringResult.dimensions || {
            correctness: 3,
            depth: 3,
            communication: 3,
            rawWeighted: 3.0,
          },
          strengths: Array.isArray(scoringResult.strengths) ? scoringResult.strengths : ['Structured response'],
          improvements: Array.isArray(scoringResult.improvements) ? scoringResult.improvements : [],
          nextStep: scoringResult.nextStep || null,
          misconceptionsDetected: Array.isArray(scoringResult.misconceptionsDetected) ? scoringResult.misconceptionsDetected : [],
          evidenceQuote: scoringResult.evidenceQuote || null,
          evalModelUsed: scoringResult.evalModelUsed,
          evalProvider: scoringResult.evalProvider,
          isEstimated: Boolean(scoringResult.isEstimated),
        };
      }
    } catch (err) {
      console.error('[RealtimeInterview] callTurnScoring error:', err);
    }

    // Calibrated fallback using evaluateFresherAnswer semantic scoring
    const fallback = evaluateFresherAnswer(answer, stage, code, {
      problemStatement,
      problemRequirements,
      tags,
    });
    return {
      comment: fallback.feedbackSummary || 'Good answer. Let me ask you a follow-up.',
      score: fallback.score ?? 75,
      rubric: fallback.rubric,
      strengths: fallback.strengths || ['Clear communication'],
      improvements: fallback.improvements || ['Add more detail'],
      nextStep: fallback.nextStep || null,
      misconceptionsDetected: Array.isArray(fallback.misconceptionsDetected) ? fallback.misconceptionsDetected : [],
      isEstimated: true,
    };
  }

  getFallbackQuestion(context) {
    const fallbacks = {
      'Technical': [
        'Can you explain the difference between a stack and a queue?',
        'How would you optimize a slow database query?',
        'What is your approach to debugging production issues?',
      ],
      'DSA / Coding': [
        'How would you reverse a linked list?',
        'Explain your approach to finding duplicates in an array.',
        'What is the time complexity of binary search?',
      ],
      'System Design': [
        'How would you design a URL shortening service?',
        'Explain how you would scale a web application.',
        'What are the trade-offs between SQL and NoSQL databases?',
      ],
      'Behavioral': [
        'Tell me about a time you faced a difficult technical challenge.',
        'How do you handle disagreements with team members?',
        'Describe a project you are most proud of.',
      ],
      'HR': [
        'Why do you want to work at our company?',
        'What are your career goals for the next 5 years?',
        'How do you handle stress and tight deadlines?',
      ],
    };

    const stageKey = String(context.stage || '').toLowerCase();
    const typeKey = String(context.interviewType || '').toLowerCase();
    const poolKey = fallbacks[context.stage]
      ? context.stage
      : typeKey === 'hr' || stageKey === 'hr'
        ? 'HR'
        : typeKey === 'behavioral' || stageKey === 'behavioral'
          ? 'Behavioral'
          : typeKey === 'system_design' || typeKey === 'system-design' || stageKey === 'system design'
            ? 'System Design'
            : typeKey === 'dsa' || stageKey === 'dsa / coding'
              ? 'DSA / Coding'
              : 'Technical';

    const questions = fallbacks[poolKey] || fallbacks['Technical'];
    const used = Array.isArray(context?.usedProblemIds) ? context.usedProblemIds : [];
    const unused = questions.filter(q => {
      const qId = `q_${crypto.createHash('md5').update(q).digest('hex').slice(0, 10)}`;
      return !used.includes(qId);
    });
    const pool = unused.length > 0 ? unused : questions;
    return pool[context.questionIndex % pool.length];
  }

  async extractUserId(req) {
    try {
      const url = new URL(req.url || '', 'http://localhost');
      const queryToken = url.searchParams.get('token')?.trim();
      const authHeader = req.headers?.authorization;
      const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

      let cookieToken = null;
      const cookieHeader = req.headers?.cookie || '';
      for (const part of cookieHeader.split(';')) {
        const sep = part.indexOf('=');
        if (sep < 1) continue;
        if (part.slice(0, sep).trim() === 'preploop_access') {
          try {
            cookieToken = decodeURIComponent(part.slice(sep + 1).trim());
          } catch {
            cookieToken = part.slice(sep + 1).trim();
          }
          break;
        }
      }

      const token = bearerToken || queryToken || cookieToken;
      if (!token) return null;

      const verifiedUser = await verifySupabaseToken(token);
      return verifiedUser?.id || null;
    } catch {
      return null;
    }
  }

  generateSessionId() {
    return `session_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
  }

  getActiveSessionCount() {
    return this.sessions.size;
  }
}

export { RealtimeInterviewService };
export default new RealtimeInterviewService();
