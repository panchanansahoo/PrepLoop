import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { supabaseAdmin } from '../db/supabaseClient.js';
import srs from '../services/spacedRepetitionService.js';

const router = express.Router();

const DEFAULT_CARDS = [
  { id: 'fc1', front: 'What is the time complexity of binary search?', back: 'O(log n) — halves the search space each step.', topic: 'complexity', difficulty: 'easy' },
  { id: 'fc2', front: 'Explain the sliding window technique.', back: 'Maintain a window of elements and slide it across the array to avoid recomputation. Used for subarray/substring problems.', topic: 'patterns', difficulty: 'medium' },
  { id: 'fc3', front: 'What is a min-heap used for?', back: 'Efficiently retrieve the minimum element in O(1), insert/delete in O(log n). Used in Dijkstra, K smallest elements.', topic: 'data-structures', difficulty: 'medium' },
  { id: 'fc4', front: 'What is memoization?', back: 'Caching results of expensive function calls so repeated calls with same inputs return cached results. Top-down DP approach.', topic: 'dynamic-programming', difficulty: 'easy' },
  { id: 'fc5', front: 'Difference between BFS and DFS?', back: 'BFS uses a queue, explores level by level — good for shortest path. DFS uses a stack/recursion, explores depth first — good for cycle detection, topological sort.', topic: 'graphs', difficulty: 'easy' },
  { id: 'fc6', front: 'What is a monotonic stack?', back: 'A stack that maintains elements in increasing or decreasing order. Used for next greater/smaller element problems in O(n).', topic: 'patterns', difficulty: 'medium' },
  { id: 'fc7', front: 'Explain two-pointer technique.', back: 'Use two indices moving toward each other or in the same direction to solve array/string problems in O(n) instead of O(n²).', topic: 'patterns', difficulty: 'easy' },
  { id: 'fc8', front: 'What is a trie and when to use it?', back: 'A tree where each node represents a character. Used for prefix search, autocomplete, and word dictionary problems in O(L) time.', topic: 'data-structures', difficulty: 'medium' },
  { id: 'fc9', front: 'What is topological sort?', back: 'Linear ordering of vertices in a DAG such that for every edge u→v, u comes before v. Used for task scheduling, course prerequisites.', topic: 'graphs', difficulty: 'medium' },
  { id: 'fc10', front: 'Explain union-find (disjoint set).', back: 'Data structure to track connected components. find() gets root, union() merges sets. With path compression + union by rank: near O(1) per op.', topic: 'data-structures', difficulty: 'hard' },
  { id: 'fc11', front: 'What is the difference between process and thread?', back: 'Process: independent program with own memory. Thread: lightweight unit within a process sharing memory. Threads are faster to create but need synchronization.', topic: 'system-design', difficulty: 'medium' },
  { id: 'fc12', front: 'What is consistent hashing?', back: 'A technique to distribute data across nodes so that adding/removing a node only remaps a fraction of keys. Used in distributed caches and load balancers.', topic: 'system-design', difficulty: 'hard' },
];

// GET /api/flashcards — get due cards with SRS state
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { data: progress } = await supabaseAdmin
      .from('flashcard_progress')
      .select('*')
      .eq('user_id', req.user.id);

    const progressMap = Object.fromEntries((progress || []).map(p => [p.card_id, p]));

    const cards = DEFAULT_CARDS.map(card => ({
      ...card,
      ...(progressMap[card.id] ? {
        easinessFactor: progressMap[card.id].easiness_factor,
        repetitions: progressMap[card.id].repetitions,
        interval: progressMap[card.id].interval,
        nextReview: progressMap[card.id].next_review,
        lastReview: progressMap[card.id].last_review,
      } : {}),
    }));

    const due = srs.getDueProblems(cards);
    const stats = srs.getStatistics(cards);

    res.json({ due, all: cards, stats });
  } catch (err) {
    console.error('Flashcards error:', err);
    res.status(500).json({ error: 'Failed to load flashcards' });
  }
});

// POST /api/flashcards/review — submit a review rating (0-5)
router.post('/review', authenticateToken, async (req, res) => {
  try {
    const { cardId, quality } = req.body;
    if (!cardId || quality === undefined) return res.status(400).json({ error: 'cardId and quality required' });

    const { data: existing } = await supabaseAdmin
      .from('flashcard_progress')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('card_id', cardId)
      .single();

    const card = existing ? {
      easinessFactor: existing.easiness_factor,
      repetitions: existing.repetitions,
      interval: existing.interval,
      nextReview: existing.next_review,
    } : {};

    const updated = srs.calculateNextReview(card, quality);

    await supabaseAdmin.from('flashcard_progress').upsert({
      user_id: req.user.id,
      card_id: cardId,
      easiness_factor: updated.easinessFactor,
      repetitions: updated.repetitions,
      interval: updated.interval,
      next_review: updated.nextReview,
      last_review: updated.lastReview,
    }, { onConflict: 'user_id,card_id' });

    res.json({ success: true, nextReview: updated.nextReview, interval: updated.interval });
  } catch (err) {
    console.error('Flashcard review error:', err);
    res.status(500).json({ error: 'Failed to save review' });
  }
});

export default router;
