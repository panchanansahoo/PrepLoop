/**
 * Question Recommender — Smart question selection balancing quality and novelty
 * 
 * Uses question metrics (usage, quality, feedback) to recommend questions that:
 * - Achieve high quality-novelty balance
 * - Introduce variety while maintaining difficulty progression
 * - Optimize learning outcomes
 */

import questionMetrics from './questionMetrics.js';

const RECOMMENDATION_WEIGHTS = {
  quality:    0.40,  // Prefer high-quality questions
  novelty:    0.30,  // Balance with fresh questions
  difficulty: 0.20,  // Respect difficulty progression
  timing:     0.10,  // Prefer not-recently-seen questions
};

class QuestionRecommender {
  /**
   * Get recommended questions for next interview
   * 
   * Strategy:
   * 1. Filter questions in category
   * 2. Apply quality threshold (min 60% to avoid bad questions)
   * 3. Score by: quality + novelty + difficulty fit + recency
   * 4. Return top N recommendations
   */
  async getRecommendations(
    category,
    difficulty = 'medium',
    currentScore = 70,
    recentlyUsedIds = [],
    limit = 5
  ) {
    await questionMetrics.initialize();
    
    // Get all questions in category
    const allMetrics = await questionMetrics.getMetricsByCategory(category);
    
    if (allMetrics.length === 0) {
      return {
        recommendations: [],
        reasoning: 'No questions available in category yet',
      };
    }

    // Filter: min quality threshold
    const minQuality = 40; // Include questions without rating (0)
    const filtered = allMetrics.filter(m => m.qualityRating >= minQuality || m.feedbackCount === 0);

    if (filtered.length === 0) {
      return {
        recommendations: [],
        reasoning: 'All questions below quality threshold',
      };
    }

    // Score each question
    const scored = filtered.map(metric => {
      const qualityScore = metric.feedbackCount > 0
        ? Math.min(metric.qualityRating / 100, 1) * 100
        : 50; // Default to 50 for unrated questions

      // Novelty: inverse of usage (less used = more novel)
      const avgUsage = filtered.reduce((sum, m) => sum + m.usageCount, 0) / filtered.length;
      const noveltyScore = Math.min(100 - (metric.usageCount / (avgUsage + 1)) * 50, 100);

      // Difficulty alignment: match current score
      // If scoring well → recommend harder questions
      // If scoring poorly → recommend easier questions
      const difficultyScore = this._getDifficultyScore(metric.difficulty, currentScore, difficulty);

      // Timing: prefer questions not seen recently
      const daysSinceLast = metric.lastUsed
        ? (Date.now() - new Date(metric.lastUsed).getTime()) / (24 * 60 * 60 * 1000)
        : 999; // Unasked questions get high recency score

      const timingScore = Math.min(daysSinceLast * 10, 100);

      // Exclude recently used
      const recentlyUsedPenalty = recentlyUsedIds.includes(metric.questionId) ? -50 : 0;

      // Weighted score
      const totalScore = 
        (qualityScore * RECOMMENDATION_WEIGHTS.quality) +
        (noveltyScore * RECOMMENDATION_WEIGHTS.novelty) +
        (difficultyScore * RECOMMENDATION_WEIGHTS.difficulty) +
        (timingScore * RECOMMENDATION_WEIGHTS.timing) +
        recentlyUsedPenalty;

      return {
        questionId: metric.questionId,
        category: metric.category,
        difficulty: metric.difficulty,
        score: totalScore,
        breakdown: {
          quality: qualityScore,
          novelty: noveltyScore,
          difficulty: difficultyScore,
          timing: timingScore,
        },
        metrics: {
          usageCount: metric.usageCount,
          qualityRating: Math.round(metric.qualityRating),
          positiveRate: metric.feedbackCount > 0
            ? Math.round((metric.positiveCount / metric.feedbackCount) * 100)
            : null,
          averageTime: Math.round(metric.averageTime),
        },
      };
    });

    // Sort by score and return top N
    const recommendations = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return {
      recommendations,
      reasoning: this._generateReasoning(recommendations, category, difficulty),
      summary: {
        totalAvailable: filtered.length,
        avgQuality: Math.round(filtered.reduce((s, m) => s + m.qualityRating, 0) / filtered.length),
        avgUsage: Math.round(filtered.reduce((s, m) => s + m.usageCount, 0) / filtered.length),
      },
    };
  }

  /**
   * Get diverse question mix (ensures variety across subcategories)
   * Useful for comprehensive interviews
   */
  async getDiverseSet(category, limit = 5, minQuality = 60) {
    await questionMetrics.initialize();
    
    const allMetrics = await questionMetrics.getMetricsByCategory(category);
    const filtered = allMetrics.filter(m => m.qualityRating >= minQuality);

    if (filtered.length === 0) return { questions: [], coverage: 0 };

    // Group by difficulty
    const byDifficulty = {
      easy: filtered.filter(m => m.difficulty === 'easy'),
      medium: filtered.filter(m => m.difficulty === 'medium'),
      hard: filtered.filter(m => m.difficulty === 'hard'),
    };

    // Interleave: 1 easy, 2 medium, 2 hard (or proportional)
    const selected = [];
    const ratio = [1, 2, 2]; // easy : medium : hard
    const maxPerDifficulty = Math.ceil(limit / (ratio[0] + ratio[1] + ratio[2]));

    for (const difficulty of ['easy', 'medium', 'hard']) {
      const questions = byDifficulty[difficulty]
        .sort((a, b) => b.qualityRating - a.qualityRating)
        .slice(0, maxPerDifficulty);
      selected.push(...questions);
    }

    // Random shuffle to avoid predictable order
    const shuffled = selected.sort(() => Math.random() - 0.5).slice(0, limit);

    const coverage = shuffled.length / filtered.length;

    return {
      questions: shuffled.map(m => ({
        questionId: m.questionId,
        difficulty: m.difficulty,
        quality: Math.round(m.qualityRating),
      })),
      coverage: Math.round(coverage * 100),
    };
  }

  /**
   * Get underutilized high-quality questions for next round
   * These are goldmines: high quality but not overused
   */
  async getGemQuestions(category, limit = 3) {
    return questionMetrics.getUnderutilizedQuestions(category, 70);
  }

  /**
   * Difficulty alignment score
   * If user is scoring well, gradually increase difficulty
   */
  _getDifficultyScore(questionDifficulty, currentScore, recommendedDifficulty) {
    const scoreMap = {
      easy: currentScore < 50 ? 100 : (currentScore < 70 ? 70 : 30),
      medium: 100, // Always safe default
      hard: currentScore > 70 ? 100 : (currentScore > 50 ? 60 : 20),
    };

    return scoreMap[questionDifficulty] || 50;
  }

  /**
   * Generate human-readable reasoning for recommendations
   */
  _generateReasoning(recommendations, category, difficulty) {
    if (recommendations.length === 0) return 'No suitable questions available';

    const top = recommendations[0];
    const reasons = [];

    if (top.breakdown.quality > 80) {
      reasons.push('High quality (consistently positive feedback)');
    } else if (top.breakdown.quality < 50) {
      reasons.push('New question (unrated, will help improve rating data)');
    }

    if (top.breakdown.novelty > 70) {
      reasons.push('Fresh question for variety');
    } else if (top.breakdown.novelty < 30) {
      reasons.push('Popular proven question');
    }

    if (top.breakdown.timing > 50) {
      reasons.push('Not seen recently');
    }

    return reasons.join('; ') || 'Balanced quality-novelty match';
  }
}

const recommender = new QuestionRecommender();

export default {
  getRecommendations: (cat, diff, score, recent, limit) =>
    recommender.getRecommendations(cat, diff, score, recent, limit),
  getDiverseSet: (cat, limit, minQual) =>
    recommender.getDiverseSet(cat, limit, minQual),
  getGemQuestions: (cat, limit) =>
    recommender.getGemQuestions(cat, limit),
};
