import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  InterviewStateMachineService,
  normalizeScoreByDifficulty,
  areDifficultiesComparable,
  isTurnExcludedFromStreaks,
  isAdaptivePacingEnabled,
} from '../../services/interviewStateMachine.js';

describe('Adversarial Stress Testing — Milestone 2 Adaptive State Machine', () => {
  const originalEnv = process.env.FEATURE_FLAG_ADAPTIVE_STATE_MACHINE;

  beforeEach(() => {
    process.env.FEATURE_FLAG_ADAPTIVE_STATE_MACHINE = 'true';
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.FEATURE_FLAG_ADAPTIVE_STATE_MACHINE;
    } else {
      process.env.FEATURE_FLAG_ADAPTIVE_STATE_MACHINE = originalEnv;
    }
  });

  // ── 1. MANDATORY ADVERSARIAL CASES ──────────────────────────────────────

  describe('Adversarial 1: Easy Question Streak Gaming Prevention', () => {
    it('MUST NOT trigger challenge when candidate achieves 100 on 5 consecutive easy questions', () => {
      let state = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 13);
      expect(state.stage).toBe('intake');

      for (let turn = 1; turn <= 5; turn++) {
        state = InterviewStateMachineService.advanceState(
          { ...state, turns: turn },
          { score: 100, difficultyTier: 'easy' }
        );

        // High streak must remain 0 despite perfect scores on easy questions
        expect(state.consecutiveHighScores).toBe(0);
        // Stage must follow standard pacing (warmup or technical), NEVER challenge
        expect(state.stage).not.toBe('challenge');
        expect(state.transitionReason).not.toBe('sustained_high_scores_early_challenge');
      }

      // At turn 5 of 13, normal stage is technical (ratio = 5/13 ≈ 0.38)
      expect(state.stage).toBe('technical');
      expect(state.consecutiveHighScores).toBe(0);
    });

    it('MUST NOT increment high streak on easy questions when alternating between easy and medium', () => {
      let state = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 13);

      // Turn 1: Medium question with score 90 -> streak increments to 1
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 1 },
        { score: 90, difficultyTier: 'medium' }
      );
      expect(state.consecutiveHighScores).toBe(1);

      // Turn 2: Easy question with score 100 -> MUST NOT increment high streak
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 2 },
        { score: 100, difficultyTier: 'easy' }
      );
      expect(state.consecutiveHighScores).toBe(1); // Preserved at 1, NOT 2

      // Turn 3: Medium question with score 90 -> streak increments to 2
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 3 },
        { score: 90, difficultyTier: 'medium' }
      );
      expect(state.consecutiveHighScores).toBe(2);

      // Turn 4: Easy question with score 100 -> MUST NOT increment high streak
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 4 },
        { score: 100, difficultyTier: 'easy' }
      );
      expect(state.consecutiveHighScores).toBe(2); // Preserved at 2, NOT 3

      // Turn 5: Easy question with score 100 -> MUST NOT increment high streak
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 5 },
        { score: 100, difficultyTier: 'easy' }
      );
      expect(state.consecutiveHighScores).toBe(2); // Still 2, NEVER 3!

      // Must NOT have accelerated to challenge
      expect(state.stage).not.toBe('challenge');
      expect(state.transitionReason).not.toBe('sustained_high_scores_early_challenge');
    });
  });

  describe('Adversarial 2: Non-Comparable Difficulty Low-Score Protection', () => {
    it('MUST NOT trigger extension or scaffolding when candidate scores <40 on non-comparable difficulty (easy then staff_architectural)', () => {
      let state = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 13);

      // Turn 1: Easy question (tierIndex 0) with low score 30
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 1 },
        { score: 30, difficultyTier: 'easy' }
      );
      expect(state.consecutiveLowScores).toBe(1);
      expect(state.scaffoldingActive).toBe(false);
      expect(state.scaffoldingAction).toBe('NONE');
      expect(state.skipChallenge).toBe(false);

      // Turn 2: Staff Architectural question (tierIndex 3) with low score 30
      // |0 - 3| = 3 > 1 => Non-comparable!
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 2 },
        { score: 30, difficultyTier: 'staff_architectural' }
      );

      // Low score streak MUST reset to 1 because tiers are not comparable
      expect(state.consecutiveLowScores).toBe(1);
      expect(state.scaffoldingActive).toBe(false);
      expect(state.scaffoldingAction).toBe('NONE');
      expect(state.shouldExtendTechnical).toBe(false);
      expect(state.skipChallenge).toBe(false);
      expect(state.transitionReason).not.toBe('consecutive_low_scores_scaffolding_extension');
    });

    it('verifies non-comparability across other tier pairs (easy <-> hard, medium <-> staff_architectural)', () => {
      expect(areDifficultiesComparable('easy', 'hard')).toBe(false); // |0 - 2| = 2
      expect(areDifficultiesComparable('hard', 'easy')).toBe(false);
      expect(areDifficultiesComparable('medium', 'staff_architectural')).toBe(false); // |1 - 3| = 2
      expect(areDifficultiesComparable('staff_architectural', 'medium')).toBe(false);
      expect(areDifficultiesComparable('easy', 'staff_architectural')).toBe(false); // |0 - 3| = 3

      // Sequence: medium (25) -> staff_architectural (25)
      let state = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 13);
      state = InterviewStateMachineService.advanceState({ ...state, turns: 1 }, { score: 25, difficultyTier: 'medium' });
      expect(state.consecutiveLowScores).toBe(1);

      state = InterviewStateMachineService.advanceState({ ...state, turns: 2 }, { score: 25, difficultyTier: 'staff_architectural' });
      expect(state.consecutiveLowScores).toBe(1);
      expect(state.scaffoldingActive).toBe(false);

      // Sequence: easy (25) -> hard (25)
      state = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 13);
      state = InterviewStateMachineService.advanceState({ ...state, turns: 1 }, { score: 25, difficultyTier: 'easy' });
      expect(state.consecutiveLowScores).toBe(1);

      state = InterviewStateMachineService.advanceState({ ...state, turns: 2 }, { score: 25, difficultyTier: 'hard' });
      expect(state.consecutiveLowScores).toBe(1);
      expect(state.scaffoldingActive).toBe(false);
    });

    it('DOES trigger scaffolding when low scores occur on comparable difficulty (|tierIndex1 - tierIndex2| <= 1)', () => {
      // Sequence: hard (tier 2) -> staff_architectural (tier 3) => |2 - 3| = 1 <= 1
      let state = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 13);
      state = InterviewStateMachineService.advanceState({ ...state, turns: 1 }, { score: 25, difficultyTier: 'hard' });
      expect(state.consecutiveLowScores).toBe(1);

      state = InterviewStateMachineService.advanceState({ ...state, turns: 2 }, { score: 25, difficultyTier: 'staff_architectural' });
      expect(state.consecutiveLowScores).toBe(2);
      expect(state.scaffoldingActive).toBe(true);
      expect(state.scaffoldingAction).toBe('BREAKDOWN_QUESTION');
      expect(state.skipChallenge).toBe(true);
    });
  });

  describe('Adversarial 3: Turn Hygiene & Streak Isolation Under Injection', () => {
    it('maintains low streak at 2 and keeps scaffolding active when interrupted by 3 clarifications and 2 skips', () => {
      let state = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 13);

      // Establish streak of 2 low scores
      state = InterviewStateMachineService.advanceState({ ...state, turns: 1 }, { score: 35, difficultyTier: 'medium' });
      state = InterviewStateMachineService.advanceState({ ...state, turns: 2 }, { score: 30, difficultyTier: 'medium' });
      expect(state.consecutiveLowScores).toBe(2);
      expect(state.scaffoldingActive).toBe(true);
      expect(state.scaffoldingAction).toBe('BREAKDOWN_QUESTION');

      // Interruption: 3 clarification turns
      state = InterviewStateMachineService.advanceState({ ...state, turns: 3 }, { answerType: 'clarification' });
      expect(state.consecutiveLowScores).toBe(2);
      expect(state.scaffoldingActive).toBe(true);
      expect(state.scaffoldingAction).toBe('BREAKDOWN_QUESTION');

      state = InterviewStateMachineService.advanceState({ ...state, turns: 4 }, { isClarification: true });
      expect(state.consecutiveLowScores).toBe(2);
      expect(state.scaffoldingActive).toBe(true);

      state = InterviewStateMachineService.advanceState({ ...state, turns: 5 }, { turnType: 'clarification' });
      expect(state.consecutiveLowScores).toBe(2);
      expect(state.scaffoldingActive).toBe(true);

      // Interruption: 2 skipped turns
      state = InterviewStateMachineService.advanceState({ ...state, turns: 6 }, { isSkipped: true });
      expect(state.consecutiveLowScores).toBe(2);
      expect(state.scaffoldingActive).toBe(true);

      state = InterviewStateMachineService.advanceState({ ...state, turns: 7 }, { answerType: 'skipped' });
      expect(state.consecutiveLowScores).toBe(2);
      expect(state.scaffoldingActive).toBe(true);
      expect(state.scaffoldingAction).toBe('BREAKDOWN_QUESTION');
      expect(state.skipChallenge).toBe(true);
    });

    it('accumulates streak across interleaved clarification, skipped, and unscored turns', () => {
      let state = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 13);

      // Low score 1
      state = InterviewStateMachineService.advanceState({ ...state, turns: 1 }, { score: 35, difficultyTier: 'medium' });
      expect(state.consecutiveLowScores).toBe(1);

      // Interleaved noise: clarification
      state = InterviewStateMachineService.advanceState({ ...state, turns: 2 }, { answerType: 'clarification' });
      expect(state.consecutiveLowScores).toBe(1);

      // Interleaved noise: skipped
      state = InterviewStateMachineService.advanceState({ ...state, turns: 3 }, { isSkipped: true });
      expect(state.consecutiveLowScores).toBe(1);

      // Interleaved noise: unscored (null score)
      state = InterviewStateMachineService.advanceState({ ...state, turns: 4 }, { score: null });
      expect(state.consecutiveLowScores).toBe(1);

      // Interleaved noise: undefined score
      state = InterviewStateMachineService.advanceState({ ...state, turns: 5 }, {});
      expect(state.consecutiveLowScores).toBe(1);

      // Low score 2 on comparable difficulty ('hard' comparable to 'medium')
      state = InterviewStateMachineService.advanceState({ ...state, turns: 6 }, { score: 30, difficultyTier: 'hard' });
      expect(state.consecutiveLowScores).toBe(2);
      expect(state.scaffoldingActive).toBe(true);
      expect(state.scaffoldingAction).toBe('BREAKDOWN_QUESTION');
      expect(state.skipChallenge).toBe(true);
    });
  });

  // ── 2. ADDITIONAL ADVERSARIAL STRESS TESTS ────────────────────────────────

  describe('Adversarial 4: Inviolable Global Hard Turn Budget Ceiling', () => {
    it('unconditionally forces feedback and terminates even when candidate has active scaffolding and low score streak', () => {
      let state = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 8);
      expect(state.totalQuestions).toBe(8);

      // Candidate scores low continuously
      for (let turn = 1; turn <= 7; turn++) {
        state = InterviewStateMachineService.advanceState(
          { ...state, turns: turn },
          { score: 20, difficultyTier: 'medium' }
        );
        expect(state.isTerminated).toBe(false);
      }
      expect(state.scaffoldingActive).toBe(true);

      // Turn 8 reaches hard ceiling (turns >= totalQuestions)
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 8 },
        { score: 20, difficultyTier: 'medium' }
      );

      expect(state.stage).toBe('feedback');
      expect(state.isTerminated).toBe(true);
      expect(state.transitionReason).toBe('hard_turn_budget_ceiling_reached');
      expect(state.scaffoldingActive).toBe(false);
      expect(state.scaffoldingAction).toBe('NONE');
      expect(state.shouldExtendTechnical).toBe(false);

      // Post-termination calls remain terminated and in feedback
      const postState = InterviewStateMachineService.advanceState(
        { ...state, turns: 9 },
        { score: 20, difficultyTier: 'medium' }
      );
      expect(postState.stage).toBe('feedback');
      expect(postState.isTerminated).toBe(true);
      expect(postState.transitionReason).toBe('hard_turn_budget_ceiling_reached');
    });
  });

  describe('Adversarial 5: Immutability and State Mutation Protection', () => {
    it('does not throw or mutate frozen state object passed to advanceState', () => {
      const initialState = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 13);
      const frozenState = Object.freeze({
        ...initialState,
        stageHistory: Object.freeze([...initialState.stageHistory]),
      });

      expect(() => {
        InterviewStateMachineService.advanceState(frozenState, { score: 90, difficultyTier: 'medium' });
      }).not.toThrow();

      const advanced = InterviewStateMachineService.advanceState(frozenState, { score: 90, difficultyTier: 'medium' });
      expect(advanced).not.toBe(frozenState);
      expect(advanced.consecutiveHighScores).toBe(1);
      expect(frozenState.consecutiveHighScores).toBe(0); // Original unchanged
    });
  });

  describe('Adversarial 6: Malformed, Null, and Extreme Inputs', () => {
    it('handles NaN, Infinity, -Infinity, strings, and null scores gracefully without crashing', () => {
      let state = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 13);

      expect(() => {
        state = InterviewStateMachineService.advanceState({ ...state, turns: 1 }, { score: NaN });
        state = InterviewStateMachineService.advanceState({ ...state, turns: 2 }, { score: Infinity });
        state = InterviewStateMachineService.advanceState({ ...state, turns: 3 }, { score: -Infinity });
        state = InterviewStateMachineService.advanceState({ ...state, turns: 4 }, { score: 'not_a_number' });
        state = InterviewStateMachineService.advanceState({ ...state, turns: 5 }, { score: null });
        state = InterviewStateMachineService.advanceState({ ...state, turns: 6 }, { score: undefined });
      }).not.toThrow();

      // All unparseable scores must be excluded
      expect(state.consecutiveLowScores).toBe(0);
      expect(state.consecutiveHighScores).toBe(0);
    });

    it('correctly clamps out-of-range scores in normalization', () => {
      expect(normalizeScoreByDifficulty(-100, 'easy')).toBe(0);
      expect(normalizeScoreByDifficulty(999, 'easy')).toBe(70); // Easy cap is 70
      expect(normalizeScoreByDifficulty(150, 'medium')).toBe(100);
      expect(normalizeScoreByDifficulty(150, 'hard')).toBe(100);
      expect(normalizeScoreByDifficulty(150, 'staff_architectural')).toBe(100);
      expect(normalizeScoreByDifficulty(NaN, 'medium')).toBeNull();
      expect(normalizeScoreByDifficulty(null, 'medium')).toBeNull();
    });
  });

  describe('Adversarial 7: Scaffolding Escalation and Recovery', () => {
    it('escalates from BREAKDOWN_QUESTION to PROGRESSIVE_HINT and resets cleanly on recovery', () => {
      let state = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 13);

      // Streak 1
      state = InterviewStateMachineService.advanceState({ ...state, turns: 1 }, { score: 30, difficultyTier: 'medium' });
      expect(state.scaffoldingAction).toBe('NONE');

      // Streak 2 -> BREAKDOWN_QUESTION
      state = InterviewStateMachineService.advanceState({ ...state, turns: 2 }, { score: 30, difficultyTier: 'medium' });
      expect(state.scaffoldingAction).toBe('BREAKDOWN_QUESTION');
      expect(state.scaffoldingActive).toBe(true);

      // Streak 3 -> PROGRESSIVE_HINT
      state = InterviewStateMachineService.advanceState({ ...state, turns: 3 }, { score: 30, difficultyTier: 'medium' });
      expect(state.scaffoldingAction).toBe('PROGRESSIVE_HINT');
      expect(state.scaffoldingActive).toBe(true);

      // Streak 4 -> PROGRESSIVE_HINT
      state = InterviewStateMachineService.advanceState({ ...state, turns: 4 }, { score: 30, difficultyTier: 'medium' });
      expect(state.scaffoldingAction).toBe('PROGRESSIVE_HINT');

      // Recovery: Candidate answers with score 65 (>= 40)
      state = InterviewStateMachineService.advanceState({ ...state, turns: 5 }, { score: 65, difficultyTier: 'medium' });
      expect(state.consecutiveLowScores).toBe(0);
      expect(state.scaffoldingActive).toBe(false);
      expect(state.scaffoldingAction).toBe('NONE');
      expect(state.shouldExtendTechnical).toBe(false);
      // skipChallenge remains true (candidate had previous severe struggles)
      expect(state.skipChallenge).toBe(true);
    });
  });

  describe('Adversarial 8: Challenge Stage Skipping Under Proportional Pacing', () => {
    it('intercepts proportional challenge stage and routes struggling candidate to followup with pacing_skip_challenge', () => {
      let state = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 13);

      // Trigger low score streak
      state = InterviewStateMachineService.advanceState({ ...state, turns: 1 }, { score: 30, difficultyTier: 'medium' });
      state = InterviewStateMachineService.advanceState({ ...state, turns: 2 }, { score: 30, difficultyTier: 'medium' });
      expect(state.skipChallenge).toBe(true);

      // Jump to turn 10 of 13 (normally 75% challenge threshold)
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 10 },
        { score: 60, difficultyTier: 'medium' }
      );

      // Must remain in followup instead of advancing to challenge
      expect(state.stage).toBe('followup');
      expect(state.transitionReason).toBe('pacing_skip_challenge');
    });
  });

  describe('Adversarial 9: High-Score Early Challenge Acceleration Across Tiers', () => {
    it('triggers early challenge when candidate scores >=85 on 3 consecutive non-trivial tiers (medium, hard, staff_architectural)', () => {
      let state = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 13);

      state = InterviewStateMachineService.advanceState({ ...state, turns: 1 }, { score: 85, difficultyTier: 'medium' });
      expect(state.consecutiveHighScores).toBe(1);

      state = InterviewStateMachineService.advanceState({ ...state, turns: 2 }, { score: 80, difficultyTier: 'hard' });
      // 80 on hard normalizes to Math.min(100, Math.round(80 * 1.15)) = 92 >= 85
      expect(state.consecutiveHighScores).toBe(2);

      state = InterviewStateMachineService.advanceState({ ...state, turns: 3 }, { score: 75, difficultyTier: 'staff_architectural' });
      // 75 on staff_architectural normalizes to Math.min(100, Math.round(75 * 1.25)) = 94 >= 85
      expect(state.consecutiveHighScores).toBe(3);

      // At turn 3 of 13, normally technical stage, but accelerated to challenge!
      expect(state.stage).toBe('challenge');
      expect(state.transitionReason).toBe('sustained_high_scores_early_challenge');
    });
  });

  describe('Adversarial 10: Technical Stage Extension Count Limit', () => {
    it('caps technical stage extension at 2 turns before allowing progression to followup', () => {
      let state = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 13);

      // Low score streak established in warmup & technical
      // Turn 1..6 progress sequentially through warmup into technical
      for (let turn = 1; turn <= 6; turn++) {
        state = InterviewStateMachineService.advanceState(
          { ...state, turns: turn },
          { score: 30, difficultyTier: 'medium' }
        );
      }
      expect(state.stage).toBe('technical');
      expect(state.consecutiveLowScores).toBeGreaterThanOrEqual(2);
      expect(state.extendedTurnsCount).toBe(0);

      // Turn 7 of 13 is normally proportional followup threshold (50%)
      // First extension turn (extendedTurnsCount becomes 1)
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 7 },
        { score: 30, difficultyTier: 'medium' }
      );
      expect(state.stage).toBe('technical');
      expect(state.transitionReason).toBe('consecutive_low_scores_scaffolding_extension');
      expect(state.extendedTurnsCount).toBe(1);

      // Second extension turn (extendedTurnsCount becomes 2)
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 8 },
        { score: 30, difficultyTier: 'medium' }
      );
      expect(state.stage).toBe('technical');
      expect(state.transitionReason).toBe('consecutive_low_scores_scaffolding_extension');
      expect(state.extendedTurnsCount).toBe(2);

      // Third turn in followup territory (extendedTurnsCount is already 2 => extension cap reached)
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 9 },
        { score: 30, difficultyTier: 'medium' }
      );
      expect(state.stage).toBe('followup'); // Allowed to transition to followup
    });
  });

  describe('Adversarial 11: Dynamic Feature Flag Disabled Baseline', () => {
    it('operates purely on proportional thresholds with zero adaptive logic when feature flag is OFF', () => {
      process.env.FEATURE_FLAG_ADAPTIVE_STATE_MACHINE = 'false';

      let state = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 13);

      // Candidate scores low continuously
      state = InterviewStateMachineService.advanceState({ ...state, turns: 1 }, { score: 10, difficultyTier: 'medium' });
      state = InterviewStateMachineService.advanceState({ ...state, turns: 2 }, { score: 10, difficultyTier: 'medium' });

      // In legacy mode, low scores should NOT trigger scaffolding or challenge skip
      expect(state.scaffoldingActive).toBe(false);
      expect(state.scaffoldingAction).toBe('NONE');
      expect(state.skipChallenge).toBe(false);

      // Proportional challenge round reached at turn 10
      state = InterviewStateMachineService.advanceState({ ...state, turns: 10 }, { score: 10, difficultyTier: 'medium' });
      expect(state.stage).toBe('challenge');
      expect(state.transitionReason).toBe('turn_threshold_challenge');
    });
  });
});
