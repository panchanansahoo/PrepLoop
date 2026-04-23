import { problemCache, companyCache, systemDesignCache } from './cache.js';
import redisCache from './redisCache.js';
import { createLogger } from './structuredLogger.js';

const logger = createLogger('unified-cache');

class UnifiedCache {
  constructor(name, memoryCache, redisTTL = 600) {
    this.name = name;
    this.memoryCache = memoryCache;
    this.redisTTL = redisTTL;
    this.useRedis = process.env.USE_REDIS === 'true';
  }

  async get(key) {
    const cacheKey = `${this.name}:${key}`;

    // Try memory cache first (L1)
    const memValue = this.memoryCache.get(key);
    if (memValue !== null) {
      logger.debug('L1 cache hit', { cache: this.name, key });
      return memValue;
    }

    // Try Redis (L2) if enabled
    if (this.useRedis) {
      const redisValue = await redisCache.get(cacheKey);
      if (redisValue !== null) {
        logger.debug('L2 cache hit', { cache: this.name, key });
        // Populate L1 cache
        this.memoryCache.set(key, redisValue);
        return redisValue;
      }
    }

    logger.debug('Cache miss', { cache: this.name, key });
    return null;
  }

  async set(key, value, ttl) {
    const cacheKey = `${this.name}:${key}`;
    const effectiveTTL = ttl || this.redisTTL;

    // Set in memory cache (L1)
    this.memoryCache.set(key, value, effectiveTTL);

    // Set in Redis (L2) if enabled
    if (this.useRedis) {
      await redisCache.set(cacheKey, value, Math.floor(effectiveTTL / 1000));
    }

    logger.debug('Cache set', { cache: this.name, key, ttl: effectiveTTL });
  }

  async delete(key) {
    const cacheKey = `${this.name}:${key}`;

    // Delete from memory cache
    this.memoryCache.delete(key);

    // Delete from Redis if enabled
    if (this.useRedis) {
      await redisCache.delete(cacheKey);
    }

    logger.debug('Cache delete', { cache: this.name, key });
  }

  async clear() {
    // Clear memory cache
    this.memoryCache.clear();

    // Clear Redis if enabled
    if (this.useRedis) {
      await redisCache.clear(`${this.name}:*`);
    }

    logger.info('Cache cleared', { cache: this.name });
  }

  size() {
    return this.memoryCache.size();
  }

  async stats() {
    const memStats = {
      size: this.memoryCache.size(),
      maxSize: this.memoryCache.maxSize
    };

    if (this.useRedis) {
      const redisStats = await redisCache.getStats();
      return {
        memory: memStats,
        redis: redisStats
      };
    }

    return { memory: memStats };
  }
}

// Create unified cache instances
export const unifiedProblemCache = new UnifiedCache('problems', problemCache, 600000);
export const unifiedCompanyCache = new UnifiedCache('companies', companyCache, 600000);
export const unifiedSystemDesignCache = new UnifiedCache('systemDesign', systemDesignCache, 600000);

// Wrapper function for easy use
export const cacheWrapper = async (cacheName, key, fetchFn, ttl) => {
  const cacheMap = {
    problems: unifiedProblemCache,
    companies: unifiedCompanyCache,
    systemDesign: unifiedSystemDesignCache
  };

  const cache = cacheMap[cacheName];
  if (!cache) {
    logger.error('Invalid cache name', { cacheName });
    return await fetchFn();
  }

  const cached = await cache.get(key);
  if (cached !== null) {
    return cached;
  }

  const data = await fetchFn();
  await cache.set(key, data, ttl);
  return data;
};

export const invalidateCache = async (cacheName, pattern) => {
  const cacheMap = {
    problems: unifiedProblemCache,
    companies: unifiedCompanyCache,
    systemDesign: unifiedSystemDesignCache
  };

  if (cacheName === 'all') {
    for (const cache of Object.values(cacheMap)) {
      await cache.clear();
    }
  } else if (cacheMap[cacheName]) {
    await cacheMap[cacheName].clear();
  }
};

export const getCacheStats = async () => {
  return {
    problems: await unifiedProblemCache.stats(),
    companies: await unifiedCompanyCache.stats(),
    systemDesign: await unifiedSystemDesignCache.stats()
  };
};
