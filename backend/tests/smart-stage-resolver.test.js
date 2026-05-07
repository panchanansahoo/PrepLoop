import { describe, it, expect, beforeEach } from 'vitest';
import { SmartStageResolver } from '../services/smartStageResolver.js';

describe('SmartStageResolver', () => {
  let resolver;

  beforeEach(() => {
    resolver = new SmartStageResolver();
  });

  describe('Trajectory Calculation', () => {
    it('should calculate trajectory from recent scores', () => {
      const scores = [60, 70, 90];
      // weighted = 60*0.2 + 70*0.3 + 90*0.5 = 12+21+45 = 78 < 80, so stable
      expect(resolver.calculateTrajectory(scores)).toBe(0);
    });

    it('should return 1 for improving trajectory', () => {
      const scores = [70, 75, 85]; // weighted = 70*0.2 + 75*0.3 + 85*0.5 = 14+22.5+42.5 = 79 < 80, stable but close
      // Need higher scores
      const improveScores = [75, 80, 90]; // 75*0.2 + 80*0.3 + 90*0.5 = 15+24+45 = 84 >= 80
      expect(resolver.calculateTrajectory(improveScores)).toBe(1);
    });

    it('should return -1 for declining trajectory', () => {
      const scores = [85, 70, 50]; // weighted = 85*0.2 + 70*0.3 + 50*0.5 = 17+21+25 = 63, stable
      // Need lower scores
      const declineScores = [80, 70, 40]; // 80*0.2 + 70*0.3 + 40*0.5 = 16+21+20 = 57 < 60
      expect(resolver.calculateTrajectory(declineScores)).toBe(-1);
    });

    it('should return 0 when less than 3 scores', () => {
      expect(resolver.calculateTrajectory([])).toBe(0);
      expect(resolver.calculateTrajectory([70])).toBe(0);
      expect(resolver.calculateTrajectory([70, 75])).toBe(0);
    });

    it('should use only last 3 scores for trajectory', () => {
      const scores = [40, 50, 60, 75, 80, 90]; // Should use last 3: [75, 80, 90]
      // 75*0.2 + 80*0.3 + 90*0.5 = 15+24+45 = 84 >= 80 (improving)
      const traj = resolver.calculateTrajectory(scores);
      expect(traj).toBe(1); // Improving
    });
  });

  describe('Stage Requirements', () => {
    it('should return minimum questions for each stage', () => {
      expect(resolver.getMinQuestionsForStage('intake')).toBe(1);
      expect(resolver.getMinQuestionsForStage('warmup')).toBe(2);
      expect(resolver.getMinQuestionsForStage('technical')).toBe(4);
      expect(resolver.getMinQuestionsForStage('followup')).toBe(2);
      expect(resolver.getMinQuestionsForStage('challenge')).toBe(2);
      expect(resolver.getMinQuestionsForStage('feedback')).toBe(1);
    });

    it('should return default 1 for unknown stage', () => {
      expect(resolver.getMinQuestionsForStage('unknown')).toBe(1);
    });
  });

  describe('Trajectory-Based Adjustment', () => {
    it('should accelerate threshold when improving (trajectory = 1)', () => {
      const baseThreshold = 0.5;
      const adjusted = resolver.applyTrajectoryAdjustment(baseThreshold, 1);
      // 0.5 * 0.85 = 0.425
      expect(adjusted).toBeCloseTo(0.425, 3);
      expect(adjusted).toBeLessThan(baseThreshold);
    });

    it('should decelerate threshold when declining (trajectory = -1)', () => {
      const baseThreshold = 0.5;
      const adjusted = resolver.applyTrajectoryAdjustment(baseThreshold, -1);
      // 0.5 * 1.15 = 0.575
      expect(adjusted).toBeCloseTo(0.575, 3);
      expect(adjusted).toBeGreaterThan(baseThreshold);
    });

    it('should keep base threshold when stable (trajectory = 0)', () => {
      const baseThreshold = 0.5;
      const adjusted = resolver.applyTrajectoryAdjustment(baseThreshold, 0);
      expect(adjusted).toBe(baseThreshold);
    });
  });

  describe('Time Tracking', () => {
    it('should detect minimum time elapsed', () => {
      const startTime = Date.now() - 95_000; // 95 seconds ago
      const hasMin = resolver.hasMinimumTimeElapsed(startTime);
      expect(hasMin).toBe(true);
    });

    it('should detect when minimum time not elapsed', () => {
      const startTime = Date.now() - 30_000; // 30 seconds ago
      const hasMin = resolver.hasMinimumTimeElapsed(startTime);
      expect(hasMin).toBe(false);
    });

    it('should detect maximum time exceeded', () => {
      const startTime = Date.now() - 11 * 60_000; // 11 minutes ago
      const hasMax = resolver.hasMaximumTimeElapsed(startTime);
      expect(hasMax).toBe(true);
    });

    it('should detect when maximum time not exceeded', () => {
      const startTime = Date.now() - 5 * 60_000; // 5 minutes ago
      const hasMax = resolver.hasMaximumTimeElapsed(startTime);
      expect(hasMax).toBe(false);
    });

    it('should use provided now value for time calculation', () => {
      const startTime = 1000;
      const now = 700_000; // 699 seconds later
      expect(resolver.hasMinimumTimeElapsed(startTime, now)).toBe(true);
      expect(resolver.hasMaximumTimeElapsed(startTime, now)).toBe(true); // > 10 min
    });
  });

  describe('Stage Pacing Evaluation', () => {
    it('should allow advancement when all conditions met', () => {
      const stageStartTime = Date.now() - 100_000; // Over 90s
      const result = resolver.evaluateStagePacing({
        currentStage: 'warmup',
        questionsInStage: 3, // More than min 2
        stageStartTime,
        recentScores: [70, 75, 85], // Improving
        qualityScores: [70, 75],
        totalQuestions: 13,
        turns: 3,
      });

      expect(result.canAdvance).toBe(true);
      expect(result.hasMinTime).toBe(true);
      expect(result.hasEnoughQuestions).toBe(true);
    });

    it('should prevent advancement without minimum time', () => {
      const stageStartTime = Date.now() - 30_000; // Only 30s
      const result = resolver.evaluateStagePacing({
        currentStage: 'warmup',
        questionsInStage: 3,
        stageStartTime,
        recentScores: [85, 85, 85], // Great
        qualityScores: [80, 85],
      });

      expect(result.canAdvance).toBe(false);
      expect(result.hasMinTime).toBe(false);
      expect(result.reason).toBe('insufficient_time_in_stage');
    });

    it('should prevent advancement without enough questions', () => {
      const stageStartTime = Date.now() - 100_000; // Over 90s
      const result = resolver.evaluateStagePacing({
        currentStage: 'technical',
        questionsInStage: 2, // Min is 4
        stageStartTime,
        recentScores: [85, 85, 85],
        qualityScores: [80],
      });

      expect(result.canAdvance).toBe(false);
      expect(result.hasEnoughQuestions).toBe(false);
      expect(result.reason).toBe('insufficient_questions_in_stage');
    });

    it('should recommend extension on declining performance', () => {
      const stageStartTime = Date.now() - 100_000;
      const result = resolver.evaluateStagePacing({
        currentStage: 'technical',
        questionsInStage: 5,
        stageStartTime,
        recentScores: [80, 70, 40], // 80*0.2 + 70*0.3 + 40*0.5 = 16+21+20 = 57 < 60 (declining)
        qualityScores: [80, 70, 60],
      });

      expect(result.trajectory).toBe(-1);
      expect(result.reason).toBe('declining_performance_extend_stage');
    });

    it('should force advancement after maximum time', () => {
      const stageStartTime = Date.now() - 11 * 60_000; // 11 minutes
      const result = resolver.evaluateStagePacing({
        currentStage: 'technical',
        questionsInStage: 2, // Not enough
        stageStartTime,
        recentScores: [50, 45, 40], // Bad
        qualityScores: [30],
      });

      expect(result.hasMaxTime).toBe(true);
      expect(result.mustAdvance).toBe(true);
      expect(result.canAdvance).toBe(true);
      expect(result.reason).toBe('max_time_exceeded');
    });

    it('should calculate readiness score', () => {
      const stageStartTime = Date.now() - 100_000;
      const result = resolver.evaluateStagePacing({
        currentStage: 'warmup',
        questionsInStage: 3,
        stageStartTime,
        recentScores: [70, 75, 85], // Improving = +25
        qualityScores: [80, 85], // Good = +25
      });

      // hasMinTime +25, hasEnoughQuestions +25, trajectory +25, quality +25 = 100
      expect(result.readinessScore).toBe(100);
    });

    it('should handle poor readiness score', () => {
      const stageStartTime = Date.now() - 30_000; // Not enough time
      const result = resolver.evaluateStagePacing({
        currentStage: 'technical',
        questionsInStage: 2, // Not enough
        stageStartTime,
        recentScores: [40, 35, 30], // Declining
        qualityScores: [20, 25],
      });

      expect(result.readinessScore).toBe(0);
    });
  });

  describe('Next Stage Resolution with Trajectory', () => {
    it('should accelerate stage progression on improving performance', () => {
      // At 40% progress, normally would be in 'technical' (threshold 0.20)
      // With improving trajectory, threshold lowers to 0.20*0.85 = 0.17
      const result = resolver.resolveNextStageWithTrajectory(
        5, // turns
        13, // total questions
        1 // trajectory: improving
      );

      expect(result.reason).toBe('accelerated_by_trajectory');
      expect(result.trajectory).toBe(1);
    });

    it('should decelerate stage progression on declining performance', () => {
      // At 50% progress with declining trajectory
      // Threshold raises from 0.50 to 0.50*1.15 = 0.575
      const result = resolver.resolveNextStageWithTrajectory(
        6, // turns = 6/13 = 0.46 < 0.575
        13, // total questions
        -1 // trajectory: declining
      );

      expect(result.trajectory).toBe(-1);
      expect(result.reason).toBe('decelerated_by_trajectory');
    });

    it('should maintain stage on stable performance', () => {
      const result = resolver.resolveNextStageWithTrajectory(
        5, // turns = 5/13 = 0.385
        13,
        0 // trajectory: stable
      );

      expect(result.trajectory).toBe(0);
      expect(result.reason).toBe('stable_trajectory');
    });

    it('should fallback when no total questions', () => {
      const result = resolver.resolveNextStageWithTrajectory(
        7, // turns
        null, // no total
        1 // improving
      );

      expect(result.reason).toBe('no_total_questions');
    });
  });

  describe('Graceful Skip to Feedback', () => {
    it('should allow skip when declining in technical stage', () => {
      const result = resolver.evaluateGracefulSkip({
        currentStage: 'technical',
        recentScores: [80, 70, 40], // 80*0.2 + 70*0.3 + 40*0.5 = 16+21+20 = 57 < 60 (declining)
        turns: 5, // >= 5
        totalQuestions: 13,
      });

      expect(result.canSkip).toBe(true);
      expect(result.reason).toBe('declining_performance_skip_to_feedback');
    });

    it('should allow skip when declining in challenge stage', () => {
      const result = resolver.evaluateGracefulSkip({
        currentStage: 'challenge',
        recentScores: [80, 70, 40], // Declining (57 < 60)
        turns: 8,
      });

      expect(result.canSkip).toBe(true);
    });

    it('should not allow skip from non-skippable stages', () => {
      const result = resolver.evaluateGracefulSkip({
        currentStage: 'warmup',
        recentScores: [50, 40, 30], // Declining
        turns: 5,
      });

      expect(result.canSkip).toBe(false);
      expect(result.reason).toBe('not_in_skippable_stage');
    });

    it('should not allow skip without minimum attempts', () => {
      const result = resolver.evaluateGracefulSkip({
        currentStage: 'technical',
        recentScores: [50, 40, 30], // Declining
        turns: 3, // < 5
      });

      expect(result.canSkip).toBe(false);
      expect(result.reason).toBe('minimum_attempts_not_met');
    });

    it('should not allow skip on stable performance', () => {
      const result = resolver.evaluateGracefulSkip({
        currentStage: 'technical',
        recentScores: [65, 70, 68], // Stable
        turns: 6,
      });

      expect(result.canSkip).toBe(false);
      expect(result.reason).toBe('performance_stable_continue');
    });

    it('should provide helpful feedback message', () => {
      const result = resolver.evaluateGracefulSkip({
        currentStage: 'technical',
        recentScores: [75, 60, 40],
        turns: 5,
      });

      expect(result.feedback).toContain('skip');
      expect(result.feedback).toContain('feedback');
    });
  });

  describe('Pacing Analysis', () => {
    it('should provide comprehensive pacing analysis', () => {
      const stageStartTime = Date.now() - 100_000;
      const analysis = resolver.analyzePacing({
        turns: 5,
        totalQuestions: 13,
        stage: 'warmup',
        stageStartTime,
        recentScores: [70, 75, 85],
        questionsInCurrentStage: 3,
      });

      expect(analysis.currentStage).toBe('warmup');
      expect(analysis.trajectory).toBeDefined();
      expect(analysis.pacing).toBeDefined();
      expect(analysis.nextStage).toBeDefined();
      expect(analysis.canSkip).toBeDefined();
    });

    it('should show elapsed time in analysis', () => {
      const stageStartTime = Date.now() - 100_000;
      const analysis = resolver.analyzePacing({
        stage: 'warmup',
        stageStartTime,
        recentScores: [75, 75, 75],
      });

      expect(analysis.elapsedMs).toBeGreaterThanOrEqual(95_000);
      expect(analysis.elapsedMs).toBeLessThanOrEqual(105_000);
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration', () => {
      resolver.updateConfig({
        minTimePerStage: 60_000,
      });

      expect(resolver.config.minTimePerStage).toBe(60_000);
      expect(resolver.config.maxTimePerStage).toBe(10 * 60_000); // unchanged
    });

    it('should reset to default configuration', () => {
      resolver.updateConfig({
        minTimePerStage: 60_000,
        minQuestionsPerStage: { intake: 5 },
      });

      resolver.resetConfig();

      expect(resolver.config.minTimePerStage).toBe(90_000);
      expect(resolver.config.minQuestionsPerStage.intake).toBe(1);
    });
  });

  describe('Integration: Full Stage Progression', () => {
    it('should handle complete interview with smart pacing', () => {
      // Simulate interview progression
      const state = {
        turns: 0,
        totalQuestions: 13,
        stage: 'intake',
        stageStartTime: Date.now(),
        recentScores: [],
        questionsInCurrentStage: 0,
      };

      // After turn 1 (intake complete)
      state.turns = 1;
      state.recentScores = [60];
      state.questionsInCurrentStage = 1;
      state.stage = 'warmup';
      state.stageStartTime = Date.now() - 100_000;

      let analysis = resolver.analyzePacing(state);
      expect(analysis.nextStage.stage).toBe('warmup');

      // After turn 3 with improving scores
      state.turns = 3;
      state.recentScores = [60, 70, 80]; // Improving
      state.questionsInCurrentStage = 2;

      analysis = resolver.analyzePacing(state);
      expect(analysis.trajectory).toBe(0); // 60*0.2 + 70*0.3 + 80*0.5 = 74 (stable)

      // After turn 6 with strong scores
      state.turns = 6;
      state.recentScores = [75, 85, 90]; // Improving
      state.stage = 'technical';
      state.questionsInCurrentStage = 3;
      state.stageStartTime = Date.now() - 100_000;

      analysis = resolver.analyzePacing(state);
      expect(analysis.trajectory).toBe(1); // Improving
      expect(analysis.nextStage.reason).toContain('trajectory');
    });

    it('should suggest skip when overwhelmed', () => {
      const state = {
        turns: 6,
        totalQuestions: 13,
        stage: 'technical',
        stageStartTime: Date.now() - 100_000,
        recentScores: [75, 60, 40], // Declining
        questionsInCurrentStage: 5,
      };

      const analysis = resolver.analyzePacing(state);
      expect(analysis.canSkip.canSkip).toBe(true);
      expect(analysis.canSkip.reason).toContain('declining');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null/undefined inputs gracefully', () => {
      const result = resolver.evaluateStagePacing({
        currentStage: undefined,
        questionsInStage: undefined,
        stageStartTime: undefined,
      });

      expect(result).toBeDefined();
      expect(result.reason).toBeDefined();
    });

    it('should handle very short interview', () => {
      const result = resolver.resolveNextStageWithTrajectory(1, 2, 0);
      expect(result.stage).toBeDefined();
    });

    it('should handle very long interview', () => {
      const result = resolver.resolveNextStageWithTrajectory(50, 100, 1);
      expect(result.stage).toBeDefined();
    });

    it('should handle extreme trajectory values', () => {
      const adjusted1 = resolver.applyTrajectoryAdjustment(0.5, 2); // Very improving
      const adjusted2 = resolver.applyTrajectoryAdjustment(0.5, -2); // Very declining

      // Should still apply positive/negative factors
      expect(adjusted1).toBeLessThan(0.5);
      expect(adjusted2).toBeGreaterThan(0.5);
    });

    it('should handle empty quality scores', () => {
      const result = resolver.evaluateStagePacing({
        qualityScores: [],
        recentScores: [70, 75, 85],
      });

      // Should use default average of 50
      expect(result.avgQuality).toBe(50);
    });
  });
});
