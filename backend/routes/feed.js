import express from 'express';
import { authenticateToken } from '../middleware/auth.ts';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { createLogger } from '../utils/structuredLogger.js';

const router = express.Router();
const logger = createLogger('feed');

// Activity feed endpoint
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const parsedOffset = Math.max(0, parseInt(offset, 10) || 0);
    const queryLimit = Math.min(parsedOffset + parsedLimit, 200);
    
    // Aggregate recent activity from multiple sources gracefully handling missing tables or errors
    const safeDateSortKey = (item) => {
      const raw = item?.created_at || item?.submitted_at || item?.started_at;
      if (!raw) return 0;
      const ts = new Date(raw).getTime();
      return Number.isNaN(ts) ? 0 : ts;
    };

    const [submissions, mockInterviews, modernSessions, posts] = await Promise.all([
      supabaseAdmin
        .from('submissions')
        .select('id, submitted_at, problem_id')
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false })
        .limit(queryLimit)
        .then(r => (!r.error && Array.isArray(r.data) ? r.data : []).map(s => ({
          type: 'submission',
          ...s,
          created_at: s.submitted_at || s.created_at,
        })))
        .catch(err => {
          logger.warn('Failed to load submissions for feed', { error: err?.message });
          return [];
        }),
      supabaseAdmin
        .from('mock_interviews')
        .select('id, overall_score, completed_at, started_at, interview_type')
        .eq('user_id', userId)
        .order('started_at', { ascending: false })
        .limit(queryLimit)
        .then(r => (!r.error && Array.isArray(r.data) ? r.data : []).map(i => ({
          type: 'interview',
          ...i,
          score: i.overall_score ?? i.score,
          created_at: i.completed_at || i.started_at || i.created_at,
        })))
        .catch(err => {
          logger.warn('Failed to load mock interviews for feed', { error: err?.message });
          return [];
        }),
      supabaseAdmin
        .from('interview_sessions')
        .select('id, session_id, interview_score, created_at, interview_type')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(queryLimit)
        .then(r => (!r.error && Array.isArray(r.data) ? r.data : []).map(i => ({
          type: 'interview',
          ...i,
          score: i.interview_score ?? 0,
          created_at: i.created_at,
        })))
        .catch(err => {
          logger.warn('Failed to load interview sessions for feed', { error: err?.message });
          return [];
        }),
      supabaseAdmin
        .from('community_posts')
        .select('id, title, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(queryLimit)
        .then(r => (!r.error && Array.isArray(r.data) ? r.data : []).map(p => ({ type: 'post', ...p })))
        .catch(err => {
          logger.warn('Failed to load community posts for feed', { error: err?.message });
          return [];
        }),
    ]);
    
    // Merge, deduplicate by ID, and sort by date
    const seenIds = new Set();
    const merged = [];
    for (const item of [...submissions, ...modernSessions, ...mockInterviews, ...posts]) {
      const key = `${item.type}:${item.id || item.session_id}`;
      if (!seenIds.has(key)) {
        seenIds.add(key);
        merged.push(item);
      }
    }

    const feed = merged
      .sort((a, b) => safeDateSortKey(b) - safeDateSortKey(a))
      .slice(parsedOffset, parsedOffset + parsedLimit);
    
    res.json({ feed, total: feed.length });
  } catch (error) {
    logger.error('Feed error', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch activity feed' });
  }
});

export default router;
