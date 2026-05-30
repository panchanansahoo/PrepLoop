/**
 * API Cache middleware
 * Minimal, robust implementation providing an L1 in-memory cache for GET requests
 * and delegating longer-term caching to the shared cacheManager.
 */

import { createLogger } from '../utils/structuredLogger.js';
import cacheManager from '../utils/cacheManager.js';
import performanceMonitor from '../utils/performanceMonitor.js';

const logger = createLogger('api-cache');

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

// Simple in-memory maps used as a local L1 cache fallback for this middleware
const cache = new Map();
const cacheTimestamps = new Map();

const isStale = (timestamp, ttl) => (Date.now() - timestamp) > ttl;

function getCacheKey(req) {
  const url = req.originalUrl || req.url;
  const userId = req.user?.id || req.headers['x-user-id'] || 'anon';
  return `${req.method}:${userId}:${url}`;
}

export function apiCacheMiddleware(options = {}) {
  const ttl = options.ttl ?? DEFAULT_TTL;

  return (req, res, next) => {
    try {
      if (req.method !== 'GET') return next();

      const key = getCacheKey(req);

      // L1 in-memory hit
      if (cache.has(key)) {
        const timestamp = cacheTimestamps.get(key) || 0;
        if (!isStale(timestamp, ttl)) {
          const entry = cache.get(key);
          logger.debug('API cache hit (memory)', { key });
          try { performanceMonitor.recordCacheEvent('hit', key); } catch (_e) { /* noop */ }
          res.setHeader('X-Cache', 'HIT');
          return res.status(entry.status || 200).json(entry.body);
        }
        // stale - delete local entry
        cache.delete(key);
        cacheTimestamps.delete(key);
      }

      // Wrap res.json to capture successful responses
      const start = Date.now();
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        try {
          // Only cache successful responses (2xx) to prevent caching error pages
          if (res.statusCode >= 200 && res.statusCode < 300) {
            // Store in L1 memory cache
            cache.set(key, { body, status: res.statusCode });
            cacheTimestamps.set(key, Date.now());

            // Also attempt to store in shared cache manager (best effort)
            try {
              void cacheManager.set(key, body, Math.floor((ttl || DEFAULT_TTL) / 1000));
              try { performanceMonitor.recordCacheEvent('set', key); } catch (_e) { /* noop */ }
            } catch (e) {
              logger.debug('Failed to set shared cache (non-fatal)', { key, err: e.message });
            }
          }
        } catch (e) {
          logger.error('Failed to cache response', { key, err: e.message });
        }

        // Lightweight request timing
        try {
          const duration = Date.now() - start;
          performanceMonitor.recordRequest({ path: req.path || req.url, method: req.method, duration, status: res.statusCode });
        } catch (_e) { /* noop */ }

        res.setHeader('X-Cache', 'MISS');
        return originalJson(body);
      };

      return next();
    } catch (err) {
      logger.error('apiCacheMiddleware error', { err: err.message });
      return next();
    }
  };
}

export function invalidateCache(pattern) {
  // Invalidate local cache entries
  for (const key of Array.from(cache.keys())) {
    if (key.includes(pattern)) {
      cache.delete(key);
      cacheTimestamps.delete(key);
    }
  }

  // Invalidate shared cache (best-effort)
  try {
    void cacheManager.deletePattern(pattern);
  } catch (e) {
    logger.debug('Shared cache invalidation failed (non-fatal)', { pattern, err: e.message });
  }
}

export function getCacheStats() {
  return {
    local: {
      size: cache.size,
      keys: Array.from(cache.keys()).slice(0, 50)
    },
    shared: (async () => {
      try {
        return await cacheManager.getStats();
      } catch (e) {
        return { error: e.message };
      }
    })()
  };
}
