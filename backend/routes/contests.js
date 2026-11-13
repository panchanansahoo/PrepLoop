import express from 'express';
import { createLogger } from '../utils/structuredLogger.js';
import { authenticateToken } from '../middleware/auth.ts';
import {
  getActiveWeeklyContest,
  getWeeklyContestLeaderboard,
  submitWeeklyContest,
  recordContestStart,
} from '../services/weeklyContestService.ts';

const router = express.Router();
const logger = createLogger('contests');

const CODEFORCES_CONTEST_LIST_URL = 'https://codeforces.com/api/contest.list';
const CODEFORCES_TIMEOUT_MS = Number.parseInt(process.env.CODEFORCES_API_TIMEOUT_MS || '8000', 10);

async function fetchCodeforcesContestList() {
  const response = await fetch(CODEFORCES_CONTEST_LIST_URL, {
    signal: AbortSignal.timeout(CODEFORCES_TIMEOUT_MS),
    headers: {
      Accept: 'application/json',
      'User-Agent': 'PrepLoop/1.0 (+https://preploop.local)',
    },
  });

  if (!response.ok) {
    throw new Error(`Codeforces API returned HTTP ${response.status}`);
  }

  const data = await response.json();

  if (data?.status !== 'OK' || !Array.isArray(data?.result)) {
    throw new Error(data?.comment || 'Unexpected Codeforces API response');
  }

  return data;
}

// Compatibility endpoint for clients that previously requested Codeforces-style
// contest data through the app API namespace.
router.get('/contest.list', async (req, res, next) => {
  try {
    const data = await fetchCodeforcesContestList();
    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=900');
    res.json(data);
  } catch (error) {
    logger.warn('Failed to fetch Codeforces contest list', {
      requestId: req.requestId,
      err: error.message,
    });
    next(error);
  }
});

// Normalized endpoint for PrepLoop UI consumers.
router.get('/contests/codeforces', async (req, res, next) => {
  try {
    const data = await fetchCodeforcesContestList();
    const contests = data.result
      .filter((contest) => contest.phase === 'BEFORE')
      .map((contest) => ({
        platform: 'Codeforces',
        id: contest.id,
        name: contest.name,
        startTimeSeconds: contest.startTimeSeconds,
        durationSeconds: contest.durationSeconds,
        date: new Date(contest.startTimeSeconds * 1000).toISOString(),
        duration: `${Math.round(contest.durationSeconds / 3600)} hrs`,
        link: `https://codeforces.com/contest/${contest.id}`,
        live: true,
      }));

    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=900');
    res.json({ contests });
  } catch (error) {
    logger.warn('Failed to fetch normalized Codeforces contests', {
      requestId: req.requestId,
      err: error.message,
    });
    next(error);
  }
});

// ─── G3-3: PrepLoop Weekly Contest System with Leaderboard ───────────────────
router.get('/contests/weekly', async (_req, res) => {
  try {
    const contest = getActiveWeeklyContest(new Date(), true);
    const leaderboard = await getWeeklyContestLeaderboard(contest.id);
    return res.json({ contest, leaderboard });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to load weekly contest' });
  }
});

router.post('/contests/weekly/:contestId/start', authenticateToken, (req, res) => {
  try {
    const contestId = req.params.contestId;
    const startedAt = recordContestStart(contestId, req.user.id);
    return res.json({ contestId, startedAt: new Date(startedAt).toISOString() });
  } catch (_err) {
    return res.status(500).json({ error: 'Failed to record contest start' });
  }
});

router.get('/contests/weekly/:contestId/leaderboard', async (req, res) => {
  try {
    const leaderboard = await getWeeklyContestLeaderboard(req.params.contestId);
    return res.json({ contestId: req.params.contestId, leaderboard });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to load contest leaderboard' });
  }
});

router.post('/contests/weekly/:contestId/submit', authenticateToken, async (req, res) => {
  try {
    const { answers, timeTakenSeconds, username } = req.body || {};
    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ error: 'answers object is required' });
    }
    const result = await submitWeeklyContest({
      contestId: req.params.contestId,
      userId: req.user.id,
      username: username || req.user.email?.split('@')[0] || 'Candidate',
      answers,
      timeTakenSeconds,
    });
    return res.status(201).json(result);
  } catch (error) {
    logger.error('Weekly contest submission failed', {
      requestId: req.requestId,
      userId: req.user?.id,
      err: error.message,
    });
    return res.status(500).json({ error: 'Failed to submit weekly contest' });
  }
});

export default router;
