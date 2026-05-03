import express from 'express';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// ─── Opt in to matching pool ───
router.post('/opt-in', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { level = 'beginner', timezone = 'UTC', focusAreas = [] } = req.body;

    // Check not already paired
    const { data: existing } = await supabaseAdmin
      .from('accountability_pairs')
      .select('id')
      .or(`user_a.eq.${userId},user_b.eq.${userId}`)
      .eq('status', 'active')
      .limit(1);

    if (existing?.length > 0) {
      return res.status(400).json({ error: 'You already have an active accountability partner.' });
    }

    // Upsert into pool
    const { error } = await supabaseAdmin
      .from('accountability_pool')
      .upsert({
        user_id: userId,
        level: ['beginner', 'intermediate', 'advanced'].includes(level) ? level : 'beginner',
        timezone: String(timezone).slice(0, 50),
        focus_areas: Array.isArray(focusAreas) ? focusAreas.slice(0, 5) : [],
        matched: false,
      }, { onConflict: 'user_id' });

    if (error) throw error;

    // Try to find a match
    const match = await tryMatch(userId, level, focusAreas);

    res.json({
      optedIn: true,
      matched: !!match,
      partner: match ? { id: match.partnerId, level: match.partnerLevel } : null,
    });
  } catch (err) {
    console.error('Opt-in error:', err);
    res.status(500).json({ error: 'Failed to opt in.' });
  }
});

// ─── Match logic ───
async function tryMatch(userId, level, focusAreas) {
  // Find unmatched users with same level (exclude self)
  const { data: candidates } = await supabaseAdmin
    .from('accountability_pool')
    .select('user_id, level, focus_areas')
    .eq('matched', false)
    .eq('level', level)
    .neq('user_id', userId)
    .limit(10);

  if (!candidates?.length) return null;

  // Score candidates by focus area overlap
  const scored = candidates.map(c => {
    const overlap = (c.focus_areas || []).filter(a => focusAreas.includes(a)).length;
    return { ...c, score: overlap };
  }).sort((a, b) => b.score - a.score);

  const best = scored[0];

  // Create pair
  const { error: pairErr } = await supabaseAdmin
    .from('accountability_pairs')
    .insert({
      user_a: userId,
      user_b: best.user_id,
      focus_areas: [...new Set([...(focusAreas || []), ...(best.focus_areas || [])])],
    });

  if (pairErr) {
    console.error('Pair creation error:', pairErr);
    return null;
  }

  // Mark both as matched
  await supabaseAdmin.from('accountability_pool')
    .update({ matched: true })
    .in('user_id', [userId, best.user_id]);

  return { partnerId: best.user_id, partnerLevel: best.level };
}

// ─── Get current partner ───
router.get('/partner', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: pairs } = await supabaseAdmin
      .from('accountability_pairs')
      .select('*')
      .or(`user_a.eq.${userId},user_b.eq.${userId}`)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1);

    if (!pairs?.length) {
      // Check if in pool
      const { data: pool } = await supabaseAdmin
        .from('accountability_pool')
        .select('*')
        .eq('user_id', userId)
        .eq('matched', false)
        .single();

      return res.json({
        hasPartner: false,
        inPool: !!pool,
        pair: null,
      });
    }

    const pair = pairs[0];
    const partnerId = pair.user_a === userId ? pair.user_b : pair.user_a;

    // Get partner profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, avatar_url')
      .eq('id', partnerId)
      .single();

    res.json({
      hasPartner: true,
      inPool: false,
      pair: {
        id: pair.id,
        partnerId,
        partnerName: profile?.full_name || 'Study Buddy',
        partnerAvatar: profile?.avatar_url || null,
        weeklyGoal: pair.weekly_goal,
        focusAreas: pair.focus_areas,
        since: pair.created_at,
      },
    });
  } catch (err) {
    console.error('Get partner error:', err);
    res.status(500).json({ error: 'Failed to fetch partner.' });
  }
});

// ─── Set weekly goal ───
router.post('/set-goal', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { goal } = req.body;

    if (!goal || goal.trim().length < 3) {
      return res.status(400).json({ error: 'Goal must be at least 3 characters.' });
    }

    const { error } = await supabaseAdmin
      .from('accountability_pairs')
      .update({ weekly_goal: goal.trim().slice(0, 200) })
      .or(`user_a.eq.${userId},user_b.eq.${userId}`)
      .eq('status', 'active');

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('Set goal error:', err);
    res.status(500).json({ error: 'Failed to set goal.' });
  }
});

// ─── Leave partnership ───
router.post('/leave', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const { error } = await supabaseAdmin
      .from('accountability_pairs')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .or(`user_a.eq.${userId},user_b.eq.${userId}`)
      .eq('status', 'active');

    if (error) throw error;

    // Remove from pool
    await supabaseAdmin.from('accountability_pool')
      .delete()
      .eq('user_id', userId);

    res.json({ success: true });
  } catch (err) {
    console.error('Leave error:', err);
    res.status(500).json({ error: 'Failed to leave partnership.' });
  }
});

// ─── Get partner progress (side-by-side) ───
router.get('/progress', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: pairs } = await supabaseAdmin
      .from('accountability_pairs')
      .select('user_a, user_b')
      .or(`user_a.eq.${userId},user_b.eq.${userId}`)
      .eq('status', 'active')
      .limit(1);

    if (!pairs?.length) return res.json({ myProgress: null, partnerProgress: null });

    const pair = pairs[0];
    const partnerId = pair.user_a === userId ? pair.user_b : pair.user_a;

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const getProgress = async (uid) => {
      const [wins, patterns] = await Promise.all([
        supabaseAdmin.from('daily_wins').select('id').eq('user_id', uid)
          .gte('date', weekStart.toISOString().split('T')[0]),
        supabaseAdmin.from('pattern_trainer_attempts').select('is_correct').eq('user_id', uid)
          .gte('created_at', weekStart.toISOString()),
      ]);

      const p = patterns.data || [];
      return {
        activeDays: (wins.data || []).length,
        problemsSolved: (wins.data || []).length,
        patternAccuracy: p.length > 0 ? Math.round((p.filter(x => x.is_correct).length / p.length) * 100) : 0,
      };
    };

    const [myProgress, partnerProgress] = await Promise.all([
      getProgress(userId),
      getProgress(partnerId),
    ]);

    res.json({ myProgress, partnerProgress });
  } catch (err) {
    console.error('Progress error:', err);
    res.status(500).json({ error: 'Failed to fetch progress.' });
  }
});

export default router;
