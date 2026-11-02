import { describe, it, expect } from 'vitest';
import { InterviewScoringService } from '../../services/interviewScoringService.js';
import { InterviewFollowUpRulesService } from '../../services/interviewFollowUpRules.js';

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
});

