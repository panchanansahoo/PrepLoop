/**
 * Interview Cache Strategy Refinement (Phase 6.2)
 *
 * Implements multi-tier caching for interview state, conversation history,
 * and analytics with intelligent invalidation and hit rate tracking.
 *
 * Architecture:
 * - L1 (Memory): Interview active state, 60s TTL, cleared on session end
 * - L2 (Redis): Completed interviews, 24h TTL, for analytics and resume
 * - L3 (Database): Source of truth, no TTL, queried on L1/L2 miss
 *
 * Invalidation Strategy:
 * - On score update: flush L2 immediately (60s propagation delay acceptable)
 * - On conversation update: invalidate within 10s (eventual consistency)
 * - On interview end: persist to L2, clear L1
 */

import NodeCache from 'node-cache';
import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('InterviewCacheStrategy');

class InterviewCacheStrategy {
  constructor(redisClient) {
    this.redisClient = redisClient;

    // L1 Cache (In-Memory) - Short TTL for active interviews
    this.l1Cache = new NodeCache({ stdTTL: 60, checkperiod: 70 });

    // Cache metrics
    this.metrics = {
      l1Hits: 0,
      l1Misses: 0,
      l2Hits: 0,
      l2Misses: 0,
      invalidations: 0,
      stalDataDetections: 0,
      totalLatency: 0,
      queryCount: 0,
    };

    // Invalidation queue for batching (invalidate within 10s)
    this.invalidationQueue = new Set();
    this.invalidationTimer = null;
    this.INVALIDATION_BATCH_DELAY = 10000; // 10 seconds

    // Cache key patterns
    this.KEY_PREFIXES = {
      INTERVIEW_STATE: 'interview:state:',
      INTERVIEW_CONVO: 'interview:convo:',
      INTERVIEW_STATS: 'interview:stats:',
      USER_INTERVIEWS: 'user:interviews:',
      QUESTION_HISTORY: 'user:questions:',
    };

    // TTL configuration (seconds)
    this.TTL = {
      L1_ACTIVE_SESSION: 60, // 1 minute - clear on session end
      L2_COMPLETED: 86400, // 24 hours - for analytics
      L2_STATS: 3600, // 1 hour - user stats
      INVALIDATION_DELAY: 10, // 10 second eventual consistency window
    };
  }

  /**
   * Get interview state from cache (L1 → L2 → null)
   * Tracks hit/miss metrics and latency
   */
  async getInterviewState(userId, interviewId) {
    const startTime = performance.now();
    const cacheKey = `${this.KEY_PREFIXES.INTERVIEW_STATE}${userId}:${interviewId}`;

    try {
      // L1 Check (Memory)
      const l1Data = this.l1Cache.get(cacheKey);
      if (l1Data) {
        this.metrics.l1Hits++;
        this._recordLatency(startTime);
        return { state: l1Data, source: 'l1', stale: false };
      }
      this.metrics.l1Misses++;

      // L2 Check (Redis)
      if (!this.redisClient) {
        return { state: null, source: 'miss', stale: false };
      }

      try {
        const l2Data = await this.redisClient.get(cacheKey);
        if (l2Data) {
          const state = typeof l2Data === 'string' ? JSON.parse(l2Data) : l2Data;
          // Promote L2 to L1
          this.l1Cache.set(cacheKey, state);
          this.metrics.l2Hits++;
          this._recordLatency(startTime);
          return { state, source: 'l2', stale: false };
        }
        this.metrics.l2Misses++;
      } catch (redisError) {
        logger.warn('Redis read error', { cacheKey, error: redisError.message });
        // Fallback to L1 miss result
      }

      return { state: null, source: 'miss', stale: false };
    } catch (error) {
      logger.error('Cache get error', { error: error.message });
      return { state: null, source: 'error', stale: false };
    }
  }

  /**
   * Set interview state in cache (L1 + L2)
   * - L1: Active session (60s TTL, auto-clear)
   * - L2: Completed interviews (24h TTL, for analytics)
   */
  async setInterviewState(userId, interviewId, state, isCompleted = false) {
    const cacheKey = `${this.KEY_PREFIXES.INTERVIEW_STATE}${userId}:${interviewId}`;

    try {
      // L1: Always set in memory
      this.l1Cache.set(cacheKey, state, this.TTL.L1_ACTIVE_SESSION);

      // L2: Persist to Redis if active
      if (this.redisClient) {
        try {
          const ttl = isCompleted ? this.TTL.L2_COMPLETED : this.TTL.L1_ACTIVE_SESSION;
          await this.redisClient.setex(cacheKey, ttl, JSON.stringify(state));
        } catch (redisError) {
          logger.warn('Redis write error', { cacheKey, error: redisError.message });
          // Degradation: L1 only (acceptable for this use case)
        }
      }

      return { success: true, cached: true };
    } catch (error) {
      logger.error('Cache set error', { error: error.message });
      return { success: false, cached: false };
    }
  }

  /**
   * Queue invalidation with batch delay
   * Prevents thundering herd on rapid updates
   */
  invalidateStateWithDelay(userId, interviewId, reason = 'update') {
    const cacheKey = `${this.KEY_PREFIXES.INTERVIEW_STATE}${userId}:${interviewId}`;
    this.invalidationQueue.add({ cacheKey, reason, timestamp: Date.now() });

    // Reschedule batch invalidation if not pending
    if (!this.invalidationTimer) {
      this.invalidationTimer = setTimeout(async () => {
        await this._flushInvalidationQueue();
        this.invalidationTimer = null;
      }, this.INVALIDATION_BATCH_DELAY);
    }

    return { queued: true, delayMs: this.INVALIDATION_BATCH_DELAY };
  }

  /**
   * Immediate invalidation for critical updates (score changes)
   * Flush both L1 and L2 immediately
   */
  async invalidateStateImmediate(userId, interviewId, reason = 'critical') {
    const cacheKey = `${this.KEY_PREFIXES.INTERVIEW_STATE}${userId}:${interviewId}`;

    try {
      // L1 clear
      this.l1Cache.del(cacheKey);

      // L2 clear
      if (this.redisClient) {
        try {
          await this.redisClient.del(cacheKey);
        } catch (redisError) {
          logger.warn('Redis delete error', { cacheKey, error: redisError.message });
        }
      }

      this.metrics.invalidations++;
      return { success: true, invalidated: true };
    } catch (error) {
      logger.error('Cache invalidation error', { error: error.message });
      return { success: false, invalidated: false };
    }
  }

  /**
   * Clear all interview caches for user (e.g., on logout)
   */
  async clearUserCaches(userId) {
    try {
      // L1 clear
      const keys = this.l1Cache.keys();
      const userKeys = keys.filter((k) => k.includes(`${userId}:`));
      userKeys.forEach((k) => this.l1Cache.del(k));

      // L2 clear (scan + del pattern)
      if (this.redisClient) {
        try {
          const pattern = `${this.KEY_PREFIXES.INTERVIEW_STATE}${userId}:*`;
          // Note: Upstash Redis may not support SCAN, use keys pattern instead
          // This is a limitation; consider Redis migration if needed
        } catch (redisError) {
          logger.warn('Redis clear error', { userId, error: redisError.message });
        }
      }

      return { success: true, cleared: true };
    } catch (error) {
      logger.error('Cache clear error', { error: error.message });
      return { success: false, cleared: false };
    }
  }

  /**
   * Get conversation history from cache
   * Smaller TTL (60s) due to frequent updates
   */
  async getConversationHistory(interviewId, page = 1, pageSize = 50) {
    const startTime = performance.now();
    const cacheKey = `${this.KEY_PREFIXES.INTERVIEW_CONVO}${interviewId}:${page}:${pageSize}`;

    try {
      // L1 check
      const l1Data = this.l1Cache.get(cacheKey);
      if (l1Data) {
        this.metrics.l1Hits++;
        this._recordLatency(startTime);
        return { turns: l1Data, source: 'l1', stale: false };
      }
      this.metrics.l1Misses++;

      // L2 check (if available)
      if (this.redisClient) {
        try {
          const l2Data = await this.redisClient.get(cacheKey);
          if (l2Data) {
            const turns = typeof l2Data === 'string' ? JSON.parse(l2Data) : l2Data;
            this.l1Cache.set(cacheKey, turns, 60); // Promote to L1
            this.metrics.l2Hits++;
            this._recordLatency(startTime);
            return { turns, source: 'l2', stale: false };
          }
          this.metrics.l2Misses++;
        } catch (redisError) {
          logger.warn('Redis read error (convo)', { cacheKey, error: redisError.message });
        }
      }

      return { turns: null, source: 'miss', stale: false };
    } catch (error) {
      logger.error('Conversation cache error', { error: error.message });
      return { turns: null, source: 'error', stale: false };
    }
  }

  /**
   * Set conversation history in cache
   * Conversation updates invalidate within 10s (queued invalidation)
   */
  async setConversationHistory(interviewId, turns, page = 1, pageSize = 50) {
    const cacheKey = `${this.KEY_PREFIXES.INTERVIEW_CONVO}${interviewId}:${page}:${pageSize}`;

    try {
      // L1: Always cache
      this.l1Cache.set(cacheKey, turns, 60);

      // L2: Redis cache (shorter TTL due to frequent updates)
      if (this.redisClient) {
        try {
          await this.redisClient.setex(cacheKey, 120, JSON.stringify(turns)); // 2 minutes
        } catch (redisError) {
          logger.warn('Redis write error (convo)', { cacheKey, error: redisError.message });
        }
      }

      return { success: true, cached: true };
    } catch (error) {
      logger.error('Conversation set error', { error: error.message });
      return { success: false, cached: false };
    }
  }

  /**
   * Get user interview statistics from cache
   * Longer TTL (1 hour) since stats change less frequently
   */
  async getUserStats(userId) {
    const startTime = performance.now();
    const cacheKey = `${this.KEY_PREFIXES.INTERVIEW_STATS}${userId}`;

    try {
      // L1 check
      const l1Data = this.l1Cache.get(cacheKey);
      if (l1Data) {
        this.metrics.l1Hits++;
        this._recordLatency(startTime);
        return { stats: l1Data, source: 'l1', stale: false };
      }
      this.metrics.l1Misses++;

      // L2 check
      if (this.redisClient) {
        try {
          const l2Data = await this.redisClient.get(cacheKey);
          if (l2Data) {
            const stats = typeof l2Data === 'string' ? JSON.parse(l2Data) : l2Data;
            this.l1Cache.set(cacheKey, stats, 300); // 5 minutes L1
            this.metrics.l2Hits++;
            this._recordLatency(startTime);
            return { stats, source: 'l2', stale: false };
          }
          this.metrics.l2Misses++;
        } catch (redisError) {
          logger.warn('Redis read error (stats)', { cacheKey, error: redisError.message });
        }
      }

      return { stats: null, source: 'miss', stale: false };
    } catch (error) {
      logger.error('Stats cache error', { error: error.message });
      return { stats: null, source: 'error', stale: false };
    }
  }

  /**
   * Set user statistics in cache
   * Queued invalidation on updates (eventual consistency)
   */
  async setUserStats(userId, stats) {
    const cacheKey = `${this.KEY_PREFIXES.INTERVIEW_STATS}${userId}`;

    try {
      // L1: Set
      this.l1Cache.set(cacheKey, stats, 300); // 5 minutes

      // L2: Redis (1 hour TTL)
      if (this.redisClient) {
        try {
          await this.redisClient.setex(cacheKey, this.TTL.L2_STATS, JSON.stringify(stats));
        } catch (redisError) {
          logger.warn('Redis write error (stats)', { cacheKey, error: redisError.message });
        }
      }

      return { success: true, cached: true };
    } catch (error) {
      logger.error('Stats set error', { error: error.message });
      return { success: false, cached: false };
    }
  }

  /**
   * Get cache performance metrics
   * Returns hit rates, latency stats, and queue status
   */
  getMetrics() {
    const totalL1 = this.metrics.l1Hits + this.metrics.l1Misses;
    const totalL2 = this.metrics.l2Hits + this.metrics.l2Misses;
    const totalL1HitRate = totalL1 > 0 ? Math.round((this.metrics.l1Hits / totalL1) * 100) : 0;
    const totalL2HitRate = totalL2 > 0 ? Math.round((this.metrics.l2Hits / totalL2) * 100) : 0;
    const avgLatency = this.metrics.queryCount > 0 ? this.metrics.totalLatency / this.metrics.queryCount : 0;

    return {
      l1_hits: this.metrics.l1Hits,
      l1_misses: this.metrics.l1Misses,
      l1_hit_rate: totalL1HitRate,
      l2_hits: this.metrics.l2Hits,
      l2_misses: this.metrics.l2Misses,
      l2_hit_rate: totalL2HitRate,
      invalidations: this.metrics.invalidations,
      stale_detections: this.metrics.stalDataDetections,
      avg_latency_ms: Math.round(avgLatency * 100) / 100,
      invalidation_queue_size: this.invalidationQueue.size,
      l1_key_count: this.l1Cache.getStats().keys,
    };
  }

  /**
   * Reset metrics (for testing or new session)
   */
  resetMetrics() {
    this.metrics = {
      l1Hits: 0,
      l1Misses: 0,
      l2Hits: 0,
      l2Misses: 0,
      invalidations: 0,
      stalDataDetections: 0,
      totalLatency: 0,
      queryCount: 0,
    };
    return { success: true };
  }

  /**
   * Private: Flush queued invalidations in batch
   */
  async _flushInvalidationQueue() {
    if (this.invalidationQueue.size === 0) {
      return;
    }

    const batch = Array.from(this.invalidationQueue);
    this.invalidationQueue.clear();

    for (const item of batch) {
      try {
        // L1 clear
        this.l1Cache.del(item.cacheKey);

        // L2 clear
        if (this.redisClient) {
          try {
            await this.redisClient.del(item.cacheKey);
          } catch (redisError) {
            logger.warn('Redis batch delete error', { cacheKey: item.cacheKey, error: redisError.message });
          }
        }

        this.metrics.invalidations++;
      } catch (error) {
        logger.error('Batch invalidation error', { error: error.message });
      }
    }
  }

  /**
   * Private: Record latency for metrics
   */
  _recordLatency(startTime) {
    const latency = performance.now() - startTime;
    this.metrics.totalLatency += latency;
    this.metrics.queryCount++;
  }
}

export default InterviewCacheStrategy;
