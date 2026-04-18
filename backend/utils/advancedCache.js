/**
 * Advanced Multi-Layer Caching System
 * Implements L1 (Memory) + L2 (Redis) caching with intelligent invalidation
 */

import cacheManager from './cacheManager.js';

class AdvancedCache {
  constructor() {
    // L1 Cache: In-memory LRU cache
    this.memoryCache = new Map();
    this.maxMemoryItems = 1000;
    this.memoryTTL = 60 * 1000; // 1 minute
    
    // Cache statistics
    this.stats = {
      hits: 0,
      misses: 0,
      l1Hits: 0,
      l2Hits: 0,
    };
  }

  /**
   * Get value from cache (L1 -> L2 -> null)
   */
  async get(key, options = {}) {
    const { skipL1 = false } = options;

    // Try L1 cache first
    if (!skipL1) {
      const l1Value = this._getFromMemory(key);
      if (l1Value !== null) {
        this.stats.hits++;
        this.stats.l1Hits++;
        return l1Value;
      }
    }

    // Try L2 cache (Redis)
    try {
      const l2Value = await cacheManager.get(key);
      if (l2Value !== null) {
        this.stats.hits++;
        this.stats.l2Hits++;
        // Promote to L1
        this._setInMemory(key, l2Value);
        return l2Value;
      }
    } catch (error) {
      console.error('L2 cache error:', error.message);
    }

    this.stats.misses++;
    return null;
  }

  /**
   * Set value in both cache layers
   */
  async set(key, value, ttl = 3600) {
    // Set in L1
    this._setInMemory(key, value);

    // Set in L2
    try {
      await cacheManager.set(key, value, ttl);
    } catch (error) {
      console.error('L2 cache set error:', error.message);
    }
  }

  /**
   * Delete from all cache layers
   */
  async delete(key) {
    this.memoryCache.delete(key);
    try {
      await cacheManager.delete(key);
    } catch (error) {
      console.error('L2 cache delete error:', error.message);
    }
  }

  /**
   * Pattern-based invalidation
   */
  async invalidatePattern(pattern) {
    // Clear matching keys from L1
    for (const key of this.memoryCache.keys()) {
      if (this._matchPattern(key, pattern)) {
        this.memoryCache.delete(key);
      }
    }

    // Clear from L2
    try {
      await cacheManager.invalidatePattern(pattern);
    } catch (error) {
      console.error('L2 pattern invalidation error:', error.message);
    }
  }

  /**
   * Cache-aside pattern with automatic population
   */
  async getOrSet(key, fetchFn, ttl = 3600) {
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetchFn();
    await this.set(key, value, ttl);
    return value;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? (this.stats.hits / total * 100).toFixed(2) + '%' : '0%',
      l1Size: this.memoryCache.size,
    };
  }

  /**
   * Clear all caches
   */
  async clear() {
    this.memoryCache.clear();
    try {
      await cacheManager.clear();
    } catch (error) {
      console.error('L2 cache clear error:', error.message);
    }
  }

  // Private methods
  _getFromMemory(key) {
    const item = this.memoryCache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.memoryCache.delete(key);
      return null;
    }

    return item.value;
  }

  _setInMemory(key, value) {
    // Implement LRU eviction
    if (this.memoryCache.size >= this.maxMemoryItems) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }

    this.memoryCache.set(key, {
      value,
      expiry: Date.now() + this.memoryTTL,
    });
  }

  _matchPattern(key, pattern) {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return regex.test(key);
  }
}

export default new AdvancedCache();
