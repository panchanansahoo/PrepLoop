import { createClient } from 'redis';
import { createLogger } from './structuredLogger.js';

const logger = createLogger('cache-manager');

class CacheManager {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.memoryCache = new Map();
    this.maxMemoryCacheSize = 100;
  }

  async connect() {
    if (this.isConnected) return;

    const redisUrl = process.env.REDIS_URL;
    
    if (!redisUrl) {
      logger.warn('Redis URL not configured, using in-memory cache only');
      return;
    }

    try {
      this.client = createClient({
        url: redisUrl,
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

      this.client.on('connect', () => {
        logger.info('Redis client connected');
      });

      this.client.on('ready', () => {
        this.isConnected = true;
        logger.info('Redis client ready');
      });

      this.client.on('reconnecting', () => {
        logger.warn('Redis client reconnecting');
      });

      await this.client.connect();
    } catch (error) {
      logger.error('Failed to connect to Redis', { error: error.message });
      logger.warn('Falling back to in-memory cache');
    }
  }

  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
      logger.info('Redis client disconnected');
    }
  }

  /**
   * Get value from cache
   */
  async get(key) {
    try {
      // Try Redis first
      if (this.isConnected && this.client) {
        const value = await this.client.get(key);
        if (value) {
          logger.debug('Cache hit (Redis)', { key });
          return JSON.parse(value);
        }
      }

      // Fallback to memory cache
      if (this.memoryCache.has(key)) {
        const cached = this.memoryCache.get(key);
        if (cached.expiresAt > Date.now()) {
          logger.debug('Cache hit (memory)', { key });
          return cached.value;
        }
        this.memoryCache.delete(key);
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
      const serialized = JSON.stringify(value);

      // Set in Redis
      if (this.isConnected && this.client) {
        await this.client.setEx(key, ttlSeconds, serialized);
        logger.debug('Cache set (Redis)', { key, ttl: ttlSeconds });
      }

      // Set in memory cache
      if (this.memoryCache.size >= this.maxMemoryCacheSize) {
        const firstKey = this.memoryCache.keys().next().value;
        this.memoryCache.delete(firstKey);
      }

      this.memoryCache.set(key, {
        value,
        expiresAt: Date.now() + (ttlSeconds * 1000),
      });

      logger.debug('Cache set (memory)', { key, ttl: ttlSeconds });
    } catch (error) {
      logger.error('Cache set error', { key, error: error.message });
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key) {
    try {
      if (this.isConnected && this.client) {
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
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
          await this.client.del(keys);
          logger.debug('Cache pattern deleted', { pattern, count: keys.length });
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
        await this.client.flushDb();
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
      },
    };

    if (this.isConnected && this.client) {
      try {
        const info = await this.client.info('stats');
        stats.redis.info = info;
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
};

// Cache TTL constants (in seconds)
export const CacheTTL = {
  SHORT: 300,        // 5 minutes
  MEDIUM: 1800,      // 30 minutes
  LONG: 3600,        // 1 hour
  VERY_LONG: 86400,  // 24 hours
};

export default cacheManager;
