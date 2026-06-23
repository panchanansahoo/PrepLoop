import { randomUUID, randomInt } from 'crypto';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createLogger } from '../utils/structuredLogger.js';
import NodeCache from 'node-cache';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { isMissingColumnError, isInterviewSchemaCompatibilityError, _knownPayloadIndex, virtualInterviewSessions } from './interviewUtils.js';
import { interviewTelemetryService } from './interviewTelemetryService.js';
import { InterviewStateMachineService } from './interviewStateMachine.js';
import InterviewScoringService from './interviewScoringService.js';
import { getBenchmarkTier, generatePerQuestionBreakdown, computeTimingAnalysis } from '../utils/interviewBenchmarks.js';
import { InterviewConversationService } from './interviewConversationService.js';
import { InterviewPromptService } from './interviewPromptService.js';
import { InterviewFollowUpRulesService } from './interviewFollowUpRulesService.js';
import interviewGroundingService from './interviewGroundingService.js';
import { canMakeRequest, recordRequest } from '../utils/rateLimitBudget.js';

// Note: Code review implementation is provided in this file; avoid importing
// a non-existent `codeReviewService.js` module which would conflict with the
// local `CodeReviewService` class defined below.

// Use the createLogger function instead of importing logger directly
const logger = createLogger('AIService');

// Initialize cache with 10 minute TTL for interview data
const interviewCache = new NodeCache({ stdTTL: 600, checkperiod: 630 });

// ── Problem Bank (loaded once from JSON) ────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
let _problemBank = null;
function loadProblemBank() {
  if (_problemBank) return _problemBank;
  try {
    const raw = readFileSync(join(__dirname, '..', 'data', 'interviewProblemBank.json'), 'utf-8');
    _problemBank = JSON.parse(raw);
    } catch (_err) {
    _problemBank = null;
    _problemBank = null;
  }
  return _problemBank;
}

// Per-user dedup: track last 10 problem IDs used to avoid repeats
const _userRecentProblems = new Map(); // userId -> string[]
const DEDUP_WINDOW = 10;
function recordUsedProblem(userId, problemId) {
  if (!userId || !problemId) return;
  const recent = _userRecentProblems.get(userId) || [];
  recent.push(problemId);
  if (recent.length > DEDUP_WINDOW) recent.shift();
  _userRecentProblems.set(userId, recent);
}
function getRecentProblems(userId) {
  return _userRecentProblems.get(userId) || [];
}

// Initialize Gemini provider safely. The GoogleGenAI class may not be
// available in all environments (dev machines, CI without provider libs).
// Use a guarded dynamic import and fall back to `null` if unavailable.
let geminiAi = null;
if (process.env.GEMINI_API_KEY) {
  try {
    // Try a few common package exports; prefer the official package if installed.
    const mod = await import('@google/genai').catch(() => null) ||
                await import('@google/generative-ai').catch(() => null) ||
                await import('google-gen-ai').catch(() => null) ||
                null;

    const GoogleGenAI = mod?.GoogleGenAI || mod?.default?.GoogleGenAI || mod?.default || null;
    if (GoogleGenAI) {
      geminiAi = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } else {
      logger.warn('GoogleGenAI provider module not found; Gemini disabled');
      geminiAi = null;
    }
  } catch (err) {
    logger.warn('Failed to initialize GoogleGenAI; Gemini disabled', { error: err.message });
    geminiAi = null;
  }
}

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

// ── Constants ────────────────────────────────────────────────────────────
const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours (keep using imported virtualInterviewSessions)
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

// `isMissingColumnError` and `isInterviewSchemaCompatibilityError` are imported
// from `interviewUtils.js` at the top of the file. Use the shared helpers to
// avoid duplicate definitions and keep schema-compatibility logic centralized.

// AI Model Configuration
// NOTE: gemini-1.5-flash is deprecated (retiring June 2026).
// Using gemini-2.5-flash — free tier: ~10 RPM, ~250 RPD.
const MODEL_CONFIG = {
  model: 'gemini-2.5-flash',
  temperature: 0.7, // Balanced creativity vs consistency
  max_tokens: 2048,
};

const INTERVIEW_MODEL_CONFIG = {
  model: 'gemini-2.5-flash',
  temperature: 0.8, // Slightly more natural for interviews
  max_tokens: 1500,
};

const INTERVIEW_RUNTIME_MODES = ['full_realtime'];

const ANSWER_FILLERS = ['um', 'uh', 'like', 'you know', 'basically', 'literally', 'sort of', 'right'];

// Cached index of the working DB schema shape (avoids re-probing on every initializeInterview call)
// `_knownPayloadIndex` is imported from `interviewUtils.js` to centralize schema-shape
// probing and caching logic across modules.

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

  // Heuristic-first gate: if heuristic confidence is high, skip LLM call entirely.
  // This saves ~60% of free-tier API requests.
  const heuristicConfidence = (heuristic.clarityScore + heuristic.specificityScore + heuristic.confidenceScore) / 3;
  if (heuristicConfidence >= 75 || heuristicConfidence <= 20) {
    logger.debug('analyzeAnswerQuality: heuristic confidence sufficient, skipping LLM', {
      heuristicConfidence: heuristicConfidence.toFixed(1),
    });
    return heuristic;
  }

  // Check Gemini budget before making the call
  const geminiBudget = canMakeRequest('gemini');
  if (!geminiAi || !geminiBudget.allowed) {
    if (!geminiBudget.allowed) {
      logger.info('analyzeAnswerQuality: Gemini budget exhausted, using heuristic', {
        reason: geminiBudget.reason,
      });
    }
    return heuristic;
  }

  try {
    recordRequest('gemini');
    const response = await geminiAi.models.generateContent({
      model: MODEL_CONFIG.model,
      contents: `Question: ${question || 'N/A'}\nAnswer: ${answer || 'N/A'}`,
      config: {
        temperature: 0.2,
        maxOutputTokens: 220,
        responseMimeType: "application/json",
        systemInstruction: "You are an interview evaluator. Return strict JSON only with keys: clarityScore, specificityScore, confidenceScore, needsFollowUp, followUpQuestion, rationale."
      }
    });

    const raw = response.text || '{}';
    const parsed = JSON.parse(raw);

    return {
      clarityScore: clampScore(parsed.clarityScore ?? heuristic.clarityScore),
      specificityScore: clampScore(parsed.specificityScore ?? heuristic.specificityScore),
      confidenceScore: clampScore(parsed.confidenceScore ?? heuristic.confidenceScore),
      fillerCount: heuristic.fillerCount,
      needsFollowUp: Boolean(parsed.needsFollowUp ?? heuristic.needsFollowUp),
      followUpQuestion: String(parsed.followUpQuestion || heuristic.followUpQuestion),
      rationale: String(parsed.rationale || heuristic.rationale),
      source: 'gemini',
    };
  } catch (error) {
    // On 429 or any Gemini failure, fall back to heuristic
    logger.warn('analyzeAnswerQuality fell back to heuristic scoring', {
      error: error.message,
      isRateLimit: error.status === 429 || error.message?.includes('429'),
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

      // Check Gemini budget before code review
      const codeBudget = canMakeRequest('gemini');
      if (!geminiAi || !codeBudget.allowed) {
        logger.info('Code review: Gemini unavailable or budget exhausted, using fallback', {
          reason: codeBudget.reason || 'No Gemini API key',
        });
      } else {
        try {
          recordRequest('gemini');
          response = await geminiAi.models.generateContent({
            model: MODEL_CONFIG.model,
            contents: reviewPrompt,
            config: {
              temperature: MODEL_CONFIG.temperature,
              maxOutputTokens: MODEL_CONFIG.max_tokens,
              responseMimeType: "application/json"
            }
          });
          reviewContent = response.text || '';
        } catch (error) {
          logger.warn('Gemini unavailable for code review; using fallback analysis', {
          userId,
          problemId,
          requestId,
            error: error.message,
          });
        }
      }

      // Fallback if no LLM response was obtained
      if (!reviewContent) {
        reviewContent = JSON.stringify({
          timeComplexity: 'Not determined',
          spaceComplexity: 'Not determined',
          complexityAnalysis: 'Fallback analysis used because AI provider was unavailable or budget exhausted.',
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
      const usage = response?.usageMetadata ? {
        prompt_tokens: response.usageMetadata.promptTokenCount,
        completion_tokens: response.usageMetadata.candidatesTokenCount,
        total_tokens: response.usageMetadata.totalTokenCount
      } : null;
      await this._logAIServiceUsage(userId, 'code_review', reviewRecord.id, usage, Date.now() - startTime, requestId);

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
    // Try to get from cache first
    const cacheKey = `interview_session_${sessionId}`;
    let virtualSession = interviewCache.get(cacheKey);
    
    if (virtualSession && virtualSession.user_id === userId) {
      return virtualSession;
    }
    
    // Check in-memory store
    virtualSession = virtualInterviewSessions.get(sessionId);
    if (virtualSession && virtualSession.user_id === userId) {
      // Cache the result
      interviewCache.set(cacheKey, virtualSession);
      return virtualSession;
    }

    // Try to get from database
    const { data: persistedSession, error } = await supabaseAdmin
      .from('interview_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (!error && persistedSession) {
      // Cache the result
      interviewCache.set(cacheKey, persistedSession);
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
      let knownPayloadIndex = _knownPayloadIndex;
      const startIndex = knownPayloadIndex !== null ? knownPayloadIndex : 0;

      for (let i = startIndex; i < payloadCandidates.length; i++) {
        ({ data: sessionData, error: sessionError } = await supabaseAdmin
          .from('interview_sessions')
          .insert(payloadCandidates[i])
          .select()
          .single());

        if (!sessionError) {
          if (knownPayloadIndex === null) {
            knownPayloadIndex = i;
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
        () => this._generateProblemStatement(interviewType, difficulty, companyFocus, userId)
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
        () => supabaseAdmin
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
        
        // Cache the virtual session
        const cacheKey = `interview_session_${sessionData.id}`;
        interviewCache.set(cacheKey, sessionData);
        
        updatedSession = sessionData;
      } else {
        // Cache the database session
        const cacheKey = `interview_session_${updatedSession.id}`;
        interviewCache.set(cacheKey, updatedSession);
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

      // ── Clarification detection: don't penalize for asking questions ──
      const clarificationResult = this._detectClarificationRequest(candidateResponse);
      if (clarificationResult.isClarification) {
        const session = await this.getInterviewSession(sessionId, userId);
        const currentContext = session.interview_context || {};
        const lastInterviewerMsg = currentContext.lastInterviewerPrompt || session.problem_statement || '';

        logger.info('Clarification request detected — repeating without score penalty', {
          sessionId, userId, requestId, clarificationType: clarificationResult.type,
        });

        return {
          interviewerMessage: clarificationResult.type === 'repeat'
            ? `Sure — ${lastInterviewerMsg}`
            : `To clarify: ${lastInterviewerMsg}`,
          feedback: 'Asking clarifying questions is a strong interviewer signal. Take your time.',
          clarifications: [],
          hints: [],
          encouragement: 'Good instinct to clarify before answering.',
          continueInterview: true,
          stage: currentContext.stage || currentContext.interviewState?.stage || 'intake',
          stageLabel: currentContext.stageLabel || currentContext.interviewState?.stageLabel || 'In Progress',
          stagePlan: currentContext.interviewState?.stagePlan || null,
          interviewMode: this._normalizeInterviewMode(interviewMode || currentContext.mode),
          runtime: this._buildInterviewRuntime(this._normalizeInterviewMode(interviewMode || currentContext.mode)),
          current_scores: currentContext.currentScores || null,
          adaptive_update: null,
          adaptive_followup: null,
          score_trend: null,
          telemetry: null,
          is_clarification: true,
        };
      }

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

      // ── Turn summary for conversation memory ─────────────────────────
      const turnSummary = this._generateTurnSummary(candidateResponse, interviewType, responseSignals);
      const prevSummaries = Array.isArray(currentContext.turnSummaries) ? currentContext.turnSummaries : [];
      const turnSummaries = [...prevSummaries, turnSummary].slice(-8);

      // ── Topic tracking for anti-repetition ──────────────────────────
      const prevTopics = Array.isArray(currentContext.askedTopics) ? currentContext.askedTopics : [];
      // Extract primary topic from the last interviewer message
      const lastInterviewerTopic = this._extractPrimaryTopic(
        currentContext.lastInterviewerPrompt || '',
        interviewType,
      );
      const askedTopics = lastInterviewerTopic
        ? [...prevTopics, lastInterviewerTopic].slice(-8)
        : prevTopics;

      const interviewContext = {
        ...currentContext,
        mode: normalizedMode,
        runtime,
        turns: (currentContext.turns || 0) + 1,
        lastCandidateSummary: candidateResponse.slice(0, 220),
        lastSignals: responseSignals,
        missingAreas: mergedMissingAreas,
        interviewType,
        turnSummaries,
        askedTopics,
        companyFocus: session.company_focus || null,
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
          () => this._generateInterviewerFollowUp(
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
      const { currentScores, adaptiveUpdate, adaptiveFollowUp, scoreHistory } = await interviewTelemetryService.withSpan(
        'interview.scoring.update',
        {
          attributes: {
            ...telemetryAttributes,
            'interview.stage': String(advancedInterviewState.stage || 'intake'),
          },
        },
        (span) => {
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

      // ── Stuck count tracking + progressive hints ───────────────────
      const prevStuckCount = Number(currentContext.stuckCount || 0);
      const stuckCount = analysis.candidateStuck ? prevStuckCount + 1 : 0;
      let progressiveHint = null;
      if (analysis.candidateStuck && stuckCount >= 1) {
        progressiveHint = this._buildProgressiveHint(interviewType, stuckCount, interviewContext);
        logger.info('Progressive hint triggered', {
          sessionId, stuckCount, hintTier: progressiveHint.hintTier,
        });
      }

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
          stuckCount,
        },
        updated_at: new Date().toISOString()
      };

      let updateError = null;
      ({ error: updateError } = await interviewTelemetryService.withSpan(
        'interview.session.persist',
        {
          attributes: {
            ...telemetryAttributes,
            'interview.stage': String(advancedInterviewState.stage || 'intake'),
            'interview.turn': Number(interviewContext.turns || 1),
          },
        },
        () => supabaseAdmin
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
        progressive_hint: progressiveHint || null,
        score_cue: this._buildScoreCue(currentScores, interviewType),
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
        () => this.getInterviewSession(sessionId, userId)
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
        () => this._generatePerformanceAnalysis(session)
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
        (span) => {
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

      // ── Benchmark tier & enrichment (no LLM calls) ─────────────────
      const benchmarkTier = getBenchmarkTier(scores.interviewScore, session.interview_type);
      const perQuestionBreakdown = generatePerQuestionBreakdown(
        session.transcript || [],
        session.interview_context || {},
      );
      const timingAnalysis = computeTimingAnalysis(session.transcript || []);

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
        benchmark_tier: {
          label: benchmarkTier.label,
          emoji: benchmarkTier.emoji,
          description: benchmarkTier.description,
        },
        per_question_breakdown: perQuestionBreakdown.slice(0, 10),
        timing_analysis: {
          avg_response_seconds: timingAnalysis.avgResponseSeconds,
          total_turns: timingAnalysis.totalTurns,
          recommendation: timingAnalysis.avgResponseSeconds < 30
            ? 'You answered quickly. Take a few more seconds to structure your thoughts.'
            : timingAnalysis.avgResponseSeconds > 120
            ? 'Your responses were quite long. Practice being more concise.'
            : 'Good pacing — your response times are in line with top candidates.',
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
        () => supabaseAdmin
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
        
        // Remove from cache since interview is completed
        const cacheKey = `interview_session_${sessionId}`;
        interviewCache.del(cacheKey);
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

  static _generateProblemStatement(interviewType, difficulty, companyFocus, userId = null) {
    const bank = loadProblemBank();
    const normalizedType = String(interviewType || 'dsa').toLowerCase().replace('system-design', 'system_design');
    const normalizedDifficulty = String(difficulty || 'medium').toLowerCase();

    // Resolve pool from bank, with graceful fallback to hardcoded defaults
    let pool = bank?.[normalizedType]?.[normalizedDifficulty]
      || bank?.[normalizedType]?.medium
      || bank?.dsa?.medium
      || null;

    // Fallback: if bank loading failed, use minimal inline defaults
    if (!pool || !Array.isArray(pool) || pool.length === 0) {
      pool = [
        { id: 'fallback-1', statement: 'Design an LRU Cache with get() and put() operations.', requirements: 'Both operations should be O(1). Support custom capacity.', tags: [], companies: [] },
        { id: 'fallback-2', statement: 'Find the length of the longest substring without repeating characters.', requirements: 'Time: O(n), Space: O(min(n, alphabet)).', tags: [], companies: [] },
      ];
    }

    // Dedup: filter out recently-used problems for this user
    const recentIds = userId ? getRecentProblems(userId) : [];
    let candidates = pool.filter(p => !recentIds.includes(p.id));
    if (candidates.length === 0) candidates = pool; // All exhausted, allow repeats

    // Company-weighted selection: prefer problems tagged for the target company
    if (companyFocus) {
      const companyLower = String(companyFocus).toLowerCase();
      const companyMatches = candidates.filter(
        p => Array.isArray(p.companies) && p.companies.some(c => c.toLowerCase() === companyLower)
      );
      // 70% chance to pick a company-tagged problem if available
      if (companyMatches.length > 0 && randomInt(100) < 70) {
        candidates = companyMatches;
      }
    }

    const selected = candidates[randomInt(candidates.length)];
    if (userId && selected.id) recordUsedProblem(userId, selected.id);

    return {
      problem_id: selected.id || null,
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
      () => InterviewPromptService.buildFollowUpPrompt({
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
          groqClient: geminiAi,
          modelConfig: INTERVIEW_MODEL_CONFIG,
          prompt,
        });
        span.setAttribute('interview.model.latency_ms', Number(raw.modelLatencyMs || 0));
        span.setAttribute('interview.model.fallback_triggered', Boolean(raw.fallbackTriggered));
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
      (span) => {
        const normalized = InterviewConversationService.normalizeFollowUp({
          content: rawFollowUp?.content,
          interviewMode,
          interviewType,
          forceFallback: Boolean(rawFollowUp?.fallbackTriggered),
        });
        span.setAttribute('interview.parse.success', Boolean(normalized.parseSuccess));
        span.setAttribute('interview.parse.fallback_triggered', Boolean(normalized.parseFallbackTriggered));
        span.addEvent('interview.followup.branch', {
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
    const candidateStuck = wordCount < stuckWordThreshold || /i\s+don't\s+know|stuck|not sure|blanking/.test(lower);

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

  // ── Live score cue: short qualitative badge for frontend ──────────────
  static _buildScoreCue(currentScores, interviewType) {
    if (!currentScores || !currentScores.overall) return null;
    const overall = Number(currentScores.overall);
    const normalizedType = String(interviewType || 'dsa').toLowerCase();

    if (overall >= 8) return { level: 'strong', text: 'Strong answer ✓', color: 'green' };
    if (overall >= 6) {
      // Type-specific coaching cue for "good but could be better"
      const cues = {
        dsa: 'Good — add complexity analysis',
        system_design: 'Good — discuss trade-offs',
        behavioral: 'Good — quantify the impact',
        hr: 'Good — add a specific example',
      };
      return { level: 'good', text: cues[normalizedType] || 'Good — add more depth', color: 'yellow' };
    }
    if (overall >= 4) return { level: 'fair', text: 'Try adding more detail', color: 'orange' };
    return { level: 'weak', text: 'Think through your approach first', color: 'red' };
  }

  static _calculateRollingScores(analysis, transcript, interviewType = 'dsa', experienceLevel = null) {
    return InterviewScoringService.calculateRollingScores(analysis, transcript, interviewType, experienceLevel);
  }

  static _deriveAdaptiveDifficulty(currentDifficulty, rollingOverallTen, turns, scoreTrend = null) {
    return InterviewScoringService.deriveAdaptiveDifficulty(currentDifficulty, rollingOverallTen, turns, scoreTrend);
  }

  // ── Clarification request detector ────────────────────────────────────
  static _detectClarificationRequest(candidateResponse) {
    const lower = String(candidateResponse || '').trim().toLowerCase();
    const words = lower.split(/\s+/).filter(Boolean);

    // Only check very short responses (< 12 words) — real answers won't match
    if (words.length > 12) return { isClarification: false };

    const repeatPatterns = /^(what\??|huh\??|sorry\??|come again|repeat|say that again|can you repeat|didn'?t catch|didn'?t hear|pardon)/;
    const clarifyPatterns = /(can you clarify|what do you mean|could you explain|i don'?t understand|what exactly|can you rephrase|not sure i follow)/;

    // Check clarify first — more specific patterns take priority
    if (clarifyPatterns.test(lower)) return { isClarification: true, type: 'clarify' };
    if (repeatPatterns.test(lower)) return { isClarification: true, type: 'repeat' };
    return { isClarification: false };
  }

  // ── 3-tier progressive hint system ────────────────────────────────────
  // Tier 1 (Nudge): gentle redirect to simpler approach
  // Tier 2 (Scaffold): suggest specific data structure or technique
  // Tier 3 (Teach): give high-level approach, ask candidate to implement a piece
  static _buildProgressiveHint(interviewType, stuckCount, _interviewContext = {}) {
    const normalizedType = String(interviewType || 'dsa').toLowerCase();
    const tier = Math.min(3, Math.max(1, stuckCount));

    const hintsByType = {
      dsa: {
        1: "Let's simplify. What would a brute-force approach look like, even if it's not optimal?",
        2: `Consider using a ${['hash map', 'two-pointer technique', 'stack', 'sliding window'][randomInt(4)]}. How might that help here?`,
        3: "Here's the key insight: try breaking the problem into smaller subproblems. Can you implement just the core logic for the base case?",
      },
      system_design: {
        1: "Let's step back. What are the core entities and their relationships?",
        2: "Start with a single-server design first. What components do you need? We can scale it later.",
        3: "The typical architecture here uses a load balancer, app servers, a database, and a cache layer. Can you walk me through how data flows through these?",
      },
      behavioral: {
        1: "Take a moment. Think of a specific project or situation — what was the context?",
        2: "Try the STAR format: Situation, Task, Action, Result. Start with the situation — what was happening?",
        3: "Let me help: think of a time you faced a deadline or conflict. Describe the situation, then tell me what you personally did.",
      },
      hr: {
        1: "No pressure — just share what comes to mind naturally. There are no wrong answers here.",
        2: "Think about what specifically drew you to technology or this field. What was the moment that got you excited?",
        3: "Here's a simple framework: mention what you've done, what you learned, and where you want to go next.",
      },
    };

    const typeHints = hintsByType[normalizedType] || hintsByType.dsa;
    return {
      hintTier: tier,
      hintMessage: typeHints[tier] || typeHints[1],
      isHint: true,
    };
  }

  // ── Turn summary: distill candidate response into 1-sentence claim ──
  static _generateTurnSummary(candidateResponse, interviewType, signals = {}) {
    const text = String(candidateResponse || '').trim();
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length < 5) return 'Candidate gave a very brief response.';

    const normalizedType = String(interviewType || 'dsa').toLowerCase();
    const lower = text.toLowerCase();
    const parts = [];

    if (normalizedType === 'behavioral' || normalizedType === 'hr') {
      if (/(situation|context|we were facing)/.test(lower)) parts.push('described a situation');
      if (/(i decided|i led|i took|i implemented)/.test(lower)) parts.push('explained personal actions');
      if (/(result|outcome|impact|achieved|reduced|improved)/.test(lower)) parts.push('shared measurable outcome');
      if (parts.length === 0) parts.push('shared a general response without STAR structure');
    } else if (normalizedType === 'system_design' || normalizedType === 'system-design') {
      if (signals.hasTradeoffs) parts.push('discussed trade-offs');
      if (/scale|shard|replica|cache/.test(lower)) parts.push('addressed scalability');
      if (/microservice|api gateway|database/.test(lower)) parts.push('proposed architecture components');
      if (parts.length === 0) parts.push('described a high-level design approach');
    } else {
      if (signals.hasComplexity) parts.push('analyzed complexity');
      if (signals.hasEdgeCases) parts.push('covered edge cases');
      if (signals.hasTradeoffs) parts.push('compared approaches');
      if (parts.length === 0) parts.push('described an approach');
    }

    // Add first 12 words of the response as context anchor
    const preview = words.slice(0, 12).join(' ');
    return `Candidate ${parts.join(', ')}. ("${preview}...")`;
  }

  // ── Topic extractor: identify primary probing area from interviewer message ──
  static _extractPrimaryTopic(interviewerMessage, _interviewType) {
    const lower = String(interviewerMessage || '').toLowerCase();
    if (!lower || lower.length < 10) return null;

    // Check for common probing patterns and return the topic label
    const topicPatterns = [
      [/time complexity|space complexity|big.?o|runtime/, 'complexity analysis'],
      [/edge case|boundary|corner case|empty input|null/, 'edge cases'],
      [/trade.?off|alternative|compare|pros and cons/, 'trade-offs'],
      [/scale|shard|partition|replica|throughput/, 'scalability'],
      [/star|situation|task|action|result|outcome/, 'STAR structure'],
      [/why did you|walk me through|explain your|reasoning/, 'reasoning depth'],
      [/failure|incident|mistake|went wrong/, 'failure handling'],
      [/how would you test|test case|validate/, 'testing strategy'],
      [/optimize|improve|faster|better approach/, 'optimization'],
      [/motivation|why this|career|excite/, 'career motivation'],
      [/team|collaborate|conflict|disagree/, 'teamwork/conflict'],
    ];

    for (const [pattern, topic] of topicPatterns) {
      if (pattern.test(lower)) return topic;
    }
    return null;
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

  static _analyzeInterviewResponse(response, _problemStatement, interviewType, interviewContext = {}) {
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

  static _generatePerformanceAnalysis(session) {
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
  static _generateDynamicRecommendations(interviewType, areasForImprovement = [], _strengths = []) {
    const normalizedType = String(interviewType || 'dsa').toLowerCase();

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
    const selectResult = await supabaseAdmin
      .from('interview_performance_trends')
      .select('*')
      .eq('user_id', userId)
      .eq('interview_type', interviewType)
      .eq('company_focus', companyFocus || null)
      .single();
    let existing = selectResult.data;
    const selectError = selectResult.error;

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
      const { error: insertError } = await supabaseAdmin
        .from('interview_performance_trends')
        .insert({
          user_id: userId,
          interview_type: interviewType,
          company_focus: companyFocus,
          interview_count: 1,
          avg_score: scores.interviewScore,
          last_interview_date: new Date().toISOString()
        });

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
