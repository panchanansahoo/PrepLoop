import { supabaseAdmin } from '../db/supabaseClient.js';

/**
 * Leaderboard Service
 * Manages global, topic, problem, and weekly leaderboards
 * Handles ranking calculations, position lookups, and updates
 */

/**
 * Calculate global ranking scores and update leaderboard
 * @param {UUID} userId - User ID
 * @returns {Promise<Object>} Updated ranking entry
 */
export async function calculateGlobalRanking(userId) {
  try {
    // Get user's total solution score
    const { data: solutions } = await supabaseAdmin
      .from('dsa_solutions')
      .select('id, score, problem_id')
      .eq('user_id', userId)
      .eq('status', 'submitted');

    if (!solutions || solutions.length === 0) {
      // Create zero entry
      return await updateLeaderboardEntry(userId, 'global', null, null, 0, 0, 0, 0);
    }

    const totalScore = solutions.reduce((sum, s) => sum + (s.score || 0), 0);
    const avgScore = totalScore / solutions.length;
    
    // Update or create ranking entry
    const entry = await updateLeaderboardEntry(
      userId,
      'global',
      null,
      null,
      totalScore,
      solutions.length,
      avgScore,
      0
    );

    return entry;
  } catch (error) {
    console.error('Error calculating global ranking:', error);
    throw error;
  }
}

/**
 * Calculate topic-specific rankings
 * @param {UUID} userId - User ID
 * @param {UUID} topicId - Topic ID
 * @returns {Promise<Object>} Topic ranking entry
 */
export async function calculateTopicRanking(userId, topicId) {
  try {
    // Get solutions in this topic only
    const { data: topicProblems } = await supabaseAdmin
      .from('dsa_problems')
      .select('id')
      .eq('topic_id', topicId);

    if (!topicProblems || topicProblems.length === 0) {
      return null;
    }

    const problemIds = topicProblems.map(p => p.id);

    const { data: solutions } = await supabaseAdmin
      .from('dsa_solutions')
      .select('score')
      .eq('user_id', userId)
      .in('problem_id', problemIds)
      .eq('status', 'submitted');

    if (!solutions || solutions.length === 0) {
      return await updateLeaderboardEntry(userId, 'topic', topicId, null, 0, 0, 0, 0);
    }

    const totalScore = solutions.reduce((sum, s) => sum + (s.score || 0), 0);
    const avgScore = totalScore / solutions.length;

    return await updateLeaderboardEntry(
      userId,
      'topic',
      topicId,
      null,
      totalScore,
      solutions.length,
      avgScore,
      0
    );
  } catch (error) {
    console.error(`Error calculating topic ranking for topic ${topicId}:`, error);
    throw error;
  }
}

/**
 * Calculate per-problem leaderboard (fastest solvers, best scores)
 * @param {UUID} problemId - Problem ID
 * @returns {Promise<Array>} Top solvers for problem
 */
export async function calculateProblemRanking(problemId) {
  try {
    const { data: topSolvers } = await supabaseAdmin
      .from('dsa_solutions')
      .select('user_id, score, time_ms')
      .eq('problem_id', problemId)
      .eq('status', 'submitted')
      .order('score', { ascending: false })
      .order('time_ms', { ascending: true })
      .limit(100);

    if (!topSolvers) {
      return [];
    }

    // Update problem leaderboard for each solver
    for (let i = 0; i < topSolvers.length; i++) {
      const solver = topSolvers[i];
      await updateLeaderboardEntry(
        solver.user_id,
        'problem',
        null,
        problemId,
        solver.score || 0,
        1,
        solver.score || 0,
        0,
        i + 1  // rank
      );
    }

    return topSolvers;
  } catch (error) {
    console.error(`Error calculating problem ranking for problem ${problemId}:`, error);
    throw error;
  }
}

/**
 * Get weekly leaderboard (resets every Monday UTC)
 * @param {number} limit - Number of results
 * @returns {Promise<Array>} Top performers this week
 */
export async function getWeeklyRanking(limit = 100) {
  try {
    const weekStart = getWeekStart();

    const { data: weeklyEntries } = await supabaseAdmin
      .from('leaderboards')
      .select('user_id, score, solutions_count, avg_score, streak_days')
      .eq('scope', 'weekly')
      .eq('week_start_date', weekStart)
      .order('score', { ascending: false })
      .limit(limit);

    return weeklyEntries || [];
  } catch (error) {
    console.error('Error getting weekly ranking:', error);
    throw error;
  }
}

/**
 * Get user's current rank and position
 * @param {UUID} userId - User ID
 * @param {string} scope - 'global' | 'topic' | 'problem' | 'weekly'
 * @param {UUID} topicId - Optional topic ID for scope='topic'
 * @param {UUID} problemId - Optional problem ID for scope='problem'
 * @returns {Promise<Object>} User's rank and details
 */
export async function getUserRank(userId, scope = 'global', topicId = null, problemId = null) {
  try {
    const query = supabaseAdmin
      .from('leaderboards')
      .select('rank, score, solutions_count, avg_score, streak_days')
      .eq('scope', scope)
      .eq('user_id', userId);

    if (topicId && scope === 'topic') {
      query.eq('topic_id', topicId);
    }
    if (problemId && scope === 'problem') {
      query.eq('problem_id', problemId);
    }

    const { data, error } = await query.single();

    if (error) {
      return {
        rank: null,
        score: 0,
        solutions_count: 0,
        avg_score: 0,
        streak_days: 0
      };
    }

    return data;
  } catch (error) {
    console.error(`Error getting user rank for ${scope}:`, error);
    throw error;
  }
}

/**
 * Update or create leaderboard entry
 * @internal
 */
export async function updateLeaderboardEntry(
  userId,
  scope,
  topicId = null,
  problemId = null,
  score = 0,
  solutionsCount = 0,
  avgScore = 0,
  streakDays = 0,
  rank = null,
  weekStart = null
) {
  try {
    const weekDate = weekStart || getWeekStart();

    const { data, error } = await supabaseAdmin
      .from('leaderboards')
      .upsert(
        {
          user_id: userId,
          scope,
          topic_id: topicId,
          problem_id: problemId,
          score,
          solutions_count: solutionsCount,
          avg_score: Math.round(avgScore * 100) / 100,
          streak_days: streakDays,
          rank,
          week_start_date: scope === 'weekly' ? weekDate : null,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'user_id,scope,topic_id,problem_id,week_start_date',
          returning: 'representation'
        }
      );

    if (error) throw error;
    return data?.[0];
  } catch (error) {
    console.error('Error updating leaderboard entry:', error);
    throw error;
  }
}

/**
 * Get paginated leaderboard
 * @param {string} scope - 'global' | 'topic' | 'problem' | 'weekly' | 'streak'
 * @param {number} page - Page number (1-based)
 * @param {number} pageSize - Results per page
 * @param {UUID} topicId - Optional filter
 * @param {UUID} problemId - Optional filter
 * @returns {Promise<Object>} Paginated results with total count
 */
export async function getLeaderboardPage(
  scope = 'global',
  page = 1,
  pageSize = 50,
  topicId = null,
  problemId = null
) {
  try {
    const offset = (page - 1) * pageSize;

    let query = supabaseAdmin
      .from('leaderboards')
      .select('*', { count: 'exact' })
      .eq('scope', scope)
      .order('rank', { ascending: true })
      .order('score', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (topicId && scope === 'topic') {
      query = query.eq('topic_id', topicId);
    }
    if (problemId && scope === 'problem') {
      query = query.eq('problem_id', problemId);
    }
    if (scope === 'weekly') {
      query = query.eq('week_start_date', getWeekStart());
    }

    const { data, count } = await query;

    return {
      page,
      pageSize,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize),
      entries: data || []
    };
  } catch (error) {
    console.error(`Error getting leaderboard page for ${scope}:`, error);
    throw error;
  }
}

/**
 * Calculate points from a solution
 * @param {number} baseDifficulty - 10 (easy), 25 (medium), 50 (hard)
 * @param {boolean} isPerfect - 100% test pass rate
 * @param {number} timeMs - Solve time in milliseconds
 * @param {number} avgProblemTimeMs - Average time for this problem
 * @param {number} streakDays - Current streak for multiplier
 * @returns {number} Total points
 */
export function calculateScore(
  baseDifficulty,
  isPerfect,
  timeMs,
  avgProblemTimeMs,
  streakDays = 0
) {
  const basePts = baseDifficulty;

  // Perfect score bonus
  const perfectionBonus = isPerfect ? 5 : 0;

  // Speed bonus (faster = more points)
  const maxTime = avgProblemTimeMs * 1.5; // 1.5x average is baseline
  const speedBonus = timeMs < maxTime 
    ? Math.round(10 * (1 - timeMs / maxTime))
    : 0;

  // Streak multiplier (1.0 + up to 1% per day, capped at 1.5x)
  const streakMultiplier = 1 + (Math.min(100, streakDays) * 0.01);

  // Final calculation
  const totalPoints = Math.round((basePts + perfectionBonus + speedBonus) * streakMultiplier);

  return totalPoints;
}

/**
 * Helper: Get Monday UTC of current week
 * @internal
 */
function getWeekStart() {
  const now = new Date();
  const dayOfWeek = now.getUTCDay();
  const daysToMonday = (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
  const monday = new Date(now);
  monday.setUTCDate(monday.getUTCDate() - daysToMonday);
  monday.setUTCHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
}

/**
 * Batch update leaderboards after weekly reset (cron job)
 * @returns {Promise<number>} Number of entries reset
 */
export async function resetWeeklyLeaderboards() {
  try {
    // Delete old weekly entries (older than 2 weeks)
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const { data: deletedCount } = await supabaseAdmin
      .from('leaderboards')
      .delete()
      .eq('scope', 'weekly')
      .lt('week_start_date', twoWeeksAgo.toISOString().split('T')[0]);

    return deletedCount?.length || 0;
  } catch (error) {
    console.error('Error resetting weekly leaderboards:', error);
    throw error;
  }
}

/**
 * Get streak leaderboard (by longest active streaks)
 * @param {number} limit - Number of results
 * @returns {Promise<Array>} Users with longest streaks
 */
export async function getStreakLeaderboard(limit = 50) {
  try {
    const { data: streaks } = await supabaseAdmin
      .from('user_streaks')
      .select('user_id, streak_days, longest_streak, is_active')
      .eq('is_active', true)
      .order('streak_days', { ascending: false })
      .limit(limit);

    return streaks || [];
  } catch (error) {
    console.error('Error getting streak leaderboard:', error);
    throw error;
  }
}
