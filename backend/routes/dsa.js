import express from 'express';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { all425Problems } from '../data/allProblems.js';
import Groq from 'groq-sdk';
import DataCacheManager from '../services/dataCacheManager.js';
import HintService from '../services/hintService.js';
import ExecutionTracer from '../services/executionTracer.js';
import { VisualizationManager } from '../services/visualizationEngine.js';
import StepThroughDebugger from '../services/stepThroughDebugger.js';
import ProblemRecommender from '../services/problemRecommender.js';
import SkillDetector from '../services/skillDetector.js';
import { AdaptiveDifficultySelector } from '../services/adaptiveDifficultySelector.js';

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

// ============================================================================
// Phase 2: Execution Tracing (Visualization & Debugging)
// ============================================================================

/**
 * POST /api/dsa/trace
 * Trace code execution to capture memory state and step-by-step logs
 * Request: {code: string, input: Object, language: 'javascript'|'python', functionName?: string}
 * Response: {trace, totalSteps, executionTime, finalResult, warnings}
 */
router.post('/trace', authenticateToken, async (req, res) => {
  try {
    const { code, input = {}, language = 'javascript', functionName } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Code is required and must be a string',
      });
    }

    const tracer = new ExecutionTracer({
      maxSteps: 10000,
      maxArraySize: 1000,
      maxObjectDepth: 5,
      timeout: 30000,
    });

    const result = await tracer.trace(code, input, { language, functionName });

    res.json({
      success: result.success,
      trace: result.trace,
      totalSteps: result.totalSteps,
      executionTime: result.executionTime,
      finalResult: result.finalResult,
      error: result.error,
      warnings: result.warnings,
    });
  } catch (error) {
    console.error('Error tracing execution:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to trace execution',
    });
  }
});

/**
 * POST /api/dsa/trace/timeline
 * Extract timeline from full trace (filter interesting events)
 * Request: {trace: Array, types?: Array, maxEvents?: number}
 * Response: {timeline: Array}
 */
router.post('/trace/timeline', authenticateToken, async (req, res) => {
  try {
    const { trace, types, maxEvents } = req.body;

    if (!Array.isArray(trace)) {
      return res.status(400).json({
        success: false,
        error: 'Trace must be an array',
      });
    }

    const tracer = new ExecutionTracer();
    const timeline = tracer.getTimeline({ trace }, { types, maxEvents });

    res.json({
      success: true,
      timeline,
    });
  } catch (error) {
    console.error('Error extracting timeline:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to extract timeline',
    });
  }
});

/**
 * POST /api/dsa/trace/mutations
 * Get variable mutations between two steps
 * Request: {trace: Array, fromStep: number, toStep: number}
 * Response: {mutations: {added, removed, changed}}
 */
router.post('/trace/mutations', authenticateToken, async (req, res) => {
  try {
    const { trace, fromStep, toStep } = req.body;

    if (!Array.isArray(trace) || typeof fromStep !== 'number' || typeof toStep !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Trace (array), fromStep, and toStep (numbers) are required',
      });
    }

    const tracer = new ExecutionTracer();
    const mutations = tracer.getMutationsBetweenSteps({ trace }, fromStep, toStep);

    res.json({
      success: true,
      mutations,
    });
  } catch (error) {
    console.error('Error analyzing mutations:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze mutations',
    });
  }
});

/**
 * POST /api/dsa/trace/statistics
 * Get trace statistics (event counts, timing, etc.)
 * Request: {trace: Array, executionTime: number, success: boolean}
 * Response: {statistics}
 */
router.post('/trace/statistics', authenticateToken, async (req, res) => {
  try {
    const { trace, executionTime, success } = req.body;

    if (!Array.isArray(trace)) {
      return res.status(400).json({
        success: false,
        error: 'Trace must be an array',
      });
    }

    const tracer = new ExecutionTracer();
    const statistics = tracer.getStatistics({ trace, executionTime, success });

    res.json({
      success: true,
      statistics,
    });
  } catch (error) {
    console.error('Error computing statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to compute statistics',
    });
  }
});

// ============================================================================
// Phase 2.2: Interactive Visualization
// ============================================================================

/**
 * POST /api/dsa/visualize
 * Auto-detect data structure and generate visualization spec
 * Request: {data: any, options?: {highlightedIndices?: Array}}
 * Response: {visualization: Object, dataStructure: string}
 */
router.post('/visualize', authenticateToken, async (req, res) => {
  try {
    const { data, options = {} } = req.body;

    if (data === undefined || data === null) {
      return res.status(400).json({
        success: false,
        error: 'Data is required',
      });
    }

    const manager = new VisualizationManager();

    try {
      const visualization = manager.visualize(data, options);

      res.json({
        success: true,
        visualization,
        dataStructure: visualization.dataStructure,
      });
    } catch (detectionError) {
      res.status(400).json({
        success: false,
        error: detectionError.message,
      });
    }
  } catch (error) {
    console.error('Error generating visualization:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate visualization',
    });
  }
});

/**
 * POST /api/dsa/visualize/array-mutation
 * Animate array mutation
 * Request: {from: Array, to: Array}
 * Response: {animation: Object}
 */
router.post('/visualize/array-mutation', authenticateToken, async (req, res) => {
  try {
    const { from, to } = req.body;

    if (!Array.isArray(from) || !Array.isArray(to)) {
      return res.status(400).json({
        success: false,
        error: 'Both "from" and "to" must be arrays',
      });
    }

    const manager = new VisualizationManager();
    const arrayViz = manager.visualizers.array;
    const animation = arrayViz.animateTransition(from, to);

    res.json({
      success: true,
      animation,
    });
  } catch (error) {
    console.error('Error animating array mutation:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to animate mutation',
    });
  }
});

/**
 * POST /api/dsa/visualize/tree-traversal
 * Animate tree traversal (inorder, preorder, postorder, levelorder)
 * Request: {tree: Object, traversalType: string}
 * Response: {sequence: Array}
 */
router.post('/visualize/tree-traversal', authenticateToken, async (req, res) => {
  try {
    const { tree, traversalType = 'inorder' } = req.body;

    if (!tree || typeof tree !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Tree must be a valid object',
      });
    }

    const validTraversals = ['inorder', 'preorder', 'postorder', 'levelorder'];
    if (!validTraversals.includes(traversalType)) {
      return res.status(400).json({
        success: false,
        error: `Traversal type must be one of: ${validTraversals.join(', ')}`,
      });
    }

    const manager = new VisualizationManager();
    const treeViz = manager.visualizers.tree;
    const sequence = treeViz.animateTraversal(tree, traversalType);

    res.json({
      success: true,
      sequence,
      frameCount: sequence.length,
    });
  } catch (error) {
    console.error('Error animating tree traversal:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to animate tree traversal',
    });
  }
});

/**
 * POST /api/dsa/visualize/graph-shortest-path
 * Animate shortest path algorithm on graph
 * Request: {graph: Object, startNodeId: number, endNodeId: number}
 * Response: {sequence: Array}
 */
router.post('/visualize/graph-shortest-path', authenticateToken, async (req, res) => {
  try {
    const { graph, startNodeId, endNodeId } = req.body;

    if (!graph || !Number.isInteger(startNodeId) || !Number.isInteger(endNodeId)) {
      return res.status(400).json({
        success: false,
        error: 'Graph, startNodeId, and endNodeId are required',
      });
    }

    const manager = new VisualizationManager();
    const graphViz = manager.visualizers.graph;
    const sequence = graphViz.animateShortestPath(graph, startNodeId, endNodeId);

    res.json({
      success: true,
      sequence,
      frameCount: sequence.length,
    });
  } catch (error) {
    console.error('Error animating shortest path:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to animate shortest path',
    });
  }
});

// ============================================================================
// Phase 2.3: Step-Through Debugger
// ============================================================================

/**
 * POST /api/dsa/debugger/create
 * Create a new debugger session
 * Request: {}
 * Response: {sessionId: string}
 */
router.post('/debugger/create', authenticateToken, async (req, res) => {
  try {
    // Create a new debugger instance (in production, would store in session/DB)
    const debugger_ = new StepThroughDebugger();
    const sessionId = `debug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store in memory (in production, would use Redis or database)
    // For now, return sessionId and let client track state

    res.json({
      success: true,
      sessionId,
      message: 'Debug session created',
    });
  } catch (error) {
    console.error('Error creating debugger:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create debugger session',
    });
  }
});

/**
 * POST /api/dsa/debugger/:sessionId/breakpoint/add
 * Add breakpoint to debug session
 * Request: {lineNumber: number, condition?: string}
 * Response: {breakpointId: string}
 */
router.post('/debugger/:sessionId/breakpoint/add', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { lineNumber, condition } = req.body;

    if (!Number.isInteger(lineNumber)) {
      return res.status(400).json({
        success: false,
        error: 'lineNumber must be an integer',
      });
    }

    // In production, retrieve debugger from storage
    const debugger_ = new StepThroughDebugger();
    const breakpointId = debugger_.addBreakpoint(lineNumber, condition);

    res.json({
      success: true,
      breakpointId,
      lineNumber,
      condition: condition || null,
    });
  } catch (error) {
    console.error('Error adding breakpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to add breakpoint',
    });
  }
});

/**
 * DELETE /api/dsa/debugger/:sessionId/breakpoint/:breakpointId
 * Remove breakpoint from debug session
 * Response: {success: boolean}
 */
router.delete('/debugger/:sessionId/breakpoint/:breakpointId', authenticateToken, async (req, res) => {
  try {
    const { sessionId, breakpointId } = req.params;

    // In production, retrieve debugger from storage
    const debugger_ = new StepThroughDebugger();
    const removed = debugger_.removeBreakpoint(breakpointId);

    res.json({
      success: removed,
      message: removed ? 'Breakpoint removed' : 'Breakpoint not found',
    });
  } catch (error) {
    console.error('Error removing breakpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to remove breakpoint',
    });
  }
});

/**
 * POST /api/dsa/debugger/:sessionId/step-forward
 * Step forward in debug session
 * Response: {context: Object}
 */
router.post('/debugger/:sessionId/step-forward', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;

    // In production, retrieve debugger from storage
    const debugger_ = new StepThroughDebugger();
    const ctx = debugger_.stepForward();

    res.json({
      success: true,
      context: ctx,
      currentStep: debugger_.currentStep,
    });
  } catch (error) {
    console.error('Error stepping forward:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to step forward',
    });
  }
});

/**
 * POST /api/dsa/debugger/:sessionId/step-backward
 * Step backward in debug session
 * Response: {context: Object}
 */
router.post('/debugger/:sessionId/step-backward', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;

    // In production, retrieve debugger from storage
    const debugger_ = new StepThroughDebugger();
    const ctx = debugger_.stepBackward();

    res.json({
      success: true,
      context: ctx,
      currentStep: debugger_.currentStep,
    });
  } catch (error) {
    console.error('Error stepping backward:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to step backward',
    });
  }
});

/**
 * POST /api/dsa/debugger/:sessionId/jump-to-step
 * Jump to specific step in debug session
 * Request: {stepNumber: number}
 * Response: {context: Object}
 */
router.post('/debugger/:sessionId/jump-to-step', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { stepNumber } = req.body;

    if (!Number.isInteger(stepNumber)) {
      return res.status(400).json({
        success: false,
        error: 'stepNumber must be an integer',
      });
    }

    // In production, retrieve debugger from storage
    const debugger_ = new StepThroughDebugger();
    const ctx = debugger_.jumpToStep(stepNumber);

    res.json({
      success: ctx !== null,
      context: ctx,
      currentStep: debugger_.currentStep,
    });
  } catch (error) {
    console.error('Error jumping to step:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to jump to step',
    });
  }
});

/**
 * GET /api/dsa/debugger/:sessionId/state
 * Get current debug state
 * Response: {state: Object}
 */
router.get('/debugger/:sessionId/state', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;

    // In production, retrieve debugger from storage
    const debugger_ = new StepThroughDebugger();
    const state = debugger_.getDebugState();

    res.json({
      success: true,
      state,
    });
  } catch (error) {
    console.error('Error getting debug state:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get debug state',
    });
  }
});

/**
 * GET /api/dsa/debugger/:sessionId/timeline
 * Get execution timeline
 * Response: {timeline: Array}
 */
router.get('/debugger/:sessionId/timeline', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { maxSteps = 100 } = req.query;

    // In production, retrieve debugger from storage
    const debugger_ = new StepThroughDebugger();
    const timeline = debugger_.getExecutionTimeline({ maxSteps: parseInt(maxSteps) });

    res.json({
      success: true,
      timeline,
      frameCount: timeline.length,
    });
  } catch (error) {
    console.error('Error getting timeline:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get timeline',
    });
  }
});

/**
 * GET /api/dsa/debugger/:sessionId/variable/:variableName/history
 * Get variable history
 * Response: {history: Array}
 */
router.get('/debugger/:sessionId/variable/:variableName/history', authenticateToken, async (req, res) => {
  try {
    const { sessionId, variableName } = req.params;

    // In production, retrieve debugger from storage
    const debugger_ = new StepThroughDebugger();
    const history = debugger_.getVariableHistory(variableName);

    res.json({
      success: true,
      variable: variableName,
      history,
      entryCount: history.length,
    });
  } catch (error) {
    console.error('Error getting variable history:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get variable history',
    });
  }
});

/**
 * GET /api/dsa/debugger/:sessionId/export
 * Export debug session
 * Response: {session: Object}
 */
router.get('/debugger/:sessionId/export', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;

    // In production, retrieve debugger from storage
    const debugger_ = new StepThroughDebugger();
    const session = debugger_.exportSession();

    res.json({
      success: true,
      sessionId,
      session,
    });
  } catch (error) {
    console.error('Error exporting debug session:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export session',
    });
  }
});

/**
 * GET /api/dsa/recommendations
 * Get personalized problem recommendations
 * Query: ?limit=5&strategy=balanced
 * Response: {recommendations: Array}
 */
router.get('/recommendations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const { limit = 5, strategy = 'balanced' } = req.query;

    // Fetch user problem history
    const { data: solvedData } = await supabaseAdmin
      .from('problem_submissions')
      .select('problem_id, success')
      .eq('user_id', userId)
      .eq('success', true);

    const solvedProblems = solvedData?.map(s => s.problem_id) || [];

    // Fetch user stats for skill level and weak areas
    const { data: statsData } = await supabaseAdmin
      .from('user_problem_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    const userStats = statsData || {
      solvedProblems,
      solveRate: solvedProblems.length / Math.max(1, all425Problems.length),
      attemptHistory: {},
      recentTopics: [],
      solvedPatterns: {},
    };

    const recommender = new ProblemRecommender();

    // Analyze weaknesses and calculate skill level
    const weaknessAreas = recommender.analyzeWeaknesses(
      statsData?.topicStats || { topicStats: {} }
    );
    const skillLevel = recommender.calculateSkillLevel(userStats);

    const userProfile = {
      weaknessAreas,
      skillLevel,
    };

    // Get recommendations
    const recommendations = recommender.getRecommendations(
      userProfile,
      all425Problems,
      userStats,
      {
        limit: parseInt(limit),
        strategy,
      }
    );

    res.json({
      success: true,
      recommendations,
      userProfile,
      count: recommendations.length,
    });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get recommendations',
    });
  }
});

/**
 * GET /api/dsa/recommendations/company/:company
 * Get company-specific problem recommendations
 * Query: ?limit=10
 * Response: {recommendations: Array}
 */
router.get('/recommendations/company/:company', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const { company } = req.params;
    const { limit = 10 } = req.query;

    // Fetch user problem history
    const { data: solvedData } = await supabaseAdmin
      .from('problem_submissions')
      .select('problem_id, success')
      .eq('user_id', userId)
      .eq('success', true);

    const solvedProblems = solvedData?.map(s => s.problem_id) || [];
    const userStats = { solvedProblems };

    const recommender = new ProblemRecommender();
    const recommendations = recommender.getCompanySpecificProblems(
      company,
      all425Problems,
      userStats,
      parseInt(limit)
    );

    res.json({
      success: true,
      company,
      recommendations,
      count: recommendations.length,
    });
  } catch (error) {
    console.error('Error getting company-specific recommendations:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get company-specific recommendations',
    });
  }
});

/**
 * GET /api/dsa/learning-path/:topic
 * Get learning path for a topic
 * Query: ?limit=10
 * Response: {path: Array}
 */
router.get('/learning-path/:topic', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const { topic } = req.params;
    const { limit = 10 } = req.query;

    // Fetch user problem history
    const { data: solvedData } = await supabaseAdmin
      .from('problem_submissions')
      .select('problem_id, success')
      .eq('user_id', userId)
      .eq('success', true);

    const solvedProblems = solvedData?.map(s => s.problem_id) || [];
    const userStats = { solvedProblems };

    const recommender = new ProblemRecommender();
    const path = recommender.getLearningPath(all425Problems, userStats, topic, parseInt(limit));

    res.json({
      success: true,
      topic,
      path,
      count: path.length,
    });
  } catch (error) {
    console.error('Error getting learning path:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get learning path',
    });
  }
});

/**
 * GET /api/dsa/weaknesses
 * Get user weakness analysis
 * Response: {weaknesses: Object, skillLevel: string}
 */
router.get('/weaknesses', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    // Fetch user stats
    const { data: statsData } = await supabaseAdmin
      .from('user_problem_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    const recommender = new ProblemRecommender();
    const weaknesses = recommender.analyzeWeaknesses(
      statsData?.topicStats || { topicStats: {} }
    );
    const skillLevel = recommender.calculateSkillLevel(statsData || {});

    res.json({
      success: true,
      weaknesses,
      skillLevel,
      topicStats: statsData?.topicStats || {},
    });
  } catch (error) {
    console.error('Error analyzing weaknesses:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze weaknesses',
    });
  }
});

/**
 * GET /api/dsa/skill-profile
 * Get user's complete skill profile with recommendations
 * Response: {profile: Object, recommendations: Array}
 */
router.get('/skill-profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    // Fetch user stats
    const { data: statsData } = await supabaseAdmin
      .from('user_problem_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    const detector = new SkillDetector();
    const profile = detector.getSkillProfile(statsData || {});

    res.json({
      success: true,
      profile,
      skillLevel: Object.keys(profile.topics).length > 0 ? 'detected' : 'new_user',
    });
  } catch (error) {
    console.error('Error getting skill profile:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get skill profile',
    });
  }
});

/**
 * POST /api/dsa/difficulty/initialize
 * Initialize adaptive difficulty for a practice session
 * Request: {difficulty: 'easy' | 'medium' | 'hard'}
 * Response: {difficulty: string}
 */
router.post('/difficulty/initialize', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const { difficulty = 'medium' } = req.body;

    const selector = new AdaptiveDifficultySelector();
    const initialDifficulty = selector.initializeDifficulty(userId, difficulty);

    res.json({
      success: true,
      difficulty: initialDifficulty,
      message: `Started at ${initialDifficulty} difficulty`,
    });
  } catch (error) {
    console.error('Error initializing difficulty:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to initialize difficulty',
    });
  }
});

/**
 * POST /api/dsa/difficulty/record-score
 * Record a problem submission score and update adaptive difficulty
 * Request: {score: number}
 * Response: {currentDifficulty: string, trajectory: number, adjustmentReason: string}
 */
router.post('/difficulty/record-score', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const { score } = req.body;

    if (!Number.isFinite(score)) {
      return res.status(400).json({
        success: false,
        error: 'score must be a valid number',
      });
    }

    const selector = new AdaptiveDifficultySelector();
    const result = selector.recordScoreAndUpdateDifficulty(userId, score);

    res.json({
      success: true,
      currentDifficulty: result.currentDifficulty,
      previousDifficulty: result.previousDifficulty,
      trajectory: result.trajectory,
      adjustmentReason: result.adjustmentReason,
      adjustmentMade: result.adjustmentMade,
      lastScore: result.lastScore,
      averageScore: result.averageScore,
      scoreHistory: result.scoreHistory,
    });
  } catch (error) {
    console.error('Error recording score:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to record score',
    });
  }
});

/**
 * GET /api/dsa/difficulty/current
 * Get current difficulty level for user
 * Response: {difficulty: string}
 */
router.get('/difficulty/current', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const selector = new AdaptiveDifficultySelector();
    const difficulty = selector.getCurrentDifficulty(userId);

    res.json({
      success: true,
      difficulty,
    });
  } catch (error) {
    console.error('Error getting current difficulty:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get current difficulty',
    });
  }
});

/**
 * GET /api/dsa/difficulty/stats
 * Get difficulty progression statistics
 * Response: {stats: Object}
 */
router.get('/difficulty/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const selector = new AdaptiveDifficultySelector();
    const stats = selector.getDifficultyStats(userId);

    res.json({
      success: true,
      stats: stats || { message: 'No difficulty history yet' },
    });
  } catch (error) {
    console.error('Error getting difficulty stats:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get difficulty stats',
    });
  }
});

export default router;
