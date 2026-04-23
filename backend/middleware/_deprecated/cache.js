import cacheService from '../utils/cacheService.js';
import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('cache-middleware');

export function cacheMiddleware(options = {}) {
  const { 
    ttl = 300,
    keyGenerator = (req) => `${req.method}:${req.originalUrl}`,
    condition = () => true,
  } = options;

  return (req, res, next) => {
    if (req.method !== 'GET' || !condition(req)) {
      return next();
    }

    const key = keyGenerator(req);
    const cached = cacheService.get(key);

    if (cached) {
      logger.debug('Serving from cache', { key });
      return res.json(cached);
    }

    const originalJson = res.json.bind(res);
    res.json = (data) => {
      cacheService.set(key, data, ttl);
      return originalJson(data);
    };

    next();
  };
}

export function invalidateCache(pattern) {
  logger.info('Cache invalidation requested', { pattern });
  // Simple implementation - clear all for now
  cacheService.clear();
}
