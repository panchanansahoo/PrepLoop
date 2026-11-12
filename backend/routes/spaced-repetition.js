import express from 'express';
import { RecordReviewRequestSchema } from '@preploop/contracts/spaced-repetition';
import { authenticateToken } from '../middleware/auth.ts';
import { validateBody } from '../middleware/validateZod.js';
import { getDueReviews, recordProblemReview } from '../services/spacedRepetitionService.ts';

const router = express.Router();

router.get('/due', authenticateToken, async (req, res) => {
  try {
    const limit = Math.min(50, Math.max(1, Number.parseInt(String(req.query.limit || '20'), 10) || 20));
    const summary = await getDueReviews(req.user.id, { limit });
    return res.json(summary);
  } catch (err) {
    console.error('[spaced-repetition] Failed to load due reviews:', err?.message || err);
    return res.status(500).json({ error: 'Failed to load due reviews' });
  }
});

router.post('/review', authenticateToken, validateBody(RecordReviewRequestSchema), async (req, res) => {
  try {
    const { problemId, problemTitle, quality } = req.body;
    const result = await recordProblemReview(req.user.id, {
      problemId,
      problemTitle,
      quality,
    });
    return res.status(200).json(result);
  } catch (err) {
    console.error('[spaced-repetition] Failed to record review:', err?.message || err);
    return res.status(500).json({ error: 'Failed to record spaced repetition review' });
  }
});

export default router;
