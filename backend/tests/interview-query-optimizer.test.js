import { describe, it, expect, beforeEach } from 'vitest';
import { InterviewQueryOptimizer } from '../services/interviewQueryOptimizer.js';

describe('InterviewQueryOptimizer', () => {
  let optimizer;
  let supabaseClient;

  beforeEach(() => {
    // Create a chainable mock that supports the full Supabase query chain
    const createChain = () => ({
      select: () => createChain(),
      eq: () => createChain(),
      gte: () => createChain(),
      gt: () => createChain(),
      lt: () => createChain(),
      lte: () => createChain(),
      in: () => createChain(),
      order: () => createChain(),
      range: async () => ({ data: [], error: null }),
      single: async () => ({
        data: { id: 'test', user_id: 'user1', final_score: 85 },
        error: null,
      }),
      maybeSingle: async () => ({
        data: null,
        error: null,
      }),
      limit: () => createChain(),
    });

    supabaseClient = {
      from: () => createChain(),
    };

    optimizer = new InterviewQueryOptimizer(supabaseClient);
  });

  describe('Get Interview with State', () => {
    it('should have duration measurement', async () => {
      const result = await optimizer.getInterviewWithState('user1', 'int1');

      expect(result.duration).toBeDefined();
      expect(typeof result.duration).toBe('number');
      expect(result.duration >= 0).toBe(true);
    });

    it('should verify optimization threshold is boolean', async () => {
      const result = await optimizer.getInterviewWithState('user1', 'int1');

      expect(result.optimized).toBeDefined();
      expect(typeof result.optimized).toBe('boolean');
    });
  });

  describe('Get Conversation History', () => {
    it('should return pagination metadata', async () => {
      const result = await optimizer.getConversationHistory('int1');

      expect(result.pagination).toBeDefined();
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.pageSize).toBe(50);
    });

    it('should support page number parameter', async () => {
      const result = await optimizer.getConversationHistory('int1', 3, 25);

      expect(result.pagination.page).toBe(3);
      expect(result.pagination.pageSize).toBe(25);
    });

    it('should have turns array', async () => {
      const result = await optimizer.getConversationHistory('int1');

      expect(Array.isArray(result.turns)).toBe(true);
    });

    it('should measure query duration', async () => {
      const result = await optimizer.getConversationHistory('int1');

      expect(result.duration).toBeDefined();
      expect(typeof result.duration).toBe('number');
    });

    it('should have optimization flag', async () => {
      const result = await optimizer.getConversationHistory('int1');

      expect(result.optimized).toBeDefined();
      expect(typeof result.optimized).toBe('boolean');
    });
  });

  describe('Get User Question History', () => {
    it('should return question history array', async () => {
      const result = await optimizer.getUserQuestionHistory('user1');

      expect(Array.isArray(result.questionHistory)).toBe(true);
    });

    it('should support days parameter', async () => {
      // Should not throw
      await optimizer.getUserQuestionHistory('user1', { days: 90 });
    });

    it('should support problem ID filter', async () => {
      // Should not throw
      await optimizer.getUserQuestionHistory('user1', { problemIds: ['p1', 'p2'] });
    });

    it('should measure query duration', async () => {
      const result = await optimizer.getUserQuestionHistory('user1');

      expect(result.duration).toBeDefined();
    });
  });

  describe('Calculate Interview Stats', () => {
    it('should calculate total interviews', () => {
      const interviews = [
        { id: '1', type: 'dsa', final_score: 80, status: 'completed', created_at: '2026-05-01T10:00:00Z' },
        { id: '2', type: 'behavioral', final_score: 85, status: 'completed', created_at: '2026-05-02T10:00:00Z' },
      ];

      const result = optimizer._calculateInterviewStats(interviews);

      expect(result.total_interviews).toBe(2);
    });

    it('should calculate completion rate', () => {
      const interviews = [
        { status: 'completed', final_score: 85, type: 'dsa', created_at: '2026-05-01T10:00:00Z' },
        { status: 'completed', final_score: 80, type: 'dsa', created_at: '2026-05-01T10:00:00Z' },
        { status: 'abandoned', final_score: 0, type: 'dsa', created_at: '2026-05-01T10:00:00Z' },
      ];

      const result = optimizer._calculateInterviewStats(interviews);

      expect(result.completion_rate).toBe(67); // 2/3 = 66.67%
    });

    it('should calculate average score for completed only', () => {
      const interviews = [
        { status: 'completed', final_score: 90, type: 'dsa', created_at: '2026-05-01T10:00:00Z' },
        { status: 'completed', final_score: 80, type: 'dsa', created_at: '2026-05-01T10:00:00Z' },
        { status: 'abandoned', final_score: 50, type: 'dsa', created_at: '2026-05-01T10:00:00Z' },
      ];

      const result = optimizer._calculateInterviewStats(interviews);

      expect(result.avg_score).toBe(85); // (90+80)/2
    });

    it('should group by interview type', () => {
      const interviews = [
        { status: 'completed', final_score: 85, type: 'dsa', created_at: '2026-05-01T10:00:00Z' },
        { status: 'completed', final_score: 90, type: 'dsa', created_at: '2026-05-01T10:00:00Z' },
        { status: 'completed', final_score: 75, type: 'behavioral', created_at: '2026-05-01T10:00:00Z' },
      ];

      const result = optimizer._calculateInterviewStats(interviews);

      expect(result.by_type.dsa.count).toBe(2);
      expect(result.by_type.dsa.avg_score).toBe(88); // (85+90)/2
      expect(result.by_type.behavioral.count).toBe(1);
    });

    it('should group by status', () => {
      const interviews = [
        { status: 'completed', final_score: 85, type: 'dsa', created_at: '2026-05-01T10:00:00Z' },
        { status: 'completed', final_score: 90, type: 'dsa', created_at: '2026-05-01T10:00:00Z' },
        { status: 'abandoned', final_score: 0, type: 'dsa', created_at: '2026-05-01T10:00:00Z' },
      ];

      const result = optimizer._calculateInterviewStats(interviews);

      expect(result.by_status.completed).toBe(2);
      expect(result.by_status.abandoned).toBe(1);
    });

    it('should handle empty list', () => {
      const result = optimizer._calculateInterviewStats([]);

      expect(result.total_interviews).toBe(0);
      expect(result.completion_rate).toBe(0);
      expect(result.avg_score).toBe(0);
    });

    it('should handle null data', () => {
      const result = optimizer._calculateInterviewStats(null);

      expect(result.total_interviews).toBe(0);
    });

    it('should calculate 7-day trend correctly', () => {
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const twoDaysAgo = new Date(now);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const tenDaysAgo = new Date(now);
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

      const interviews = [
        { status: 'completed', final_score: 85, type: 'dsa', created_at: now.toISOString() },
        { status: 'completed', final_score: 90, type: 'dsa', created_at: yesterday.toISOString() },
        { status: 'completed', final_score: 75, type: 'dsa', created_at: twoDaysAgo.toISOString() },
        { status: 'completed', final_score: 70, type: 'dsa', created_at: tenDaysAgo.toISOString() },
      ];

      const result = optimizer._calculateInterviewStats(interviews);

      // Last 3 should be within 7 days (now, -1, -2), but -10 is excluded
      expect(result.trend_7days.length).toBe(3);
    });

    it('should track score and type in trend', () => {
      const now = new Date();
      const interviews = [
        { status: 'completed', final_score: 85, type: 'dsa', created_at: now.toISOString() },
      ];

      const result = optimizer._calculateInterviewStats(interviews);

      expect(result.trend_7days[0].score).toBe(85);
      expect(result.trend_7days[0].type).toBe('dsa');
    });

    it('should handle zero final score', () => {
      const interviews = [
        { status: 'abandoned', final_score: 0, type: 'dsa', created_at: '2026-05-01T10:00:00Z' },
      ];

      const result = optimizer._calculateInterviewStats(interviews);

      expect(result.avg_score).toBe(0); // No completed interviews
    });

    it('should calculate average per type correctly', () => {
      const interviews = [
        { status: 'completed', final_score: 100, type: 'dsa', created_at: '2026-05-01T10:00:00Z' },
        { status: 'completed', final_score: 50, type: 'dsa', created_at: '2026-05-01T10:00:00Z' },
        { status: 'completed', final_score: 75, type: 'behavioral', created_at: '2026-05-01T10:00:00Z' },
      ];

      const result = optimizer._calculateInterviewStats(interviews);

      expect(result.by_type.dsa.avg_score).toBe(75); // (100+50)/2
      expect(result.by_type.behavioral.avg_score).toBe(75);
    });
  });

  describe('Get User Interview Stats', () => {
    it('should return stats object', async () => {
      const result = await optimizer.getUserInterviewStats('user1');

      expect(result.stats).toBeDefined();
      expect(result.duration).toBeDefined();
    });

    it('should measure query duration', async () => {
      const result = await optimizer.getUserInterviewStats('user1');

      expect(typeof result.duration).toBe('number');
      expect(result.duration >= 0).toBe(true);
    });

    it('should have optimization flag', async () => {
      const result = await optimizer.getUserInterviewStats('user1');

      expect(result.optimized).toBeDefined();
      expect(typeof result.optimized).toBe('boolean');
    });
  });

  describe('Validate Indexes', () => {
    it('should return report structure', async () => {
      const report = await optimizer.validateIndexes();

      expect(report.expected_indexes).toBeDefined();
      expect(Array.isArray(report.expected_indexes)).toBe(true);
    });

    it('should list multiple indexes', async () => {
      const report = await optimizer.validateIndexes();

      expect(report.expected_indexes.length).toBeGreaterThan(0);
    });

    it('should include table and columns for each index', async () => {
      const report = await optimizer.validateIndexes();

      report.expected_indexes.forEach((idx) => {
        expect(idx.table).toBeDefined();
        expect(idx.columns).toBeDefined();
        expect(Array.isArray(idx.columns)).toBe(true);
      });
    });

    it('should include purpose description', async () => {
      const report = await optimizer.validateIndexes();

      report.expected_indexes.forEach((idx) => {
        expect(idx.purpose).toBeDefined();
        expect(typeof idx.purpose).toBe('string');
      });
    });

    it('should have validation status', async () => {
      const report = await optimizer.validateIndexes();

      expect(report.validation_status).toBe('ADVISORY');
    });
  });

  describe('Performance Thresholds', () => {
    it('should have single query threshold', () => {
      expect(optimizer.SINGLE_QUERY_THRESHOLD).toBe(100);
    });

    it('should have page query threshold', () => {
      expect(optimizer.PAGE_QUERY_THRESHOLD).toBe(200);
    });

    it('should have aggregate query threshold', () => {
      expect(optimizer.AGGREGATE_QUERY_THRESHOLD).toBe(500);
    });

    it('should have reasonable threshold values', () => {
      expect(optimizer.SINGLE_QUERY_THRESHOLD).toBeLessThan(optimizer.PAGE_QUERY_THRESHOLD);
      expect(optimizer.PAGE_QUERY_THRESHOLD).toBeLessThan(optimizer.AGGREGATE_QUERY_THRESHOLD);
    });
  });

  describe('Benchmark Query', () => {
    it('should measure query performance', async () => {
      let callCount = 0;
      const mockQuery = async () => {
        callCount++;
      };

      const result = await optimizer.benchmarkQuery('testQuery', mockQuery);

      expect(result.operation).toBe('testQuery');
      expect(result.iterations).toBe(5);
      expect(callCount).toBe(5);
    });

    it('should calculate performance metrics', async () => {
      const mockQuery = async () => {
        // Simulate 10ms latency
        await new Promise((resolve) => setTimeout(resolve, 10));
      };

      const result = await optimizer.benchmarkQuery('slowQuery', mockQuery);

      expect(result.avg).toBeGreaterThan(0);
      expect(result.min).toBeGreaterThan(0);
      expect(result.max).toBeGreaterThan(0);
      expect(result.p95).toBeGreaterThan(0);
    });

    it('should have reasonable percentile order', async () => {
      const mockQuery = async () => {};

      const result = await optimizer.benchmarkQuery('test', mockQuery);

      expect(result.min).toBeLessThanOrEqual(result.avg);
      expect(result.avg).toBeLessThanOrEqual(result.max);
    });
  });

  describe('Query Methods Exist', () => {
    it('should have getInterviewWithState method', async () => {
      expect(typeof optimizer.getInterviewWithState).toBe('function');
    });

    it('should have getConversationHistory method', async () => {
      expect(typeof optimizer.getConversationHistory).toBe('function');
    });

    it('should have getUserQuestionHistory method', async () => {
      expect(typeof optimizer.getUserQuestionHistory).toBe('function');
    });

    it('should have getUserInterviewStats method', async () => {
      expect(typeof optimizer.getUserInterviewStats).toBe('function');
    });

    it('should have getQuestionQualityAnalytics method', async () => {
      expect(typeof optimizer.getQuestionQualityAnalytics).toBe('function');
    });

    it('should have getStageAnalytics method', async () => {
      expect(typeof optimizer.getStageAnalytics).toBe('function');
    });

    it('should have validateIndexes method', async () => {
      expect(typeof optimizer.validateIndexes).toBe('function');
    });

    it('should have benchmarkQuery method', async () => {
      expect(typeof optimizer.benchmarkQuery).toBe('function');
    });
  });
});
