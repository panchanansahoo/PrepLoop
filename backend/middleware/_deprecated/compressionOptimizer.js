import zlib from 'zlib';
import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('compression-optimizer');

// Compression statistics
const stats = {
  totalRequests: 0,
  compressedRequests: 0,
  bytesOriginal: 0,
  bytesCompressed: 0,
  avgCompressionRatio: 0,
};

/**
 * Check if content should be compressed
 */
function shouldCompress(req, res) {
  // Don't compress if client doesn't support it
  const acceptEncoding = req.headers['accept-encoding'] || '';
  if (!acceptEncoding.includes('gzip') && !acceptEncoding.includes('br')) {
    return false;
  }

  // Don't compress if already compressed
  if (res.getHeader('content-encoding')) {
    return false;
  }

  // Don't compress small responses (< 1KB)
  const contentLength = parseInt(res.getHeader('content-length'), 10);
  if (contentLength && contentLength < 1024) {
    return false;
  }

  // Check content type
  const contentType = res.getHeader('content-type') || '';
  return isCompressibleContentType(contentType);
}

/**
 * Check if content type is compressible
 */
function isCompressibleContentType(contentType) {
  const compressible = [
    'text/',
    'application/json',
    'application/javascript',
    'application/xml',
    'application/x-javascript',
    'application/xhtml+xml',
    'application/rss+xml',
    'application/atom+xml',
    'image/svg+xml',
  ];

  return compressible.some(type => contentType.includes(type));
}

/**
 * Choose best compression algorithm
 */
function chooseCompression(acceptEncoding) {
  // Brotli is better but slower, use for static assets
  if (acceptEncoding.includes('br')) {
    return 'br';
  }
  // Gzip is faster, use for dynamic content
  if (acceptEncoding.includes('gzip')) {
    return 'gzip';
  }
  return null;
}

/**
 * Compress data with chosen algorithm
 */
function compressData(data, algorithm, level = 6) {
  return new Promise((resolve, reject) => {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);

    if (algorithm === 'br') {
      zlib.brotliCompress(buffer, {
        params: {
          [zlib.constants.BROTLI_PARAM_QUALITY]: level,
        },
      }, (err, compressed) => {
        if (err) reject(err);
        else resolve(compressed);
      });
    } else if (algorithm === 'gzip') {
      zlib.gzip(buffer, {
        level,
      }, (err, compressed) => {
        if (err) reject(err);
        else resolve(compressed);
      });
    } else {
      resolve(buffer);
    }
  });
}

/**
 * Advanced compression middleware
 */
export const compressionOptimizer = (options = {}) => {
  const {
    threshold = 1024, // Minimum size to compress (1KB)
    level = 6, // Compression level (1-9)
    memLevel = 8, // Memory level (1-9)
  } = options;

  return async (req, res, next) => {
    stats.totalRequests++;

    // Skip compression for certain paths
    const skipPaths = ['/api/payment/webhook', '/api/voice/stream'];
    if (skipPaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    // Store original methods
    const originalSend = res.send.bind(res);
    const originalJson = res.json.bind(res);

    // Override send method
    res.send = async function(data) {
      if (!shouldCompress(req, res)) {
        return originalSend(data);
      }

      try {
        const acceptEncoding = req.headers['accept-encoding'] || '';
        const algorithm = chooseCompression(acceptEncoding);

        if (!algorithm) {
          return originalSend(data);
        }

        const originalSize = Buffer.byteLength(data);
        
        // Only compress if above threshold
        if (originalSize < threshold) {
          return originalSend(data);
        }

        const compressed = await compressData(data, algorithm, level);
        const compressedSize = compressed.length;

        // Only use compression if it actually reduces size
        if (compressedSize >= originalSize) {
          return originalSend(data);
        }

        // Update statistics
        stats.compressedRequests++;
        stats.bytesOriginal += originalSize;
        stats.bytesCompressed += compressedSize;
        stats.avgCompressionRatio = 
          ((stats.bytesOriginal - stats.bytesCompressed) / stats.bytesOriginal * 100).toFixed(2);

        // Set headers
        res.setHeader('Content-Encoding', algorithm);
        res.setHeader('Content-Length', compressedSize);
        res.setHeader('X-Original-Size', originalSize);
        res.setHeader('X-Compressed-Size', compressedSize);
        res.setHeader('X-Compression-Ratio', 
          ((originalSize - compressedSize) / originalSize * 100).toFixed(2) + '%'
        );

        logger.debug('Response compressed', {
          algorithm,
          originalSize,
          compressedSize,
          ratio: ((originalSize - compressedSize) / originalSize * 100).toFixed(2) + '%',
        });

        return originalSend(compressed);
      } catch (error) {
        logger.error('Compression failed', { error: error.message });
        return originalSend(data);
      }
    };

    // Override json method
    res.json = async function(data) {
      const jsonString = JSON.stringify(data);
      res.setHeader('Content-Type', 'application/json');
      return res.send(jsonString);
    };

    next();
  };
};

/**
 * Get compression statistics
 */
export function getCompressionStats() {
  return {
    ...stats,
    compressionRate: stats.totalRequests > 0
      ? ((stats.compressedRequests / stats.totalRequests) * 100).toFixed(2) + '%'
      : '0%',
    bytesSaved: stats.bytesOriginal - stats.bytesCompressed,
    avgCompressionRatio: stats.avgCompressionRatio + '%',
  };
}

/**
 * Reset compression statistics
 */
export function resetCompressionStats() {
  stats.totalRequests = 0;
  stats.compressedRequests = 0;
  stats.bytesOriginal = 0;
  stats.bytesCompressed = 0;
  stats.avgCompressionRatio = 0;
  logger.info('Compression stats reset');
}

/**
 * Stream compression for large responses
 */
export function createCompressionStream(algorithm = 'gzip', level = 6) {
  if (algorithm === 'br') {
    return zlib.createBrotliCompress({
      params: {
        [zlib.constants.BROTLI_PARAM_QUALITY]: level,
      },
    });
  } else if (algorithm === 'gzip') {
    return zlib.createGzip({ level });
  } else {
    throw new Error(`Unsupported compression algorithm: ${algorithm}`);
  }
}

/**
 * Middleware for streaming large files with compression
 */
export const streamCompressionMiddleware = () => {
  return (req, res, next) => {
    // Add helper method for streaming compressed responses
    res.streamCompressed = function(stream, contentType = 'application/octet-stream') {
      const acceptEncoding = req.headers['accept-encoding'] || '';
      const algorithm = chooseCompression(acceptEncoding);

      res.setHeader('Content-Type', contentType);

      if (algorithm) {
        const compressionStream = createCompressionStream(algorithm);
        res.setHeader('Content-Encoding', algorithm);
        stream.pipe(compressionStream).pipe(res);
      } else {
        stream.pipe(res);
      }
    };

    next();
  };
};

export default {
  compressionOptimizer,
  getCompressionStats,
  resetCompressionStats,
  createCompressionStream,
  streamCompressionMiddleware,
};
