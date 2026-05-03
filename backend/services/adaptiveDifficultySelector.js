/**
 * Adaptive Question Difficulty Selector
 * Dynamically scales question difficulty based on user performance during interviews.
 *
 * Strategy:
 * - Start at user's marked difficulty level (easy/medium/hard)
 * - After each response, compute effective_difficulty = base + adjustment
 * - adjustment = f(trajectory) where trajectory = rolling avg of last 3 scores
 * - Trajectory: score >= 80 → +1 difficulty; < 60 → -1; stable → 0
 * - Range: easy/medium/hard with optional sub-levels (easy-low, easy-mid, easy-high)
 */

export class AdaptiveDifficultySelector {
  constructor(config = {}) {
    this.config = {
      windowSize: 3,           // Rolling window for trajectory
      scoreWeights: [0.2, 0.3, 0.5],  // [oldest, mid, newest]
      trajectoryExcellent: 80, // Score >= this triggers +1 difficulty
      trajectoryPoor: 60,      // Score < this triggers -1 difficulty
      trajectoryStable: [65, 75],  // Range for stable trajectory
      enableSubLevels: false,  // Use easy-low, easy-mid, easy-high?
      minDifficulty: 'easy',
      maxDifficulty: 'hard',
      difficultyLevels: ['easy', 'medium', 'hard'],
      ...config,
    };

    this.userDifficultySessions = new Map(); // userId -> { markedDifficulty, currentDifficulty, trajectory, scores }
  }

  /**
   * Initialize interview difficulty for user
   *
   * @param {string} userId
   * @param {string} markedDifficulty - User's self-selected difficulty
   * @returns {string} Starting difficulty level
   */
  initializeDifficulty(userId, markedDifficulty = 'medium') {
    const normalizedDifficulty = this._normalizeDifficulty(markedDifficulty);

    this.userDifficultySessions.set(userId, {
      userId,
      markedDifficulty: normalizedDifficulty,
      currentDifficulty: normalizedDifficulty,
      difficultyHistory: [normalizedDifficulty],
      scores: [],
      trajectory: 0, // -1 (declining), 0 (stable), +1 (improving)
      adjustmentCount: 0,
      lastAdjustedAt: null,
    });

    return normalizedDifficulty;
  }

  /**
   * Get current difficulty for user
   *
   * @param {string} userId
   * @returns {string} Current difficulty level
   */
  getCurrentDifficulty(userId) {
    const session = this.userDifficultySessions.get(userId);
    if (!session) return 'medium';
    return session.currentDifficulty;
  }

  /**
   * Record a user response score and update effective difficulty
   *
   * @param {string} userId
   * @param {number} score - User's score (0-100)
   * @returns {object} {
   *   currentDifficulty,
   *   trajectory,
   *   adjustmentReason,
   *   effectiveScore,
   *   scoreHistory
   * }
   */
  recordScoreAndUpdateDifficulty(userId, score) {
    let session = this.userDifficultySessions.get(userId);
    if (!session) {
      session = {
        userId,
        markedDifficulty: 'medium',
        currentDifficulty: 'medium',
        difficultyHistory: ['medium'],
        scores: [],
        trajectory: 0,
        adjustmentCount: 0,
        lastAdjustedAt: null,
      };
      this.userDifficultySessions.set(userId, session);
    }

    // Validate and clamp score
    const validScore = Math.max(0, Math.min(100, score));
    session.scores.push(validScore);

    // Calculate trajectory from last N scores
    const trajectory = this._calculateTrajectory(
      session.scores.slice(-this.config.windowSize)
    );
    session.trajectory = trajectory;

    // Determine difficulty adjustment
    let adjustmentReason = 'stable';
    let newDifficulty = session.currentDifficulty;

    if (trajectory > 0) {
      // User improving, try harder questions
      adjustmentReason = 'improving_trajectory';
      newDifficulty = this._incrementDifficulty(session.currentDifficulty);
    } else if (trajectory < 0) {
      // User declining, ease difficulty
      adjustmentReason = 'declining_trajectory';
      newDifficulty = this._decrementDifficulty(session.currentDifficulty);
    }

    // Record difficulty change
    if (newDifficulty !== session.currentDifficulty) {
      session.currentDifficulty = newDifficulty;
      session.difficultyHistory.push(newDifficulty);
      session.adjustmentCount++;
      session.lastAdjustedAt = new Date().toISOString();
    }

    return {
      userId,
      previousDifficulty: session.difficultyHistory[session.difficultyHistory.length - 2] || session.markedDifficulty,
      currentDifficulty: session.currentDifficulty,
      trajectory,
      adjustmentReason,
      adjustmentMade: newDifficulty !== session.currentDifficulty,
      lastScore: validScore,
      scoreHistory: [...session.scores].slice(-5), // Last 5 scores
      averageScore: this._calculateAverage(session.scores),
      adjustmentCount: session.adjustmentCount,
    };
  }

  /**
   * Get difficulty statistics for user
   *
   * @param {string} userId
   * @returns {object} Stats about user's difficulty progression
   */
  getDifficultyStats(userId) {
    const session = this.userDifficultySessions.get(userId);
    if (!session) {
      return {
        initialized: false,
        markedDifficulty: null,
        currentDifficulty: null,
      };
    }

    const scores = session.scores;
    const maxDifficulty = this._getHighestDifficultyReached(session.difficultyHistory);
    const difficultyRange = this._calculateDifficultyRange(session.difficultyHistory);

    return {
      initialized: true,
      markedDifficulty: session.markedDifficulty,
      currentDifficulty: session.currentDifficulty,
      difficultyHistory: session.difficultyHistory,
      maxDifficultyReached: maxDifficulty,
      difficultyRange,
      scoreCount: scores.length,
      averageScore: this._calculateAverage(scores),
      minScore: Math.min(...scores),
      maxScore: Math.max(...scores),
      scoreVariance: this._calculateVariance(scores),
      trajectory: session.trajectory,
      adjustmentCount: session.adjustmentCount,
      lastAdjustedAt: session.lastAdjustedAt,
    };
  }

  /**
   * Get recommended next difficulty based on performance
   *
   * @param {string} userId
   * @param {number} numQuestions - Total questions in interview
   * @returns {object} {
   *   suggestedDifficulty,
   *   reason,
   *   confidence,
   *   adjustmentStrategy
   * }
   */
  getRecommendedDifficulty(userId, numQuestions = 13) {
    const stats = this.getDifficultyStats(userId);

    if (!stats.initialized) {
      return {
        suggestedDifficulty: 'medium',
        reason: 'No performance data available',
        confidence: 0.5,
        adjustmentStrategy: 'start_with_marked_difficulty',
      };
    }

    const { averageScore, trajectory, maxDifficultyReached } = stats;

    // Decision logic
    let suggested = stats.currentDifficulty;
    let reason = 'Current trajectory is stable';
    let confidence = 0.7;

    if (averageScore >= 85) {
      suggested = this._incrementDifficulty(stats.currentDifficulty);
      reason = 'Average score >85%, ready for harder questions';
      confidence = 0.9;
    } else if (averageScore < 50) {
      suggested = this._decrementDifficulty(stats.currentDifficulty);
      reason = 'Average score <50%, ease difficulty';
      confidence = 0.85;
    } else if (trajectory > 0 && averageScore >= 70) {
      suggested = this._incrementDifficulty(stats.currentDifficulty);
      reason = 'Strong improving trajectory, increase difficulty';
      confidence = 0.8;
    } else if (trajectory < 0 && averageScore < 65) {
      suggested = this._decrementDifficulty(stats.currentDifficulty);
      reason = 'Declining trajectory, reduce difficulty';
      confidence = 0.75;
    }

    // Validate against question count
    const progressRatio = stats.scoreCount / numQuestions;
    if (progressRatio > 0.75 && !maxDifficultyReached.includes(suggested)) {
      // Near end of interview, don't change dramatically
      confidence -= 0.2;
    }

    return {
      suggestedDifficulty: suggested,
      reason,
      confidence,
      adjustmentStrategy: suggested !== stats.currentDifficulty ? 'adjust' : 'maintain',
      scoreMetrics: {
        average: Math.round(averageScore),
        min: stats.minScore,
        max: stats.maxScore,
        responseCount: stats.scoreCount,
      },
    };
  }

  /**
   * Reset user's difficulty session (e.g., for new interview)
   */
  resetUserDifficulty(userId) {
    this.userDifficultySessions.delete(userId);
  }

  /**
   * Reset all sessions
   */
  resetAll() {
    this.userDifficultySessions.clear();
  }

  // ─── Private Helpers ────────────────────────────────────────────

  _normalizeDifficulty(difficulty) {
    const normalized = difficulty?.toLowerCase() || 'medium';
    if (!this.config.difficultyLevels.includes(normalized)) {
      return 'medium';
    }
    return normalized;
  }

  _calculateTrajectory(recentScores) {
    if (recentScores.length === 0) return 0;
    if (recentScores.length === 1) return 0;

    // Weighted average where newer scores count more
    const weights = this.config.scoreWeights.slice(-recentScores.length);
    let weightSum = 0;
    let scoreSum = 0;

    for (let i = 0; i < recentScores.length; i++) {
      scoreSum += recentScores[i] * weights[i];
      weightSum += weights[i];
    }

    const effectiveScore = scoreSum / weightSum;

    // Determine trajectory
    if (effectiveScore >= this.config.trajectoryExcellent) {
      return 1; // Improving
    } else if (effectiveScore < this.config.trajectoryPoor) {
      return -1; // Declining
    }
    return 0; // Stable
  }

  _calculateAverage(scores) {
    if (scores.length === 0) return 0;
    const sum = scores.reduce((a, b) => a + b, 0);
    return sum / scores.length;
  }

  _calculateVariance(scores) {
    if (scores.length < 2) return 0;
    const avg = this._calculateAverage(scores);
    const squaredDiffs = scores.map(s => Math.pow(s - avg, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / scores.length;
    return Math.sqrt(variance); // Return standard deviation
  }

  _incrementDifficulty(current) {
    const index = this.config.difficultyLevels.indexOf(current);
    if (index < this.config.difficultyLevels.length - 1) {
      return this.config.difficultyLevels[index + 1];
    }
    return current; // Already at max
  }

  _decrementDifficulty(current) {
    const index = this.config.difficultyLevels.indexOf(current);
    if (index > 0) {
      return this.config.difficultyLevels[index - 1];
    }
    return current; // Already at min
  }

  _getHighestDifficultyReached(history) {
    if (!history || history.length === 0) return ['medium'];
    const levels = ['easy', 'medium', 'hard'];
    const maxIndex = Math.max(...history.map(d => levels.indexOf(d)));
    return [levels[maxIndex]];
  }

  _calculateDifficultyRange(history) {
    if (!history || history.length === 0) return { min: 'medium', max: 'medium' };
    const levels = ['easy', 'medium', 'hard'];
    const indices = history.map(d => levels.indexOf(d));
    const minIndex = Math.min(...indices);
    const maxIndex = Math.max(...indices);
    return {
      min: levels[minIndex],
      max: levels[maxIndex],
    };
  }
}

export default AdaptiveDifficultySelector;
