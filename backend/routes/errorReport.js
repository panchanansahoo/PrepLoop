import express from 'express';
import { optionalAuth } from '../middleware/auth.js';
import { createLogger } from '../utils/structuredLogger.js';

const router = express.Router();
const logger = createLogger('error-report');

// Client-side error reporting endpoint
router.post('/report', optionalAuth, (req, res) => {
  try {
    const { error, componentStack, url, userAgent, timestamp } = req.body;
    const userId = req.user?.id || 'anonymous';
    
    // Log the client error for monitoring
    logger.error('Client error report', {
      userId,
      error: error?.substring?.(0, 500),
      componentStack: componentStack?.substring?.(0, 500),
      url,
      userAgent: userAgent?.substring?.(0, 200),
      timestamp: timestamp || new Date().toISOString(),
    });
    
    res.json({ received: true });
  } catch (err) {
    logger.error('Error report handler failed', { error: err.message });
    res.status(500).json({ error: 'Failed to process error report' });
  }
});

export default router;
