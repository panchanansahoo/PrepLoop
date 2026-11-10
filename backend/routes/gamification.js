import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { GamificationService } from '../services/gamificationService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { createLogger } from '../utils/structuredLogger.js';

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
    return res.json({ success: true, ...status });
  } catch (err) {
    logger.error('Failed to get gamification status', { error: err.message });
    return res.status(500).json({ error: 'Failed to retrieve gamification state' });
  }
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

