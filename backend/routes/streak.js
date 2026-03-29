import express from 'express';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const isSchemaMissingError = (error) => {
  const code = String(error?.code || '').toUpperCase();
  return code === '42703' || code === '42P01';
};

// Check and update streak on login/dashboard visit
router.get('/check', authenticateToken, async (req, res) => {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('daily_streak, best_streak, last_active_date, coins')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;

    const today = new Date().toISOString().split('T')[0];
    const lastActive = profile?.last_active_date;
    let streak = profile?.daily_streak || 0;
    let bestStreak = profile?.best_streak || 0;
    let streakBroken = false;
    let isNewDay = false;

    if (lastActive === today) {
      // Already checked in today
      return res.json({
        streak,
        bestStreak,
        isNewDay: false,
        streakBroken: false,
        coins: profile?.coins || 0,
      });
    }

    // Check if yesterday was the last active day
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (lastActive === yesterdayStr) {
      // Streak continues
      streak += 1;
      isNewDay = true;
    } else if (!lastActive) {
      // First time user
      streak = 1;
      isNewDay = true;
    } else {
      // Streak broken
      streakBroken = true;
      streak = 1;
      isNewDay = true;
    }

    if (streak > bestStreak) {
      bestStreak = streak;
    }

    // Award streak bonus coins
    let bonusCoins = 0;
    if (isNewDay) {
      bonusCoins = Math.min(streak * 2, 20); // 2 coins per streak day, max 20
    }

    // Update profile
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        daily_streak: streak,
        best_streak: bestStreak,
        last_active_date: today,
        coins: (profile?.coins || 0) + bonusCoins,
      })
      .eq('id', req.user.id);

    if (updateError) throw updateError;

    // Log streak bonus
    if (bonusCoins > 0) {
      await supabaseAdmin.from('coin_transactions').insert({
        user_id: req.user.id,
        amount: bonusCoins,
        type: 'earn',
        description: `Daily streak bonus (Day ${streak})`,
      });
    }

    res.json({
      streak,
      bestStreak,
      isNewDay,
      streakBroken,
      bonusCoins,
      coins: (profile?.coins || 0) + bonusCoins,
    });
  } catch (error) {
    console.error('Error checking streak:', error);
    if (isSchemaMissingError(error)) {
      return res.json({
        streak: 0,
        bestStreak: 0,
        isNewDay: false,
        streakBroken: false,
        bonusCoins: 0,
        coins: 0,
        degraded: true,
      });
    }
    res.status(500).json({ error: 'Failed to check streak' });
  }
});

// Get streak status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('daily_streak, best_streak, last_active_date')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;
    res.json({
      streak: data?.daily_streak || 0,
      bestStreak: data?.best_streak || 0,
      lastActive: data?.last_active_date,
    });
  } catch (error) {
    console.error('Error fetching streak status:', error);
    if (isSchemaMissingError(error)) {
      return res.json({
        streak: 0,
        bestStreak: 0,
        lastActive: null,
        degraded: true,
      });
    }
    res.status(500).json({ error: 'Failed to fetch streak' });
  }
});

export default router;
