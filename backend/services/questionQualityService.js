/**
 * Question Quality Service
 * Computes comprehensive quality scores for interview questions based on:
 * - Positive feedback rate (40%)
 * - Completion rate (30%)
 * - Difficulty alignment (20%)
 * - Novelty factor (10%)
 *
 * Also identifies edge-case questions (trick questions, misaligned difficulty)
 */

export class QuestionQualityService {
  constructor(config = {}) {
    this.config = {
      minFeedbackCount: 3,      // Need at least 3 feedbacks to compute quality
      minUsageCount: 2,         // Need at least 2 usages to assess completion rate
      completionRateThreshold: 0.7,  // >70% completion is good
      feedbackPositiveWeight: 0.4,
      completionRateWeight: 0.3,
      difficultyAlignmentWeight: 0.2,
      noveltyWeight: 0.1,
      ...config,
    };

    this.questionMetadata = new Map(); // questionId -> { difficulty, expectedCompletionRate, type, ... }
  }

  /**
   * Compute comprehensive quality score for a question
   *
   * @param {object} metrics - Question metrics from questionMetrics tracker
   *                           { usageCount, feedbackCount, positiveCount, qualityRating, ... }
   * @param {object} userContext - { userId, attemptedCount, successCount, avgScore }
   * @param {number} noveltyScore - Novelty factor (0-1, from novelty tracker)
   * @returns {object} {
   *   quality_score: 0-100,
   *   components: { positive_feedback, completion_rate, difficulty_alignment, novelty },
   *   flags: { trick_question, misaligned_difficulty, low_completion, high_variance },
   *   recommendation: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown'
   * }
   */
  computeQualityScore(metrics, userContext = {}, noveltyScore = 0.5) {
    const components = {
      positive_feedback: 0,
      completion_rate: 0,
      difficulty_alignment: 0,
      novelty: noveltyScore * 100,
    };

    const flags = {
      trick_question: false,
      misaligned_difficulty: false,
      low_completion: false,
      high_variance: false,
      insufficient_data: false,
    };

    // Return unknown if insufficient metrics
    if (!metrics || !metrics.questionId) {
      flags.insufficient_data = true;
      return {
        quality_score: 0,
        components,
        flags,
        recommendation: 'unknown',
        reason: 'No metrics available',
      };
    }

    // 1. Positive Feedback Rate (0-100, 40% weight)
    if (metrics.feedbackCount >= this.config.minFeedbackCount) {
      const positiveRate = metrics.positiveCount / metrics.feedbackCount;
      components.positive_feedback = positiveRate * 100;

      // Flag: trick questions (high usage but low positive feedback)
      if (
        metrics.usageCount >= 10 &&
        positiveRate < 0.3
      ) {
        flags.trick_question = true;
      }
    } else {
      flags.insufficient_data = true;
    }

    // 2. Completion Rate (0-100, 30% weight)
    if (metrics.usageCount >= this.config.minUsageCount && userContext.attemptedCount) {
      const completionRate = (userContext.successCount || 0) / userContext.attemptedCount;
      components.completion_rate = completionRate * 100;

      // Flag: low completion rate
      if (completionRate < 0.5) {
        flags.low_completion = true;
      }
    }

    // 3. Difficulty Alignment (0-100, 20% weight)
    // Check if question difficulty matches user's ability level
    components.difficulty_alignment = this._computeDifficultyAlignment(
      metrics,
      userContext
    );

    // Flag: misaligned difficulty
    if (components.difficulty_alignment < 40) {
      flags.misaligned_difficulty = true;
    }

    // 4. Score Variance Detection (for trick question identification)
    if (userContext.scoreVariance !== undefined) {
      // High variance with moderate score = question has high difficulty variance
      if (userContext.scoreVariance > 25 && (userContext.avgScore || 0) < 70) {
        flags.high_variance = true;
      }
    }

    // Calculate weighted quality score
    const quality_score = Math.round(
      components.positive_feedback * this.config.feedbackPositiveWeight +
      components.completion_rate * this.config.completionRateWeight +
      components.difficulty_alignment * this.config.difficultyAlignmentWeight +
      components.novelty * this.config.noveltyWeight
    );

    // Determine recommendation
    const recommendation = this._getRecommendation(quality_score, flags);

    return {
      quality_score: Math.max(0, Math.min(100, quality_score)),
      components: {
        positive_feedback: Math.round(components.positive_feedback),
        completion_rate: Math.round(components.completion_rate),
        difficulty_alignment: Math.round(components.difficulty_alignment),
        novelty: Math.round(components.novelty),
      },
      flags,
      recommendation,
      metadata: {
        feedback_data_points: metrics.feedbackCount || 0,
        usage_count: metrics.usageCount || 0,
        last_used: metrics.lastUsed || null,
        avg_time_seconds: metrics.averageTime || 0,
      },
    };
  }

  /**
   * Batch compute quality scores for multiple questions
   *
   * @param {array} metrics - Array of question metrics
   * @param {object} userContext - Shared user context
   * @returns {array} Sorted by quality_score descending
   */
  batchComputeQualityScores(metrics, userContext = {}) {
    return metrics
      .map(m => ({
        ...this.computeQualityScore(m, userContext),
        questionId: m.questionId,
        difficulty: m.difficulty,
        category: m.category,
      }))
      .sort((a, b) => b.quality_score - a.quality_score);
  }

  /**
   * Identify edge-case questions that need review
   *
   * @param {array} metrics - All question metrics
   * @param {string} category - Filter by category (optional)
   * @returns {object} { trick_questions, misaligned, low_completion, high_variance }
   */
  identifyEdgeCases(metrics, category = null) {
    const filtered = category
      ? metrics.filter(m => m.category === category)
      : metrics;

    const edgeCases = {
      trick_questions: [],
      misaligned_difficulty: [],
      low_completion: [],
      high_variance: [],
    };

    for (const metric of filtered) {
      const result = this.computeQualityScore(metric);

      if (result.flags.trick_question) {
        edgeCases.trick_questions.push({
          questionId: metric.questionId,
          usageCount: metric.usageCount,
          positiveRate: (metric.positiveCount / metric.feedbackCount * 100).toFixed(1),
          quality_score: result.quality_score,
        });
      }

      if (result.flags.misaligned_difficulty) {
        edgeCases.misaligned_difficulty.push({
          questionId: metric.questionId,
          difficultyAlignment: result.components.difficulty_alignment,
          quality_score: result.quality_score,
        });
      }

      if (result.flags.low_completion) {
        edgeCases.low_completion.push({
          questionId: metric.questionId,
          completionRate: result.components.completion_rate,
          quality_score: result.quality_score,
        });
      }

      if (result.flags.high_variance) {
        edgeCases.high_variance.push({
          questionId: metric.questionId,
          scoreVariance: metric.scoreVariance,
          quality_score: result.quality_score,
        });
      }
    }

    return edgeCases;
  }

  /**
   * Get top-ranked questions by quality
   *
   * @param {array} metrics - All question metrics
   * @param {string} category - Category filter
   * @param {number} limit - Max results
   * @param {boolean} excludeEdgeCases - Skip trick questions
   * @returns {array} Top questions with quality scores
   */
  getTopRankedQuestions(metrics, category, limit = 10, excludeEdgeCases = true) {
    let filtered = metrics.filter(m => m.category === category);

    // Score each question
    let scored = filtered.map(m => {
      const quality = this.computeQualityScore(m);
      return {
        questionId: m.questionId,
        category: m.category,
        difficulty: m.difficulty,
        quality_score: quality.quality_score,
        recommendation: quality.recommendation,
        flags: quality.flags,
      };
    });

    // Filter out edge cases if requested
    if (excludeEdgeCases) {
      scored = scored.filter(
        q => !q.flags.trick_question && !q.flags.misaligned_difficulty
      );
    }

    // Sort by quality score and return top N
    return scored
      .sort((a, b) => b.quality_score - a.quality_score)
      .slice(0, limit);
  }

  /**
   * Get quality distribution for a category
   *
   * @param {array} metrics
   * @param {string} category
   * @returns {object} Distribution stats
   */
  getQualityDistribution(metrics, category) {
    const filtered = metrics.filter(m => m.category === category);

    if (filtered.length === 0) {
      return {
        total_questions: 0,
        excellent: 0,
        good: 0,
        fair: 0,
        poor: 0,
        unknown: 0,
        average_quality: 0,
      };
    }

    const scores = filtered.map(m => this.computeQualityScore(m));
    const distribution = {
      excellent: 0, // 80-100
      good: 0,      // 60-79
      fair: 0,      // 40-59
      poor: 0,      // <40
      unknown: 0,   // insufficient data
    };

    let totalScore = 0;
    for (const score of scores) {
      totalScore += score.quality_score;

      if (score.flags.insufficient_data) {
        distribution.unknown++;
      } else if (score.quality_score >= 80) {
        distribution.excellent++;
      } else if (score.quality_score >= 60) {
        distribution.good++;
      } else if (score.quality_score >= 40) {
        distribution.fair++;
      } else {
        distribution.poor++;
      }
    }

    return {
      total_questions: filtered.length,
      ...distribution,
      average_quality: Math.round(totalScore / scores.length),
    };
  }

  // ─── Private Helpers ────────────────────────────────────────────

  _computeDifficultyAlignment(metrics, userContext = {}) {
    // If no user context, assume alignment is average
    if (!userContext.avgScore) {
      return 50;
    }

    const userScore = userContext.avgScore;
    const expectedScore = this._getExpectedScoreByDifficulty(metrics.difficulty);

    // Alignment score: how well does question difficulty match user's level?
    // User scores high on easy questions, low on hard questions = aligned
    const alignment = 100 - Math.abs(userScore - expectedScore);

    return Math.max(0, Math.min(100, alignment));
  }

  _getExpectedScoreByDifficulty(difficulty) {
    // By difficulty level, what score should we expect?
    // Easy: users should score ~85%, Medium: ~65%, Hard: ~40%
    const expectations = {
      easy: 85,
      medium: 65,
      hard: 40,
    };

    return expectations[difficulty] || 65;
  }

  _getRecommendation(qualityScore, flags) {
    // If major flags, downgrade recommendation
    if (flags.trick_question || flags.misaligned_difficulty) {
      if (qualityScore >= 60) return 'fair';
      else return 'poor';
    }

    if (flags.insufficient_data) {
      return 'unknown';
    }

    if (qualityScore >= 80) return 'excellent';
    if (qualityScore >= 60) return 'good';
    if (qualityScore >= 40) return 'fair';
    return 'poor';
  }
}

export default QuestionQualityService;
