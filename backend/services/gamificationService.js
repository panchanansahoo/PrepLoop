import * as leaderboardService from './leaderboardService.js';
import * as achievementService from './achievementService.js';
import * as streakService from './streakService.js';
import { supabaseAdmin } from '../db/supabaseClient.js';

/**
 * Gamification Service
 * Orchestrates all gamification components (leaderboards, achievements, streaks)
 * Called on solution submission to update all related metrics
 */

/**
 * Process solution submission and update gamification
 * This is the main entry point called after a solution is submitted
 * @param {UUID} userId - User ID
 * @param {UUID} problemId - Problem ID
 * @param {Object} solutionData - Solution details (score, timeMs, isPerfect)
 * @param {Object} problemData - Problem details (difficulty, avgTimeMs)
 * @returns {Promise<Object>} Complete gamification response
 */
export async function submitSolution(userId, problemId, solutionData, problemData) {
  try {
    const response = {
      success: true,
      points: 0,
      achievements: [],
      streak: {},
      leaderboard: {}
    };

    // 1. Calculate points
    const basePoints = getDifficultyPoints(problemData.difficulty);
    const points = leaderboardService.calculateScore(
      basePoints,
      solutionData.isPerfect || false,
      solutionData.timeMs || 0,
      problemData.avgTimeMs || 0,
      0 // streakDays will be added after streak update
    );
    response.points = points;

    // 2. Update streak
    const updatedStreak = await streakService.updateStreak(userId);
    response.streak = {
      current: updatedStreak.streak_days,
      longest: updatedStreak.longest_streak,
      points: updatedStreak.points,
      isActive: updatedStreak.is_active
    };

    // 3. Recalculate points with streak multiplier
    const streakMultiplier = streakService.getStreakMultiplier(updatedStreak.streak_days);
    const finalPoints = Math.round(points * streakMultiplier);
    response.points = finalPoints;

    // 4. Update leaderboards (global, topic, problem, weekly)
    const globalRank = await leaderboardService.calculateGlobalRanking(userId);
    response.leaderboard.global = {
      rank: globalRank.rank,
      score: globalRank.score,
      solutions: globalRank.solutions_count
    };

    // Update topic leaderboard if available
    if (problemData.topicId) {
      await leaderboardService.calculateTopicRanking(userId, problemData.topicId);
    }

    // Update problem leaderboard
    await leaderboardService.calculateProblemRanking(problemId);

    // Update weekly leaderboard
    const weeklyEntry = await leaderboardService.updateLeaderboardEntry(
      userId,
      'weekly',
      null,
      null,
      finalPoints,
      1,
      solutionData.score || 0,
      0
    );

    // 5. Check and unlock achievements
    const context = {
      problemId,
      score: solutionData.score || 0,
      timeMs: solutionData.timeMs || 0,
      isPerfect: solutionData.isPerfect || false,
      streakDays: updatedStreak.streak_days,
      metadata: {
        difficulty: problemData.difficulty,
        solutionTimeMs: solutionData.timeMs
      }
    };

    const unlockedAchievements = await achievementService.checkAllAchievements(userId, context);
    response.achievements = unlockedAchievements.map(ach => ({
      badgeName: ach.badgeName,
      rarity: ach.rarity,
      points: ach.points,
      description: ach.description
    }));

    return response;
  } catch (error) {
    console.error('Error processing solution submission:', error);
    throw error;
  }
}

/**
 * Get complete gamification profile for a user
 * @param {UUID} userId - User ID
 * @returns {Promise<Object>} Complete gamification profile
 */
export async function getGameProfile(userId) {
  try {
    // Get all components in parallel
    const [achievements, streak, globalRank, streakMilestones] = await Promise.all([
      achievementService.getUnlockedAchievements(userId, 100),
      streakService.getStreakSummary(userId),
      leaderboardService.getUserRank(userId, 'global'),
      streakService.getStreakMilestones(userId)
    ]);

    const achievementPoints = achievements.reduce(
      (sum, ach) => sum + (ach.achievement_definitions?.points || 0),
      0
    );

    return {
      achievements: {
        total: achievements.length,
        points: achievementPoints,
        list: achievements
      },
      streak,
      leaderboard: {
        global: {
          rank: globalRank.rank || 0,
          score: globalRank.score || 0,
          solutions: globalRank.solutions_count || 0,
          avgScore: globalRank.avg_score || 0
        }
      },
      milestones: streakMilestones,
      totalGamificationPoints: achievementPoints + streak.points
    };
  } catch (error) {
    console.error('Error getting game profile:', error);
    throw error;
  }
}

/**
 * Get gamification dashboard (all leaderboards, achievements, streaks)
 * @param {UUID} userId - User ID
 * @returns {Promise<Object>} Complete dashboard data
 */
export async function getDashboard(userId) {
  try {
    // User's own data
    const gameProfile = await getGameProfile(userId);

    // Leaderboards
    const [globalLeaderboard, streakLeaderboard] = await Promise.all([
      leaderboardService.getLeaderboardPage('global', 1, 10),
      streakService.getTopStreaks(10)
    ]);

    return {
      userProfile: gameProfile,
      leaderboards: {
        global: globalLeaderboard,
        streak: streakLeaderboard
      },
      stats: {
        totalUsers: 0, // Would be fetched from users table
        totalSolutions: 0, // Would be aggregated
        averageScore: 0
      }
    };
  } catch (error) {
    console.error('Error getting dashboard:', error);
    throw error;
  }
}

/**
 * Get leaderboard with user's position
 * @param {string} scope - 'global' | 'topic' | 'problem' | 'weekly' | 'streak'
 * @param {UUID} userId - Current user for highlighting
 * @param {number} page - Page number
 * @param {number} pageSize - Results per page
 * @param {UUID} topicId - Optional filter
 * @param {UUID} problemId - Optional filter
 * @returns {Promise<Object>} Leaderboard with user position highlighted
 */
export async function getLeaderboardWithUserPosition(
  scope,
  userId,
  page = 1,
  pageSize = 50,
  topicId = null,
  problemId = null
) {
  try {
    const leaderboard = await leaderboardService.getLeaderboardPage(
      scope,
      page,
      pageSize,
      topicId,
      problemId
    );

    // Get user's rank
    const userRank = await leaderboardService.getUserRank(userId, scope, topicId, problemId);

    return {
      ...leaderboard,
      userPosition: {
        rank: userRank.rank,
        score: userRank.score,
        onCurrentPage: leaderboard.entries.some(e => e.user_id === userId)
      }
    };
  } catch (error) {
    console.error('Error getting leaderboard with user position:', error);
    throw error;
  }
}

/**
 * Get achievement progress for user
 * Shows which achievements are locked/unlocked and progress toward locked ones
 * @param {UUID} userId - User ID
 * @returns {Promise<Array>} Achievement progress data
 */
export async function getAchievementProgress(userId) {
  try {
    const allDefinitions = await achievementService.getAchievementDefinitions();
    const unlockedAchievements = await achievementService.getUnlockedAchievements(userId);

    const unlockedNames = new Set(unlockedAchievements.map(a => a.badge_name));

    const progress = await Promise.all(
      allDefinitions.map(async def => {
        const isUnlocked = unlockedNames.has(def.badge_name);

        if (isUnlocked) {
          const unlockedData = unlockedAchievements.find(a => a.badge_name === def.badge_name);
          return {
            badgeName: def.badge_name,
            description: def.description,
            category: def.category,
            rarity: def.rarity,
            points: def.points,
            isUnlocked: true,
            unlockedAt: unlockedData?.achieved_at
          };
        }

        // Get progress toward this achievement
        const progressData = await achievementService.getProgressTowards(userId, def.badge_name);

        return {
          badgeName: def.badge_name,
          description: def.description,
          category: def.category,
          rarity: def.rarity,
          points: def.points,
          isUnlocked: false,
          progress: progressData?.progress || {}
        };
      })
    );

    return progress;
  } catch (error) {
    console.error('Error getting achievement progress:', error);
    throw error;
  }
}

/**
 * Get user comparison (competing with other user)
 * @param {UUID} userId1 - First user
 * @param {UUID} userId2 - Second user
 * @returns {Promise<Object>} Comparison data
 */
export async function compareUsers(userId1, userId2) {
  try {
    const [profile1, profile2] = await Promise.all([
      getGameProfile(userId1),
      getGameProfile(userId2)
    ]);

    return {
      user1: {
        id: userId1,
        achievements: profile1.achievements.total,
        streak: profile1.streak.current,
        points: profile1.totalGamificationPoints,
        rank: profile1.leaderboard.global.rank
      },
      user2: {
        id: userId2,
        achievements: profile2.achievements.total,
        streak: profile2.streak.current,
        points: profile2.totalGamificationPoints,
        rank: profile2.leaderboard.global.rank
      },
      differences: {
        achievements: profile2.achievements.total - profile1.achievements.total,
        streak: profile2.streak.current - profile1.streak.current,
        points: profile2.totalGamificationPoints - profile1.totalGamificationPoints,
        rank: profile1.leaderboard.global.rank - profile2.leaderboard.global.rank // Lower is better
      }
    };
  } catch (error) {
    console.error('Error comparing users:', error);
    throw error;
  }
}

/**
 * Get difficulty-based point values
 * @private
 */
function getDifficultyPoints(difficulty) {
  const difficultyMap = {
    easy: 10,
    medium: 25,
    hard: 50
  };
  return difficultyMap[difficulty] || 10;
}

/**
 * Bulk recalculate leaderboards (admin/cron job)
 * Should be run periodically to refresh rankings
 * @returns {Promise<Object>} Summary of recalculation
 */
export async function recalculateLeaderboards() {
  try {
    // Get all users who have solutions
    const { data: users } = await supabaseAdmin
      .from('dsa_solutions')
      .select('DISTINCT user_id')
      .eq('status', 'submitted');

    if (!users) return { updated: 0 };

    let updateCount = 0;
    for (const { user_id } of users) {
      try {
        await leaderboardService.calculateGlobalRanking(user_id);
        updateCount++;
      } catch (e) {
        console.error(`Failed to recalculate ranking for user ${user_id}:`, e);
      }
    }

    return {
      updated: updateCount,
      total: users.length
    };
  } catch (error) {
    console.error('Error bulk recalculating leaderboards:', error);
    throw error;
  }
}

/**
 * Get seasonal summary (optional)
 * Could be used for special events/competitions
 * @param {string} season - e.g., 'spring_2026', 'april_2026'
 * @returns {Promise<Object>} Season leaderboard & stats
 */
export async function getSeasonalSummary(season) {
  try {
    // Parse season into date range
    // This is a placeholder - actual implementation would parse season string
    // and query leaderboards within that date range
    return {
      season,
      topPlayers: [],
      stats: {}
    };
  } catch (error) {
    console.error('Error getting seasonal summary:', error);
    throw error;
  }
}
