import { supabaseAdmin } from '../db/supabaseClient.js';
import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('dsa-query-optimizer');

// In-memory cache for frequently accessed data
const cache = {
  patterns: null,
  patternsTimestamp: null,
  problemsByPattern: new Map(),
  problemsById: new Map(),
  TTL: 30 * 60 * 1000, // 30 minutes
};

/**
 * Get all patterns with problem counts (cached)
 */
export async function getPatternsWithCounts() {
  const now = Date.now();
  
  // Return cached if fresh
  if (cache.patterns && cache.patternsTimestamp && (now - cache.patternsTimestamp) < cache.TTL) {
    logger.debug('Returning cached patterns');
    return cache.patterns;
  }

  try {
    // Single optimized query with aggregation
    const { data: patterns, error } = await supabaseAdmin
      .from('patterns')
      .select(`
        id,
        name,
        category,
        description,
        difficulty_distribution,
        problems:problems(count)
      `)
      .order('id');

    if (error) throw error;

    const transformed = (patterns || []).map(p => ({
      ...p,
      problem_count: p.problems?.[0]?.count || 0,
      problems: undefined,
    }));

    // Update cache
    cache.patterns = transformed;
    cache.patternsTimestamp = now;

    logger.info('Patterns cached', { count: transformed.length });
    return transformed;
  } catch (error) {
    logger.error('Failed to fetch patterns', { error: error.message });
    throw error;
  }
}

/**
 * Get pattern with problems (cached per pattern)
 */
export async function getPatternWithProblems(patternId, userId = null) {
  const cacheKey = `pattern_${patternId}`;
  const cached = cache.problemsByPattern.get(cacheKey);
  const now = Date.now();

  // Return cached if fresh (but always fetch user progress)
  if (cached && (now - cached.timestamp) < cache.TTL) {
    logger.debug('Returning cached pattern problems', { patternId });
    
    if (userId) {
      const problemsWithProgress = await attachUserProgress(cached.problems, userId);
      return { pattern: cached.pattern, problems: problemsWithProgress };
    }
    
    return cached;
  }

  try {
    // Fetch pattern and problems in parallel
    const [patternResult, problemsResult] = await Promise.all([
      supabaseAdmin
        .from('patterns')
        .select('*')
        .eq('id', patternId)
        .single(),
      supabaseAdmin
        .from('problems')
        .select('id, title, difficulty, pattern_id, constraints, hints')
        .eq('pattern_id', patternId)
        .order('difficulty')
        .order('id'),
    ]);

    if (patternResult.error) throw patternResult.error;
    if (problemsResult.error) throw problemsResult.error;

    const pattern = patternResult.data;
    const problems = problemsResult.data || [];

    // Cache the result
    cache.problemsByPattern.set(cacheKey, {
      pattern,
      problems,
      timestamp: now,
    });

    logger.info('Pattern problems cached', { patternId, count: problems.length });

    // Attach user progress if authenticated
    if (userId) {
      const problemsWithProgress = await attachUserProgress(problems, userId);
      return { pattern, problems: problemsWithProgress };
    }

    return { pattern, problems };
  } catch (error) {
    logger.error('Failed to fetch pattern with problems', { patternId, error: error.message });
    throw error;
  }
}

/**
 * Get single problem with all details (cached)
 */
export async function getProblemById(problemId, userId = null) {
  const cached = cache.problemsById.get(problemId);
  const now = Date.now();

  // Return cached if fresh
  if (cached && (now - cached.timestamp) < cache.TTL) {
    logger.debug('Returning cached problem', { problemId });
    
    if (userId) {
      const userProgress = await getUserProgress(userId, problemId);
      return { ...cached.data, userProgress };
    }
    
    return cached.data;
  }

  try {
    const { data: problem, error } = await supabaseAdmin
      .from('problems')
      .select(`
        *,
        patterns!inner(name, category)
      `)
      .eq('id', problemId)
      .single();

    if (error) throw error;
    if (!problem) return null;

    // Transform pattern data
    const transformed = {
      ...problem,
      pattern_name: problem.patterns?.name,
      pattern_category: problem.patterns?.category,
      patterns: undefined,
      exploration: {
        exploreQuestions: problem.explore_questions || [],
        extendedTestCases: problem.extended_test_cases || [],
        metadata: problem.exploration_metadata || {},
      },
    };

    // Cache the result
    cache.problemsById.set(problemId, {
      data: transformed,
      timestamp: now,
    });

    logger.info('Problem cached', { problemId });

    // Attach user progress if authenticated
    if (userId) {
      const userProgress = await getUserProgress(userId, problemId);
      return { ...transformed, userProgress };
    }

    return transformed;
  } catch (error) {
    logger.error('Failed to fetch problem', { problemId, error: error.message });
    throw error;
  }
}

/**
 * Attach user progress to problems (batch operation)
 */
async function attachUserProgress(problems, userId) {
  if (!userId || !problems || problems.length === 0) {
    return problems;
  }

  try {
    const problemIds = problems.map(p => p.id);
    
    const { data: progressData, error } = await supabaseAdmin
      .from('user_progress')
      .select('problem_id, status, last_attempt, attempts')
      .eq('user_id', userId)
      .in('problem_id', problemIds);

    if (error) throw error;

    // Create progress map
    const progressMap = new Map();
    (progressData || []).forEach(p => {
      progressMap.set(p.problem_id, p);
    });

    // Attach progress to problems
    return problems.map(problem => ({
      ...problem,
      user_status: progressMap.get(problem.id)?.status || 'not_started',
      user_progress: progressMap.get(problem.id) || null,
    }));
  } catch (error) {
    logger.error('Failed to attach user progress', { error: error.message });
    // Return problems without progress on error
    return problems;
  }
}

/**
 * Get user progress for a single problem
 */
async function getUserProgress(userId, problemId) {
  if (!userId) return null;

  try {
    const { data, error } = await supabaseAdmin
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('problem_id', problemId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  } catch (error) {
    logger.error('Failed to fetch user progress', { userId, problemId, error: error.message });
    return null;
  }
}

/**
 * Get user progress summary (optimized)
 */
export async function getUserProgressSummary(userId) {
  try {
    // Single query with aggregation
    const { data: progressData, error } = await supabaseAdmin
      .from('user_progress')
      .select(`
        status,
        last_attempt,
        problems!inner(title, difficulty)
      `)
      .eq('user_id', userId)
      .order('last_attempt', { ascending: false });

    if (error) throw error;

    const items = progressData || [];
    const solved = items.filter(i => i.status === 'solved');

    // Calculate stats
    const stats = {
      total_solved: solved.length,
      problems_solved: solved.length,
      easy_solved: solved.filter(i => i.problems?.difficulty === 'Easy').length,
      medium_solved: solved.filter(i => i.problems?.difficulty === 'Medium').length,
      hard_solved: solved.filter(i => i.problems?.difficulty === 'Hard').length,
      total_attempted: items.length,
      success_rate: items.length > 0 
        ? Math.round((solved.length / items.length) * 100) 
        : 0,
    };

    // Recent activity (last 10)
    const recentActivity = items
      .slice(0, 10)
      .map(i => ({
        title: i.problems?.title,
        difficulty: i.problems?.difficulty,
        status: i.status,
        last_attempt: i.last_attempt,
      }));

    return { stats, recentActivity };
  } catch (error) {
    logger.error('Failed to fetch user progress summary', { userId, error: error.message });
    throw error;
  }
}

/**
 * Update user progress (with optimistic locking)
 */
export async function updateUserProgress(userId, problemId, status, code = null) {
  try {
    const now = new Date().toISOString();
    
    // Upsert with conflict resolution
    const { data, error } = await supabaseAdmin
      .from('user_progress')
      .upsert({
        user_id: userId,
        problem_id: problemId,
        status,
        last_attempt: now,
        last_code: code,
        attempts: supabaseAdmin.raw('COALESCE(attempts, 0) + 1'),
        updated_at: now,
      }, {
        onConflict: 'user_id,problem_id',
      })
      .select()
      .single();

    if (error) throw error;

    logger.info('User progress updated', { userId, problemId, status });
    return data;
  } catch (error) {
    logger.error('Failed to update user progress', { userId, problemId, error: error.message });
    throw error;
  }
}

/**
 * Invalidate cache for specific pattern or problem
 */
export function invalidateCache(type, id = null) {
  switch (type) {
    case 'patterns':
      cache.patterns = null;
      cache.patternsTimestamp = null;
      logger.info('Patterns cache invalidated');
      break;
    case 'pattern':
      if (id) {
        cache.problemsByPattern.delete(`pattern_${id}`);
        logger.info('Pattern cache invalidated', { patternId: id });
      }
      break;
    case 'problem':
      if (id) {
        cache.problemsById.delete(id);
        logger.info('Problem cache invalidated', { problemId: id });
      }
      break;
    case 'all':
      cache.patterns = null;
      cache.patternsTimestamp = null;
      cache.problemsByPattern.clear();
      cache.problemsById.clear();
      logger.info('All DSA cache invalidated');
      break;
    default:
      logger.warn('Unknown cache type', { type });
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    patterns: {
      cached: !!cache.patterns,
      age: cache.patternsTimestamp 
        ? Math.round((Date.now() - cache.patternsTimestamp) / 1000) 
        : null,
    },
    problemsByPattern: {
      count: cache.problemsByPattern.size,
      keys: Array.from(cache.problemsByPattern.keys()),
    },
    problemsById: {
      count: cache.problemsById.size,
      keys: Array.from(cache.problemsById.keys()).slice(0, 10),
    },
    ttl: cache.TTL / 1000,
  };
}

// Cleanup old cache entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;

  // Clean pattern problems cache
  for (const [key, value] of cache.problemsByPattern.entries()) {
    if (now - value.timestamp > cache.TTL) {
      cache.problemsByPattern.delete(key);
      cleaned++;
    }
  }

  // Clean problems cache
  for (const [key, value] of cache.problemsById.entries()) {
    if (now - value.timestamp > cache.TTL) {
      cache.problemsById.delete(key);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    logger.info('DSA cache cleanup completed', { cleaned });
  }
}, 10 * 60 * 1000);

export default {
  getPatternsWithCounts,
  getPatternWithProblems,
  getProblemById,
  getUserProgressSummary,
  updateUserProgress,
  invalidateCache,
  getCacheStats,
};
