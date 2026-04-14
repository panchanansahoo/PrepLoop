import { createLogger } from './structuredLogger.js';

const logger = createLogger('cache');

class MemoryCache {
  constructor(maxSize = 1000, ttlMs = 300000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    item.lastAccessed = Date.now();
    return item.value;
  }

  set(key, value, ttl = this.ttlMs) {
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl,
      lastAccessed: Date.now()
    });
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  evictLRU() {
    let lruKey = null;
    let lruTime = Infinity;

    for (const [key, item] of this.cache) {
      if (item.lastAccessed < lruTime) {
        lruTime = item.lastAccessed;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }

  size() {
    return this.cache.size;
  }
}

const problemCache = new MemoryCache(500, 600000); // 10 min
const companyCache = new MemoryCache(200, 600000);
const systemDesignCache = new MemoryCache(100, 600000);

export const cacheWrapper = async (key, fetchFn, cache = problemCache, ttl) => {
  const cached = cache.get(key);
  if (cached) {
    logger.debug('Cache hit', { key });
    return cached;
  }

  logger.debug('Cache miss', { key });
  const data = await fetchFn();
  cache.set(key, data, ttl);
  return data;
};

export const invalidateCache = (pattern, cache = problemCache) => {
  const keys = Array.from(cache.cache.keys());
  const regex = new RegExp(pattern);
  
  for (const key of keys) {
    if (regex.test(key)) {
      cache.delete(key);
    }
  }
  
  logger.info('Cache invalidated', { pattern, count: keys.length });
};

export { problemCache, companyCache, systemDesignCache };
