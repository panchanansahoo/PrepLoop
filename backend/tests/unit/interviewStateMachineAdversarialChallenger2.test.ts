import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  InterviewStateMachineService,
  normalizeScoreByDifficulty,
  areDifficultiesComparable,
  isTurnExcludedFromStreaks,
  isAdaptivePacingEnabled,
} from '../../services/interviewStateMachine.js';

describe('Adversarial Stress Test: InterviewStateMachineService (Milestone 2 Challenger 2)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.FEATURE_FLAG_ADAPTIVE_STATE_MACHINE = 'true';
    delete process.env.FEATURE_AI_INTERVIEW_ADAPTIVE_PACING;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('Adversarial Dimension 1: Inviolable Hard Budget Ceiling & Boundary Precedence', () => {
    it('forces unconditional termination at turn 10 of 10 even with active low-score extension and BREAKDOWN_QUESTION', () => {
      // Setup state at turn 9 of 10 with active low-score extension and scaffolding
      let state = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 10);

      // Turn 8: score 30 -> low streak 1
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 8, score: 30, difficulty: 'medium' },
        { forceEnabled: true }
      );
      expect(state.consecutiveLowScores).toBe(1);

      // Turn 9: score 30 -> low streak 2 -> triggers BREAKDOWN_QUESTION, shouldExtendTechnical = true
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 9, score: 30, difficulty: 'medium' },
        { forceEnabled: true }
      );
      expect(state.consecutiveLowScores).toBe(2);
      expect(state.scaffoldingActive).toBe(true);
      expect(state.scaffoldingAction).toBe('BREAKDOWN_QUESTION');
      expect(state.shouldExtendTechnical).toBe(true);
      expect(state.isTerminated).toBe(false);

      // Turn 10 of 10: candidate scores 25 (would otherwise extend technical stage)
      // BUT turns (10) >= totalQuestions (10). Hard ceiling MUST take unconditional priority!
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 10, score: 25, difficulty: 'medium' },
        { forceEnabled: true }
      );

      expect(state.isTerminated).toBe(true);
      expect(state.stage).toBe('feedback');
      expect(state.transitionReason).toBe('hard_turn_budget_ceiling_reached');
      // Active scaffolding and technical extension must be cleared
      expect(state.scaffoldingActive).toBe(false);
      expect(state.scaffoldingAction).toBe('NONE');
      expect(state.shouldExtendTechnical).toBe(false);
    });

    it('forces unconditional termination at turn 10 of 10 with PROGRESSIVE_HINT (streak >= 3)', () => {
      let state = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 10);

      // Turn 7: low
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 7, score: 20, difficulty: 'medium' },
        { forceEnabled: true }
      );
      // Turn 8: low
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 8, score: 20, difficulty: 'medium' },
        { forceEnabled: true }
      );
      // Turn 9: low -> streak 3 -> PROGRESSIVE_HINT
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 9, score: 20, difficulty: 'medium' },
        { forceEnabled: true }
      );
      expect(state.consecutiveLowScores).toBe(3);
      expect(state.scaffoldingAction).toBe('PROGRESSIVE_HINT');

      // Turn 10 of 10: Hard budget ceiling
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 10, score: 15, difficulty: 'medium' },
        { forceEnabled: true }
      );
      expect(state.isTerminated).toBe(true);
      expect(state.stage).toBe('feedback');
      expect(state.transitionReason).toBe('hard_turn_budget_ceiling_reached');
      expect(state.scaffoldingActive).toBe(false);
      expect(state.scaffoldingAction).toBe('NONE');
    });

    it('forces unconditional termination at turn 10 of 10 even with consecutiveHighScores = 3', () => {
      let state = InterviewStateMachineService.createInitialState('dsa', 'hard', null, 10);
      state = InterviewStateMachineService.advanceState({ ...state, turns: 7, score: 95, difficulty: 'hard' }, { forceEnabled: true });
      state = InterviewStateMachineService.advanceState({ ...state, turns: 8, score: 95, difficulty: 'hard' }, { forceEnabled: true });
      state = InterviewStateMachineService.advanceState({ ...state, turns: 9, score: 95, difficulty: 'hard' }, { forceEnabled: true });
      expect(state.consecutiveHighScores).toBe(3);

      // Turn 10: reaches totalQuestions -> Feedback, terminated!
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 10, score: 95, difficulty: 'hard' },
        { forceEnabled: true }
      );
      expect(state.isTerminated).toBe(true);
      expect(state.stage).toBe('feedback');
      expect(state.transitionReason).toBe('hard_turn_budget_ceiling_reached');
    });

    it('remains permanently terminated when called repeatedly at turns >= totalQuestions or turns > totalQuestions', () => {
      let state = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 10);
      state = InterviewStateMachineService.advanceState({ ...state, turns: 10 }, { forceEnabled: true });
      expect(state.isTerminated).toBe(true);
      expect(state.stage).toBe('feedback');

      // Repeated calls at turn 10
      for (let i = 0; i < 5; i++) {
        state = InterviewStateMachineService.advanceState(
          { ...state, turns: 10, score: 99, difficulty: 'hard' },
          { forceEnabled: true }
        );
        expect(state.isTerminated).toBe(true);
        expect(state.stage).toBe('feedback');
        expect(state.transitionReason).toBe('hard_turn_budget_ceiling_reached');
      }

      // Beyond totalQuestions (turns = 11, 12, 15, 100)
      for (const t of [11, 12, 15, 100]) {
        state = InterviewStateMachineService.advanceState(
          { ...state, turns: t, score: 20, difficulty: 'easy' },
          { forceEnabled: true }
        );
        expect(state.isTerminated).toBe(true);
        expect(state.stage).toBe('feedback');
        expect(state.transitionReason).toBe('hard_turn_budget_ceiling_reached');
      }

      // Verify stage history does not spam duplicate ceiling entries
      const ceilingEntries = state.stageHistory.filter(
        h => h.reason === 'hard_turn_budget_ceiling_reached'
      );
      expect(ceilingEntries.length).toBe(1);
    });

    it('handles totalQuestions === 0 by falling back gracefully without crashing', () => {
      // When totalQuestions is 0, createInitialState should sanitize it to null
      const state0 = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 0);
      expect(state0.totalQuestions).toBeNull();

      // State progression should fall back to legacy thresholds
      const adv1 = InterviewStateMachineService.advanceState({ ...state0, turns: 1 }, { forceEnabled: true });
      expect(adv1.stage).toBe('warmup');

      const adv3 = InterviewStateMachineService.advanceState({ ...state0, turns: 3 }, { forceEnabled: true });
      expect(adv3.stage).toBe('technical');

      const adv12 = InterviewStateMachineService.advanceState({ ...state0, turns: 12 }, { forceEnabled: true });
      expect(adv12.stage).toBe('feedback');
    });

    it('handles negative totalQuestions or non-numeric totalQuestions gracefully', () => {
      const stateNeg = InterviewStateMachineService.createInitialState('dsa', 'medium', null, -5);
      expect(stateNeg.totalQuestions).toBeNull();

      const stateNaN = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 'not-a-number');
      expect(stateNaN.totalQuestions).toBeNull();

      // Numeric string should be parsed
      const stateStr = InterviewStateMachineService.createInitialState('dsa', 'medium', null, '10');
      expect(stateStr.totalQuestions).toBe(10);
    });

    it('correctly handles small edge totalQuestions: totalQuestions = 1', () => {
      const state1 = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 1);
      expect(state1.totalQuestions).toBe(1);
      expect(state1.stage).toBe('intake');

      // Turn 1 immediately reaches totalQuestions (1) -> feedback, terminated!
      const adv1 = InterviewStateMachineService.advanceState({ ...state1, turns: 1 }, { forceEnabled: true });
      expect(adv1.stage).toBe('feedback');
      expect(adv1.isTerminated).toBe(true);
      expect(adv1.transitionReason).toBe('hard_turn_budget_ceiling_reached');
    });
  });

  describe('Adversarial Dimension 2: Score Boundary Oscillation & Streak Reset Rigor', () => {
    it('properly resets streak on boundary scores 40 and 41 when oscillating (39, 41, 39, 40)', () => {
      let state = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 13);

      // Turn 1: score 39 (< 40) -> streak = 1
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 1, score: 39, difficulty: 'medium' },
        { forceEnabled: true }
      );
      expect(state.consecutiveLowScores).toBe(1);
      expect(state.scaffoldingActive).toBe(false);

      // Turn 2: score 41 (>= 40) -> resets streak to 0
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 2, score: 41, difficulty: 'medium' },
        { forceEnabled: true }
      );
      expect(state.consecutiveLowScores).toBe(0);
      expect(state.scaffoldingActive).toBe(false);

      // Turn 3: score 39 (< 40) -> streak = 1 (NOT 2!)
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 3, score: 39, difficulty: 'medium' },
        { forceEnabled: true }
      );
      expect(state.consecutiveLowScores).toBe(1);
      expect(state.scaffoldingActive).toBe(false);
      expect(state.scaffoldingAction).toBe('NONE');

      // Turn 4: score 40 (exact threshold >= 40) -> resets streak to 0
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 4, score: 40, difficulty: 'medium' },
        { forceEnabled: true }
      );
      expect(state.consecutiveLowScores).toBe(0);
      expect(state.scaffoldingActive).toBe(false);
      expect(state.scaffoldingAction).toBe('NONE');

      // Turn 5: score 39 -> streak = 1
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 5, score: 39, difficulty: 'medium' },
        { forceEnabled: true }
      );
      expect(state.consecutiveLowScores).toBe(1);

      // Turn 6: score 39 -> streak = 2 -> NOW triggers BREAKDOWN_QUESTION!
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 6, score: 39, difficulty: 'medium' },
        { forceEnabled: true }
      );
      expect(state.consecutiveLowScores).toBe(2);
      expect(state.scaffoldingActive).toBe(true);
      expect(state.scaffoldingAction).toBe('BREAKDOWN_QUESTION');
    });

    it('requires 3 CONSECUTIVE scores >= 85 and never falsely accelerates on oscillating scores (84, 85, 84, 85)', () => {
      let state = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 13);

      // Turn 1: score 84 (< 85) -> high streak = 0
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 1, score: 84, difficulty: 'medium' },
        { forceEnabled: true }
      );
      expect(state.consecutiveHighScores).toBe(0);
      expect(state.stage).toBe('warmup');

      // Turn 2: score 85 (>= 85) -> high streak = 1
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 2, score: 85, difficulty: 'medium' },
        { forceEnabled: true }
      );
      expect(state.consecutiveHighScores).toBe(1);
      expect(state.stage).toBe('warmup');

      // Turn 3: score 84 (< 85) -> resets high streak to 0!
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 3, score: 84, difficulty: 'medium' },
        { forceEnabled: true }
      );
      expect(state.consecutiveHighScores).toBe(0);
      expect(state.stage).toBe('technical');

      // Turn 4: score 85 (>= 85) -> high streak = 1
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 4, score: 85, difficulty: 'medium' },
        { forceEnabled: true }
      );
      expect(state.consecutiveHighScores).toBe(1);
      expect(state.stage).toBe('technical');

      // Turn 5: score 85 (>= 85) -> high streak = 2
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 5, score: 85, difficulty: 'medium' },
        { forceEnabled: true }
      );
      expect(state.consecutiveHighScores).toBe(2);
      expect(state.stage).toBe('technical');

      // Turn 6: score 85 (>= 85) -> high streak = 3 -> NOW triggers early challenge acceleration!
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 6, score: 85, difficulty: 'medium' },
        { forceEnabled: true }
      );
      expect(state.consecutiveHighScores).toBe(3);
      expect(state.stage).toBe('challenge');
      expect(state.transitionReason).toBe('sustained_high_scores_early_challenge');
    });

    it('does not reset streaks on unscored, skipped, or clarification turns (turn hygiene)', () => {
      let state = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 13);

      // Low score turn
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 1, score: 35, difficulty: 'medium' },
        { forceEnabled: true }
      );
      expect(state.consecutiveLowScores).toBe(1);

      // Interleaved: clarification
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 2, isClarification: true },
        { forceEnabled: true }
      );
      expect(state.consecutiveLowScores).toBe(1);

      // Interleaved: skipped
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 3, isSkipped: true },
        { forceEnabled: true }
      );
      expect(state.consecutiveLowScores).toBe(1);

      // Interleaved: unscored
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 4, isUnscored: true },
        { forceEnabled: true }
      );
      expect(state.consecutiveLowScores).toBe(1);

      // Next scored turn: low score -> reaches streak 2!
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 5, score: 30, difficulty: 'medium' },
        { forceEnabled: true }
      );
      expect(state.consecutiveLowScores).toBe(2);
      expect(state.scaffoldingActive).toBe(true);
      expect(state.scaffoldingAction).toBe('BREAKDOWN_QUESTION');
    });

    it('preserves high streak across excluded turns without false reset or increment', () => {
      let state = InterviewStateMachineService.createInitialState('dsa', 'hard', null, 13);

      // Turn 1: score 90 (hard) -> high streak 1
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 1, score: 90, difficulty: 'hard' },
        { forceEnabled: true }
      );
      expect(state.consecutiveHighScores).toBe(1);

      // Turn 2: clarification question
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 2, isClarification: true },
        { forceEnabled: true }
      );
      expect(state.consecutiveHighScores).toBe(1);

      // Turn 3: score 92 (hard) -> high streak 2
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 3, score: 92, difficulty: 'hard' },
        { forceEnabled: true }
      );
      expect(state.consecutiveHighScores).toBe(2);

      // Turn 4: skipped turn
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 4, isSkipped: true },
        { forceEnabled: true }
      );
      expect(state.consecutiveHighScores).toBe(2);

      // Turn 5: score 95 (hard) -> high streak 3 -> EARLY CHALLENGE!
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 5, score: 95, difficulty: 'hard' },
        { forceEnabled: true }
      );
      expect(state.consecutiveHighScores).toBe(3);
      expect(state.stage).toBe('challenge');
      expect(state.transitionReason).toBe('sustained_high_scores_early_challenge');
    });
  });

  describe('Adversarial Dimension 3: Non-Comparable Difficulty Tier Bounds', () => {
    it('does not increment low streak if difficulty tiers are non-comparable (|diffIndex1 - diffIndex2| > 1)', () => {
      let state = InterviewStateMachineService.createInitialState('dsa', 'easy', null, 13);

      // Turn 1: score 30 on easy (tier 0) -> low streak 1
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 1, score: 30, difficulty: 'easy' },
        { forceEnabled: true }
      );
      expect(state.consecutiveLowScores).toBe(1);
      expect(state.lastScoredDifficulty).toBe('easy');

      // Turn 2: score 30 on staff_architectural (tier 3). |3 - 0| = 3 > 1: NOT COMPARABLE!
      // Must NOT increment low streak to 2. It resets streak to 1!
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 2, score: 30, difficulty: 'staff_architectural' },
        { forceEnabled: true }
      );
      expect(state.consecutiveLowScores).toBe(1);
      expect(state.scaffoldingActive).toBe(false);
      expect(state.scaffoldingAction).toBe('NONE');
      expect(state.lastScoredDifficulty).toBe('staff_architectural');
    });

    it('resets low streak when jumping between easy (tier 0) and hard (tier 2)', () => {
      let state = InterviewStateMachineService.createInitialState('dsa', 'easy', null, 13);

      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 1, score: 25, difficulty: 'easy' },
        { forceEnabled: true }
      );
      expect(state.consecutiveLowScores).toBe(1);

      // Jump to hard (|2 - 0| = 2 > 1) -> not comparable
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 2, score: 25, difficulty: 'hard' },
        { forceEnabled: true }
      );
      expect(state.consecutiveLowScores).toBe(1);
      expect(state.scaffoldingActive).toBe(false);
    });
  });

  describe('Adversarial Dimension 4: Malformed, Null, and Extreme Inputs', () => {
    it('treats NaN, non-numeric strings, and undefined scores as excluded turns without altering streaks', () => {
      let state = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 13);
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 1, score: 30, difficulty: 'medium' },
        { forceEnabled: true }
      );
      expect(state.consecutiveLowScores).toBe(1);

      // Score NaN
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 2, score: NaN },
        { forceEnabled: true }
      );
      expect(state.consecutiveLowScores).toBe(1);

      // Score invalid string
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 3, score: 'invalid_score' },
        { forceEnabled: true }
      );
      expect(state.consecutiveLowScores).toBe(1);

      // Score null
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 4, score: null },
        { forceEnabled: true }
      );
      expect(state.consecutiveLowScores).toBe(1);

      // Score undefined
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 5 },
        { forceEnabled: true }
      );
      expect(state.consecutiveLowScores).toBe(1);
    });

    it('handles negative scores and extreme high scores safely via clamping', () => {
      expect(normalizeScoreByDifficulty(-50, 'medium')).toBe(0);
      expect(normalizeScoreByDifficulty(999, 'medium')).toBe(100);
      expect(normalizeScoreByDifficulty(100, 'easy')).toBe(70); // Capped at 70
      expect(normalizeScoreByDifficulty(100, 'hard')).toBe(100);
      expect(normalizeScoreByDifficulty(100, 'staff_architectural')).toBe(100);
    });
  });

  describe('Adversarial Dimension 5: Technical Extension Limit (Max 2 Turns)', () => {
    it('strictly bounds low-score technical stage extension to at most 2 turns', () => {
      // 13 questions: technical stage is turns 3-6 (ratio 0.20 to 0.50)
      // Followup starts at turn 7 (ratio 7/13 = 0.538 >= 0.50)
      let state = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 13);

      // Warmup turns
      state = InterviewStateMachineService.advanceState({ ...state, turns: 1, score: 50 }, { forceEnabled: true });
      state = InterviewStateMachineService.advanceState({ ...state, turns: 2, score: 50 }, { forceEnabled: true });

      // Technical turns with low scores
      state = InterviewStateMachineService.advanceState({ ...state, turns: 3, score: 30 }, { forceEnabled: true });
      state = InterviewStateMachineService.advanceState({ ...state, turns: 4, score: 30 }, { forceEnabled: true });
      expect(state.consecutiveLowScores).toBe(2);
      expect(state.stage).toBe('technical');

      state = InterviewStateMachineService.advanceState({ ...state, turns: 5, score: 30 }, { forceEnabled: true });
      expect(state.stage).toBe('technical');
      state = InterviewStateMachineService.advanceState({ ...state, turns: 6, score: 30 }, { forceEnabled: true });
      expect(state.stage).toBe('technical');

      // Turn 7: Proportional stage is followup. But consecutiveLowScores >= 2 and extendedTurnsCount < 2.
      // Extends technical: extension 1
      state = InterviewStateMachineService.advanceState({ ...state, turns: 7, score: 30 }, { forceEnabled: true });
      expect(state.stage).toBe('technical');
      expect(state.extendedTurnsCount).toBe(1);
      expect(state.transitionReason).toBe('consecutive_low_scores_scaffolding_extension');

      // Turn 8: Extension 2
      state = InterviewStateMachineService.advanceState({ ...state, turns: 8, score: 30 }, { forceEnabled: true });
      expect(state.stage).toBe('technical');
      expect(state.extendedTurnsCount).toBe(2);
      expect(state.transitionReason).toBe('consecutive_low_scores_scaffolding_extension');

      // Turn 9: Extension limit reached (extendedTurnsCount = 2). MUST progress to followup!
      state = InterviewStateMachineService.advanceState({ ...state, turns: 9, score: 30 }, { forceEnabled: true });
      expect(state.stage).toBe('followup');
      expect(state.extendedTurnsCount).toBe(2);
    });
  });

  describe('Adversarial Dimension 6: Dynamic Feature Flag Runtime Isolation', () => {
    it('dynamically responds to process.env toggle without redeployment', () => {
      delete process.env.FEATURE_FLAG_ADAPTIVE_STATE_MACHINE;
      delete process.env.FEATURE_AI_INTERVIEW_ADAPTIVE_PACING;

      // Flag is OFF
      expect(isAdaptivePacingEnabled()).toBe(false);

      let state = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 13);
      // Give high scores while flag is OFF
      state = InterviewStateMachineService.advanceState({ ...state, turns: 1, score: 95, difficulty: 'hard' });
      state = InterviewStateMachineService.advanceState({ ...state, turns: 2, score: 95, difficulty: 'hard' });
      state = InterviewStateMachineService.advanceState({ ...state, turns: 3, score: 95, difficulty: 'hard' });
      // When flag is OFF, adaptive streak tracking is inactive (streaks remain 0)
      expect(state.consecutiveHighScores).toBe(0);
      expect(state.stage).toBe('technical');

      // Toggle flag ON at runtime
      process.env.FEATURE_FLAG_ADAPTIVE_STATE_MACHINE = 'true';
      expect(isAdaptivePacingEnabled()).toBe(true);

      // Now under active adaptive pacing, 3 consecutive high scores trigger early challenge
      state = InterviewStateMachineService.advanceState({ ...state, turns: 4, score: 95, difficulty: 'hard' });
      expect(state.consecutiveHighScores).toBe(1);
      expect(state.stage).toBe('technical');

      state = InterviewStateMachineService.advanceState({ ...state, turns: 5, score: 95, difficulty: 'hard' });
      expect(state.consecutiveHighScores).toBe(2);
      expect(state.stage).toBe('technical');

      state = InterviewStateMachineService.advanceState({ ...state, turns: 6, score: 95, difficulty: 'hard' });
      expect(state.consecutiveHighScores).toBe(3);
      expect(state.stage).toBe('challenge');
      expect(state.transitionReason).toBe('sustained_high_scores_early_challenge');
    });
  });

  describe('Adversarial Dimension 7: State Sanitation & Transient Property Scrubbing', () => {
    it('scrubs transient turn properties so skipped or clarification flags do not poison subsequent turns', () => {
      let state = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 10);

      // Turn 1 passes isClarification on state
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 1, isClarification: true, answerType: 'clarification' },
        { forceEnabled: true }
      );
      expect(state.isClarification).toBeUndefined();
      expect(state.answerType).toBeUndefined();

      // Turn 2 passes normal scored turn without repeating isClarification
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 2, score: 30, difficulty: 'medium' },
        { forceEnabled: true }
      );
      // Must be evaluated as scored turn, low streak becomes 1
      expect(state.consecutiveLowScores).toBe(1);
      expect(state.isClarification).toBeUndefined();
    });
  });

  describe('Adversarial Dimension 8: Invariant Fuzzing Harness (10,000 Iteration Stress)', () => {
    it('preserves all state machine invariants under 10,000 randomized state transitions', () => {
      const difficulties = ['easy', 'medium', 'hard', 'staff_architectural'];
      const sessionLengths = [3, 5, 8, 10, 13, 20];

      // Run multiple random full session simulations
      for (let run = 0; run < 100; run++) {
        const total = sessionLengths[run % sessionLengths.length];
        const baseDiff = difficulties[run % difficulties.length];
        let state = InterviewStateMachineService.createInitialState('dsa', baseDiff, null, total);

        let previousLowStreak = 0;
        let previousHighStreak = 0;

        for (let t = 1; t <= total + 5; t++) {
          const randType = Math.random();
          const score = Math.floor(Math.random() * 101); // 0 to 100
          const diff = difficulties[Math.floor(Math.random() * difficulties.length)];

          let advanceInput: any = { ...state, turns: t };

          if (randType < 0.1) {
            // Skipped turn
            advanceInput.isSkipped = true;
          } else if (randType < 0.2) {
            // Clarification turn
            advanceInput.isClarification = true;
          } else if (randType < 0.25) {
            // Unscored turn
            advanceInput.isUnscored = true;
          } else {
            // Scored turn
            advanceInput.score = score;
            advanceInput.difficulty = diff;
          }

          state = InterviewStateMachineService.advanceState(advanceInput, { forceEnabled: true });

          // ── HARD CEILING INVARIANT ──────────────────────────────────────
          if (t >= total) {
            expect(state.isTerminated).toBe(true);
            expect(state.stage).toBe('feedback');
            expect(state.transitionReason).toBe('hard_turn_budget_ceiling_reached');
            expect(state.scaffoldingActive).toBe(false);
            expect(state.scaffoldingAction).toBe('NONE');
            expect(state.shouldExtendTechnical).toBe(false);
          } else {
            // Before ceiling
            expect(state.isTerminated).toBe(false);

            // ── SCAFFOLDING INVARIANT ───────────────────────────────────
            if (state.consecutiveLowScores >= 2) {
              expect(state.scaffoldingActive).toBe(true);
              expect(['BREAKDOWN_QUESTION', 'PROGRESSIVE_HINT']).toContain(state.scaffoldingAction);
              expect(state.skipChallenge).toBe(true);
            }

            // ── EASY TIER HIGH STREAK INVARIANT ─────────────────────────
            // High streak should never have incremented from an easy question
            if (advanceInput.difficulty === 'easy' && advanceInput.score >= 85) {
              expect(state.consecutiveHighScores).toBe(previousHighStreak);
            }
          }

          previousLowStreak = state.consecutiveLowScores;
          previousHighStreak = state.consecutiveHighScores;
        }
      }
    });
  });
});
