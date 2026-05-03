import express from 'express';
import Groq from 'groq-sdk';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

const POPULAR_TOPICS = [
  'Binary Search', 'Dynamic Programming', 'Graph BFS/DFS', 'Hash Maps',
  'CAP Theorem', 'Consistent Hashing', 'Load Balancing', 'Database Indexing',
  'TCP vs UDP', 'REST vs GraphQL', 'Microservices', 'Docker & Kubernetes',
  'Big O Notation', 'Recursion', 'Tries', 'Segment Trees',
];

router.get('/topics', authenticateToken, (req, res) => {
  res.json({ topics: POPULAR_TOPICS });
});

// POST /api/concept-explainer/explain
router.post('/explain', authenticateToken, async (req, res) => {
  try {
    const { topic, level = 'intermediate' } = req.body;
    if (!topic || topic.trim().length < 2) return res.status(400).json({ error: 'Topic required' });
    if (!groq) return res.status(503).json({ error: 'AI not configured' });

    const levelInstructions = {
      eli5: 'Explain like the person is 10 years old. Use simple analogies, no jargon.',
      intermediate: 'Explain for a CS student who knows basics. Use correct terminology but keep it clear.',
      senior: 'Explain for a senior engineer. Include edge cases, trade-offs, and real-world usage.',
    };

    const completion = await groq.chat.completions.create({
      model: 'llama3-8b-8192',
      temperature: 0.4,
      max_tokens: 800,
      messages: [
        {
          role: 'system',
          content: `You are an expert CS educator. ${levelInstructions[level] || levelInstructions.intermediate}
Return ONLY valid JSON:
{
  "topic": "exact topic name",
  "summary": "1-2 sentence TL;DR",
  "explanation": "main explanation (3-5 paragraphs)",
  "analogy": "a real-world analogy",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "commonMistakes": ["mistake 1", "mistake 2"],
  "interviewTip": "one sentence tip for interviews"
}`,
        },
        { role: 'user', content: `Explain: ${topic.trim()}` },
      ],
    });

    const raw = completion.choices[0]?.message?.content || '{}';
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return res.status(500).json({ error: 'Failed to parse response' });

    res.json({ ...JSON.parse(match[0]), level });
  } catch (err) {
    console.error('Concept explainer error:', err);
    res.status(500).json({ error: 'Explanation failed' });
  }
});

export default router;
