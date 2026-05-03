import express from 'express';
import Groq from 'groq-sdk';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

// POST /api/jd-questions/generate
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const { jobDescription, count = 10 } = req.body;
    if (!jobDescription || jobDescription.trim().length < 50) {
      return res.status(400).json({ error: 'Job description too short (min 50 chars)' });
    }

    if (!groq) return res.status(503).json({ error: 'AI not configured' });

    const completion = await groq.chat.completions.create({
      model: 'llama3-8b-8192',
      temperature: 0.5,
      max_tokens: 1200,
      messages: [
        {
          role: 'system',
          content: `You are a senior technical interviewer. Given a job description, generate realistic interview questions a candidate should prepare for. Return ONLY valid JSON:
{
  "role": "inferred job title",
  "techStack": ["tech1", "tech2"],
  "questions": [
    {
      "question": "...",
      "type": "technical|behavioral|system-design|hr",
      "difficulty": "easy|medium|hard",
      "whyAsked": "one sentence on why this is relevant to the JD"
    }
  ]
}
Generate exactly ${count} questions covering a mix of types.`,
        },
        { role: 'user', content: jobDescription.slice(0, 3000) },
      ],
    });

    const raw = completion.choices[0]?.message?.content || '{}';
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return res.status(500).json({ error: 'Failed to parse AI response' });

    res.json(JSON.parse(match[0]));
  } catch (err) {
    console.error('JD questions error:', err);
    res.status(500).json({ error: 'Generation failed' });
  }
});

export default router;
