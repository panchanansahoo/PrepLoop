import { describe, it, expect } from 'vitest';
import {
  evaluateFresherAnswer,
  detectStarBreakdown,
  evaluateAnswerWithSemanticRubric,
  _evaluateFresherAnswer,
} from '../../services/interviewAnswerEvaluator.js';

describe('interviewAnswerEvaluator (Track 1.3 Semantic Rubrics)', () => {
  it('evaluates empty answer with minimal score and valid rubric structure', () => {
    const result = evaluateFresherAnswer('', 'Technical');
    expect(result.score).toBe(25);
    expect(result.rubric).toBeDefined();
    expect(result.rubric.clarity).toBeGreaterThanOrEqual(1);
    expect(result.rubric.depth).toBeGreaterThanOrEqual(1);
    expect(result.rubric.correctness).toBeGreaterThanOrEqual(1);
    expect(result.rubric.starStructure).toBeGreaterThanOrEqual(1);
    expect(result.rubric.specificity).toBeGreaterThanOrEqual(1);
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.improvements.length).toBeGreaterThan(0);
    expect(typeof result.feedbackSummary).toBe('string');
  });

  it('correctly scores detailed technical answers with complexity and trade-offs', () => {
    const detailedAnswer = `
      In our project, we were facing heavy database query latency. My task was to optimize the indexing strategy.
      I decided to implement a compound index on the primary key and foreign key columns and introduced Redis caching.
      Because of this approach, we reduced latency by 45% and improved throughput to 2500 qps.
      The time complexity of lookups dropped from O(n) table scans to O(1) cache hits, with an O(log n) database fallback.
    `;
    const result = evaluateFresherAnswer(detailedAnswer, 'Technical');
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.rubric.depth).toBeGreaterThanOrEqual(7);
    expect(result.rubric.specificity).toBeGreaterThanOrEqual(7);
    expect(result.rubric.starStructure).toBeGreaterThanOrEqual(8);
    expect(result.strengths.some((s) => s.toLowerCase().includes('complexity') || s.toLowerCase().includes('impact'))).toBe(true);
  });

  it('detects STAR components accurately in behavioral answers', () => {
    const starText = `
      At that time, our team was falling behind the sprint deadline.
      My role was to unblock the backend authentication integration.
      I organized a pair-programming session and built a mock server to unblock frontend developers.
      As a result, we delivered the feature 2 days early with 99.9% uptime.
    `;
    const star = detectStarBreakdown(starText);
    expect(star.situation).toBe(true);
    expect(star.task).toBe(true);
    expect(star.action).toBe(true);
    expect(star.result).toBe(true);
    expect(star.isComplete).toBe(true);
    expect(star.score).toBe(10);
  });

  it('provides backwards-compatible alias _evaluateFresherAnswer', () => {
    const res1 = evaluateFresherAnswer('I created a class for inheritance.', 'Technical');
    const res2 = _evaluateFresherAnswer('I created a class for inheritance.', 'Technical');
    expect(res1.score).toBe(res2.score);
  });

  it('asynchronously evaluates answer using evaluateAnswerWithSemanticRubric with robust fallback', async () => {
    const res = await evaluateAnswerWithSemanticRubric({
      userAnswer: 'I implemented binary search with O(log n) time complexity.',
      stage: 'Technical',
      question: 'How does binary search work?',
      difficultyTag: 'medium',
    });
    expect(res.score).toBeGreaterThanOrEqual(25);
    expect(res.rubric).toBeDefined();
    expect(res.rubric.clarity).toBeGreaterThanOrEqual(1);
  });
});

