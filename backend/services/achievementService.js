import { supabaseAdmin } from '../db/supabaseClient.js';

/**
 * Achievement Service
 * Manages badge unlocking, progress tracking, and achievement definitions
 * Evaluates unlock conditions and awards badges to users
 */

/**
 * Check unlock conditions and unlock achievement if met
 * @param {UUID} userId - User ID
 * @param {string} badgeName - Badge to unlock
 * @param {Object} context - Achievement context (solution, problem, user data)
 * @returns {Promise<Object|null>} Unlocked achievement or null if not met
 */
export async function unlockAchievement(userId, badgeName, context = {}) {
  try {
    // Get badge definition
    const { data: badgeDef, error: defError } = await supabaseAdmin
      .from('achievement_definitions')
      .select('*')
      .eq('badge_name', badgeName)
      .single();

    if (defError || !badgeDef) {
      console.warn(`Badge definition not found: ${badgeName}`);
      return null;
    }

    // Check if already unlocked (for non-repeatable badges)
    const { data: existing } = await supabaseAdmin
      .from('achievements')
      .select('id')
      .eq('user_id', userId)
      .eq('badge_name', badgeName)
      .maybeSingle();

    if (existing && badgeDef.category === 'milestone') {
      return null; // Milestones can't be re-unlocked
    }

    // Evaluate unlock condition
    const unlocked = await evaluateCondition(
      userId,
      badgeDef.unlock_condition,
      context
    );

    if (!unlocked) {
      return null;
    }

    // Record achievement
    const { data: achievement, error: insertError } = await supabaseAdmin
      .from('achievements')
      .insert({
        user_id: userId,
        badge_name: badgeName,
        problem_id: context.problemId || null,
        achieved_at: new Date().toISOString(),
        progress: context.progress || null,
        metadata: context.metadata || {}
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return null; // Already exists
      }
      throw insertError;
    }

    return {
      id: achievement.id,
      badgeName: badgeName,
      rarity: badgeDef.rarity,
      points: badgeDef.points,
      description: badgeDef.description,
      achievedAt: achievement.achieved_at
    };
  } catch (error) {
    console.error(`Error unlocking achievement ${badgeName}:`, error);
    throw error;
  }
}

/**
 * Evaluate unlock condition against context
 * @private
 */
async function evaluateCondition(userId, condition, context) {
  try {
    const { type, ...params } = condition;

    switch (type) {
      case 'first_solution':
        // Check if this is the first solution ever
        const { data: allSolutions } = await supabaseAdmin
          .from('dsa_solutions')
          .select('id')
          .eq('user_id', userId)
          .limit(1);
        return (allSolutions?.length || 0) <= 1;

      case 'perfect_score':
        return context.score >= (params.minScore || 100);

      case 'problem_count':
        return await checkProblemCountByDifficulty(
          userId,
          params.difficulty,
          params.count
        );

      case 'streak_days':
        return (context.streakDays || 0) >= params.days;

      case 'daily_solve_count':
        return await checkDailySolveCount(userId, params.count);

      case 'solve_time':
        return (context.timeMs || 0) <= params.maxSeconds * 1000;

      case 'total_solutions':
        return await checkTotalSolutions(userId, params.count);

      case 'topic_diversity':
        return await checkTopicDiversity(userId, params.minTopics);

      case 'shared_solutions':
        return await checkSharedSolutions(userId, params.count);

      case 'mentor_rating':
        return await checkMentorRating(userId, params.reviewCount, params.minAvgRating);

      case 'review_count':
        return await checkReviewCount(userId, params.count);

      default:
        console.warn(`Unknown achievement condition: ${type}`);
        return false;
    }
  } catch (error) {
    console.error('Error evaluating achievement condition:', error);
    return false;
  }
}

/**
 * Check problem count by difficulty
 * @private
 */
async function checkProblemCountByDifficulty(userId, difficulty, count) {
  try {
    const { data: problems } = await supabaseAdmin
      .from('dsa_solutions')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'submitted');

    if (!problems) return false;

    const problemIds = problems.map(p => p.id);

    const { count: solvedCount } = await supabaseAdmin
      .from('dsa_problems')
      .select('id', { count: 'exact' })
      .in('id', problemIds)
      .eq('difficulty', difficulty);

    return (solvedCount || 0) >= count;
  } catch (error) {
    console.error('Error checking problem count:', error);
    return false;
  }
}

/**
 * Check daily solve count (solutions in last 24h)
 * @private
 */
async function checkDailySolveCount(userId, count) {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: solutions } = await supabaseAdmin
      .from('dsa_solutions')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'submitted')
      .gte('submitted_at', oneDayAgo);

    return (solutions?.length || 0) >= count;
  } catch (error) {
    console.error('Error checking daily solve count:', error);
    return false;
  }
}

/**
 * Check total solutions count
 * @private
 */
async function checkTotalSolutions(userId, count) {
  try {
    const { count: solveCount } = await supabaseAdmin
      .from('dsa_solutions')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('status', 'submitted');

    return (solveCount || 0) >= count;
  } catch (error) {
    console.error('Error checking total solutions:', error);
    return false;
  }
}

/**
 * Check diversity (solved problems in X+ topics)
 * @private
 */
async function checkTopicDiversity(userId, minTopics) {
  try {
    const { data: solutions } = await supabaseAdmin
      .from('dsa_solutions')
      .select('problem_id')
      .eq('user_id', userId)
      .eq('status', 'submitted');

    if (!solutions || solutions.length === 0) return false;

    const problemIds = solutions.map(s => s.problem_id);

    const { data: problems } = await supabaseAdmin
      .from('dsa_problems')
      .select('topic_id')
      .in('id', problemIds);

    if (!problems) return false;

    const uniqueTopics = new Set(problems.map(p => p.topic_id)).size;
    return uniqueTopics >= minTopics;
  } catch (error) {
    console.error('Error checking topic diversity:', error);
    return false;
  }
}

/**
 * Check shared solutions count
 * @private
 */
async function checkSharedSolutions(userId, count) {
  try {
    const { count: sharedCount } = await supabaseAdmin
      .from('dsa_solutions')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('is_public', true)
      .eq('status', 'submitted');

    return (sharedCount || 0) >= count;
  } catch (error) {
    console.error('Error checking shared solutions:', error);
    return false;
  }
}

/**
 * Check mentor review rating
 * @private
 */
async function checkMentorRating(userId, reviewCount, minAvgRating) {
  try {
    // Get reviews given to user as mentor
    const { data: reviews } = await supabaseAdmin
      .from('mentor_reviews')
      .select('id, rating')
      .eq('mentor_id', userId)
      .eq('status', 'completed');

    if (!reviews || reviews.length < reviewCount) return false;

    const avgRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length;
    return avgRating >= minAvgRating && reviews.length >= reviewCount;
  } catch (error) {
    console.error('Error checking mentor rating:', error);
    return false;
  }
}

/**
 * Check review count
 * @private
 */
async function checkReviewCount(userId, count) {
  try {
    const { count: ratedCount } = await supabaseAdmin
      .from('mentor_reviews')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)  // User who rated the review
      .not('rating', 'is', null);

    return (ratedCount || 0) >= count;
  } catch (error) {
    console.error('Error checking review count:', error);
    return false;
  }
}

/**
 * Get user's unlocked achievements
 * @param {UUID} userId - User ID
 * @param {number} limit - Max results
 * @returns {Promise<Array>} User's achievements
 */
export async function getUnlockedAchievements(userId, limit = 100) {
  try {
    const { data: achievements } = await supabaseAdmin
      .from('achievements')
      .select(`
        id,
        badge_name,
        achieved_at,
        achievement_definitions (
          description,
          icon_url,
          category,
          points,
          rarity
        )
      `)
      .eq('user_id', userId)
      .order('achieved_at', { ascending: false })
      .limit(limit);

    return achievements || [];
  } catch (error) {
    console.error('Error getting unlocked achievements:', error);
    throw error;
  }
}

/**
 * Get progress toward next achievement
 * @param {UUID} userId - User ID
 * @param {string} badgeName - Badge to check progress
 * @returns {Promise<Object>} Progress object
 */
export async function getProgressTowards(userId, badgeName) {
  try {
    const { data: badgeDef } = await supabaseAdmin
      .from('achievement_definitions')
      .select('unlock_condition, points, description')
      .eq('badge_name', badgeName)
      .single();

    if (!badgeDef) return null;

    const progress = await getProgressForCondition(userId, badgeDef.unlock_condition);

    return {
      badgeName,
      description: badgeDef.description,
      unlockCondition: badgeDef.unlock_condition,
      progress,
      points: badgeDef.points
    };
  } catch (error) {
    console.error(`Error getting progress for ${badgeName}:`, error);
    throw error;
  }
}

/**
 * Get progress metrics for unlock condition
 * @private
 */
async function getProgressForCondition(userId, condition) {
  try {
    const { type, ...params } = condition;

    switch (type) {
      case 'problem_count': {
        const count = await getProblemCountByDifficulty(userId, params.difficulty);
        return { current: count, target: params.count, percent: Math.round((count / params.count) * 100) };
      }
      case 'total_solutions': {
        const count = await getTotalSolutionCount(userId);
        return { current: count, target: params.count, percent: Math.round((count / params.count) * 100) };
      }
      case 'streak_days': {
        const streak = await getCurrentStreak(userId);
        return { current: streak, target: params.days, percent: Math.round((streak / params.days) * 100) };
      }
      case 'topic_diversity': {
        const topics = await getTopicCount(userId);
        return { current: topics, target: params.minTopics, percent: Math.round((topics / params.minTopics) * 100) };
      }
      default:
        return { current: 0, target: 1, percent: 0 };
    }
  } catch (error) {
    console.error('Error getting progress:', error);
    return { current: 0, target: 1, percent: 0 };
  }
}

async function getProblemCountByDifficulty(userId, difficulty) {
  const { count } = await supabaseAdmin
    .from('dsa_solutions')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .eq('status', 'submitted');
  return count || 0;
}

async function getTotalSolutionCount(userId) {
  const { count } = await supabaseAdmin
    .from('dsa_solutions')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .eq('status', 'submitted');
  return count || 0;
}

async function getCurrentStreak(userId) {
  const { data } = await supabaseAdmin
    .from('user_streaks')
    .select('streak_days')
    .eq('user_id', userId)
    .single();
  return data?.streak_days || 0;
}

async function getTopicCount(userId) {
  const { data: solutions } = await supabaseAdmin
    .from('dsa_solutions')
    .select('problem_id')
    .eq('user_id', userId)
    .eq('status', 'submitted');

  if (!solutions || solutions.length === 0) return 0;

  const problemIds = solutions.map(s => s.problem_id);
  const { data: problems } = await supabaseAdmin
    .from('dsa_problems')
    .select('topic_id')
    .in('id', problemIds);

  if (!problems) return 0;
  return new Set(problems.map(p => p.topic_id)).size;
}

/**
 * Batch check and unlock all applicable achievements
 * @param {UUID} userId - User ID
 * @param {Object} context - Submission context
 * @returns {Promise<Array>} Newly unlocked achievements
 */
export async function checkAllAchievements(userId, context) {
  try {
    const { data: definitions } = await supabaseAdmin
      .from('achievement_definitions')
      .select('badge_name');

    if (!definitions) return [];

    const unlocked = [];
    for (const def of definitions) {
      const achievement = await unlockAchievement(userId, def.badge_name, context);
      if (achievement) {
        unlocked.push(achievement);
      }
    }

    return unlocked;
  } catch (error) {
    console.error('Error checking all achievements:', error);
    throw error;
  }
}

/**
 * Get all achievement definitions (badge catalog)
 * @param {string} category - Optional filter by category
 * @returns {Promise<Array>} All available achievements
 */
export async function getAchievementDefinitions(category = null) {
  try {
    let query = supabaseAdmin
      .from('achievement_definitions')
      .select('*')
      .order('points', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data } = await query;
    return data || [];
  } catch (error) {
    console.error('Error getting achievement definitions:', error);
    throw error;
  }
}

/**
 * Calculate total points from all achievements
 * @param {UUID} userId - User ID
 * @returns {Promise<number>} Total achievement points
 */
export async function calculateAchievementPoints(userId) {
  try {
    const { data: achievements } = await supabaseAdmin
      .from('achievements')
      .select(`
        achievement_definitions (points)
      `)
      .eq('user_id', userId);

    if (!achievements) return 0;

    return achievements.reduce(
      (sum, ach) => sum + (ach.achievement_definitions?.points || 0),
      0
    );
  } catch (error) {
    console.error('Error calculating achievement points:', error);
    return 0;
  }
}
