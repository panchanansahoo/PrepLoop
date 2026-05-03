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

// Cache statistics with detailed breakdowns
const cacheStats = {
  hits: 0,
  misses: 0,
  errors: 0,
  l1_hits: 0,        // Memory cache hits
  l2_hits: 0,        // Redis cache hits
  invalidations: 0,  // Explicit invalidations
  stale_detections: 0, // Stale data detected and refreshed
};

// Cache invalidation tracking for safety
const invalidationLog = [];
const MAX_INVALIDATION_LOG = 1000;

function logInvalidation(key, reason, timestamp = new Date().toISOString()) {
  const entry = { key, reason, timestamp };
  invalidationLog.push(entry);
  if (invalidationLog.length > MAX_INVALIDATION_LOG) {
    invalidationLog.shift(); // Keep only recent
  }
  cacheStats.invalidations++;
}

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

// TTL Constants (seconds) - Multi-tier caching strategy
// L1 (Memory): Short TTL, only for current session
// L2 (Redis): Longer TTL, shared across processes
// L3 (Database): Source of truth, no TTL
const TTL_CONFIG = {
  ACTIVE_SESSION_L1: 60,        // Memory: 1 minute (avoid stale active data)
  ACTIVE_SESSION_L2: 300,       // Redis: 5 minutes (recent active interviews)
  COMPLETED_SESSION_L1: 10,     // Memory: 10 seconds (no need to keep long)
  COMPLETED_SESSION_L2: 86400,  // Redis: 24 hours (for analytics, resume)
  QUESTION_RESPONSE: 7200,      // 2 hours for question responses
  CONVERSATION_TURN: 600,       // 10 minutes for conversation history segments
  TELEMETRY_SNAPSHOT: 300,      // 5 minutes for telemetry data
};

// Legacy constants for backward compatibility
const TTL_ACTIVE_SESSION = TTL_CONFIG.ACTIVE_SESSION_L2;
const TTL_COMPLETED_SESSION = TTL_CONFIG.COMPLETED_SESSION_L2;
const TTL_QUESTION_RESPONSE = TTL_CONFIG.QUESTION_RESPONSE;

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
   * Tracks L1 vs L2 hits for observability
   * 
   * Note: All values are stored as JSON strings in Redis to ensure type safety.
   * This method handles proper deserialization of all types (objects, arrays, 
   * primitives, null, etc.)
   */
  static async get(key) {
    // Check L1 (memory cache)
    const l1Result = memoryCache.get(key);
    if (l1Result !== undefined) {
      cacheStats.hits++;
      cacheStats.l1_hits++;
      return l1Result;
    }

    // Check L2 (Redis/Upstash)
    const l2Result = await this.safeRedisCall(() => redisClient.get(key));
    if (l2Result === null || l2Result === undefined) {
      cacheStats.misses++;
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
        cacheStats.errors++;
        return null;
      }
    }

    // Backfill L1 memory cache with deserialized value
    // Use shorter L1 TTL for consistency
    const l1TTL = 60; // 1 minute max in memory
    memoryCache.set(key, deserialized, l1TTL);
    
    cacheStats.hits++;
    cacheStats.l2_hits++;
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
   * Delete a value from cache with optional invalidation reason
   */
  static async del(key, reason = 'manual') {
    memoryCache.del(key);
    logInvalidation(key, reason);
    await this.safeRedisCall(() => redisClient.del(key));
    return true;
  }

  /**
   * Get interview state from cache (specialized)
   * Returns null if stale (detected via timestamp)
   */
  static async getInterviewState(interviewId, userId) {
    if (!interviewId || !userId) return null;
    const key = `interview:${userId}:${interviewId}`;
    
    const state = await this.get(key);
    if (!state) return null;

    // Check for staleness: if last update is >5 minutes ago for active interviews
    const isActive = state.stage !== 'feedback' && !state.is_completed;
    if (isActive && state.lastUpdatedAt) {
      const updateAge = Date.now() - new Date(state.lastUpdatedAt).getTime();
      if (updateAge > 5 * 60 * 1000) { // 5 minutes
        logger.warn(`Stale interview state detected: ${key}`);
        cacheStats.stale_detections++;
        // Return null to force database refresh
        return null;
      }
    }

    return state;
  }

  /**
   * Set interview state in cache with appropriate TTL
   */
  static async setInterviewState(interviewId, userId, state) {
    if (!interviewId || !userId || !state) return false;
    const key = `interview:${userId}:${interviewId}`;
    
    // Determine TTL based on interview stage
    let ttl = TTL_CONFIG.ACTIVE_SESSION_L2;
    if (state.is_completed || state.stage === 'feedback') {
      ttl = TTL_CONFIG.COMPLETED_SESSION_L2;
    }
    
    // Add metadata for staleness checking
    const enrichedState = {
      ...state,
      lastUpdatedAt: new Date().toISOString(),
    };
    
    await this.set(key, enrichedState, ttl);
    return true;
  }

  /**
   * Invalidate interview cache (on score update, etc.)
   */
  static async invalidateInterviewState(interviewId, userId, reason = 'manual') {
    const key = `interview:${userId}:${interviewId}`;
    logInvalidation(key, reason);
    await this.del(key, reason);
  }

  /**
   * Get cache statistics with detailed breakdown
   */
  static getCacheStats() {
    const total = cacheStats.hits + cacheStats.misses;
    const hitRate = total > 0 ? ((cacheStats.hits / total) * 100).toFixed(1) : 0;
    const l1HitRate = cacheStats.l1_hits > 0 
      ? ((cacheStats.l1_hits / cacheStats.hits) * 100).toFixed(1)
      : 0;
    
    return {
      ...cacheStats,
      total,
      hitRate: `${hitRate}%`,
      l1HitRate: `${l1HitRate}%`, // Percentage of hits that were L1 memory hits
      invalidationLogSize: invalidationLog.length,
    };
  }

  /**
   * Get recent invalidation events for debugging
   */
  static getInvalidationLog(limit = 50) {
    return invalidationLog.slice(-limit);
  }

  /**
   * Reset cache statistics (use carefully, typically for testing)
   */
  static resetCacheStats() {
    cacheStats.hits = 0;
    cacheStats.misses = 0;
    cacheStats.errors = 0;
    cacheStats.l1_hits = 0;
    cacheStats.l2_hits = 0;
    cacheStats.invalidations = 0;
    cacheStats.stale_detections = 0;
    invalidationLog.length = 0;
  }
}

export default InterviewCacheManager;
