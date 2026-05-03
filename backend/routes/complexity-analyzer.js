import express from 'express';
import Groq from 'groq-sdk';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

// POST /api/complexity/analyze
router.post('/analyze', authenticateToken, async (req, res) => {
  try {
    const { code, language = 'javascript' } = req.body;
    if (!code || code.trim().length < 10) return res.status(400).json({ error: 'Code too short' });

    if (!groq) {
      return res.json({
        timeComplexity: 'O(?)',
        spaceComplexity: 'O(?)',
        explanation: 'AI not configured. Add GROQ_API_KEY to enable analysis.',
        loops: [],
        suggestions: [],
        source: 'unavailable',
      });
    }

    const completion = await groq.chat.completions.create({
      model: 'llama3-8b-8192',
      temperature: 0.2,
      max_tokens: 700,
      messages: [
        {
          role: 'system',
          content: `You are an expert algorithm analyst. Analyze the given code and return ONLY valid JSON:
{
  "timeComplexity": "O(...)",
  "spaceComplexity": "O(...)",
  "explanation": "2-3 sentence plain English explanation of why",
  "loops": ["describe each loop/recursion and its contribution"],
  "suggestions": ["1-2 optimization suggestions if applicable"],
  "worstCase": "O(...)",
  "bestCase": "O(...)"
}`,
        },
        { role: 'user', content: `Language: ${language}\n\nCode:\n${code.slice(0, 3000)}` },
      ],
    });

    const raw = completion.choices[0]?.message?.content || '{}';
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return res.status(500).json({ error: 'Failed to parse AI response' });

    res.json({ ...JSON.parse(match[0]), source: 'ai' });
  } catch (err) {
    console.error('Complexity analyzer error:', err);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

export default router;
