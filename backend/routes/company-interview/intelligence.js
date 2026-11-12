import express from 'express';
import { authenticateToken } from '../../middleware/auth.ts';
import {
  buildDeterministicFollowUps,
  getCompanyIntelligence,
  markQuestionSeenRecently,
} from '../../services/companyQuestionService.ts';
import { createLogger } from '../../utils/structuredLogger.js';

const router = express.Router();
const logger = createLogger('company-intelligence');

router.get('/intelligence', async (req, res) => {
  try {
    const company = typeof req.query.company === 'string' ? req.query.company : undefined;
    const roleTrack = typeof req.query.roleTrack === 'string' ? req.query.roleTrack : undefined;
    const data = await getCompanyIntelligence(company, roleTrack);
    res.json(data);
  } catch (error) {
    logger.error('Failed to get company intelligence', { error: error.message });
    res.status(500).json({ error: 'Failed to load company interview intelligence' });
  }
});

router.post('/questions/:questionId/seen-recently', authenticateToken, (req, res) => {
  const { questionId } = req.params;
  if (!questionId) {
    return res.status(400).json({ error: 'questionId is required' });
  }
  const result = markQuestionSeenRecently(questionId);
  res.json({ success: true, ...result });
});

router.post('/follow-ups', authenticateToken, async (req, res) => {
  try {
    const { question, answer, company = 'Top Tech' } = req.body || {};
    if (!question || !answer) {
      return res.status(400).json({ error: 'question and answer are required' });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (apiKey && process.env.NODE_ENV !== 'test') {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `You are a ${company} interviewer. Given the question: "${String(question).slice(0, 500)}" and candidate answer: "${String(answer).slice(0, 1500)}", generate exactly 3 sharp, probing follow-up interview questions. Return JSON: {"followUps":["q1","q2","q3"]}.`;
        const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: prompt,
          config: { responseMimeType: 'application/json' },
        });
        const parsed = JSON.parse(response.text || '{}');
        if (Array.isArray(parsed.followUps) && parsed.followUps.length >= 3) {
          return res.json({ followUps: parsed.followUps.slice(0, 3), source: 'gemini' });
        }
      } catch (aiErr) {
        logger.warn('Gemini follow-up generation failed, using deterministic fallback', {
          error: aiErr.message,
        });
      }
    }

    const followUps = buildDeterministicFollowUps(question, answer, company);
    return res.json({ followUps, source: 'deterministic' });
  } catch (error) {
    logger.error('Failed to generate follow-up questions', { error: error.message });
    return res.status(500).json({ error: 'Failed to generate follow-up questions' });
  }
});

export default router;
