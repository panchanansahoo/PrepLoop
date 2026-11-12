import express from 'express';
import { authenticateToken } from '../../middleware/auth.ts';
import { getInterviewPlayback, saveTranscriptTurns } from '../../services/transcriptPlaybackService.ts';
import { createLogger } from '../../utils/structuredLogger.js';

const router = express.Router();
const logger = createLogger('interview-playback');

router.post('/:sessionId/transcripts', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { turns } = req.body || {};

    if (!Array.isArray(turns) || turns.length === 0) {
      return res.status(400).json({ error: 'turns array is required and must be non-empty' });
    }

    const result = await saveTranscriptTurns(req.user.id, sessionId, turns);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Failed to save transcript turns', {
      requestId: req.requestId,
      userId: req.user?.id,
      error: error.message,
    });
    res.status(500).json({ error: 'Failed to save transcript turns' });
  }
});

router.get('/:sessionId/playback', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const playback = await getInterviewPlayback(req.user.id, sessionId);
    res.json(playback);
  } catch (error) {
    logger.error('Failed to load interview playback', {
      requestId: req.requestId,
      userId: req.user?.id,
      error: error.message,
    });
    res.status(500).json({ error: 'Failed to load interview playback' });
  }
});

export default router;
