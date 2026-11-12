import express from 'express';
import { authenticateToken } from '../../middleware/auth.ts';
import { groq } from './helpers.js';

const router = express.Router();

router.post('/transcribe', authenticateToken, (req, res) => {
  try {
    const { audioBuffer, language = 'en' } = req.body;

    if (!audioBuffer) {
      return res.status(400).json({ error: 'No audio provided' });
    }

    if (!groq) {
      return res.status(503).json({ error: 'Transcription unavailable' });
    }

    if (typeof audioBuffer === 'string') {
      const sanitizedBase64 = audioBuffer
        .replace(/^data:audio\/[a-z0-9.+-]+;base64,/i, '')
        .replace(/\s+/g, '');

      if (!sanitizedBase64 || !/^[A-Za-z0-9+/=]+$/.test(sanitizedBase64)) {
        return res.status(400).json({ error: 'Invalid audio payload format' });
      }

      const estimatedBytes = Math.floor((sanitizedBase64.length * 3) / 4);
      if (estimatedBytes > 25 * 1024 * 1024) {
        return res.status(413).json({ error: 'Audio payload too large' });
      }
    } else if (!Buffer.isBuffer(audioBuffer)) {
      return res.status(400).json({ error: 'Invalid audio payload type' });
    }

    res.json({
      transcript: 'Audio transcription would be processed here using a speech-to-text API',
      duration: 0,
      language
    });
  } catch (error) {
    console.error('Error transcribing audio:', error);
    res.status(500).json({ error: 'Failed to transcribe audio', message: error.message });
  }
});

export default router;

