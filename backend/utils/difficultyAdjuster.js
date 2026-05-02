/**
 * Difficulty Adjuster
 * Adapts interview difficulty based on real-time performance
 * Provides smooth transitions and analytics
 */

import * as performanceAnalyzer from './performanceAnalyzer.js';

// Difficulty levels in order
const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard'];

// Adjustment rules
const ADJUSTMENT_RULES = {
  // Performance threshold for difficulty change
  INCREASE_THRESHOLD: 80,  // If score >= 80%, increase difficulty
  DECREASE_THRESHOLD: 50,  // If score < 50%, decrease difficulty
  
  // Smoothing to prevent jarring transitions
  MIN_QUESTIONS_BEFORE_ADJUSTMENT: 3,  // Need 3 questions before adjusting
  ADJUSTMENT_DEBOUNCE_MS: 60 * 1000,  // Wait 1 minute between adjustments
  
  // Optional: Gradual transition (not in this simple version)
  TRANSITION_STEPS: 1  // Adjust by 1 level at a time
};

// Per-user adjustment state
// userId -> { lastAdjustmentTime, currentDifficulty, adjustmentHistory }
const adjustmentState = new Map();

/**
 * Get or create adjustment state for user
 */
function getOrCreateState(userId, initialDifficulty = 'medium') {
  if (!adjustmentState.has(userId)) {
    adjustmentState.set(userId, {
      userId,
      currentDifficulty: initialDifficulty,
      lastAdjustmentTime: 0,
      adjustmentHistory: [],
      adjustmentCount: 0
    });
  }
  return adjustmentState.get(userId);
}

/**
 * Determine next difficulty based on performance
 * Returns: { shouldAdjust: boolean, newDifficulty: string, reason: string }
 */
export function determineNextDifficulty(userId, category = 'general') {
  const state = getOrCreateState(userId);
  const now = Date.now();
  
  // Check debounce
  const timeSinceLastAdjustment = now - state.lastAdjustmentTime;
  if (timeSinceLastAdjustment < ADJUSTMENT_RULES.ADJUSTMENT_DEBOUNCE_MS) {
    return {
      shouldAdjust: false,
      newDifficulty: state.currentDifficulty,
      reason: `debounce (${Math.round((ADJUSTMENT_RULES.ADJUSTMENT_DEBOUNCE_MS - timeSinceLastAdjustment) / 1000)}s remaining)`
    };
  }
  
  // Get performance data
  const average = performanceAnalyzer.getAverageScore(userId, category);
  const questionCount = performanceAnalyzer.getOverallPerformance(userId).totalQuestions;
  
  // Need enough data points
  if (questionCount < ADJUSTMENT_RULES.MIN_QUESTIONS_BEFORE_ADJUSTMENT) {
    return {
      shouldAdjust: false,
      newDifficulty: state.currentDifficulty,
      reason: `insufficient-data (${questionCount}/${ADJUSTMENT_RULES.MIN_QUESTIONS_BEFORE_ADJUSTMENT})`
    };
  }
  
  // Get current difficulty index
  const currentIndex = DIFFICULTY_LEVELS.indexOf(state.currentDifficulty);
  
  // Check if should increase difficulty
  if (average >= ADJUSTMENT_RULES.INCREASE_THRESHOLD) {
    if (currentIndex < DIFFICULTY_LEVELS.length - 1) {
      const newDifficulty = DIFFICULTY_LEVELS[currentIndex + 1];
      return {
        shouldAdjust: true,
        newDifficulty,
        reason: `high-performance (${average}% >= ${ADJUSTMENT_RULES.INCREASE_THRESHOLD}%)`,
        performanceScore: average
      };
    } else {
      return {
        shouldAdjust: false,
        newDifficulty: state.currentDifficulty,
        reason: 'already-at-maximum-difficulty',
        performanceScore: average
      };
    }
  }
  
  // Check if should decrease difficulty
  if (average < ADJUSTMENT_RULES.DECREASE_THRESHOLD) {
    if (currentIndex > 0) {
      const newDifficulty = DIFFICULTY_LEVELS[currentIndex - 1];
      return {
        shouldAdjust: true,
        newDifficulty,
        reason: `low-performance (${average}% < ${ADJUSTMENT_RULES.DECREASE_THRESHOLD}%)`,
        performanceScore: average
      };
    } else {
      return {
        shouldAdjust: false,
        newDifficulty: state.currentDifficulty,
        reason: 'already-at-minimum-difficulty',
        performanceScore: average
      };
    }
  }
  
  // Performance is in "stable" range
  return {
    shouldAdjust: false,
    newDifficulty: state.currentDifficulty,
    reason: `stable-performance (${average}%)`,
    performanceScore: average
  };
}

/**
 * Apply difficulty adjustment
 */
export function applyAdjustment(userId, newDifficulty, reason = '') {
  const state = getOrCreateState(userId);
  const now = Date.now();
  
  if (!DIFFICULTY_LEVELS.includes(newDifficulty)) {
    return {
      success: false,
      error: `invalid-difficulty: ${newDifficulty}`
    };
  }
  
  const oldDifficulty = state.currentDifficulty;
  
  if (oldDifficulty === newDifficulty) {
    return {
      success: false,
      error: 'no-change-needed'
    };
  }
  
  // Apply adjustment
  state.currentDifficulty = newDifficulty;
  state.lastAdjustmentTime = now;
  state.adjustmentCount++;
  
  const entry = {
    timestamp: now,
    from: oldDifficulty,
    to: newDifficulty,
    reason,
    adjustmentNumber: state.adjustmentCount
  };
  
  state.adjustmentHistory.push(entry);
  
  return {
    success: true,
    userId,
    oldDifficulty,
    newDifficulty,
    adjustmentNumber: state.adjustmentCount,
    timestamp: now
  };
}

/**
 * Get current difficulty for user
 */
export function getCurrentDifficulty(userId) {
  const state = getOrCreateState(userId);
  return state.currentDifficulty;
}

/**
 * Get difficulty with automatic adjustment if needed
 */
export function getDifficultyWithAdjustment(userId, category = 'general') {
  const determination = determineNextDifficulty(userId, category);
  
  if (determination.shouldAdjust) {
    const result = applyAdjustment(userId, determination.newDifficulty, determination.reason);
    
    if (result.success) {
      return {
        difficulty: result.newDifficulty,
        adjusted: true,
        adjustmentReason: determination.reason,
        previousDifficulty: result.oldDifficulty
      };
    }
  }
  
  const state = getOrCreateState(userId);
  return {
    difficulty: state.currentDifficulty,
    adjusted: false,
    reason: determination.reason,
    performanceScore: determination.performanceScore
  };
}

/**
 * Get adjustment history for user
 */
export function getAdjustmentHistory(userId) {
  const state = getOrCreateState(userId);
  
  return {
    userId,
    totalAdjustments: state.adjustmentCount,
    currentDifficulty: state.currentDifficulty,
    lastAdjustmentTime: state.lastAdjustmentTime,
    history: state.adjustmentHistory
  };
}

/**
 * Set difficulty explicitly (e.g., user preference)
 */
export function setDifficulty(userId, difficulty) {
  if (!DIFFICULTY_LEVELS.includes(difficulty)) {
    return {
      success: false,
      error: `invalid-difficulty: ${difficulty}`
    };
  }
  
  const state = getOrCreateState(userId);
  const oldDifficulty = state.currentDifficulty;
  
  state.currentDifficulty = difficulty;
  state.lastAdjustmentTime = Date.now();
  
  const entry = {
    timestamp: Date.now(),
    from: oldDifficulty,
    to: difficulty,
    reason: 'user-preference',
    adjustmentNumber: state.adjustmentCount
  };
  
  state.adjustmentHistory.push(entry);
  
  return {
    success: true,
    oldDifficulty,
    newDifficulty: difficulty,
    reason: 'user-preference'
  };
}

/**
 * Get difficulty progression analytics
 */
export function getProgression(userId) {
  const state = getOrCreateState(userId);
  const overall = performanceAnalyzer.getOverallPerformance(userId);
  
  if (state.adjustmentHistory.length === 0) {
    return {
      userId,
      hasAdjusted: false,
      currentDifficulty: state.currentDifficulty,
      totalQuestions: overall.totalQuestions,
      message: 'No adjustments made yet'
    };
  }
  
  // Calculate progression path
  let easyQuestions = 0;
  let mediumQuestions = 0;
  let hardQuestions = 0;
  
  for (const adj of state.adjustmentHistory) {
    if (adj.from === 'easy') easyQuestions++;
    else if (adj.from === 'medium') mediumQuestions++;
    else if (adj.from === 'hard') hardQuestions++;
  }
  
  const path = [];
  for (const adj of state.adjustmentHistory) {
    path.push(`${adj.from} → ${adj.to}`);
  }
  
  return {
    userId,
    hasAdjusted: true,
    currentDifficulty: state.currentDifficulty,
    totalAdjustments: state.adjustmentCount,
    totalQuestions: overall.totalQuestions,
    progression: path,
    adjustmentTimeline: state.adjustmentHistory
  };
}

/**
 * Get adjustment recommendations
 */
export function getAdjustmentRecommendations(userId, category = 'general') {
  const determination = determineNextDifficulty(userId, category);
  const state = getOrCreateState(userId);
  const performance = performanceAnalyzer.getOverallPerformance(userId);
  
  const recommendations = [];
  
  if (performance.totalQuestions === 0) {
    recommendations.push({
      type: 'getting-started',
      message: 'Complete your first question to get difficulty recommendations'
    });
    return recommendations;
  }
  
  if (determination.shouldAdjust) {
    if (determination.newDifficulty > state.currentDifficulty) {
      recommendations.push({
        type: 'increase',
        message: `You're performing well (${determination.performanceScore}%). Consider increasing to ${determination.newDifficulty} difficulty.`,
        action: 'increase-difficulty'
      });
    } else {
      recommendations.push({
        type: 'decrease',
        message: `You may benefit from easier questions (current score: ${determination.performanceScore}%). Consider dropping to ${determination.newDifficulty}.`,
        action: 'decrease-difficulty'
      });
    }
  } else {
    const reasons = determination.reason.split('(');
    recommendations.push({
      type: 'maintain',
      message: `Your current difficulty (${state.currentDifficulty}) seems appropriate. ${reasons[0]}`,
      reason: determination.reason
    });
  }
  
  return recommendations;
}

/**
 * Clear adjustment history for user
 */
export function resetUser(userId) {
  if (adjustmentState.has(userId)) {
    const oldState = adjustmentState.get(userId);
    adjustmentState.delete(userId);
    return {
      userId,
      status: 'reset',
      previousDifficulty: oldState.currentDifficulty,
      adjustmentsCleared: oldState.adjustmentCount
    };
  }
  
  return { userId, status: 'not-found' };
}

/**
 * Get global difficulty distribution
 */
export function getGlobalStats() {
  const stats = {
    totalUsers: adjustmentState.size,
    difficultyDistribution: {
      easy: 0,
      medium: 0,
      hard: 0
    },
    adjustmentStats: {
      totalAdjustments: 0,
      avgAdjustmentsPerUser: 0
    }
  };
  
  let totalAdjustments = 0;
  
  for (const [userId, state] of adjustmentState.entries()) {
    stats.difficultyDistribution[state.currentDifficulty]++;
    stats.adjustmentStats.totalAdjustments += state.adjustmentCount;
    totalAdjustments += state.adjustmentCount;
  }
  
  if (stats.totalUsers > 0) {
    stats.adjustmentStats.avgAdjustmentsPerUser = 
      (totalAdjustments / stats.totalUsers).toFixed(2);
  }
  
  return stats;
}

export default {
  determineNextDifficulty,
  applyAdjustment,
  getCurrentDifficulty,
  getDifficultyWithAdjustment,
  getAdjustmentHistory,
  setDifficulty,
  getProgression,
  getAdjustmentRecommendations,
  resetUser,
  getGlobalStats,
  DIFFICULTY_LEVELS,
  ADJUSTMENT_RULES
};
