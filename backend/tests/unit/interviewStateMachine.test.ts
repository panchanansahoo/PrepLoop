import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  InterviewStateMachineService,
  normalizeScoreByDifficulty,
  areDifficultiesComparable,
  isTurnExcludedFromStreaks,
  isAdaptivePacingEnabled,
} from '../../services/interviewStateMachine.js';

describe('InterviewStateMachineService', () => {
  describe('buildStagePlan', () => {
    it('builds valid stage plans for DSA, Behavioral, HR, and System Design', () => {
      const dsaPlan = InterviewStateMachineService.buildStagePlan('dsa');
      expect(Array.isArray(dsaPlan)).toBe(true);
      expect(dsaPlan[0].key).toBe('intake');

      const behavioralPlan = InterviewStateMachineService.buildStagePlan('behavioral');
      expect(behavioralPlan[2].label).toBe('Story Deep-Dive');

      const hrPlan = InterviewStateMachineService.buildStagePlan('hr');
      expect(Array.isArray(hrPlan)).toBe(true);
      expect(hrPlan.length).toBeGreaterThanOrEqual(5);
      expect(hrPlan.some(s => s.key === 'technical')).toBe(true);

      const sdPlan = InterviewStateMachineService.buildStagePlan('system_design');
      expect(Array.isArray(sdPlan)).toBe(true);
      expect(
        sdPlan.some(s => s.label.toLowerCase().includes('architecture') || s.label.toLowerCase().includes('design'))
      ).toBe(true);
    });
  });

  describe('Proportional Stage Transitions (13 Questions)', () => {
    it('advances stages accurately across a 13-question session', () => {
      const stateFor13 = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 13);
      expect(stateFor13.stage).toBe('intake');
      expect(stateFor13.totalQuestions).toBe(13);

      const warmup13 = InterviewStateMachineService.advanceState({ ...stateFor13, turns: 1 });
      expect(warmup13.stage).toBe('warmup');

      const tech13 = InterviewStateMachineService.advanceState({ ...warmup13, turns: 3 });
      expect(tech13.stage).toBe('technical');

      const followup13 = InterviewStateMachineService.advanceState({ ...tech13, turns: 7 });
      expect(followup13.stage).toBe('followup');

      const challenge13 = InterviewStateMachineService.advanceState({ ...followup13, turns: 10 });
      expect(challenge13.stage).toBe('challenge');

      const feedback13 = InterviewStateMachineService.advanceState({ ...challenge13, turns: 12 });
      expect(feedback13.stage).toBe('feedback');
    });
  });

  describe('Compressed Stage Transitions (5 Questions)', () => {
    it('properly compresses stages for rapid 5-question sessions', () => {
      const stateFor5 = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 5);
      expect(stateFor5.totalQuestions).toBe(5);

      const tech5 = InterviewStateMachineService.advanceState({ ...stateFor5, turns: 1 });
      expect(tech5.stage).toBe('technical');

      const followup5 = InterviewStateMachineService.advanceState({ ...tech5, turns: 3 });
      expect(followup5.stage).toBe('followup');

      const challenge5 = InterviewStateMachineService.advanceState({ ...followup5, turns: 4 });
      expect(challenge5.stage).toBe('challenge');

      const feedback5 = InterviewStateMachineService.advanceState({ ...challenge5, turns: 5 });
      expect(feedback5.stage).toBe('feedback');
    });
  });

  describe('Backward Compatibility & Stage Directives', () => {
    it('supports legacy state without totalQuestions', () => {
      const legacyState = InterviewStateMachineService.createInitialState('dsa', 'medium');
      const legacyTech = InterviewStateMachineService.advanceState({ ...legacyState, turns: 3 });
      expect(legacyTech.stage).toBe('technical');

      const legacyFeedback = InterviewStateMachineService.advanceState({ ...legacyTech, turns: 12 });
      expect(legacyFeedback.stage).toBe('feedback');
    });

    it('generates non-empty stage directives for HR and System Design', () => {
      const hrDirective = InterviewStateMachineService.buildStageDirective('technical', 'hr');
      expect(typeof hrDirective).toBe('string');
      expect(hrDirective.length).toBeGreaterThan(10);

      const sdDirective = InterviewStateMachineService.buildStageDirective('technical', 'system_design');
      expect(typeof sdDirective).toBe('string');
      expect(sdDirective.length).toBeGreaterThan(10);
    });
  });

  describe('Adaptive Difficulty Engine (Track 1.1)', () => {
    it('steps up difficulty when scores demonstrate mastery', () => {
      const result = InterviewStateMachineService.computeAdaptiveDifficulty({
        currentDifficulty: 'medium',
        scoreHistory: [85, 88],
      });
      expect(result.direction).toBe('step_up');
      expect(result.difficulty).toBe('hard');
      expect(result.recommendedDifficulty).toBe('hard');
    });

    it('steps down difficulty when candidate struggles or gets stuck', () => {
      const result = InterviewStateMachineService.computeAdaptiveDifficulty({
        currentDifficulty: 'medium',
        scoreHistory: [40],
        stuckCount: 2,
      });
      expect(result.direction).toBe('step_down');
      expect(result.difficulty).toBe('easy');
      expect(result.recommendedDifficulty).toBe('easy');
    });

    it('maintains difficulty on steady performance', () => {
      const result = InterviewStateMachineService.computeAdaptiveDifficulty({
        currentDifficulty: 'medium',
        scoreHistory: [70],
      });
      expect(result.direction).toBe('maintain');
      expect(result.difficulty).toBe('medium');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // MILESTONE 2: ADAPTIVE STATE MACHINE PACING & CANDIDATE SCAFFOLDING
  // ══════════════════════════════════════════════════════════════════════════

  describe('Milestone 2: Legacy Baseline Behavior (Feature Flag OFF)', () => {
    let originalFlag1: string | undefined;
    let originalFlag2: string | undefined;

    beforeEach(() => {
      originalFlag1 = process.env.FEATURE_FLAG_ADAPTIVE_STATE_MACHINE;
      originalFlag2 = process.env.FEATURE_AI_INTERVIEW_ADAPTIVE_PACING;
      delete process.env.FEATURE_FLAG_ADAPTIVE_STATE_MACHINE;
      delete process.env.FEATURE_AI_INTERVIEW_ADAPTIVE_PACING;
    });

    afterEach(() => {
      if (originalFlag1 === undefined) {
        delete process.env.FEATURE_FLAG_ADAPTIVE_STATE_MACHINE;
      } else {
        process.env.FEATURE_FLAG_ADAPTIVE_STATE_MACHINE = originalFlag1;
      }
      if (originalFlag2 === undefined) {
        delete process.env.FEATURE_AI_INTERVIEW_ADAPTIVE_PACING;
      } else {
        process.env.FEATURE_AI_INTERVIEW_ADAPTIVE_PACING = originalFlag2;
      }
    });

    it('does not trigger adaptive extensions or scaffolding when flag is OFF', () => {
      const initial = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 13);
      // Even with 2 consecutive low scores, flag is OFF
      const turn3 = InterviewStateMachineService.advanceState({ ...initial, turns: 3, score: 20 });
      const turn4 = InterviewStateMachineService.advanceState({ ...turn3, turns: 4, score: 25 });

      expect(turn4.scaffoldingActive).toBe(false);
      expect(turn4.scaffoldingAction).toBe('NONE');
      expect(turn4.skipChallenge).toBe(false);
      expect(turn4.stage).toBe('technical');
    });

    it('does not accelerate to challenge on high scores when flag is OFF', () => {
      const initial = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 13);
      const turn3 = InterviewStateMachineService.advanceState({ ...initial, turns: 3, score: 95, difficulty: 'hard' });
      const turn4 = InterviewStateMachineService.advanceState({ ...turn3, turns: 4, score: 95, difficulty: 'hard' });
      const turn5 = InterviewStateMachineService.advanceState({ ...turn4, turns: 5, score: 95, difficulty: 'hard' });

      // In 13Q, turn 5 is ratio 5/13 = 38% -> technical; not accelerated to challenge
      expect(turn5.stage).toBe('technical');
      expect(turn5.transitionReason).toBe('remain_technical');
    });

    it('preserves exact legacy transition reasons when flag is OFF', () => {
      const initial = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 13);
      const warmup = InterviewStateMachineService.advanceState({ ...initial, turns: 1 });
      expect(warmup.transitionReason).toBe('post_intake_transition');

      const tech = InterviewStateMachineService.advanceState({ ...warmup, turns: 3 });
      expect(tech.transitionReason).toBe('turn_threshold_technical');

      const followup = InterviewStateMachineService.advanceState({ ...tech, turns: 7 });
      expect(followup.transitionReason).toBe('turn_threshold_followup');

      const challenge = InterviewStateMachineService.advanceState({ ...followup, turns: 10 });
      expect(challenge.transitionReason).toBe('turn_threshold_challenge');

      const feedback = InterviewStateMachineService.advanceState({ ...challenge, turns: 12 });
      expect(feedback.transitionReason).toBe('final_turn_threshold');
    });
  });

  describe('Milestone 2: Dynamic Runtime Feature Flag Activation (Feature 14)', () => {
    let originalFlag1: string | undefined;
    let originalFlag2: string | undefined;

    beforeEach(() => {
      originalFlag1 = process.env.FEATURE_FLAG_ADAPTIVE_STATE_MACHINE;
      originalFlag2 = process.env.FEATURE_AI_INTERVIEW_ADAPTIVE_PACING;
      delete process.env.FEATURE_FLAG_ADAPTIVE_STATE_MACHINE;
      delete process.env.FEATURE_AI_INTERVIEW_ADAPTIVE_PACING;
    });

    afterEach(() => {
      if (originalFlag1 === undefined) {
        delete process.env.FEATURE_FLAG_ADAPTIVE_STATE_MACHINE;
      } else {
        process.env.FEATURE_FLAG_ADAPTIVE_STATE_MACHINE = originalFlag1;
      }
      if (originalFlag2 === undefined) {
        delete process.env.FEATURE_AI_INTERVIEW_ADAPTIVE_PACING;
      } else {
        process.env.FEATURE_AI_INTERVIEW_ADAPTIVE_PACING = originalFlag2;
      }
    });

    it('evaluates flag dynamically at call time via FEATURE_FLAG_ADAPTIVE_STATE_MACHINE', () => {
      expect(isAdaptivePacingEnabled()).toBe(false);

      process.env.FEATURE_FLAG_ADAPTIVE_STATE_MACHINE = 'true';
      expect(isAdaptivePacingEnabled()).toBe(true);

      process.env.FEATURE_FLAG_ADAPTIVE_STATE_MACHINE = 'false';
      expect(isAdaptivePacingEnabled()).toBe(false);
    });

    it('supports alias flag FEATURE_AI_INTERVIEW_ADAPTIVE_PACING', () => {
      expect(isAdaptivePacingEnabled()).toBe(false);

      process.env.FEATURE_AI_INTERVIEW_ADAPTIVE_PACING = 'true';
      expect(isAdaptivePacingEnabled()).toBe(true);

      process.env.FEATURE_AI_INTERVIEW_ADAPTIVE_PACING = '0';
      expect(isAdaptivePacingEnabled()).toBe(false);
    });

    it('allows options.forceEnabled to override environment flag in both directions', () => {
      process.env.FEATURE_FLAG_ADAPTIVE_STATE_MACHINE = 'false';
      expect(isAdaptivePacingEnabled({ forceEnabled: true })).toBe(true);

      process.env.FEATURE_FLAG_ADAPTIVE_STATE_MACHINE = 'true';
      expect(isAdaptivePacingEnabled({ forceEnabled: false })).toBe(false);
    });
  });

  describe('Milestone 2: Difficulty Normalization & Easy-Tier Immunity (Feature 9)', () => {
    it('normalizes scores by difficulty tier according to exact formula', () => {
      // Easy tier: multiplier 0.70, cap 70
      expect(normalizeScoreByDifficulty(100, 'easy')).toBe(70);
      expect(normalizeScoreByDifficulty(80, 'easy')).toBe(56);
      expect(normalizeScoreByDifficulty(50, 'easy')).toBe(35);
      expect(normalizeScoreByDifficulty(0, 'easy')).toBe(0);

      // Medium tier: multiplier 1.00
      expect(normalizeScoreByDifficulty(100, 'medium')).toBe(100);
      expect(normalizeScoreByDifficulty(85, 'medium')).toBe(85);
      expect(normalizeScoreByDifficulty(40, 'medium')).toBe(40);
      expect(normalizeScoreByDifficulty(0, 'medium')).toBe(0);

      // Hard tier: multiplier 1.15, cap 100
      expect(normalizeScoreByDifficulty(100, 'hard')).toBe(100);
      expect(normalizeScoreByDifficulty(80, 'hard')).toBe(92);
      expect(normalizeScoreByDifficulty(74, 'hard')).toBe(85); // 74 * 1.15 = 85.1 -> 85
      expect(normalizeScoreByDifficulty(30, 'hard')).toBe(35); // 30 * 1.15 = 34.5 -> 35

      // Staff Architectural tier: multiplier 1.25, cap 100
      expect(normalizeScoreByDifficulty(100, 'staff_architectural')).toBe(100);
      expect(normalizeScoreByDifficulty(80, 'staff_architectural')).toBe(100);
      expect(normalizeScoreByDifficulty(70, 'staff_architectural')).toBe(88); // 70 * 1.25 = 87.5 -> 88

      // Edge cases: null, undefined, non-finite, clamped
      expect(normalizeScoreByDifficulty(null, 'medium')).toBeNull();
      expect(normalizeScoreByDifficulty(undefined, 'medium')).toBeNull();
      expect(normalizeScoreByDifficulty('not_a_number', 'medium')).toBeNull();
      expect(normalizeScoreByDifficulty(-10, 'medium')).toBe(0);
      expect(normalizeScoreByDifficulty(150, 'medium')).toBe(100);
    });

    it('guarantees high scores on easy questions NEVER trigger or increment consecutiveHighScores', () => {
      const initial = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 13);
      
      // 3 consecutive turns with 100 on easy questions
      const turn3 = InterviewStateMachineService.advanceState(
        { ...initial, turns: 3, score: 100, difficulty: 'easy' },
        { forceEnabled: true }
      );
      expect(turn3.consecutiveHighScores).toBe(0);

      const turn4 = InterviewStateMachineService.advanceState(
        { ...turn3, turns: 4, score: 100, difficulty: 'easy' },
        { forceEnabled: true }
      );
      expect(turn4.consecutiveHighScores).toBe(0);

      const turn5 = InterviewStateMachineService.advanceState(
        { ...turn4, turns: 5, score: 100, difficulty: 'easy' },
        { forceEnabled: true }
      );
      expect(turn5.consecutiveHighScores).toBe(0);
      // Stage must remain in technical, NOT accelerated to challenge
      expect(turn5.stage).toBe('technical');
      expect(turn5.transitionReason).toBe('remain_technical');
    });

    it('correctly assesses difficulty comparability (|tierIndex1 - tierIndex2| <= 1)', () => {
      expect(areDifficultiesComparable('easy', 'easy')).toBe(true);
      expect(areDifficultiesComparable('easy', 'medium')).toBe(true);
      expect(areDifficultiesComparable('medium', 'hard')).toBe(true);
      expect(areDifficultiesComparable('hard', 'staff_architectural')).toBe(true);

      // Distance >= 2 is not comparable
      expect(areDifficultiesComparable('easy', 'hard')).toBe(false);
      expect(areDifficultiesComparable('easy', 'staff_architectural')).toBe(false);
      expect(areDifficultiesComparable('medium', 'staff_architectural')).toBe(false);
    });
  });

  describe('Milestone 2: Turn Hygiene & Streak Calculation (Feature 12)', () => {
    it('identifies excluded turns correctly', () => {
      expect(isTurnExcludedFromStreaks({ isSkipped: true })).toBe(true);
      expect(isTurnExcludedFromStreaks({ answerType: 'skipped' })).toBe(true);
      expect(isTurnExcludedFromStreaks({ isClarification: true })).toBe(true);
      expect(isTurnExcludedFromStreaks({ answerType: 'clarification' })).toBe(true);
      expect(isTurnExcludedFromStreaks({ isUnscored: true })).toBe(true);
      expect(isTurnExcludedFromStreaks({ score: null })).toBe(true);
      expect(isTurnExcludedFromStreaks({ score: undefined })).toBe(true);
      expect(isTurnExcludedFromStreaks({ score: 'NaN' })).toBe(true);

      // Scored turns are not excluded
      expect(isTurnExcludedFromStreaks({ score: 75 })).toBe(false);
      expect(isTurnExcludedFromStreaks({ score: 0 })).toBe(false);
    });

    it('preserves existing low and high streaks across skipped, clarification, and unscored turns', () => {
      const stateWithStreak = {
        ...InterviewStateMachineService.createInitialState('dsa', 'medium', null, 13),
        turns: 4,
        stage: 'technical',
        consecutiveLowScores: 1,
        consecutiveHighScores: 2,
        lastScoredDifficulty: 'medium',
      };

      // 1. Skipped turn preserves streaks
      const afterSkipped = InterviewStateMachineService.advanceState(
        { ...stateWithStreak, turns: 5, isSkipped: true },
        { forceEnabled: true }
      );
      expect(afterSkipped.consecutiveLowScores).toBe(1);
      expect(afterSkipped.consecutiveHighScores).toBe(2);
      expect(afterSkipped.lastScoredDifficulty).toBe('medium');

      // 2. Clarification turn preserves streaks
      const afterClarification = InterviewStateMachineService.advanceState(
        { ...afterSkipped, turns: 6, answerType: 'clarification', score: null },
        { forceEnabled: true }
      );
      expect(afterClarification.consecutiveLowScores).toBe(1);
      expect(afterClarification.consecutiveHighScores).toBe(2);

      // 3. Unscored turn preserves streaks
      const afterUnscored = InterviewStateMachineService.advanceState(
        { ...afterClarification, turns: 7, score: null },
        { forceEnabled: true }
      );
      expect(afterUnscored.consecutiveLowScores).toBe(1);
      expect(afterUnscored.consecutiveHighScores).toBe(2);
    });

    it('neutral scores (40 <= score < 85) reset both streaks to 0', () => {
      const stateWithStreak = {
        ...InterviewStateMachineService.createInitialState('dsa', 'medium', null, 13),
        turns: 4,
        stage: 'technical',
        consecutiveLowScores: 2,
        consecutiveHighScores: 2,
      };

      const afterNeutral = InterviewStateMachineService.advanceState(
        { ...stateWithStreak, turns: 5, score: 65, difficulty: 'medium' },
        { forceEnabled: true }
      );
      expect(afterNeutral.consecutiveLowScores).toBe(0);
      expect(afterNeutral.consecutiveHighScores).toBe(0);
    });
  });

  describe('Milestone 2: Low-Score Stage Extension & Scaffolding Triggers (Feature 10)', () => {
    it('activates BREAKDOWN_QUESTION scaffolding and flags skipChallenge on 2 consecutive low scores', () => {
      const initial = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 13);

      // Turn 3: Technical Q1 score 35 (medium) -> streak 1
      const turn3 = InterviewStateMachineService.advanceState(
        { ...initial, turns: 3, score: 35, difficulty: 'medium' },
        { forceEnabled: true }
      );
      expect(turn3.consecutiveLowScores).toBe(1);
      expect(turn3.scaffoldingActive).toBe(false);
      expect(turn3.skipChallenge).toBe(false);

      // Turn 4: Technical Q2 score 30 (medium) -> streak 2
      const turn4 = InterviewStateMachineService.advanceState(
        { ...turn3, turns: 4, score: 30, difficulty: 'medium' },
        { forceEnabled: true }
      );
      expect(turn4.consecutiveLowScores).toBe(2);
      expect(turn4.scaffoldingActive).toBe(true);
      expect(turn4.scaffoldingAction).toBe('BREAKDOWN_QUESTION');
      expect(turn4.skipChallenge).toBe(true);
      expect(turn4.shouldExtendTechnical).toBe(true);
      expect(turn4.stage).toBe('technical');
      expect(turn4.transitionReason).toBe('consecutive_low_scores_scaffolding_extension');
    });

    it('escalates to PROGRESSIVE_HINT scaffolding on 3 consecutive low scores', () => {
      const initial = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 13);
      const turn3 = InterviewStateMachineService.advanceState(
        { ...initial, turns: 3, score: 35, difficulty: 'medium' },
        { forceEnabled: true }
      );
      const turn4 = InterviewStateMachineService.advanceState(
        { ...turn3, turns: 4, score: 30, difficulty: 'medium' },
        { forceEnabled: true }
      );
      const turn5 = InterviewStateMachineService.advanceState(
        { ...turn4, turns: 5, score: 25, difficulty: 'medium' },
        { forceEnabled: true }
      );

      expect(turn5.consecutiveLowScores).toBe(3);
      expect(turn5.scaffoldingActive).toBe(true);
      expect(turn5.scaffoldingAction).toBe('PROGRESSIVE_HINT');
      expect(turn5.transitionReason).toBe('consecutive_low_scores_scaffolding_extension');
    });

    it('extends technical stage past normal followup boundary for struggling candidates', () => {
      const initial = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 13);
      let state = initial;
      // Turns 3-6: candidate struggles
      for (let t = 3; t <= 6; t++) {
        state = InterviewStateMachineService.advanceState(
          { ...state, turns: t, score: 30, difficulty: 'medium' },
          { forceEnabled: true }
        );
      }

      // Turn 7 would normally be followup (54% >= 50%)
      // Because candidate has consecutive low scores, technical stage is extended!
      const turn7 = InterviewStateMachineService.advanceState(
        { ...state, turns: 7, score: 30, difficulty: 'medium' },
        { forceEnabled: true }
      );
      expect(turn7.stage).toBe('technical');
      expect(turn7.transitionReason).toBe('consecutive_low_scores_scaffolding_extension');
      expect(turn7.extendedTurnsCount).toBe(1);
    });

    it('deactivates active scaffolding on recovery while preserving skipChallenge', () => {
      const initial = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 13);
      const turn3 = InterviewStateMachineService.advanceState(
        { ...initial, turns: 3, score: 30, difficulty: 'medium' },
        { forceEnabled: true }
      );
      const turn4 = InterviewStateMachineService.advanceState(
        { ...turn3, turns: 4, score: 30, difficulty: 'medium' },
        { forceEnabled: true }
      );
      expect(turn4.scaffoldingActive).toBe(true);
      expect(turn4.skipChallenge).toBe(true);

      // Turn 5: Candidate recovers with score 75
      const turn5 = InterviewStateMachineService.advanceState(
        { ...turn4, turns: 5, score: 75, difficulty: 'medium' },
        { forceEnabled: true }
      );
      expect(turn5.consecutiveLowScores).toBe(0);
      expect(turn5.scaffoldingActive).toBe(false);
      expect(turn5.scaffoldingAction).toBe('NONE');
      expect(turn5.shouldExtendTechnical).toBe(false);
      expect(turn5.skipChallenge).toBe(true); // skipChallenge is preserved!
    });

    it('resets low streak when difficulty is not comparable', () => {
      const initial = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 13);
      // Turn 3: score 30 on staff_architectural (tierIndex = 3)
      const turn3 = InterviewStateMachineService.advanceState(
        { ...initial, turns: 3, score: 30, difficulty: 'staff_architectural' },
        { forceEnabled: true }
      );
      expect(turn3.consecutiveLowScores).toBe(1);

      // Turn 4: score 30 on easy (tierIndex = 0). Distance = 3 > 1: NOT comparable
      const turn4 = InterviewStateMachineService.advanceState(
        { ...turn3, turns: 4, score: 30, difficulty: 'easy' },
        { forceEnabled: true }
      );
      // Low streak resets to 1 instead of 2; scaffolding is not triggered
      expect(turn4.consecutiveLowScores).toBe(1);
      expect(turn4.scaffoldingActive).toBe(false);
      expect(turn4.skipChallenge).toBe(false);
    });

    it('provides specialized interviewer directives for breakdown and hints', () => {
      const breakdownDirective = InterviewStateMachineService.buildStageDirective('technical', 'dsa', {
        scaffoldingAction: 'BREAKDOWN_QUESTION',
      });
      expect(breakdownDirective.toLowerCase()).toContain('break down');

      const hintDirective = InterviewStateMachineService.buildStageDirective('technical', 'dsa', {
        scaffoldingAction: 'PROGRESSIVE_HINT',
      });
      expect(hintDirective.toLowerCase()).toContain('hint');
    });
  });

  describe('Milestone 2: Challenge Stage Skipping (Feature 10)', () => {
    it('skips challenge stage and remains in followup with reason pacing_skip_challenge', () => {
      const stateWithSkip = {
        ...InterviewStateMachineService.createInitialState('dsa', 'medium', null, 13),
        turns: 9,
        stage: 'followup',
        skipChallenge: true,
      };

      // Turn 10 of 13: Ratio 10/13 = 77% (normally enters 'challenge')
      // Because skipChallenge is true, it intercepts challenge and remains in followup!
      const turn10 = InterviewStateMachineService.advanceState(
        { ...stateWithSkip, turns: 10, score: 65, difficulty: 'medium' },
        { forceEnabled: true }
      );
      expect(turn10.stage).toBe('followup');
      expect(turn10.transitionReason).toBe('pacing_skip_challenge');

      // Turn 11 of 13: remains in followup
      const turn11 = InterviewStateMachineService.advanceState(
        { ...turn10, turns: 11, score: 60, difficulty: 'medium' },
        { forceEnabled: true }
      );
      expect(turn11.stage).toBe('followup');
      expect(turn11.transitionReason).toBe('pacing_skip_challenge');

      // Turn 12 of 13: Ratio 12/13 = 92% -> transitions directly to feedback
      const turn12 = InterviewStateMachineService.advanceState(
        { ...turn11, turns: 12, score: 60, difficulty: 'medium' },
        { forceEnabled: true }
      );
      expect(turn12.stage).toBe('feedback');
    });
  });

  describe('Milestone 2: High-Score Early Challenge Acceleration (Feature 11)', () => {
    it('advances early to challenge stage on 3 consecutive high scores on non-trivial questions', () => {
      const initial = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 13);

      // Turn 2: score 90 on hard (normalized = 100) -> streak 1
      const turn2 = InterviewStateMachineService.advanceState(
        { ...initial, turns: 2, score: 90, difficulty: 'hard' },
        { forceEnabled: true }
      );
      expect(turn2.consecutiveHighScores).toBe(1);

      // Turn 3: score 88 on medium (normalized = 88) -> streak 2
      const turn3 = InterviewStateMachineService.advanceState(
        { ...turn2, turns: 3, score: 88, difficulty: 'medium' },
        { forceEnabled: true }
      );
      expect(turn3.consecutiveHighScores).toBe(2);

      // Turn 4: score 95 on hard -> streak 3
      // In 13Q, turn 4 is 31% (normally technical). But 3 consecutive high scores accelerate early to challenge!
      const turn4 = InterviewStateMachineService.advanceState(
        { ...turn3, turns: 4, score: 95, difficulty: 'hard' },
        { forceEnabled: true }
      );
      expect(turn4.consecutiveHighScores).toBe(3);
      expect(turn4.stage).toBe('challenge');
      expect(turn4.transitionReason).toBe('sustained_high_scores_early_challenge');

      // Assert stageHistory captured the early acceleration transition
      const lastHistory = turn4.stageHistory[turn4.stageHistory.length - 1];
      expect(lastHistory.stage).toBe('challenge');
      expect(lastHistory.reason).toBe('sustained_high_scores_early_challenge');
    });

    it('qualifies for high-score streak when hard question score normalizes to >= 85', () => {
      const initial = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 13);
      // Raw score 74 on hard: 74 * 1.15 = 85.1 -> 85 >= 85
      const turn = InterviewStateMachineService.advanceState(
        { ...initial, turns: 2, score: 74, difficulty: 'hard' },
        { forceEnabled: true }
      );
      expect(turn.consecutiveHighScores).toBe(1);
    });
  });

  describe('Milestone 2: Inviolable Global Hard Ceiling Budget (Feature 13)', () => {
    it('unconditionally terminates to feedback when turns >= totalQuestions', () => {
      const stateWithExtension = {
        ...InterviewStateMachineService.createInitialState('dsa', 'medium', null, 13),
        turns: 12,
        stage: 'technical',
        consecutiveLowScores: 3,
        scaffoldingActive: true,
        scaffoldingAction: 'PROGRESSIVE_HINT',
        shouldExtendTechnical: true,
        skipChallenge: true,
      };

      // Turn 13 of 13 reaches the hard budget ceiling
      const turn13 = InterviewStateMachineService.advanceState(
        { ...stateWithExtension, turns: 13, score: 30, difficulty: 'medium' },
        { forceEnabled: true }
      );

      expect(turn13.stage).toBe('feedback');
      expect(turn13.isTerminated).toBe(true);
      expect(turn13.transitionReason).toBe('hard_turn_budget_ceiling_reached');
      expect(turn13.scaffoldingActive).toBe(false);
      expect(turn13.scaffoldingAction).toBe('NONE');
    });

    it('enforces hard ceiling on compressed 5-question interviews', () => {
      const stateFor5 = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 5);
      const turn5 = InterviewStateMachineService.advanceState(
        { ...stateFor5, turns: 5 },
        { forceEnabled: true }
      );

      expect(turn5.stage).toBe('feedback');
      expect(turn5.isTerminated).toBe(true);
      expect(turn5.transitionReason).toBe('hard_turn_budget_ceiling_reached');
    });

    it('keeps session terminated if turns exceed totalQuestions', () => {
      const stateFor13 = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 13);
      const turn14 = InterviewStateMachineService.advanceState(
        { ...stateFor13, turns: 14 },
        { forceEnabled: true }
      );

      expect(turn14.stage).toBe('feedback');
      expect(turn14.isTerminated).toBe(true);
      expect(turn14.transitionReason).toBe('hard_turn_budget_ceiling_reached');
    });
  });

  describe('Milestone 2: End-to-End Multi-Turn Simulation Scenarios', () => {
    it('simulates a struggling candidate across a full 13-question session', () => {
      let state = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 13);
      expect(state.stage).toBe('intake');

      // Turn 1: Warmup (score 50)
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 1, score: 50, difficulty: 'medium' },
        { forceEnabled: true }
      );
      expect(state.stage).toBe('warmup');

      // Turn 2: Candidate asks a clarification question (turn hygiene check)
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 2, answerType: 'clarification', score: null },
        { forceEnabled: true }
      );
      expect(state.stage).toBe('warmup');

      // Turn 3: Technical Q1 (score 30, medium) -> low streak 1
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 3, score: 30, difficulty: 'medium' },
        { forceEnabled: true }
      );
      expect(state.stage).toBe('technical');
      expect(state.consecutiveLowScores).toBe(1);

      // Turn 4: Technical Q2 (score 35, medium) -> low streak 2: triggers scaffolding & skipChallenge
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 4, score: 35, difficulty: 'medium' },
        { forceEnabled: true }
      );
      expect(state.stage).toBe('technical');
      expect(state.consecutiveLowScores).toBe(2);
      expect(state.scaffoldingActive).toBe(true);
      expect(state.scaffoldingAction).toBe('BREAKDOWN_QUESTION');
      expect(state.skipChallenge).toBe(true);

      // Turn 5: Technical Q3 (score 32, medium) -> low streak 3: escalates to progressive hint
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 5, score: 32, difficulty: 'medium' },
        { forceEnabled: true }
      );
      expect(state.stage).toBe('technical');
      expect(state.consecutiveLowScores).toBe(3);
      expect(state.scaffoldingAction).toBe('PROGRESSIVE_HINT');

      // Turn 6: Technical Q4 (score 70, medium) -> candidate recovers! Scaffolding deactivated
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 6, score: 70, difficulty: 'medium' },
        { forceEnabled: true }
      );
      expect(state.stage).toBe('technical');
      expect(state.consecutiveLowScores).toBe(0);
      expect(state.scaffoldingActive).toBe(false);
      expect(state.skipChallenge).toBe(true); // Still true!

      // Turn 7: Followup (score 65)
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 7, score: 65, difficulty: 'medium' },
        { forceEnabled: true }
      );
      expect(state.stage).toBe('followup');

      // Turn 8: Followup (score 60)
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 8, score: 60, difficulty: 'medium' },
        { forceEnabled: true }
      );
      expect(state.stage).toBe('followup');

      // Turn 9: Skipped turn (turn hygiene check)
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 9, isSkipped: true },
        { forceEnabled: true }
      );
      expect(state.stage).toBe('followup');

      // Turn 10: Ratio 77% (normally challenge) -> challenge is skipped!
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 10, score: 65, difficulty: 'medium' },
        { forceEnabled: true }
      );
      expect(state.stage).toBe('followup');
      expect(state.transitionReason).toBe('pacing_skip_challenge');

      // Turn 11: Remains in followup
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 11, score: 65, difficulty: 'medium' },
        { forceEnabled: true }
      );
      expect(state.stage).toBe('followup');
      expect(state.transitionReason).toBe('pacing_skip_challenge');

      // Turn 12: Ratio 92% -> moves to feedback wrapup
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 12, score: 60, difficulty: 'medium' },
        { forceEnabled: true }
      );
      expect(state.stage).toBe('feedback');

      // Turn 13: Hard turn budget ceiling reached!
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 13, score: 60, difficulty: 'medium' },
        { forceEnabled: true }
      );
      expect(state.stage).toBe('feedback');
      expect(state.isTerminated).toBe(true);
      expect(state.transitionReason).toBe('hard_turn_budget_ceiling_reached');
    });

    it('simulates an advanced candidate with early challenge acceleration across 13 questions', () => {
      let state = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 13);

      // Turn 1: Warmup
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 1, score: 80, difficulty: 'medium' },
        { forceEnabled: true }
      );
      expect(state.stage).toBe('warmup');

      // Turn 2: Technical Q1 (score 90, hard) -> high streak 1
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 2, score: 90, difficulty: 'hard' },
        { forceEnabled: true }
      );
      expect(state.stage).toBe('warmup'); // turn 2 is still warmup proportionally
      expect(state.consecutiveHighScores).toBe(1);

      // Turn 3: Technical Q2 (score 92, hard) -> high streak 2
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 3, score: 92, difficulty: 'hard' },
        { forceEnabled: true }
      );
      expect(state.stage).toBe('technical');
      expect(state.consecutiveHighScores).toBe(2);

      // Turn 4: Technical Q3 (score 95, hard) -> high streak 3: EARLY CHALLENGE ACCELERATION!
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 4, score: 95, difficulty: 'hard' },
        { forceEnabled: true }
      );
      expect(state.consecutiveHighScores).toBe(3);
      expect(state.stage).toBe('challenge');
      expect(state.transitionReason).toBe('sustained_high_scores_early_challenge');

      // Turns 5-11: Candidate continues in challenge stage
      for (let t = 5; t <= 11; t++) {
        state = InterviewStateMachineService.advanceState(
          { ...state, turns: t, score: 85, difficulty: 'hard' },
          { forceEnabled: true }
        );
        expect(state.stage).toBe('challenge');
      }

      // Turn 12: Wrapup
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 12, score: 88, difficulty: 'hard' },
        { forceEnabled: true }
      );
      expect(state.stage).toBe('feedback');

      // Turn 13: Hard Budget Ceiling termination
      state = InterviewStateMachineService.advanceState(
        { ...state, turns: 13, score: 88, difficulty: 'hard' },
        { forceEnabled: true }
      );
      expect(state.stage).toBe('feedback');
      expect(state.isTerminated).toBe(true);
      expect(state.transitionReason).toBe('hard_turn_budget_ceiling_reached');
    });

    it('prevents candidates from gaming early challenge using easy questions', () => {
      let state = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 13);

      for (let t = 1; t <= 6; t++) {
        state = InterviewStateMachineService.advanceState(
          { ...state, turns: t, score: 100, difficulty: 'easy' },
          { forceEnabled: true }
        );
        // High streak must remain 0 and never accelerate to challenge
        expect(state.consecutiveHighScores).toBe(0);
        expect(state.stage).not.toBe('challenge');
      }
    });
  });
});


