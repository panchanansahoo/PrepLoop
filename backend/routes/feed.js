import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
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
    
    // Aggregate recent activity from multiple sources
    const [submissions, interviews, posts] = await Promise.all([
      supabaseAdmin
        .from('submissions')
        .select('id, submitted_at, problem_id')
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false })
        .limit(parsedLimit)
        .then(r => (r.data || []).map(s => ({
          type: 'submission',
          ...s,
          created_at: s.submitted_at || s.created_at,
        }))),
      supabaseAdmin
        .from('mock_interviews')
        .select('id, overall_score, completed_at, started_at, interview_type')
        .eq('user_id', userId)
        .order('started_at', { ascending: false })
        .limit(parsedLimit)
        .then(r => (r.data || []).map(i => ({
          type: 'interview',
          ...i,
          score: i.overall_score ?? i.score,
          created_at: i.completed_at || i.started_at || i.created_at,
        }))),
      supabaseAdmin
        .from('community_posts')
        .select('id, title, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(parsedLimit)
        .then(r => (r.data || []).map(p => ({ type: 'post', ...p }))),
    ]);
    
    // Merge and sort by date
    const feed = [...submissions, ...interviews, ...posts]
      .sort((a, b) => new Date(b.created_at || b.submitted_at || b.started_at || 0) - new Date(a.created_at || a.submitted_at || a.started_at || 0))
      .slice(parsedOffset, parsedOffset + parsedLimit);
    
    res.json({ feed, total: feed.length });
  } catch (error) {
    logger.error('Feed error', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch activity feed' });
  }
});

export default router;
