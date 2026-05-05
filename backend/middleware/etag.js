/**
 * ETag Middleware
 * 
 * Generates ETags for cacheable GET responses to allow client-side caching.
 * When a client sends If-None-Match with a matching ETag, returns 304 Not Modified
 * instead of re-transmitting the full response body.
 * 
 * Only applies to successful GET responses with JSON bodies.
 */

import { createHash } from 'crypto';

/**
 * @param {Object} options
 * @param {string[]} options.excludePaths - Path prefixes to skip (e.g. real-time endpoints)
 * @param {number} options.maxBodySize - Max body size in bytes to generate ETag for (default 1MB)
 */
export function etagMiddleware(options = {}) {
  const {
    excludePaths = ['/health', '/api/ai', '/api/voice', '/api/ws'],
    maxBodySize = 1_048_576, // 1MB
  } = options;

  return (req, res, next) => {
    // Only compute ETags for GET requests
    if (req.method !== 'GET') return next();

    // Skip excluded paths
    if (excludePaths.some(p => req.originalUrl.startsWith(p))) return next();

    // Intercept res.json to compute ETag before sending
    const originalJson = res.json.bind(res);

    res.json = function etagJson(body) {
      // Only generate ETags for successful responses
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return originalJson(body);
      }

      try {
        const bodyStr = JSON.stringify(body);
        
        // Skip ETag for very large payloads
        if (bodyStr.length > maxBodySize) {
          return originalJson(body);
        }

        // Generate a weak ETag from content hash
        const hash = createHash('md5').update(bodyStr).digest('hex').slice(0, 16);
        const etag = `W/"${hash}"`;

        // Check if client already has this version
        const ifNoneMatch = req.headers['if-none-match'];
        if (ifNoneMatch && ifNoneMatch === etag) {
          res.status(304).end();
          return res;
        }

        // Set ETag and cache headers
        res.setHeader('ETag', etag);
        
        // Allow browser to cache for 60s, but must revalidate
        if (!res.getHeader('Cache-Control')) {
          res.setHeader('Cache-Control', 'private, max-age=60, must-revalidate');
        }
      } catch {
        // If ETag generation fails, just send normally
      }

      return originalJson(body);
    };

    next();
  };
}

export default etagMiddleware;
