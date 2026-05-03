import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { supabaseAdmin } from '../db/supabaseClient.js';

const router = express.Router();

const TIMER_CONFIGS = {
  dsa: { seconds: 2700, label: '45 min', description: 'Solve a DSA problem end-to-end' },
  behavioral: { seconds: 120, label: '2 min', description: 'Answer using STAR method' },
  'system-design': { seconds: 2700, label: '45 min', description: 'Design a scalable system' },
  'concept-explain': { seconds: 90, label: '90 sec', description: 'Explain a concept clearly' },
  hr: { seconds: 60, label: '60 sec', description: 'Answer the HR question concisely' },
};

const QUESTIONS = {
  dsa: [
    'Given an array of integers, find the length of the longest subarray with sum equal to K.',
    'Implement a LRU Cache with O(1) get and put operations.',
    'Find all unique paths from top-left to bottom-right of an m×n grid.',
    'Given a binary tree, find the maximum path sum.',
    'Design a data structure that supports insert, delete, and getRandom in O(1).',
  ],
  behavioral: [
    'Tell me about a time you had to meet a tight deadline.',
    'Describe a situation where you disagreed with your team lead.',
    'Tell me about your most challenging project and how you handled it.',
    'Describe a time you had to learn something new very quickly.',
    'Tell me about a time you made a mistake and how you fixed it.',
  ],
  'system-design': [
    'Design a URL shortener like bit.ly.',
    'Design a notification system for a social media platform.',
    'Design a rate limiter for an API gateway.',
    'Design a distributed cache like Redis.',
    'Design a real-time leaderboard for a gaming platform.',
  ],
  'concept-explain': [
    'Explain how a hash map works internally.',
    'What is the difference between a process and a thread?',
    'Explain eventual consistency in distributed systems.',
    'What is a deadlock and how do you prevent it?',
    'Explain how garbage collection works in Java/Python.',
  ],
  hr: [
    'Why do you want to work at this company?',
    'Where do you see yourself in 5 years?',
    'What is your greatest weakness?',
    'Why are you leaving your current job?',
    'What motivates you?',
  ],
};

// GET /api/answer-timer/question?type=dsa
router.get('/question', authenticateToken, (req, res) => {
  const type = req.query.type || 'dsa';
  const pool = QUESTIONS[type] || QUESTIONS.dsa;
  const config = TIMER_CONFIGS[type] || TIMER_CONFIGS.dsa;
  const question = pool[Math.floor(Math.random() * pool.length)];
  res.json({ question, type, ...config, types: Object.keys(TIMER_CONFIGS) });
});

// POST /api/answer-timer/complete — save attempt
router.post('/complete', authenticateToken, async (req, res) => {
  try {
    const { type, question, timeTaken, completed } = req.body;
    await supabaseAdmin.from('timer_attempts').insert({
      user_id: req.user.id,
      question_type: type,
      question,
      time_taken_seconds: timeTaken,
      completed_in_time: completed,
    }).then(() => {}).catch(() => {});
    res.json({ success: true });
  } catch {
    res.json({ success: true }); // non-critical
  }
});

// GET /api/answer-timer/stats
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { data } = await supabaseAdmin
      .from('timer_attempts')
      .select('question_type, completed_in_time, time_taken_seconds')
      .eq('user_id', req.user.id);

    const total = data?.length || 0;
    const completed = data?.filter(d => d.completed_in_time).length || 0;
    res.json({ total, completed, rate: total ? Math.round((completed / total) * 100) : 0 });
  } catch {
    res.json({ total: 0, completed: 0, rate: 0 });
  }
});

export default router;
