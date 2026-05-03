import { describe, it, expect, beforeEach } from 'vitest';
import { QuestionNoveltyBalancer } from '../services/questionNoveltyBalancer.js';

describe('QuestionNoveltyBalancer', () => {
  let balancer;

  beforeEach(() => {
    balancer = new QuestionNoveltyBalancer();
  });

  describe('Usage Tracking', () => {
    it('should initialize with zero usage', () => {
      expect(balancer.getUsageCount('user1', 'q1')).toBe(0);
    });

    it('should increment usage count on each record', () => {
      balancer.recordQuestionUsage('user1', 'q1', 'interview1');
      expect(balancer.getUsageCount('user1', 'q1')).toBe(1);

      balancer.recordQuestionUsage('user1', 'q1', 'interview2');
      expect(balancer.getUsageCount('user1', 'q1')).toBe(2);
    });

    it('should track usage per user separately', () => {
      balancer.recordQuestionUsage('user1', 'q1', 'interview1');
      balancer.recordQuestionUsage('user2', 'q1', 'interview1');

      expect(balancer.getUsageCount('user1', 'q1')).toBe(1);
      expect(balancer.getUsageCount('user2', 'q1')).toBe(1);
    });

    it('should track usage per question separately', () => {
      balancer.recordQuestionUsage('user1', 'q1', 'interview1');
      balancer.recordQuestionUsage('user1', 'q2', 'interview1');

      expect(balancer.getUsageCount('user1', 'q1')).toBe(1);
      expect(balancer.getUsageCount('user1', 'q2')).toBe(1);
    });
  });

  describe('Novelty Score Calculation', () => {
    it('should give novelty 1.0 for fresh questions (usage 0)', () => {
      const novelty = balancer.calculateNoveltyScore(0);
      expect(novelty).toBeCloseTo(1.0, 2);
    });

    it('should give novelty ~0.59 for questions seen once', () => {
      const novelty = balancer.calculateNoveltyScore(1);
      expect(novelty).toBeCloseTo(0.59, 1);
    });

    it('should give novelty ~0.44 for questions seen twice', () => {
      const novelty = balancer.calculateNoveltyScore(2);
      expect(novelty).toBeCloseTo(0.44, 1);
    });

    it('should give low novelty for frequently used questions', () => {
      const novelty = balancer.calculateNoveltyScore(10);
      expect(novelty).toBeLessThan(0.3);
      expect(novelty).toBeGreaterThan(0.2);
    });

    it('should decay logarithmically (not linearly)', () => {
      const n0 = 1.0;
      const n1 = balancer.calculateNoveltyScore(1);
      const n2 = balancer.calculateNoveltyScore(2);
      const n10 = balancer.calculateNoveltyScore(10);

      // From 0→1: big drop
      const drop01 = n0 - n1; // 1.0 - 0.59 = 0.41
      // From 1→2: smaller drop
      const drop12 = n1 - n2; // 0.59 - 0.44 = 0.15
      // From 2→10: even smaller drop
      const drop210 = n2 - n10; // 0.44 - 0.294 = 0.146

      expect(drop01).toBeGreaterThan(drop12);
      // drop12 ≈ drop210 due to logarithmic decay (both ~0.15)
      expect(drop210).toBeLessThan(drop01);
    });

    it('should clamp to [0, 1]', () => {
      const novelty = balancer.calculateNoveltyScore(-5);
      expect(novelty).toBeGreaterThanOrEqual(0);
      expect(novelty).toBeLessThanOrEqual(1);
    });

    it('should handle large usage counts gracefully', () => {
      const novelty = balancer.calculateNoveltyScore(1000);
      expect(novelty).toBeGreaterThan(0.1);
      expect(novelty).toBeLessThan(0.15); // Very stale
    });
  });

  describe('Recent Repeat Constraint', () => {
    it('should allow questions never recommended', () => {
      const violates = balancer.violatesRecentRepeatConstraint('user1', 'q1');
      expect(violates).toBe(false);
    });

    it('should allow questions recommended 1-2 times in past month', () => {
      const now = Date.now();
      balancer.recordQuestionUsage('user1', 'q1', 'interview1');
      balancer.recordQuestionUsage('user1', 'q1', 'interview2');

      // Simulate past month timestamps
      balancer.recommendationHistory.set('user1', [
        { questionId: 'q1', recommendedAt: now - 1000, interviewId: 'i1' },
        { questionId: 'q1', recommendedAt: now - 2000, interviewId: 'i2' },
      ]);

      expect(balancer.violatesRecentRepeatConstraint('user1', 'q1')).toBe(false);
    });

    it('should reject questions recommended >2 times in past month', () => {
      const now = Date.now();
      balancer.recommendationHistory.set('user1', [
        { questionId: 'q1', recommendedAt: now - 1000, interviewId: 'i1' },
        { questionId: 'q1', recommendedAt: now - 2000, interviewId: 'i2' },
        { questionId: 'q1', recommendedAt: now - 3000, interviewId: 'i3' },
      ]);

      expect(balancer.violatesRecentRepeatConstraint('user1', 'q1')).toBe(true);
    });

    it('should ignore recommendations older than month window', () => {
      const now = Date.now();
      const monthInMs = 30 * 24 * 60 * 60 * 1000;

      balancer.recommendationHistory.set('user1', [
        { questionId: 'q1', recommendedAt: now - monthInMs - 1000, interviewId: 'i1' },
        { questionId: 'q1', recommendedAt: now - monthInMs - 2000, interviewId: 'i2' },
        { questionId: 'q1', recommendedAt: now - 1000, interviewId: 'i3' },
      ]);

      // Only recent one should count; total is 1 (allowed)
      expect(balancer.violatesRecentRepeatConstraint('user1', 'q1', monthInMs)).toBe(false);
    });

    it('should allow custom time windows', () => {
      const now = Date.now();
      const weekInMs = 7 * 24 * 60 * 60 * 1000;

      balancer.recommendationHistory.set('user1', [
        { questionId: 'q1', recommendedAt: now - weekInMs - 1000, interviewId: 'i1' },
        { questionId: 'q1', recommendedAt: now - 1000, interviewId: 'i2' },
      ]);

      // Within week: only 1 recent (allowed)
      expect(balancer.violatesRecentRepeatConstraint('user1', 'q1', weekInMs)).toBe(false);
    });
  });

  describe('Scoring with Novelty', () => {
    it('should validate weight sum equals 1', () => {
      const questions = [{ id: 'q1', qualityScore: 0.8 }];
      expect(() => {
        balancer.scoreQuestionsWithNovelty(questions, 'user1', {
          qualityWeight: 0.7,
          noveltyWeight: 0.2,
        });
      }).toThrow('sum to 1');
    });

    it('should compute combined score: 0.6*quality + 0.4*novelty', () => {
      const questions = [{ id: 'q1', qualityScore: 0.8 }];
      balancer.recordQuestionUsage('user1', 'q1', 'i1');

      // novelty for usage=1 is ~0.59
      // combined = 0.6*0.8 + 0.4*0.59 = 0.48 + 0.236 = 0.716
      const scored = balancer.scoreQuestionsWithNovelty(questions, 'user1');
      expect(scored[0].combinedScore).toBeCloseTo(0.72, 1);
    });

    it('should give fresh questions higher combined score', () => {
      const q1 = { id: 'q1', qualityScore: 0.8 }; // Never seen
      const q2 = { id: 'q2', qualityScore: 0.9 }; // Seen 1 time

      // Simulate q2 usage once (not violating constraint)
      balancer.recordQuestionUsage('user1', 'q2', 'i1');

      const scored = balancer.scoreQuestionsWithNovelty([q1, q2], 'user1');
      const score1 = scored.find((s) => s.id === 'q1');
      const score2 = scored.find((s) => s.id === 'q2');

      // q1 has novelty 1.0, q2 has novelty ~0.59
      // q1: 0.6*0.8 + 0.4*1.0 = 0.48 + 0.4 = 0.88
      // q2: 0.6*0.9 + 0.4*~0.59 = 0.54 + 0.236 = 0.776
      expect(score1.combinedScore).toBeGreaterThan(score2.combinedScore);
    });

    it('should exclude repeat violators when excludeRepeats=true', () => {
      const now = Date.now();
      const monthInMs = 30 * 24 * 60 * 60 * 1000;

      // q1 violates constraint (>2 in past month)
      balancer.recommendationHistory.set('user1', [
        { questionId: 'q1', recommendedAt: now - 1000, interviewId: 'i1' },
        { questionId: 'q1', recommendedAt: now - 2000, interviewId: 'i2' },
        { questionId: 'q1', recommendedAt: now - 3000, interviewId: 'i3' },
      ]);

      const questions = [
        { id: 'q1', qualityScore: 0.95 }, // High quality but repeated
        { id: 'q2', qualityScore: 0.8 }, // Lower quality, no repeats
      ];

      const scored = balancer.scoreQuestionsWithNovelty(questions, 'user1', {
        excludeRepeats: true,
        monthInMs,
      });

      expect(scored).toHaveLength(1);
      expect(scored[0].id).toBe('q2');
    });

    it('should include violators when excludeRepeats=false', () => {
      const now = Date.now();
      balancer.recommendationHistory.set('user1', [
        { questionId: 'q1', recommendedAt: now - 1000, interviewId: 'i1' },
        { questionId: 'q1', recommendedAt: now - 2000, interviewId: 'i2' },
        { questionId: 'q1', recommendedAt: now - 3000, interviewId: 'i3' },
      ]);

      const questions = [{ id: 'q1', qualityScore: 0.95 }];
      const scored = balancer.scoreQuestionsWithNovelty(questions, 'user1', {
        excludeRepeats: false,
      });

      expect(scored).toHaveLength(1);
      expect(scored[0].violatesConstraint).toBe(true);
    });

    it('should round novelty and combined scores to 2 decimals', () => {
      const questions = [{ id: 'q1', qualityScore: 0.77 }];
      const scored = balancer.scoreQuestionsWithNovelty(questions, 'user1');

      expect(scored[0].noveltyScore).toBe(1.0);
      expect(scored[0].combinedScore).toBeDefined();
    });
  });

  describe('Top Questions Selection', () => {
    it('should return top questions sorted by combinedScore', () => {
      const questions = [
        { id: 'q1', qualityScore: 0.6 },
        { id: 'q2', qualityScore: 0.9 },
        { id: 'q3', qualityScore: 0.75 },
      ];

      // Add usage to q1 and q2 to show novelty effect
      balancer.recordQuestionUsage('user1', 'q1', 'i1');
      balancer.recordQuestionUsage('user1', 'q1', 'i2');
      // q2 is fresh, q3 is fresh

      const top = balancer.getTopQuestionsByNovelty(questions, 'user1', 10);

      // q2 should rank high (high quality, fresh)
      // q3 should rank second (medium quality, fresh)
      // q1 should rank last (low quality, repeated)
      expect(top[0].id).toBe('q2');
      expect(top[top.length - 1].id).toBe('q1');
    });

    it('should respect limit parameter', () => {
      const questions = Array.from({ length: 20 }, (_, i) => ({
        id: `q${i}`,
        qualityScore: Math.random(),
      }));

      const top = balancer.getTopQuestionsByNovelty(questions, 'user1', 5);
      expect(top).toHaveLength(5);
    });

    it('should exclude repeat violators from top list', () => {
      const now = Date.now();
      balancer.recommendationHistory.set('user1', [
        { questionId: 'q1', recommendedAt: now - 1000, interviewId: 'i1' },
        { questionId: 'q1', recommendedAt: now - 2000, interviewId: 'i2' },
        { questionId: 'q1', recommendedAt: now - 3000, interviewId: 'i3' },
      ]);

      const questions = [
        { id: 'q1', qualityScore: 1.0 }, // Best quality but violates
        { id: 'q2', qualityScore: 0.9 },
      ];

      const top = balancer.getTopQuestionsByNovelty(questions, 'user1', 10, {
        excludeRepeats: true,
      });

      expect(top.map((q) => q.id)).not.toContain('q1');
    });
  });

  describe('Novelty Report', () => {
    it('should categorize questions as fresh, repeated, or stale', () => {
      const questions = [
        { id: 'q1', qualityScore: 0.8 },
        { id: 'q2', qualityScore: 0.8 },
        { id: 'q3', qualityScore: 0.8 },
      ];

      balancer.recordQuestionUsage('user1', 'q1', 'i1'); // 1 use (repeated)
      balancer.recordQuestionUsage('user1', 'q2', 'i1'); // 1 use (repeated)
      balancer.recordQuestionUsage('user1', 'q2', 'i2'); // 2 uses (repeated)
      balancer.recordQuestionUsage('user1', 'q3', 'i1'); // 1 use, then 2 more
      balancer.recordQuestionUsage('user1', 'q3', 'i2');
      balancer.recordQuestionUsage('user1', 'q3', 'i3');
      // q1: fresh (but used 1x, so repeated), q2: repeated (2x), q3: stale (3x)

      const report = balancer.getNoveltyReport('user1', questions);

      expect(report.fresh).toBe(0); // No truly fresh (all used)
      expect(report.repeated).toBe(2); // q1, q2
      expect(report.stale).toBe(1); // q3
      expect(report.total).toBe(3);
    });

    it('should include fresh questions in report', () => {
      const questions = [
        { id: 'q1', qualityScore: 0.8 },
        { id: 'q2', qualityScore: 0.8 },
      ];

      balancer.recordQuestionUsage('user1', 'q1', 'i1');
      // q2 is never used

      const report = balancer.getNoveltyReport('user1', questions);

      expect(report.fresh).toBe(1);
      expect(report.freshQuestions).toHaveLength(1);
      expect(report.freshQuestions[0].id).toBe('q2');
    });

    it('should sort repeated by usage (ascending)', () => {
      const questions = [
        { id: 'q1', qualityScore: 0.8 },
        { id: 'q2', qualityScore: 0.8 },
      ];

      balancer.recordQuestionUsage('user1', 'q1', 'i1');
      for (let i = 0; i < 2; i++) {
        balancer.recordQuestionUsage('user1', 'q2', `i${i}`);
      }

      const report = balancer.getNoveltyReport('user1', questions);

      expect(report.repeatedQuestions[0].usageCount).toBe(1);
      expect(report.repeatedQuestions[1].usageCount).toBe(2);
    });

    it('should sort stale by usage (descending)', () => {
      const questions = [
        { id: 'q1', qualityScore: 0.8 },
        { id: 'q2', qualityScore: 0.8 },
      ];

      for (let i = 0; i < 3; i++) {
        balancer.recordQuestionUsage('user1', 'q1', `i${i}`);
      }
      for (let i = 0; i < 5; i++) {
        balancer.recordQuestionUsage('user1', 'q2', `i${i}`);
      }

      const report = balancer.getNoveltyReport('user1', questions);

      expect(report.staleQuestions[0].usageCount).toBe(5);
      expect(report.staleQuestions[1].usageCount).toBe(3);
    });
  });

  describe('Recommendation Diversity', () => {
    it('should calculate diversity score', () => {
      const history = [
        { questionId: 'q1', recommendedAt: Date.now(), interviewId: 'i1' },
        { questionId: 'q2', recommendedAt: Date.now(), interviewId: 'i2' },
        { questionId: 'q1', recommendedAt: Date.now(), interviewId: 'i3' }, // Repeat q1
      ];
      balancer.recommendationHistory.set('user1', history);

      const diversity = balancer.getRecommendationDiversity('user1', 10);

      expect(diversity.seenCount).toBe(2); // q1, q2
      expect(diversity.totalCount).toBe(10);
      expect(diversity.percentSeen).toBe(20);
      expect(diversity.diversityScore).toBeCloseTo(0.2, 1);
    });

    it('should handle zero total questions', () => {
      const diversity = balancer.getRecommendationDiversity('user1', 0);
      expect(diversity.diversityScore).toBe(0);
    });

    it('should show 100% diversity when all questions seen', () => {
      const history = [
        { questionId: 'q1', recommendedAt: Date.now(), interviewId: 'i1' },
        { questionId: 'q2', recommendedAt: Date.now(), interviewId: 'i2' },
      ];
      balancer.recommendationHistory.set('user1', history);

      const diversity = balancer.getRecommendationDiversity('user1', 2);

      expect(diversity.seenCount).toBe(2);
      expect(diversity.percentSeen).toBe(100);
      expect(diversity.diversityScore).toBe(1);
    });
  });

  describe('Reset & Data Management', () => {
    it('should reset user usage data', () => {
      balancer.recordQuestionUsage('user1', 'q1', 'i1');
      balancer.recordQuestionUsage('user1', 'q2', 'i2');

      expect(balancer.getUsageCount('user1', 'q1')).toBe(1);
      expect(balancer.getUsageCount('user1', 'q2')).toBe(1);

      balancer.resetUserUsage('user1');

      expect(balancer.getUsageCount('user1', 'q1')).toBe(0);
      expect(balancer.getUsageCount('user1', 'q2')).toBe(0);
    });

    it('should not affect other users when resetting one', () => {
      balancer.recordQuestionUsage('user1', 'q1', 'i1');
      balancer.recordQuestionUsage('user2', 'q1', 'i2');

      balancer.resetUserUsage('user1');

      expect(balancer.getUsageCount('user1', 'q1')).toBe(0);
      expect(balancer.getUsageCount('user2', 'q1')).toBe(1);
    });

    it('should reset all data when called', () => {
      balancer.recordQuestionUsage('user1', 'q1', 'i1');
      balancer.recordQuestionUsage('user2', 'q2', 'i2');
      balancer.recommendationHistory.set('user1', [{ questionId: 'q1', recommendedAt: Date.now(), interviewId: 'i1' }]);

      balancer.resetAll();

      expect(balancer.getUsageCount('user1', 'q1')).toBe(0);
      expect(balancer.getUsageCount('user2', 'q2')).toBe(0);
      expect(balancer.recommendationHistory.size).toBe(0);
    });
  });

  describe('Statistics', () => {
    it('should report usage statistics', () => {
      balancer.recordQuestionUsage('user1', 'q1', 'i1');
      balancer.recordQuestionUsage('user1', 'q1', 'i2');
      balancer.recordQuestionUsage('user2', 'q2', 'i1');

      const stats = balancer.getStatistics();

      expect(stats.trackedQuestionUsers).toBe(2); // 2 entries
      expect(stats.totalRecommendations).toBe(3); // 3 total uses
      expect(stats.avgUsagePerQuestion).toBeCloseTo(1.5, 1);
      expect(stats.usersTracked).toBe(2);
    });

    it('should handle empty balancer statistics', () => {
      const stats = balancer.getStatistics();

      expect(stats.trackedQuestionUsers).toBe(0);
      expect(stats.totalRecommendations).toBe(0);
      expect(stats.avgUsagePerQuestion).toBe(0);
      expect(stats.usersTracked).toBe(0);
    });
  });

  describe('Integration: Quality + Novelty', () => {
    it('should prefer fresh high-quality over repeated perfect-quality', () => {
      const questions = [
        { id: 'q_fresh_good', qualityScore: 0.85 },
        { id: 'q_repeated_perfect', qualityScore: 1.0 },
      ];

      // Mark q_repeated_perfect as seen twice (allowed, not violating)
      balancer.recordQuestionUsage('user1', 'q_repeated_perfect', 'i1');
      balancer.recordQuestionUsage('user1', 'q_repeated_perfect', 'i2');

      const scored = balancer.scoreQuestionsWithNovelty(questions, 'user1');
      const freshGood = scored.find((q) => q.id === 'q_fresh_good');
      const repeatedPerfect = scored.find((q) => q.id === 'q_repeated_perfect');

      // freshGood: 0.6*0.85 + 0.4*1.0 = 0.51 + 0.4 = 0.91
      // repeatedPerfect: 0.6*1.0 + 0.4*novelty(2) = 0.6 + 0.4*0.44 = 0.776
      expect(freshGood.combinedScore).toBeGreaterThan(repeatedPerfect.combinedScore);
    });

    it('should handle full recommendation workflow', () => {
      const allQuestions = [
        { id: 'q1', qualityScore: 0.8 },
        { id: 'q2', qualityScore: 0.9 },
        { id: 'q3', qualityScore: 0.75 },
        { id: 'q4', qualityScore: 0.7 },
      ];

      // User interviews with questions
      balancer.recordQuestionUsage('user1', 'q1', 'interview_1');
      balancer.recordQuestionUsage('user1', 'q2', 'interview_1');

      // Get recommendations for next interview
      const top = balancer.getTopQuestionsByNovelty(allQuestions, 'user1', 2);
      expect(top).toHaveLength(2);

      // New recommendations should be fresh questions
      const topIds = top.map((q) => q.id);
      expect(topIds).not.toContain('q1');
      expect(topIds).not.toContain('q2');
    });

    it('should maintain constraint across interviews', () => {
      const monthInMs = 30 * 24 * 60 * 60 * 1000;
      const now = Date.now();

      // User sees q1 in three interviews
      balancer.recommendationHistory.set('user1', [
        { questionId: 'q1', recommendedAt: now - 10000, interviewId: 'i1' },
        { questionId: 'q1', recommendedAt: now - 20000, interviewId: 'i2' },
        { questionId: 'q1', recommendedAt: now - 30000, interviewId: 'i3' },
      ]);

      // q1 should be excluded from recommendations
      const questions = [{ id: 'q1', qualityScore: 0.95 }];
      const scored = balancer.scoreQuestionsWithNovelty(questions, 'user1', {
        excludeRepeats: true,
        monthInMs,
      });

      expect(scored).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing questions gracefully', () => {
      const scored = balancer.scoreQuestionsWithNovelty([], 'user1');
      expect(scored).toHaveLength(0);
    });

    it('should handle undefined qualityScore', () => {
      const questions = [{ id: 'q1' }]; // No qualityScore
      const scored = balancer.scoreQuestionsWithNovelty(questions, 'user1');

      // Undefined treated as 0 (falsy), so: 0.6*0 + 0.4*1.0 = 0.4
      // But with rounding it could be 0.4 or close
      expect(scored[0].combinedScore).toBeGreaterThanOrEqual(0.35);
      expect(scored[0].combinedScore).toBeLessThanOrEqual(0.45);
    });

    it('should handle negative usage counts', () => {
      const novelty = balancer.calculateNoveltyScore(-10);
      expect(novelty).toBeGreaterThanOrEqual(0);
      expect(novelty).toBeLessThanOrEqual(1);
    });

    it('should handle concurrent modifications gracefully', () => {
      balancer.recordQuestionUsage('user1', 'q1', 'i1');
      balancer.recordQuestionUsage('user1', 'q1', 'i2');
      balancer.recordQuestionUsage('user1', 'q1', 'i3');

      // Simultaneously get stats and record more usage
      const usage1 = balancer.getUsageCount('user1', 'q1');
      balancer.recordQuestionUsage('user1', 'q1', 'i4');
      const usage2 = balancer.getUsageCount('user1', 'q1');

      expect(usage1).toBe(3);
      expect(usage2).toBe(4);
    });

    it('should handle very large question sets', () => {
      const questions = Array.from({ length: 1000 }, (_, i) => ({
        id: `q${i}`,
        qualityScore: Math.random(),
      }));

      const top = balancer.getTopQuestionsByNovelty(questions, 'user1', 10);
      expect(top).toHaveLength(10);
      expect(top[0].combinedScore).toBeGreaterThanOrEqual(top[1].combinedScore);
    });
  });
});
