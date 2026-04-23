import { randomUUID } from 'crypto';
import { createLogger } from '../utils/structuredLogger.js';
import { supabaseAdmin } from '../db/index.js';
import { InterviewStateMachineService } from './interviewStateMachine.js';
import interviewGroundingService from './interviewGroundingService.js';
import { InterviewPromptService } from './interviewPromptService.js';
import { InterviewConversationService } from './interviewConversationService.js';
import { InterviewScoringService } from './interviewScoringService.js';
import { InterviewFollowUpRulesService } from './interviewFollowUpRules.js';
import { InterviewTelemetryService } from './interviewTelemetryService.js';
import { addSpanEvent, setSpanAttribute } from '../utils/telemetry.js';
import { groqClient as groq } from './voiceService.js';

const logger = createLogger('AIService');

/**
 * IMPORTANT: Virtual interview sessions are stored in-memory as a fallback mechanism
 * when database schema is incompatible. This Map has the following limitations:
 * 
 * 1. NOT PERSISTENT: Data is lost on server restart
 * 2. NOT THREAD-SAFE: Potential race conditions with concurrent access
 * 3. NOT SCALABLE: Does not work across multiple server instances
 * 
 * For production deployments:
 * - Use Redis or another distributed cache
 * - Implement proper locking mechanisms for concurrent access
 * - Ensure database schema is up-to-date to avoid fallback usage
 */
const virtualInterviewSessions = new Map();
const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
const SESSION_MAX_SIZE = 500;
const SESSION_CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

// Periodic eviction of expired virtual sessions to prevent memory leaks
const _sessionCleanupTimer = setInterval(() => {
    const now = Date.now();
    let evicted = 0;
    for (const [key, session] of virtualInterviewSessions) {
        if (now - (session._createdAt || 0) > SESSION_TTL_MS) {
            virtualInterviewSessions.delete(key);
            evicted++;
        }
    }
    // If still over cap after TTL eviction, remove oldest entries
    if (virtualInterviewSessions.size > SESSION_MAX_SIZE) {
        const sorted = [...virtualInterviewSessions.entries()]
            .sort((a, b) => (a[1]._createdAt || 0) - (b[1]._createdAt || 0));
        const toRemove = sorted.slice(0, virtualInterviewSessions.size - SESSION_MAX_SIZE);
        for (const [key] of toRemove) {
            virtualInterviewSessions.delete(key);
            evicted++;
        }
    }
    if (evicted > 0) {
        logger.info(`Virtual session cleanup: evicted ${evicted}, remaining ${virtualInterviewSessions.size}`);
    }
}, SESSION_CLEANUP_INTERVAL_MS);
_sessionCleanupTimer.unref(); // Don't prevent process exit

const interviewTelemetryService = new InterviewTelemetryService();

const isMissingColumnError = (error, columnName) => {
  const message = String(error?.message || '').toLowerCase();
  const code = String(error?.code || '').toUpperCase();
  return (
    code === 'PGRST204' ||
    code === '42703' ||
    (message.includes('could not find') && message.includes(columnName.toLowerCase())) ||
    (message.includes('column') && message.includes(columnName.toLowerCase()))
  );
};

const isInterviewSchemaCompatibilityError = (error) => {
  const message = String(error?.message || '').toLowerCase();
  const code = String(error?.code || '').toUpperCase();
  return (
    code === 'PGRST204' ||
    code === 'PGRST205' ||
    code === '42703' ||
    message.includes('schema cache') ||
    message.includes('could not find the') ||
    message.includes('column') ||
    message.includes('interview_sessions')
  );
};

// AI Model Configuration
const MODEL_CONFIG = {
  model: 'mixtral-8x7b-32768', // Fast, cost-effective for both features
  temperature: 0.7, // Balanced creativity vs consistency
  max_tokens: 2048,
};

const INTERVIEW_MODEL_CONFIG = {
  model: 'mixtral-8x7b-32768',
  temperature: 0.8, // Slightly more natural for interviews
  max_tokens: 1500,
};

const INTERVIEW_RUNTIME_MODES = ['full_realtime'];

const ANSWER_FILLERS = ['um', 'uh', 'like', 'you know', 'basically', 'literally', 'sort of', 'right'];

// Cached index of the working DB schema shape (avoids re-probing on every initializeInterview call)
let _knownPayloadIndex = null;

const clampScore = (value) => Math.max(0, Math.min(100, Math.round(Number(value) || 0)));

function analyzeAnswerQualityHeuristic(answer = '', question = '', interviewType = '') {
  const normalizedAnswer = String(answer || '').trim();
  const normalizedQuestion = String(question || '').trim();
  const lower = normalizedAnswer.toLowerCase();
  const normalizedType = String(interviewType || '').toLowerCase();

  if (!normalizedAnswer) {
    return {
      clarityScore: 0,
      specificityScore: 0,
      confidenceScore: 0,
      fillerCount: 0,
      needsFollowUp: true,
      followUpQuestion: normalizedQuestion
        ? `Could you answer this directly: ${normalizedQuestion}`
        : 'Could you give a specific example with the outcome?',
      rationale: 'No answer content provided.',
      source: 'heuristic',
    };
  }

  const wordCount = normalizedAnswer.split(/\s+/).filter(Boolean).length;
  const hasNumber = /\d/.test(normalizedAnswer);
  const hasResultLanguage = /(result|outcome|improved|reduced|increased|impact|delivered|launched)/i.test(normalizedAnswer);
  const hasActionLanguage = /(i built|i implemented|i designed|i migrated|i optimized|i led|i improved|i created)/i.test(normalizedAnswer);

  let fillerCount = 0;
  for (const filler of ANSWER_FILLERS) {
    const escaped = filler.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'g');
    fillerCount += (lower.match(regex) || []).length;
  }

  // ── Type-specific signal boosts ─────────────────────────────────────
  let typeBoost = 0;
  // Reduce filler penalty for behavioral/HR — natural speech has more fillers
  const fillerPenalty = (normalizedType === 'behavioral' || normalizedType === 'hr') ? 3 : 6;
  const fillerConfPenalty = (normalizedType === 'behavioral' || normalizedType === 'hr') ? 4 : 7;

  if (normalizedType === 'dsa' || normalizedType === 'system_design' || normalizedType === 'system-design') {
    // DSA/System Design: boost for complexity/algorithm language
    const hasComplexity = /(o\(n|o\(1\)|o\(log|time complexity|space complexity|big o|amortized)/i.test(lower);
    const hasAlgorithm = /(binary search|bfs|dfs|dynamic programming|greedy|hash map|hash table|sorting|recursion|backtrack)/i.test(lower);
    const hasTradeOff = /(trade.?off|versus|instead of|alternative|compared to|at the cost of)/i.test(lower);
    typeBoost = (hasComplexity ? 12 : 0) + (hasAlgorithm ? 8 : 0) + (hasTradeOff ? 6 : 0);
  } else if (normalizedType === 'behavioral') {
    // Behavioral: boost for STAR components
    const hasSituation = /(in that situation|the context was|we were facing|at that time|when we)/i.test(lower);
    const hasTask = /(my task was|i was responsible for|my role was|i needed to)/i.test(lower);
    const hasStarAction = /(i took the action|i decided to|i implemented|i led|i organized)/i.test(lower);
    const hasResult = /(the result was|as a result|the outcome|this led to|we achieved)/i.test(lower);
    typeBoost = (hasSituation ? 8 : 0) + (hasTask ? 6 : 0) + (hasStarAction ? 8 : 0) + (hasResult ? 10 : 0);
  } else if (normalizedType === 'hr') {
    // HR: boost for motivation and fit language
    const hasMotivation = /(passionate|excited|interested|motivated|driven|eager|love|enjoy)/i.test(lower);
    const hasFit = /(team|culture|collaboration|values|growth|learning|mentor)/i.test(lower);
    typeBoost = (hasMotivation ? 8 : 0) + (hasFit ? 8 : 0);
  }

  const clarityScore = clampScore(40 + Math.min(wordCount, 80) * 0.65 - fillerCount * fillerPenalty + typeBoost * 0.3);
  const specificityScore = clampScore((hasActionLanguage ? 45 : 20) + (hasNumber ? 30 : 0) + (hasResultLanguage ? 25 : 5) + typeBoost * 0.4);
  const confidenceScore = clampScore(50 + Math.min(wordCount, 60) * 0.5 - fillerCount * fillerConfPenalty + typeBoost * 0.3);
  const needsFollowUp = !(hasNumber && hasResultLanguage);
  const followUpQuestion = needsFollowUp
    ? (hasNumber
      ? 'What was the concrete outcome and business impact?'
      : 'Can you share a concrete example with measurable results?')
    : 'Great. Can you also describe one trade-off you considered?';

  return {
    clarityScore,
    specificityScore,
    confidenceScore,
    fillerCount,
    needsFollowUp,
    followUpQuestion,
    rationale: hasResultLanguage
      ? 'Answer includes action and result indicators.'
      : 'Answer can be improved with measurable outcomes and clearer impact.',
    source: 'heuristic',
  };
}

export async function analyzeAnswerQuality(answer = '', question = '', interviewType = '') {
  const heuristic = analyzeAnswerQualityHeuristic(answer, question, interviewType);

  if (!process.env.GROQ_API_KEY) {
    return heuristic;
  }

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      temperature: 0.2,
      max_tokens: 220,
      messages: [
        {
          role: 'system',
          content: 'You are an interview evaluator. Return strict JSON only with keys: clarityScore, specificityScore, confidenceScore, needsFollowUp, followUpQuestion, rationale.'
        },
        {
          role: 'user',
          content: `Question: ${question || 'N/A'}\nAnswer: ${answer || 'N/A'}`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const raw = completion?.choices?.[0]?.message?.content || '{}';
    const parsed = JSON.parse(raw);

    return {
      clarityScore: clampScore(parsed.clarityScore ?? heuristic.clarityScore),
      specificityScore: clampScore(parsed.specificityScore ?? heuristic.specificityScore),
      confidenceScore: clampScore(parsed.confidenceScore ?? heuristic.confidenceScore),
      fillerCount: heuristic.fillerCount,
      needsFollowUp: Boolean(parsed.needsFollowUp ?? heuristic.needsFollowUp),
      followUpQuestion: String(parsed.followUpQuestion || heuristic.followUpQuestion),
      rationale: String(parsed.rationale || heuristic.rationale),
      source: 'groq',
    };
  } catch (error) {
    logger.warn('analyzeAnswerQuality fell back to heuristic scoring', {
      error: error.message,
    });
    return heuristic;
  }
}

/**
 * Feature 1: AI Code Review Service
 * Analyzes submitted code and provides detailed feedback
 */
export class CodeReviewService {
  static async analyzeCode(userId, problemId, code, language = 'javascript', requestId = null) {
    const startTime = Date.now();
    
    try {
      logger.info('Code review initiated', {
        userId,
        problemId,
        language,
        codeLength: code.length,
        requestId
      });

      // 1. Generate code review via Groq
      const reviewPrompt = this._buildCodeReviewPrompt(code, language, problemId);
      
      let response = null;
      let reviewContent = '';
      try {
        response = await groq.chat.completions.create({
          ...MODEL_CONFIG,
          messages: [
            {
              role: 'user',
              content: reviewPrompt
            }
          ]
        });
        reviewContent = response.choices[0]?.message?.content || '';
      } catch (error) {
        logger.warn('Groq unavailable for code review; using fallback analysis', {
          userId,
          problemId,
          requestId,
          error: error.message,
        });
        reviewContent = JSON.stringify({
          timeComplexity: 'Not determined',
          spaceComplexity: 'Not determined',
          complexityAnalysis: 'Fallback analysis used because AI provider was unavailable.',
          optimizationSuggestions: [
            {
              title: 'Add explicit edge-case checks',
              description: 'Handle empty input, null input, and duplicate-heavy scenarios explicitly.',
              severity: 'medium',
              codeExample: '',
            }
          ],
          edgeCasesCovered: { found: [], missed: ['empty input', 'single element input'] },
          patternsIdentified: [],
          patternExplanations: {},
          refactoringHints: 'Extract helper functions and improve variable naming for readability.',
          referenceSolutionApproach: 'Use a straightforward linear scan with clear guard conditions first.',
          testCasesRecommendations: [],
          communicationScore: 70,
          correctnessScore: 70,
          efficiencyScore: 70,
          overallScore: 70,
        });
      }
      
      // 2. Parse AI response into structured format
      const parsedReview = this._parseReviewResponse(reviewContent);
      
      // 3. Save to database
      let reviewRecord = null;
      const { data: persistedReview, error: saveError } = await supabaseAdmin
        .from('code_review_sessions')
        .insert({
          user_id: userId,
          problem_id: problemId,
          submitted_code: code,
          language: language,
          time_complexity: parsedReview.timeComplexity,
          space_complexity: parsedReview.spaceComplexity,
          complexity_analysis: parsedReview.complexityAnalysis,
          optimization_suggestions: parsedReview.optimizationSuggestions,
          edge_cases_covered: parsedReview.edgeCasesCovered,
          patterns_identified: parsedReview.patternsIdentified,
          pattern_explanations: parsedReview.patternExplanations,
          refactoring_hints: parsedReview.refactoringHints,
          reference_solution_approach: parsedReview.referenceSolutionApproach,
          test_cases_recommendations: parsedReview.testCasesRecommendations,
          communication_score: parsedReview.communicationScore,
          correctness_score: parsedReview.correctnessScore,
          efficiency_score: parsedReview.efficiencyScore,
          overall_score: parsedReview.overallScore,
          ai_model_version: MODEL_CONFIG.model,
          processing_time_ms: Date.now() - startTime
        })
        .select()
        .single();

      if (saveError) {
        logger.warn('Failed to persist code review; returning non-persisted fallback payload', {
          userId,
          problemId,
          requestId,
          error: saveError.message,
          code: saveError.code,
        });
        reviewRecord = {
          id: randomUUID(),
          user_id: userId,
          problem_id: problemId,
          submitted_code: code,
          language,
          time_complexity: parsedReview.timeComplexity,
          space_complexity: parsedReview.spaceComplexity,
          complexity_analysis: parsedReview.complexityAnalysis,
          optimization_suggestions: parsedReview.optimizationSuggestions,
          edge_cases_covered: parsedReview.edgeCasesCovered,
          patterns_identified: parsedReview.patternsIdentified,
          pattern_explanations: parsedReview.patternExplanations,
          refactoring_hints: parsedReview.refactoringHints,
          reference_solution_approach: parsedReview.referenceSolutionApproach,
          test_cases_recommendations: parsedReview.testCasesRecommendations,
          communication_score: parsedReview.communicationScore,
          correctness_score: parsedReview.correctnessScore,
          efficiency_score: parsedReview.efficiencyScore,
          overall_score: parsedReview.overallScore,
          ai_model_version: MODEL_CONFIG.model,
          processing_time_ms: Date.now() - startTime,
          created_at: new Date().toISOString(),
          persisted: false,
        };
      } else {
        reviewRecord = persistedReview;
      }

      // 4. Log service usage
      await this._logAIServiceUsage(userId, 'code_review', reviewRecord.id, response?.usage, Date.now() - startTime, requestId);

      logger.info('Code review completed', {
        userId,
        reviewId: reviewRecord.id,
        processingTimeMs: Date.now() - startTime,
        requestId,
        overallScore: parsedReview.overallScore
      });

      return reviewRecord;

    } catch (error) {
      logger.error('Code review failed', {
        userId,
        problemId,
        error: error.message,
        requestId
      });
      throw error;
    }
  }

  static _buildCodeReviewPrompt(code, language, problemId) {
    return `You are an expert code reviewer for Data Structures and Algorithms problems.

Analyze the following ${language} code and provide a comprehensive review.

PROBLEM ID: ${problemId}
SUBMITTED CODE:
\`\`\`${language}
${code}
\`\`\`

Please provide your analysis in the following JSON format (return ONLY valid JSON):
{
  "timeComplexity": "O(n log n) or appropriate complexity",
  "spaceComplexity": "O(n) or appropriate complexity",
  "complexityAnalysis": "Detailed explanation of why these complexities",
  "optimizationSuggestions": [
    {
      "title": "Brief suggestion title",
      "description": "Detailed explanation of what to improve",
      "severity": "low|medium|high",
      "codeExample": "Show how to fix it"
    }
  ],
  "edgeCasesCovered": {
    "found": ["edge case 1", "edge case 2"],
    "missed": ["potential edge case they didn't handle"]
  },
  "patternsIdentified": ["sliding window", "two pointer", "dp"],
  "patternExplanations": {
    "sliding window": "Why this pattern applies here..."
  },
  "refactoringHints": "Suggestions for making code more readable",
  "referenceSolutionApproach": "Alternative high-level approach",
  "testCasesRecommendations": [
    {
      "testCase": "Example input",
      "expectedOutput": "What should happen",
      "why": "Why this is important to test"
    }
  ],
  "communicationScore": 75,
  "correctnessScore": 90,
  "efficiencyScore": 70,
  "overallScore": 80,
  "strengths": ["What they did well"],
  "improvements": ["What needs work"]
}`;
  }

  static _parseReviewResponse(content) {
    try {
      // Extract JSON from response (sometimes Groq includes extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      const review = {
        timeComplexity: parsed.timeComplexity || 'Not determined',
        spaceComplexity: parsed.spaceComplexity || 'Not determined',
        complexityAnalysis: parsed.complexityAnalysis || '',
        optimizationSuggestions: parsed.optimizationSuggestions || [],
        edgeCasesCovered: parsed.edgeCasesCovered || { found: [], missed: [] },
        patternsIdentified: parsed.patternsIdentified || [],
        patternExplanations: parsed.patternExplanations || {},
        refactoringHints: parsed.refactoringHints || '',
        referenceSolutionApproach: parsed.referenceSolutionApproach || '',
        testCasesRecommendations: parsed.testCasesRecommendations || [],
        communicationScore: Math.min(100, Math.max(0, parsed.communicationScore || 75)),
        correctnessScore: Math.min(100, Math.max(0, parsed.correctnessScore || 75)),
        efficiencyScore: Math.min(100, Math.max(0, parsed.efficiencyScore || 75)),
        overallScore: Math.min(100, Math.max(0, parsed.overallScore || 75))
      };
      
      return review;
    } catch (error) {
      logger.error('Failed to parse review response', { error: error.message });
      // Return safe defaults
      return {
        timeComplexity: 'Error parsing',
        spaceComplexity: 'Error parsing',
        complexityAnalysis: 'Analysis failed',
        optimizationSuggestions: [],
        edgeCasesCovered: { found: [], missed: [] },
        patternsIdentified: [],
        patternExplanations: {},
        refactoringHints: '',
        referenceSolutionApproach: '',
        testCasesRecommendations: [],
        communicationScore: 50,
        correctnessScore: 50,
        efficiencyScore: 50,
        overallScore: 50
      };
    }
  }

  static async _logAIServiceUsage(userId, featureType, sessionId, usage, latencyMs, requestId) {
    try {
      await supabaseAdmin
        .from('ai_service_logs')
        .insert({
          feature_type: featureType,
          session_id: sessionId,
          user_id: userId,
          request_id: requestId,
          model_used: MODEL_CONFIG.model,
          prompt_tokens: usage?.prompt_tokens || 0,
          completion_tokens: usage?.completion_tokens || 0,
          total_tokens: usage?.total_tokens || 0,
          latency_ms: latencyMs,
          status: 'success'
        });
    } catch (error) {
      logger.warn('Failed to log AI service usage', { error: error.message });
      // Don't throw - this is non-critical
    }
  }
}

/**
 * Feature 2: AI Interview Simulator Service
 * Conducts realistic technical interviews with follow-ups and scoring
 */
export class InterviewSimulatorService {
  static _normalizeInterviewMode(mode) {
    const normalized = String(mode || '').trim().toLowerCase();
    if (INTERVIEW_RUNTIME_MODES.includes(normalized)) {
      return normalized;
    }

    const envMode = String(process.env.AI_INTERVIEW_MODE || '').trim().toLowerCase();
    if (INTERVIEW_RUNTIME_MODES.includes(envMode)) {
      return envMode;
    }

    return 'full_realtime';
  }

  static _buildInterviewRuntime(mode) {
    if (mode === 'full_realtime') {
      return {
        mode,
        realtime: true,
        strategy: 'realtime_voice_bridge',
        transport: 'websocket',
        bargeInEnabled: true,
        fallbackToBatch: false,
        targetFirstAudioMs: 800,
      };
    }

    return {
      mode: 'full_realtime',
      realtime: true,
      strategy: 'realtime_voice_bridge',
      transport: 'websocket',
      bargeInEnabled: true,
      fallbackToBatch: false,
      targetFirstAudioMs: 800,
    };
  }

  static _compressForRealtimeVoice(message, mode) {
    if (mode !== 'full_realtime') {
      return message;
    }

    const normalizedMessage = String(message || '').replace(/\s+/g, ' ').trim();
    if (!normalizedMessage) {
      return 'Good progress. Briefly explain your complexity and one edge case.';
    }

    const tokens = normalizedMessage.split(' ');
    const wordLimit = 35; // Match the prompt's word limit for realtime mode
    if (tokens.length <= wordLimit) {
      return normalizedMessage;
    }

    // Truncate at the last sentence boundary within the word budget
    const truncated = tokens.slice(0, wordLimit).join(' ');
    const lastSentenceEnd = Math.max(
      truncated.lastIndexOf('. '),
      truncated.lastIndexOf('? '),
      truncated.lastIndexOf('! '),
    );

    if (lastSentenceEnd > truncated.length * 0.4) {
      // Found a good sentence boundary past the 40% mark — use it
      return truncated.slice(0, lastSentenceEnd + 1).trim();
    }

    // No good boundary — truncate at word limit with ellipsis
    return `${truncated}...`;
  }

  static _buildStagePlan(interviewType = 'dsa') {
    return InterviewStateMachineService.buildStagePlan(interviewType);
  }

  static _buildInitialInterviewState(interviewType = 'dsa', difficulty = 'medium', companyFocus = null, totalQuestions = null) {
    return InterviewStateMachineService.createInitialState(interviewType, difficulty, companyFocus, totalQuestions);
  }

  static _advanceInterviewStage(state = {}) {
    return InterviewStateMachineService.advanceState(state);
  }

  static async getInterviewSession(sessionId, userId) {
    const virtualSession = virtualInterviewSessions.get(sessionId);
    if (virtualSession && virtualSession.user_id === userId) {
      return virtualSession;
    }

    const { data: persistedSession, error } = await supabaseAdmin
      .from('interview_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (!error && persistedSession) {
      return persistedSession;
    }

    throw new Error('Interview session not found');
  }

  static async initializeInterview(
    userId,
    interviewType = 'dsa',
    difficulty = 'medium',
    companyFocus = null,
    requestId = null,
    interviewMode = null,
    totalQuestions = null
  ) {
    try {
      const normalizedMode = this._normalizeInterviewMode(interviewMode);
      const runtime = this._buildInterviewRuntime(normalizedMode);
      const initialInterviewState = this._buildInitialInterviewState(interviewType, difficulty, companyFocus, totalQuestions);
      const telemetryAttributes = {
        'interview.user_id': String(userId || ''),
        'interview.type': String(interviewType || 'dsa'),
        'interview.difficulty': String(difficulty || 'medium'),
        'interview.mode': String(normalizedMode || 'full_realtime'),
      };

      logger.info('Interview session initialized', {
        userId,
        interviewType,
        difficulty,
        companyFocus,
        interviewMode: normalizedMode,
        requestId
      });

      // Create interview session record
      let sessionData = null;
      let sessionError = null;

      const payloadCandidates = [
        {
          user_id: userId,
          interview_type: interviewType,
          difficulty_level: difficulty,
          company_focus: companyFocus,
          status: 'in_progress',
          transcript: []
        },
        {
          user_id: userId,
          interview_type: interviewType,
          difficulty_level: difficulty,
          status: 'in_progress',
          transcript: []
        },
        {
          user_id: userId,
          interview_type: interviewType,
          difficulty: difficulty,
          company_focus: companyFocus,
          status: 'in_progress',
          transcript: []
        },
        {
          user_id: userId,
          interview_type: interviewType,
          difficulty: difficulty,
          status: 'in_progress',
          transcript: []
        }
      ];

      // Cache the working schema shape index to avoid re-probing on every call.
      // After the first successful insert, subsequent calls skip directly to the
      // known-good payload shape, eliminating 1-3 unnecessary failed inserts.
      const startIndex = _knownPayloadIndex !== null ? _knownPayloadIndex : 0;

      for (let i = startIndex; i < payloadCandidates.length; i++) {
        ({ data: sessionData, error: sessionError } = await supabaseAdmin
          .from('interview_sessions')
          .insert(payloadCandidates[i])
          .select()
          .single());

        if (!sessionError) {
          if (_knownPayloadIndex === null) {
            _knownPayloadIndex = i;
            logger.info(`Schema shape cached at index ${i}`);
          }
          break;
        }

        const isSchemaShapeError =
          isMissingColumnError(sessionError, 'company_focus') ||
          isMissingColumnError(sessionError, 'difficulty_level') ||
          isMissingColumnError(sessionError, 'difficulty');

        if (!isSchemaShapeError) {
          break;
        }
      }

      if (sessionError) {
        if (!isInterviewSchemaCompatibilityError(sessionError)) {
          throw new Error(`Failed to create interview session: ${sessionError.message}`);
        }

        logger.warn('Interview schema mismatch; using virtual session fallback', {
          userId,
          interviewType,
          requestId,
          error: sessionError.message,
          code: sessionError.code,
        });

        sessionData = {
          id: randomUUID(),
          user_id: userId,
          interview_type: interviewType,
          difficulty,
          company_focus: companyFocus,
          transcript: [],
          questions_asked: 0,
          follow_ups_count: 0,
          candidate_got_stuck: false,
          interview_context: {
            mode: normalizedMode,
            runtime,
          },
          status: 'in_progress',
          started_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        };
      }

      // Generate initial problem/scenario
      const problem = await interviewTelemetryService.withSpan(
        'interview.session.problem_select',
        { attributes: telemetryAttributes },
        async () => this._generateProblemStatement(interviewType, difficulty, companyFocus)
      );

      // Update session with problem
      let updatedSession = null;
      let updateError = null;
      ({ data: updatedSession, error: updateError } = await interviewTelemetryService.withSpan(
        'interview.session.problem_persist',
        {
          attributes: {
            ...telemetryAttributes,
            'interview.session_id': String(sessionData.id || ''),
          },
        },
        async () => supabaseAdmin
          .from('interview_sessions')
          .update({
            problem_statement: problem.statement,
            initial_requirements: problem.requirements,
            problem_id: problem.problem_id
          })
          .eq('id', sessionData.id)
          .select()
          .single()
      ));

      if (updateError && !isInterviewSchemaCompatibilityError(updateError)) {
        throw new Error(`Failed to update interview session: ${updateError.message}`);
      }

      if (updateError) {
        sessionData.problem_statement = problem.statement;
        sessionData.initial_requirements = problem.requirements;
        sessionData.problem_id = problem.problem_id;
        sessionData.interview_context = {
          ...(sessionData.interview_context || {}),
          mode: normalizedMode,
          runtime,
          interviewState: initialInterviewState,
          stage: initialInterviewState.stage,
          stageLabel: initialInterviewState.stageLabel,
        };
        virtualInterviewSessions.set(sessionData.id, { ...sessionData, _createdAt: Date.now() });
        updatedSession = sessionData;
      }

      logger.info('Interview session created', {
        userId,
        sessionId: sessionData.id,
        requestId
      });

      return {
        sessionId: updatedSession.id,
        problem: {
          statement: problem.statement,
          requirements: problem.requirements
        },
        stage: initialInterviewState.stage,
        stageLabel: initialInterviewState.stageLabel,
        stagePlan: initialInterviewState.stagePlan,
        interviewMode: normalizedMode,
        runtime,
        initialQuestion: this._composeInitialInterviewQuestion(problem, interviewType, difficulty, companyFocus),
        interviewerGreeting: this._generateInterviewerGreeting(interviewType, companyFocus)
      };

    } catch (error) {
      logger.error('Interview initialization failed', {
        userId,
        interviewType,
        error: error.message,
        requestId
      });
      throw error;
    }
  }

  static async processInterviewResponse(sessionId, userId, candidateResponse, requestId = null, interviewMode = null) {
    const startTime = Date.now();
    
    try {
      logger.info('Processing interview response', {
        sessionId,
        userId,
        responseLength: candidateResponse.length,
        requestId
      });

      // Get current session
      const session = await this.getInterviewSession(sessionId, userId);
      const currentContext = session.interview_context || {};
      const normalizedMode = this._normalizeInterviewMode(interviewMode || currentContext.mode);
      const telemetryAttributes = {
        'interview.session_id': String(sessionId || ''),
        'interview.user_id': String(userId || ''),
        'interview.mode': String(normalizedMode || 'full_realtime'),
        'interview.type': String(session.interview_type || 'dsa'),
      };
      const runtime = this._buildInterviewRuntime(normalizedMode);
      const interviewType = String(session.interview_type || 'dsa').toLowerCase();
      const responseSignals = this._extractResponseSignals(candidateResponse, interviewType);

      // ── Type-aware missing areas: only inject relevant signals ──────
      const newGaps = [];
      if (interviewType === 'behavioral' || interviewType === 'hr') {
        const responseLower = candidateResponse.toLowerCase();
        if (!/(situation|task|action|result)/.test(responseLower) && interviewType === 'behavioral') newGaps.push('STAR structure');
        if (!/\d+%|\d+ team|reduced|improved|increased/.test(responseLower)) newGaps.push('quantified impact');
      } else if (interviewType === 'system_design' || interviewType === 'system-design') {
        if (!responseSignals.hasTradeoffs) newGaps.push('trade-off discussion');
        if (!/scale|shard|partition|replica|cache/.test(candidateResponse.toLowerCase())) newGaps.push('scalability discussion');
      } else {
        if (!responseSignals.hasComplexity) newGaps.push('complexity analysis');
        if (!responseSignals.hasEdgeCases) newGaps.push('edge cases');
        if (!responseSignals.hasTradeoffs) newGaps.push('trade-off discussion');
      }
      const mergedMissingAreas = Array.from(
        new Set([
          ...(Array.isArray(currentContext.missingAreas) ? currentContext.missingAreas : []),
          ...newGaps,
        ])
      ).slice(-5);

      const interviewContext = {
        ...currentContext,
        mode: normalizedMode,
        runtime,
        turns: (currentContext.turns || 0) + 1,
        lastCandidateSummary: candidateResponse.slice(0, 220),
        lastSignals: responseSignals,
        missingAreas: mergedMissingAreas,
        interviewType,
      };

      const priorInterviewState = currentContext.interviewState
        || this._buildInitialInterviewState(
          session.interview_type,
          session.difficulty_level || session.difficulty || 'medium',
          session.company_focus || null,
        );
      const advancedInterviewState = this._advanceInterviewStage({
        ...priorInterviewState,
        turns: interviewContext.turns,
      });

      interviewContext.interviewState = advancedInterviewState;
      interviewContext.stage = advancedInterviewState.stage;
      interviewContext.stageLabel = advancedInterviewState.stageLabel;

      // Add candidate response to transcript
      const updatedTranscript = [
        ...(session.transcript || []),
        {
          role: 'candidate',
          text: candidateResponse,
          timestamp: new Date().toISOString()
        }
      ];

      // Generate interviewer follow-up
      let followUp;
      let groundingContext = null;
      try {
        groundingContext = await interviewTelemetryService.withSpan(
          'interview.grounding.fetch',
          {
            attributes: {
              ...telemetryAttributes,
              'interview.stage': String(advancedInterviewState.stage || 'intake'),
            },
          },
          async (span) => {
            const grounded = await interviewGroundingService.fetchContext({
              company: session.company_focus || null,
              role: interviewContext.role || 'SDE',
              difficulty: interviewContext.currentDifficulty || session.difficulty_level || session.difficulty || 'medium',
              stage: advancedInterviewState.stage,
              interviewType,
              missingAreas: interviewContext.missingAreas || [],
              resumeContext: interviewContext.resumeContext || {},
              limit: 4,
            });
            if (grounded?.provider) {
              span.setAttribute('interview.grounding.provider', String(grounded.provider));
            }
            span.setAttribute('interview.grounding.count', Number(grounded?.count || 0));
            return grounded;
          }
        );
      } catch (error) {
        logger.warn('Interview grounding retrieval failed; continuing without grounding', {
          sessionId,
          userId,
          requestId,
          error: error.message,
        });
      }

      try {
        followUp = await interviewTelemetryService.withSpan(
          'interview.followup.generate',
          {
            attributes: {
              ...telemetryAttributes,
              'interview.stage': String(advancedInterviewState.stage || 'intake'),
            },
          },
          async () => this._generateInterviewerFollowUp(
            session.problem_statement,
            session.transcript || [],
            candidateResponse,
            session.interview_type,
            interviewContext,
            normalizedMode,
            groundingContext
          )
        );
      } catch (error) {
        logger.warn('Falling back to local interviewer follow-up', {
          sessionId,
          userId,
          requestId,
          error: error.message,
        });
        followUp = InterviewConversationService.buildFallbackFollowUp(normalizedMode, session.interview_type);
      }
      followUp.message = this._compressForRealtimeVoice(followUp.message, normalizedMode);

      // Add interviewer response to transcript
      updatedTranscript.push({
        role: 'interviewer',
        text: followUp.message,
        timestamp: new Date().toISOString()
      });

      // Analyze candidate response
      let analysis;
      try {
        analysis = await interviewTelemetryService.withSpan(
          'interview.analysis.score',
          {
            attributes: {
              ...telemetryAttributes,
              'interview.stage': String(advancedInterviewState.stage || 'intake'),
            },
          },
          async (span) => {
            const analyzed = await this._analyzeInterviewResponse(
              candidateResponse,
              session.problem_statement,
              session.interview_type,
              interviewContext
            );
            span.setAttribute('interview.analysis.score', Number(analyzed?.score || 0));
            span.setAttribute('interview.analysis.stuck', Boolean(analyzed?.candidateStuck));
            return analyzed;
          }
        );
      } catch (error) {
        logger.warn('Falling back to local interview analysis', {
          sessionId,
          userId,
          requestId,
          error: error.message,
        });
        const feedbackByType = {
          behavioral: 'Good structure. Keep improving specificity and measurable outcomes.',
          hr: 'Nice start. Add more detail about your motivation and career direction.',
          system_design: 'Good foundation. Keep improving scalability reasoning and trade-off coverage.',
          'system-design': 'Good foundation. Keep improving scalability reasoning and trade-off coverage.',
        };
        analysis = {
          score: 70,
          candidateStuck: false,
          feedback: feedbackByType[String(session.interview_type || '').toLowerCase()] || 'Good structure. Keep improving clarity and edge-case coverage.',
          strengths: ['Structured thinking'],
        };
      }

      // Update session
      const { currentScores, adaptiveUpdate, adaptiveFollowUp } = await interviewTelemetryService.withSpan(
        'interview.scoring.update',
        {
          attributes: {
            ...telemetryAttributes,
            'interview.stage': String(advancedInterviewState.stage || 'intake'),
          },
        },
        async (span) => {
          const scores = this._calculateRollingScores(analysis, updatedTranscript, session.interview_type, session.experience_level);

          // ── Score history + trend analysis (sliding window) ─────────
          // Must be computed before adaptive difficulty since difficulty decisions
          // depend on trend/volatility data to block escalation for erratic candidates.
          const scoreHistory = InterviewScoringService.buildScoreHistory(
            updatedTranscript,
            interviewContext,
            5,
          );
          const scoreTrend = InterviewScoringService.calculateTrendFromHistory(scoreHistory);

          const currentDifficulty =
            interviewContext.currentDifficulty ||
            session.difficulty_level ||
            session.difficulty ||
            'medium';
          const adaptive = this._deriveAdaptiveDifficulty(currentDifficulty, scores.overall, interviewContext.turns || 1, scoreTrend);

          const followUpRules = InterviewFollowUpRulesService.decideBranch({
            analysis,
            interviewContext: {
              ...interviewContext,
              previousScore: Number(interviewContext?.currentScores?.overall || 0) * 10,
            },
            candidateResponse,
            candidateCode: interviewContext?.lastCandidateCode || '',
            scoreHistory,
            scoreTrend,
          });
          span.setAttribute('interview.score.overall', Number(scores?.overall || 0));
          span.setAttribute('interview.score.difficulty', String(adaptive?.newDifficulty || currentDifficulty));
          span.setAttribute('interview.followup.next_action', String(followUpRules?.nextAction || 'followup_clarify'));
          span.setAttribute('interview.score.trend', String(scoreTrend?.trend || 'stable'));
          span.setAttribute('interview.score.volatility', String(scoreTrend?.volatility || 'stable'));
          return { currentScores: scores, adaptiveUpdate: adaptive, adaptiveFollowUp: followUpRules, scoreHistory };
        }
      );
      const telemetry = this._buildInterviewTelemetrySnapshot({
        previousTelemetry: currentContext.telemetry || {},
        turnNumber: interviewContext.turns || 1,
        previousStage: priorInterviewState.stage,
        nextStage: advancedInterviewState.stage,
        responseLatencyMs: Date.now() - startTime,
        groundingUsed: Boolean(groundingContext?.retrievedQuestions?.length),
        analysisScore: analysis.score,
      });

      const updatePayload = {
        transcript: updatedTranscript,
        questions_asked: (session.questions_asked || 0) + 1,
        follow_ups_count: (session.follow_ups_count || 0) + (followUp.isFollowUp ? 1 : 0),
        candidate_got_stuck: analysis.candidateStuck || session.candidate_got_stuck,
        interview_context: {
          ...interviewContext,
          currentDifficulty: adaptiveUpdate.newDifficulty,
          adaptiveReason: adaptiveUpdate.reason,
          currentScores,
          lastInterviewerPrompt: followUp.message,
          missingAreas: Array.from(new Set([...(interviewContext.missingAreas || []), ...(analysis.nextFocus || [])])).slice(-5),
          adaptiveFollowUp,
          scoreHistory,
          telemetry,
        },
        updated_at: new Date().toISOString()
      };

      let updatedSession = null;
      let updateError = null;
      ({ data: updatedSession, error: updateError } = await interviewTelemetryService.withSpan(
        'interview.session.persist',
        {
          attributes: {
            ...telemetryAttributes,
            'interview.stage': String(advancedInterviewState.stage || 'intake'),
            'interview.turn': Number(interviewContext.turns || 1),
          },
        },
        async () => supabaseAdmin
          .from('interview_sessions')
          .update(updatePayload)
          .eq('id', sessionId)
          .select()
          .single()
      ));

      if (updateError) {
        if (!isInterviewSchemaCompatibilityError(updateError)) {
          throw new Error(`Failed to update interview session: ${updateError.message}`);
        }
        const virtualSession = {
          ...session,
          ...updatePayload,
          id: sessionId,
          user_id: userId,
        };
        virtualInterviewSessions.set(sessionId, { ...virtualSession, _createdAt: Date.now() });
        updatedSession = virtualSession;
      }

      // Log service usage
      await CodeReviewService._logAIServiceUsage(userId, 'interview_simulation', sessionId, {}, Date.now() - startTime, requestId);

      logger.info('Interview response processed', {
        sessionId,
        userId,
        analysisScore: analysis.score,
        processingTimeMs: Date.now() - startTime,
        requestId
      });

      return {
        interviewerMessage: followUp.message,
        feedback: analysis.feedback,
        clarifications: followUp.clarifications,
        hints: followUp.hints,
        encouragement: followUp.encouragement,
        continueInterview: followUp.continueInterview,
        stage: advancedInterviewState.stage,
        stageLabel: advancedInterviewState.stageLabel,
        stagePlan: advancedInterviewState.stagePlan,
        interviewMode: normalizedMode,
        runtime,
        current_scores: currentScores,
        adaptive_update: adaptiveUpdate,
        adaptive_followup: adaptiveFollowUp,
        score_trend: adaptiveFollowUp?.scoreTrend || null,
        telemetry,
      };

    } catch (error) {
      logger.error('Interview response processing failed', {
        sessionId,
        userId,
        error: error.message,
        requestId
      });
      throw error;
    }
  }

  static async completeInterview(sessionId, userId, requestId = null) {
    try {
      logger.info('Completing interview', { sessionId, userId, requestId });
      const telemetryAttributes = {
        'interview.session_id': String(sessionId || ''),
        'interview.user_id': String(userId || ''),
      };

      // Get final session data
      const session = await interviewTelemetryService.withSpan(
        'interview.session.load_for_completion',
        { attributes: telemetryAttributes },
        async () => this.getInterviewSession(sessionId, userId)
      );

      // Generate comprehensive performance analysis
      const analysis = await interviewTelemetryService.withSpan(
        'interview.completion.analysis',
        {
          attributes: {
            ...telemetryAttributes,
            'interview.type': String(session.interview_type || 'dsa'),
          },
        },
        async () => this._generatePerformanceAnalysis(session)
      );

      // Calculate overall scores
      const scores = await interviewTelemetryService.withSpan(
        'interview.completion.scores',
        {
          attributes: {
            ...telemetryAttributes,
            'interview.type': String(session.interview_type || 'dsa'),
          },
        },
        async (span) => {
          const calculated = this._calculateScores(analysis, session.transcript, session.interview_type);
          span.setAttribute('interview.score.final', Number(calculated?.interviewScore || 0));
          return calculated;
        }
      );

      // Get or create performance trend
      await this._updatePerformanceTrend(userId, session.interview_type, session.company_focus, scores);

      // ── Compute final session score trend from accumulated history ───
      const sessionContext = session.interview_context || {};
      const finalScoreHistory = Array.isArray(sessionContext.scoreHistory) ? sessionContext.scoreHistory : [];
      const finalScoreTrend = InterviewScoringService.calculateTrendFromHistory(finalScoreHistory);

      const startedAt = new Date(session.started_at || session.created_at || Date.now());
      const totalDurationSeconds = Math.max(0, Math.floor((Date.now() - startedAt.getTime()) / 1000));

      // ── Generate human-readable trend narrative ──────────────────────
      const trendNarrative = this._generateTrendNarrative(finalScoreTrend, scores.interviewScore, analysis.areasForImprovement);

      // Update session with final analysis
      const completionPayload = {
        status: 'completed',
        completed_at: new Date().toISOString(),
        total_duration_seconds: totalDurationSeconds,
        performance_metrics: analysis.metrics,
        strengths: analysis.strengths,
        areas_for_improvement: analysis.areasForImprovement,
        critical_mistakes: analysis.criticalMistakes,
        interview_score: scores.interviewScore,
        communication_clarity_score: scores.communicationScore,
        problem_solving_score: scores.problemSolvingScore,
        technical_depth_score: scores.technicalDepthScore,
        recommendations: analysis.recommendations,
        follow_up_practice_problems: analysis.followUpProblems,
        trend_narrative: trendNarrative,
        score_trend_summary: {
          trend: finalScoreTrend.trend,
          volatility: finalScoreTrend.volatility,
          mean: finalScoreTrend.mean,
          stdDev: finalScoreTrend.stdDev,
          delta: finalScoreTrend.delta,
          turnsTracked: finalScoreHistory.length,
        },
      };

      let completedSession = null;
      let updateError = null;
      ({ data: completedSession, error: updateError } = await interviewTelemetryService.withSpan(
        'interview.session.complete_persist',
        {
          attributes: {
            ...telemetryAttributes,
            'interview.type': String(session.interview_type || 'dsa'),
          },
        },
        async () => supabaseAdmin
          .from('interview_sessions')
          .update(completionPayload)
          .eq('id', sessionId)
          .select()
          .single()
      ));

      if (updateError) {
        if (!isInterviewSchemaCompatibilityError(updateError)) {
          throw new Error(`Failed to complete interview: ${updateError.message}`);
        }

        completedSession = {
          ...session,
          ...completionPayload,
          id: sessionId,
          user_id: userId,
        };
        virtualInterviewSessions.set(sessionId, { ...completedSession, _createdAt: Date.now() });
      } else {
        virtualInterviewSessions.delete(sessionId);
      }

      logger.info('Interview completed', {
        sessionId,
        userId,
        interviewScore: scores.interviewScore,
        requestId
      });

      return completedSession;

    } catch (error) {
      logger.error('Interview completion failed', {
        sessionId,
        userId,
        error: error.message,
        requestId
      });
      throw error;
    }
  }

  static _generateInterviewerGreeting(interviewType, companyFocus) {
    const greetings = {
      dsa: `Thanks for joining. I will run this like a real technical screen. Think out loud, ask clarifying questions, and explain trade-offs as you go.`,
      system_design: `Great to meet you. This will be a realistic system design round. I care about scope, constraints, architecture choices, and trade-offs.`,
      behavioral: `Thanks for being here. We will run this like a structured behavioral interview. Use concrete examples and focus on impact.`,
      hr: `Welcome. This will be a conversational HR round. Be yourself, share what motivates you, and feel free to ask me questions too.`,
      mixed: `Welcome. This will be a blended interview with coding, design, and behavioral prompts, similar to an onsite loop.`
    };

    const greeting = greetings[interviewType] || greetings.dsa;
    
    if (companyFocus) {
      return `${greeting} I will also calibrate style to a ${companyFocus} interview bar.`;
    }
    
    return greeting;
  }

  static _composeInitialInterviewQuestion(problem, interviewType, difficulty, companyFocus) {
    const difficultyTone = {
      easy: 'Start by outlining a straightforward approach, then we can refine.',
      medium: 'Start with your baseline approach and then discuss optimizations.',
      hard: 'Start with assumptions and constraints, then propose a robust approach.'
    };

    const focusLine = companyFocus
      ? `Assume interviewer expectations are aligned with ${companyFocus}.`
      : 'Assume this is a standard top-tier technical interview.';

    if (interviewType === 'behavioral') {
      return `${focusLine} Tell me about a high-pressure project where priorities changed midstream. What was the context, what actions did you take, and what was the measurable outcome?`;
    }

    if (interviewType === 'hr') {
      return `${focusLine} Thanks for joining. Tell me about yourself — what excites you about this career direction and what are you looking for in your next role?`;
    }

    if (interviewType === 'system_design') {
      return `${focusLine} Let's design a production-ready solution for this prompt: ${problem.statement} Start by clarifying scale, users, and non-functional requirements before diving into architecture.`;
    }

    return `${focusLine} Here is your problem: ${problem.statement} ${difficultyTone[difficulty] || difficultyTone.medium}`;
  }

  static async _generateProblemStatement(interviewType, difficulty, companyFocus) {
    const problems = {
      dsa: {
        easy: [
          { statement: 'Given an array of integers, find the maximum product of any two elements.', requirements: 'Time: O(n), Space: O(1). Handle negative numbers.' },
          { statement: 'Given a string, determine if it is a valid palindrome considering only alphanumeric characters.', requirements: 'Time: O(n), Space: O(1). Ignore case differences.' },
          { statement: 'Given two sorted arrays, merge them into one sorted array without extra space proportional to their combined length.', requirements: 'Time: O(n+m), Space: O(1) extra. Handle empty arrays.' },
        ],
        medium: [
          { statement: 'Design an LRU (Least Recently Used) Cache with get() and put() operations.', requirements: 'Both operations should be O(1). Support custom capacity.' },
          { statement: 'Given a binary tree, return the level order traversal of its nodes values grouped by level.', requirements: 'Time: O(n). Handle empty trees and single-node trees.' },
          { statement: 'Find the length of the longest substring without repeating characters in a given string.', requirements: 'Time: O(n), Space: O(min(n, alphabet)). Handle empty strings and single characters.' },
        ],
        hard: [
          { statement: 'Implement a data structure for Median Finder that supports addNum() and findMedian() operations.', requirements: 'addNum() in O(log n), findMedian() in O(1). Support continuous stream of numbers.' },
          { statement: 'Given a matrix of 0s and 1s, find the largest rectangle containing only 1s and return its area.', requirements: 'Time: O(rows * cols), Space: O(cols). Handle edge cases with empty or single-element matrices.' },
          { statement: 'Implement a trie-based autocomplete system that returns the top 3 suggestions for each character typed.', requirements: 'Insert in O(word length), search in O(prefix length + k). Support ranking by frequency.' },
        ],
      },
      system_design: {
        easy: [
          { statement: 'Design a URL shortening service like bit.ly.', requirements: 'Handle 100M URLs, support custom aliases, track click analytics.' },
          { statement: 'Design a paste bin service that allows users to share text snippets via unique links.', requirements: 'Support expiry, access control (public/private), and 10K concurrent users.' },
          { statement: 'Design a task queue system that processes background jobs reliably.', requirements: 'Support retries, priority, and dead-letter queues. Handle at-least-once delivery.' },
        ],
        medium: [
          { statement: 'Design a real-time chat application supporting 1-on-1 and group messaging.', requirements: 'Support 1M concurrent users, message delivery guarantees, and read receipts.' },
          { statement: 'Design a notification system that delivers push, email, and SMS notifications.', requirements: 'Support rate limiting, user preferences, and 10M notifications/day throughput.' },
          { statement: 'Design a ride-sharing service like Uber for matching drivers and riders in real-time.', requirements: 'Support geo-proximity matching, surge pricing, and ETA calculation.' },
        ],
        hard: [
          { statement: 'Design a distributed video streaming platform similar to YouTube.', requirements: 'Support adaptive bitrate, CDN distribution, 100M daily active users, and live streaming.' },
          { statement: 'Design a global-scale social media news feed (like Twitter/X) with real-time updates.', requirements: 'Support fan-out, ranking, 500M users, and sub-second latency for hot users.' },
          { statement: 'Design a distributed search engine that indexes and queries billions of web pages.', requirements: 'Support relevance ranking, real-time indexing, and horizontal scaling.' },
        ],
      },
      behavioral: {
        easy: [
          { statement: 'Tell me about a time when you had to learn a new technology or tool quickly to meet a project deadline.', requirements: 'Focus on learning approach, time management, and outcome.' },
          { statement: 'Describe a situation where you received constructive criticism. How did you respond?', requirements: 'Focus on self-awareness, growth mindset, and concrete changes made.' },
          { statement: 'Tell me about a time you helped a teammate who was struggling with their work.', requirements: 'Focus on empathy, communication, and team impact.' },
        ],
        medium: [
          { statement: 'Tell me about a time you had to make a difficult technical decision with incomplete information.', requirements: 'Focus on decision-making framework, risk assessment, and outcome.' },
          { statement: 'Describe a situation where you disagreed with your manager or team lead about a technical approach.', requirements: 'Focus on professional conflict resolution, evidence-based arguments, and relationship preservation.' },
          { statement: 'Tell me about a project that failed or did not meet expectations. What was your role and what did you learn?', requirements: 'Focus on accountability, root cause analysis, and applied lessons.' },
        ],
        hard: [
          { statement: 'Describe a time when you had to lead a cross-functional initiative under tight deadlines and shifting priorities.', requirements: 'Focus on stakeholder management, prioritization, and measurable business impact.' },
          { statement: 'Tell me about a time you identified and drove a significant technical improvement that required buy-in from multiple teams.', requirements: 'Focus on influence without authority, technical vision, and quantified results.' },
          { statement: 'Describe a high-pressure production incident you managed. Walk me through your decision-making process.', requirements: 'Focus on incident leadership, communication under pressure, and post-mortem actions.' },
        ],
      },
      hr: {
        easy: [
          { statement: 'Tell me about yourself and what excites you about this career direction.', requirements: 'Focus on career narrative, motivation, and role alignment.' },
          { statement: 'What are your greatest strengths, and how have they helped you in your work or studies?', requirements: 'Focus on self-awareness, concrete examples, and relevance to the role.' },
          { statement: 'Where do you see yourself in 3-5 years?', requirements: 'Focus on growth mindset, realistic ambition, and alignment with company trajectory.' },
        ],
        medium: [
          { statement: 'What kind of work environment brings out the best in you? Describe your ideal team culture.', requirements: 'Focus on self-knowledge, collaboration style, and cultural fit signals.' },
          { statement: 'How do you handle work-life balance, especially during high-pressure periods?', requirements: 'Focus on sustainability, boundary-setting, and professional maturity.' },
          { statement: 'What is a professional challenge you are currently working on improving?', requirements: 'Focus on honest self-assessment, active improvement plan, and growth examples.' },
        ],
        hard: [
          { statement: 'Describe a time when your values conflicted with a company decision. How did you navigate it?', requirements: 'Focus on ethical reasoning, professional judgment, and constructive resolution.' },
          { statement: 'If you had to choose between delivering a feature on time with technical debt or delaying for quality, how would you decide?', requirements: 'Focus on trade-off reasoning, stakeholder awareness, and communication approach.' },
          { statement: 'What would you do in your first 90 days if you joined our team?', requirements: 'Focus on learning orientation, relationship building, and early contribution strategy.' },
        ],
      },
    };

    // Normalize type aliases
    const normalizedType = String(interviewType || 'dsa').toLowerCase().replace('system-design', 'system_design');
    const normalizedDifficulty = String(difficulty || 'medium').toLowerCase();

    // Select problem pool — fall back to DSA medium if type/difficulty unknown
    const typePool = problems[normalizedType] || problems.dsa;
    const difficultyPool = typePool[normalizedDifficulty] || typePool.medium || typePool.easy;
    const pool = Array.isArray(difficultyPool) ? difficultyPool : [difficultyPool];

    // Random selection within the difficulty tier
    const selected = pool[Math.floor(Math.random() * pool.length)];

    return {
      problem_id: null,
      statement: selected.statement,
      requirements: selected.requirements,
    };
  }

  static async _generateInterviewerFollowUp(
    problemStatement,
    transcript,
    candidateResponse,
    interviewType,
    interviewContext = {},
    interviewMode = 'full_realtime',
    ragContext = null
  ) {
    const prompt = await interviewTelemetryService.withSpan(
      'interview.prompt.build',
      {
        attributes: {
          'interview.mode': String(interviewMode || 'full_realtime'),
          'interview.type': String(interviewType || 'dsa'),
          'interview.stage': String(interviewContext?.stage || interviewContext?.interviewState?.stage || 'intake'),
          'interview.transcript_count': Number(Array.isArray(transcript) ? transcript.length : 0),
        },
      },
      async () => InterviewPromptService.buildFollowUpPrompt({
        problemStatement,
        transcript,
        candidateResponse,
        interviewType,
        interviewContext,
        interviewMode,
        ragContext,
      })
    );

    const rawFollowUp = await interviewTelemetryService.withSpan(
      'interview.model.call',
      {
        attributes: {
          'interview.mode': String(interviewMode || 'full_realtime'),
          'interview.type': String(interviewType || 'dsa'),
          'interview.stage': String(interviewContext?.stage || interviewContext?.interviewState?.stage || 'intake'),
          'interview.model.name': String(INTERVIEW_MODEL_CONFIG.model),
        },
      },
      async (span) => {
        const raw = await InterviewConversationService.requestFollowUpContent({
          groqClient: groq,
          modelConfig: INTERVIEW_MODEL_CONFIG,
          prompt,
        });
        setSpanAttribute(span, 'interview.model.latency_ms', Number(raw.modelLatencyMs || 0));
        setSpanAttribute(span, 'interview.model.fallback_triggered', Boolean(raw.fallbackTriggered));
        return raw;
      }
    );

    return interviewTelemetryService.withSpan(
      'interview.response.parse',
      {
        attributes: {
          'interview.mode': String(interviewMode || 'full_realtime'),
          'interview.type': String(interviewType || 'dsa'),
          'interview.stage': String(interviewContext?.stage || interviewContext?.interviewState?.stage || 'intake'),
        },
      },
      async (span) => {
        const normalized = InterviewConversationService.normalizeFollowUp({
          content: rawFollowUp?.content,
          interviewMode,
          interviewType,
          forceFallback: Boolean(rawFollowUp?.fallbackTriggered),
        });
        setSpanAttribute(span, 'interview.parse.success', Boolean(normalized.parseSuccess));
        setSpanAttribute(span, 'interview.parse.fallback_triggered', Boolean(normalized.parseFallbackTriggered));
        addSpanEvent(span, 'interview.followup.branch', {
          parseFallback: Boolean(normalized.parseFallbackTriggered),
        });
        return {
          ...normalized.followUp,
          telemetryMeta: {
            modelName: String(rawFollowUp?.modelName || INTERVIEW_MODEL_CONFIG.model),
            modelLatencyMs: Number(rawFollowUp?.modelLatencyMs || 0),
            modelFallbackTriggered: Boolean(rawFollowUp?.fallbackTriggered),
            parseFallbackTriggered: Boolean(normalized.parseFallbackTriggered),
            parseSuccess: Boolean(normalized.parseSuccess),
          },
        };
      }
    );
  }

  static _extractResponseSignals(response, interviewType = 'dsa') {
    const text = String(response || '');
    const lower = text.toLowerCase();
    const normalizedType = String(interviewType || 'dsa').toLowerCase();
    const wordCount = lower.split(/\s+/).filter(Boolean).length;
    const hasComplexity = /o\s*\(|time complexity|space complexity/.test(lower);
    const hasEdgeCases = /edge case|boundary|empty|null|duplicate|single/.test(lower);
    const hasTradeoffs = /trade.?off|pros?|cons?|cost|latency|memory/.test(lower);
    const hasStructure = /(first|then|next|finally|because|therefore)/.test(lower);
    const hasExample = /for example|e\.g\.|let\s+us\s+say|suppose/.test(lower);

    // HR/behavioral candidates give shorter conversational answers — lower word threshold
    const stuckWordThreshold = (normalizedType === 'hr' || normalizedType === 'behavioral') ? 8 : 14;
    const candidateStuck = wordCount < stuckWordThreshold || /i\s+don\'t\s+know|stuck|not sure|blanking/.test(lower);

    return {
      wordCount,
      hasComplexity,
      hasEdgeCases,
      hasTradeoffs,
      hasStructure,
      hasExample,
      candidateStuck,
    };
  }

  static _buildTypeRubric(interviewType) {
    return InterviewScoringService.buildTypeRubric(interviewType);
  }

  static _calculateRollingScores(analysis, transcript, interviewType = 'dsa', experienceLevel = null) {
    return InterviewScoringService.calculateRollingScores(analysis, transcript, interviewType, experienceLevel);
  }

  static _deriveAdaptiveDifficulty(currentDifficulty, rollingOverallTen, turns, scoreTrend = null) {
    return InterviewScoringService.deriveAdaptiveDifficulty(currentDifficulty, rollingOverallTen, turns, scoreTrend);
  }

  static _buildInterviewTelemetrySnapshot({
    previousTelemetry = {},
    turnNumber = 1,
    previousStage = null,
    nextStage = null,
    responseLatencyMs = 0,
    groundingUsed = false,
    analysisScore = null,
  } = {}) {
    return interviewTelemetryService.buildInterviewTelemetrySnapshot({
      previousTelemetry,
      turnNumber,
      previousStage,
      nextStage,
      responseLatencyMs,
      groundingUsed,
      analysisScore,
    });
  }

  static async _analyzeInterviewResponse(response, problemStatement, interviewType, interviewContext = {}) {
    const signals = this._extractResponseSignals(response, interviewType);
    const normalizedType = String(interviewType || 'dsa').toLowerCase();
    const responseLower = String(response || '').toLowerCase();
    let score = 50;

    score += Math.min(20, Math.floor(signals.wordCount / 8));
    if (signals.hasStructure) score += 8;
    if (signals.hasExample) score += 4;
    const stuckPenalty = (normalizedType === 'hr' || normalizedType === 'behavioral') ? 8 : 18;
    if (signals.candidateStuck) score -= stuckPenalty;

    const nextFocus = [];
    const strengths = [];
    const feedbackSegments = [];

    if (signals.hasStructure) {
      strengths.push('Clear step-by-step structure');
      feedbackSegments.push('Good structure in your explanation');
    }
    if (signals.hasExample) strengths.push('Used concrete examples');

    // ── Type-specific scoring and feedback ────────────────────────────
    const hasScalability = /scale|shard|partition|replica|cache|throughput|availability/.test(responseLower);
    const hasStarSignals = /(situation|task|action|result)/.test(responseLower);
    const hasMotivation = /passion|excited|career goal|interested in|drawn to/.test(responseLower);
    const hasValues = /team|collaborate|learn|grow|mentor|culture/.test(responseLower);

    if (normalizedType === 'behavioral' || normalizedType === 'hr') {
      // Behavioral/HR: reward STAR signals and specificity, not complexity
      if (hasStarSignals) score += 10;
      if (hasMotivation) score += 5;
      if (hasValues) score += 5;

      if (!hasStarSignals && normalizedType === 'behavioral') {
        nextFocus.push('STAR structure');
        feedbackSegments.push('structure your answer with Situation, Task, Action, Result');
      }
      if (!/\d+%|\d+ team|\d+ month|reduced|improved|increased/.test(responseLower)) {
        nextFocus.push('quantified impact');
        feedbackSegments.push('add specific numbers or metrics to strengthen your story');
      }
      if (normalizedType === 'hr' && !hasMotivation) {
        nextFocus.push('career motivation');
        feedbackSegments.push('share what specifically excites you about this direction');
      }
    } else if (normalizedType === 'system_design' || normalizedType === 'system-design') {
      // System design: reward architecture and scalability, not algorithm complexity
      if (hasScalability) score += 8;
      if (signals.hasTradeoffs) score += 6;
      if (/microservice|monolith|api gateway|message queue|database/.test(responseLower)) score += 6;

      if (!hasScalability) {
        nextFocus.push('scalability discussion');
        feedbackSegments.push('discuss how your design handles scale');
      }
      if (!signals.hasTradeoffs) {
        nextFocus.push('trade-off discussion');
        feedbackSegments.push('compare design alternatives with concrete trade-offs');
      }
    } else {
      // DSA / default
      if (signals.hasComplexity) score += 8;
      if (signals.hasEdgeCases) score += 7;
      if (signals.hasTradeoffs) score += 5;

      if (signals.hasComplexity) strengths.push('Included complexity reasoning');
      if (!signals.hasComplexity) {
        nextFocus.push('complexity analysis');
        feedbackSegments.push('add explicit time and space complexity');
      }
      if (!signals.hasEdgeCases) {
        nextFocus.push('edge cases');
        feedbackSegments.push('cover key edge cases before concluding');
      }
      if (!signals.hasTradeoffs) {
        nextFocus.push('trade-off discussion');
        feedbackSegments.push('mention trade-offs of your approach');
      }
    }

    const boundedScore = Math.max(0, Math.min(100, score));

    const communicationMetric = Math.max(45, Math.min(95, 55 + (signals.hasStructure ? 15 : 0) + (signals.hasExample ? 10 : 0) + Math.min(10, Math.floor(signals.wordCount / 25)) + (hasStarSignals ? 8 : 0)));
    const decompositionMetric = Math.max(45, Math.min(95, 52 + (signals.hasStructure ? 18 : 0) + (signals.hasEdgeCases ? 10 : 0) + (hasScalability ? 7 : 0)));
    const efficiencyMetric = Math.max(40, Math.min(95, 50 + (signals.hasComplexity ? 18 : 0) + (signals.hasTradeoffs ? 12 : 0) + (hasScalability ? 10 : 0)));

    const rubric = this._buildTypeRubric(interviewType);
    const weightedScore = Number((
      communicationMetric * rubric.communication +
      decompositionMetric * rubric.decomposition +
      efficiencyMetric * rubric.technical
    ).toFixed(1));

    return {
      score: Number(((boundedScore + weightedScore) / 2).toFixed(1)),
      candidateStuck: signals.candidateStuck,
      feedback: `${feedbackSegments.join('; ') || 'Solid response. Keep refining precision and confidence.'}.`,
      strengths,
      nextFocus,
      metrics: {
        clarity: communicationMetric,
        problemDecomposition: decompositionMetric,
        communication: communicationMetric,
        efficiency: efficiencyMetric,
      },
      contextTurn: interviewContext.turns || 0,
    };
  }

  static async _generatePerformanceAnalysis(session) {
    const transcript = Array.isArray(session.transcript) ? session.transcript : [];
    const candidateTurns = transcript.filter((entry) => entry.role === 'candidate');
    const candidateTexts = candidateTurns.map((entry) => String(entry.text || ''));
    const totalWords = candidateTexts
      .join(' ')
      .split(/\s+/)
      .filter(Boolean)
      .length;
    const avgWordsPerTurn = candidateTurns.length > 0 ? totalWords / candidateTurns.length : 0;
    const allCandidateText = candidateTexts.join(' ').toLowerCase();
    const interviewType = String(session.interview_type || 'dsa').toLowerCase();

    // ── Type-specific signal extraction ────────────────────────────────
    const dsaSignals = {
      mentionComplexity: /o\s*\(|time complexity|space complexity/.test(allCandidateText),
      mentionEdgeCases: /edge case|boundary|empty|null|duplicate|single/.test(allCandidateText),
      mentionTradeoffs: /trade.?off|pros?|cons?|latency|memory/.test(allCandidateText),
    };

    const behavioralSignals = {
      hasSituation: /situation|context|we were facing|at that time|when we/.test(allCandidateText),
      hasAction: /i decided|i implemented|i led|i created|i organized|i took/.test(allCandidateText),
      hasResult: /result|outcome|impact|achieved|reduced|improved|increased/.test(allCandidateText),
      hasSpecifics: /\d+%|\d+ team|\d+ month|\$\d|reduced by|increased by/.test(allCandidateText),
    };

    const sysDesignSignals = {
      mentionScalability: /scale|horizontal|vertical|shard|partition|replica|load balanc/.test(allCandidateText),
      mentionArchitecture: /microservice|monolith|api gateway|message queue|cache|cdn|database/.test(allCandidateText),
      mentionTradeoffs: /trade.?off|cap theorem|consistency|availability|latency/.test(allCandidateText),
    };

    const hrSignals = {
      hasMotivation: /passion|excited|drawn to|interested in|career goal|aspire|want to/.test(allCandidateText),
      hasValues: /team|collaborate|learn|grow|mentor|culture|value|integrity/.test(allCandidateText),
      hasSelfAwareness: /weakness|improve|learn from|mistake|feedback|challenge/.test(allCandidateText),
    };

    // ── Compute metrics based on interview type ───────────────────────
    let clarity, decomposition, communication, efficiency;
    const strengths = [];
    const areasForImprovement = [];

    if (interviewType === 'behavioral' || interviewType === 'hr') {
      const bs = interviewType === 'hr' ? hrSignals : behavioralSignals;
      const signalCount = Object.values(bs).filter(Boolean).length;

      clarity = Math.max(45, Math.min(95, 55 + Math.min(25, Math.floor(avgWordsPerTurn / 4))));
      communication = Math.max(45, Math.min(95, 56 + Math.min(20, candidateTurns.length * 3)));
      decomposition = Math.max(45, Math.min(95, 50 + signalCount * 10 + (candidateTurns.length >= 3 ? 8 : 0)));
      efficiency = Math.max(45, Math.min(90, 52 + signalCount * 8));

      if (interviewType === 'behavioral') {
        if (behavioralSignals.hasResult) strengths.push('Completed STAR stories with measurable outcomes');
        if (behavioralSignals.hasSpecifics) strengths.push('Backed claims with specific numbers and data');
        if (behavioralSignals.hasAction) strengths.push('Clearly articulated personal actions and ownership');
        if (!behavioralSignals.hasResult) areasForImprovement.push('Quantify outcomes with numbers, percentages, or business impact');
        if (!behavioralSignals.hasSituation) areasForImprovement.push('Set stronger context before describing actions');
        if (!behavioralSignals.hasSpecifics) areasForImprovement.push('Add specific metrics to make stories more credible');
      } else {
        if (hrSignals.hasMotivation) strengths.push('Clear articulation of career motivation and direction');
        if (hrSignals.hasValues) strengths.push('Strong alignment with team culture and collaboration values');
        if (hrSignals.hasSelfAwareness) strengths.push('Demonstrated self-awareness and growth mindset');
        if (!hrSignals.hasMotivation) areasForImprovement.push('Be more specific about what draws you to this role and company');
        if (!hrSignals.hasSelfAwareness) areasForImprovement.push('Show self-awareness by discussing a real challenge or growth area');
      }
    } else if (interviewType === 'system_design' || interviewType === 'system-design') {
      clarity = Math.max(45, Math.min(95, 55 + Math.min(25, Math.floor(avgWordsPerTurn / 4))));
      decomposition = Math.max(45, Math.min(95, 48 + (sysDesignSignals.mentionArchitecture ? 18 : 4) + (candidateTurns.length >= 3 ? 8 : 0)));
      communication = Math.max(45, Math.min(95, 56 + Math.min(16, candidateTurns.length * 2)));
      efficiency = Math.max(40, Math.min(95, 50 + (sysDesignSignals.mentionScalability ? 18 : 0) + (sysDesignSignals.mentionTradeoffs ? 14 : 0)));

      if (sysDesignSignals.mentionArchitecture) strengths.push('Solid component identification and architecture reasoning');
      if (sysDesignSignals.mentionScalability) strengths.push('Proactive scalability thinking with concrete strategies');
      if (sysDesignSignals.mentionTradeoffs) strengths.push('Thoughtful trade-off analysis between design alternatives');
      if (!sysDesignSignals.mentionScalability) areasForImprovement.push('Address scalability early — discuss sharding, replication, and load balancing');
      if (!sysDesignSignals.mentionArchitecture) areasForImprovement.push('Name specific technologies and justify each choice');
      if (!sysDesignSignals.mentionTradeoffs) areasForImprovement.push('Compare at least two design alternatives with concrete trade-offs');
    } else {
      // DSA / default
      clarity = Math.max(45, Math.min(95, 55 + Math.min(25, Math.floor(avgWordsPerTurn / 4))));
      decomposition = Math.max(45, Math.min(95, 52 + (dsaSignals.mentionEdgeCases ? 16 : 4) + (candidateTurns.length >= 3 ? 8 : 0)));
      communication = Math.max(45, Math.min(95, 56 + Math.min(16, candidateTurns.length * 2)));
      efficiency = Math.max(40, Math.min(95, 50 + (dsaSignals.mentionComplexity ? 20 : 0) + (dsaSignals.mentionTradeoffs ? 12 : 0)));

      if (avgWordsPerTurn >= 35) strengths.push('Detailed verbal walkthroughs under interview pressure');
      if (dsaSignals.mentionComplexity) strengths.push('Good complexity awareness and algorithmic rigor');
      if (dsaSignals.mentionEdgeCases) strengths.push('Proactive attention to boundary conditions');
      if (dsaSignals.mentionTradeoffs) strengths.push('Balanced trade-off reasoning');
      if (!dsaSignals.mentionComplexity) areasForImprovement.push('State time and space complexity explicitly for each approach');
      if (!dsaSignals.mentionEdgeCases) areasForImprovement.push('Call out edge cases early before implementation details');
      if (!dsaSignals.mentionTradeoffs) areasForImprovement.push('Compare alternatives with concrete trade-offs');
    }

    if (avgWordsPerTurn < 20) areasForImprovement.push('Expand explanations to improve interviewer signal quality');

    const defaultStrengths = {
      behavioral: ['Maintained conversational structure throughout the interview'],
      hr: ['Engaged thoughtfully with cultural and motivational questions'],
      system_design: ['Presented a structured approach to system architecture'],
      'system-design': ['Presented a structured approach to system architecture'],
      dsa: ['Demonstrated systematic problem-solving under timed pressure'],
    };
    const defaultImprovements = {
      behavioral: ['Strengthen stories with quantified outcomes and clearer personal ownership'],
      hr: ['Be more specific about career goals and what draws you to this role'],
      system_design: ['Proactively discuss scalability and failure modes earlier'],
      'system-design': ['Proactively discuss scalability and failure modes earlier'],
      dsa: ['State time and space complexity explicitly for every approach discussed'],
    };

    // ── Dynamic follow-up problem generation based on actual gaps ─────
    const followUpProblems = this._generateDynamicFollowUps(interviewType, areasForImprovement, strengths);

    // ── Dynamic recommendation text based on actual performance ───────
    const recommendations = this._generateDynamicRecommendations(interviewType, areasForImprovement, strengths);

    return {
      metrics: {
        clarity,
        problemDecomposition: decomposition,
        communication,
        efficiency,
      },
      strengths: strengths.length > 0 ? strengths : (defaultStrengths[interviewType] || defaultStrengths.dsa),
      areasForImprovement: areasForImprovement.length > 0 ? areasForImprovement : (defaultImprovements[interviewType] || defaultImprovements.dsa),
      criticalMistakes: [],
      recommendations,
      followUpProblems,
    };
  }

  // ── Trend Narrative: human-readable coaching from raw score data ──────
  static _generateTrendNarrative(scoreTrend, overallScore, areasForImprovement = []) {
    const { trend, volatility, mean } = scoreTrend || {};
    const topGap = areasForImprovement.length > 0 ? areasForImprovement[0].toLowerCase() : null;

    if (trend === 'improving' && volatility !== 'high') {
      return 'Your performance improved steadily throughout the interview. This shows strong learning agility — keep building on that momentum.';
    }
    if (trend === 'declining') {
      return 'Your answers weakened as the interview progressed. Consider pacing yourself — take a moment to organize thoughts before each question.';
    }
    if (volatility === 'high') {
      return 'Your performance was inconsistent — strong on some questions, weaker on others. Focus on building a reliable baseline before pushing for depth.';
    }
    if (trend === 'stable' && (mean || overallScore) >= 70) {
      return 'Consistently strong performance. You\'re ready for harder challenges.';
    }
    if (trend === 'stable' && (mean || overallScore) < 70) {
      const focusArea = topGap ? ` Focus on ${topGap} to unlock the next tier.` : '';
      return `Your performance was consistent but below target.${focusArea}`;
    }
    // Fallback for insufficient data
    return 'Keep practicing — more data from future sessions will reveal your performance trajectory.';
  }

  // ── Dynamic Follow-Up Problems: tailored to actual gaps ──────────────
  static _generateDynamicFollowUps(interviewType, areasForImprovement = [], strengths = []) {
    const normalizedType = String(interviewType || 'dsa').toLowerCase();
    const gaps = areasForImprovement.map(a => String(a).toLowerCase());
    const followUps = [];

    if (normalizedType === 'dsa') {
      if (gaps.some(g => g.includes('complexity') || g.includes('time') || g.includes('space'))) {
        followUps.push({ problem_id: null, title: 'Optimize a brute-force solution under strict O(n log n) constraints', reason: 'Builds complexity reasoning under pressure' });
      }
      if (gaps.some(g => g.includes('edge') || g.includes('boundary'))) {
        followUps.push({ problem_id: null, title: 'Solve a problem with tricky edge cases (empty input, single element, duplicates)', reason: 'Strengthens boundary condition awareness' });
      }
      if (gaps.some(g => g.includes('trade-off') || g.includes('alternative'))) {
        followUps.push({ problem_id: null, title: 'Compare two approaches to a problem and justify your final choice', reason: 'Develops trade-off reasoning skills' });
      }
    } else if (normalizedType === 'system_design' || normalizedType === 'system-design') {
      if (gaps.some(g => g.includes('scalab') || g.includes('shard') || g.includes('replica'))) {
        followUps.push({ problem_id: null, title: 'Redesign the system for 100x traffic with specific scaling strategies', reason: 'Tests scalability thinking at production scale' });
      }
      if (gaps.some(g => g.includes('trade-off') || g.includes('cap') || g.includes('consistency'))) {
        followUps.push({ problem_id: null, title: 'Compare microservices vs monolith for a given scenario with concrete trade-offs', reason: 'Builds architectural trade-off vocabulary' });
      }
      if (gaps.some(g => g.includes('architecture') || g.includes('technolog'))) {
        followUps.push({ problem_id: null, title: 'Design a system component using specific technologies and justify each choice', reason: 'Strengthens technology selection reasoning' });
      }
    } else if (normalizedType === 'behavioral') {
      if (gaps.some(g => g.includes('quantif') || g.includes('number') || g.includes('metric'))) {
        followUps.push({ problem_id: null, title: 'Tell a STAR story where you drove measurable impact (with specific numbers)', reason: 'Builds habit of quantifying outcomes' });
      }
      if (gaps.some(g => g.includes('context') || g.includes('situation'))) {
        followUps.push({ problem_id: null, title: 'Describe a complex situation with multiple stakeholders and competing priorities', reason: 'Practices setting strong context before action' });
      }
      if (strengths.some(s => String(s).toLowerCase().includes('star'))) {
        followUps.push({ problem_id: null, title: 'Cross-functional conflict resolution under a tight deadline', reason: 'Challenges strong STAR candidates with higher complexity' });
      }
    } else if (normalizedType === 'hr') {
      if (gaps.some(g => g.includes('motivation') || g.includes('draws you'))) {
        followUps.push({ problem_id: null, title: 'Articulate what specifically draws you to this company and role', reason: 'Strengthens career motivation narrative' });
      }
      if (gaps.some(g => g.includes('self-aware') || g.includes('challenge') || g.includes('weakness'))) {
        followUps.push({ problem_id: null, title: 'Describe a real professional weakness and your concrete improvement plan', reason: 'Develops authentic self-awareness' });
      }
    }

    // Always include at least one follow-up
    if (followUps.length === 0) {
      const defaultFollowUps = {
        behavioral: { problem_id: null, title: 'Leadership under ambiguity scenario', reason: 'Tests decision-making with incomplete information' },
        hr: { problem_id: null, title: 'Culture-fit challenge scenario', reason: 'Explores values alignment under pressure' },
        system_design: { problem_id: null, title: 'Higher-scale design variant', reason: 'Tests resilience at 100x traffic' },
        'system-design': { problem_id: null, title: 'Higher-scale design variant', reason: 'Tests resilience at 100x traffic' },
        dsa: { problem_id: null, title: 'Algorithm variant with tighter constraints', reason: 'Tests optimization under stricter time/space bounds' },
      };
      followUps.push(defaultFollowUps[normalizedType] || defaultFollowUps.dsa);
    }

    return followUps.slice(0, 3);
  }

  // ── Dynamic Recommendations: actionable coaching based on performance ─
  static _generateDynamicRecommendations(interviewType, areasForImprovement = [], strengths = []) {
    const normalizedType = String(interviewType || 'dsa').toLowerCase();
    const gaps = areasForImprovement.map(a => String(a).toLowerCase());

    // Build recommendation from actual gaps
    if (areasForImprovement.length > 0) {
      const topGaps = areasForImprovement.slice(0, 2);
      const actionableAdvice = {
        dsa: `Next session: ${topGaps.join(' and ')}. Try solving 2-3 medium-level problems with explicit complexity proofs before coding.`,
        system_design: `Next session: ${topGaps.join(' and ')}. Practice drawing architecture diagrams with capacity estimates before your next mock.`,
        'system-design': `Next session: ${topGaps.join(' and ')}. Practice drawing architecture diagrams with capacity estimates before your next mock.`,
        behavioral: `Next session: ${topGaps.join(' and ')}. Write down 3 STAR stories with specific metrics before your next practice round.`,
        hr: `Next session: ${topGaps.join(' and ')}. Prepare a concise 90-second career narrative that connects your past to this role.`,
      };
      return actionableAdvice[normalizedType] || `Next session focus: ${topGaps.join(' and ')}.`;
    }

    // Strong performance — push to next level
    const typeRecommendations = {
      behavioral: 'Strong communication with well-structured stories. Challenge yourself with cross-functional conflict scenarios next.',
      hr: 'Excellent self-presentation. Practice answering "why this company specifically?" with researched, specific reasons.',
      system_design: 'Solid architecture instincts. Next level: practice capacity estimation and failure mode analysis under time pressure.',
      'system-design': 'Solid architecture instincts. Next level: practice capacity estimation and failure mode analysis under time pressure.',
      dsa: 'Great consistency. Push further by practicing hard-level problems with strict time limits (20 min/problem).',
    };
    return typeRecommendations[normalizedType] || typeRecommendations.dsa;
  }

  static _calculateScores(analysis, transcript, interviewType = 'dsa') {
    const rolling = this._calculateRollingScores(analysis, transcript, interviewType);
    const communicationScore = Math.round((rolling.communication || 0) * 10);
    const problemSolvingScore = Math.round((rolling.problem_solving || 0) * 10);
    const technicalDepthScore = Math.round((rolling.technical_depth || 0) * 10);
    const interviewScore = Math.round((rolling.overall || 0) * 10);
    
    return {
      interviewScore,
      communicationScore,
      problemSolvingScore,
      technicalDepthScore,
    };
  }

  static async _updatePerformanceTrend(userId, interviewType, companyFocus, scores) {
    let existing = null;
    let selectError = null;

    ({ data: existing, error: selectError } = await supabaseAdmin
      .from('interview_performance_trends')
      .select('*')
      .eq('user_id', userId)
      .eq('interview_type', interviewType)
      .eq('company_focus', companyFocus || null)
      .single());

    if (selectError && isMissingColumnError(selectError, 'company_focus')) {
      ({ data: existing } = await supabaseAdmin
        .from('interview_performance_trends')
        .select('*')
        .eq('user_id', userId)
        .eq('interview_type', interviewType)
        .single());
    }

    if (existing) {
      // Update existing trend — proper incremental mean
      const prevCount = Number(existing.interview_count || 0);
      const prevAvg = Number(existing.avg_score || 0);
      const newCount = prevCount + 1;
      const newAvg = prevAvg + (scores.interviewScore - prevAvg) / newCount;

      await supabaseAdmin
        .from('interview_performance_trends')
        .update({
          interview_count: newCount,
          avg_score: Math.round(newAvg * 10) / 10,
          last_interview_date: new Date().toISOString()
        })
        .eq('id', existing.id);
    } else {
      // Create new trend
      let insertError = null;
      ({ error: insertError } = await supabaseAdmin
        .from('interview_performance_trends')
        .insert({
          user_id: userId,
          interview_type: interviewType,
          company_focus: companyFocus,
          interview_count: 1,
          avg_score: scores.interviewScore,
          last_interview_date: new Date().toISOString()
        }));

      if (insertError && isMissingColumnError(insertError, 'company_focus')) {
        await supabaseAdmin
          .from('interview_performance_trends')
          .insert({
            user_id: userId,
            interview_type: interviewType,
            interview_count: 1,
            avg_score: scores.interviewScore,
            last_interview_date: new Date().toISOString()
          });
      }
    }
  }
}

export default {
  CodeReviewService,
  InterviewSimulatorService,
  analyzeAnswerQuality,
  analyzeAnswerQualityHeuristic,
};
