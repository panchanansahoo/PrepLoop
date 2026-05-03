/**
 * Question Novelty Balancer Service
 *
 * Extends question selection with novelty scoring to prevent repetition fatigue.
 * Balances quality (what's best) with novelty (what's fresh) to create engaging interviews.
 *
 * Algorithm:
 * - Track per-user question usage (how many times user has seen question)
 * - Novelty score = 1 / (1 + ln(usage_count + 1))
 *   - Usage 0 (new) → novelty 1.0
 *   - Usage 1 → novelty 0.59
 *   - Usage 2 → novelty 0.44
 *   - Usage 10 → novelty 0.16
 * - Combined score = 0.6 × quality + 0.4 × novelty
 * - Constraint: Never recommend question seen >2× in past month
 * - Return both scores for transparency
 */

export class QuestionNoveltyBalancer {
  constructor() {
    // In-memory usage tracking: { userId_questionId: { count, lastSeenAt } }
    this.usageMap = new Map();
    // Recommendation history: { userId: [{ questionId, recommendedAt, interviewId }] }
    this.recommendationHistory = new Map();
  }

  /**
   * Track that a user saw a question in an interview
   * @param {string} userId
   * @param {string} questionId
   * @param {string} interviewId
   */
  recordQuestionUsage(userId, questionId, interviewId) {
    const key = `${userId}_${questionId}`;
    const now = Date.now();

    if (!this.usageMap.has(key)) {
      this.usageMap.set(key, { count: 0, lastSeenAt: null, firstSeenAt: now });
    }

    const usage = this.usageMap.get(key);
    usage.count += 1;
    usage.lastSeenAt = now;

    // Track recommendation history for constraint checking
    if (!this.recommendationHistory.has(userId)) {
      this.recommendationHistory.set(userId, []);
    }
    this.recommendationHistory.get(userId).push({
      questionId,
      recommendedAt: now,
      interviewId,
    });
  }

  /**
   * Get usage count for a user's question
   * @param {string} userId
   * @param {string} questionId
   * @returns {number}
   */
  getUsageCount(userId, questionId) {
    const key = `${userId}_${questionId}`;
    const usage = this.usageMap.get(key);
    return usage ? usage.count : 0;
  }

  /**
   * Calculate novelty score for a question
   * Novelty = 1 / (1 + ln(usage_count + 1))
   * - Never seen (usage=0) → 1.0 (maximum novelty)
   * - Seen once (usage=1) → ~0.59
   * - Seen twice (usage=2) → ~0.44
   * - Seen 10 times → ~0.16 (low novelty)
   *
   * @param {number} usageCount
   * @returns {number} novelty score 0-1
   */
  calculateNoveltyScore(usageCount) {
    // Ensure non-negative
    const count = Math.max(0, usageCount);
    // ln(count + 1) ensures ln(1) = 0 for fresh questions → novelty = 1
    const denominator = 1 + Math.log(count + 1);
    const novelty = 1 / denominator;
    return Math.max(0, Math.min(1, novelty)); // Clamp to [0, 1]
  }

  /**
   * Check if question violates the "not seen >2× in past month" constraint
   * @param {string} userId
   * @param {string} questionId
   * @param {number} monthInMs - milliseconds (default: 30 days)
   * @returns {boolean} true if question violates constraint (should not recommend)
   */
  violatesRecentRepeatConstraint(userId, questionId, monthInMs = 30 * 24 * 60 * 60 * 1000) {
    const history = this.recommendationHistory.get(userId) || [];
    const cutoffTime = Date.now() - monthInMs;

    const recentCount = history.filter(
      (rec) => rec.questionId === questionId && rec.recommendedAt > cutoffTime
    ).length;

    // Violates if recommended >2 times in past month
    return recentCount > 2;
  }

  /**
   * Score a set of questions combining quality and novelty
   * Returns both components for transparency
   *
   * @param {Array} questions - Array of { id, qualityScore, ... }
   * @param {string} userId
   * @param {Object} options
   *   - qualityWeight: 0-1 (default: 0.6)
   *   - noveltyWeight: 0-1 (default: 0.4)
   *   - excludeRepeats: boolean (default: true) - exclude questions seen >2× in past month
   *   - monthInMs: number (default: 30*24*60*60*1000) - time window for repeat check
   * @returns {Array} questions with combinedScore, noveltyScore, usageCount, violatesConstraint
   */
  scoreQuestionsWithNovelty(questions, userId, options = {}) {
    const {
      qualityWeight = 0.6,
      noveltyWeight = 0.4,
      excludeRepeats = true,
      monthInMs = 30 * 24 * 60 * 60 * 1000,
    } = options;

    // Validate weights
    if (qualityWeight + noveltyWeight !== 1) {
      throw new Error('qualityWeight and noveltyWeight must sum to 1');
    }

    const scored = questions.map((q) => {
      const usageCount = this.getUsageCount(userId, q.id);
      const noveltyScore = this.calculateNoveltyScore(usageCount);
      const violatesConstraint = this.violatesRecentRepeatConstraint(userId, q.id, monthInMs);

      // Combined score: 60% quality + 40% novelty
      // Handle undefined/null quality score as 0
      const qualityScore = q.qualityScore ?? 0;
      const combinedScore = qualityScore * qualityWeight + noveltyScore * noveltyWeight;

      return {
        ...q,
        noveltyScore: Math.round(noveltyScore * 100) / 100, // Round to 2 decimals
        usageCount,
        violatesConstraint,
        combinedScore: Math.round(combinedScore * 100) / 100,
      };
    });

    // Filter out constraint violations if requested
    if (excludeRepeats) {
      return scored.filter((q) => !q.violatesConstraint);
    }

    return scored;
  }

  /**
   * Get top-ranked questions by combined score
   * @param {Array} questions
   * @param {string} userId
   * @param {number} limit
   * @param {Object} options - scoreQuestionsWithNovelty options
   * @returns {Array} top questions sorted by combinedScore descending
   */
  getTopQuestionsByNovelty(questions, userId, limit = 10, options = {}) {
    const scored = this.scoreQuestionsWithNovelty(questions, userId, options);
    return scored.sort((a, b) => b.combinedScore - a.combinedScore).slice(0, limit);
  }

  /**
   * Get novelty report for a user
   * Shows which questions are getting stale
   *
   * @param {string} userId
   * @param {Array} allQuestions
   * @returns {Object} report with fresh, repeated, stale categories
   */
  getNoveltyReport(userId, allQuestions) {
    const fresh = [];
    const repeated = []; // Seen 1-2 times
    const stale = []; // Seen 3+ times

    for (const q of allQuestions) {
      const count = this.getUsageCount(userId, q.id);
      const novelty = this.calculateNoveltyScore(count);

      const item = {
        id: q.id,
        usageCount: count,
        noveltyScore: Math.round(novelty * 100) / 100,
        quality: q.qualityScore || 0,
      };

      if (count === 0) {
        fresh.push(item);
      } else if (count <= 2) {
        repeated.push(item);
      } else {
        stale.push(item);
      }
    }

    return {
      fresh: fresh.length,
      repeated: repeated.length,
      stale: stale.length,
      total: allQuestions.length,
      freshQuestions: fresh,
      repeatedQuestions: repeated.sort((a, b) => a.usageCount - b.usageCount),
      staleQuestions: stale.sort((a, b) => b.usageCount - a.usageCount),
    };
  }

  /**
   * Get recommendation diversity score
   * How many different questions has user seen (out of total available)?
   *
   * @param {string} userId
   * @param {number} totalQuestions
   * @returns {Object} { diversityScore, seenCount, totalCount, percentSeen }
   */
  getRecommendationDiversity(userId, totalQuestions) {
    const history = this.recommendationHistory.get(userId) || [];
    const uniqueQuestions = new Set(history.map((rec) => rec.questionId));
    const seenCount = uniqueQuestions.size;
    const percentSeen = totalQuestions > 0 ? (seenCount / totalQuestions) * 100 : 0;

    return {
      seenCount,
      totalCount: totalQuestions,
      percentSeen: Math.round(percentSeen),
      diversityScore: Math.round((seenCount / Math.max(1, totalQuestions)) * 100) / 100,
    };
  }

  /**
   * Reset usage tracking for a user
   * @param {string} userId
   */
  resetUserUsage(userId) {
    // Remove all usage entries for this user
    const keysToDelete = [];
    for (const key of this.usageMap.keys()) {
      if (key.startsWith(`${userId}_`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((key) => this.usageMap.delete(key));

    // Clear recommendation history
    this.recommendationHistory.delete(userId);
  }

  /**
   * Reset all data (for testing)
   */
  resetAll() {
    this.usageMap.clear();
    this.recommendationHistory.clear();
  }

  /**
   * Get usage statistics for diagnostics
   * @returns {Object} stats about usage tracking
   */
  getStatistics() {
    let totalEntries = 0;
    let totalUsageCount = 0;
    let avgUsagePerQuestion = 0;

    for (const usage of this.usageMap.values()) {
      totalEntries += 1;
      totalUsageCount += usage.count;
    }

    avgUsagePerQuestion = totalEntries > 0 ? totalUsageCount / totalEntries : 0;

    return {
      trackedQuestionUsers: totalEntries,
      totalRecommendations: totalUsageCount,
      avgUsagePerQuestion: Math.round(avgUsagePerQuestion * 100) / 100,
      usersTracked: this.recommendationHistory.size,
    };
  }
}

// Export singleton instance for use across services
export const questionNoveltyBalancer = new QuestionNoveltyBalancer();
