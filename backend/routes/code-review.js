import express from 'express';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { authenticateToken } from '../middleware/auth.js';
import { CodeReviewService } from '../services/aiService.js';

const router = express.Router();

// POST /api/code-review/analyze — submit code for AI review
router.post('/analyze', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { code, language, problemId, problemContext } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ error: 'Code is required' });
    }

    const review = await CodeReviewService.analyzeCode(
      userId,
      problemId || 'freeform',
      code,
      language || 'javascript',
      req.requestId
    );

    res.json(review);
  } catch (err) {
    console.error('Code review error:', err);
    res.status(500).json({ error: 'Failed to analyze code' });
  }
});

// GET /api/code-review/history — past code reviews
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Math.min(50, parseInt(req.query.limit) || 20);

    const { data, error } = await supabaseAdmin
      .from('code_review_sessions')
      .select('id, problem_id, language, time_complexity, space_complexity, overall_score, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('Code review history error:', err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// GET /api/code-review/:id — single review detail
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { data, error } = await supabaseAdmin
      .from('code_review_sessions')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json(data);
  } catch (err) {
    console.error('Code review detail error:', err);
    res.status(500).json({ error: 'Failed to fetch review' });
  }
});

export default router;
