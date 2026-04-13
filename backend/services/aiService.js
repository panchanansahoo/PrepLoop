import Groq from 'groq-sdk';
import { randomUUID } from 'crypto';
import { createLogger } from '../utils/structuredLogger.js';
import { supabaseAdmin } from '../db/index.js';
import { InterviewOrchestratorService } from './interviewOrchestrator.js';
import interviewGroundingService from './interviewGroundingService.js';
import { InterviewPromptService } from './interviewPromptService.js';
import { InterviewConversationService } from './interviewConversationService.js';
import { InterviewScoringService } from './interviewScoringService.js';
import { InterviewFollowUpRulesService } from './interviewFollowUpRules.js';
import { InterviewTelemetryService } from './interviewTelemetryService.js';
import { addSpanEvent, setSpanAttribute } from '../utils/telemetry.js';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const logger = createLogger('AIService');
const virtualInterviewSessions = new Map();
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

const clampScore = (value) => Math.max(0, Math.min(100, Math.round(Number(value) || 0)));

function analyzeAnswerQualityHeuristic(answer = '', question = '') {
  const normalizedAnswer = String(answer || '').trim();
  const normalizedQuestion = String(question || '').trim();
  const lower = normalizedAnswer.toLowerCase();

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

  const clarityScore = clampScore(40 + Math.min(wordCount, 80) * 0.65 - fillerCount * 6);
  const specificityScore = clampScore((hasActionLanguage ? 45 : 20) + (hasNumber ? 30 : 0) + (hasResultLanguage ? 25 : 5));
  const confidenceScore = clampScore(50 + Math.min(wordCount, 60) * 0.5 - fillerCount * 7);
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

export async function analyzeAnswerQuality(answer = '', question = '') {
  const heuristic = analyzeAnswerQualityHeuristic(answer, question);

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
        edgeCasesCcovered: { found: [], missed: [] },
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
    if (tokens.length <= 24) {
      return normalizedMessage;
    }

    return `${tokens.slice(0, 24).join(' ')}...`;
  }

  static _buildStagePlan(interviewType = 'dsa') {
    return InterviewOrchestratorService.buildStagePlan(interviewType);
  }

  static _buildInitialInterviewState(interviewType = 'dsa', difficulty = 'medium', companyFocus = null) {
    return InterviewOrchestratorService.buildInitialState(interviewType, difficulty, companyFocus);
  }

  static _advanceInterviewStage(state = {}) {
    return InterviewOrchestratorService.advanceState(state);
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
    interviewMode = null
  ) {
    try {
      const normalizedMode = this._normalizeInterviewMode(interviewMode);
      const runtime = this._buildInterviewRuntime(normalizedMode);
      const initialInterviewState = this._buildInitialInterviewState(interviewType, difficulty, companyFocus);
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

      for (const payload of payloadCandidates) {
        ({ data: sessionData, error: sessionError } = await supabaseAdmin
          .from('interview_sessions')
          .insert(payload)
          .select()
          .single());

        if (!sessionError) {
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
        virtualInterviewSessions.set(sessionData.id, sessionData);
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
      const responseSignals = this._extractResponseSignals(candidateResponse);
      const mergedMissingAreas = Array.from(
        new Set([
          ...(Array.isArray(currentContext.missingAreas) ? currentContext.missingAreas : []),
          ...(!responseSignals.hasComplexity ? ['complexity analysis'] : []),
          ...(!responseSignals.hasEdgeCases ? ['edge cases'] : []),
          ...(!responseSignals.hasTradeoffs ? ['trade-off discussion'] : []),
        ])
      );

      const interviewContext = {
        ...currentContext,
        mode: normalizedMode,
        runtime,
        turns: (currentContext.turns || 0) + 1,
        lastCandidateSummary: candidateResponse.slice(0, 220),
        lastSignals: responseSignals,
        missingAreas: mergedMissingAreas,
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
        followUp = {
          message: 'Good direction. Can you now explain trade-offs and edge cases for your approach?',
          isFollowUp: true,
          clarifications: [],
          hints: ['Consider boundary conditions and worst-case inputs.'],
          encouragement: 'Nice progress so far.',
          continueInterview: true,
        };
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
        analysis = {
          score: 70,
          candidateStuck: false,
          feedback: 'Good structure. Keep improving clarity and edge-case coverage.',
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
          const scores = this._calculateRollingScores(analysis, updatedTranscript, session.interview_type);
          const currentDifficulty =
            interviewContext.currentDifficulty ||
            session.difficulty_level ||
            session.difficulty ||
            'medium';
          const adaptive = this._deriveAdaptiveDifficulty(currentDifficulty, scores.overall, interviewContext.turns || 1);
          const followUpRules = InterviewFollowUpRulesService.decideBranch({
            analysis,
            interviewContext,
            candidateResponse,
          });
          span.setAttribute('interview.score.overall', Number(scores?.overall || 0));
          span.setAttribute('interview.score.difficulty', String(adaptive?.newDifficulty || currentDifficulty));
          span.setAttribute('interview.followup.next_action', String(followUpRules?.nextAction || 'followup_clarify'));
          return { currentScores: scores, adaptiveUpdate: adaptive, adaptiveFollowUp: followUpRules };
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
          missingAreas: Array.from(new Set([...(interviewContext.missingAreas || []), ...(analysis.nextFocus || [])])),
          adaptiveFollowUp,
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
        virtualInterviewSessions.set(sessionId, virtualSession);
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

      const startedAt = new Date(session.started_at || session.created_at || Date.now());
      const totalDurationSeconds = Math.max(0, Math.floor((Date.now() - startedAt.getTime()) / 1000));

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
        follow_up_practice_problems: analysis.followUpProblems
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
        virtualInterviewSessions.set(sessionId, completedSession);
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

    if (interviewType === 'system_design') {
      return `${focusLine} Let's design a production-ready solution for this prompt: ${problem.statement} Start by clarifying scale, users, and non-functional requirements before diving into architecture.`;
    }

    return `${focusLine} Here is your problem: ${problem.statement} ${difficultyTone[difficulty] || difficultyTone.medium}`;
  }

  static async _generateProblemStatement(interviewType, difficulty, companyFocus) {
    // This would ideally select from your problem database
    // For now, return a sample problem
    const problems = {
      dsa: {
        easy: {
          statement: 'Given an array of integers, find the maximum product of any two elements.',
          requirements: 'Time: O(n), Space: O(1). Handle negative numbers.'
        },
        medium: {
          statement: 'Design an LRU (Least Recently Used) Cache with get() and put() operations.',
          requirements: 'Both operations should be O(1). Support custom capacity.'
        },
        hard: {
          statement: 'Implement a data structure for Median Finder that supports addNum() and findMedian() operations.',
          requirements: 'addNum() in O(log n), findMedian() in O(1). Support continuous stream of numbers.'
        }
      }
    };

    const problem = problems[interviewType]?.[difficulty] || problems.dsa.medium;
    
    return {
      problem_id: null, // Would link to actual problem
      statement: problem.statement,
      requirements: problem.requirements
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

  static _extractResponseSignals(response) {
    const text = String(response || '');
    const lower = text.toLowerCase();
    const wordCount = lower.split(/\s+/).filter(Boolean).length;
    const hasComplexity = /o\s*\(|time complexity|space complexity/.test(lower);
    const hasEdgeCases = /edge case|boundary|empty|null|duplicate|single/.test(lower);
    const hasTradeoffs = /trade.?off|pros?|cons?|cost|latency|memory/.test(lower);
    const hasStructure = /(first|then|next|finally|because|therefore)/.test(lower);
    const hasExample = /for example|e\.g\.|let\s+us\s+say|suppose/.test(lower);
    const candidateStuck = wordCount < 14 || /i\s+don\'t\s+know|stuck|not sure|blanking/.test(lower);

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

  static _calculateRollingScores(analysis, transcript, interviewType = 'dsa') {
    return InterviewScoringService.calculateRollingScores(analysis, transcript, interviewType);
  }

  static _deriveAdaptiveDifficulty(currentDifficulty, rollingOverallTen, turns) {
    return InterviewScoringService.deriveAdaptiveDifficulty(currentDifficulty, rollingOverallTen, turns);
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
    const signals = this._extractResponseSignals(response);
    let score = 50;

    score += Math.min(20, Math.floor(signals.wordCount / 8));
    if (signals.hasStructure) score += 8;
    if (signals.hasComplexity) score += 8;
    if (signals.hasEdgeCases) score += 7;
    if (signals.hasTradeoffs) score += 5;
    if (signals.hasExample) score += 4;
    if (signals.candidateStuck) score -= 18;

    const boundedScore = Math.max(0, Math.min(100, score));
    const nextFocus = [];
    if (!signals.hasComplexity) nextFocus.push('complexity analysis');
    if (!signals.hasEdgeCases) nextFocus.push('edge cases');
    if (!signals.hasTradeoffs) nextFocus.push('trade-off discussion');

    const strengths = [];
    if (signals.hasStructure) strengths.push('Clear step-by-step structure');
    if (signals.hasExample) strengths.push('Used concrete examples');
    if (signals.hasComplexity) strengths.push('Included complexity reasoning');

    const feedbackSegments = [];
    if (signals.hasStructure) feedbackSegments.push('Good structure in your explanation');
    if (!signals.hasComplexity) feedbackSegments.push('add explicit time and space complexity');
    if (!signals.hasEdgeCases) feedbackSegments.push('cover key edge cases before concluding');
    if (!signals.hasTradeoffs) feedbackSegments.push('mention trade-offs of your approach');

    const responseLower = String(response || '').toLowerCase();
    const hasScalability = /scale|shard|partition|replica|cache|throughput|availability/.test(responseLower);
    const hasStarSignals = /(situation|task|action|result)/.test(responseLower);

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

    const mentionComplexity = /o\s*\(|time complexity|space complexity/.test(allCandidateText);
    const mentionEdgeCases = /edge case|boundary|empty|null|duplicate|single/.test(allCandidateText);
    const mentionTradeoffs = /trade.?off|pros?|cons?|latency|memory/.test(allCandidateText);

    const clarity = Math.max(45, Math.min(95, 55 + Math.min(25, Math.floor(avgWordsPerTurn / 4))));
    const decomposition = Math.max(45, Math.min(95, 52 + (mentionEdgeCases ? 16 : 4) + (candidateTurns.length >= 3 ? 8 : 0)));
    const communication = Math.max(45, Math.min(95, 56 + Math.min(16, candidateTurns.length * 2)));
    const efficiency = Math.max(40, Math.min(95, 50 + (mentionComplexity ? 20 : 0) + (mentionTradeoffs ? 12 : 0)));

    const strengths = [];
    if (avgWordsPerTurn >= 35) strengths.push('Detailed verbal walkthroughs under interview pressure');
    if (mentionComplexity) strengths.push('Good complexity awareness and algorithmic rigor');
    if (mentionEdgeCases) strengths.push('Proactive attention to boundary conditions');
    if (mentionTradeoffs) strengths.push('Balanced trade-off reasoning');

    const areasForImprovement = [];
    if (!mentionComplexity) areasForImprovement.push('State time and space complexity explicitly for each approach');
    if (!mentionEdgeCases) areasForImprovement.push('Call out edge cases early before implementation details');
    if (!mentionTradeoffs) areasForImprovement.push('Compare alternatives with concrete trade-offs');
    if (avgWordsPerTurn < 20) areasForImprovement.push('Expand explanations to improve interviewer signal quality');

    return {
      metrics: {
        clarity,
        problemDecomposition: decomposition,
        communication,
        efficiency,
      },
      strengths: strengths.length > 0 ? strengths : ['Maintained a coherent structure through the interview'],
      areasForImprovement: areasForImprovement.length > 0 ? areasForImprovement : ['Increase precision when discussing optimization choices'],
      criticalMistakes: [],
      recommendations: areasForImprovement.length > 0
        ? `Next session focus: ${areasForImprovement.slice(0, 2).join(' and ')}.`
        : 'Great consistency. Keep practicing under timed constraints to sustain this level.',
      followUpProblems: [
        { problem_id: 1, title: 'Similar but harder variant', reason: 'Builds on your approach' }
      ]
    };
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
      // Update existing trend
      await supabaseAdmin
        .from('interview_performance_trends')
        .update({
          interview_count: (existing.interview_count || 0) + 1,
          avg_score: ((existing.avg_score || 0) + scores.interviewScore) / 2,
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
};
