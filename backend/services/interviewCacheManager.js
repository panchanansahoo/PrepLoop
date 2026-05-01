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
   * Handles deserialization of JSON strings from Upstash Redis
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
      // Deserialize JSON string from Upstash Redis
      let deserialized = l2Result;
      if (typeof l2Result === 'string') {
        try {
          deserialized = JSON.parse(l2Result);
        } catch (parseError) {
          // If parsing fails, return the string as-is (fallback for non-JSON values)
          logger.debug('Failed to parse Redis value as JSON, using raw value', { key, error: parseError.message });
        }
      }

      // Backfill L1
      memoryCache.set(key, deserialized);
      return deserialized;
    }

    return null;
  }

  /**
   * Set a value in cache (L1 + L2)
   * Handles serialization of values to JSON strings for Upstash Redis
   */
  static async set(key, value, customTTL = null) {
    const ttl = customTTL || this.getSessionTTL(value);
    
    // Set L1 - store original object
    memoryCache.set(key, value, Math.min(60, ttl));

    // Set L2 - serialize to JSON string for Upstash Redis compatibility
    let serialized = value;
    try {
      // Serialize objects/arrays to JSON strings for reliable Redis storage
      if (typeof value === 'object' && value !== null) {
        serialized = JSON.stringify(value);
      }
      
      await this.safeRedisCall(() => redisClient.set(key, serialized, { ex: ttl }));
    } catch (error) {
      logger.error('Failed to serialize value for Redis', { key, error: error.message });
      // Continue even if Redis fails - L1 cache is still valid
    }
    
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
