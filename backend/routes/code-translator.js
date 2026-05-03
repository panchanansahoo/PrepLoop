import express from 'express';
import Groq from 'groq-sdk';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

const SUPPORTED_LANGUAGES = ['javascript', 'python', 'java', 'cpp', 'typescript', 'go', 'rust', 'kotlin'];

router.get('/languages', authenticateToken, (req, res) => {
  res.json({ languages: SUPPORTED_LANGUAGES });
});

// POST /api/code-translator/translate
router.post('/translate', authenticateToken, async (req, res) => {
  try {
    const { code, fromLang, toLang } = req.body;
    if (!code || !fromLang || !toLang) return res.status(400).json({ error: 'code, fromLang, toLang required' });
    if (fromLang === toLang) return res.status(400).json({ error: 'Source and target languages must differ' });
    if (!groq) return res.status(503).json({ error: 'AI not configured' });

    const completion = await groq.chat.completions.create({
      model: 'llama3-8b-8192',
      temperature: 0.2,
      max_tokens: 1500,
      messages: [
        {
          role: 'system',
          content: `You are an expert polyglot programmer. Translate code from ${fromLang} to ${toLang}.
Return ONLY valid JSON:
{
  "translatedCode": "the full translated code",
  "notes": ["note about language-specific differences", "any idiom changes made"],
  "warnings": ["any potential issues or limitations in the translation"]
}
Preserve the exact logic. Use idiomatic ${toLang} patterns. Do not add explanatory comments inside the code.`,
        },
        { role: 'user', content: `Translate this ${fromLang} code to ${toLang}:\n\n${code.slice(0, 3000)}` },
      ],
    });

    const raw = completion.choices[0]?.message?.content || '{}';
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return res.status(500).json({ error: 'Failed to parse response' });

    res.json(JSON.parse(match[0]));
  } catch (err) {
    console.error('Code translator error:', err);
    res.status(500).json({ error: 'Translation failed' });
  }
});

export default router;
