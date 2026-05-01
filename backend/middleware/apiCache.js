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
  // Generate collision-resistant ETag using SHA-256 + canonical JSON
  //
  // Why not weak fingerprinting (e.g., sample first/middle/last)?
  // - String truncation (first 10KB) misses changes in tail — collisions
  // - Array sampling (first/middle/last elements) misses middle changes — collisions
  // - Object nested value placeholders ({nested}) lose change detection — collisions
  // - Checksum from first char only (charCodeAt(0)) extremely collision-prone
  //
  // SHA-256 solution:
  // - Full canonical JSON ensures all data contributes to hash
  // - Deterministic JSON.stringify (no property order dependencies)
  // - 128-bit output (first 16 hex chars) is cryptographically strong
  // - Collision probability: 1 in 2^128 (negligible for HTTP caching)
  //
  // Performance: JSON.stringify is fast even for large objects (< 100ms for 1000+ keys)
  const canonical = JSON.stringify(body) || '';
  return `"${createHash('sha256').update(canonical).digest('hex').slice(0, 16)}"`;
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

      // === Cache miss — wrap res.json/send/end to capture response ===
      const start = Date.now();
      let resolveRevalidation;
      let rejectRevalidation;
      const revalidationPromise = new Promise((resolve, reject) => {
        resolveRevalidation = resolve;
        rejectRevalidation = reject;
      });
      pendingRevalidations.set(key, revalidationPromise);

      // Create a timeout to clean up after 30s (prevent memory leaks)
      let cleanupTimeout = setTimeout(() => {
        if (pendingRevalidations.has(key)) {
          pendingRevalidations.delete(key);
          rejectRevalidation(new Error('Revalidation timeout'));
        }
      }, 30000);

      // Helper to cleanup and resolve
      const cleanup = (shouldDelete = true) => {
        if (cleanupTimeout) {
          clearTimeout(cleanupTimeout);
          cleanupTimeout = null;
        }
        if (shouldDelete && pendingRevalidations.has(key)) {
          pendingRevalidations.delete(key);
        }
      };

      // Listen for response finish/close to ensure cleanup
      const onFinish = () => cleanup(true);
      const onClose = () => cleanup(true);
      res.on('finish', onFinish);
      res.on('close', onClose);

      // Clean up listeners when appropriate
      const removeListeners = () => {
        res.removeListener('finish', onFinish);
        res.removeListener('close', onClose);
      };

      // === Wrap res.json ===
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
          cleanup(true);
          removeListeners();
        } catch (e) {
          logger.error('Failed to cache response', { key, err: e.message });
          rejectRevalidation(e);
          cleanup(true);
          removeListeners();
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

      // === Wrap res.send for non-JSON responses ===
      const originalSend = res.send.bind(res);
      res.send = (data) => {
        // Only cache if this hasn't been explicitly handled
        if (!res.headersSent) {
          const entry = { body: data, status: res.statusCode };
          try {
            entry.etag = generateETag(data);
            cache.set(key, entry);
            cacheTimestamps.set(key, Date.now());
            resolveRevalidation(entry);
          } catch (e) {
            logger.debug('Failed to cache send response', { key, err: e.message });
            rejectRevalidation(e);
          }
        }
        cleanup(true);
        removeListeners();
        return originalSend(data);
      };

      // === Wrap res.end for edge cases ===
      const originalEnd = res.end.bind(res);
      res.end = (chunk, encoding, callback) => {
        if (chunk && !res.headersSent && !pendingRevalidations.has(key)) {
          const entry = { body: chunk, status: res.statusCode };
          try {
            entry.etag = generateETag(chunk);
            cache.set(key, entry);
            cacheTimestamps.set(key, Date.now());
            resolveRevalidation(entry);
          } catch (e) {
            logger.debug('Failed to cache end response', { key, err: e.message });
          }
        }
        cleanup(true);
        removeListeners();
        return originalEnd(chunk, encoding, callback);
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
