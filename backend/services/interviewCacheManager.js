import NodeCache from 'node-cache';
import { Redis } from '@upstash/redis';
import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('InterviewCacheManager');

// L1 Cache (Memory) - Short TTL for hot data
const memoryCache = new NodeCache({ stdTTL: 60, checkperiod: 70 });

// L2 Cache (Redis)
let redisClient = null;
let redisHealthy = false;

// Initialize Upstash Redis
try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    redisHealthy = true;
    logger.info('Upstash Redis initialized for interview caching');
  } else {
    logger.warn('Upstash Redis credentials missing. Falling back to memory-only cache.');
  }
} catch (error) {
  logger.error('Failed to initialize Upstash Redis', { error: error.message });
}

// TTL Constants (seconds)
const TTL_ACTIVE_SESSION = 1800; // 30 minutes
const TTL_COMPLETED_SESSION = 86400; // 24 hours

export class InterviewCacheManager {
  /**
   * Determine the appropriate TTL based on session state
   */
  static getSessionTTL(sessionMetadata) {
    if (!sessionMetadata) return TTL_ACTIVE_SESSION;
    return sessionMetadata.stage === 'completed' || sessionMetadata.continueInterview === false
      ? TTL_COMPLETED_SESSION
      : TTL_ACTIVE_SESSION;
  }

  /**
   * Safe Redis wrapper with circuit breaker
   */
  static async safeRedisCall(operation, fallbackValue = null) {
    if (!redisClient || !redisHealthy) return fallbackValue;
    try {
      const result = await operation();
      return result;
    } catch (error) {
      logger.error('Redis operation failed, circuit breaking', { error: error.message });
      // Circuit break - disable Redis temporarily
      redisHealthy = false;
      setTimeout(() => {
        logger.info('Attempting to recover Redis connection');
        redisHealthy = true;
      }, 60000); // Try again in 1 minute
      return fallbackValue;
    }
  }

  /**
   * Get a value from cache (L1 -> L2)
   */
  static async get(key) {
    // Check L1
    const l1Result = memoryCache.get(key);
    if (l1Result) {
      return l1Result;
    }

    // Check L2
    const l2Result = await this.safeRedisCall(() => redisClient.get(key));
    if (l2Result) {
      // Backfill L1
      memoryCache.set(key, l2Result);
      return l2Result;
    }

    return null;
  }

  /**
   * Set a value in cache (L1 + L2)
   */
  static async set(key, value, customTTL = null) {
    const ttl = customTTL || this.getSessionTTL(value);
    
    // Set L1
    memoryCache.set(key, value, Math.min(60, ttl));

    // Set L2
    await this.safeRedisCall(() => redisClient.set(key, value, { ex: ttl }));
    
    return true;
  }

  /**
   * Delete a value from cache
   */
  static async del(key) {
    memoryCache.del(key);
    await this.safeRedisCall(() => redisClient.del(key));
    return true;
  }
}

export default InterviewCacheManager;
