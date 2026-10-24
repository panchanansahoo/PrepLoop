import express from 'express';
import { createLogger } from '../utils/structuredLogger.js';

const router = express.Router();
const logger = createLogger('analytics');
const ALLOWED_EVENTS = new Set([
  'page_view',
  'feature_started',
  'feature_completed',
  'practice_submitted',
  'interview_completed',
]);

router.post('/track', (req, res) => {
  const event = req.body;
  if (!event || typeof event.name !== 'string' || !ALLOWED_EVENTS.has(event.name)) {
    return res.status(400).json({ error: 'Unsupported analytics event' });
  }

  const properties = event.properties && typeof event.properties === 'object'
    ? Object.fromEntries(
      Object.entries(event.properties)
        .filter(([key, value]) =>
          /^[a-zA-Z0-9_.-]{1,40}$/.test(key) &&
          (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')
        )
        .slice(0, 20)
    )
    : {};

  if (Object.values(properties).some((value) => typeof value === 'string' && value.length > 200)) {
    return res.status(400).json({ error: 'Analytics property is too long' });
  }

  logger.info(`Analytics event: ${event.name}`, properties);
  res.status(200).json({ success: true });
});

export default router;
