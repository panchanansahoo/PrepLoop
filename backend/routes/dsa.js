import express from 'express';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

const slugifyProblemTitle = (value = '') =>
  value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const resolveProblemId = async (problemIdentifier) => {
  if (!problemIdentifier) return null;

  const rawIdentifier = String(problemIdentifier).trim();
  if (!rawIdentifier) return null;

  if (/^\d+$/.test(rawIdentifier)) {
    const numericId = Number(rawIdentifier);
    const { data: byId } = await supabaseAdmin
      .from('problems')
      .select('id')
      .eq('id', numericId)
      .single();

    if (byId?.id) return byId.id;
  }

  const normalizedIdentifier = slugifyProblemTitle(rawIdentifier);
  const titleFromSlug = rawIdentifier.replace(/[-_]+/g, ' ').trim().toLowerCase();

  const { data: candidates } = await supabaseAdmin
    .from('problems')
    .select('id, title')
    .limit(1500);

  if (!Array.isArray(candidates) || candidates.length === 0) return null;

  const matched =
    candidates.find((problem) => slugifyProblemTitle(problem.title) === normalizedIdentifier) ||
    candidates.find((problem) => problem.title?.toLowerCase() === rawIdentifier.toLowerCase()) ||
    candidates.find((problem) => problem.title?.toLowerCase() === titleFromSlug) ||
    null;

  return matched?.id || null;
};

router.get('/patterns', optionalAuth, async (req, res) => {
  try {
    // Get patterns with problem counts
    const { data: patterns, error } = await supabaseAdmin
      .from('patterns')
      .select('*, problems(count)')
      .order('id');

    if (error) throw error;

    // Transform to match expected format
    const transformed = (patterns || []).map(p => ({
      ...p,
      problem_count: p.problems?.[0]?.count || 0,
      problems: undefined
    }));

    res.json({ patterns: transformed });
  } catch (error) {
    console.error('Error fetching patterns:', error);
    res.status(500).json({ error: 'Failed to fetch patterns' });
  }
});

router.get('/patterns/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: pattern, error: patternError } = await supabaseAdmin
      .from('patterns')
      .select('*')
      .eq('id', id)
      .single();

    if (patternError || !pattern) {
      return res.status(404).json({ error: 'Pattern not found' });
    }

    // Get problems for this pattern
    const { data: problems, error: problemsError } = await supabaseAdmin
      .from('problems')
      .select('*')
      .eq('pattern_id', id)
      .order('difficulty')
      .order('id');

    if (problemsError) throw problemsError;

    // If user is authenticated, get their progress
    let problemsWithStatus = problems || [];
    if (req.user) {
      const { data: progress } = await supabaseAdmin
        .from('user_progress')
        .select('problem_id, status')
        .eq('user_id', req.user.id);

      const progressMap = {};
      (progress || []).forEach(p => { progressMap[p.problem_id] = p.status; });

      problemsWithStatus = problemsWithStatus.map(p => ({
        ...p,
        user_status: progressMap[p.id] || 'not_started'
      }));
    }

    res.json({
      pattern,
      problems: problemsWithStatus
    });
  } catch (error) {
    console.error('Error fetching pattern:', error);
    res.status(500).json({ error: 'Failed to fetch pattern' });
  }
});

router.get('/problems/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const canonicalProblemId = await resolveProblemId(id);

    if (!canonicalProblemId) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    const { data: problem, error } = await supabaseAdmin
      .from('problems')
      .select('*, patterns(name, category)')
      .eq('id', canonicalProblemId)
      .single();

    if (error || !problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    // Flatten pattern data
    const transformed = {
      ...problem,
      pattern_name: problem.patterns?.name,
      pattern_category: problem.patterns?.category,
      patterns: undefined
    };

    let userProgress = null;
    if (req.user) {
      const { data: progress } = await supabaseAdmin
        .from('user_progress')
        .select('*')
        .eq('user_id', req.user.id)
        .eq('problem_id', canonicalProblemId)
        .single();
      userProgress = progress || null;
    }

    res.json({
      problem: transformed,
      exploration: {
        exploreQuestions: problem.explore_questions || [],
        extendedTestCases: problem.extended_test_cases || [],
        metadata: problem.exploration_metadata || {}
      },
      userProgress
    });
  } catch (error) {
    console.error('Error fetching problem:', error);
    res.status(500).json({ error: 'Failed to fetch problem' });
  }
});

router.get('/problems/:id/explore', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const canonicalProblemId = await resolveProblemId(id);

    if (!canonicalProblemId) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    const { data: problem, error } = await supabaseAdmin
      .from('problems')
      .select('id, title, difficulty, explore_questions, extended_test_cases, exploration_metadata')
      .eq('id', canonicalProblemId)
      .single();

    if (error || !problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    res.json({
      problemId: problem.id,
      title: problem.title,
      difficulty: problem.difficulty,
      exploreQuestions: problem.explore_questions || [],
      extendedTestCases: problem.extended_test_cases || [],
      metadata: problem.exploration_metadata || {},
      statistics: {
        questionsCount: (problem.explore_questions || []).length,
        testCasesCount: (problem.extended_test_cases || []).length
      }
    });
  } catch (error) {
    console.error('Error fetching explore questions:', error);
    res.status(500).json({ error: 'Failed to fetch explore questions' });
  }
});

router.get('/problems/:id/solution', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const canonicalProblemId = await resolveProblemId(id);

    if (!canonicalProblemId) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    const { data: problem, error } = await supabaseAdmin
      .from('problems')
      .select('solution_code')
      .eq('id', canonicalProblemId)
      .single();

    if (error || !problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    res.json({ solution: problem.solution_code });
  } catch (error) {
    console.error('Error fetching solution:', error);
    res.status(500).json({ error: 'Failed to fetch solution' });
  }
});

router.get('/progress', authenticateToken, async (req, res) => {
  try {
    // Get user progress with problem details
    const { data: progressData, error } = await supabaseAdmin
      .from('user_progress')
      .select('*, problems(title, difficulty)')
      .eq('user_id', req.user.id);

    if (error) throw error;

    const items = progressData || [];
    const solved = items.filter(i => i.status === 'solved');

    const stats = {
      total_solved: solved.length,
      problems_solved: solved.length,
      easy_solved: solved.filter(i => i.problems?.difficulty === 'Easy').length,
      medium_solved: solved.filter(i => i.problems?.difficulty === 'Medium').length,
      hard_solved: solved.filter(i => i.problems?.difficulty === 'Hard').length
    };

    // Recent activity (last 10)
    const recentActivity = items
      .sort((a, b) => new Date(b.last_attempt) - new Date(a.last_attempt))
      .slice(0, 10)
      .map(i => ({
        title: i.problems?.title,
        difficulty: i.problems?.difficulty,
        status: i.status,
        last_attempt: i.last_attempt
      }));

    res.json({ stats, recentActivity });
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

export default router;
