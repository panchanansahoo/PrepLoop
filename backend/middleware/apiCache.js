import { getRedisClient } from '../config/redis.js';
import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('api-cache');

const DEFAULT_TTL = 300; // 5 minutes
const SKIP_CACHE_ROUTES = [
  '/api/auth',
  '/api/payment',
  '/api/admin',
  '/api/voice',
  '/api/contact',
  '/api/schedule',
  '/api/ai/interview',
  '/api/interview-suite',
  '/api/ai-features',
  '/api/ai',
  '/api/fresher-interview',
  '/api/interview-enhanced',
  '/api/behavioral-coach'
];

const cacheStats = {
  hits: 0,
  misses: 0,
  writes: 0,
  errors: 0,
};

export const createCacheKey = (req, { allowAnonymous = false } = {}) => {
  const { method, originalUrl, user } = req;

  if (user?.id) {
    return `cache:${method}:${originalUrl}:u:${user.id}`;
  }

  if (allowAnonymous) {
    return `cache:${method}:${originalUrl}:public`;
  }

  return null;
};

const isSkippableRoute = (originalUrl = '') => SKIP_CACHE_ROUTES.some((route) => originalUrl.startsWith(route));

export const apiCache = (ttl = DEFAULT_TTL, options = {}) => {
  return async (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    if (isSkippableRoute(req.originalUrl)) {
      return next();
    }

    const cacheKey = createCacheKey(req, options);
    if (!cacheKey) {
      return next();
    }

    const client = getRedisClient();
    if (!client) return next();

    try {
      const cached = await client.get(cacheKey);
      
      if (cached) {
        const parsed = JSON.parse(cached);
        logger.info(`Cache HIT for ${cacheKey}`);
        cacheStats.hits += 1;
        return res.json(parsed);
      }
      
      logger.info(`Cache MISS for ${cacheKey}`);
      cacheStats.misses += 1;
      
      // Override res.json to capture response for caching
      const originalJson = res.json;
      res.json = function(body) {
        if (this.statusCode >= 200 && this.statusCode < 300) {
          try {
            const serializedBody = JSON.stringify(body);
            void client.setEx(cacheKey, ttl, serializedBody).catch((setError) => {
              cacheStats.errors += 1;
              logger.error('Cache write failed:', setError);
            });
            cacheStats.writes += 1;
          } catch (serializeError) {
            cacheStats.errors += 1;
            logger.error('Cache serialization failed:', serializeError);
          }
        }

        originalJson.call(this, body);
      };
      
      next();
    } catch (error) {
      cacheStats.errors += 1;
      logger.error('Cache error:', error);
      // Proceed without caching if Redis fails
      next();
    }
  };
};

export const getCacheStats = () => ({
  ...cacheStats,
  configuredSkipRoutes: [...SKIP_CACHE_ROUTES],
});

export const invalidateCachePattern = async (pattern) => {
  const client = getRedisClient();
  if (!client) return;
  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
      logger.info(`Invalidated ${keys.length} cache keys matching pattern: ${pattern}`);
    }
  } catch (error) {
    logger.error('Cache invalidation error:', error);
  }
};