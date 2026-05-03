import express from 'express';
import Groq from 'groq-sdk';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

const DIAGNOSTIC_QUESTIONS = {
  sde: [
    { id: 'q1', text: 'Can you solve medium LeetCode problems (arrays, trees, graphs) within 30 minutes?' },
    { id: 'q2', text: 'Can you design a URL shortener or rate limiter from scratch?' },
    { id: 'q3', text: 'Do you have at least one project you can explain end-to-end including trade-offs?' },
    { id: 'q4', text: 'Can you explain the STAR method and give a strong answer to "Tell me about a conflict"?' },
    { id: 'q5', text: 'Do you know the basics of SQL, REST APIs, and at least one cloud service?' },
  ],
  frontend: [
    { id: 'q1', text: 'Can you explain the React rendering lifecycle and when to use useEffect vs useMemo?' },
    { id: 'q2', text: 'Can you implement a debounced search input from scratch?' },
    { id: 'q3', text: 'Do you understand CSS specificity, flexbox, and responsive design?' },
    { id: 'q4', text: 'Can you explain how the browser renders a page (critical rendering path)?' },
    { id: 'q5', text: 'Do you have a portfolio project with measurable performance metrics?' },
  ],
  backend: [
    { id: 'q1', text: 'Can you design a REST API with proper auth, rate limiting, and error handling?' },
    { id: 'q2', text: 'Do you understand database indexing, query optimization, and N+1 problems?' },
    { id: 'q3', text: 'Can you explain the difference between SQL and NoSQL and when to use each?' },
    { id: 'q4', text: 'Do you understand caching strategies (Redis, CDN, browser cache)?' },
    { id: 'q5', text: 'Can you explain how to handle distributed transactions or eventual consistency?' },
  ],
  default: [
    { id: 'q1', text: 'Can you solve medium-level coding problems in your primary language?' },
    { id: 'q2', text: 'Do you have at least 2 projects you can discuss in depth?' },
    { id: 'q3', text: 'Are you comfortable explaining your past experience using the STAR method?' },
    { id: 'q4', text: 'Do you understand the core concepts of the role you are applying for?' },
    { id: 'q5', text: 'Have you researched the target company\'s products, culture, and tech stack?' },
  ],
};

// GET /api/readiness/questions?role=sde
router.get('/questions', authenticateToken, (req, res) => {
  const role = (req.query.role || 'default').toLowerCase();
  const questions = DIAGNOSTIC_QUESTIONS[role] || DIAGNOSTIC_QUESTIONS.default;
  res.json({ questions, role });
});

// POST /api/readiness/evaluate
router.post('/evaluate', authenticateToken, async (req, res) => {
  try {
    const { role = 'sde', targetCompany = '', answers } = req.body;
    // answers: [{ id, text, selfRating: 1-5 }]
    if (!answers || answers.length < 3) return res.status(400).json({ error: 'At least 3 answers required' });

    const avgRating = answers.reduce((s, a) => s + (a.selfRating || 3), 0) / answers.length;
    const readinessScore = Math.round((avgRating / 5) * 100);

    if (!groq) {
      return res.json({
        readinessScore,
        verdict: readinessScore >= 70 ? 'Ready' : readinessScore >= 45 ? 'Almost Ready' : 'Needs Work',
        gaps: ['Add GROQ_API_KEY for personalized gap analysis'],
        strengths: [],
        weekPlan: [],
        source: 'heuristic',
      });
    }

    const answersText = answers.map((a, i) => `Q${i + 1}: ${a.text}\nSelf-rating: ${a.selfRating}/5\nAnswer: ${a.answer || '(skipped)'}`).join('\n\n');

    const completion = await groq.chat.completions.create({
      model: 'llama3-8b-8192',
      temperature: 0.4,
      max_tokens: 800,
      messages: [
        {
          role: 'system',
          content: `You are a senior tech recruiter. Evaluate a candidate's interview readiness based on their self-assessment answers. Return ONLY valid JSON:
{
  "readinessScore": 0-100,
  "verdict": "Ready|Almost Ready|Needs Work",
  "strengths": ["strength 1", "strength 2"],
  "gaps": ["specific gap 1", "specific gap 2", "specific gap 3"],
  "weekPlan": ["Day 1-2: ...", "Day 3-4: ...", "Day 5-7: ..."],
  "estimatedWeeksToReady": 0-12
}`,
        },
        {
          role: 'user',
          content: `Role: ${role}\nTarget Company: ${targetCompany || 'Not specified'}\n\n${answersText}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content || '{}';
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return res.status(500).json({ error: 'Failed to parse AI response' });

    res.json({ ...JSON.parse(match[0]), source: 'ai' });
  } catch (err) {
    console.error('Readiness check error:', err);
    res.status(500).json({ error: 'Evaluation failed' });
  }
});

export default router;
