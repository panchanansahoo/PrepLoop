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
    
    // Aggregate recent activity from multiple sources
    const [submissions, interviews, posts] = await Promise.all([
      supabaseAdmin
        .from('submissions')
        .select('id, created_at, problem_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(parseInt(limit))
        .then(r => (r.data || []).map(s => ({ type: 'submission', ...s }))),
      supabaseAdmin
        .from('mock_interviews')
        .select('id, created_at, score')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(parseInt(limit))
        .then(r => (r.data || []).map(i => ({ type: 'interview', ...i }))),
      supabaseAdmin
        .from('community_posts')
        .select('id, title, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(parseInt(limit))
        .then(r => (r.data || []).map(p => ({ type: 'post', ...p }))),
    ]);
    
    // Merge and sort by date
    const feed = [...submissions, ...interviews, ...posts]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(parseInt(offset), parseInt(offset) + parseInt(limit));
    
    res.json({ feed, total: feed.length });
  } catch (error) {
    logger.error('Feed error', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch activity feed' });
  }
});

export default router;
