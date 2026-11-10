import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  InterviewFollowUpRulesService,
  isRecoveryBranchingEnabled,
  QUALITATIVE_RECOVERY_PHRASES,
  RECOVERY_PHRASES,
  validatePhrasingHasZeroNumericLeaks,
  getQualitativeRecoveryPhrase,
  selectQualitativeRecoveryPhrase,
  calculateMomentum,
  isTurnExcludedFromRecovery,
  isSameTopic,
  DONT_KNOW_REGEX,
  CLARIFICATION_REGEX,
  OFF_TOPIC_REGEX,
} from '../../services/interviewFollowUpRules.js';
import { InterviewPromptService } from '../../services/interviewPromptService.js';

describe('Milestone 3: Recovery Branching & Momentum Tracking Unit Tests', () => {
  const originalEnvFlag = process.env.FEATURE_FLAG_RECOVERY_BRANCHING;
  const originalAliasFlag = process.env.FEATURE_AI_INTERVIEW_RECOVERY_BRANCHING;

  beforeEach(() => {
    delete process.env.FEATURE_FLAG_RECOVERY_BRANCHING;
    delete process.env.FEATURE_AI_INTERVIEW_RECOVERY_BRANCHING;
  });

  afterEach(() => {
    if (originalEnvFlag !== undefined) {
      process.env.FEATURE_FLAG_RECOVERY_BRANCHING = originalEnvFlag;
    } else {
      delete process.env.FEATURE_FLAG_RECOVERY_BRANCHING;
    }

    if (originalAliasFlag !== undefined) {
      process.env.FEATURE_AI_INTERVIEW_RECOVERY_BRANCHING = originalAliasFlag;
    } else {
      delete process.env.FEATURE_AI_INTERVIEW_RECOVERY_BRANCHING;
    }
  });

  // ── 1. Dynamic Feature Flag Lifecycle ──────────────────────────────────
  describe('1. Dynamic Feature Flag Lifecycle', () => {
    it('defaults to OFF (false) when env vars are absent', () => {
      expect(isRecoveryBranchingEnabled()).toBe(false);
    });

    it('enables dynamically via FEATURE_FLAG_RECOVERY_BRANCHING="true" or "1"', () => {
      process.env.FEATURE_FLAG_RECOVERY_BRANCHING = 'true';
      expect(isRecoveryBranchingEnabled()).toBe(true);

      process.env.FEATURE_FLAG_RECOVERY_BRANCHING = '1';
      expect(isRecoveryBranchingEnabled()).toBe(true);

      process.env.FEATURE_FLAG_RECOVERY_BRANCHING = 'false';
      expect(isRecoveryBranchingEnabled()).toBe(false);
    });

    it('enables dynamically via alias FEATURE_AI_INTERVIEW_RECOVERY_BRANCHING', () => {
      process.env.FEATURE_AI_INTERVIEW_RECOVERY_BRANCHING = 'true';
      expect(isRecoveryBranchingEnabled()).toBe(true);

      process.env.FEATURE_AI_INTERVIEW_RECOVERY_BRANCHING = '1';
      expect(isRecoveryBranchingEnabled()).toBe(true);

      process.env.FEATURE_AI_INTERVIEW_RECOVERY_BRANCHING = 'false';
      expect(isRecoveryBranchingEnabled()).toBe(false);
    });

    it('honors options.forceEnabled boolean override regardless of process.env', () => {
      process.env.FEATURE_FLAG_RECOVERY_BRANCHING = 'false';
      expect(isRecoveryBranchingEnabled({ forceEnabled: true })).toBe(true);

      process.env.FEATURE_FLAG_RECOVERY_BRANCHING = 'true';
      expect(isRecoveryBranchingEnabled({ forceEnabled: false })).toBe(false);
    });

    it('executes legacy follow-up logic when feature flag is OFF', () => {
      // Score jump 35 -> 70 on comparable difficulty would qualify for recovery if enabled
      const decision = InterviewFollowUpRulesService.decideBranch({
        analysis: { score: 70 },
        interviewContext: { previousScore: 35, turns: 2, currentDifficulty: 'medium', previousDifficulty: 'medium' },
        candidateResponse: 'I will use a two-pointer approach starting from both ends.',
      });

      expect(decision.nextAction).not.toBe('affirm_recovery');
      expect(decision.branchReason).not.toBe('genuine_recovery_detected');
      expect(decision.recoveryDetected).toBe(false);
      expect(decision.recoveryPhrase).toBeUndefined();
    });
  });

  // ── 2. Recovery Path Detection ─────────────────────────────────────────
  describe('2. Genuine Recovery Path Detection', () => {
    it('triggers affirm_recovery when previousScore < 50 and scoreDelta > 15', () => {
      const decision = InterviewFollowUpRulesService.decideBranch({
        analysis: { score: 68 },
        interviewContext: {
          previousScore: 38,
          turns: 3,
          currentDifficulty: 'medium',
          previousDifficulty: 'medium',
        },
        candidateResponse: 'Now I understand the constraint. We can maintain a min-heap to keep track of the k largest elements in O(N log K) time.',
        forceEnabled: true,
      });

      expect(decision.nextAction).toBe('affirm_recovery');
      expect(decision.branchReason).toBe('genuine_recovery_detected');
      expect(decision.recoveryDetected).toBe(true);
      expect(typeof decision.phrasing).toBe('string');
      expect(QUALITATIVE_RECOVERY_PHRASES).toContain(decision.phrasing);
    });

    it('extracts previousScore from scoreHistory if not in interviewContext', () => {
      const decision = InterviewFollowUpRulesService.decideBranch({
        analysis: { score: 72 },
        interviewContext: { turns: 3, currentDifficulty: 'medium' },
        scoreHistory: [
          { score: 60, turn: 1 },
          { score: 32, turn: 2 },
        ],
        candidateResponse: 'We can optimize space to O(1) by reusing the existing array as a visited marker.',
        forceEnabled: true,
      });

      expect(decision.nextAction).toBe('affirm_recovery');
      expect(decision.branchReason).toBe('genuine_recovery_detected');
      expect(decision.recoveryDetected).toBe(true);
    });
  });

  // ── 3. Exact Boundary Conditions ───────────────────────────────────────
  describe('3. Exact Boundary Conditions', () => {
    it('does NOT trigger recovery when previousScore is exactly 50 (must be < 50)', () => {
      const decision = InterviewFollowUpRulesService.decideBranch({
        analysis: { score: 80 },
        interviewContext: { previousScore: 50, turns: 2 },
        candidateResponse: 'Using dynamic programming, we memoize state transitions to achieve linear time.',
        forceEnabled: true,
      });

      expect(decision.nextAction).not.toBe('affirm_recovery');
      expect(decision.branchReason).not.toBe('genuine_recovery_detected');
      expect(decision.recoveryDetected).toBe(false);
    });

    it('triggers recovery when previousScore is 49 (< 50) with delta > 15', () => {
      const decision = InterviewFollowUpRulesService.decideBranch({
        analysis: { score: 66 }, // 66 - 49 = 17 > 15
        interviewContext: { previousScore: 49, turns: 2 },
        candidateResponse: 'By tracking prefix sums in a hash map, we find subarray sums in O(1) lookup time.',
        forceEnabled: true,
      });

      expect(decision.nextAction).toBe('affirm_recovery');
      expect(decision.branchReason).toBe('genuine_recovery_detected');
      expect(decision.recoveryDetected).toBe(true);
    });

    it('does NOT trigger recovery when scoreDelta is exactly 15 (must be > 15)', () => {
      const decision = InterviewFollowUpRulesService.decideBranch({
        analysis: { score: 49 }, // 49 - 34 = 15 (not strictly > 15)
        interviewContext: { previousScore: 34, turns: 2 },
        candidateResponse: 'We could check each element sequentially with a nested loop.',
        forceEnabled: true,
      });

      expect(decision.nextAction).not.toBe('affirm_recovery');
      expect(decision.branchReason).not.toBe('genuine_recovery_detected');
      expect(decision.recoveryDetected).toBe(false);
    });

    it('triggers recovery when scoreDelta is 16 (> 15)', () => {
      const decision = InterviewFollowUpRulesService.decideBranch({
        analysis: { score: 50 }, // 50 - 34 = 16 > 15
        interviewContext: { previousScore: 34, turns: 2 },
        candidateResponse: 'We can sort the input first to reduce time complexity from cubic to quadratic.',
        forceEnabled: true,
      });

      expect(decision.nextAction).toBe('affirm_recovery');
      expect(decision.branchReason).toBe('genuine_recovery_detected');
      expect(decision.recoveryDetected).toBe(true);
    });

    it('does NOT trigger recovery on Turn 1 baseline with uninitialized previousScore = 0', () => {
      const decision = InterviewFollowUpRulesService.decideBranch({
        analysis: { score: 75 },
        interviewContext: { turns: 1 },
        candidateResponse: 'Let us initialize two pointers and advance them toward each other.',
        forceEnabled: true,
      });

      expect(decision.nextAction).not.toBe('affirm_recovery');
      expect(decision.recoveryDetected).toBe(false);
      expect(decision.momentum).toBe('neutral');
    });
  });

  // ── 4. Topic & Difficulty Comparability ────────────────────────────────
  describe('4. Topic and Difficulty Comparability', () => {
    it('triggers recovery when topic matches even across different tiers', () => {
      const decision = InterviewFollowUpRulesService.decideBranch({
        analysis: { score: 75 },
        interviewContext: {
          previousScore: 30,
          turns: 3,
          topic: 'Distributed Caching',
          previousTopic: 'Distributed Caching',
          currentDifficulty: 'hard',
          previousDifficulty: 'easy',
        },
        candidateResponse: 'We should implement consistent hashing with virtual nodes to avoid hot spotting.',
        forceEnabled: true,
      });

      expect(decision.nextAction).toBe('affirm_recovery');
      expect(decision.branchReason).toBe('genuine_recovery_detected');
      expect(decision.recoveryDetected).toBe(true);
    });

    it('triggers recovery when difficulties are comparable (tier diff <= 1)', () => {
      // 'easy' (0) and 'medium' (1) -> |0 - 1| = 1 <= 1
      const decision = InterviewFollowUpRulesService.decideBranch({
        analysis: { score: 70 },
        interviewContext: {
          previousScore: 35,
          turns: 2,
          currentDifficulty: 'medium',
          previousDifficulty: 'easy',
        },
        candidateResponse: 'Using a sliding window helps keep time complexity strictly linear.',
        forceEnabled: true,
      });

      expect(decision.nextAction).toBe('affirm_recovery');
      expect(decision.branchReason).toBe('genuine_recovery_detected');
      expect(decision.recoveryDetected).toBe(true);
    });

    it('suppresses recovery when difficulty tiers diverge (tier diff >= 2) and topics differ', () => {
      // 'easy' (0) vs 'hard' (2) -> |0 - 2| = 2 > 1
      const decision = InterviewFollowUpRulesService.decideBranch({
        analysis: { score: 85 },
        interviewContext: {
          previousScore: 25,
          turns: 3,
          topic: 'Behavioral Teamwork',
          previousTopic: 'Advanced System Architecture',
          currentDifficulty: 'easy',
          previousDifficulty: 'hard',
        },
        candidateResponse: 'I scheduled a 1-on-1 meeting to discuss communication expectations and aligned on the sprint goals.',
        forceEnabled: true,
      });

      expect(decision.nextAction).not.toBe('affirm_recovery');
      expect(decision.recoveryDetected).toBe(false);
    });

    it('tests isSameTopic helper matching and substring logic', () => {
      expect(isSameTopic('Dynamic Programming', 'Dynamic Programming')).toBe(true);
      expect(isSameTopic('Graph Algorithms', 'graph algorithms')).toBe(true);
      expect(isSameTopic('Binary Search Trees', 'Binary Search')).toBe(true);
      expect(isSameTopic('System Design', 'Algorithms')).toBe(false);
      expect(isSameTopic(null, 'Algorithms')).toBe(false);
      expect(isSameTopic('Algorithms', undefined)).toBe(false);
    });
  });

  // ── 5. Exclusion Guards: "I don't know" ────────────────────────────────
  describe('5. Exclusion Guards: "I don\'t know" & Hedging', () => {
    it('suppresses recovery when candidate says "i don\'t know"', () => {
      const decision = InterviewFollowUpRulesService.decideBranch({
        analysis: { score: 70 },
        interviewContext: { previousScore: 30, turns: 2 },
        candidateResponse: 'I don\'t know the standard library method, but here is my approach.',
        forceEnabled: true,
      });

      expect(decision.nextAction).not.toBe('affirm_recovery');
      expect(decision.recoveryDetected).toBe(false);
    });

    it('suppresses recovery when candidate admits ignorance with "not sure"', () => {
      const decision = InterviewFollowUpRulesService.decideBranch({
        analysis: { score: 70 },
        interviewContext: { previousScore: 30, turns: 2 },
        candidateResponse: 'I am not sure how this performs on huge datasets.',
        forceEnabled: true,
      });

      expect(decision.nextAction).not.toBe('affirm_recovery');
      expect(decision.recoveryDetected).toBe(false);
    });

    it('suppresses recovery when candidate says "haven\'t implemented"', () => {
      const decision = InterviewFollowUpRulesService.decideBranch({
        analysis: { score: 70 },
        interviewContext: { previousScore: 30, turns: 2 },
        candidateResponse: 'I haven\'t implemented this specific tree rotation before.',
        forceEnabled: true,
      });

      expect(decision.nextAction).not.toBe('affirm_recovery');
      expect(decision.recoveryDetected).toBe(false);
    });

    it('suppresses recovery when answerType is "dont_know"', () => {
      const decision = InterviewFollowUpRulesService.decideBranch({
        analysis: { score: 70 },
        interviewContext: { previousScore: 30, turns: 2, answerType: 'dont_know' },
        candidateResponse: 'A valid technical explanation that was classified as dont_know.',
        forceEnabled: true,
      });

      expect(decision.nextAction).not.toBe('affirm_recovery');
      expect(decision.recoveryDetected).toBe(false);
    });

    it('verifies DONT_KNOW_REGEX against canonical patterns', () => {
      expect(DONT_KNOW_REGEX.test("I don't know")).toBe(true);
      expect(DONT_KNOW_REGEX.test("i dont know")).toBe(true);
      expect(DONT_KNOW_REGEX.test("I am not sure")).toBe(true);
      expect(DONT_KNOW_REGEX.test("I have no idea")).toBe(true);
      expect(DONT_KNOW_REGEX.test("haven't used Kafka")).toBe(true);
      expect(DONT_KNOW_REGEX.test("don't remember the exact syntax")).toBe(true);
      expect(DONT_KNOW_REGEX.test("can't recall")).toBe(true);
      expect(DONT_KNOW_REGEX.test("no clue")).toBe(true);
      expect(DONT_KNOW_REGEX.test("not familiar with it")).toBe(true);
      expect(DONT_KNOW_REGEX.test("haven't implemented")).toBe(true);
      expect(DONT_KNOW_REGEX.test("We can use an inverted index")).toBe(false);
    });
  });

  // ── 6. Exclusion Guards: Clarifying Questions ──────────────────────────
  describe('6. Exclusion Guards: Clarifying Questions', () => {
    it('suppresses recovery when candidate asks "Could you clarify..."', () => {
      const decision = InterviewFollowUpRulesService.decideBranch({
        analysis: { score: 68 },
        interviewContext: { previousScore: 30, turns: 2 },
        candidateResponse: 'Could you clarify if the input numbers are all positive?',
        forceEnabled: true,
      });

      expect(decision.nextAction).not.toBe('affirm_recovery');
      expect(decision.recoveryDetected).toBe(false);
    });

    it('suppresses recovery when candidate asks "Can we assume..."', () => {
      const decision = InterviewFollowUpRulesService.decideBranch({
        analysis: { score: 68 },
        interviewContext: { previousScore: 30, turns: 2 },
        candidateResponse: 'Can we assume the graph is connected?',
        forceEnabled: true,
      });

      expect(decision.nextAction).not.toBe('affirm_recovery');
      expect(decision.recoveryDetected).toBe(false);
    });

    it('suppresses recovery when candidate asks "Do you mean..."', () => {
      const decision = InterviewFollowUpRulesService.decideBranch({
        analysis: { score: 68 },
        interviewContext: { previousScore: 30, turns: 2 },
        candidateResponse: 'Do you mean in-memory or persisted on disk?',
        forceEnabled: true,
      });

      expect(decision.nextAction).not.toBe('affirm_recovery');
      expect(decision.recoveryDetected).toBe(false);
    });

    it('suppresses recovery when candidate asks "repeat the question"', () => {
      const decision = InterviewFollowUpRulesService.decideBranch({
        analysis: { score: 68 },
        interviewContext: { previousScore: 30, turns: 2 },
        candidateResponse: 'repeat the question please',
        forceEnabled: true,
      });

      expect(decision.nextAction).not.toBe('affirm_recovery');
      expect(decision.recoveryDetected).toBe(false);
    });

    it('suppresses recovery when isClarification flag or answerType is clarification', () => {
      const decision = InterviewFollowUpRulesService.decideBranch({
        analysis: { score: 70 },
        interviewContext: { previousScore: 30, turns: 2, isClarification: true },
        candidateResponse: 'Valid answer text that was flagged as clarification.',
        forceEnabled: true,
      });

      expect(decision.nextAction).not.toBe('affirm_recovery');
      expect(decision.recoveryDetected).toBe(false);
    });

    it('verifies CLARIFICATION_REGEX against canonical patterns', () => {
      expect(CLARIFICATION_REGEX.test('Could you explain that again?')).toBe(true);
      expect(CLARIFICATION_REGEX.test('Can you clarify the input?')).toBe(true);
      expect(CLARIFICATION_REGEX.test('Can we assume positive integers?')).toBe(true);
      expect(CLARIFICATION_REGEX.test('Are we allowed to modify the input array?')).toBe(true);
      expect(CLARIFICATION_REGEX.test('Should this be in-place?')).toBe(true);
      expect(CLARIFICATION_REGEX.test('Does the array fit in memory?')).toBe(true);
      expect(CLARIFICATION_REGEX.test('Can it contain duplicates?')).toBe(true);
      expect(CLARIFICATION_REGEX.test('Do you mean breadth-first?')).toBe(true);
      expect(CLARIFICATION_REGEX.test('What do you mean by high availability?')).toBe(true);
      expect(CLARIFICATION_REGEX.test('Would you prefer recursion?')).toBe(true);
      expect(CLARIFICATION_REGEX.test('repeat the requirements')).toBe(true);
      expect(CLARIFICATION_REGEX.test('The solution uses dynamic programming')).toBe(false);
    });
  });

  // ── 7. Exclusion Guards: Off-Topic Answers ────────────────────────────
  describe('7. Exclusion Guards: Off-Topic Answers', () => {
    it('suppresses recovery when candidate talks about hiking', () => {
      const decision = InterviewFollowUpRulesService.decideBranch({
        analysis: { score: 65 },
        interviewContext: { previousScore: 30, turns: 2 },
        candidateResponse: 'I was hiking with friends last weekend.',
        forceEnabled: true,
      });

      expect(decision.nextAction).not.toBe('affirm_recovery');
      expect(decision.recoveryDetected).toBe(false);
    });

    it('suppresses recovery when candidate talks about crypto/bitcoin/ethereum', () => {
      const decision = InterviewFollowUpRulesService.decideBranch({
        analysis: { score: 65 },
        interviewContext: { previousScore: 30, turns: 2 },
        candidateResponse: 'I bought some bitcoin and ethereum on an exchange.',
        forceEnabled: true,
      });

      expect(decision.nextAction).not.toBe('affirm_recovery');
      expect(decision.recoveryDetected).toBe(false);
    });

    it('suppresses recovery when candidate talks about weather or vacation', () => {
      const decision = InterviewFollowUpRulesService.decideBranch({
        analysis: { score: 65 },
        interviewContext: { previousScore: 30, turns: 2 },
        candidateResponse: 'The weather is great and I am planning my vacation.',
        forceEnabled: true,
      });

      expect(decision.nextAction).not.toBe('affirm_recovery');
      expect(decision.recoveryDetected).toBe(false);
    });

    it('suppresses recovery when answerType is off_topic', () => {
      const decision = InterviewFollowUpRulesService.decideBranch({
        analysis: { score: 70 },
        interviewContext: { previousScore: 30, turns: 2, answerType: 'off_topic' },
        candidateResponse: 'Some valid sounding technical words.',
        forceEnabled: true,
      });

      expect(decision.nextAction).not.toBe('affirm_recovery');
      expect(decision.recoveryDetected).toBe(false);
    });

    it('verifies OFF_TOPIC_REGEX against canonical patterns', () => {
      expect(OFF_TOPIC_REGEX.test('Went hiking yesterday')).toBe(true);
      expect(OFF_TOPIC_REGEX.test('Invested in crypto lately')).toBe(true);
      expect(OFF_TOPIC_REGEX.test('Bitcoin price went up')).toBe(true);
      expect(OFF_TOPIC_REGEX.test('Ethereum gas fees')).toBe(true);
      expect(OFF_TOPIC_REGEX.test('My laptop battery died')).toBe(true);
      expect(OFF_TOPIC_REGEX.test('My professor was telling a story')).toBe(true);
      expect(OFF_TOPIC_REGEX.test('Summer vacation plans')).toBe(true);
      expect(OFF_TOPIC_REGEX.test('Terrible weather outside')).toBe(true);
      expect(OFF_TOPIC_REGEX.test('We implement a hash table with bucket chaining')).toBe(false);
    });
  });

  // ── 8. Exclusion Guards: Skipped & Empty Turns ─────────────────────────
  describe('8. Exclusion Guards: Skipped & Empty Turns', () => {
    it('suppresses recovery when isSkipped is true', () => {
      const decision = InterviewFollowUpRulesService.decideBranch({
        analysis: { score: 70 },
        interviewContext: { previousScore: 30, turns: 2, isSkipped: true },
        candidateResponse: 'I would like to pass.',
        forceEnabled: true,
      });

      expect(decision.nextAction).not.toBe('affirm_recovery');
      expect(decision.recoveryDetected).toBe(false);
    });

    it('suppresses recovery when answerType is skipped', () => {
      const decision = InterviewFollowUpRulesService.decideBranch({
        analysis: { score: 70 },
        interviewContext: { previousScore: 30, turns: 2, answerType: 'skipped' },
        candidateResponse: 'skip question',
        forceEnabled: true,
      });

      expect(decision.nextAction).not.toBe('affirm_recovery');
      expect(decision.recoveryDetected).toBe(false);
    });

    it('suppresses recovery on empty or very short candidate responses', () => {
      const decision = InterviewFollowUpRulesService.decideBranch({
        analysis: { score: 70 },
        interviewContext: { previousScore: 30, turns: 2 },
        candidateResponse: '   ',
        forceEnabled: true,
      });

      expect(decision.nextAction).not.toBe('affirm_recovery');
      expect(decision.recoveryDetected).toBe(false);
    });

    it('tests isTurnExcludedFromRecovery helper directly', () => {
      expect(isTurnExcludedFromRecovery({ isSkipped: true })).toBe(true);
      expect(isTurnExcludedFromRecovery({ answerType: 'skipped' })).toBe(true);
      expect(isTurnExcludedFromRecovery({ isClarification: true })).toBe(true);
      expect(isTurnExcludedFromRecovery({ answerType: 'clarification' })).toBe(true);
      expect(isTurnExcludedFromRecovery({ answerType: 'dont_know' })).toBe(true);
      expect(isTurnExcludedFromRecovery({ answerType: 'off_topic' })).toBe(true);
      expect(isTurnExcludedFromRecovery({ candidateResponse: '' })).toBe(true);
      expect(isTurnExcludedFromRecovery({ candidateResponse: 'skip' })).toBe(true);
      expect(isTurnExcludedFromRecovery({ candidateResponse: 'I don\'t know' })).toBe(true);
      expect(
        isTurnExcludedFromRecovery({
          candidateResponse: 'We use a two-pointer approach to find the target sum in O(N) time.',
        })
      ).toBe(false);
    });
  });

  // ── 9. Qualitative Phrasing & Zero-Numeric Leak Invariant ──────────────
  describe('9. Qualitative Phrasing & Zero-Numeric Leak Invariant', () => {
    it('contains exactly 5 canonical encouraging phrases', () => {
      expect(QUALITATIVE_RECOVERY_PHRASES).toHaveLength(5);
      expect(RECOVERY_PHRASES).toHaveLength(5);
      expect(QUALITATIVE_RECOVERY_PHRASES[0]).toBe(
        'Much clearer breakdown this time — that shows strong adaptability.'
      );
      expect(QUALITATIVE_RECOVERY_PHRASES[1]).toBe(
        'Good recovery on the trade-offs there; let\'s carry that forward.'
      );
      expect(QUALITATIVE_RECOVERY_PHRASES[2]).toBe(
        'Solid adjustment on the complexity aspect. Let\'s keep exploring that.'
      );
      expect(QUALITATIVE_RECOVERY_PHRASES[3]).toBe(
        'That clarifies the earlier ambiguity nicely. Good self-correction.'
      );
      expect(QUALITATIVE_RECOVERY_PHRASES[4]).toBe(
        'Nicely turned around — your explanation of the core mechanics is much sharper.'
      );
    });

    it('enforces STRICT ZERO NUMERIC LEAKS on all 5 canonical phrases', () => {
      QUALITATIVE_RECOVERY_PHRASES.forEach((phrase) => {
        // Must pass programmatic invariant validator
        expect(() => validatePhrasingHasZeroNumericLeaks(phrase)).not.toThrow();
        // Zero digits
        expect(/\d/.test(phrase)).toBe(false);
        // Zero percent characters
        expect(phrase.includes('%')).toBe(false);
        // Zero metric or score vocabulary
        expect(/\b(?:score|points?|delta|percent|numbers?|metric)\b/i.test(phrase)).toBe(false);
      });
    });

    it('throws error when numeric metrics are injected into phrasing validator', () => {
      expect(() => validatePhrasingHasZeroNumericLeaks('You scored 85 this time!')).toThrow(/Numeric leak/);
      expect(() => validatePhrasingHasZeroNumericLeaks('That is a 20-point increase!')).toThrow(/Numeric leak/);
      expect(() => validatePhrasingHasZeroNumericLeaks('Great jump of 15%!')).toThrow(/Numeric leak/);
      expect(() => validatePhrasingHasZeroNumericLeaks('Your score delta is impressive.')).toThrow(/Numeric metric leak/);
    });

    it('rotates deterministically based on (turnNumber + sessionSeed) % 5', () => {
      for (let turn = 0; turn < 10; turn++) {
        const expected = QUALITATIVE_RECOVERY_PHRASES[turn % 5];
        const phrase = getQualitativeRecoveryPhrase({ turnNumber: turn, sessionSeed: 0 });
        expect(phrase).toBe(expected);
      }

      // With sessionSeed offset
      const seedPhrase = getQualitativeRecoveryPhrase({ turnNumber: 1, sessionSeed: 2 });
      expect(seedPhrase).toBe(QUALITATIVE_RECOVERY_PHRASES[(1 + 2) % 5]);
    });

    it('supports deterministic phraseIndex override', () => {
      for (let i = 0; i < 5; i++) {
        const phrase = getQualitativeRecoveryPhrase({ phraseIndex: i });
        expect(phrase).toBe(QUALITATIVE_RECOVERY_PHRASES[i]);
      }
    });

    it('supports selectQualitativeRecoveryPhrase alias', () => {
      const phrase = selectQualitativeRecoveryPhrase({ turn: 3, sessionId: 'test-seed' });
      expect(QUALITATIVE_RECOVERY_PHRASES).toContain(phrase);
    });
  });

  // ── 10. Telemetry-Only Momentum Tracking ───────────────────────────────
  describe('10. Telemetry-Only Momentum Tracking', () => {
    it('calculates positive momentum when delta >= 10', () => {
      const { momentum, delta } = calculateMomentum(75, 60);
      expect(momentum).toBe('positive');
      expect(delta).toBe(15);

      const decision = InterviewFollowUpRulesService.decideBranch({
        analysis: { score: 75 },
        interviewContext: { previousScore: 60, turns: 2 },
        candidateResponse: 'We apply Dijkstra algorithm using a priority queue.',
      });
      expect(decision.momentum).toBe('positive');
      expect(decision.momentumDelta).toBe(15);
    });

    it('calculates negative momentum when delta <= -10', () => {
      const { momentum, delta } = calculateMomentum(40, 65);
      expect(momentum).toBe('negative');
      expect(delta).toBe(-25);

      const decision = InterviewFollowUpRulesService.decideBranch({
        analysis: { score: 40 },
        interviewContext: { previousScore: 65, turns: 2 },
        candidateResponse: 'I am using brute force check.',
      });
      expect(decision.momentum).toBe('negative');
      expect(decision.momentumDelta).toBe(-25);
    });

    it('calculates neutral momentum when delta is between -9 and +9', () => {
      const result1 = calculateMomentum(65, 60); // delta = +5
      expect(result1.momentum).toBe('neutral');
      expect(result1.delta).toBe(5);

      const result2 = calculateMomentum(55, 60); // delta = -5
      expect(result2.momentum).toBe('neutral');
      expect(result2.delta).toBe(-5);
    });

    it('returns neutral on Turn 1 / uninitialized prior score', () => {
      const result = calculateMomentum(80, null);
      expect(result.momentum).toBe('neutral');
      expect(result.delta).toBe(0);

      const decision = InterviewFollowUpRulesService.decideBranch({
        analysis: { score: 80 },
        interviewContext: { turns: 1 },
        candidateResponse: 'First step is validating the input constraints.',
      });
      expect(decision.momentum).toBe('neutral');
      expect(decision.momentumDelta).toBe(0);
    });

    it('guarantees momentum tracking NEVER mutates interview stage or state machine', () => {
      const decision = InterviewFollowUpRulesService.decideBranch({
        analysis: { score: 95 },
        interviewContext: { previousScore: 20, turns: 2, currentDifficulty: 'medium' },
        candidateResponse: 'We can optimize this with bit manipulation for O(1) space.',
        forceEnabled: true,
      });

      // Verify returned fields are informational only
      expect(decision.momentum).toBe('positive');
      expect(decision.recoveryDetected).toBe(true);
      // Ensure no state machine transition properties are altered inside decideBranch
      expect(decision).toHaveProperty('answerQuality');
      expect(decision).toHaveProperty('branchReason');
      expect(decision).toHaveProperty('nextAction');
      expect(decision).not.toHaveProperty('stageTransition');
      expect(decision).not.toHaveProperty('mutatedStage');
    });
  });

  // ── 11. Backward Compatibility & Priority Order ────────────────────────
  describe('11. Backward Compatibility & Decision Priority Order', () => {
    it('prioritizes behavioral/HR incomplete STAR completion over recovery', () => {
      // In HR/behavioral interview, candidate gives an incomplete STAR story (e.g. action only, missing situation/task/result)
      const decision = InterviewFollowUpRulesService.decideBranch({
        analysis: { score: 70 },
        interviewContext: {
          previousScore: 30,
          turns: 2,
          interviewType: 'behavioral',
        },
        candidateResponse: 'I took the action to restructure our sprint board and migrate tickets.',
        forceEnabled: true,
      });

      // STAR completion must take priority for incomplete STAR stories
      expect(decision.nextAction).toBe('star_completion');
      expect(decision.branchReason).toContain('incomplete_star_missing');
    });

    it('prioritizes recovery over volatility_scaffold and targeted_correction', () => {
      // Score jump from 30 to 55 (delta = 25 > 15, prev < 50, score < 60)
      // Without recovery, score < 60 would trigger targeted_correction
      const decision = InterviewFollowUpRulesService.decideBranch({
        analysis: { score: 55 },
        interviewContext: { previousScore: 30, turns: 2 },
        candidateResponse: 'I see my error now. Using a hash set prevents duplicate checks in O(N) time.',
        forceEnabled: true,
      });

      expect(decision.nextAction).toBe('affirm_recovery');
      expect(decision.branchReason).toBe('genuine_recovery_detected');
      expect(decision.recoveryDetected).toBe(true);
    });

    it('falls back to volatility_scaffold when recovery is not eligible and history is volatile', () => {
      const decision = InterviewFollowUpRulesService.decideBranch({
        analysis: { score: 55 },
        interviewContext: { previousScore: 50, turns: 4 }, // previous not < 50
        scoreHistory: [
          { score: 30, turn: 1 },
          { score: 85, turn: 2 },
          { score: 50, turn: 3 },
        ],
        scoreTrend: {
          mean: 55,
          stdDev: 22,
          trend: 'stable',
          volatility: 'volatile',
          delta: 5,
        },
        candidateResponse: 'A standard balanced BST allows logarithmic lookups.',
        forceEnabled: true,
      });

      expect(decision.nextAction).toBe('volatility_scaffold');
      expect(decision.branchReason).toBe('volatile_score_pattern');
    });

    it('falls back to targeted_correction when score < 60 and no recovery', () => {
      const decision = InterviewFollowUpRulesService.decideBranch({
        analysis: { score: 45 },
        interviewContext: { previousScore: 40, turns: 2 }, // delta = 5 (not > 15)
        candidateResponse: 'A linear scan will find the element eventually.',
        forceEnabled: true,
      });

      expect(decision.nextAction).toBe('targeted_correction');
      expect(decision.branchReason).toBe('missed_core_concepts');
    });

    it('falls back to confidence_rebuild when candidate hedges in DSA interview', () => {
      const decision = InterviewFollowUpRulesService.decideBranch({
        analysis: { score: 70 },
        interviewContext: { previousScore: 65, turns: 2, interviewType: 'dsa' },
        candidateResponse: 'I guess maybe this could work, but I am uncertain about the pointer logic.',
        forceEnabled: true,
      });

      expect(decision.nextAction).toBe('confidence_rebuild');
      expect(decision.branchReason).toBe('low_confidence_signal');
    });

    it('falls back to deepen when answer is high quality with no recovery trigger', () => {
      const decision = InterviewFollowUpRulesService.decideBranch({
        analysis: { score: 88 },
        interviewContext: { previousScore: 82, turns: 2 },
        candidateResponse: 'Because of the memory hierarchy, sequential array access yields superior cache locality compared to pointer chasing.',
        forceEnabled: true,
      });

      expect(decision.nextAction).toBe('deepen');
      expect(decision.branchReason).toBe('high_quality_answer');
    });
  });

  // ── 12. Downstream Prompt Directives Integration ───────────────────────
  describe('12. Downstream Prompt Directives Integration', () => {
    it('generates affirm_recovery prompt directive in interviewPromptService with qualitative phrasing', () => {
      const phrasing = QUALITATIVE_RECOVERY_PHRASES[1];
      const prompt = InterviewPromptService.buildFollowUpPrompt({
        interviewType: 'dsa',
        problemStatement: 'Design a LRU Cache.',
        candidateResponse: 'We can combine a doubly linked list with a hash map to achieve O(1) get and put.',
        interviewContext: {
          turns: 3,
          adaptiveFollowUp: {
            nextAction: 'affirm_recovery',
            branchReason: 'genuine_recovery_detected',
            phrasing,
            recoveryPhrase: phrasing,
            recoveryDetected: true,
          },
        },
      });

      expect(prompt).toContain('ACTION: Affirm the candidate\'s strong recovery on this topic.');
      expect(prompt).toContain(`Acknowledge with: "${phrasing}"`);
      expect(prompt).toContain('Do not mention numeric scores.');
    });
  });
});
