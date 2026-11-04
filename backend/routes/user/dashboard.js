import express from 'express';
import { authenticateToken, optionalAuth } from '../../middleware/auth.js';
import {
  getComprehensiveUserStats,
  fetchUserHistory,
  fetchUserProgress,
} from '../../services/dashboardService.js';

const router = express.Router();

/**
 * GET /api/user/dashboard
 * Aggregated user progress, activity streak, radar skills, and daily problem recommendations
 */
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const stats = await getComprehensiveUserStats(req.user.id);
    return res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

/**
 * GET /api/user/history
 * Chronological timeline of mock interviews, code submissions, and resume scans
 */
router.get('/history', optionalAuth, async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.json({ sessions: [] });
    }
    const sessions = await fetchUserHistory(req.user.id);
    return res.json({ sessions });
  } catch (error) {
    console.error('Error fetching user history:', error);
    return res.status(500).json({ error: 'Failed to fetch user history' });
  }
});

/**
 * GET /api/user/progress
 * Problem solve status mapping for quick client-side lookup
 */
router.get('/progress', authenticateToken, async (req, res) => {
  try {
    const progress = await fetchUserProgress(req.user.id);
    return res.json({ progress });
  } catch (error) {
    console.error('Error fetching progress:', error);
    return res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

/**
 * GET /api/user/daily-challenge
 * Deterministic daily challenge seed and calendar epoch metadata
 */
router.get('/daily-challenge', optionalAuth, (req, res) => {
  try {
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

    return res.json({
      seed,
      dayOfYear: Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000),
      date: today.toISOString().split('T')[0],
    });
  } catch (error) {
    console.error('Error fetching daily challenge:', error);
    return res.status(500).json({ error: 'Failed to fetch daily challenge' });
  }
});

export default router;
