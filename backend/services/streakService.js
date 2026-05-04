import { supabaseAdmin } from '../db/supabaseClient.js';

/**
 * Streak Service
 * Manages user activity streaks (consecutive days/weeks of solving)
 * Updates streaks after each solution, handles expirations
 */

/**
 * Update streak after user solves a problem
 * @param {UUID} userId - User ID
 * @returns {Promise<Object>} Updated streak info
 */
export async function updateStreak(userId) {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get current streak
    const { data: currentStreak } = await supabaseAdmin
      .from('user_streaks')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!currentStreak) {
      // First streak entry
      const { data: newStreak } = await supabaseAdmin
        .from('user_streaks')
        .insert({
          user_id: userId,
          streak_days: 1,
          longest_streak: 1,
          streak_start: today,
          last_activity_date: today,
          is_active: true,
          points: getStreakBonus(1)
        })
        .select()
        .single();

      return newStreak;
    }

    const lastActivity = currentStreak.last_activity_date;
    const lastDate = new Date(lastActivity);
    const today_date = new Date(today);
    const daysDiff = Math.floor((today_date - lastDate) / (1000 * 60 * 60 * 24));

    let newStreakDays = currentStreak.streak_days;
    let newLongestStreak = currentStreak.longest_streak;
    let isActive = currentStreak.is_active;
    let streakStart = currentStreak.streak_start;

    if (daysDiff === 0) {
      // Already solved today, no streak update
      return currentStreak;
    } else if (daysDiff === 1) {
      // Consecutive day, increment streak
      newStreakDays = currentStreak.streak_days + 1;
      if (newStreakDays > newLongestStreak) {
        newLongestStreak = newStreakDays;
      }
    } else if (daysDiff > 1) {
      // Streak broken, reset
      newStreakDays = 1;
      isActive = false; // Mark as broken
      streakStart = today;
    }

    const updatedStreak = {
      streak_days: newStreakDays,
      longest_streak: newLongestStreak,
      streak_start: streakStart,
      last_activity_date: today,
      is_active: daysDiff <= 1, // Active if consecutive or same day
      points: getStreakBonus(newStreakDays),
      updated_at: new Date().toISOString()
    };

    const { data: result } = await supabaseAdmin
      .from('user_streaks')
      .update(updatedStreak)
      .eq('user_id', userId)
      .select()
      .single();

    return result;
  } catch (error) {
    console.error('Error updating streak:', error);
    throw error;
  }
}

/**
 * Get current streak for a user
 * @param {UUID} userId - User ID
 * @returns {Promise<Object|null>} Current streak details
 */
export async function getCurrentStreak(userId) {
  try {
    const { data: streak } = await supabaseAdmin
      .from('user_streaks')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!streak) {
      return {
        streak_days: 0,
        longest_streak: 0,
        is_active: false,
        points: 0
      };
    }

    // Check if streak is still active (within 24h)
    const lastActivity = new Date(streak.last_activity_date);
    const now = new Date();
    const hoursSinceActivity = (now - lastActivity) / (1000 * 60 * 60);

    const isStillActive = hoursSinceActivity <= 48; // 48 hour grace period

    return {
      ...streak,
      is_active: isStillActive,
      points: getStreakBonus(streak.streak_days)
    };
  } catch (error) {
    console.error('Error getting current streak:', error);
    return {
      streak_days: 0,
      longest_streak: 0,
      is_active: false,
      points: 0
    };
  }
}

/**
 * Get longest streak record
 * @param {UUID} userId - User ID
 * @returns {Promise<number>} Longest consecutive days
 */
export async function getLongestStreak(userId) {
  try {
    const { data: streak } = await supabaseAdmin
      .from('user_streaks')
      .select('longest_streak')
      .eq('user_id', userId)
      .single();

    return streak?.longest_streak || 0;
  } catch (error) {
    console.error('Error getting longest streak:', error);
    return 0;
  }
}

/**
 * Get streak multiplier for points calculation
 * Formula: 1.0 + (min(100, streakDays) * 0.01), capped at 1.5x
 * @param {number} streakDays - Current streak length
 * @returns {number} Multiplier (1.0 to 1.5)
 */
export function getStreakMultiplier(streakDays) {
  const cappedDays = Math.min(100, streakDays);
  return 1 + (cappedDays * 0.01);
}

/**
 * Get bonus points for streak
 * Base: 10 points per day, multiplied by streak multiplier
 * @param {number} streakDays - Current streak length
 * @returns {number} Bonus points
 */
export function getStreakBonus(streakDays) {
  const baseBonus = 10 * streakDays;
  const multiplier = getStreakMultiplier(streakDays);
  return Math.round(baseBonus * multiplier);
}

/**
 * Reset expired streaks (cron job - run daily)
 * Resets streaks that haven't had activity in 48+ hours
 * @returns {Promise<number>} Number of streaks reset
 */
export async function resetExpiredStreaks() {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 2); // 48 hours ago
    const cutoffStr = cutoffDate.toISOString().split('T')[0];

    const { data: expiredStreaks } = await supabaseAdmin
      .from('user_streaks')
      .select('user_id, longest_streak')
      .lt('last_activity_date', cutoffStr)
      .eq('is_active', true);

    if (!expiredStreaks || expiredStreaks.length === 0) {
      return 0;
    }

    // Reset all expired streaks
    const { error } = await supabaseAdmin
      .from('user_streaks')
      .update({
        streak_days: 0,
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .lt('last_activity_date', cutoffStr)
      .eq('is_active', true);

    if (error) throw error;

    return expiredStreaks.length;
  } catch (error) {
    console.error('Error resetting expired streaks:', error);
    throw error;
  }
}

/**
 * Get top streaks (leaderboard)
 * @param {number} limit - Number of results
 * @returns {Promise<Array>} Users with active streaks
 */
export async function getTopStreaks(limit = 50) {
  try {
    const { data: topStreaks } = await supabaseAdmin
      .from('user_streaks')
      .select('user_id, streak_days, longest_streak, is_active, points')
      .eq('is_active', true)
      .order('streak_days', { ascending: false })
      .limit(limit);

    return topStreaks || [];
  } catch (error) {
    console.error('Error getting top streaks:', error);
    return [];
  }
}

/**
 * Get streak milestones for a user
 * Returns achievements unlocked (7-day, 30-day, 100-day, etc.)
 * @param {UUID} userId - User ID
 * @returns {Promise<Array>} Unlocked milestone info
 */
export async function getStreakMilestones(userId) {
  try {
    const { data: streak } = await supabaseAdmin
      .from('user_streaks')
      .select('longest_streak')
      .eq('user_id', userId)
      .single();

    if (!streak) return [];

    const milestones = [
      { days: 7, name: 'streak_7', label: '7-Day Streak' },
      { days: 14, name: 'streak_14', label: '14-Day Streak' },
      { days: 30, name: 'streak_30', label: '30-Day Streak' },
      { days: 60, name: 'streak_60', label: '60-Day Streak' },
      { days: 100, name: 'streak_100', label: '100-Day Streak' }
    ];

    return milestones
      .filter(m => streak.longest_streak >= m.days)
      .map(m => ({
        ...m,
        achieved: true,
        unlockedOn: new Date().toISOString() // Would be actual unlock date from achievements table
      }));
  } catch (error) {
    console.error('Error getting streak milestones:', error);
    return [];
  }
}

/**
 * Get user's full streak summary
 * @param {UUID} userId - User ID
 * @returns {Promise<Object>} Complete streak stats
 */
export async function getStreakSummary(userId) {
  try {
    const { data: streak } = await supabaseAdmin
      .from('user_streaks')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!streak) {
      return {
        current: 0,
        longest: 0,
        isActive: false,
        points: 0,
        multiplier: 1.0,
        nextMilestone: 7,
        daysToNextMilestone: 7
      };
    }

    const multiplier = getStreakMultiplier(streak.streak_days);
    const milestones = [7, 14, 30, 60, 100];
    const nextMilestone = milestones.find(m => m > streak.streak_days) || 100;
    const daysToNext = nextMilestone - streak.streak_days;

    return {
      current: streak.streak_days,
      longest: streak.longest_streak,
      isActive: streak.is_active,
      points: streak.points,
      multiplier: Math.round(multiplier * 100) / 100,
      nextMilestone,
      daysToNextMilestone: daysToNext,
      streakStart: streak.streak_start,
      lastActivity: streak.last_activity_date
    };
  } catch (error) {
    console.error('Error getting streak summary:', error);
    throw error;
  }
}

/**
 * Check if user solved today
 * @param {UUID} userId - User ID
 * @returns {Promise<boolean>} True if user has solved today
 */
export async function hasSolvedToday(userId) {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { count } = await supabaseAdmin
      .from('dsa_solutions')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('status', 'submitted')
      .gte('submitted_at', `${today}T00:00:00`)
      .lte('submitted_at', `${today}T23:59:59`);

    return (count || 0) > 0;
  } catch (error) {
    console.error('Error checking if user solved today:', error);
    return false;
  }
}

/**
 * Recalculate streaks from activity history
 * Used for data cleanup/corrections (one-time admin task)
 * @param {UUID} userId - User ID
 * @returns {Promise<Object>} Recalculated streak
 */
export async function recalculateStreak(userId) {
  try {
    // Get all solved problems in chronological order
    const { data: solutions } = await supabaseAdmin
      .from('dsa_solutions')
      .select('submitted_at')
      .eq('user_id', userId)
      .eq('status', 'submitted')
      .order('submitted_at', { ascending: true });

    if (!solutions || solutions.length === 0) {
      // No solutions, reset streak
      return await supabaseAdmin
        .from('user_streaks')
        .update({
          streak_days: 0,
          longest_streak: 0,
          is_active: false,
          streak_start: null,
          last_activity_date: null
        })
        .eq('user_id', userId)
        .select()
        .single();
    }

    // Calculate streaks from activity dates
    const dates = solutions.map(s => new Date(s.submitted_at).toISOString().split('T')[0]);
    const uniqueDates = [...new Set(dates)].sort();

    let currentStreak = 1;
    let longestStreak = 1;
    let streakStart = uniqueDates[0];

    for (let i = 1; i < uniqueDates.length; i++) {
      const prevDate = new Date(uniqueDates[i - 1]);
      const currDate = new Date(uniqueDates[i]);
      const daysDiff = Math.floor((currDate - prevDate) / (1000 * 60 * 60 * 24));

      if (daysDiff === 1) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else if (daysDiff > 1) {
        currentStreak = 1;
        streakStart = uniqueDates[i];
      }
    }

    const today = new Date().toISOString().split('T')[0];
    const lastDate = uniqueDates[uniqueDates.length - 1];
    const daysSinceLast = Math.floor((new Date(today) - new Date(lastDate)) / (1000 * 60 * 60 * 24));

    const isActive = daysSinceLast <= 1;
    if (daysSinceLast > 1) {
      currentStreak = 0;
    }

    return await supabaseAdmin
      .from('user_streaks')
      .update({
        streak_days: currentStreak,
        longest_streak: longestStreak,
        streak_start: streakStart,
        last_activity_date: lastDate,
        is_active: isActive
      })
      .eq('user_id', userId)
      .select()
      .single();
  } catch (error) {
    console.error('Error recalculating streak:', error);
    throw error;
  }
}
