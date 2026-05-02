/**
 * Phase 2 Integration Service
 * Connects all Phase 2 utilities (dedup, difficulty, follow-ups) into interview flow
 */

import * as questionHasher from '../utils/questionHasher.js';
import * as questionPoolManager from '../utils/questionPoolManager.js';
import * as performanceAnalyzer from '../utils/performanceAnalyzer.js';
import * as difficultyAdjuster from '../utils/difficultyAdjuster.js';
import * as followUpContextBuilder from '../utils/followUpContextBuilder.js';

/**
 * Initialize Phase 2 for user interview session
 * Call at interview start
 */
export function initializePhase2(userId, interviewType, difficulty) {
  // Ensure user profiles exist by calling getters
  questionPoolManager.getPoolStats(userId);
  performanceAnalyzer.getOverallPerformance(userId);
  difficultyAdjuster.getCurrentDifficulty(userId);
  
  return {
    userId,
    interviewType,
    initialDifficulty: difficulty,
    initialized: true,
    timestamp: Date.now()
  };
}

/**
 * Check if question is duplicate
 * Returns: { isDuplicate, matches, similarityScore }
 */
export function checkQuestionDuplicate(userId, questionText) {
  return questionPoolManager.isDuplicate(userId, questionText, {
    threshold: 80  // 80% similarity threshold
  });
}

/**
 * Add question to user's pool
 * Call after question is asked to user
 */
export function trackQuestionAsked(userId, questionData) {
  const poolEntry = questionPoolManager.addQuestion(userId, {
    id: questionData.id,
    text: questionData.text,
    difficulty: questionData.difficulty || 'medium',
    category: questionData.category || 'general'
  });
  
  return {
    tracked: true,
    questionId: poolEntry.id,
    poolSize: questionPoolManager.getPoolStats(userId).activeQuestions
  };
}

/**
 * Get difficulty for next question
 * Returns: { difficulty, adjusted, reason }
 */
export function getNextQuestionDifficulty(userId, category = 'general') {
  const result = difficultyAdjuster.getDifficultyWithAdjustment(userId, category);
  
  return {
    difficulty: result.difficulty,
    autoAdjusted: result.adjusted,
    adjustmentReason: result.adjustmentReason || result.reason,
    previousDifficulty: result.previousDifficulty
  };
}

/**
 * Record user's answer and score
 * Call after AI evaluation
 */
export function recordAnswer(userId, answerData) {
  // Record performance score
  const scoreEntry = performanceAnalyzer.recordScore(userId, {
    category: answerData.category || 'general',
    difficulty: answerData.difficulty || 'medium',
    correctness: answerData.correctness || 0,
    speed: answerData.speed || 0,
    explanation: answerData.explanation || 0,
    questionId: answerData.questionId,
    responseTime: answerData.responseTime || 0
  });
  
  // Update question metadata
  if (answerData.questionId) {
    questionPoolManager.updateQuestion(userId, answerData.questionId, {
      responseTime: answerData.responseTime,
      quality: scoreEntry.combinedScore
    });
  }
  
  return {
    score: scoreEntry.combinedScore,
    correctness: scoreEntry.correctness,
    explanation: scoreEntry.explanation,
    speed: scoreEntry.speed,
    recorded: true
  };
}

/**
 * Get follow-up recommendation for answer
 * Returns: { canFollowUp, followUpCount, prompt }
 */
export function getFollowUpRecommendation(question, answer, difficulty = 'medium') {
  return followUpContextBuilder.getFollowUpRecommendation(question, answer, difficulty);
}

/**
 * Generate follow-up prompt
 * Call if follow-up is needed
 */
export function generateFollowUpPrompt(question, answer, difficulty = 'medium') {
  const contextResult = followUpContextBuilder.buildFollowUpContext(question, answer);
  
  if (!contextResult.success) {
    return null;
  }
  
  const promptResult = followUpContextBuilder.generateFollowUpPrompt(contextResult, difficulty);
  
  return {
    prompt: promptResult.prompt,
    strategy: promptResult.strategy,
    quality: contextResult.context.answerQuality.quality,
    focus: contextResult.context.followUpFocus
  };
}

/**
 * Get interview performance summary
 * Call at interview end or for dashboard
 */
export function getPerformanceSummary(userId) {
  const overall = performanceAnalyzer.getOverallPerformance(userId);
  const progression = difficultyAdjuster.getProgression(userId);
  const poolStats = questionPoolManager.getPoolStats(userId);
  const recommendations = performanceAnalyzer.getRecommendations(userId);
  
  return {
    overall: {
      score: overall.overallAverage,
      totalQuestions: overall.totalQuestions,
      topCategory: overall.topCategory?.name,
      weakestCategory: overall.weakestCategory?.name
    },
    difficulty: {
      current: difficultyAdjuster.getCurrentDifficulty(userId),
      adjustmentCount: progression.totalAdjustments,
      progression: progression.progression
    },
    questions: {
      uniqueAsked: poolStats.activeQuestions,
      byCategory: poolStats.byCategory,
      byDifficulty: poolStats.byDifficulty
    },
    recommendations,
    timestamp: Date.now()
  };
}

/**
 * Get detailed analytics
 */
export function getDetailedAnalytics(userId) {
  return {
    performance: performanceAnalyzer.getOverallPerformance(userId),
    patterns: performanceAnalyzer.detectPatterns(userId),
    difficulty: {
      current: difficultyAdjuster.getCurrentDifficulty(userId),
      progression: difficultyAdjuster.getProgression(userId),
      adjustmentHistory: difficultyAdjuster.getAdjustmentHistory(userId),
      recommendations: difficultyAdjuster.getAdjustmentRecommendations(userId)
    },
    questionPool: questionPoolManager.getPoolStats(userId),
    categoryComparison: performanceAnalyzer.getCategoryComparison(userId)
  };
}

/**
 * Validate question before showing to user
 * Full validation: dedup + categorization + difficulty
 */
export function validateQuestionForUser(userId, questionText, difficulty = 'medium') {
  // Check for duplicates
  const dupCheck = checkQuestionDuplicate(userId, questionText);
  
  if (dupCheck.isDuplicate) {
    return {
      valid: false,
      reason: 'duplicate-detected',
      matches: dupCheck.matches,
      similarityScore: dupCheck.similarityScore
    };
  }
  
  // Get category
  const fingerprint = questionHasher.generateFingerprint(questionText);
  
  return {
    valid: true,
    category: fingerprint.category,
    keyTopics: fingerprint.keyTerms,
    normalizedText: fingerprint.normalized,
    difficulty
  };
}

/**
 * Get quality assessment for answer
 */
export function assessAnswerQuality(answer, question) {
  const quality = followUpContextBuilder.analyzeQuality(answer);
  const gaps = followUpContextBuilder.identifyGaps(answer, question);
  const concepts = followUpContextBuilder.extractConcepts(answer);
  
  return {
    quality: quality.quality,
    score: quality.score,
    indicators: quality.indicators,
    gaps: gaps.gaps,
    concepts: concepts.slice(0, 5),
    metrics: {
      length: quality.length,
      sentenceCount: quality.sentenceCount,
      hasExamples: gaps.hasExamples,
      hasReasoning: gaps.hasReasoning,
      hasAlternatives: gaps.hasAlternatives
    }
  };
}

/**
 * Clean up and finalize interview session
 * Call at interview end
 */
export function finalizeInterviewSession(userId) {
  // Trigger pool cleanup if needed
  questionPoolManager.cleanupPool(userId, false);
  
  return {
    userId,
    sessionFinalized: true,
    timestamp: Date.now()
  };
}

/**
 * Get system-wide Phase 2 statistics
 */
export function getPhase2GlobalStats() {
  return {
    questionPools: questionPoolManager.getGlobalStats(),
    performance: performanceAnalyzer.getGlobalStats(),
    difficulty: difficultyAdjuster.getGlobalStats(),
    timestamp: Date.now()
  };
}

export default {
  initializePhase2,
  checkQuestionDuplicate,
  trackQuestionAsked,
  getNextQuestionDifficulty,
  recordAnswer,
  getFollowUpRecommendation,
  generateFollowUpPrompt,
  getPerformanceSummary,
  getDetailedAnalytics,
  validateQuestionForUser,
  assessAnswerQuality,
  finalizeInterviewSession,
  getPhase2GlobalStats
};
