import express from 'express';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const DSA_QUESTIONS = [
  { id: 'dq1', title: 'Two Sum', difficulty: 'easy', topic: 'arrays', leetcodeSlug: 'two-sum' },
  { id: 'dq2', title: 'Longest Substring Without Repeating Characters', difficulty: 'medium', topic: 'sliding-window', leetcodeSlug: 'longest-substring-without-repeating-characters' },
  { id: 'dq3', title: 'Merge Intervals', difficulty: 'medium', topic: 'arrays', leetcodeSlug: 'merge-intervals' },
  { id: 'dq4', title: 'Binary Search', difficulty: 'easy', topic: 'binary-search', leetcodeSlug: 'binary-search' },
  { id: 'dq5', title: 'Number of Islands', difficulty: 'medium', topic: 'graphs', leetcodeSlug: 'number-of-islands' },
  { id: 'dq6', title: 'Climbing Stairs', difficulty: 'easy', topic: 'dynamic-programming', leetcodeSlug: 'climbing-stairs' },
  { id: 'dq7', title: 'Valid Parentheses', difficulty: 'easy', topic: 'stack', leetcodeSlug: 'valid-parentheses' },
  { id: 'dq8', title: 'LRU Cache', difficulty: 'medium', topic: 'design', leetcodeSlug: 'lru-cache' },
  { id: 'dq9', title: 'Word Break', difficulty: 'medium', topic: 'dynamic-programming', leetcodeSlug: 'word-break' },
  { id: 'dq10', title: 'Course Schedule', difficulty: 'medium', topic: 'graphs', leetcodeSlug: 'course-schedule' },
  { id: 'dq11', title: 'Coin Change', difficulty: 'medium', topic: 'dynamic-programming', leetcodeSlug: 'coin-change' },
  { id: 'dq12', title: 'Trapping Rain Water', difficulty: 'hard', topic: 'two-pointers', leetcodeSlug: 'trapping-rain-water' },
  { id: 'dq13', title: 'Serialize and Deserialize Binary Tree', difficulty: 'hard', topic: 'trees', leetcodeSlug: 'serialize-and-deserialize-binary-tree' },
  { id: 'dq14', title: 'Find Median from Data Stream', difficulty: 'hard', topic: 'heaps', leetcodeSlug: 'find-median-from-data-stream' },
];

const BEHAVIORAL_QUESTIONS = [
  { id: 'bq1', question: 'Tell me about a time you had to meet a tight deadline. How did you manage it?', category: 'time-management' },
  { id: 'bq2', question: 'Describe a situation where you disagreed with your manager. What did you do?', category: 'conflict' },
  { id: 'bq3', question: 'Tell me about a project you are most proud of and why.', category: 'achievement' },
  { id: 'bq4', question: 'Describe a time you failed. What did you learn from it?', category: 'failure' },
  { id: 'bq5', question: 'Tell me about a time you had to learn something new quickly.', category: 'learning' },
  { id: 'bq6', question: 'Describe a situation where you had to work with a difficult team member.', category: 'teamwork' },
  { id: 'bq7', question: 'Tell me about a time you took initiative without being asked.', category: 'leadership' },
  { id: 'bq8', question: 'Describe a time you had to make a decision with incomplete information.', category: 'decision-making' },
  { id: 'bq9', question: 'Tell me about a time you received critical feedback. How did you respond?', category: 'feedback' },
  { id: 'bq10', question: 'Describe a situation where you had to prioritize multiple competing tasks.', category: 'prioritization' },
];

// GET /api/daily-question — returns today's personalized DSA + behavioral question
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    // Check if already served today
    const { data: existing } = await supabaseAdmin
      .from('daily_questions')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    if (existing) {
      return res.json(existing.questions);
    }

    // Get user's weak areas from recent interview sessions
    const { data: recentInterviews } = await supabaseAdmin
      .from('interview_sessions')
      .select('areas_for_improvement, interview_type')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(5);

    // Determine weak DSA topic
    const weakTopics = new Set();
    for (const iv of recentInterviews || []) {
      for (const area of iv.areas_for_improvement || []) {
        const lower = area.toLowerCase();
        if (lower.includes('dynamic')) weakTopics.add('dynamic-programming');
        if (lower.includes('graph')) weakTopics.add('graphs');
        if (lower.includes('tree')) weakTopics.add('trees');
        if (lower.includes('array')) weakTopics.add('arrays');
        if (lower.includes('stack')) weakTopics.add('stack');
      }
    }

    // Pick DSA question — prefer weak topic, else use day-of-year rotation
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    let dsaPool = weakTopics.size > 0
      ? DSA_QUESTIONS.filter(q => weakTopics.has(q.topic))
      : DSA_QUESTIONS;
    if (dsaPool.length === 0) dsaPool = DSA_QUESTIONS;
    const dsaQuestion = dsaPool[dayOfYear % dsaPool.length];

    // Pick behavioral question — rotate by day
    const behavioralQuestion = BEHAVIORAL_QUESTIONS[dayOfYear % BEHAVIORAL_QUESTIONS.length];

    const questions = {
      date: today,
      dsa: dsaQuestion,
      behavioral: behavioralQuestion,
      personalizedFor: weakTopics.size > 0 ? Array.from(weakTopics) : null,
    };

    // Save for today
    await supabaseAdmin.from('daily_questions').upsert({
      user_id: userId,
      date: today,
      questions,
    }, { onConflict: 'user_id, date' });

    res.json(questions);
  } catch (err) {
    console.error('Daily question error:', err);
    // Fallback — don't fail the request
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    res.json({
      date: new Date().toISOString().split('T')[0],
      dsa: DSA_QUESTIONS[dayOfYear % DSA_QUESTIONS.length],
      behavioral: BEHAVIORAL_QUESTIONS[dayOfYear % BEHAVIORAL_QUESTIONS.length],
      personalizedFor: null,
    });
  }
});

// POST /api/daily-question/complete — mark today's question as done
router.post('/complete', authenticateToken, async (req, res) => {
  try {
    const { type } = req.body; // 'dsa' | 'behavioral'
    const today = new Date().toISOString().split('T')[0];

    await supabaseAdmin.from('daily_questions').upsert({
      user_id: req.user.id,
      date: today,
      [`${type}_completed`]: true,
    }, { onConflict: 'user_id, date' });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark complete' });
  }
});

export default router;
