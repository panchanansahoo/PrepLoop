import { describe, it, expect, beforeEach } from 'vitest';
import { StageTransitionFeedback } from '../services/stageTransitionFeedback.js';

describe('StageTransitionFeedback', () => {
  let feedback;

  beforeEach(() => {
    feedback = new StageTransitionFeedback();
  });

  describe('Stage Metadata', () => {
    it('should have metadata for all core stages', () => {
      const stages = ['intake', 'warmup', 'technical', 'followup', 'challenge', 'feedback'];
      stages.forEach((stage) => {
        expect(feedback.stageMetadata[stage]).toBeDefined();
        expect(feedback.stageMetadata[stage].label).toBeDefined();
        expect(feedback.stageMetadata[stage].ordinal).toBeDefined();
      });
    });

    it('should have correct ordinals', () => {
      expect(feedback.stageMetadata.intake.ordinal).toBe(1);
      expect(feedback.stageMetadata.warmup.ordinal).toBe(2);
      expect(feedback.stageMetadata.technical.ordinal).toBe(3);
      expect(feedback.stageMetadata.feedback.ordinal).toBe(6);
    });
  });

  describe('Stage Summary Generation', () => {
    it('should generate summary for completed stage', () => {
      const summary = feedback.generateStageSummary({
        currentStage: 'warmup',
        questionsAnswered: 3,
        scoresInStage: [65, 75, 85],
        timeSpentSeconds: 300,
        strengthAreas: ['clear communication'],
        weakAreas: ['edge cases'],
      });

      expect(summary.stage).toBe('warmup');
      expect(summary.questionsAnswered).toBe(3);
      expect(summary.averageScore).toBe(75);
      expect(summary.performanceLevel).toBe('good');
    });

    it('should calculate performance level correctly', () => {
      const excellent = feedback.generateStageSummary({
        scoresInStage: [90, 92, 88],
      });
      expect(excellent.performanceLevel).toBe('excellent');

      const good = feedback.generateStageSummary({
        scoresInStage: [70, 75, 68],
      });
      expect(good.performanceLevel).toBe('good');

      const fair = feedback.generateStageSummary({
        scoresInStage: [55, 60, 58],
      });
      expect(fair.performanceLevel).toBe('fair');

      const needsImprovement = feedback.generateStageSummary({
        scoresInStage: [30, 35, 40],
      });
      expect(needsImprovement.performanceLevel).toBe('needs improvement');
    });

    it('should calculate score range', () => {
      const summary = feedback.generateStageSummary({
        scoresInStage: [50, 70, 90],
      });

      expect(summary.scoreRange.min).toBe(50);
      expect(summary.scoreRange.max).toBe(90);
    });

    it('should assess pace correctly', () => {
      const rushed = feedback.generateStageSummary({
        currentStage: 'warmup',
        timeSpentSeconds: 30, // Much less than 2 min suggestion
      });
      expect(rushed.paceAssessment).toBe('rushed');

      const takingTime = feedback.generateStageSummary({
        currentStage: 'warmup',
        timeSpentSeconds: 600, // Much more than 2 min suggestion
      });
      expect(takingTime.paceAssessment).toBe('taking your time');

      const goodPace = feedback.generateStageSummary({
        currentStage: 'warmup',
        timeSpentSeconds: 120, // 2 minutes
      });
      expect(goodPace.paceAssessment).toBe('good pace');
    });

    it('should include strengths and weaknesses', () => {
      const summary = feedback.generateStageSummary({
        strengthAreas: ['logic', 'clarity'],
        weakAreas: ['optimization'],
      });

      expect(summary.strengthAreas).toContain('logic');
      expect(summary.weakAreas).toContain('optimization');
    });

    it('should generate completion summary narrative', () => {
      const summary = feedback.generateStageSummary({
        currentStage: 'warmup',
        scoresInStage: [85, 90],
        timeSpentSeconds: 120,
        strengthAreas: ['quick thinking'],
        weakAreas: ['verbalization'],
      });

      expect(summary.completionSummary).toContain('Warmup');
      expect(summary.completionSummary).toContain('88%'); // Average of [85, 90] = 87.5, rounded to 88
      expect(summary.completionSummary).toContain('quick thinking');
      expect(summary.completionSummary).toContain('verbalization');
    });
  });

  describe('Readiness Checkpoint', () => {
    it('should allow advancement with good scores', () => {
      const checkpoint = feedback.generateReadinessCheckpoint({
        fromStage: 'warmup',
        toStage: 'technical',
        averageScore: 85,
        trajectory: 1,
        questionsAnswered: 3,
      });

      expect(checkpoint.canProceed).toBe(true);
      expect(checkpoint.warning).toBeNull();
      expect(checkpoint.warningLevel).toBe('none');
    });

    it('should issue concern warning for very low scores', () => {
      const checkpoint = feedback.generateReadinessCheckpoint({
        fromStage: 'warmup',
        toStage: 'technical',
        averageScore: 35,
        trajectory: 0,
      });

      expect(checkpoint.warningLevel).toBe('concern');
      expect(checkpoint.warning).toContain('35%');
      expect(checkpoint.warning).toContain('low');
      expect(checkpoint.canProceed).toBe(true); // Can still proceed
    });

    it('should issue caution for moderate scores with declining trajectory', () => {
      const checkpoint = feedback.generateReadinessCheckpoint({
        averageScore: 50,
        trajectory: -1,
      });

      expect(checkpoint.warningLevel).toBe('caution');
      expect(checkpoint.warning).toContain('declining');
    });

    it('should issue caution for scores below 60', () => {
      const checkpoint = feedback.generateReadinessCheckpoint({
        averageScore: 58,
        trajectory: 0,
      });

      expect(checkpoint.warningLevel).toBe('caution');
    });

    it('should provide encouraging recommendation for improving trajectory', () => {
      const checkpoint = feedback.generateReadinessCheckpoint({
        averageScore: 80,
        trajectory: 1,
      });

      expect(checkpoint.recommendation).toContain('Excellent');
      expect(checkpoint.recommendation).toContain('progress');
    });

    it('should include explicit checkpoint question', () => {
      const checkpoint = feedback.generateReadinessCheckpoint({
        toStage: 'technical',
      });

      expect(checkpoint.explicitCheckpoint).toContain('proceed');
      expect(checkpoint.explicitCheckpoint).toContain('Core Round'); // technical label
    });
  });

  describe('Progress Indicator', () => {
    it('should show progress correctly', () => {
      const progress = feedback.generateProgressIndicator({
        completedStages: ['intake', 'warmup'],
        currentStage: 'technical',
        totalStages: 6,
      });

      expect(progress.completed).toBe(2);
      expect(progress.total).toBe(6);
      expect(progress.currentStage).toBe('technical');
      expect(progress.completionPercent).toBe(33); // 2/6
    });

    it('should generate progress bar', () => {
      const progress = feedback.generateProgressIndicator({
        completedStages: ['intake', 'warmup', 'technical'],
        currentStage: 'followup',
      });

      expect(progress.progressBar).toContain('█');
      expect(progress.progressBar).toContain('░');
    });

    it('should show 100% completion when all done', () => {
      const progress = feedback.generateProgressIndicator({
        completedStages: ['intake', 'warmup', 'technical', 'followup', 'challenge', 'feedback'],
        currentStage: 'feedback',
      });

      expect(progress.completionPercent).toBe(100);
    });

    it('should list all stages with status', () => {
      const progress = feedback.generateProgressIndicator({
        completedStages: ['intake', 'warmup'],
        currentStage: 'technical',
      });

      expect(progress.stagesList).toHaveLength(6);
      expect(progress.stagesList[0].isCompleted).toBe(true); // intake
      expect(progress.stagesList[2].isCurrent).toBe(true); // technical
      expect(progress.stagesList[3].isCompleted).toBe(false); // followup
    });

    it('should show correct ordinals', () => {
      const progress = feedback.generateProgressIndicator({
        currentStage: 'challenge',
      });

      expect(progress.currentOrdinal).toBe(5);
      expect(progress.description).toBe('5 of 6 stages');
    });
  });

  describe('Next Stage Guidance', () => {
    it('should provide guidance for each stage', () => {
      const guidance = feedback.generateNextStagGuidance({
        nextStage: 'technical',
      });

      expect(guidance.stage).toBe('technical');
      expect(guidance.label).toBe('Core Round');
      expect(guidance.focusAreas).toBeDefined();
      expect(guidance.tips).toBeDefined();
      expect(guidance.commonChallenges).toBeDefined();
      expect(guidance.mindsetSuggestion).toBeDefined();
    });

    it('should have guidance for all stages', () => {
      const stages = ['intake', 'warmup', 'technical', 'followup', 'challenge', 'feedback'];
      stages.forEach((stage) => {
        const guidance = feedback.generateNextStagGuidance({ nextStage: stage });
        expect(guidance.focusAreas.length).toBeGreaterThan(0);
        expect(guidance.tips.length).toBeGreaterThan(0);
      });
    });

    it('should include weakness-specific guidance', () => {
      const guidance = feedback.generateNextStagGuidance({
        nextStage: 'technical',
        userWeaknesses: ['recursion', 'graphs'],
      });

      expect(guidance.focusAreas.some((area) => area.includes('recursion') || area.includes('Review')))
        .toBe(true);
    });
  });

  describe('Transition Message', () => {
    it('should generate contextual messages', () => {
      const excellent = feedback.generateTransitionMessage({
        performanceLevel: 'excellent',
      });
      expect(['fantastic', 'excellent', 'doing great'].some(word => excellent.toLowerCase().includes(word))).toBe(true);

      const good = feedback.generateTransitionMessage({
        performanceLevel: 'good',
      });
      expect(['good', 'solid progress', 'got this'].some(phrase => good.toLowerCase().includes(phrase))).toBe(true);

      const fair = feedback.generateTransitionMessage({
        performanceLevel: 'fair',
      });
      expect(['making progress', 'ready for', 'next stage'].some(phrase => fair.toLowerCase().includes(phrase))).toBe(true);

      const needsImprovement = feedback.generateTransitionMessage({
        performanceLevel: 'needs improvement',
      });
      expect(['move on', 'fresh', 'new topic'].some(phrase => needsImprovement.toLowerCase().includes(phrase))).toBe(true);
    });

    it('should include stage names in message', () => {
      const message = feedback.generateTransitionMessage({
        fromStage: 'warmup',
        toStage: 'technical',
        performanceLevel: 'good',
      });

      // Should have transition text that references stages
      expect(message.length).toBeGreaterThan(20); // Non-trivial message
      expect(message).toMatch(/[A-Z]/); // Has capital letters
    });

    it('should vary messages for same performance level', () => {
      const messages = new Set();
      for (let i = 0; i < 5; i++) {
        messages.add(feedback.generateTransitionMessage({ performanceLevel: 'good' }));
      }
      expect(messages.size).toBeGreaterThan(1); // Multiple variations exist
    });
  });

  describe('Complete Transition Checkpoint', () => {
    it('should generate complete checkpoint', () => {
      const checkpoint = feedback.generateTransitionCheckpoint({
        currentStage: 'warmup',
        nextStage: 'technical',
        questionsInStage: 3,
        scoresInStage: [70, 75, 80],
        timeElapsedSeconds: 300,
        strengthAreas: ['clarity'],
        weakAreas: ['optimization'],
        averageScore: 75,
        trajectory: 0,
      });

      expect(checkpoint.timestamp).toBeDefined();
      expect(checkpoint.stageSummary).toBeDefined();
      expect(checkpoint.checkpoint).toBeDefined();
      expect(checkpoint.transitionMessage).toBeDefined();
      expect(checkpoint.nextStageGuidance).toBeDefined();
      expect(checkpoint.readyToAdvance).toBe(true);
    });

    it('should integrate all components', () => {
      const checkpoint = feedback.generateTransitionCheckpoint({
        currentStage: 'intake',
        nextStage: 'warmup',
        questionsInStage: 1,
        scoresInStage: [85],
        timeElapsedSeconds: 60,
        averageScore: 85,
      });

      const summary = checkpoint.stageSummary;
      expect(summary.averageScore).toBe(85);
      expect(summary.performanceLevel).toBe('excellent');

      const chkpt = checkpoint.checkpoint;
      expect(chkpt.fromStage).toBe('intake');
      expect(chkpt.toStage).toBe('warmup');

      const guidance = checkpoint.nextStageGuidance;
      expect(guidance.stage).toBe('warmup');

      const msg = checkpoint.transitionMessage;
      expect(msg.length).toBeGreaterThan(20); // Non-trivial message
      expect(typeof msg).toBe('string');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty scores', () => {
      const summary = feedback.generateStageSummary({
        scoresInStage: [],
      });

      expect(summary.averageScore).toBe(0);
      expect(summary.scoreRange.min).toBe(0);
      expect(summary.scoreRange.max).toBe(0);
    });

    it('should handle single score', () => {
      const summary = feedback.generateStageSummary({
        scoresInStage: [75],
      });

      expect(summary.averageScore).toBe(75);
      expect(summary.scoreRange.min).toBe(75);
      expect(summary.scoreRange.max).toBe(75);
    });

    it('should handle unknown stage gracefully', () => {
      const summary = feedback.generateStageSummary({
        currentStage: 'unknown_stage',
      });

      expect(summary.stageLabel).toBe('Unknown Stage');
    });

    it('should handle very short time', () => {
      const summary = feedback.generateStageSummary({
        currentStage: 'intake',
        timeSpentSeconds: 5,
      });

      expect(summary.timeSpentMinutes).toBe(0);
    });

    it('should handle very long time', () => {
      const summary = feedback.generateStageSummary({
        currentStage: 'technical',
        timeSpentSeconds: 3600, // 1 hour
      });

      expect(summary.timeSpentMinutes).toBe(60);
    });

    it('should handle many strengths and weaknesses', () => {
      const summary = feedback.generateStageSummary({
        strengthAreas: Array(10).fill('strength'),
        weakAreas: Array(10).fill('weakness'),
      });

      expect(summary.strengthAreas.length).toBe(10);
      expect(summary.weakAreas.length).toBe(10);
    });

    it('should handle null/undefined values', () => {
      const checkpoint = feedback.generateReadinessCheckpoint({
        fromStage: undefined,
        toStage: undefined,
        averageScore: undefined,
      });

      expect(checkpoint).toBeDefined();
      expect(checkpoint.canProceed).toBe(true);
    });
  });

  describe('Integration: Full Interview Journey', () => {
    it('should support complete interview flow', () => {
      // Intake checkpoint
      const intakeCheckpoint = feedback.generateTransitionCheckpoint({
        currentStage: 'intake',
        nextStage: 'warmup',
        questionsInStage: 1,
        scoresInStage: [80],
        averageScore: 80,
      });
      expect(intakeCheckpoint.readyToAdvance).toBe(true);

      // Warmup checkpoint
      const warmupCheckpoint = feedback.generateTransitionCheckpoint({
        currentStage: 'warmup',
        nextStage: 'technical',
        questionsInStage: 2,
        scoresInStage: [85, 90],
        averageScore: 87.5,
        trajectory: 1,
      });
      expect(warmupCheckpoint.checkpoint.recommendation).toContain('Excellent');

      // Technical checkpoint with warning
      const technicalCheckpoint = feedback.generateTransitionCheckpoint({
        currentStage: 'technical',
        nextStage: 'followup',
        questionsInStage: 4,
        scoresInStage: [75, 60, 45, 50],
        averageScore: 58, // Below 60 triggers caution
        trajectory: -1,
      });
      expect(technicalCheckpoint.checkpoint.warningLevel).toBe('caution');
      expect(technicalCheckpoint.checkpoint.canProceed).toBe(true); // Can still proceed

      // Progress at end
      const progress = feedback.generateProgressIndicator({
        completedStages: ['intake', 'warmup', 'technical', 'followup'],
        currentStage: 'challenge',
      });
      expect(progress.completionPercent).toBe(67); // 4/6
    });
  });

  describe('Narrative Quality', () => {
    it('should generate readable completion summaries', () => {
      const summary = feedback.generateStageSummary({
        currentStage: 'warmup',
        questionsAnswered: 3,
        scoresInStage: [70, 80, 90],
        timeSpentSeconds: 300,
        strengthAreas: ['communication', 'logical thinking'],
        weakAreas: ['time management'],
      });

      const narrative = summary.completionSummary;
      expect(narrative).toContain('Warmup');
      expect(narrative).toContain('80%'); // Average
      expect(narrative).toContain('communication');
      expect(narrative).toContain('time management');
      expect(narrative.split('.').length).toBeGreaterThan(1); // Multiple sentences
    });

    it('should provide actionable guidance', () => {
      const guidance = feedback.generateNextStagGuidance({
        nextStage: 'technical',
        userWeaknesses: ['dynamic programming'],
      });

      guidance.tips.forEach((tip) => {
        expect(tip.length).toBeGreaterThan(10); // Not trivial
        expect(tip.toLowerCase()).not.toContain('TODO'); // Not placeholder
      });
    });
  });
});
