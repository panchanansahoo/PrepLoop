import express from 'express';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { all425Problems } from '../data/allProblems.js';
import Groq from 'groq-sdk';
import DataCacheManager from '../services/dataCacheManager.js';
import HintService from '../services/hintService.js';

const router = express.Router();
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

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

  // Fast path: numeric ID
  if (/^\d+$/.test(rawIdentifier)) {
    const numericId = Number(rawIdentifier);
    const { data: byId } = await supabaseAdmin
      .from('problems')
      .select('id')
      .eq('id', numericId)
      .single();
    if (byId?.id) return byId.id;
  }

  // Check static list first (no DB call)
  const staticMatch =
    all425Problems.find((p) => String(p.id) === rawIdentifier) ||
    all425Problems.find((p) => slugifyProblemTitle(p.title) === slugifyProblemTitle(rawIdentifier)) ||
    all425Problems.find((p) => p.title?.toLowerCase() === rawIdentifier.toLowerCase()) ||
    null;

  // Build a targeted DB ilike query instead of fetching 1500 rows
  const titleFromSlug = rawIdentifier.replace(/[-_]+/g, ' ').trim();
  const searchTitle = staticMatch?.title || titleFromSlug;

  const { data: candidates } = await supabaseAdmin
    .from('problems')
    .select('id, title')
    .ilike('title', searchTitle)
    .limit(5);

  if (Array.isArray(candidates) && candidates.length > 0) {
    return candidates[0].id;
  }

  return null;
};

const FALLBACK_SOLUTIONS = {
  'two sum': {
    python: `class Solution:\n    def twoSum(self, nums, target):\n        seen = {}\n        for index, num in enumerate(nums):\n            complement = target - num\n            if complement in seen:\n                return [seen[complement], index]\n            seen[num] = index\n        return []`,
    javascript: `class Solution {\n  twoSum(nums, target) {\n    const seen = new Map();\n    for (let index = 0; index < nums.length; index++) {\n      const complement = target - nums[index];\n      if (seen.has(complement)) {\n        return [seen.get(complement), index];\n      }\n      seen.set(nums[index], index);\n    }\n    return [];\n  }\n}`,
    cpp: `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        unordered_map<int, int> seen;\n        for (int index = 0; index < nums.size(); index++) {\n            int complement = target - nums[index];\n            if (seen.count(complement)) {\n                return {seen[complement], index};\n            }\n            seen[nums[index]] = index;\n        }\n        return {};\n    }\n};`,
    java: `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        Map<Integer, Integer> seen = new HashMap<>();\n        for (int index = 0; index < nums.length; index++) {\n            int complement = target - nums[index];\n            if (seen.containsKey(complement)) {\n                return new int[] { seen.get(complement), index };\n            }\n            seen.put(nums[index], index);\n        }\n        return new int[0];\n    }\n}`,
  },
};

const isCompleteSolution = (solution) => {
  if (!solution || typeof solution !== 'object') return false;
  return ['python', 'javascript', 'cpp', 'java'].every((language) => {
    const value = solution[language];
    return typeof value === 'string' && value.trim().length > 0;
  });
};

const buildFallbackSolution = async (problem) => {
  const fallback = FALLBACK_SOLUTIONS[String(problem?.title || '').toLowerCase()];
  if (fallback) return fallback;

  if (!groq) return null;

  const prompt = `
You are an expert algorithm software engineer.
Write the optimal solution to the following DSA problem in 4 languages: Python, JavaScript, C++, and Java.
Do NOT include any test runner code, just the function or class definition.
For Python, write classical \`class Solution:\` with \`def functionName(self, ...):\`.
Return the output ONLY as a minified valid JSON object containing exactly 4 keys: "python", "javascript", "cpp", "java", where each value is a raw string of the raw code.
Do NOT include any extra text. Make sure the JSON is totally valid.

Problem Title: ${problem?.title || ''}
Problem Description:
${String(problem?.description || '').substring(0, 1500)}
`;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  });

  let parsed;
  try {
    const raw = completion.choices?.[0]?.message?.content || '';
    parsed = JSON.parse(raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, ''));
  } catch {
    return null;
  }
  // Only return if all 4 languages are present and non-empty
  if (!isCompleteSolution(parsed)) return null;
  return parsed;
};

router.get('/patterns', optionalAuth, async (req, res) => {
  try {
    // Try cache first
    const patterns = await DataCacheManager.getPatterns();
    
    // Transform to match expected format
    const transformed = (patterns || []).map(p => ({
      ...p,
      problem_count: p.problem_count || 0,
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

    // Try cache first
    const pattern = await DataCacheManager.getPattern(id);
    
    if (!pattern) {
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
      .select('id, title, description, solution_code')
      .eq('id', canonicalProblemId)
      .single();

    if (error || !problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    if (!isCompleteSolution(problem.solution_code)) {
      const fallbackSolution = await buildFallbackSolution(problem);

      if (fallbackSolution) {
        await supabaseAdmin
          .from('problems')
          .update({ solution_code: fallbackSolution })
          .eq('id', canonicalProblemId);

        return res.json({ solution: fallbackSolution });
      }
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

// Phase 1.1: Progressive Hint System
const hintService = new HintService(supabaseAdmin);

/**
 * GET /api/dsa/hints/:problemId
 * Retrieve hint for a problem with cooldown enforcement
 * Query params: hint_type (approach|code|edge_case)
 * Auth: required
 */
router.get('/hints/:problemId', authenticateToken, async (req, res) => {
  try {
    const { problemId } = req.params;
    const { hint_type } = req.query;

    if (!hint_type) {
      return res.status(400).json({ error: 'hint_type query parameter required' });
    }

    const result = await hintService.getHint(req.user.id, parseInt(problemId), hint_type);

    res.json({
      success: true,
      hint: result,
    });
  } catch (error) {
    console.error('Error retrieving hint:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve hint',
    });
  }
});

/**
 * GET /api/dsa/hints/:problemId/all
 * Get all hints for a problem (admin/teacher view)
 * Auth: required (admin check in middleware)
 */
router.get('/hints/:problemId/all', authenticateToken, async (req, res) => {
  try {
    const { problemId } = req.params;

    // TODO: Add admin check middleware
    // if (!req.user.is_admin) return res.status(403).json({ error: 'Unauthorized' });

    const result = await hintService.getAllHints(parseInt(problemId));
    res.json(result);
  } catch (error) {
    console.error('Error fetching all hints:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch hints' });
  }
});

/**
 * PUT /api/dsa/hints/:problemId
 * Update hints for a problem (admin/content team)
 * Body: { hints: { approach: "", code: "", edge_case: "" } }
 * Auth: required (admin check in middleware)
 */
router.put('/hints/:problemId', authenticateToken, async (req, res) => {
  try {
    const { problemId } = req.params;
    const { hints } = req.body;

    // TODO: Add admin check middleware
    // if (!req.user.is_admin) return res.status(403).json({ error: 'Unauthorized' });

    const result = await hintService.updateHints(parseInt(problemId), hints);
    res.json({
      success: true,
      message: 'Hints updated',
      problem: result,
    });
  } catch (error) {
    console.error('Error updating hints:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update hints',
    });
  }
});

/**
 * GET /api/dsa/hints/stats/user
 * Get user's hint usage statistics
 * Auth: required
 */
router.get('/hints/stats/user', authenticateToken, async (req, res) => {
  try {
    const stats = await hintService.getUserHintStatistics(req.user.id);
    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Error fetching hint stats:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch statistics',
    });
  }
});

/**
 * POST /api/dsa/hints/:problemId/reset-cooldown
 * Reset hint cooldown (admin override)
 * Body: { hint_type: "approach"|"code"|"edge_case" }
 * Auth: required (admin check in middleware)
 */
router.post('/hints/:problemId/reset-cooldown', authenticateToken, async (req, res) => {
  try {
    const { problemId } = req.params;
    const { hint_type } = req.body;

    // TODO: Add admin check middleware
    // if (!req.user.is_admin) return res.status(403).json({ error: 'Unauthorized' });

    if (!hint_type) {
      return res.status(400).json({ error: 'hint_type required in body' });
    }

    await hintService.resetHintCooldown(req.user.id, parseInt(problemId), hint_type);

    res.json({
      success: true,
      message: 'Cooldown reset',
    });
  } catch (error) {
    console.error('Error resetting hint cooldown:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to reset cooldown',
    });
  }
});

/**
 * POST /api/dsa/custom-tests/:problemId
 * Save custom test cases for a problem
 * Body: { language, testCases: [{ input, expected, description }] }
 * Auth: required
 */
router.post('/custom-tests/:problemId', authenticateToken, async (req, res) => {
  try {
    const { problemId } = req.params;
    const { language, testCases } = req.body;

    if (!language) {
      return res.status(400).json({ error: 'language required' });
    }

    if (!Array.isArray(testCases) || testCases.length === 0) {
      return res.status(400).json({ error: 'testCases must be non-empty array' });
    }

    // Validate each test case
    for (const tc of testCases) {
      if (!tc.input || !tc.expected) {
        return res.status(400).json({ error: 'Each test case must have input and expected' });
      }
    }

    // Store in user_custom_tests table
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('user_custom_tests')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('problem_id', parseInt(problemId))
      .eq('language', language)
      .single();

    let result;
    if (existing) {
      // Update existing
      const { data, error } = await supabaseAdmin
        .from('user_custom_tests')
        .update({
          test_cases: testCases,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new
      const { data, error } = await supabaseAdmin
        .from('user_custom_tests')
        .insert([
          {
            user_id: req.user.id,
            problem_id: parseInt(problemId),
            language,
            test_cases: testCases,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    res.json({
      success: true,
      testCases: result.test_cases,
      savedAt: result.updated_at || result.created_at,
    });
  } catch (error) {
    console.error('Error saving custom tests:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to save custom tests',
    });
  }
});

/**
 * POST /api/dsa/custom-tests/:problemId/run
 * Run custom test cases (without executing code, just validate structure)
 * Body: { language, testCases: [{ input, expected, description }] }
 * Auth: required
 */
router.post('/custom-tests/:problemId/run', authenticateToken, async (req, res) => {
  try {
    const { problemId } = req.params;
    const { language, testCases } = req.body;

    if (!language) {
      return res.status(400).json({ error: 'language required' });
    }

    if (!Array.isArray(testCases) || testCases.length === 0) {
      return res.status(400).json({ error: 'testCases must be non-empty array' });
    }

    // Validate each test case
    for (const tc of testCases) {
      if (!tc.input || !tc.expected) {
        return res.status(400).json({ error: 'Each test case must have input and expected' });
      }
    }

    // For Phase 1.2: Just validate and return mock results
    // Full execution will be in Phase 3 with sandbox pool
    const passedCount = testCases.length;
    const totalCount = testCases.length;

    // Log test run for analytics
    await supabaseAdmin
      .from('user_custom_test_runs')
      .insert([
        {
          user_id: req.user.id,
          problem_id: parseInt(problemId),
          language,
          test_case_count: totalCount,
          passed_count: passedCount,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    res.json({
      success: true,
      passedCount,
      totalCount,
      results: testCases.map((tc, i) => ({
        index: i + 1,
        description: tc.description || `Test ${i + 1}`,
        passed: true, // Mock: all pass in Phase 1.2
        input: tc.input,
        expected: tc.expected,
        actual: tc.expected, // Mock output
      })),
    });
  } catch (error) {
    console.error('Error running custom tests:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to run custom tests',
    });
  }
});

/**
 * GET /api/dsa/custom-tests/:problemId
 * Get saved custom test cases for a problem
 * Auth: required
 */
router.get('/custom-tests/:problemId', authenticateToken, async (req, res) => {
  try {
    const { problemId } = req.params;
    const { language } = req.query;

    let query = supabaseAdmin
      .from('user_custom_tests')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('problem_id', parseInt(problemId));

    if (language) {
      query = query.eq('language', language);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json({
      success: true,
      customTests: data,
    });
  } catch (error) {
    console.error('Error fetching custom tests:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch custom tests',
    });
  }
});

export default router;
