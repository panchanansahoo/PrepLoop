import crypto from 'crypto';

// ─── Playground Response Cache Manager ───
// Caches AI playground responses to reduce API calls and improve latency

class PlaygroundCacheManager {
  constructor(redisClient) {
    this.redis = redisClient;
    this.cacheTTL = 24 * 60 * 60; // 24 hours
    
    // Modes that benefit from caching (stateless, reproducible)
    this.cacheableModes = new Set(['explain', 'review', 'debug', 'optimize', 'complexity']);
    
    // Track telemetry
    this.stats = {
      hits: 0,
      misses: 0,
      errors: 0,
    };
  }

  /**
   * Generate cache key based on mode, language, and code content
   * @param {string} mode - AI mode (explain, review, debug, etc.)
   * @param {string} language - Programming language
   * @param {string} code - Source code
   * @returns {string} Cache key
   */
  generateCacheKey(mode, language, code) {
    const content = `${mode}|${language}|${code}`;
    const hash = crypto
      .createHash('sha256')
      .update(content)
      .digest('hex')
      .slice(0, 32);
    
    return `playground:response:${hash}`;
  }

  /**
   * Check if mode should be cached
   * @param {string} mode - AI mode
   * @returns {boolean} True if mode is cacheable
   */
  isCacheable(mode) {
    return this.cacheableModes.has(mode);
  }

  /**
   * Get cached response
   * @param {string} mode - AI mode
   * @param {string} language - Programming language
   * @param {string} code - Source code
   * @returns {Promise<string|null>} Cached response or null
   */
  async get(mode, language, code) {
    try {
      if (!this.isCacheable(mode) || !this.redis) {
        return null;
      }

      const key = this.generateCacheKey(mode, language, code);
      const cached = await this.redis.get(key);

      if (cached) {
        this.stats.hits++;
        return cached;
      }

      this.stats.misses++;
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      this.stats.errors++;
      return null; // Graceful fallback on cache error
    }
  }

  /**
   * Set cached response
   * @param {string} mode - AI mode
   * @param {string} language - Programming language
   * @param {string} code - Source code
   * @param {string} response - AI response to cache
   * @returns {Promise<boolean>} True if set successfully
   */
  async set(mode, language, code, response) {
    try {
      if (!this.isCacheable(mode) || !this.redis || !response) {
        return false;
      }

      const key = this.generateCacheKey(mode, language, code);
      await this.redis.setex(key, this.cacheTTL, response);
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      this.stats.errors++;
      return false; // Graceful fallback on cache error
    }
  }

  /**
   * Invalidate cache for specific code (when user modifies)
   * @param {string} mode - AI mode
   * @param {string} language - Programming language
   * @param {string} code - Source code
   * @returns {Promise<boolean>} True if invalidated
   */
  async invalidate(mode, language, code) {
    try {
      if (!this.redis) return false;

      const key = this.generateCacheKey(mode, language, code);
      await this.redis.del(key);
      return true;
    } catch (error) {
      console.error('Cache invalidate error:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   * @returns {object} Cache hit/miss/error stats
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? ((this.stats.hits / total) * 100).toFixed(2) : 0;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      errors: this.stats.errors,
      hitRate: `${hitRate}%`,
      total,
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = { hits: 0, misses: 0, errors: 0 };
  }
}

export default PlaygroundCacheManager;
