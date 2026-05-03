/**
 * skillDetector.js
 * 
 * Analyzes user performance trends to detect current skill level and trajectory.
 * Provides per-topic difficulty adjustments and performance metrics.
 */

export default class SkillDetector {
  constructor() {
    this.minSamplesForTrend = 3; // Need at least 3 attempts to detect trend
    this.trendWindow = 10; // Analyze last 10 attempts
  }

  /**
   * Calculate rolling average of performance over attempts
   * Returns trending direction: 'improving' | 'stable' | 'declining'
   */
  getPerformanceTrend(attemptHistory = []) {
    if (attemptHistory.length < this.minSamplesForTrend) {
      return { trend: 'insufficient_data', trend_value: 0 };
    }

    // Take last N attempts from window
    const recentAttempts = attemptHistory.slice(-this.trendWindow);
    const scores = recentAttempts.map((a) => a.score || 0);

    // Split into two halves for comparison
    const mid = Math.floor(scores.length / 2);
    const firstHalf = scores.slice(0, mid);
    const secondHalf = scores.slice(mid);

    const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const trendValue = avgSecond - avgFirst;

    let trend = 'stable';
    if (trendValue > 5) trend = 'improving';
    if (trendValue < -5) trend = 'declining';

    return { trend, trend_value: trendValue };
  }

  /**
   * Calculate user's current performance level for a topic
   * Returns: 0-100 representing difficulty mastery
   */
  calculateTopicMastery(topicStats = {}) {
    if (!topicStats.totalAttempts || topicStats.totalAttempts === 0) {
      return 0; // No data
    }

    const { successfulAttempts = 0, totalAttempts = 0, avgTimeSeconds = 0 } = topicStats;

    // Success rate (0-100)
    const successRate = (successfulAttempts / totalAttempts) * 100;

    // Time efficiency (faster = higher mastery)
    // Assume 30s is normal for that difficulty
    const timeEfficiency = avgTimeSeconds > 0 ? Math.min(100, (30 / avgTimeSeconds) * 100) : 50;

    // Combined mastery score
    return (successRate * 0.7 + timeEfficiency * 0.3);
  }

  /**
   * Get recommended difficulty based on topic mastery
   * Returns: 'easy' | 'medium' | 'hard' | 'advanced'
   */
  getRecommendedDifficulty(topicMastery, currentDifficulty = 'medium') {
    // Difficulty progression: easy (0-25) -> medium (25-50) -> hard (50-75) -> advanced (75-100)
    if (topicMastery >= 75) return 'advanced';
    if (topicMastery >= 50) return 'hard';
    if (topicMastery >= 25) return 'medium';
    return 'easy';
  }

  /**
   * Calculate difficulty adjustment factor
   * Based on performance trend
   * Returns: -1 (easier), 0 (same), +1 (harder)
   */
  calculateDifficultyAdjustment(performanceTrend, topicMastery) {
    if (performanceTrend.trend === 'insufficient_data') return 0;

    // If improving and mastery is good, suggest harder
    if (performanceTrend.trend === 'improving' && topicMastery >= 60) {
      return 1;
    }

    // If declining, suggest easier
    if (performanceTrend.trend === 'declining') {
      return -1;
    }

    // Stable but low mastery? Suggest easier
    if (performanceTrend.trend === 'stable' && topicMastery < 40) {
      return -1;
    }

    return 0;
  }

  /**
   * Get comprehensive skill profile for user
   */
  getSkillProfile(userStats = {}) {
    const { topicStats = {}, attemptHistory = [] } = userStats;

    const skillProfile = {
      overall_mastery: 0,
      performance_trend: { trend: 'insufficient_data', trend_value: 0 },
      topics: {},
      recommendations: [],
    };

    // Calculate per-topic metrics
    let totalMastery = 0;
    let topicCount = 0;

    for (const [topic, stats] of Object.entries(topicStats)) {
      const mastery = this.calculateTopicMastery(stats);
      const trend = this.getPerformanceTrend(stats.attemptHistory || []);
      const adjustment = this.calculateDifficultyAdjustment(trend, mastery);

      skillProfile.topics[topic] = {
        mastery,
        trend: trend.trend,
        trend_value: trend.trend_value,
        recommended_difficulty: this.getRecommendedDifficulty(mastery),
        difficulty_adjustment: adjustment,
      };

      totalMastery += mastery;
      topicCount++;
    }

    // Calculate overall metrics
    if (topicCount > 0) {
      skillProfile.overall_mastery = totalMastery / topicCount;
    }

    skillProfile.performance_trend = this.getPerformanceTrend(attemptHistory);

    // Generate recommendations
    skillProfile.recommendations = this.generateRecommendations(skillProfile);

    return skillProfile;
  }

  /**
   * Generate personalized recommendations based on skill profile
   */
  generateRecommendations(skillProfile) {
    const recommendations = [];

    // Low overall mastery
    if (skillProfile.overall_mastery < 40) {
      recommendations.push({
        type: 'practice_fundamentals',
        message: 'Focus on mastering fundamentals. Try easier problems in weak areas.',
        priority: 'high',
      });
    }

    // Identify weakest topics
    const weakTopics = Object.entries(skillProfile.topics)
      .filter(([_, data]) => data.mastery < 40)
      .map(([topic]) => topic);

    if (weakTopics.length > 0) {
      recommendations.push({
        type: 'weak_topics',
        message: `Work on improving: ${weakTopics.join(', ')}`,
        weak_topics: weakTopics,
        priority: 'high',
      });
    }

    // Improving trend
    if (skillProfile.performance_trend.trend === 'improving') {
      recommendations.push({
        type: 'maintain_momentum',
        message: 'Great! Keep pushing. Try more challenging problems.',
        priority: 'medium',
      });
    }

    // Declining trend
    if (skillProfile.performance_trend.trend === 'declining') {
      recommendations.push({
        type: 'revise_concepts',
        message: 'Take a step back. Review problem solutions and practice similar patterns.',
        priority: 'high',
      });
    }

    // High mastery - time to diversify
    if (skillProfile.overall_mastery >= 75) {
      recommendations.push({
        type: 'explore_advanced',
        message: 'Excellent progress! Explore advanced topics and system design questions.',
        priority: 'medium',
      });
    }

    return recommendations;
  }

  /**
   * Predict next problem difficulty based on submission history
   */
  predictNextDifficulty(lastSubmission, topicStats, currentDifficulty = 'medium') {
    if (!lastSubmission) return currentDifficulty;

    const { success, score } = lastSubmission;

    // If solved with high score, increase difficulty
    if (success && score >= 80) {
      const difficultyLevels = ['easy', 'medium', 'hard', 'advanced'];
      const currentIndex = difficultyLevels.indexOf(currentDifficulty);
      if (currentIndex < difficultyLevels.length - 1) {
        return difficultyLevels[currentIndex + 1];
      }
    }

    // If failed or low score, decrease difficulty
    if (!success || score < 40) {
      const difficultyLevels = ['easy', 'medium', 'hard', 'advanced'];
      const currentIndex = difficultyLevels.indexOf(currentDifficulty);
      if (currentIndex > 0) {
        return difficultyLevels[currentIndex - 1];
      }
    }

    return currentDifficulty;
  }

  /**
   * Estimate time to solve a problem based on difficulty and mastery
   */
  estimateSolveTime(difficulty, topicMastery, baseTimes = {}) {
    const baseTimesByDifficulty = {
      easy: 10,
      medium: 20,
      hard: 40,
      advanced: 60,
      ...baseTimes,
    };

    const baseTime = baseTimesByDifficulty[difficulty] || 20;

    // Mastery reduces solve time
    const masteryFactor = Math.max(0.3, 1 - topicMastery / 200);

    return Math.round(baseTime * masteryFactor);
  }
}
