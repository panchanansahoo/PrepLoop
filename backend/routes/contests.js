import express from 'express';
import { createLogger } from '../utils/structuredLogger.js';

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

export default router;
