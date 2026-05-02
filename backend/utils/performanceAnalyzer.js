/**
 * Performance Analyzer
 * Tracks and analyzes interview performance metrics
 * Calculates scores, trends, and performance patterns
 */

// Per-user performance data
// userId -> { categories: { category -> { scores: [], timestamps: [] } } }
const performanceData = new Map();

// Configuration
const CONFIG = {
  HISTORY_LIMIT: 100,  // Keep last 100 scores per category
  TREND_WINDOW: 5,  // Calculate trend over last N scores
  VOLATILITY_THRESHOLD: 15,  // If score varies by >15%, consider volatile
  RETENTION_MS: 7 * 24 * 60 * 60 * 1000  // Keep data for 7 days
};

/**
 * Score entry structure:
 * {
 *   timestamp: number,
 *   category: string,
 *   difficulty: string,
 *   correctness: 0-100,
 *   speed: 0-100 (based on time vs expected),
 *   explanation: 0-100 (quality of response),
 *   combinedScore: 0-100,
 *   questionId: string,
 *   responseTime: number (ms)
 * }
 */

/**
 * Get or create performance profile for user
 */
function getOrCreateProfile(userId) {
  if (!performanceData.has(userId)) {
    performanceData.set(userId, {
      categories: new Map()
    });
  }
  return performanceData.get(userId);
}

/**
 * Get or create category data
 */
function getOrCreateCategory(userId, category) {
  const profile = getOrCreateProfile(userId);
  
  if (!profile.categories.has(category)) {
    profile.categories.set(category, {
      scores: [],
      timestamps: []
    });
  }
  
  return profile.categories.get(category);
}

/**
 * Record a score for a question
 */
export function recordScore(userId, scoreData) {
  if (!userId || !scoreData) return null;
  
  const {
    category = 'general',
    difficulty = 'medium',
    correctness = 0,  // 0-100
    speed = 0,  // 0-100
    explanation = 0,  // 0-100
    questionId = null,
    responseTime = 0  // milliseconds
  } = scoreData;
  
  // Combine scores: 50% correctness, 25% explanation, 25% speed
  const combinedScore = Math.round(
    (correctness * 0.5) + (explanation * 0.25) + (speed * 0.25)
  );
  
  const entry = {
    timestamp: Date.now(),
    category: category.toLowerCase(),
    difficulty,
    correctness: Math.min(100, Math.max(0, correctness)),
    speed: Math.min(100, Math.max(0, speed)),
    explanation: Math.min(100, Math.max(0, explanation)),
    combinedScore,
    questionId,
    responseTime
  };
  
  const catData = getOrCreateCategory(userId, entry.category);
  catData.scores.push(combinedScore);
  catData.timestamps.push(entry.timestamp);
  
  // Maintain history limit
  if (catData.scores.length > CONFIG.HISTORY_LIMIT) {
    catData.scores.shift();
    catData.timestamps.shift();
  }
  
  return entry;
}

/**
 * Get current score for a category
 */
export function getCurrentScore(userId, category = 'general') {
  const catData = getOrCreateCategory(userId, category);
  if (catData.scores.length === 0) return 0;
  return catData.scores[catData.scores.length - 1];
}

/**
 * Get average score for a category
 */
export function getAverageScore(userId, category = 'general', windowSize = null) {
  const catData = getOrCreateCategory(userId, category);
  if (catData.scores.length === 0) return 0;
  
  const size = windowSize || catData.scores.length;
  const recent = catData.scores.slice(-size);
  
  const sum = recent.reduce((a, b) => a + b, 0);
  return Math.round(sum / recent.length);
}

/**
 * Get performance trend
 * Returns: { trend: 'improving'|'declining'|'stable', rate: number (-100 to 100) }
 */
export function getPerformanceTrend(userId, category = 'general') {
  const catData = getOrCreateCategory(userId, category);
  
  if (catData.scores.length < CONFIG.TREND_WINDOW) {
    return {
      trend: 'insufficient-data',
      rate: 0,
      dataPoints: catData.scores.length
    };
  }
  
  // Compare first half vs second half of trend window
  const window = CONFIG.TREND_WINDOW;
  const recent = catData.scores.slice(-window);
  
  const firstHalf = recent.slice(0, Math.floor(window / 2));
  const secondHalf = recent.slice(Math.floor(window / 2));
  
  const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  // Calculate rate of change (-100 to 100)
  const rate = Math.round(((avgSecond - avgFirst) / avgFirst) * 100);
  
  let trend = 'stable';
  if (rate > CONFIG.VOLATILITY_THRESHOLD) {
    trend = 'improving';
  } else if (rate < -CONFIG.VOLATILITY_THRESHOLD) {
    trend = 'declining';
  }
  
  return {
    trend,
    rate,
    avgFirst: Math.round(avgFirst),
    avgSecond: Math.round(avgSecond)
  };
}

/**
 * Get performance volatility (consistency)
 * Returns: 0-100, where 100 is perfectly stable
 */
export function getVolatility(userId, category = 'general') {
  const catData = getOrCreateCategory(userId, category);
  
  if (catData.scores.length < 2) return 100;  // No data = stable
  
  const scores = catData.scores;
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  
  // Calculate standard deviation
  const squaredDiffs = scores.map(s => Math.pow(s - avg, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / scores.length;
  const stdDev = Math.sqrt(variance);
  
  // Convert to 0-100 scale (lower stdDev = higher stability)
  const stability = Math.max(0, 100 - stdDev);
  
  return Math.round(stability);
}

/**
 * Get category-by-category comparison
 */
export function getCategoryComparison(userId) {
  const profile = getOrCreateProfile(userId);
  const comparison = {};
  
  for (const [category, data] of profile.categories.entries()) {
    if (data.scores.length === 0) continue;
    
    comparison[category] = {
      current: getCurrentScore(userId, category),
      average: getAverageScore(userId, category),
      trend: getPerformanceTrend(userId, category),
      volatility: getVolatility(userId, category),
      totalQuestions: data.scores.length
    };
  }
  
  return comparison;
}

/**
 * Get overall performance summary
 */
export function getOverallPerformance(userId) {
  const profile = getOrCreateProfile(userId);
  
  let totalScore = 0;
  let totalQuestions = 0;
  const categoryStats = [];
  
  for (const [category, data] of profile.categories.entries()) {
    if (data.scores.length === 0) continue;
    
    const avg = getAverageScore(userId, category);
    totalScore += avg;
    totalQuestions += data.scores.length;
    
    categoryStats.push({
      category,
      average: avg,
      count: data.scores.length
    });
  }
  
  const overallAverage = categoryStats.length > 0
    ? Math.round(totalScore / categoryStats.length)
    : 0;
  
  return {
    userId,
    timestamp: Date.now(),
    overallAverage,
    totalQuestions,
    totalCategories: categoryStats.length,
    categoryStats: categoryStats.sort((a, b) => b.average - a.average),
    topCategory: categoryStats.length > 0
      ? { name: categoryStats[0].category, score: categoryStats[0].average }
      : null,
    weakestCategory: categoryStats.length > 0
      ? { name: categoryStats[categoryStats.length - 1].category, score: categoryStats[categoryStats.length - 1].average }
      : null
  };
}

/**
 * Get difficulty-specific performance
 */
export function getPerformanceByDifficulty(userId, category = 'general') {
  const catData = getOrCreateCategory(userId, category);
  
  const difficulties = {
    easy: [],
    medium: [],
    hard: []
  };
  
  // Note: This requires storing difficulty with each score
  // For now, return structure
  return {
    category,
    byDifficulty: difficulties,
    note: 'Implement by storing difficulty in score entry'
  };
}

/**
 * Detect performance patterns
 */
export function detectPatterns(userId) {
  const profile = getOrCreateProfile(userId);
  const patterns = [];
  
  for (const [category, data] of profile.categories.entries()) {
    if (data.scores.length < 3) continue;
    
    const trend = getPerformanceTrend(userId, category);
    const volatility = getVolatility(userId, category);
    const current = getCurrentScore(userId, category);
    const avg = getAverageScore(userId, category);
    
    // Pattern: Improving
    if (trend.trend === 'improving' && volatility > 70) {
      patterns.push({
        type: 'improving',
        category,
        description: `${category}: Consistent improvement (+${trend.rate}%)`,
        severity: 'positive'
      });
    }
    
    // Pattern: Declining
    if (trend.trend === 'declining' && volatility > 70) {
      patterns.push({
        type: 'declining',
        category,
        description: `${category}: Noticeable decline (-${Math.abs(trend.rate)}%)`,
        severity: 'warning'
      });
    }
    
    // Pattern: Volatile/Inconsistent
    if (volatility < 40 && Math.abs(current - avg) > 20) {
      patterns.push({
        type: 'volatile',
        category,
        description: `${category}: Highly inconsistent performance`,
        severity: 'warning'
      });
    }
    
    // Pattern: Plateauing
    if (trend.trend === 'stable' && data.scores.length > 10) {
      patterns.push({
        type: 'plateau',
        category,
        description: `${category}: Performance plateaued at ${avg}`,
        severity: 'info'
      });
    }
    
    // Pattern: Strong start, declining
    if (data.scores.length > 5) {
      const first = data.scores.slice(0, 3).reduce((a, b) => a + b) / 3;
      const last = data.scores.slice(-3).reduce((a, b) => a + b) / 3;
      if (first > last + 15) {
        patterns.push({
          type: 'regression',
          category,
          description: `${category}: Strong start but recent decline`,
          severity: 'warning'
        });
      }
    }
  }
  
  return patterns;
}

/**
 * Get recommendations based on performance
 */
export function getRecommendations(userId) {
  const overall = getOverallPerformance(userId);
  const patterns = detectPatterns(userId);
  const recommendations = [];
  
  // No data recommendation
  if (overall.totalQuestions === 0) {
    return [{
      type: 'getting-started',
      text: 'Complete your first interview question to start building performance history'
    }];
  }
  
  // Weak category recommendation
  if (overall.weakestCategory && overall.weakestCategory.score < 60) {
    recommendations.push({
      type: 'focus-weak',
      text: `Focus on improving ${overall.weakestCategory.name} (current: ${overall.weakestCategory.score})`,
      category: overall.weakestCategory.name
    });
  }
  
  // Declining trend recommendation
  const decliningPatterns = patterns.filter(p => p.type === 'declining');
  if (decliningPatterns.length > 0) {
    recommendations.push({
      type: 'reverse-trend',
      text: `Your ${decliningPatterns[0].category} performance is declining. Try breaking down problems step-by-step.`,
      category: decliningPatterns[0].category
    });
  }
  
  // Volatility recommendation
  const volatilePatterns = patterns.filter(p => p.type === 'volatile');
  if (volatilePatterns.length > 0) {
    recommendations.push({
      type: 'consistency',
      text: `Improve consistency in ${volatilePatterns[0].category}. Focus on systematic approach.`,
      category: volatilePatterns[0].category
    });
  }
  
  // Strength recommendation
  if (overall.topCategory && overall.topCategory.score > 80) {
    recommendations.push({
      type: 'leverage-strength',
      text: `You're strong in ${overall.topCategory.name}! Can you apply that approach elsewhere?`
    });
  }
  
  return recommendations;
}

/**
 * Clear all performance data for a user
 */
export function clearUserData(userId) {
  if (performanceData.has(userId)) {
    performanceData.delete(userId);
    return { userId, status: 'cleared' };
  }
  return { userId, status: 'not-found' };
}

/**
 * Get total statistics across all users
 */
export function getGlobalStats() {
  const stats = {
    totalUsers: performanceData.size,
    totalScoresRecorded: 0,
    totalCategories: new Set(),
    averagePerformance: 0
  };
  
  let totalScore = 0;
  let scoreCount = 0;
  
  for (const [userId, profile] of performanceData.entries()) {
    for (const [category, data] of profile.categories.entries()) {
      stats.totalCategories.add(category);
      stats.totalScoresRecorded += data.scores.length;
      
      totalScore += data.scores.reduce((a, b) => a + b, 0);
      scoreCount += data.scores.length;
    }
  }
  
  stats.totalCategories = stats.totalCategories.size;
  stats.averagePerformance = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;
  
  return stats;
}

export default {
  recordScore,
  getCurrentScore,
  getAverageScore,
  getPerformanceTrend,
  getVolatility,
  getCategoryComparison,
  getOverallPerformance,
  getPerformanceByDifficulty,
  detectPatterns,
  getRecommendations,
  clearUserData,
  getGlobalStats,
  CONFIG
};
