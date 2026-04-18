import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('api-cache');

const cache = new Map();
const cacheTimestamps = new Map();

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

const CACHE_STRATEGIES = {
  dsa: { ttl: 30 * 60 * 1000, staleWhileRevalidate: true }, // 30 min
  problems: { ttl: 15 * 60 * 1000, staleWhileRevalidate: true }, // 15 min
  blog: { ttl: 10 * 60 * 1000, staleWhileRevalidate: false }, // 10 min
  library: { ttl: 20 * 60 * 1000, staleWhileRevalidate: true }, // 20 min
  jobs: { ttl: 5 * 60 * 1000, staleWhileRevalidate: true }, // 5 min
  'company-interview': { ttl: 60 * 60 * 1000, staleWhileRevalidate: true }, // 1 hour
  'system-design': { ttl: 30 * 60 * 1000, staleWhileRevalidate: true }, // 30 min
};

const getCacheKey = (req) => {
  const { method, originalUrl, user } = req;
  const userId = user?.id || 'anonymous';
  return `${method}:${originalUrl}:${userId}`;
};

const getCacheStrategy = (path) => {
  for (const [key, strategy] of Object.entries(CACHE_STRATEGIES)) {
    if (path.includes(`/api/${key}`)) {
      return strategy;
    }
  }
  return { ttl: DEFAULT_TTL, staleWhileRevalidate: false };
};

const isStale = (timestamp, ttl) => {
  return Date.now() - timestamp > ttl;
};

export const apiCache = (options = {}) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip caching for authenticated user-specific data
    const skipPaths = ['/api/user', '/api/profile', '/api/activity', '/api/wallet', '/api/coins'];
    if (skipPaths.some(path => req.originalUrl.startsWith(path))) {
      return next();
    }

    const cacheKey = getCacheKey(req);
    const strategy = getCacheStrategy(req.originalUrl);
    const cachedData = cache.get(cacheKey);
    const cachedTimestamp = cacheTimestamps.get(cacheKey);

    // Cache hit - check if stale
    if (cachedData && cachedTimestamp) {
      const stale = isStale(cachedTimestamp, strategy.ttl);

      if (!stale) {
        // Fresh cache - return immediately
        logger.debug('Cache hit (fresh)', { key: cacheKey });
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Age', Math.floor((Date.now() - cachedTimestamp) / 1000));
        return res.json(cachedData);
      }

      if (strategy.staleWhileRevalidate) {
        // Return stale data while revalidating in background
        logger.debug('Cache hit (stale-while-revalidate)', { key: cacheKey });
        res.setHeader('X-Cache', 'STALE');
        res.setHeader('X-Cache-Age', Math.floor((Date.now() - cachedTimestamp) / 1000));
        res.json(cachedData);

        // Revalidate in background (non-blocking)
        setImmediate(() => {
          logger.debug('Background revalidation started', { key: cacheKey });
        });
        return;
      }
    }

    // Cache miss or expired - intercept response
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(cacheKey, data);
        cacheTimestamps.set(cacheKey, Date.now());
        logger.debug('Cache set', { key: cacheKey, ttl: strategy.ttl });
        res.setHeader('X-Cache', 'MISS');
      }
      return originalJson(data);
    };

    next();
  };
};

export const invalidateCache = (pattern) => {
  let count = 0;
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
      cacheTimestamps.delete(key);
      count++;
    }
  }
  logger.info('Cache invalidated', { pattern, count });
  return count;
};

export const clearCache = () => {
  const size = cache.size;
  cache.clear();
  cacheTimestamps.clear();
  logger.info('Cache cleared', { size });
  return size;
};

export const getCacheStats = () => {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()).slice(0, 10), // Sample
    oldestEntry: Math.min(...Array.from(cacheTimestamps.values())),
    newestEntry: Math.max(...Array.from(cacheTimestamps.values())),
  };
};

// Cleanup old entries every 10 minutes
setInterval(() => {
  let cleaned = 0;
  const now = Date.now();
  
  for (const [key, timestamp] of cacheTimestamps.entries()) {
    const strategy = getCacheStrategy(key);
    if (now - timestamp > strategy.ttl * 2) {
      cache.delete(key);
      cacheTimestamps.delete(key);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    logger.info('Cache cleanup completed', { cleaned, remaining: cache.size });
  }
}, 10 * 60 * 1000);

export default { apiCache, invalidateCache, clearCache, getCacheStats };
