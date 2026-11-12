import { describe, it, expect } from 'vitest';
import { InterviewScoringService } from '../../services/interviewScoringService.ts';
import { InterviewFollowUpRulesService } from '../../services/interviewFollowUpRules.ts';

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
    // 1 metric: fresher bonus should NOT be applied
    const sparseAnalysis = { metrics: { communication: 60 } };
    const sparseResult = InterviewScoringService.calculateRollingScores(sparseAnalysis, [], 'dsa', 'fresher');
    expect(sparseResult.scoringConfidence).toBe(0.33);
    expect(sparseResult.fresherBonusApplied).toBe(false);

    // 2 metrics: fresher bonus should be applied
    const adequateAnalysis = { metrics: { communication: 60, problemDecomposition: 65 } };
    const adequateResult = InterviewScoringService.calculateRollingScores(adequateAnalysis, [], 'dsa', 'fresher');
    expect(adequateResult.scoringConfidence).toBe(0.67);
    expect(adequateResult.fresherBonusApplied).toBe(true);
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
});

