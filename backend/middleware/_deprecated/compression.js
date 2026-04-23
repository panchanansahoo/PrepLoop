import compression from 'compression';
import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('compression');

export const compressionMiddleware = compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }

    // Don't compress already compressed responses
    const contentType = res.getHeader('Content-Type');
    if (contentType && (
      contentType.includes('image/') ||
      contentType.includes('video/') ||
      contentType.includes('audio/')
    )) {
      return false;
    }

    return compression.filter(req, res);
  },
  
  level: Number.parseInt(process.env.COMPRESSION_LEVEL || '6', 10),
  threshold: Number.parseInt(process.env.COMPRESSION_THRESHOLD || '1024', 10),
  
  chunkSize: 16 * 1024,
  memLevel: 8
});

export const compressionLogger = (req, res, next) => {
  const originalWrite = res.write.bind(res);
  const originalEnd = res.end.bind(res);
  
  let uncompressedSize = 0;
  let compressedSize = 0;

  res.write = function(chunk, encoding, callback) {
    if (chunk) {
      uncompressedSize += Buffer.byteLength(chunk);
    }
    return originalWrite(chunk, encoding, callback);
  };

  res.end = function(chunk, encoding, callback) {
    if (chunk) {
      uncompressedSize += Buffer.byteLength(chunk);
    }
    
    const contentEncoding = res.getHeader('Content-Encoding');
    compressedSize = Number.parseInt(res.getHeader('Content-Length') || '0', 10);
    
    if (contentEncoding && uncompressedSize > 0 && compressedSize > 0) {
      const ratio = ((1 - compressedSize / uncompressedSize) * 100).toFixed(2);
      
      logger.debug('Response compressed', {
        path: req.originalUrl,
        uncompressed: `${(uncompressedSize / 1024).toFixed(2)}KB`,
        compressed: `${(compressedSize / 1024).toFixed(2)}KB`,
        ratio: `${ratio}%`,
        encoding: contentEncoding
      });
    }
    
    return originalEnd(chunk, encoding, callback);
  };

  next();
};
