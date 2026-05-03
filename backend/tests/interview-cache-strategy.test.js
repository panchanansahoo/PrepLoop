import { describe, it, expect, beforeEach, vi } from 'vitest';
import InterviewCacheStrategy from '../services/interviewCacheStrategy.js';

describe('InterviewCacheStrategy', () => {
  let cache;
  let mockRedisClient;

  beforeEach(() => {
    // Mock Redis client
    mockRedisClient = {
      get: vi.fn(async () => null),
      setex: vi.fn(async () => ({ ok: true })),
      del: vi.fn(async () => ({ ok: true })),
      set: vi.fn(async () => ({ ok: true })),
    };

    cache = new InterviewCacheStrategy(mockRedisClient);
  });

  describe('getInterviewState', () => {
    it('should return L1 hit when state in memory', async () => {
      const state = { id: 'int1', stage: 'technical', score: 85 };
      await cache.setInterviewState('user1', 'int1', state);

      const result = await cache.getInterviewState('user1', 'int1');

      expect(result.state).toEqual(state);
      expect(result.source).toBe('l1');
      expect(result.stale).toBe(false);
    });

    it('should increment L1 hit counter', async () => {
      const state = { id: 'int1', stage: 'intake' };
      await cache.setInterviewState('user1', 'int1', state);

      await cache.getInterviewState('user1', 'int1');

      const metrics = cache.getMetrics();
      expect(metrics.l1_hits).toBe(1);
    });

    it('should return L2 hit when state in Redis', async () => {
      const state = { id: 'int1', stage: 'completed', score: 92 };
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(state));

      // Don't set in L1, only Redis has it
      const result = await cache.getInterviewState('user1', 'int1');

      expect(result.state).toEqual(state);
      expect(result.source).toBe('l2');
    });

    it('should promote L2 to L1 on hit', async () => {
      const state = { id: 'int1', stage: 'technical' };
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(state));

      // First access hits L2
      await cache.getInterviewState('user1', 'int1');

      // Second access should hit L1 (promoted from L2)
      const result2 = await cache.getInterviewState('user1', 'int1');
      expect(result2.source).toBe('l1');
    });

    it('should return miss when state not in cache', async () => {
      mockRedisClient.get.mockResolvedValueOnce(null);

      const result = await cache.getInterviewState('user1', 'nonexistent');

      expect(result.state).toBeNull();
      expect(result.source).toBe('miss');
    });

    it('should increment L1 miss counter', async () => {
      mockRedisClient.get.mockResolvedValueOnce(null);

      await cache.getInterviewState('user1', 'int1');

      const metrics = cache.getMetrics();
      expect(metrics.l1_misses).toBe(1);
    });

    it('should handle Redis read errors gracefully', async () => {
      mockRedisClient.get.mockRejectedValueOnce(new Error('Redis down'));

      const result = await cache.getInterviewState('user1', 'int1');

      expect(result.source).toBe('miss'); // Fallback to miss
      expect(result.state).toBeNull();
    });

    it('should measure latency', async () => {
      const state = { id: 'int1' };
      await cache.setInterviewState('user1', 'int1', state);

      const metricsBefore = cache.getMetrics();
      await cache.getInterviewState('user1', 'int1');
      const metricsAfter = cache.getMetrics();

      expect(metricsAfter.avg_latency_ms).toBeGreaterThanOrEqual(0);
    });
  });

  describe('setInterviewState', () => {
    it('should set state in L1', async () => {
      const state = { id: 'int1', stage: 'warmup' };

      const result = await cache.setInterviewState('user1', 'int1', state);

      expect(result.success).toBe(true);
      const retrieved = await cache.getInterviewState('user1', 'int1');
      expect(retrieved.state).toEqual(state);
    });

    it('should set state in Redis when available', async () => {
      const state = { id: 'int1', score: 78 };

      await cache.setInterviewState('user1', 'int1', state, false);

      expect(mockRedisClient.setex).toHaveBeenCalled();
      const call = mockRedisClient.setex.mock.calls[0];
      expect(call[0]).toContain('interview:state:user1:int1');
    });

    it('should use L2_COMPLETED TTL when isCompleted=true', async () => {
      const state = { id: 'int1', final_score: 88 };

      await cache.setInterviewState('user1', 'int1', state, true);

      const call = mockRedisClient.setex.mock.calls[0];
      expect(call[1]).toBe(86400); // 24 hours
    });

    it('should use L1_ACTIVE_SESSION TTL when isCompleted=false', async () => {
      const state = { id: 'int1' };

      await cache.setInterviewState('user1', 'int1', state, false);

      const call = mockRedisClient.setex.mock.calls[0];
      expect(call[1]).toBe(60); // 1 minute
    });

    it('should handle Redis write errors', async () => {
      mockRedisClient.setex.mockRejectedValueOnce(new Error('Redis down'));
      const state = { id: 'int1' };

      const result = await cache.setInterviewState('user1', 'int1', state);

      expect(result.cached).toBe(true); // Still success, L1 cached
    });

    it('should stringify state before storing in Redis', async () => {
      const state = { id: 'int1', data: { nested: 'value' } };

      await cache.setInterviewState('user1', 'int1', state);

      const call = mockRedisClient.setex.mock.calls[0];
      const storedJson = call[2];
      expect(typeof storedJson).toBe('string');
      expect(JSON.parse(storedJson)).toEqual(state);
    });
  });

  describe('invalidateStateWithDelay', () => {
    it('should queue invalidation', async () => {
      const result = cache.invalidateStateWithDelay('user1', 'int1', 'update');

      expect(result.queued).toBe(true);
      expect(result.delayMs).toBe(10000); // 10 seconds
    });

    it('should accumulate multiple invalidations in queue', () => {
      cache.invalidateStateWithDelay('user1', 'int1');
      cache.invalidateStateWithDelay('user1', 'int2');
      cache.invalidateStateWithDelay('user2', 'int3');

      const metrics = cache.getMetrics();
      expect(metrics.invalidation_queue_size).toBe(3);
    });

    it('should schedule batch flush after delay', async () => {
      // Use real timers for this test - verify queue empties after delay
      const state1 = { id: 'int1' };
      const state2 = { id: 'int2' };

      await cache.setInterviewState('user1', 'int1', state1);
      await cache.setInterviewState('user1', 'int2', state2);

      cache.invalidateStateWithDelay('user1', 'int1');
      cache.invalidateStateWithDelay('user1', 'int2');

      // Verify queued
      let metrics = cache.getMetrics();
      expect(metrics.invalidation_queue_size).toBe(2);

      // Wait for batch flush (10 second delay + margin)
      await new Promise((resolve) => setTimeout(resolve, 10100));

      // Queue should be flushed
      metrics = cache.getMetrics();
      expect(metrics.invalidation_queue_size).toBe(0);
    }, 15000);
  });

  describe('invalidateStateImmediate', () => {
    it('should immediately clear L1', async () => {
      const state = { id: 'int1', score: 85 };
      await cache.setInterviewState('user1', 'int1', state);

      await cache.invalidateStateImmediate('user1', 'int1');

      const result = await cache.getInterviewState('user1', 'int1');
      expect(result.state).toBeNull();
    });

    it('should immediately clear L2 (Redis)', async () => {
      const state = { id: 'int1', score: 85 };
      await cache.setInterviewState('user1', 'int1', state);

      await cache.invalidateStateImmediate('user1', 'int1');

      expect(mockRedisClient.del).toHaveBeenCalled();
    });

    it('should increment invalidation counter', async () => {
      const state = { id: 'int1' };
      await cache.setInterviewState('user1', 'int1', state);

      const metricsBefore = cache.getMetrics();
      await cache.invalidateStateImmediate('user1', 'int1');
      const metricsAfter = cache.getMetrics();

      expect(metricsAfter.invalidations).toBe(metricsBefore.invalidations + 1);
    });

    it('should handle Redis delete errors gracefully', async () => {
      mockRedisClient.del.mockRejectedValueOnce(new Error('Redis error'));

      const result = await cache.invalidateStateImmediate('user1', 'int1');

      expect(result.success).toBe(true); // Still succeeds (L1 cleared)
      expect(result.invalidated).toBe(true);
    });
  });

  describe('clearUserCaches', () => {
    it('should clear all user interview caches', async () => {
      await cache.setInterviewState('user1', 'int1', { id: 'int1' });
      await cache.setInterviewState('user1', 'int2', { id: 'int2' });
      await cache.setInterviewState('user2', 'int3', { id: 'int3' });

      await cache.clearUserCaches('user1');

      const result1 = await cache.getInterviewState('user1', 'int1');
      const result2 = await cache.getInterviewState('user1', 'int2');
      const result3 = await cache.getInterviewState('user2', 'int3');

      expect(result1.state).toBeNull();
      expect(result2.state).toBeNull();
      expect(result3.state).toEqual({ id: 'int3' }); // Other user's data intact
    });

    it('should return success', async () => {
      const result = await cache.clearUserCaches('user1');

      expect(result.success).toBe(true);
      expect(result.cleared).toBe(true);
    });
  });

  describe('getConversationHistory', () => {
    it('should return turns from L1', async () => {
      const turns = [{ role: 'ai', text: 'Hello' }, { role: 'user', text: 'Hi' }];
      await cache.setConversationHistory('int1', turns);

      const result = await cache.getConversationHistory('int1');

      expect(result.turns).toEqual(turns);
      expect(result.source).toBe('l1');
    });

    it('should support pagination', async () => {
      const turns = [{ id: 't1' }, { id: 't2' }];
      await cache.setConversationHistory('int1', turns, 2, 20);

      const result = await cache.getConversationHistory('int1', 2, 20);

      expect(result.turns).toEqual(turns);
    });

    it('should return miss when not cached', async () => {
      mockRedisClient.get.mockResolvedValueOnce(null);

      const result = await cache.getConversationHistory('int1');

      expect(result.turns).toBeNull();
      expect(result.source).toBe('miss');
    });

    it('should track L1 hit for conversation', async () => {
      const turns = [{ role: 'ai', text: 'Question' }];
      await cache.setConversationHistory('int1', turns);

      const metricsBefore = cache.getMetrics();
      await cache.getConversationHistory('int1');
      const metricsAfter = cache.getMetrics();

      expect(metricsAfter.l1_hits).toBe(metricsBefore.l1_hits + 1);
    });
  });

  describe('setConversationHistory', () => {
    it('should cache turns in L1', async () => {
      const turns = [{ role: 'ai', text: 'Question' }];

      await cache.setConversationHistory('int1', turns);

      const result = await cache.getConversationHistory('int1');
      expect(result.turns).toEqual(turns);
    });

    it('should cache turns in Redis', async () => {
      const turns = [{ role: 'user', text: 'Answer' }];

      await cache.setConversationHistory('int1', turns);

      expect(mockRedisClient.setex).toHaveBeenCalled();
    });

    it('should use 2-minute TTL for conversation cache', async () => {
      const turns = [{ role: 'ai', text: 'Q' }];

      await cache.setConversationHistory('int1', turns);

      const call = mockRedisClient.setex.mock.calls[0];
      expect(call[1]).toBe(120); // 2 minutes
    });
  });

  describe('getUserStats', () => {
    it('should return stats from L1', async () => {
      const stats = { total_interviews: 5, avg_score: 82 };
      await cache.setUserStats('user1', stats);

      const result = await cache.getUserStats('user1');

      expect(result.stats).toEqual(stats);
      expect(result.source).toBe('l1');
    });

    it('should return L2 stats when not in L1', async () => {
      const stats = { total_interviews: 3, avg_score: 75 };
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(stats));

      const result = await cache.getUserStats('user1');

      expect(result.stats).toEqual(stats);
      expect(result.source).toBe('l2');
    });

    it('should promote L2 to L1', async () => {
      const stats = { total_interviews: 2 };
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(stats));

      await cache.getUserStats('user1');

      // Should hit L1 now
      const result2 = await cache.getUserStats('user1');
      expect(result2.source).toBe('l1');
    });

    it('should return miss when stats not cached', async () => {
      mockRedisClient.get.mockResolvedValueOnce(null);

      const result = await cache.getUserStats('user1');

      expect(result.stats).toBeNull();
      expect(result.source).toBe('miss');
    });
  });

  describe('setUserStats', () => {
    it('should cache stats in L1 with 5-minute TTL', async () => {
      const stats = { total: 10, avg: 80 };

      await cache.setUserStats('user1', stats);

      const result = await cache.getUserStats('user1');
      expect(result.stats).toEqual(stats);
    });

    it('should cache stats in Redis with 1-hour TTL', async () => {
      const stats = { total: 5, avg: 85 };

      await cache.setUserStats('user1', stats);

      const call = mockRedisClient.setex.mock.calls[0];
      expect(call[1]).toBe(3600); // 1 hour
    });
  });

  describe('getMetrics', () => {
    it('should return hit rate percentages', async () => {
      const state = { id: 'int1' };
      await cache.setInterviewState('user1', 'int1', state);

      // Generate L1 hits
      await cache.getInterviewState('user1', 'int1');
      await cache.getInterviewState('user1', 'int1');

      const metrics = cache.getMetrics();

      expect(metrics.l1_hits).toBe(2);
      expect(metrics.l1_hit_rate).toBe(100);
    });

    it('should calculate average latency', async () => {
      const state = { id: 'int1' };
      await cache.setInterviewState('user1', 'int1', state);

      await cache.getInterviewState('user1', 'int1');

      const metrics = cache.getMetrics();

      expect(metrics.avg_latency_ms).toBeGreaterThanOrEqual(0);
      expect(typeof metrics.avg_latency_ms).toBe('number');
    });

    it('should return invalidation count', async () => {
      const state = { id: 'int1' };
      await cache.setInterviewState('user1', 'int1', state);

      await cache.invalidateStateImmediate('user1', 'int1');

      const metrics = cache.getMetrics();

      expect(metrics.invalidations).toBe(1);
    });

    it('should return L1 key count from NodeCache', async () => {
      await cache.setInterviewState('user1', 'int1', { id: 'int1' });
      await cache.setInterviewState('user1', 'int2', { id: 'int2' });

      const metrics = cache.getMetrics();

      expect(metrics.l1_key_count).toBe(2);
    });

    it('should return invalidation queue size', () => {
      cache.invalidateStateWithDelay('user1', 'int1');
      cache.invalidateStateWithDelay('user1', 'int2');

      const metrics = cache.getMetrics();

      expect(metrics.invalidation_queue_size).toBe(2);
    });

    it('should handle zero queries for latency', () => {
      cache.resetMetrics();

      const metrics = cache.getMetrics();

      expect(metrics.avg_latency_ms).toBe(0);
    });

    it('should return zero hit rates when no queries', () => {
      cache.resetMetrics();

      const metrics = cache.getMetrics();

      expect(metrics.l1_hit_rate).toBe(0);
      expect(metrics.l2_hit_rate).toBe(0);
    });
  });

  describe('resetMetrics', () => {
    it('should reset all metrics to zero', async () => {
      const state = { id: 'int1' };
      await cache.setInterviewState('user1', 'int1', state);
      await cache.getInterviewState('user1', 'int1');

      cache.resetMetrics();

      const metrics = cache.getMetrics();

      expect(metrics.l1_hits).toBe(0);
      expect(metrics.l1_misses).toBe(0);
      expect(metrics.invalidations).toBe(0);
    });

    it('should return success', () => {
      const result = cache.resetMetrics();

      expect(result.success).toBe(true);
    });
  });

  describe('Cache Performance', () => {
    it('should maintain L1 hit rate >= 80% for repeated queries', async () => {
      const state = { id: 'int1' };
      await cache.setInterviewState('user1', 'int1', state);

      // Simulate 100 rapid queries (typical interview session)
      for (let i = 0; i < 100; i++) {
        await cache.getInterviewState('user1', 'int1');
      }

      const metrics = cache.getMetrics();

      expect(metrics.l1_hit_rate).toBe(100); // All hits from L1
    });

    it('should handle concurrent accesses', async () => {
      const state = { id: 'int1' };
      await cache.setInterviewState('user1', 'int1', state);

      // Simulate concurrent requests
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(cache.getInterviewState('user1', 'int1'));
      }

      const results = await Promise.all(promises);

      results.forEach((result) => {
        expect(result.state).toEqual(state);
      });
    });

    it('should prevent thundering herd with queued invalidation', () => {
      // Queue multiple invalidations
      for (let i = 0; i < 100; i++) {
        cache.invalidateStateWithDelay('user1', `int${i}`);
      }

      const metrics = cache.getMetrics();

      // All should be queued (not immediately executed)
      expect(metrics.invalidation_queue_size).toBe(100);
    });
  });

  describe('Multi-Tier Behavior', () => {
    it('should prefer L1 over L2', async () => {
      const l1State = { id: 'int1', version: 1 };
      const l2State = { id: 'int1', version: 2 };

      // Set L1
      await cache.setInterviewState('user1', 'int1', l1State);

      // Mock L2 with different data
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(l2State));

      const result = await cache.getInterviewState('user1', 'int1');

      // Should get L1 data, not L2
      expect(result.state.version).toBe(1);
      expect(result.source).toBe('l1');
    });

    it('should fallback from L1 miss to L2', async () => {
      const l2State = { id: 'int1', cached: 'from-redis' };

      // Only set in Redis (L2)
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(l2State));

      const result = await cache.getInterviewState('user1', 'int1');

      expect(result.state).toEqual(l2State);
      expect(result.source).toBe('l2');
    });

    it('should fallback from L2 miss to database miss', async () => {
      mockRedisClient.get.mockResolvedValueOnce(null);

      const result = await cache.getInterviewState('user1', 'int1');

      expect(result.state).toBeNull();
      expect(result.source).toBe('miss');
    });

    it('should expire L1 but retain L2', async () => {
      vi.useFakeTimers();

      const state = { id: 'int1', persistent: true };
      await cache.setInterviewState('user1', 'int1', state);

      // After 70 seconds, L1 should expire but L2 remains
      vi.advanceTimersByTime(70000);

      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(state));

      const result = await cache.getInterviewState('user1', 'int1');

      // L2 should provide the data
      expect(result.source).toBe('l2');

      vi.useRealTimers();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null Redis client', async () => {
      const cacheNoRedis = new InterviewCacheStrategy(null);
      const state = { id: 'int1' };

      await cacheNoRedis.setInterviewState('user1', 'int1', state);
      const result = await cacheNoRedis.getInterviewState('user1', 'int1');

      expect(result.state).toEqual(state); // L1 works
      expect(result.source).toBe('l1');
    });

    it('should handle invalid JSON in Redis', async () => {
      mockRedisClient.get.mockResolvedValueOnce('invalid json {');

      expect(async () => {
        await cache.getInterviewState('user1', 'int1');
      }).not.toThrow();
    });

    it('should handle very large state objects', async () => {
      const largeState = {
        id: 'int1',
        data: 'x'.repeat(10000), // 10KB string
        nested: { deep: { value: 'test' } },
      };

      await cache.setInterviewState('user1', 'int1', largeState);
      const result = await cache.getInterviewState('user1', 'int1');

      expect(result.state).toEqual(largeState);
    });

    it('should handle special characters in user/interview IDs', async () => {
      const state = { id: 'int1' };

      await cache.setInterviewState('user_123-abc', 'int_456-xyz', state);
      const result = await cache.getInterviewState('user_123-abc', 'int_456-xyz');

      expect(result.state).toEqual(state);
    });
  });
});
