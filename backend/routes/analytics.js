import express from 'express';
import { createLogger } from '../utils/structuredLogger.js';

const router = express.Router();
const logger = createLogger('analytics');

router.post('/track', (req, res) => {
  // Client-side analytics tracking endpoint
  const event = req.body;
  if (event && event.name) {
    logger.info(`Analytics event: ${event.name}`, { ...event.properties });
  }
  res.status(200).json({ success: true });
});

export default router;
