/**
 * Advanced Cache Manager — Enhanced Performance & Memory Optimization
 * 
 * Features:
 *   1. Multi-tier caching (L1: Memory, L2: Redis, L3: Database)
 *   2. Intelligent cache warming and preloading
 *   3. Cache compression for large objects
 *   4. Automatic cache invalidation patterns
 *   5. Performance monitoring and metrics
 *   6. Graceful degradation and fallback strategies
 */
import { createLogger } from './structuredLogger.js';
import zlib from 'zlib';
import { promisify } from 'util';

const logger = createLogger('cache-manager');
const _gzip = promisify(zlib.gzip);
const _gunzip = promisify(zlib.gunzip);

// Lazy-load @upstash/redis to avoid hard dependency if not configured
let Redis = null;

// Cache configuration with TTL and compression thresholds
const CACHE_CONFIG = {
  compressionThreshold: 1024, // 1KB
  maxMemoryCacheSize: 500,
  memoryCacheTTL: 5 * 60 * 1000, // 5 minutes
  redisTTL: 30 * 60 * 1000, // 30 minutes
  hotDataThreshold: 5, // Access count for promoting to hot cache
  staleWhileRevalidate: true,
  metricsEnabled: true
};

class CacheManager {
  constructor(config = CACHE_CONFIG) {
    this.client = null;
    this.isConnected = false;
    this.memoryCache = new Map();
    this.hotCache = new Map(); // Frequently accessed items
    this._compressionCache = new Map(); // Compressed large objects
    this.accessCounts = new Map();
    this.metrics = {
      hits: 0,
      misses: 0,
      redisHits: 0,
      redisMisses: 0,
      compressionSaves: 0,
      totalSaves: 0
    };
    this.config = { ...CACHE_CONFIG, ...config };
    this._commandCount = 0;
  }

  async connect() {
    if (this.isConnected) return;

    const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
    const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    
    // Legacy support: also check old REDIS_URL for local dev with docker-compose
    const _legacyRedisUrl = process.env.REDIS_URL;

    if (upstashUrl && upstashToken) {
      try {
        // Dynamic import to avoid bundling issues when Upstash is not installed
        if (!Redis) {
          const upstashModule = await import('@upstash/redis');
          Redis = upstashModule.Redis;
        }

        this.client = new Redis({
          url: upstashUrl,
          token: upstashToken,
        });

        // Test the connection with a ping
        await this.client.ping();
        this.isConnected = true;
        logger.info('Connected to Upstash Redis');
      } catch (error) {
        logger.error('Failed to connect to Upstash Redis:', error);
        this.isConnected = false;
      }
    } else {
      logger.info('Upstash Redis not configured, using memory-only mode');
      this.isConnected = false;
    }

    // Start cache maintenance tasks
    this.startMaintenanceTasks();
  }
  // The canonical `get` and `set` implementations live further below
  // — duplicate/older implementations removed to keep a single source of truth.

  /**
   * Intelligent cache warming and preloading
   */
  async warmCache(keys, fetchFunction) {
    const warmupPromises = keys.map(async (key) => {
      try {
        const data = await fetchFunction(key);
        if (data !== null && data !== undefined) {
          await this.set(key, data);
          logger.debug(`Warmed cache for key: ${key}`);
        }
      } catch (error) {
        logger.error(`Cache warming failed for key ${key}:`, error);
      }
    });

    await Promise.allSettled(warmupPromises);
    logger.info(`Cache warming completed for ${keys.length} keys`);
  }

  /**
   * Cache invalidation with pattern support
   */
  async invalidate(pattern) {
    const keysToInvalidate = [];
    
    // Find matching keys in memory cache
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        keysToInvalidate.push(key);
        this.memoryCache.delete(key);
      }
    }
    
    // Find matching keys in hot cache
    for (const key of this.hotCache.keys()) {
      if (key.includes(pattern)) {
        this.hotCache.delete(key);
      }
    }
    
    // Invalidate in Redis if connected
    if (this.isConnected && this.client) {
      try {
        // Get all keys matching pattern (using SCAN for better performance)
        const keys = await this.scanKeys(pattern);
        if (keys.length > 0) {
          await this.client.del(...keys);
          this._commandCount += keys.length;
          keysToInvalidate.push(...keys);
        }
      } catch (redisError) {
        logger.error('Redis invalidation error:', redisError);
      }
    }
    
    logger.info(`Invalidated ${keysToInvalidate.length} keys matching pattern: ${pattern}`);
    return keysToInvalidate;
  }

  /**
   * Get cache performance metrics
   */
  getMetrics() {
    const hitRate = this.metrics.hits / (this.metrics.hits + this.metrics.misses) || 0;
    const redisHitRate = this.metrics.redisHits / (this.metrics.redisHits + this.metrics.redisMisses) || 0;
    const compressionRatio = this.metrics.compressionSaves / this.metrics.totalSaves || 0;
    
    return {
      hitRate: Math.round(hitRate * 100),
      redisHitRate: Math.round(redisHitRate * 100),
      compressionRatio: Math.round(compressionRatio * 100),
      memoryCacheSize: this.memoryCache.size,
      hotCacheSize: this.hotCache.size,
      totalCommands: this._commandCount,
      ...this.metrics
    };
  }

  /**
   * Helper methods
   */
  updateAccessCount(key) {
    const currentCount = this.accessCounts.get(key) || 0;
    this.accessCounts.set(key, currentCount + 1);
  }

  promoteToHotCache(key, data) {
    const accessCount = this.accessCounts.get(key) || 0;
    if (accessCount >= this.config.hotDataThreshold) {
      this.hotCache.set(key, data);
      // Limit hot cache size
      if (this.hotCache.size > 50) {
        const firstKey = this.hotCache.keys().next().value;
        this.hotCache.delete(firstKey);
      }
    }
  }

  enforceMemoryLimit() {
    if (this.memoryCache.size > this.config.maxMemoryCacheSize) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }
  }

  isStale(timestamp, ttl) {
    return Date.now() - timestamp > ttl;
  }

  async scanKeys(pattern, cursor = '0', keys = []) {
    if (!this.isConnected || !this.client) return keys;
    
    try {
      const [nextCursor, foundKeys] = await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      keys.push(...foundKeys);
      
      if (nextCursor !== '0') {
        return this.scanKeys(pattern, nextCursor, keys);
      }
    } catch (error) {
      logger.error('Error scanning keys:', error);
    }
    
    return keys;
  }

  startMaintenanceTasks() {
    // Clean up stale entries every 5 minutes
    setInterval(() => {
      this.cleanupStaleEntries();
    }, 5 * 60 * 1000);

    // Log metrics every hour
    setInterval(() => {
      const metrics = this.getMetrics();
      logger.info('Cache performance metrics:', metrics);
    }, 60 * 60 * 1000);
  }

  cleanupStaleEntries() {
    let cleanedCount = 0;

    // Clean memory cache
    for (const [key, { timestamp }] of this.memoryCache.entries()) {
      if (this.isStale(timestamp, this.config.memoryCacheTTL)) {
        this.memoryCache.delete(key);
        cleanedCount++;
      }
    }

    logger.debug(`Cleaned up ${cleanedCount} stale cache entries`);
  }

  async disconnect() {
    if (this.client && this.isConnected) {
      // Upstash REST client doesn't need explicit disconnect
      // but legacy Redis TCP client does
      if (typeof this.client.quit === 'function') {
        await this.client.quit();
      }
      this.isConnected = false;
      logger.info('Redis client disconnected');
    }
  }

  /**
   * Check if we're using Upstash (HTTP REST) vs legacy Redis (TCP)
   */
  _isUpstash() {
    return this.client && typeof this.client.ping === 'function' && !this.client.on;
  }

  /**
   * Get value from cache
   */
  async get(key) {
    try {
      // Try memory cache first (saves Upstash commands)
      if (this.memoryCache.has(key)) {
        const cached = this.memoryCache.get(key);
        if (cached.expiresAt > Date.now()) {
          logger.debug('Cache hit (memory)', { key });
          return cached.value;
        }
        this.memoryCache.delete(key);
      }

      // Try Redis/Upstash
      if (this.isConnected && this.client) {
        this._commandCount++;
        const value = await this.client.get(key);
        if (value !== null && value !== undefined) {
          logger.debug('Cache hit (Redis)', { key });
          // Upstash returns parsed JSON automatically; legacy redis returns string
          const parsed = typeof value === 'string' ? JSON.parse(value) : value;
          // Populate memory cache to avoid future Upstash calls
          this._setMemory(key, parsed, 300); // 5min L1 cache
          return parsed;
        }
      }

      logger.debug('Cache miss', { key });
      return null;
    } catch (error) {
      logger.error('Cache get error', { key, error: error.message });
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(key, value, ttlSeconds = 3600) {
    try {
      // Set in Redis/Upstash
      if (this.isConnected && this.client) {
        this._commandCount++;
        if (this._isUpstash()) {
          // Upstash REST client: .set(key, value, { ex: ttl })
          await this.client.set(key, JSON.stringify(value), { ex: ttlSeconds });
        } else {
          // Legacy Redis TCP client: .setEx(key, ttl, stringValue)
          await this.client.setEx(key, ttlSeconds, JSON.stringify(value));
        }
        logger.debug('Cache set (Redis)', { key, ttl: ttlSeconds });
      }

      // Always set in memory cache
      this._setMemory(key, value, ttlSeconds);
    } catch (error) {
      logger.error('Cache set error', { key, error: error.message });
    }
  }

  /**
   * Set value in memory cache only (L1)
   */
  _setMemory(key, value, ttlSeconds) {
    if (this.memoryCache.size >= this.config.maxMemoryCacheSize) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }

    this.memoryCache.set(key, {
      value,
      expiresAt: Date.now() + (ttlSeconds * 1000),
    });
  }

  /**
   * Delete value from cache
   */
  async delete(key) {
    try {
      if (this.isConnected && this.client) {
        this._commandCount++;
        await this.client.del(key);
      }
      this.memoryCache.delete(key);
      logger.debug('Cache deleted', { key });
    } catch (error) {
      logger.error('Cache delete error', { key, error: error.message });
    }
  }

  /**
   * Delete all keys matching pattern
   */
  async deletePattern(pattern) {
    try {
      if (this.isConnected && this.client) {
        // Use SCAN-based iteration instead of KEYS to avoid blocking Redis on large datasets
        const keys = await this.scanKeys(pattern);
        if (keys.length > 0) {
          this._commandCount++; // del
          if (this._isUpstash()) {
            await this.client.del(...keys);
            logger.debug('Cache pattern deleted (Upstash)', { pattern, count: keys.length });
          } else {
            await this.client.del(keys);
            logger.debug('Cache pattern deleted', { pattern, count: keys.length });
          }
        }
      }

      // Clear matching keys from memory cache
      for (const key of this.memoryCache.keys()) {
        if (this.matchPattern(key, pattern)) {
          this.memoryCache.delete(key);
        }
      }
    } catch (error) {
      logger.error('Cache delete pattern error', { pattern, error: error.message });
    }
  }

  /**
   * Clear all cache
   */
  async clear() {
    try {
      if (this.isConnected && this.client) {
        this._commandCount++;
        if (this._isUpstash()) {
          await this.client.flushdb();
        } else {
          await this.client.flushDb();
        }
      }
      this.memoryCache.clear();
      logger.info('Cache cleared');
    } catch (error) {
      logger.error('Cache clear error', { error: error.message });
    }
  }

  /**
   * Get or set cache value
   */
  async getOrSet(key, fetchFn, ttlSeconds = 3600) {
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetchFn();
    await this.set(key, value, ttlSeconds);
    return value;
  }

  /**
   * Simple pattern matching for cache keys
   */
  matchPattern(key, pattern) {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return regex.test(key);
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    const stats = {
      memoryCache: {
        size: this.memoryCache.size,
        maxSize: this.maxMemoryCacheSize,
      },
      redis: {
        connected: this.isConnected,
        isUpstash: this._isUpstash(),
        commandCount: this._commandCount,
      },
    };

    if (this.isConnected && this.client) {
      try {
        if (this._isUpstash()) {
          // Upstash: dbsize is a lightweight command
          const dbSize = await this.client.dbsize();
          stats.redis.dbSize = dbSize;
        } else {
          const info = await this.client.info('stats');
          stats.redis.info = info;
        }
      } catch (error) {
        logger.error('Failed to get Redis stats', { error: error.message });
      }
    }

    return stats;
  }
}

// Singleton instance
const cacheManager = new CacheManager();

// Cache key generators
export const CacheKeys = {
  user: (userId) => `user:${userId}`,
  userProfile: (userId) => `user:${userId}:profile`,
  problem: (problemId) => `problem:${problemId}`,
  problems: (filters) => `problems:${JSON.stringify(filters)}`,
  interview: (interviewId) => `interview:${interviewId}`,
  blogPost: (slug) => `blog:${slug}`,
  blogList: (page) => `blog:list:${page}`,
  jobListings: (filters) => `jobs:${JSON.stringify(filters)}`,
  leaderboard: (type) => `leaderboard:${type}`,
  systemDesign: (topicId) => `system-design:${topicId}`,
  // New: LLM response caching for budget conservation
  llmReview: (codeHash) => `llm:review:${codeHash}`,
  llmProblem: (type, difficulty, company) => `llm:problem:${type}:${difficulty}:${company || 'generic'}`,
};

// Cache TTL constants (in seconds)
export const CacheTTL = {
  SHORT: 300,        // 5 minutes
  MEDIUM: 1800,      // 30 minutes
  LONG: 3600,        // 1 hour
  VERY_LONG: 86400,  // 24 hours
};

export default cacheManager;