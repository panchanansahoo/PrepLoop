import { getRedisClient } from './redis.ts';
import cacheManager from '../utils/cacheManager.js';
import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('RateLimitStore');

/**
 * Creates an express-rate-limit compliant store backed by Redis / Upstash
 * with transparent fallback to in-memory tracking if Redis is unreachable.
 *
 * Ensures multi-replica Kubernetes / container deployments enforce identical
 * rate-limit ceilings without multiplying quota across pods.
 */
export function createDistributedRateLimitStore(options = {}) {
  const prefix = options.prefix || 'rl:';
  const memoryFallback = new Map(); // key -> { hits, resetTime }

  let configuredWindowMs = options.windowMs || 60000;

  return {
    init(opts) {
      if (opts?.windowMs) {
        configuredWindowMs = opts.windowMs;
      }
    },

    async increment(key) {
      const fullKey = `${prefix}${key}`;
      const now = Date.now();

      // 1. Try standard node-redis connection
      const redis = getRedisClient();
      if (redis && redis.isOpen) {
        try {
          const hits = await redis.incr(fullKey);
          if (hits === 1) {
            await redis.pExpire(fullKey, configuredWindowMs);
          }
          const pttl = await redis.pTTL(fullKey);
          const resetTime = new Date(now + (pttl > 0 ? pttl : configuredWindowMs));
          return { totalHits: hits, resetTime };
        } catch (err) {
          logger.warn('Node-Redis rate-limit increment failed, falling back to memory', { error: err.message });
        }
      }

      // 2. Try Upstash HTTP REST client via cacheManager
      const upstash = cacheManager?.client;
      if (upstash && cacheManager.isConnected) {
        try {
          const hits = await upstash.incr(fullKey);
          if (hits === 1) {
            await upstash.pexpire(fullKey, configuredWindowMs);
          }
          const pttl = await upstash.pttl(fullKey);
          const resetTime = new Date(now + (pttl > 0 ? pttl : configuredWindowMs));
          return { totalHits: hits, resetTime };
        } catch (err) {
          logger.warn('Upstash rate-limit increment failed, falling back to memory', { error: err.message });
        }
      }

      // 3. Resilient In-Memory Fallback
      let entry = memoryFallback.get(fullKey);
      if (!entry || entry.resetTime <= now) {
        entry = { hits: 1, resetTime: now + configuredWindowMs };
      } else {
        entry.hits += 1;
      }
      memoryFallback.set(fullKey, entry);

      // Periodic cleanup of expired entries in memory map
      if (memoryFallback.size > 2000) {
        for (const [k, v] of memoryFallback.entries()) {
          if (v.resetTime <= now) memoryFallback.delete(k);
        }
      }

      return {
        totalHits: entry.hits,
        resetTime: new Date(entry.resetTime),
      };
    },

    async decrement(key) {
      const fullKey = `${prefix}${key}`;

      const redis = getRedisClient();
      if (redis && redis.isOpen) {
        try {
          await redis.decr(fullKey);
          return;
        } catch (_) {}
      }

      const upstash = cacheManager?.client;
      if (upstash && cacheManager.isConnected) {
        try {
          await upstash.decr(fullKey);
          return;
        } catch (_) {}
      }

      const entry = memoryFallback.get(fullKey);
      if (entry && entry.hits > 0) {
        entry.hits -= 1;
      }
    },

    async resetKey(key) {
      const fullKey = `${prefix}${key}`;

      const redis = getRedisClient();
      if (redis && redis.isOpen) {
        try {
          await redis.del(fullKey);
        } catch (_) {}
      }

      const upstash = cacheManager?.client;
      if (upstash && cacheManager.isConnected) {
        try {
          await upstash.del(fullKey);
        } catch (_) {}
      }

      memoryFallback.delete(fullKey);
    },
  };
}

