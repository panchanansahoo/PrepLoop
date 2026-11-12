import express from 'express';
import { authenticateToken } from '../middleware/auth.ts';
import { GamificationService } from '../services/gamificationService.ts';
import { asyncHandler } from '../middleware/errorHandler.js';
import { createLogger } from '../utils/structuredLogger.js';
import { supabaseAdmin } from '../db/supabaseClient.js';

const router = express.Router();
const logger = createLogger('gamification-routes');

export const STREAK_FREEZE_COIN_COST = Number.parseInt(process.env.STREAK_FREEZE_COST || '50', 10);

/**
 * GET /api/gamification/status
 * Get current streak, frozen tokens, and unlocked badges
 */
router.get('/status', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const status = await GamificationService.getUserGamificationState(userId);
    const lastActive = status?.streak?.last_active_date;
    const today = new Date().toISOString().split('T')[0];
    const hoursSinceActive = lastActive
      ? (Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60)
      : 0;
    const streakAtRisk = Boolean(
      (status?.streak?.current_streak || 0) > 0 &&
      lastActive &&
      !String(lastActive).startsWith(today) &&
      hoursSinceActive >= 20
    );
    return res.json({ success: true, ...status, streakAtRisk });
  } catch (err) {
    logger.error('Failed to get gamification status', { error: err.message });
    return res.status(500).json({ error: 'Failed to retrieve gamification state' });
  }
}));

/**
 * POST /api/gamification/push-token
 * Register Expo push token and reminder preferences for daily streak reminders
 */
router.post('/push-token', authenticateToken, asyncHandler(async (req, res) => {
  const { expoPushToken, emailRemindersEnabled = true, pushRemindersEnabled = true } = req.body || {};
  if (!expoPushToken || typeof expoPushToken !== 'string') {
    return res.status(400).json({ error: 'expoPushToken is required' });
  }

  const { error } = await supabaseAdmin
    .from('user_push_tokens')
    .upsert(
      {
        user_id: req.user.id,
        expo_push_token: expoPushToken.slice(0, 255),
        email_reminders_enabled: Boolean(emailRemindersEnabled),
        push_reminders_enabled: Boolean(pushRemindersEnabled),
      },
      { onConflict: 'user_id,expo_push_token' }
    );

  if (error) {
    logger.warn('Failed to register push token', { userId: req.user.id, error: error.message });
    return res.status(500).json({ error: 'Failed to save push token' });
  }

  return res.json({ success: true });
}));

/**
 * POST /api/gamification/activity
 * Record a practice or interview action to maintain and increment streak
 */
router.post('/activity', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { activityType = 'practice' } = req.body;
    const result = await GamificationService.recordActivity(userId, activityType);
    return res.json({ success: true, ...result });
  } catch (err) {
    logger.error('Failed to record streak activity', { error: err.message });
    return res.status(500).json({ error: 'Failed to update streak' });
  }
}));

/**
 * POST /api/gamification/buy-freeze
 * Purchase a streak freeze token with coins
 */
router.post('/buy-freeze', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await GamificationService.purchaseStreakFreeze(userId, STREAK_FREEZE_COIN_COST);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    return res.json(result);
  } catch (err) {
    logger.error('Failed to purchase streak freeze', { error: err.message });
    return res.status(500).json({ error: 'Failed to purchase streak freeze' });
  }
}));

export default router;

