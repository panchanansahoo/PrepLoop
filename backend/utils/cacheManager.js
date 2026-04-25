/**
 * Cache Manager — Upstash Redis (Free Forever) + In-Memory Fallback
 * 
 * Migration from self-hosted Redis (TCP) to Upstash Redis (HTTP REST).
 * Upstash free tier: 500K commands/month, 256MB storage, 10K daily commands.
 * 
 * Design:
 *   1. Upstash Redis (via @upstash/redis) — durable, serverless, HTTP-based
 *   2. In-memory Map — L1 cache for hot data, avoids burning Upstash commands
 *   3. Graceful degradation — if Upstash is not configured, memory-only mode
 */
import { createLogger } from './structuredLogger.js';

const logger = createLogger('cache-manager');

// Lazy-load @upstash/redis to avoid hard dependency if not configured
let Redis = null;

class CacheManager {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.memoryCache = new Map();
    this.maxMemoryCacheSize = 100;
    this._commandCount = 0; // Track Upstash commands for budget awareness
  }

  async connect() {
    if (this.isConnected) return;

    const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
    const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    
    // Legacy support: also check old REDIS_URL for local dev with docker-compose
    const legacyRedisUrl = process.env.REDIS_URL;

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
        logger.info('Upstash Redis connected (free tier: 500K cmds/mo)');
      } catch (error) {
        logger.error('Failed to connect to Upstash Redis', { error: error.message });
        logger.warn('Falling back to in-memory cache');
        this.client = null;
      }
    } else if (legacyRedisUrl) {
      // Local development: use traditional Redis client via 'redis' package
      try {
        const { createClient } = await import('redis');
        this.client = createClient({
          url: legacyRedisUrl,
          socket: {
            reconnectStrategy: (retries) => {
              if (retries > 10) {
                logger.error('Redis reconnection failed after 10 attempts');
                return new Error('Redis reconnection limit exceeded');
              }
              return Math.min(retries * 100, 3000);
            },
          },
        });

        this.client.on('error', (err) => {
          logger.error('Redis client error', { error: err.message });
        });

        this.client.on('ready', () => {
          this.isConnected = true;
          logger.info('Local Redis client ready');
        });

        await this.client.connect();
      } catch (error) {
        logger.error('Failed to connect to local Redis', { error: error.message });
        logger.warn('Falling back to in-memory cache');
        this.client = null;
      }
    } else {
      logger.warn('No Redis configured (UPSTASH_REDIS_REST_URL or REDIS_URL), using in-memory cache only');
    }
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
    if (this.memoryCache.size >= this.maxMemoryCacheSize) {
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
        if (this._isUpstash()) {
          // Upstash: use SCAN-based key listing (avoids KEYS command on large datasets)
          // For small free-tier datasets, direct keys() is acceptable
          const keys = await this.client.keys(pattern);
          if (keys.length > 0) {
            this._commandCount += 2; // keys + del
            await this.client.del(...keys);
            logger.debug('Cache pattern deleted (Upstash)', { pattern, count: keys.length });
          }
        } else {
          // Legacy Redis TCP
          const keys = await this.client.keys(pattern);
          if (keys.length > 0) {
            this._commandCount += 2;
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
