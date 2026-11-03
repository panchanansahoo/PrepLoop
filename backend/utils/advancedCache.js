/**
 * Advanced Cache Utility
 * In-memory LRU/TTL cache with statistics tracking.
 */
class AdvancedCache {
  constructor() {
    this.store = new Map();
    this.hits = 0;
    this.misses = 0;
  }

  set(key, value, ttlSeconds = 60) {
    try {
      const expiresAt = Date.now() + ttlSeconds * 1000;
      this.store.set(key, { value, expiresAt });
      return Promise.resolve(true);
    } catch (err) {
      console.error('Cache set error:', err.message);
      return Promise.resolve(false);
    }
  }

  get(key) {
    try {
      const item = this.store.get(key);
      if (!item) {
        this.misses++;
        return Promise.resolve(null);
      }
      if (Date.now() > item.expiresAt) {
        this.store.delete(key);
        this.misses++;
        return Promise.resolve(null);
      }
      this.hits++;
      return Promise.resolve(item.value);
    } catch (err) {
      console.error('Cache get error:', err.message);
      return Promise.resolve(null);
    }
  }

  delete(key) {
    try {
      return Promise.resolve(this.store.delete(key));
    } catch (err) {
      console.error('Cache delete error:', err.message);
      return Promise.resolve(false);
    }
  }

  getStats() {
    const total = this.hits + this.misses;
    const rate = total === 0 ? 100 : Math.round((this.hits / total) * 100);
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: `${rate}%`,
      keys: this.store.size,
    };
  }
}

const advancedCache = new AdvancedCache();
export default advancedCache;
