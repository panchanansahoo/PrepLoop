import NodeCache from 'node-cache';
import { Redis } from '@upstash/redis';
import { createLogger } from '../utils/structuredLogger.js';
import crypto from 'crypto';

const logger = createLogger('InterviewCacheManager');

// L1 Cache (Memory) - Short TTL for hot data
const memoryCache = new NodeCache({ stdTTL: 60, checkperiod: 70 });

// L2 Cache (Redis)
let redisClient = null;
let redisHealthy = false;

// Cache statistics
const cacheStats = {
  hits: 0,
  misses: 0,
  errors: 0,
};

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
const TTL_QUESTION_RESPONSE = 7200; // 2 hours for question responses

export class InterviewCacheManager {
  /**
   * Create a semantic hash for a question to enable caching similar questions
   * Uses first N chars + word count to identify similar questions
   * This avoids caching exact duplicates while maintaining reasonable performance
   */
  static createQuestionHash(question, type, difficulty) {
    if (!question || typeof question !== 'string') return null;
    
    // Create a normalized question: remove extra spaces, lowercase, trim
    const normalized = question
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();

    // Create hash from normalized question + type + difficulty
    const combined = `${normalized}|${type}|${difficulty}`;
    const hash = crypto
      .createHash('sha256')
      .update(combined)
      .digest('hex')
      .substring(0, 16); // Use first 16 chars

    return `q:${hash}`;
  }

  /**
   * Get cached question response (if exists)
   */
  static async getQuestionResponse(question, type, difficulty) {
    try {
      const cacheKey = this.createQuestionHash(question, type, difficulty);
      if (!cacheKey) return null;

      const cached = await this.get(cacheKey);
      if (cached) {
        cacheStats.hits++;
        logger.debug(`Question cache hit: ${cacheKey}`);
        return cached;
      }
      cacheStats.misses++;
      return null;
    } catch (error) {
      logger.error('Error getting question response from cache', { error: error.message });
      cacheStats.errors++;
      return null;
    }
  }

  /**
   * Cache a question response (usually from Groq API)
   */
  static async setQuestionResponse(question, type, difficulty, response) {
    try {
      const cacheKey = this.createQuestionHash(question, type, difficulty);
      if (!cacheKey) return false;

      await this.set(cacheKey, response, TTL_QUESTION_RESPONSE);
      logger.debug(`Question cached: ${cacheKey}`);
      return true;
    } catch (error) {
      logger.error('Error caching question response', { error: error.message });
      cacheStats.errors++;
      return false;
    }
  }

  /**
   * Get cache statistics for monitoring
   */
  static getCacheStats() {
    const total = cacheStats.hits + cacheStats.misses;
    const hitRate = total > 0 ? Math.round((cacheStats.hits / total) * 100) : 0;
    return {
      ...cacheStats,
      total,
      hitRate: `${hitRate}%`,
    };
  }

  /**
   * Reset cache statistics
   */
  static resetCacheStats() {
    cacheStats.hits = 0;
    cacheStats.misses = 0;
    cacheStats.errors = 0;
  }

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
   * 
   * Note: All values are stored as JSON strings in Redis to ensure type safety.
   * This method handles proper deserialization of all types (objects, arrays, 
   * primitives, null, etc.)
   */
  static async get(key) {
    // Check L1 (memory cache)
    const l1Result = memoryCache.get(key);
    if (l1Result !== undefined) {
      return l1Result;
    }

    // Check L2 (Redis/Upstash)
    const l2Result = await this.safeRedisCall(() => redisClient.get(key));
    if (l2Result === null || l2Result === undefined) {
      return null;
    }

    // Deserialize JSON string from Upstash Redis
    // Always expect JSON strings from Redis since we always store as JSON
    let deserialized = l2Result;
    if (typeof l2Result === 'string') {
      try {
        // Parse JSON string to restore original value (handles all types)
        deserialized = JSON.parse(l2Result);
      } catch (parseError) {
        // If parsing fails, it indicates corrupted/malformed data in Redis
        logger.error('Failed to parse Redis value as JSON', { key, error: parseError.message });
        return null;
      }
    }

    // Backfill L1 memory cache with deserialized value
    memoryCache.set(key, deserialized);
    return deserialized;
  }

  /**
   * Set a value in cache (L1 + L2)
   * Handles serialization of all values to JSON strings for Upstash Redis
   * 
   * Strategy:
   * - L1 (memory): Store original value as-is (no serialization needed)
   * - L2 (Redis): Always store as JSON.stringify() to ensure proper type handling
   * 
   * This prevents:
   * - Type changes (numbers/booleans becoming strings)
   * - Double-serialization (strings being double-encoded)
   * - Deserialization errors on retrieval
   */
  static async set(key, value, customTTL = null) {
    const ttl = customTTL || this.getSessionTTL(value);
    
    // Set L1 (memory cache) - store original value unmodified
    memoryCache.set(key, value, Math.min(60, ttl));

    // Set L2 (Redis/Upstash) - always serialize to JSON string for consistency
    try {
      // Always use JSON.stringify for Redis to ensure type safety
      // This handles all types: objects, arrays, primitives, null, undefined
      const serialized = JSON.stringify(value);
      
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
