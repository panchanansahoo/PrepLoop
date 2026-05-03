import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { supabaseAdmin } from '../db/supabaseClient.js';

const router = express.Router();

const TOPICS = ['DSA', 'System Design', 'Behavioral', 'SQL', 'Frontend', 'Backend', 'Resume', 'Mock Interview', 'Other'];

router.get('/topics', authenticateToken, (req, res) => res.json({ topics: TOPICS }));

// GET /api/daily-win/today
router.get('/today', authenticateToken, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabaseAdmin
      .from('daily_wins')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('date', today)
      .order('created_at', { ascending: false });
    res.json({ wins: data || [], date: today });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch wins' });
  }
});

// POST /api/daily-win — log a win
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { topic, note, minutes = 30 } = req.body;
    if (!topic) return res.status(400).json({ error: 'topic required' });

    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabaseAdmin
      .from('daily_wins')
      .insert({ user_id: req.user.id, date: today, topic, note: note || '', minutes })
      .select()
      .single();

    if (error) throw error;

    // Also update activity table
    await supabaseAdmin.from('user_activity').upsert({
      user_id: req.user.id,
      date: today,
      seconds_active: minutes * 60,
      last_updated: new Date().toISOString(),
    }, { onConflict: 'user_id,date' });

    res.json({ win: data });
  } catch (err) {
    console.error('Daily win error:', err);
    res.status(500).json({ error: 'Failed to log win' });
  }
});

// GET /api/daily-win/recent
router.get('/recent', authenticateToken, async (req, res) => {
  try {
    const { data } = await supabaseAdmin
      .from('daily_wins')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(30);
    res.json({ wins: data || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recent wins' });
  }
});

export default router;
