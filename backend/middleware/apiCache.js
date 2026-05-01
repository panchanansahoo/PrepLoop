/**
 * API Cache middleware — Enhanced with per-route TTL, ETag support, and stampede protection
 *
 * Features:
 *   1. Per-route cache TTL configuration
 *   2. ETag-based conditional requests (304 Not Modified)
 *   3. Cache-Control response headers for browser caching
 *   4. Cache stampede protection (lock-based revalidation)
 *   5. Cache bypass via ?_bust=1 query param
 *   6. L1 memory + L2 Redis caching via shared cacheManager
 */

import { createHash } from 'crypto';
import { createLogger } from '../utils/structuredLogger.js';
import cacheManager from '../utils/cacheManager.js';
import performanceMonitor from '../utils/performanceMonitor.js';

const logger = createLogger('api-cache');

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

// Per-route cache TTL configuration (in ms)
// Routes not listed here use DEFAULT_TTL
const ROUTE_TTL_CONFIG = {
  // Hot data — short TTL (user-specific, changes frequently)
  '/api/user':            2 * 60 * 1000,  // 2 min
  '/api/activity':        2 * 60 * 1000,  // 2 min
  '/api/coins':           2 * 60 * 1000,  // 2 min
  '/api/improvement-plan': 3 * 60 * 1000, // 3 min
  '/api/chat':            1 * 60 * 1000,  // 1 min

  // Warm data — moderate TTL (shared content, changes occasionally)
  '/api/dsa':             15 * 60 * 1000, // 15 min
  '/api/practice':        15 * 60 * 1000, // 15 min
  '/api/blog':            10 * 60 * 1000, // 10 min
  '/api/community':       5 * 60 * 1000,  // 5 min
  '/api/jobs':            10 * 60 * 1000, // 10 min
  '/api/library':         30 * 60 * 1000, // 30 min

  // Cold data — long TTL (rarely changes)
  '/api/system-design':   60 * 60 * 1000, // 1 hour
  '/api/company-interview': 60 * 60 * 1000, // 1 hour
};

// Routes that should NEVER be cached
const SKIP_CACHE_ROUTES = new Set([
  '/api/auth',
  '/api/payment',
  '/api/voice',
  '/api/admin',
  '/api/schedule',
  '/api/contact',
]);

// Simple in-memory L1 cache
const cache = new Map();
const cacheTimestamps = new Map();

// Stampede protection: track in-flight revalidation promises
const pendingRevalidations = new Map();

const isStale = (timestamp, ttl) => (Date.now() - timestamp) > ttl;

function getCacheKey(req, { allowAnonymous = false } = {}) {
  const url = req.originalUrl || req.url;
  const userId = req.user?.id;

  if (userId) {
    return `apicache:${req.method}:user:${userId}:${url}`;
  }

  if (allowAnonymous) {
    return `apicache:${req.method}:anon:${url}`;
  }

  return null;
}

function getRouteTTL(path) {
  // Match the longest prefix
  for (const [route, ttl] of Object.entries(ROUTE_TTL_CONFIG)) {
    if (path.startsWith(route)) return ttl;
  }
  return DEFAULT_TTL;
}

function shouldSkipCache(path) {
  for (const route of SKIP_CACHE_ROUTES) {
    if (path.startsWith(route)) return true;
  }
  return false;
}

function generateETag(body) {
  const str = typeof body === 'string' ? body : JSON.stringify(body);
  return `"${createHash('md5').update(str).digest('hex').slice(0, 16)}"`;
}

export function apiCacheMiddleware(options = {}) {
  return async (req, res, next) => {
    try {
      // Only cache GET requests
      if (req.method !== 'GET') return next();

      const path = req.path || req.originalUrl || req.url;

      // Skip cache for excluded routes
      if (shouldSkipCache(path)) return next();

      const key = getCacheKey(req, { allowAnonymous: options.allowAnonymous === true });
      if (!key) return next();

      // Cache bypass
      if (req.query._bust === '1') {
        cache.delete(key);
        cacheTimestamps.delete(key);
        return next();
      }

      const ttl = options.ttl ?? getRouteTTL(path);

      // === L1 in-memory hit ===
      if (cache.has(key)) {
        const timestamp = cacheTimestamps.get(key) || 0;
        if (!isStale(timestamp, ttl)) {
          const entry = cache.get(key);
          logger.debug('API cache hit (memory)', { key });
          try { performanceMonitor.recordCacheEvent('hit', key); } catch (e) { /* noop */ }

          // ETag-based conditional response (304 Not Modified)
          if (entry.etag && req.headers['if-none-match'] === entry.etag) {
            res.setHeader('X-Cache', 'HIT');
            res.setHeader('ETag', entry.etag);
            return res.status(304).end();
          }

          // Full cache hit response
          res.setHeader('X-Cache', 'HIT');
          res.setHeader('X-Cache-TTL', Math.round((ttl - (Date.now() - timestamp)) / 1000));
          if (entry.etag) res.setHeader('ETag', entry.etag);
          res.setHeader('Cache-Control', `private, max-age=${Math.floor(ttl / 1000)}, stale-while-revalidate=60`);
          return res.status(entry.status || 200).json(entry.body);
        }
        // Stale — delete local entry
        cache.delete(key);
        cacheTimestamps.delete(key);
      }

      // === Stampede protection ===
      // If another request is already revalidating this key, wait for it
      if (pendingRevalidations.has(key)) {
        try {
          const result = await pendingRevalidations.get(key);
          if (result) {
            res.setHeader('X-Cache', 'HIT-COALESCED');
            if (result.etag) res.setHeader('ETag', result.etag);
            res.setHeader('Cache-Control', `private, max-age=${Math.floor(ttl / 1000)}`);
            return res.status(result.status || 200).json(result.body);
          }
        } catch (e) {
          // Revalidation failed, fall through to normal processing
        }
      }

      // === Cache miss — wrap res.json to capture response ===
      const start = Date.now();
      let resolveRevalidation;
      const revalidationPromise = new Promise((resolve) => {
        resolveRevalidation = resolve;
      });
      pendingRevalidations.set(key, revalidationPromise);

      // Clean up after 30s to prevent memory leaks
      setTimeout(() => pendingRevalidations.delete(key), 30000);

      const originalJson = res.json.bind(res);
      res.json = (body) => {
        const entry = { body, status: res.statusCode };

        try {
          // Generate ETag
          entry.etag = generateETag(body);

          // Store in L1 memory cache
          cache.set(key, entry);
          cacheTimestamps.set(key, Date.now());

          // Also store in L2 shared cache (best effort)
          try {
            void cacheManager.set(key, body, Math.floor(ttl / 1000));
            try { performanceMonitor.recordCacheEvent('set', key); } catch (e) { /* noop */ }
          } catch (e) {
            logger.debug('Failed to set shared cache (non-fatal)', { key, err: e.message });
          }

          // Resolve stampede protection
          resolveRevalidation(entry);
          pendingRevalidations.delete(key);
        } catch (e) {
          logger.error('Failed to cache response', { key, err: e.message });
          resolveRevalidation(null);
          pendingRevalidations.delete(key);
        }

        // Lightweight request timing
        try {
          const duration = Date.now() - start;
          performanceMonitor.recordRequest({
            path: req.path || req.url,
            method: req.method,
            duration,
            status: res.statusCode,
          });
        } catch (e) { /* noop */ }

        // Set response headers
        res.setHeader('X-Cache', 'MISS');
        if (entry.etag) res.setHeader('ETag', entry.etag);
        res.setHeader('Cache-Control', `private, max-age=${Math.floor(ttl / 1000)}, stale-while-revalidate=60`);
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
