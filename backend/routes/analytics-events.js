/**
 * Analytics Events API
 *
 * Receives batched analytics events from the frontend.
 * Stores in database for product insights and business reporting.
 */

import { Router } from 'express';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { createLogger } from '../utils/structuredLogger.js';

const router = Router();
const logger = createLogger('analytics-events');

// In-memory buffer for event aggregation
const eventBuffer = [];
const FLUSH_THRESHOLD = 50;
let flushTimer = null;

/**
 * POST /api/analytics/events
 * Batch event ingestion
 */
router.post('/events', async (req, res) => {
  try {
    const { events } = req.body;
    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: 'Events array required' });
    }

    // Sanitize and buffer events (max 50 per request)
    const sanitized = events.slice(0, 50).map(e => ({
      event_name: String(e.event || '').slice(0, 100),
      properties: e.properties || {},
      url: String(e.url || '').slice(0, 500),
      session_id: String(e.sessionId || '').slice(0, 50),
      user_id: req.user?.id || null,
      created_at: new Date(e.timestamp || Date.now()).toISOString(),
    }));

    eventBuffer.push(...sanitized);

    // Flush when buffer exceeds threshold
    if (eventBuffer.length >= FLUSH_THRESHOLD) {
      flushEvents();
    }

    return res.json({ received: sanitized.length });
  } catch (error) {
    logger.error('Event ingestion failed', { error: error.message });
    return res.status(500).json({ error: 'Failed to ingest events' });
  }
});

async function flushEvents() {
  if (eventBuffer.length === 0) return;
  const events = eventBuffer.splice(0);

  try {
    // Aggregate events by type for structured logging
    const counts = {};
    events.forEach(e => { counts[e.event_name] = (counts[e.event_name] || 0) + 1; });
    logger.info('Analytics events flushed', { count: events.length, types: counts });

    // Store in database (best-effort)
    // If analytics_events table doesn't exist yet, just log
    try {
      await supabaseAdmin.from('analytics_events').insert(events);
    } catch (dbError) {
      logger.debug('Analytics storage skipped (table may not exist)', { error: dbError.message });
    }
  } catch (error) {
    logger.error('Event flush failed', { error: error.message });
  }
}

// Auto-flush every 60 seconds
flushTimer = setInterval(flushEvents, 60000);

// Cleanup on process exit
process.on('SIGTERM', () => { flushEvents(); clearInterval(flushTimer); });

export default router;
