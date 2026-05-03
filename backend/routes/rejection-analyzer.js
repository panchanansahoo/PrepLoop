import express from 'express';
import Groq from 'groq-sdk';
import { authenticateToken } from '../middleware/auth.js';
import { aiCallWithRetry } from '../utils/aiClient.js';

const router = express.Router();
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

router.post('/analyze', authenticateToken, async (req, res) => {
  try {
    const { experience, company, role, stage, outcome } = req.body;
    if (!experience || experience.trim().length < 20) {
      return res.status(400).json({ error: 'Please describe your interview experience in detail (min 20 chars).' });
    }
    if (!groq) return res.status(503).json({ error: 'AI service unavailable.' });

    const prompt = `Analyze this interview experience and respond with ONLY valid JSON:
Company: ${company || 'N/A'}, Role: ${role || 'SDE'}, Stage: ${stage || 'N/A'}, Outcome: ${outcome || 'Rejected'}
Experience: "${experience.trim().slice(0, 2000)}"

Return JSON: {"likely_reasons":[{"reason":"title","explanation":"detail","severity":"high|medium|low"}],"strengths":["str"],"fix_plan":[{"action":"step","timeframe":"1 week","priority":"high|medium|low"}],"encouragement":"supportive message","overall_assessment":"brief summary"}`;

    const completion = await aiCallWithRetry({
      operation: () => groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'You are an empathetic interview coach. Respond with valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    const raw = completion?.choices?.[0]?.message?.content || '{}';
    let analysis;
    try { analysis = JSON.parse(raw); } catch {
      const m = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (m?.[1]) try { analysis = JSON.parse(m[1].trim()); } catch { analysis = null; }
    }

    if (!analysis?.likely_reasons) return res.status(500).json({ error: 'AI parse failed. Try again.' });
    res.json({ analysis });
  } catch (err) {
    console.error('Rejection analysis error:', err);
    res.status(500).json({ error: 'Analysis failed.' });
  }
});

router.get('/patterns', authenticateToken, (req, res) => {
  res.json({ patterns: [
    { category: 'Communication', examples: ['Rambling answers', 'No STAR format', 'Filler words', 'No clarifying questions'] },
    { category: 'Technical Depth', examples: ['Surface-level answers', 'No trade-offs', 'Missing edge cases', 'No complexity analysis'] },
    { category: 'Problem Solving', examples: ['No planning before coding', 'Not walking through examples', 'Poor debugging'] },
    { category: 'Cultural Fit', examples: ['Negative about past employers', 'No questions for interviewer', 'Lack of enthusiasm'] },
    { category: 'Preparation', examples: ['Unfamiliar with company', 'No STAR stories', 'Weak system design'] },
  ]});
});

export default router;
