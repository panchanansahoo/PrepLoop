import { describe, it, expect, beforeEach } from 'vitest';
import { InterviewScoringService, deriveStartingDifficulty } from '../../services/interviewScoringService.ts';
import { InterviewFollowUpRulesService } from '../../services/interviewFollowUpRules.ts';
import {
  DEDUP_WINDOW,
  recordUsedProblem,
  getRecentProblems,
  clearRecentProblems,
} from '../../services/aiService.js';
import aiService from '../../services/aiService.js';
const { InterviewSimulatorService } = aiService;

describe('Interview Scoring & Adaptive Difficulty Rules', () => {
  it('computes rolling scores and scales them properly between 0 and 10', () => {
    const analysis = {
      metrics: { communication: 78, problemDecomposition: 72, efficiency: 70 },
      score: 76,
      candidateStuck: false,
      nextFocus: ['edge cases'],
    };

    const transcript = [
      { role: 'candidate', text: 'I would use hashmap and linked list.' },
      { role: 'interviewer', text: 'What are trade-offs?' },
      { role: 'candidate', text: 'Time O(1), space O(n).' },
    ];

    const rolling = InterviewScoringService.calculateRollingScores(analysis, transcript, 'dsa');
    expect(typeof rolling.overall).toBe('number');
    expect(rolling.overall).toBeGreaterThanOrEqual(0);
    expect(rolling.overall).toBeLessThanOrEqual(10);
    expect(rolling.scoringConfidence).toBe(1.0);
    expect(rolling.isUnscored).toBe(false);
  });

  it('marks empty analysis as unscored with null overall and zero scoring confidence', () => {
    const rolling = InterviewScoringService.calculateRollingScores({}, [], 'dsa');
    expect(rolling.isUnscored).toBe(true);
    expect(rolling.overall).toBeNull();
    expect(rolling.scoringConfidence).toBe(0);
    expect(rolling.fresherBonusApplied).toBe(false);
  });

  it('gates fresher bonus on having at least 2 valid metrics (scoringConfidence >= 0.67)', () => {
    // 1 metric: fresher bonus should NOT be applied, lowConfidenceScore flagged
    const sparseAnalysis = { metrics: { communication: 60 } };
    const sparseResult = InterviewScoringService.calculateRollingScores(sparseAnalysis, [], 'dsa', 'fresher');
    expect(sparseResult.scoringConfidence).toBe(0.33);
    expect(sparseResult.lowConfidenceScore).toBe(true);
    expect(sparseResult.fresherBonusApplied).toBe(false);
    expect(sparseResult.communication).toBe(6.0);
    expect(sparseResult.problem_solving).toBeNull();
    expect(sparseResult.technical_depth).toBeNull();

    // 2 metrics: fresher bonus should be applied
    const adequateAnalysis = { metrics: { communication: 60, problemDecomposition: 65 } };
    const adequateResult = InterviewScoringService.calculateRollingScores(adequateAnalysis, [], 'dsa', 'fresher');
    expect(adequateResult.scoringConfidence).toBe(0.67);
    expect(adequateResult.lowConfidenceScore).toBe(false);
    expect(adequateResult.fresherBonusApplied).toBe(true);
    expect(adequateResult.communication).toBe(6.0);
    expect(adequateResult.problem_solving).toBe(6.5);
    expect(adequateResult.technical_depth).toBeNull();
  });

  it('caps overall score at 70 and sets lowConfidenceScore when scoringConfidence < 0.67', () => {
    const singleMetricAnalysis = { metrics: { communication: 95 } };
    const result = InterviewScoringService.calculateRollingScores(singleMetricAnalysis, [], 'dsa');
    expect(result.scoringConfidence).toBe(0.33);
    expect(result.lowConfidenceScore).toBe(true);
    // Overall capped at 70 / 10 = 7.0
    expect(result.overall).toBe(7.0);
  });

  it('enforces cross-dimensional floor: caps overall at max(dimension_scores) if any dimension < 30', () => {
    // If dimensions are [20, 25, 25], max is 25, overall must not exceed 2.5
    const lowDimsAnalysis = {
      metrics: { communication: 20, problemDecomposition: 25, efficiency: 25 },
    };
    const result = InterviewScoringService.calculateRollingScores(lowDimsAnalysis, [], 'dsa');
    expect(result.overall).toBeLessThanOrEqual(2.5);

    // If one dimension is 20, but max is 60, overall is capped at 6.0
    const mixedDimsAnalysis = {
      metrics: { communication: 20, problemDecomposition: 60, efficiency: 60 },
    };
    const mixedResult = InterviewScoringService.calculateRollingScores(mixedDimsAnalysis, [], 'dsa');
    expect(mixedResult.overall).toBeLessThanOrEqual(6.0);
  });

  it('replaces || 65 fallback with ?? null and propagates unscored status when all dimensions are null', () => {
    // When explicit null dimensions are passed
    const nullDims = { metrics: { communication: null, problemDecomposition: null, efficiency: null } };
    const nullDimsResult = InterviewScoringService.calculateRollingScores(nullDims, [], 'dsa');
    expect(nullDimsResult.isUnscored).toBe(true);
    expect(nullDimsResult.overall).toBeNull();
    expect(nullDimsResult.communication).toBeNull();
    expect(nullDimsResult.problem_solving).toBeNull();
    expect(nullDimsResult.technical_depth).toBeNull();
    expect(nullDimsResult.metricsMissing).toBe(true);
    expect(nullDimsResult.scoringConfidence).toBe(0);

    // Even if top-level analysis has a score, missing dimensions propagate unscored
    const scoreWithoutDims = { score: 75, metrics: {} };
    const scoreResult = InterviewScoringService.calculateRollingScores(scoreWithoutDims, [], 'dsa');
    expect(scoreResult.isUnscored).toBe(true);
    expect(scoreResult.overall).toBeNull();
    expect(scoreResult.communication).toBeNull();
    expect(scoreResult.problem_solving).toBeNull();
    expect(scoreResult.technical_depth).toBeNull();
  });

  it('supports alias dimension names (problemSolving, technicalDepth) without 65 fallback', () => {
    const aliasAnalysis = {
      metrics: {
        communication: 80,
        problemSolving: 85,
        technicalDepth: 90,
      },
    };
    const result = InterviewScoringService.calculateRollingScores(aliasAnalysis, [], 'dsa');
    expect(result.communication).toBe(8.0);
    expect(result.problem_solving).toBe(8.5);
    expect(result.technical_depth).toBe(9.0);
    expect(result.isUnscored).toBe(false);
    expect(result.scoringConfidence).toBe(1.0);
  });

  it('derives adaptive difficulty based on rolling candidate performance', () => {
    const adaptive = InterviewScoringService.deriveAdaptiveDifficulty('medium', 8.5, 4);
    expect(typeof adaptive.newDifficulty).toBe('string');
    expect(['easy', 'medium', 'hard']).toContain(adaptive.newDifficulty);
  });

  it('determines intelligent follow-up branching when candidate misses edge cases', () => {
    const analysis = {
      metrics: { communication: 70, problemDecomposition: 65, efficiency: 68 },
      score: 68,
      candidateStuck: false,
      nextFocus: ['edge cases'],
    };

    const branch = InterviewFollowUpRulesService.decideBranch({
      analysis,
      interviewContext: {
        turns: 4,
        stage: 'technical',
        missingAreas: ['edge cases'],
      },
      candidateResponse: 'I think this works, but I am not fully sure about edge cases.',
    });

    expect(typeof branch.branchReason).toBe('string');
    expect(typeof branch.nextAction).toBe('string');
    expect(Array.isArray(branch.missedConcepts)).toBe(true);
  });

  // ── #7 Adaptive Difficulty Feedback Loop ──────────────────────────────────
  it('#7: adaptive difficulty escalates easy→medium when score >= 8.2 for 3+ turns', () => {
    const adaptive = InterviewScoringService.deriveAdaptiveDifficulty('easy', 8.5, 3);
    expect(adaptive.changed).toBe(true);
    expect(adaptive.previousDifficulty).toBe('easy');
    expect(adaptive.newDifficulty).toBe('medium');
    expect(typeof adaptive.reason).toBe('string');
  });

  it('#7: adaptive difficulty de-escalates hard→medium when score <= 5.5 for 2+ turns', () => {
    const adaptive = InterviewScoringService.deriveAdaptiveDifficulty('hard', 5.0, 2);
    expect(adaptive.changed).toBe(true);
    expect(adaptive.previousDifficulty).toBe('hard');
    expect(adaptive.newDifficulty).toBe('medium');
  });

  it('#7: adaptive difficulty remains unchanged when score is in stable range', () => {
    const adaptive = InterviewScoringService.deriveAdaptiveDifficulty('medium', 7.0, 5);
    expect(adaptive.changed).toBe(false);
    expect(adaptive.newDifficulty).toBe('medium');
  });

  // ── Horizon 1.2: Cross-Session Starting Difficulty Calibration ────────────
  describe('deriveStartingDifficulty (Horizon 1.2)', () => {
    it('returns preferredDifficulty when recentSessions is empty or has no scored sessions', () => {
      expect(deriveStartingDifficulty([], 'medium')).toBe('medium');
      expect(deriveStartingDifficulty([], 'hard')).toBe('hard');
      expect(deriveStartingDifficulty([], 'easy')).toBe('easy');
      expect(deriveStartingDifficulty(null as any)).toBe('medium');
      expect(deriveStartingDifficulty([{ status: 'abandoned' } as any], 'medium')).toBe('medium');
    });

    it('escalates to "hard" when recent completed sessions average >= 80 on medium/hard difficulty', () => {
      const mediumSessions = [
        { score: 82, difficulty: 'medium' },
        { score: 86, difficulty: 'medium' },
      ];
      expect(deriveStartingDifficulty(mediumSessions, 'medium')).toBe('hard');

      const hardSessions = [
        { overall_score: 80, difficulty_level: 'hard' },
        { interview_score: 90, difficulty: 'hard' },
      ];
      expect(deriveStartingDifficulty(hardSessions, 'medium')).toBe('hard');
    });

    it('does not escalate to "hard" when high score (>=80) was achieved only on easy difficulty', () => {
      const easySessions = [
        { score: 88, difficulty: 'easy' },
        { score: 92, difficulty: 'easy' },
      ];
      expect(deriveStartingDifficulty(easySessions, 'easy')).toBe('easy');
      expect(deriveStartingDifficulty(easySessions, 'medium')).toBe('medium');
    });

    it('de-escalates by one tier when recent completed sessions average < 50', () => {
      // hard -> medium
      const lowHard = [{ score: 45, difficulty: 'hard' }];
      expect(deriveStartingDifficulty(lowHard, 'hard')).toBe('medium');

      // medium -> easy
      const lowMed = [{ score: 42, difficulty: 'medium' }];
      expect(deriveStartingDifficulty(lowMed, 'medium')).toBe('easy');

      // easy stays easy
      const lowEasy = [{ score: 35, difficulty: 'easy' }];
      expect(deriveStartingDifficulty(lowEasy, 'easy')).toBe('easy');
    });

    it('retains preferredDifficulty when average score is in normal range (50-79)', () => {
      const midSessions = [
        { score: 65, difficulty: 'medium' },
        { score: 72, difficulty: 'medium' },
      ];
      expect(deriveStartingDifficulty(midSessions, 'medium')).toBe('medium');
      expect(deriveStartingDifficulty(midSessions, 'hard')).toBe('hard');
    });

    it('filters completed sessions by matching interview type when supplied', () => {
      const mixedTypeSessions = [
        { score: 90, difficulty: 'medium', interview_type: 'dsa' },
        { score: 85, difficulty: 'medium', interview_type: 'dsa' },
        { score: 40, difficulty: 'medium', interview_type: 'behavioral' },
      ];

      // Matching 'dsa' (2 completed sessions) averages 87.5 -> hard
      expect(deriveStartingDifficulty(mixedTypeSessions, 'medium', 'dsa')).toBe('hard');

      // Matching 'behavioral' averages 40 -> easy
      expect(deriveStartingDifficulty(mixedTypeSessions, 'medium', 'behavioral')).toBe('easy');

      // Unmatched type 'system-design' falls back to overall average (71.7) -> medium
      expect(deriveStartingDifficulty(mixedTypeSessions, 'medium', 'system-design')).toBe('medium');
    });

    it('requires at least 2 completed sessions before escalating starting difficulty to "hard"', () => {
      // Single completed session with >= 80 does not escalate to hard
      const singleSession = [{ score: 95, difficulty: 'medium' }];
      expect(deriveStartingDifficulty(singleSession, 'medium')).toBe('medium');

      // Two completed sessions with average >= 80 escalate to hard
      const twoSessions = [
        { score: 85, difficulty: 'medium' },
        { score: 88, difficulty: 'medium' },
      ];
      expect(deriveStartingDifficulty(twoSessions, 'medium')).toBe('hard');
    });

    it('discounts difficulty by one tier when recent sessions contain >= 2 abandoned sessions', () => {
      // 2 high scoring sessions that would normally escalate to hard, but 2 abandoned sessions discount to medium
      const sessionsWithAbandoned = [
        { score: 90, difficulty: 'medium' },
        { score: 90, difficulty: 'medium' },
        { status: 'abandoned' },
        { status: 'abandoned' },
      ];
      expect(deriveStartingDifficulty(sessionsWithAbandoned, 'medium')).toBe('medium');

      // Preferred medium with 2 abandoned sessions discounts to easy
      const abandonedOnly = [
        { status: 'abandoned' },
        { status: 'abandoned' },
      ];
      expect(deriveStartingDifficulty(abandonedOnly, 'medium')).toBe('easy');

      // 1 abandoned session does not discount
      const singleAbandoned = [
        { score: 85, difficulty: 'medium' },
        { score: 85, difficulty: 'medium' },
        { status: 'abandoned' },
      ];
      expect(deriveStartingDifficulty(singleAbandoned, 'medium')).toBe('hard');
    });

    it('applies 2x recency weighting on the last 3 sessions', () => {
      // 4 sessions: session 0 has weight 1, sessions 1-3 have weight 2
      // [40, 85, 90, 85]
      // Unweighted average: (40 + 85 + 90 + 85) / 4 = 75 (< 80)
      // Weighted average: (40*1 + 85*2 + 90*2 + 85*2) / 7 = 560 / 7 = 80 (>= 80 -> hard)
      const sessions = [
        { score: 40, difficulty: 'medium' },
        { score: 85, difficulty: 'medium' },
        { score: 90, difficulty: 'medium' },
        { score: 85, difficulty: 'medium' },
      ];
      expect(deriveStartingDifficulty(sessions, 'medium')).toBe('hard');
    });

    it('works as a static method on InterviewScoringService', () => {
      const sessions = [
        { score: 85, difficulty: 'medium' },
        { score: 85, difficulty: 'medium' },
      ];
      expect(InterviewScoringService.deriveStartingDifficulty(sessions, 'medium')).toBe('hard');
    });
  });

  // ── Horizon 1.1: Problem Deduplication ────────────────────────────────────
  describe('Problem Deduplication (Horizon 1.1)', () => {
    beforeEach(() => {
      clearRecentProblems();
    });

    it('defines DEDUP_WINDOW as 30', () => {
      expect(DEDUP_WINDOW).toBe(30);
    });

    it('records and retrieves user recent problems up to window cap of 30', () => {
      const userId = 'user-test-dedup-1';
      expect(getRecentProblems(userId)).toEqual([]);

      for (let i = 1; i <= 35; i++) {
        recordUsedProblem(userId, `prob-${i}`);
      }

      const recent = getRecentProblems(userId);
      expect(recent.length).toBe(30);
      // First 5 (prob-1 to prob-5) should be evicted
      expect(recent).not.toContain('prob-1');
      expect(recent).not.toContain('prob-5');
      // Latest 30 (prob-6 to prob-35) should remain
      expect(recent).toContain('prob-6');
      expect(recent).toContain('prob-35');
    });

    it('clears recent problems by user or globally', () => {
      recordUsedProblem('u1', 'p1');
      recordUsedProblem('u2', 'p2');

      clearRecentProblems('u1');
      expect(getRecentProblems('u1')).toEqual([]);
      expect(getRecentProblems('u2')).toEqual(['p2']);

      clearRecentProblems();
      expect(getRecentProblems('u2')).toEqual([]);
    });

    it('filters out usedProblemIds or excludeProblemIds passed in options', () => {
      const allSelectedIds = new Set<string>();

      // Generate 5 problems with usedProblemIds passed
      const usedIds: string[] = [];
      for (let i = 0; i < 5; i++) {
        const prob = InterviewSimulatorService._generateProblemStatement('dsa', 'medium', null, {
          usedProblemIds: usedIds,
        });
        expect(prob).toBeDefined();
        if (prob.problem_id) {
          expect(usedIds).not.toContain(prob.problem_id);
          usedIds.push(prob.problem_id);
          allSelectedIds.add(prob.problem_id);
        }
      }

      expect(allSelectedIds.size).toBe(5);
    });

    it('supports excludeProblemIds alias in options', () => {
      const prob1 = InterviewSimulatorService._generateProblemStatement('dsa', 'medium', null);
      if (prob1.problem_id) {
        const prob2 = InterviewSimulatorService._generateProblemStatement('dsa', 'medium', null, {
          excludeProblemIds: [prob1.problem_id],
        });
        if (prob2.problem_id) {
          expect(prob2.problem_id).not.toBe(prob1.problem_id);
        }
      }
    });

    it('applies quality-gated engagement bonus only when answer quality > 55 and caps bonus at 3 pts', () => {
      const lowQualityAnalysis = { metrics: { communication: 40, problemDecomposition: 45, efficiency: 42 } };
      const transcriptWith5Turns = [
        { role: 'candidate', text: 'turn 1' },
        { role: 'candidate', text: 'turn 2' },
        { role: 'candidate', text: 'turn 3' },
        { role: 'candidate', text: 'turn 4' },
        { role: 'candidate', text: 'turn 5' },
      ];

      // Low quality (<= 55) receives 0 engagement bonus despite 5 candidate turns
      const lowResult = InterviewScoringService.calculateRollingScores(lowQualityAnalysis, transcriptWith5Turns, 'dsa');
      const expectedLowBase = 40 * 0.34 + 45 * 0.33 + 42 * 0.33;
      expect(lowResult.overall).toBe(Number((expectedLowBase / 10).toFixed(1)));

      // High quality (> 55) receives engagement bonus capped at 3 pts (not 4 or 5)
      const highQualityAnalysis = { metrics: { communication: 70, problemDecomposition: 70, efficiency: 70 } };
      const highResult = InterviewScoringService.calculateRollingScores(highQualityAnalysis, transcriptWith5Turns, 'dsa');
      // base is 70, bonus capped at 3 => 73 / 10 = 7.3
      expect(highResult.overall).toBe(7.3);
    });

    it('detects scoring anomaly when cross-metric divergence exceeds 40 points', () => {
      const divergentAnalysis = {
        metrics: { communication: 90, problemDecomposition: 40, efficiency: 85 },
      };
      const result = InterviewScoringService.calculateRollingScores(divergentAnalysis, [], 'dsa');
      expect(result.scoringAnomalyDetected).toBe(true);
      expect(result.maxDimensionSpread).toBe(50.0);

      const balancedAnalysis = {
        metrics: { communication: 80, problemDecomposition: 75, efficiency: 85 },
      };
      const balancedResult = InterviewScoringService.calculateRollingScores(balancedAnalysis, [], 'dsa');
      expect(balancedResult.scoringAnomalyDetected).toBe(false);
      expect(balancedResult.maxDimensionSpread).toBe(10.0);
    });
  });
});

