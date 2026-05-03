/**
 * Smart Stage Resolution Service
 *
 * Enhances interview pacing with performance-aware stage transitions.
 * Instead of fixed time thresholds, dynamically accelerates/decelerates based on:
 * - Performance trajectory (improving vs declining)
 * - Time spent in current stage (minimum 90s, maximum 10min)
 * - Question quality checks (minimum questions per stage)
 * - User confidence (can request to skip to feedback if overwhelmed)
 *
 * Key Insight: Use trajectory from AdaptiveDifficultySelector to inform stage pacing.
 * If user is improving, accelerate to challenge. If struggling, give more warmup.
 */

export class SmartStageResolver {
  constructor() {
    // Configuration for smart thresholds (can be tuned)
    this.config = {
      // Minimum questions before advancing to next stage
      minQuestionsPerStage: {
        intake: 1,
        warmup: 2,
        technical: 4,
        followup: 2,
        challenge: 2,
        feedback: 1,
      },

      // Time constraints (milliseconds)
      minTimePerStage: 90_000, // 90 seconds minimum per stage
      maxTimePerStage: 10 * 60_000, // 10 minutes maximum per stage

      // Trajectory multipliers (adjust thresholds based on performance)
      trajectoryAccelerationFactor: 0.85, // Improving? Use 85% of threshold to accelerate
      trajectoryDecelerationFactor: 1.15, // Declining? Use 115% of threshold to slow down
    };
  }

  /**
   * Calculate score trajectory from recent scores
   * Uses same algorithm as AdaptiveDifficultySelector
   * @param {Array} recentScores - last 3+ scores
   * @returns {number} trajectory: 1 (improving), 0 (stable), -1 (declining)
   */
  calculateTrajectory(recentScores = []) {
    if (!Array.isArray(recentScores) || recentScores.length < 3) {
      return 0; // Need at least 3 scores to determine trajectory
    }

    const last3 = recentScores.slice(-3);
    const weighted = last3[0] * 0.2 + last3[1] * 0.3 + last3[2] * 0.5;

    if (weighted >= 80) return 1; // Improving
    if (weighted < 60) return -1; // Declining
    return 0; // Stable
  }

  /**
   * Get stage-specific minimum question requirement
   * @param {string} stage
   * @returns {number} minimum questions before advancing
   */
  getMinQuestionsForStage(stage) {
    return this.config.minQuestionsPerStage[stage] || 1;
  }

  /**
   * Apply trajectory-based multiplier to thresholds
   * @param {number} baseThreshold - default threshold (e.g., 0.50 for 50% progress)
   * @param {number} trajectory - 1 (improving), 0 (stable), -1 (declining)
   * @returns {number} adjusted threshold
   */
  applyTrajectoryAdjustment(baseThreshold, trajectory) {
    if (trajectory > 0) {
      // Improving: lower threshold to accelerate (e.g., 0.50 → 0.425)
      return baseThreshold * this.config.trajectoryAccelerationFactor;
    }
    if (trajectory < 0) {
      // Declining: raise threshold to decelerate (e.g., 0.50 → 0.575)
      return baseThreshold * this.config.trajectoryDecelerationFactor;
    }
    // Stable: use base threshold
    return baseThreshold;
  }

  /**
   * Check if user has spent minimum required time in current stage
   * @param {number} stageStartTime - when stage started (Date.now())
   * @param {number} now - current time (Date.now())
   * @returns {boolean} true if minimum time has elapsed
   */
  hasMinimumTimeElapsed(stageStartTime, now = Date.now()) {
    const elapsed = now - stageStartTime;
    return elapsed >= this.config.minTimePerStage;
  }

  /**
   * Check if user has exceeded maximum time in current stage
   * @param {number} stageStartTime
   * @param {number} now
   * @returns {boolean} true if maximum time exceeded (should advance regardless)
   */
  hasMaximumTimeElapsed(stageStartTime, now = Date.now()) {
    const elapsed = now - stageStartTime;
    return elapsed >= this.config.maxTimePerStage;
  }

  /**
   * Determine if ready to advance to next stage
   * Considers: time, question count, performance trajectory, quality
   *
   * @param {Object} options
   *   - currentStage: string ('intake', 'warmup', etc.)
   *   - questionsInStage: number of questions asked in current stage
   *   - stageStartTime: timestamp when stage began
   *   - recentScores: array of recent scores for trajectory
   *   - qualityScores: array of quality scores for questions in stage
   *   - totalQuestions: total questions in interview
   *   - turns: current turn count
   * @returns {Object} { canAdvance, reason, recommendedStage }
   */
  evaluateStagePacing(options = {}) {
    const {
      currentStage = 'intake',
      questionsInStage = 0,
      stageStartTime = Date.now() - this.config.minTimePerStage,
      recentScores = [],
      qualityScores = [],
      totalQuestions = null,
      turns = 0,
    } = options;

    // Calculate trajectory
    const trajectory = this.calculateTrajectory(recentScores);

    // Check time constraints
    const now = Date.now();
    const hasMinTime = this.hasMinimumTimeElapsed(stageStartTime, now);
    const hasMaxTime = this.hasMaximumTimeElapsed(stageStartTime, now);

    // Check question requirements
    const minQuestionsRequired = this.getMinQuestionsForStage(currentStage);
    const hasEnoughQuestions = questionsInStage >= minQuestionsRequired;

    // Calculate average quality of questions in this stage
    const avgQuality = qualityScores.length > 0
      ? qualityScores.reduce((sum, q) => sum + (q || 0), 0) / qualityScores.length
      : 50;

    // Readiness score (0-100)
    let readinessScore = 0;
    if (hasMinTime) readinessScore += 25;
    if (hasEnoughQuestions) readinessScore += 25;
    if (trajectory >= 0) readinessScore += 25; // Stable or improving
    if (avgQuality >= 60) readinessScore += 25; // Good quality questions

    // Determine if can advance
    const canAdvance = hasMinTime && hasEnoughQuestions && (trajectory >= 0 || hasMaxTime);
    const mustAdvance = hasMaxTime; // Always advance after 10 minutes
    const shouldAdvance = canAdvance || mustAdvance;

    // Recommendation reason
    let reason = 'stage_pacing_not_ready';
    if (mustAdvance) {
      reason = 'max_time_exceeded';
    } else if (!hasMinTime) {
      reason = 'insufficient_time_in_stage';
    } else if (!hasEnoughQuestions) {
      reason = 'insufficient_questions_in_stage';
    } else if (trajectory < 0) {
      reason = 'declining_performance_extend_stage';
    } else if (shouldAdvance) {
      if (trajectory > 0) {
        reason = 'improving_performance_accelerate';
      } else {
        reason = 'ready_to_advance';
      }
    }

    return {
      canAdvance: shouldAdvance,
      mustAdvance,
      readinessScore: Math.round(readinessScore),
      trajectory,
      hasMinTime,
      hasMaxTime,
      hasEnoughQuestions,
      minQuestionsRequired,
      questionsInStage,
      avgQuality: Math.round(avgQuality),
      reason,
    };
  }

  /**
   * Resolve next stage with smart trajectory adjustments
   * Modifies proportional thresholds based on performance
   *
   * @param {number} turns - current turn count
   * @param {number} totalQuestions - total questions planned
   * @param {number} trajectory - 1, 0, or -1
   * @returns {Object} { stage, adjustedThreshold, reason }
   */
  resolveNextStageWithTrajectory(turns = 0, totalQuestions = null, trajectory = 0) {
    const total = Number.isFinite(Number(totalQuestions)) && totalQuestions > 0
      ? Number(totalQuestions)
      : null;

    if (!total) {
      // Fallback to legacy when no total
      return { stage: this.resolveNextStageLegacy(turns), reason: 'no_total_questions' };
    }

    const ratio = turns / total;

    // Proportional thresholds (from InterviewStateMachine)
    const baseThresholds = [
      [0.90, 'feedback'],
      [0.75, 'challenge'],
      [0.50, 'followup'],
      [0.20, 'technical'],
      [0.01, 'warmup'],
      [0.00, 'intake'],
    ];

    // Apply trajectory adjustment to each threshold
    const adjustedThresholds = baseThresholds.map(([threshold, stage]) => {
      const adjusted = this.applyTrajectoryAdjustment(threshold, trajectory);
      return [adjusted, stage];
    });

    // Find matching stage
    for (const [adjustedThreshold, stage] of adjustedThresholds) {
      if (ratio >= adjustedThreshold) {
        return {
          stage,
          baseRatio: ratio,
          trajectory,
          reason: trajectory > 0 ? 'accelerated_by_trajectory' : trajectory < 0 ? 'decelerated_by_trajectory' : 'stable_trajectory',
        };
      }
    }

    return { stage: 'intake', reason: 'fallback_intake' };
  }

  /**
   * Legacy stage resolution (without trajectory)
   * @param {number} turns
   * @returns {string} stage key
   */
  resolveNextStageLegacy(turns = 0) {
    if (turns >= 12) return 'feedback';
    if (turns >= 10) return 'challenge';
    if (turns >= 7) return 'followup';
    if (turns >= 3) return 'technical';
    if (turns >= 1) return 'warmup';
    return 'intake';
  }

  /**
   * Allow graceful skip to feedback (user overwhelmed)
   * Returns true if appropriate to skip
   *
   * @param {Object} options
   *   - currentStage: string
   *   - recentScores: array of scores
   *   - turns: turn count
   *   - totalQuestions: planned total
   * @returns {Object} { canSkip, reason, feedback }
   */
  evaluateGracefulSkip(options = {}) {
    const {
      currentStage = 'technical',
      recentScores = [],
      turns = 0,
      totalQuestions = null,
    } = options;

    // Can skip to feedback if:
    // 1. User is in technical/challenge (not warmup)
    // 2. User has poor performance trend (trajectory -1)
    // 3. User has attempted minimum questions (turns >= 5)
    // 4. Not already in feedback

    const skipableStages = ['technical', 'followup', 'challenge'];
    const isSkippableStage = skipableStages.includes(currentStage);

    if (!isSkippableStage) {
      return { canSkip: false, reason: 'not_in_skippable_stage' };
    }

    const trajectory = this.calculateTrajectory(recentScores);
    const hasMinimuMattempts = turns >= 5;

    if (trajectory < 0 && hasMinimuMattempts) {
      return {
        canSkip: true,
        reason: 'declining_performance_skip_to_feedback',
        feedback: 'You\'re finding this challenging. Would you like to skip to feedback and review your performance?',
      };
    }

    if (!hasMinimuMattempts) {
      return { canSkip: false, reason: 'minimum_attempts_not_met' };
    }

    return { canSkip: false, reason: 'performance_stable_continue' };
  }

  /**
   * Get stage pacing analysis for diagnostics
   * @param {Object} state - interview state object
   * @returns {Object} detailed pacing analysis
   */
  analyzePacing(state = {}) {
    const {
      turns = 0,
      totalQuestions = null,
      stage = 'intake',
      stageStartTime = Date.now(),
      recentScores = [],
      questionsInCurrentStage = 0,
    } = state;

    const trajectory = this.calculateTrajectory(recentScores);
    const elapsed = Date.now() - stageStartTime;
    const pacing = this.evaluateStagePacing({
      currentStage: stage,
      questionsInStage: questionsInCurrentStage,
      stageStartTime,
      recentScores,
      totalQuestions,
      turns,
    });

    const nextStage = this.resolveNextStageWithTrajectory(turns, totalQuestions, trajectory);

    return {
      currentStage: stage,
      turns,
      totalQuestions,
      trajectory,
      elapsedMs: elapsed,
      pacing,
      nextStage,
      canSkip: this.evaluateGracefulSkip({
        currentStage: stage,
        recentScores,
        turns,
        totalQuestions,
      }),
    };
  }

  /**
   * Update configuration (for testing or tuning)
   * @param {Object} newConfig - partial config updates
   */
  updateConfig(newConfig = {}) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Reset to default configuration
   */
  resetConfig() {
    this.config = {
      minQuestionsPerStage: {
        intake: 1,
        warmup: 2,
        technical: 4,
        followup: 2,
        challenge: 2,
        feedback: 1,
      },
      minTimePerStage: 90_000,
      maxTimePerStage: 10 * 60_000,
      trajectoryAccelerationFactor: 0.85,
      trajectoryDecelerationFactor: 1.15,
    };
  }
}

// Export singleton for use across services
export const smartStageResolver = new SmartStageResolver();
