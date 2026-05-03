import express from 'express';
import Groq from 'groq-sdk';
import { authenticateToken } from '../middleware/auth.js';
import { supabaseAdmin } from '../db/supabaseClient.js';

const router = express.Router();
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

const DSA_PATTERNS = [
  'Two Pointers', 'Sliding Window', 'Fast & Slow Pointers', 'Merge Intervals',
  'Cyclic Sort', 'In-place Reversal of LinkedList', 'Tree BFS', 'Tree DFS',
  'Two Heaps', 'Subsets', 'Modified Binary Search', 'Bitwise XOR',
  'Top K Elements', 'K-way Merge', 'Dynamic Programming', 'Topological Sort',
  'Backtracking', 'Greedy', 'Divide and Conquer', 'Union Find',
];

const PROBLEMS = [
  { id: 'p1', statement: 'Given an array of integers, find two numbers that add up to a target sum.', answer: 'Two Pointers', hint: 'Sort the array first, then use two indices moving toward each other.' },
  { id: 'p2', statement: 'Find the maximum sum of any contiguous subarray of size K.', answer: 'Sliding Window', hint: 'Maintain a window of size K and slide it across the array.' },
  { id: 'p3', statement: 'Given a linked list, determine if it has a cycle.', answer: 'Fast & Slow Pointers', hint: 'Use two pointers moving at different speeds — they will meet if there is a cycle.' },
  { id: 'p4', statement: 'Given a list of intervals, merge all overlapping intervals.', answer: 'Merge Intervals', hint: 'Sort by start time, then compare each interval with the last merged one.' },
  { id: 'p5', statement: 'Find the K largest elements in an unsorted array.', answer: 'Top K Elements', hint: 'Use a min-heap of size K — replace the minimum when a larger element is found.' },
  { id: 'p6', statement: 'Given a binary tree, find the level-order traversal.', answer: 'Tree BFS', hint: 'Use a queue to process nodes level by level.' },
  { id: 'p7', statement: 'Find all subsets of a given set of distinct integers.', answer: 'Subsets', hint: 'Start with an empty set and add each number to all existing subsets.' },
  { id: 'p8', statement: 'Given a sorted array, find the position of a target value.', answer: 'Modified Binary Search', hint: 'Divide the search space in half each iteration.' },
  { id: 'p9', statement: 'Given a list of tasks with prerequisites, find a valid order to complete them.', answer: 'Topological Sort', hint: 'Build a graph and use in-degree counting with a queue.' },
  { id: 'p10', statement: 'Find all permutations of a string.', answer: 'Backtracking', hint: 'At each step, choose a character, recurse, then undo the choice.' },
  { id: 'p11', statement: 'Given a set of coin denominations, find the minimum coins to make a target amount.', answer: 'Dynamic Programming', hint: 'Build up solutions for smaller amounts and reuse them.' },
  { id: 'p12', statement: 'Find the number of connected components in an undirected graph.', answer: 'Union Find', hint: 'Use union-find to group connected nodes together.' },
];

router.get('/problem', authenticateToken, (req, res) => {
  const idx = Math.floor(Math.random() * PROBLEMS.length);
  const { answer, hint, ...safe } = PROBLEMS[idx];
  res.json({ ...safe, patterns: DSA_PATTERNS });
});

// POST /api/pattern-trainer/submit
router.post('/submit', authenticateToken, async (req, res) => {
  try {
    const { problemId, guessedPattern } = req.body;
    if (!problemId || !guessedPattern) return res.status(400).json({ error: 'problemId and guessedPattern required' });

    const problem = PROBLEMS.find(p => p.id === problemId);
    if (!problem) return res.status(404).json({ error: 'Problem not found' });

    const isCorrect = problem.answer.toLowerCase() === guessedPattern.toLowerCase();

    let aiExplanation = null;
    if (groq) {
      try {
        const completion = await groq.chat.completions.create({
          model: 'llama3-8b-8192',
          temperature: 0.3,
          max_tokens: 400,
          messages: [
            {
              role: 'system',
              content: 'You are a DSA coach. Explain in 2-3 sentences why a specific pattern applies to a problem. Be concise and educational.',
            },
            {
              role: 'user',
              content: `Problem: "${problem.statement}"\nCorrect pattern: ${problem.answer}\nStudent guessed: ${guessedPattern}\nExplain why ${problem.answer} is the right pattern and ${isCorrect ? 'confirm the student was right' : 'why the student was wrong'}.`,
            },
          ],
        });
        aiExplanation = completion.choices[0]?.message?.content?.trim();
      } catch { /* fallback to hint */ }
    }

    // Save attempt (non-blocking)
    supabaseAdmin.from('pattern_trainer_attempts').insert({
      user_id: req.user.id,
      problem_id: problemId,
      guessed_pattern: guessedPattern,
      correct_pattern: problem.answer,
      is_correct: isCorrect,
    }).then(() => {}).catch(() => {});

    res.json({
      isCorrect,
      correctPattern: problem.answer,
      hint: problem.hint,
      explanation: aiExplanation || problem.hint,
    });
  } catch (err) {
    console.error('Pattern trainer error:', err);
    res.status(500).json({ error: 'Submission failed' });
  }
});

// GET /api/pattern-trainer/stats
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { data } = await supabaseAdmin
      .from('pattern_trainer_attempts')
      .select('correct_pattern, is_correct')
      .eq('user_id', req.user.id);

    const total = data?.length || 0;
    const correct = data?.filter(d => d.is_correct).length || 0;
    const byPattern = (data || []).reduce((acc, d) => {
      if (!acc[d.correct_pattern]) acc[d.correct_pattern] = { total: 0, correct: 0 };
      acc[d.correct_pattern].total++;
      if (d.is_correct) acc[d.correct_pattern].correct++;
      return acc;
    }, {});

    res.json({ total, correct, accuracy: total ? Math.round((correct / total) * 100) : 0, byPattern });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
