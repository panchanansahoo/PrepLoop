import { Redis } from '@upstash/redis';
import { createLogger } from '../utils/structuredLogger.js';
import { supabaseAdmin } from '../db/supabaseClient.js';

const logger = createLogger('DataCacheManager');

// Initialize Upstash Redis
let redisClient = null;
let redisHealthy = false;

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    redisHealthy = true;
    logger.info('Upstash Redis initialized for data caching');
  } else {
    logger.warn('Upstash Redis credentials missing. Cache operations will skip Redis.');
  }
} catch (error) {
  logger.error('Failed to initialize Upstash Redis', { error: error.message });
}

// TTL Constants (seconds)
const TTL = {
  USER_PROFILE: 3600,        // 1 hour
  JOB_LISTING: 1800,         // 30 minutes
  PROBLEM_DATA: 7200,        // 2 hours
  PATTERNS: 7200,            // 2 hours
  DSA_STATS: 1800,           // 30 minutes
  LEADERBOARD: 1800,         // 30 minutes
  USER_COINS: 600,           // 10 minutes (frequent updates)
  INTERVIEW_STATS: 3600,     // 1 hour
  SKILL_TAGS: 86400,         // 24 hours
  COMPANY_QUESTIONS: 3600,   // 1 hour
};

// Cache statistics
const cacheStats = {
  hits: 0,
  misses: 0,
  errors: 0,
  invalidations: 0,
};

class DataCacheManager {
  /**
   * Safe Redis operation with fallback
   */
  static async safeRedisCall(operation, fallbackValue = null) {
    if (!redisClient || !redisHealthy) return fallbackValue;
    try {
      const result = await operation();
      return result;
    } catch (error) {
      logger.error('Redis operation failed', { error: error.message });
      cacheStats.errors++;
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
   * Get value from Redis with proper deserialization
   */
  static async get(key) {
    const result = await this.safeRedisCall(() => redisClient.get(key));
    if (result === null || result === undefined) {
      cacheStats.misses++;
      return null;
    }

    try {
      // Deserialize JSON string from Redis
      const deserialized = typeof result === 'string' ? JSON.parse(result) : result;
      cacheStats.hits++;
      logger.debug(`Cache hit: ${key}`);
      return deserialized;
    } catch (error) {
      logger.error('Failed to parse cache value', { key, error: error.message });
      cacheStats.errors++;
      return null;
    }
  }

  /**
   * Set value in Redis with serialization
   */
  static async set(key, value, ttl = TTL.USER_PROFILE) {
    try {
      const serialized = JSON.stringify(value);
      await this.safeRedisCall(() => redisClient.set(key, serialized, { ex: ttl }));
      logger.debug(`Cache set: ${key} (TTL: ${ttl}s)`);
      return true;
    } catch (error) {
      logger.error('Failed to set cache', { key, error: error.message });
      cacheStats.errors++;
      return false;
    }
  }

  /**
   * Delete key from cache
   */
  static async del(key) {
    await this.safeRedisCall(() => redisClient.del(key));
    cacheStats.invalidations++;
  }

  /**
   * Delete multiple keys (pattern)
   */
  static async delPattern(pattern) {
    try {
      // Use SCAN to find keys matching pattern (non-blocking)
      const keys = [];
      let cursor = 0;
      
      do {
        const result = await this.safeRedisCall(() => 
          redisClient.scan(cursor, { match: pattern, count: 100 })
        );
        
        if (!result) break;
        const [nextCursor, foundKeys] = result;
        cursor = nextCursor;
        keys.push(...(foundKeys || []));
      } while (cursor !== 0);

      // Delete all found keys
      if (keys.length > 0) {
        await this.safeRedisCall(() => redisClient.del(...keys));
        cacheStats.invalidations += keys.length;
        logger.info(`Invalidated ${keys.length} keys matching ${pattern}`);
      }
    } catch (error) {
      logger.error('Failed to invalidate pattern', { pattern, error: error.message });
    }
  }

  // ======================================================
  // USER PROFILE CACHE
  // ======================================================

  static async getUserProfile(userId) {
    const cached = await this.get(`user:${userId}`);
    if (cached) return cached;

    // Fetch from database
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      logger.error('Failed to fetch user profile', { userId, error: error.message });
      return null;
    }

    // Cache for 1 hour
    await this.set(`user:${userId}`, data, TTL.USER_PROFILE);
    return data;
  }

  static async invalidateUserProfile(userId) {
    await this.del(`user:${userId}`);
    await this.del(`coins:${userId}`); // Also invalidate coins cache
  }

  static async getUserCoins(userId) {
    const cached = await this.get(`coins:${userId}`);
    if (cached !== null) return cached;

    const profile = await this.getUserProfile(userId);
    if (!profile) return 0;

    await this.set(`coins:${userId}`, profile.coins, TTL.USER_COINS);
    return profile.coins;
  }

  static async setUserCoins(userId, coins) {
    await this.set(`coins:${userId}`, coins, TTL.USER_COINS);
    await this.invalidateUserProfile(userId); // Invalidate full profile too
  }

  // ======================================================
  // PROBLEM & DSA DATA CACHE
  // ======================================================

  static async getProblem(problemId) {
    const cached = await this.get(`problem:${problemId}`);
    if (cached) return cached;

    const { data, error } = await supabaseAdmin
      .from('problems')
      .select('*')
      .eq('id', problemId)
      .single();

    if (error) {
      logger.error('Failed to fetch problem', { problemId, error: error.message });
      return null;
    }

    await this.set(`problem:${problemId}`, data, TTL.PROBLEM_DATA);
    return data;
  }

  static async getProblems(patternId = null, difficulty = null) {
    // Create cache key based on filters
    const filters = [];
    if (patternId) filters.push(`pattern:${patternId}`);
    if (difficulty) filters.push(`diff:${difficulty}`);
    const cacheKey = filters.length > 0 ? `problems:${filters.join('::')}` : 'problems:all';

    const cached = await this.get(cacheKey);
    if (cached) return cached;

    let query = supabaseAdmin.from('problems').select('*');
    if (patternId) query = query.eq('pattern_id', patternId);
    if (difficulty) query = query.eq('difficulty', difficulty);

    const { data, error } = await query;

    if (error) {
      logger.error('Failed to fetch problems', { error: error.message });
      return [];
    }

    await this.set(cacheKey, data, TTL.PROBLEM_DATA);
    return data;
  }

  static async getPatterns() {
    const cached = await this.get('patterns:all');
    if (cached) return cached;

    const { data, error } = await supabaseAdmin
      .from('patterns')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      logger.error('Failed to fetch patterns', { error: error.message });
      return [];
    }

    await this.set('patterns:all', data, TTL.PATTERNS);
    return data;
  }

  static async getPattern(patternId) {
    const cached = await this.get(`pattern:${patternId}`);
    if (cached) return cached;

    const { data, error } = await supabaseAdmin
      .from('patterns')
      .select('*')
      .eq('id', patternId)
      .single();

    if (error) {
      logger.error('Failed to fetch pattern', { patternId, error: error.message });
      return null;
    }

    await this.set(`pattern:${patternId}`, data, TTL.PATTERNS);
    return data;
  }

  static async invalidateProblems() {
    await this.delPattern('problems:*');
    await this.del('problems:all');
  }

  static async invalidateProblem(problemId) {
    await this.del(`problem:${problemId}`);
    await this.invalidateProblems(); // Invalidate all problem lists
  }

  // ======================================================
  // JOB LISTINGS CACHE
  // ======================================================

  static async getJobListing(jobId) {
    const cached = await this.get(`job:${jobId}`);
    if (cached) return cached;

    const { data, error } = await supabaseAdmin
      .from('job_listings')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) {
      logger.error('Failed to fetch job listing', { jobId, error: error.message });
      return null;
    }

    await this.set(`job:${jobId}`, data, TTL.JOB_LISTING);
    return data;
  }

  static async getJobListings(filters = {}) {
    // Create cache key based on filters
    const filterKeys = Object.entries(filters)
      .filter(([, v]) => v !== null && v !== undefined)
      .map(([k, v]) => `${k}:${v}`)
      .sort();
    
    const cacheKey = filterKeys.length > 0 
      ? `jobs:${filterKeys.join('::')}` 
      : 'jobs:all';

    const cached = await this.get(cacheKey);
    if (cached) return cached;

    let query = supabaseAdmin
      .from('job_listings')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.location) query = query.eq('location', filters.location);
    if (filters.company) query = query.ilike('company_name', `%${filters.company}%`);
    if (filters.minSalary) query = query.gte('salary_min', filters.minSalary);
    if (filters.maxSalary) query = query.lte('salary_max', filters.maxSalary);

    const { data, error } = await query.limit(100);

    if (error) {
      logger.error('Failed to fetch job listings', { error: error.message });
      return [];
    }

    await this.set(cacheKey, data, TTL.JOB_LISTING);
    return data;
  }

  static async invalidateJobListings() {
    await this.delPattern('jobs:*');
    await this.del('jobs:all');
  }

  static async invalidateJobListing(jobId) {
    await this.del(`job:${jobId}`);
    await this.invalidateJobListings();
  }

  // ======================================================
  // DSA STATISTICS & PROGRESS CACHE
  // ======================================================

  static async getUserDSAStats(userId) {
    const cached = await this.get(`dsa:stats:${userId}`);
    if (cached) return cached;

    const { data, error } = await supabaseAdmin
      .from('user_progress')
      .select('status, COUNT(*)')
      .eq('user_id', userId)
      .group('status');

    if (error) {
      logger.error('Failed to fetch DSA stats', { userId, error: error.message });
      return { total: 0, solved: 0, attempted: 0, pending: 0 };
    }

    const stats = {
      total: 0,
      solved: 0,
      attempted: 0,
      pending: 0,
    };

    data?.forEach(row => {
      if (row.status === 'solved') stats.solved = row.count;
      if (row.status === 'attempted') stats.attempted = row.count;
      if (row.status === 'not_started') stats.pending = row.count;
      stats.total += row.count;
    });

    await this.set(`dsa:stats:${userId}`, stats, TTL.DSA_STATS);
    return stats;
  }

  static async invalidateUserDSAStats(userId) {
    await this.del(`dsa:stats:${userId}`);
  }

  // ======================================================
  // INTERVIEW STATISTICS CACHE
  // ======================================================

  static async getUserInterviewStats(userId) {
    const cached = await this.get(`interview:stats:${userId}`);
    if (cached) return cached;

    const { data, error } = await supabaseAdmin
      .from('interview_history')
      .select('interview_type, overall_score')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      logger.error('Failed to fetch interview stats', { userId, error: error.message });
      return null;
    }

    const stats = {
      totalInterviews: data?.length || 0,
      byType: {},
      avgScore: 0,
    };

    if (data && data.length > 0) {
      let scoreSum = 0;
      data.forEach(interview => {
        if (!stats.byType[interview.interview_type]) {
          stats.byType[interview.interview_type] = 0;
        }
        stats.byType[interview.interview_type]++;
        scoreSum += interview.overall_score || 0;
      });
      stats.avgScore = Math.round(scoreSum / data.length);
    }

    await this.set(`interview:stats:${userId}`, stats, TTL.INTERVIEW_STATS);
    return stats;
  }

  static async invalidateUserInterviewStats(userId) {
    await this.del(`interview:stats:${userId}`);
  }

  // ======================================================
  // CACHE STATISTICS
  // ======================================================

  static getCacheStats() {
    const total = cacheStats.hits + cacheStats.misses;
    const hitRate = total > 0 ? Math.round((cacheStats.hits / total) * 100) : 0;
    return {
      ...cacheStats,
      total,
      hitRate: `${hitRate}%`,
      redisHealthy,
    };
  }

  static resetCacheStats() {
    cacheStats.hits = 0;
    cacheStats.misses = 0;
    cacheStats.errors = 0;
    cacheStats.invalidations = 0;
  }
}

export default DataCacheManager;
