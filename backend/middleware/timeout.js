import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('timeout');

export const requestTimeout = (timeoutMs = 30000) => {
  return (req, res, next) => {
    const requestId = req.requestId || 'unknown';
    
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        logger.error('Request timeout', {
          requestId,
          method: req.method,
          path: req.originalUrl,
          timeout: timeoutMs
        });
        
        res.status(408).json({
          error: 'Request timeout',
          message: 'The request took too long to process',
          requestId
        });
      }
    }, timeoutMs);

    const originalSend = res.send.bind(res);
    res.send = function(data) {
      clearTimeout(timeout);
      return originalSend(data);
    };

    const originalJson = res.json.bind(res);
    res.json = function(data) {
      clearTimeout(timeout);
      return originalJson(data);
    };

    res.on('finish', () => {
      clearTimeout(timeout);
    });

    res.on('close', () => {
      clearTimeout(timeout);
    });

    next();
  };
};

export const slowRequestLogger = (thresholdMs = 1000) => {
  return (req, res, next) => {
    const start = Date.now();
    const requestId = req.requestId || 'unknown';

    res.on('finish', () => {
      const duration = Date.now() - start;
      
      if (duration > thresholdMs) {
        logger.warn('Slow request detected', {
          requestId,
          method: req.method,
          path: req.originalUrl,
          duration: `${duration}ms`,
          statusCode: res.statusCode
        });
      }
    });

    next();
  };
};
