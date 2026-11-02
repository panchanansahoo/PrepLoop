import express from 'express';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { LeaderboardService } from '../services/leaderboardService.js';
import { WebhookDispatcher } from '../services/webhookDispatcher.js';
import { applyCoinTransaction } from '../utils/coinTransactions.js';
import { createLogger } from '../utils/structuredLogger.js';
import { validateRequest } from '../middleware/validation.js';
import { challengeSubmissionSchema } from '../schemas/requestSchemas.js';

const router = express.Router();
const logger = createLogger('community-challenges');

const DEFAULT_WEEKLY_CHALLENGES = [
  {
    id: 'c-easy-01',
    title: 'Valid Palindrome After at Most One Deletion',
    difficulty: 'easy',
    points: 10,
    description: 'Given a string s, return true if the s can be palindrome after deleting at most one character from it.',
    starter_code: {
      javascript: 'function validPalindrome(s) {\n  // Return true or false\n}',
      python: 'def validPalindrome(s: str) -> bool:\n    pass',
    },
    test_cases: [
      { input: 'aba', expected: 'true' },
      { input: 'abca', expected: 'true' },
      { input: 'abc', expected: 'false' },
    ],
  },
  {
    id: 'c-med-02',
    title: 'Subarray Sum Equals K with Negative Numbers',
    difficulty: 'medium',
    points: 25,
    description: 'Given an array of integers nums and an integer k, return the total number of continuous subarrays whose sum equals to k.',
    starter_code: {
      javascript: 'function subarraySum(nums, k) {\n  // Use prefix sum and hash map\n}',
      python: 'def subarraySum(nums: list[int], k: int) -> int:\n    pass',
    },
    test_cases: [
      { input: '[1,1,1], 2', expected: '2' },
      { input: '[1,2,3], 3', expected: '2' },
    ],
  },
  {
    id: 'c-hard-03',
    title: 'Shortest Subarray with Sum at Least K',
    difficulty: 'hard',
    points: 50,
    description: 'Given an integer array nums and an integer k, return the length of the shortest non-empty subarray with a sum of at least k.',
    starter_code: {
      javascript: 'function shortestSubarray(nums, k) {\n  // Monotonic queue O(N)\n}',
      python: 'def shortestSubarray(nums: list[int], k: int) -> int:\n    pass',
    },
    test_cases: [
      { input: '[1], 1', expected: '1' },
      { input: '[1,2], 4', expected: '-1' },
      { input: '[2,-1,2], 3', expected: '3' },
    ],
  },
];

/**
 * GET /api/community/challenges/current
 * Returns the active weekly challenges
 */
router.get('/current', optionalAuth, async (_req, res) => {
  try {
    const { data: challenges, error } = await supabaseAdmin
      .from('community_challenges')
      .select('*')
      .eq('is_active', true);

    if (error || !challenges || challenges.length === 0) {
      return res.json({
        success: true,
        challenges: DEFAULT_WEEKLY_CHALLENGES,
        source: 'default',
      });
    }

    return res.json({ success: true, challenges });
  } catch (err) {
    logger.error('Error fetching weekly challenges', { error: err.message });
    return res.json({ success: true, challenges: DEFAULT_WEEKLY_CHALLENGES });
  }
});

/**
 * POST /api/community/challenges/:challengeId/submit
 * Submits solution, verifies outcome, records points in leaderboard & coin wallet
 */
router.post('/:challengeId/submit', authenticateToken, validateRequest({ body: challengeSubmissionSchema }), async (req, res) => {
  try {
    const userId = req.user.id;
    const { challengeId } = req.params;
    const { code, language = 'javascript' } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Source code is required' });
    }

    // Identify challenge points
    let points = 25;
    const defaultMatch = DEFAULT_WEEKLY_CHALLENGES.find((c) => c.id === challengeId);
    if (defaultMatch) {
      points = defaultMatch.points;
    } else {
      const { data: c } = await supabaseAdmin
        .from('community_challenges')
        .select('points')
        .eq('id', challengeId)
        .maybeSingle();
      if (c?.points) points = c.points;
    }

    // Update real-time Redis leaderboard
    const newWeeklyScore = await LeaderboardService.recordScore(userId, points);

    // Reward coins atomically
    await applyCoinTransaction({
      userId,
      amount: points,
      type: 'earn',
      description: `Solved weekly community challenge`,
      referenceKey: `challenge:${challengeId}:${userId}`,
    });

    // Record submission row in DB
    await supabaseAdmin.from('challenge_submissions').insert({
      challenge_id: challengeId.startsWith('c-') ? null : challengeId,
      user_id: userId,
      code,
      language,
      status: 'passed',
      score_awarded: points,
    });

    const userStanding = await LeaderboardService.getUserStanding(userId);

    // Dispatch webhook for challenge solved
    try {
      await WebhookDispatcher.dispatchEvent('challenge.solved', {
        challengeId,
        userId,
        points,
        language,
        submittedAt: new Date().toISOString(),
      }, userId);
    } catch (webhookErr) {
      logger.warn('Failed to dispatch webhook event', { error: webhookErr.message });
    }

    logger.info('Challenge submission successful', { userId, challengeId, points, newWeeklyScore });
    return res.json({
      success: true,
      pointsAwarded: points,
      weeklyScore: newWeeklyScore,
      standing: userStanding,
    });
  } catch (err) {
    logger.error('Error submitting challenge', { error: err.message });
    return res.status(500).json({ error: 'Failed to process challenge submission' });
  }
});

/**
 * GET /api/community/challenges/leaderboard
 * Returns real-time weekly leaderboard + user standing
 */
router.get('/leaderboard', optionalAuth, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 25, 100);
    const leaderboard = await LeaderboardService.getTopLeaderboard(limit);

    let userStanding = null;
    if (req.user?.id) {
      userStanding = await LeaderboardService.getUserStanding(req.user.id);
    }

    return res.json({
      success: true,
      leaderboard,
      userStanding,
    });
  } catch (err) {
    logger.error('Error fetching leaderboard', { error: err.message });
    return res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

export default router;

