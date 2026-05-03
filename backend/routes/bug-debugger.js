import express from 'express';
import Groq from 'groq-sdk';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

// POST /api/bug-debugger/debug
router.post('/debug', authenticateToken, async (req, res) => {
  try {
    const { code, errorMessage, language = 'javascript' } = req.body;
    if (!code || code.trim().length < 5) return res.status(400).json({ error: 'Code required' });
    if (!groq) return res.status(503).json({ error: 'AI not configured' });

    const completion = await groq.chat.completions.create({
      model: 'llama3-8b-8192',
      temperature: 0.3,
      max_tokens: 900,
      messages: [
        {
          role: 'system',
          content: `You are a patient debugging mentor. Explain bugs in plain English like you're talking to a student.
Return ONLY valid JSON:
{
  "bugSummary": "one sentence plain English description of the bug",
  "rootCause": "why this bug happens (2-3 sentences)",
  "fixedCode": "the corrected code",
  "explanation": "step-by-step explanation of what changed and why",
  "lesson": "the key concept or mistake pattern to remember",
  "similarBugs": ["another common bug of the same type", "another example"]
}`,
        },
        {
          role: 'user',
          content: `Language: ${language}\n\nCode:\n${code.slice(0, 2500)}\n\nError: ${errorMessage || 'No error message provided — find the logical bug'}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content || '{}';
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return res.status(500).json({ error: 'Failed to parse response' });

    res.json(JSON.parse(match[0]));
  } catch (err) {
    console.error('Bug debugger error:', err);
    res.status(500).json({ error: 'Debug failed' });
  }
});

export default router;
