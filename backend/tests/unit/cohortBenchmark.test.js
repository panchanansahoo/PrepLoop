import { describe, it, expect } from 'vitest';
import {
  extractScores,
  calculatePercentileRank,
  calculateCohortStatistics,
  generateBellCurveDistribution,
  calculateRelativeScore,
  getCohortTier,
  calculateCohortBenchmark,
} from '../../utils/cohortBenchmark.js';

describe('cohortBenchmark utility', () => {
  describe('extractScores', () => {
    it('normalizes array of numbers and clamps to 0-100', () => {
      const input = [85, 42, 110, -5, 75.6];
      const result = extractScores(input);
      expect(result).toEqual([0, 42, 76, 85, 100]);
    });

    it('extracts scores from various submission object formats', () => {
      const input = [
        { overall_score: 90 },
        { scores: { serverOverallScore: 75 } },
        { scores: { score: 82 } },
        { score: 68 },
        { invalid: true },
        null,
      ];
      const result = extractScores(input);
      expect(result).toEqual([68, 75, 82, 90]);
    });

    it('handles empty or non-array inputs', () => {
      expect(extractScores([])).toEqual([]);
      expect(extractScores(null)).toEqual([]);
      expect(extractScores(undefined)).toEqual([]);
    });
  });

  describe('calculatePercentileRank', () => {
    it('calculates accurate percentile for candidate above median', () => {
      const cohort = [50, 60, 70, 80, 90];
      const res = calculatePercentileRank(85, cohort);
      // 85 is above 50, 60, 70, 80 (4 below, 0 equal, total 6 with candidate)
      expect(res.percentile).toBeGreaterThanOrEqual(60);
      expect(res.rank).toBe(2); // Only 90 is higher
      expect(res.topPercentage).toBe(100 - res.percentile);
    });

    it('handles candidate in single-member cohort', () => {
      const res = calculatePercentileRank(80, []);
      expect(res.percentile).toBe(50);
      expect(res.rank).toBe(1);
      expect(res.total).toBe(1);
    });

    it('handles identical scores in cohort', () => {
      const cohort = [75, 75, 75, 75];
      const res = calculatePercentileRank(75, cohort);
      expect(res.percentile).toBe(50);
      expect(res.rank).toBe(1);
    });
  });

  describe('calculateCohortStatistics', () => {
    it('computes accurate mean, median, stdDev, min, max, p25, p75', () => {
      const cohort = [60, 70, 80, 90, 100];
      const stats = calculateCohortStatistics(cohort);

      expect(stats.count).toBe(5);
      expect(stats.mean).toBe(80);
      expect(stats.median).toBe(80);
      expect(stats.min).toBe(60);
      expect(stats.max).toBe(100);
      expect(stats.stdDev).toBeGreaterThan(13);
      expect(stats.p25).toBe(70);
      expect(stats.p75).toBe(90);
      expect(stats.iqr).toBe(20);
    });

    it('handles empty cohort', () => {
      const stats = calculateCohortStatistics([]);
      expect(stats.count).toBe(0);
      expect(stats.mean).toBe(0);
    });
  });

  describe('generateBellCurveDistribution', () => {
    it('creates 10 histogram buckets and identifies candidate bucket', () => {
      const cohort = [15, 25, 45, 65, 75, 82, 85, 95];
      const buckets = generateBellCurveDistribution(cohort, 82, 10);

      expect(buckets).toHaveLength(10);
      const candidateBucket = buckets.find((b) => b.isCandidateBucket);
      expect(candidateBucket).toBeDefined();
      expect(candidateBucket.label).toBe('80-89');
      expect(candidateBucket.count).toBe(2); // 82 and 85
    });
  });

  describe('calculateRelativeScore', () => {
    it('computes delta from mean, delta from median, and z-score', () => {
      const cohort = [60, 70, 80, 90, 100]; // mean = 80, median = 80
      const relative = calculateRelativeScore(95, cohort);

      expect(relative.deltaFromMean).toBe(15);
      expect(relative.deltaFromMedian).toBe(15);
      expect(relative.zScore).toBeGreaterThan(1.0);
      expect(relative.rank).toBe(2);
    });
  });

  describe('getCohortTier', () => {
    it('categorizes high performers into Top 10% tier', () => {
      const tier = getCohortTier(92, 90);
      expect(tier.tier).toBe('Top 10%');
      expect(tier.variant).toBe('emerald');
    });

    it('categorizes mid performers into Solid or Developing tier', () => {
      const tier = getCohortTier(60, 68);
      expect(tier.variant).toBe('indigo');
    });
  });

  describe('calculateCohortBenchmark', () => {
    it('produces full benchmark payload with badge and distribution', () => {
      const candidate = { overall_score: 88 };
      const cohort = [
        { overall_score: 65 },
        { overall_score: 72 },
        { overall_score: 80 },
        { overall_score: 88 },
        { overall_score: 94 },
      ];

      const benchmark = calculateCohortBenchmark(candidate, cohort);

      expect(benchmark.candidateScore).toBe(88);
      expect(benchmark.percentile).toBeGreaterThan(60);
      expect(benchmark.badge.text).toMatch(/^Top \d+%/);
      expect(benchmark.badge.rankText).toBe('Rank 2 of 5');
      expect(benchmark.stats.cohortSize ?? benchmark.cohortSize).toBe(5);
      expect(benchmark.distribution).toHaveLength(10);
      expect(benchmark.relative.deltaFromMean).toBeGreaterThan(0);
    });

    it('handles empty cohort gracefully by anchoring candidate', () => {
      const benchmark = calculateCohortBenchmark(82, []);
      expect(benchmark.candidateScore).toBe(82);
      expect(benchmark.cohortSize).toBe(1);
      expect(benchmark.badge.text).toBe('Top 50%');
    });
  });
});
