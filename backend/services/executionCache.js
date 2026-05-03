/**
 * Execution Cache Manager - Phase 3.2
 * 
 * Caches code execution results and API calls to reduce redundant computation.
 * Targets 60% cache hit rate for repeat submissions.
 * 
 * Architecture:
 * - Result cache: stores execution output for code + inputs (24h TTL)
 * - API memoization: caches Groq/hint generation (24h TTL)
 * - Hash-based key: efficient fingerprinting of code + inputs
 * - Redis backend: distributed cache for multi-instance deployment
 */

const crypto = require('crypto');
const Redis = require('ioredis');

const CACHE_CONFIG = {
  resultTTL: 24 * 60 * 60, // 24 hours
  apiMemoTTL: 24 * 60 * 60, // 24 hours
  maxCacheSize: 1000, // Max items per type
  hashAlgorithm: 'sha256',
};

class ExecutionCache {
  constructor(redisUrl = null) {
    this.redis = null;
    this.stats = {
      resultHits: 0,
      resultMisses: 0,
      apiHits: 0,
      apiMisses: 0,
      evictions: 0,
    };
    this.memoryCache = new Map(); // Fallback in-memory cache

    // Initialize Redis if URL provided
    if (redisUrl) {
      try {
        this.redis = new Redis(redisUrl);
        console.log('✅ Execution cache initialized with Redis');
      } catch (error) {
        console.warn('⚠️ Redis connection failed:', error.message);
        console.log('📦 Falling back to in-memory cache');
      }
    }
  }

  /**
   * Generate cache key for code execution
   */
  generateExecutionKey(code, language, inputs = null) {
    const combined = `${code}|${language}|${JSON.stringify(inputs || {})}`;
    return `exec:${this._hash(combined)}`;
  }

  /**
   * Generate cache key for API calls
   */
  generateAPIKey(apiName, params) {
    const combined = `api:${apiName}|${JSON.stringify(params)}`;
    return `api:${this._hash(combined)}`;
  }

  /**
   * Hash function for cache keys
   */
  _hash(input) {
    return crypto
      .createHash(CACHE_CONFIG.hashAlgorithm)
      .update(input)
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Get cached execution result
   */
  async getExecutionResult(code, language, inputs = null) {
    const key = this.generateExecutionKey(code, language, inputs);

    try {
      // Try Redis first
      if (this.redis) {
        const result = await this.redis.get(key);
        if (result) {
          this.stats.resultHits++;
          return JSON.parse(result);
        }
      }

      // Try memory cache fallback
      if (this.memoryCache.has(key)) {
        const result = this.memoryCache.get(key);
        if (result.expireAt > Date.now()) {
          this.stats.resultHits++;
          return result.value;
        } else {
          this.memoryCache.delete(key);
        }
      }

      this.stats.resultMisses++;
      return null;
    } catch (error) {
      console.warn('⚠️ Cache get error:', error.message);
      return null;
    }
  }

  /**
   * Set execution result in cache
   */
  async setExecutionResult(code, language, inputs, result) {
    const key = this.generateExecutionKey(code, language, inputs);

    // Remove sensitive data before caching
    const sanitizedResult = {
      output: result.output,
      stderr: result.stderr || '',
      exitCode: result.exitCode,
      executionTime: result.executionTime,
      cached: true,
    };

    try {
      // Store in Redis
      if (this.redis) {
        await this.redis.setex(
          key,
          CACHE_CONFIG.resultTTL,
          JSON.stringify(sanitizedResult)
        );
      }

      // Store in memory cache
      this.memoryCache.set(key, {
        value: sanitizedResult,
        expireAt: Date.now() + CACHE_CONFIG.resultTTL * 1000,
      });

      // Evict old entries if cache is too large
      if (this.memoryCache.size > CACHE_CONFIG.maxCacheSize) {
        await this._evictOldEntries();
      }

      return true;
    } catch (error) {
      console.warn('⚠️ Cache set error:', error.message);
      return false;
    }
  }

  /**
   * Get cached API result
   */
  async getAPIResult(apiName, params) {
    const key = this.generateAPIKey(apiName, params);

    try {
      // Try Redis first
      if (this.redis) {
        const result = await this.redis.get(key);
        if (result) {
          this.stats.apiHits++;
          return JSON.parse(result);
        }
      }

      // Try memory cache fallback
      if (this.memoryCache.has(key)) {
        const result = this.memoryCache.get(key);
        if (result.expireAt > Date.now()) {
          this.stats.apiHits++;
          return result.value;
        } else {
          this.memoryCache.delete(key);
        }
      }

      this.stats.apiMisses++;
      return null;
    } catch (error) {
      console.warn('⚠️ Cache get error:', error.message);
      return null;
    }
  }

  /**
   * Set API result in cache
   */
  async setAPIResult(apiName, params, result, ttl = CACHE_CONFIG.apiMemoTTL) {
    const key = this.generateAPIKey(apiName, params);

    try {
      // Store in Redis
      if (this.redis) {
        await this.redis.setex(
          key,
          ttl,
          JSON.stringify(result)
        );
      }

      // Store in memory cache
      this.memoryCache.set(key, {
        value: result,
        expireAt: Date.now() + ttl * 1000,
      });

      // Evict old entries if cache is too large
      if (this.memoryCache.size > CACHE_CONFIG.maxCacheSize) {
        await this._evictOldEntries();
      }

      return true;
    } catch (error) {
      console.warn('⚠️ Cache set error:', error.message);
      return false;
    }
  }

  /**
   * Invalidate cached result
   */
  async invalidate(key) {
    try {
      if (this.redis) {
        await this.redis.del(key);
      }
      this.memoryCache.delete(key);
      return true;
    } catch (error) {
      console.warn('⚠️ Cache invalidate error:', error.message);
      return false;
    }
  }

  /**
   * Clear all cache
   */
  async clear() {
    try {
      if (this.redis) {
        await this.redis.flushdb();
      }
      this.memoryCache.clear();
      return true;
    } catch (error) {
      console.warn('⚠️ Cache clear error:', error.message);
      return false;
    }
  }

  /**
   * Evict oldest entries from memory cache
   */
  async _evictOldEntries() {
    const entriesToEvict = Math.ceil(CACHE_CONFIG.maxCacheSize * 0.2); // Evict 20%
    const entries = Array.from(this.memoryCache.entries());

    // Sort by expiry time
    entries.sort((a, b) => a[1].expireAt - b[1].expireAt);

    for (let i = 0; i < entriesToEvict; i++) {
      this.memoryCache.delete(entries[i][0]);
      this.stats.evictions++;
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const resultTotal = this.stats.resultHits + this.stats.resultMisses;
    const apiTotal = this.stats.apiHits + this.stats.apiMisses;

    return {
      resultHitRate: resultTotal > 0 ? (this.stats.resultHits / resultTotal * 100).toFixed(1) : 0,
      apiHitRate: apiTotal > 0 ? (this.stats.apiHits / apiTotal * 100).toFixed(1) : 0,
      resultHits: this.stats.resultHits,
      resultMisses: this.stats.resultMisses,
      apiHits: this.stats.apiHits,
      apiMisses: this.stats.apiMisses,
      evictions: this.stats.evictions,
      memoryCacheSize: this.memoryCache.size,
      redisConnected: !!this.redis && this.redis.status === 'ready',
    };
  }

  /**
   * Warm cache with common patterns
   */
  async warmCache() {
    // Pre-cache common algorithms and solutions
    const commonPatterns = [
      { code: 'print("Hello")', language: 'python' },
      { code: 'console.log("Hello")', language: 'javascript' },
    ];

    for (const pattern of commonPatterns) {
      await this.setExecutionResult(pattern.code, pattern.language, null, {
        output: 'Hello\n',
        stderr: '',
        exitCode: 0,
        executionTime: 5,
      });
    }
  }

  /**
   * Close connections
   */
  async close() {
    if (this.redis) {
      await this.redis.quit();
    }
    this.memoryCache.clear();
  }
}

// Singleton instance
let cacheInstance = null;

/**
 * Get or create cache instance
 */
function getCache(redisUrl = null) {
  if (!cacheInstance) {
    cacheInstance = new ExecutionCache(redisUrl);
  }
  return cacheInstance;
}

/**
 * Middleware for automatic caching
 */
function createCacheMiddleware() {
  return async (req, res, next) => {
    // Check if this is a cacheable request
    if (req.method === 'POST' && req.path.includes('/run')) {
      const cache = getCache();
      const code = req.body?.code;
      const language = req.body?.language;

      if (code && language) {
        // Try to get from cache
        const cached = await cache.getExecutionResult(code, language, req.body?.inputs);
        if (cached) {
          return res.json({
            ...cached,
            source: 'cache',
          });
        }

        // Intercept response to cache result
        const originalJson = res.json.bind(res);
        res.json = function (data) {
          // Cache execution results
          if (data.success && data.output !== undefined) {
            cache.setExecutionResult(code, language, req.body?.inputs, data);
          }
          return originalJson(data);
        };
      }
    }

    next();
  };
}

module.exports = {
  ExecutionCache,
  getCache,
  createCacheMiddleware,
};
