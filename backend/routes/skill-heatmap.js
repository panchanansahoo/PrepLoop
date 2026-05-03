import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { supabaseAdmin } from '../db/supabaseClient.js';

const router = express.Router();

// GET /api/skill-heatmap — returns 52 weeks of daily activity
router.get('/', authenticateToken, async (req, res) => {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 364);
    const sinceStr = since.toISOString().split('T')[0];

    const [activityRes, winsRes] = await Promise.all([
      supabaseAdmin
        .from('user_activity')
        .select('date, seconds_active')
        .eq('user_id', req.user.id)
        .gte('date', sinceStr)
        .order('date', { ascending: true }),
      supabaseAdmin
        .from('daily_wins')
        .select('date, topic, minutes')
        .eq('user_id', req.user.id)
        .gte('date', sinceStr),
    ]);

    const activityMap = Object.fromEntries(
      (activityRes.data || []).map(a => [a.date, Math.round(a.seconds_active / 60)])
    );

    // Build topic breakdown from wins
    const topicMap = {};
    for (const w of winsRes.data || []) {
      if (!topicMap[w.date]) topicMap[w.date] = {};
      topicMap[w.date][w.topic] = (topicMap[w.date][w.topic] || 0) + (w.minutes || 0);
    }

    // Fill all 365 days
    const days = [];
    for (let i = 364; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({
        date: dateStr,
        minutes: activityMap[dateStr] || 0,
        topics: topicMap[dateStr] || {},
      });
    }

    // Streak calculation
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].minutes > 0) streak++;
      else if (days[i].date !== today) break;
    }

    res.json({ days, streak, totalDaysActive: days.filter(d => d.minutes > 0).length });
  } catch (err) {
    console.error('Skill heatmap error:', err);
    res.status(500).json({ error: 'Failed to load heatmap' });
  }
});

export default router;
