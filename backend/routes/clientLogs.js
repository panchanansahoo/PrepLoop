import express from 'express';
import { createLogger } from '../utils/structuredLogger.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();
const logger = createLogger('client-logs');

// Rate limit: 30 requests per minute per IP
const clientLogLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many log submissions', code: 'RATE_LIMITED' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(clientLogLimiter);

// POST /api/client-logs
// Accept error reports, logs, and monitoring data from frontend
router.post('/', (req, res) => {
  try {
    const { type, message, error, context, stack, data } = req.body;

    if (!type || !message) {
      return res.status(400).json({ error: 'type and message are required', code: 'VALIDATION_ERROR' });
    }

    const allowedTypes = ['error', 'warn', 'info', 'log', 'render-error', 'unhandled-rejection'];
    const logType = allowedTypes.includes(type) ? type : 'info';

    const logData = {
      clientType: logType,
      clientMessage: typeof message === 'string' ? message.slice(0, 2000) : String(message).slice(0, 2000),
      url: context?.url?.slice(0, 500) || 'unknown',
      userAgent: context?.userAgent?.slice(0, 500) || req.headers['user-agent']?.slice(0, 500),
      timestamp: context?.timestamp || new Date().toISOString(),
      ip: req.ip,
    };

    // Add error details if present
    if (error) {
      logData.errorName = typeof error === 'string' ? error : error.name || 'Error';
      logData.errorMessage = typeof error === 'string' ? error : (error.message || '').slice(0, 2000);
    }

    if (stack) {
      logData.stack = typeof stack === 'string' ? stack.slice(0, 5000) : '';
    }

    if (data && typeof data === 'object') {
      logData.extra = JSON.stringify(data).slice(0, 2000);
    }

    // Route to appropriate log level
    if (logType === 'error' || logType === 'render-error' || logType === 'unhandled-rejection') {
      logger.error('Client error received', logData);
    } else if (logType === 'warn') {
      logger.warn('Client warning received', logData);
    } else {
      logger.info('Client log received', logData);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    // Never fail on log ingestion — always return 200
    logger.error('Failed to process client log', { error: err.message });
    res.status(200).json({ received: true });
  }
});

export default router;
