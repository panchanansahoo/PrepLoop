import { supabaseAdmin } from '../db/supabaseClient.js';
import { createLogger } from '../utils/structuredLogger.js';
import { applyCoinTransaction } from '../utils/coinTransactions.js';

const logger = createLogger('gamification-service');

const BADGES = {
  first_interview: { name: 'First Step', description: 'Completed your first mock interview', rewardCoins: 20 },
  peer_champion: { name: 'Peer Collaborator', description: 'Completed a real-time peer interview', rewardCoins: 30 },
  streak_7: { name: 'Week Warrior', description: 'Maintained a 7-day practice streak', rewardCoins: 50 },
  streak_30: { name: 'Monthly Master', description: 'Maintained a 30-day practice streak', rewardCoins: 150 },
  problem_solver: { name: 'Code Crusher', description: 'Solved 10 DSA practice problems', rewardCoins: 40 },
};

export class GamificationService {
  /**
   * Fetch user's current streak and badge status
   */
  static async getUserGamificationState(userId) {
    try {
      const [streakRes, badgesRes] = await Promise.all([
        supabaseAdmin.from('user_streaks').select('*').eq('user_id', userId).maybeSingle(),
        supabaseAdmin.from('user_badges').select('*').eq('user_id', userId),
      ]);

      const streakData = streakRes.data || {
        user_id: userId,
        current_streak: 0,
        longest_streak: 0,
        last_active_date: null,
        streak_freeze_count: 1,
      };

      const unlockedBadges = (badgesRes.data || []).map((b) => ({
        badgeCode: b.badge_code,
        unlockedAt: b.unlocked_at,
        ...(BADGES[b.badge_code] || { name: b.badge_code, description: '', rewardCoins: 0 }),
      }));

      return {
        streak: streakData,
        badges: unlockedBadges,
      };
    } catch (err) {
      logger.error('Error fetching gamification state', { userId, error: err.message });
      throw err;
    }
  }

  /**
   * Record daily activity and calculate streak transition
   */
  static async recordActivity(userId, activityType = 'practice') {
    try {
      const today = new Date().toISOString().split('T')[0];
      const yesterdayDate = new Date();
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterday = yesterdayDate.toISOString().split('T')[0];

      const { data: existing } = await supabaseAdmin
        .from('user_streaks')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      let currentStreak = existing?.current_streak || 0;
      let longestStreak = existing?.longest_streak || 0;
      let freezeCount = existing?.streak_freeze_count ?? 1;
      let streakUpdated = false;

      if (!existing) {
        currentStreak = 1;
        longestStreak = 1;
        streakUpdated = true;
      } else if (existing.last_active_date === today) {
        // Already recorded today, no streak increment needed
        streakUpdated = false;
      } else if (existing.last_active_date === yesterday) {
        // Consecutive day
        currentStreak += 1;
        if (currentStreak > longestStreak) longestStreak = currentStreak;
        streakUpdated = true;
      } else if (freezeCount > 0) {
        // Missed day but protected by streak freeze!
        freezeCount -= 1;
        currentStreak += 1;
        streakUpdated = true;
        logger.info('Streak freeze consumed for user', { userId, remainingFreezes: freezeCount });
      } else {
        // Streak reset
        currentStreak = 1;
        streakUpdated = true;
      }

      await supabaseAdmin.from('user_streaks').upsert({
        user_id: userId,
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_active_date: today,
        streak_freeze_count: freezeCount,
        updated_at: new Date().toISOString(),
      });

      // Check for streak-based badges
      const newBadges = [];
      if (currentStreak >= 7) {
        const awarded = await this.awardBadge(userId, 'streak_7');
        if (awarded) newBadges.push('streak_7');
      }
      if (currentStreak >= 30) {
        const awarded = await this.awardBadge(userId, 'streak_30');
        if (awarded) newBadges.push('streak_30');
      }

      if (activityType === 'peer_interview') {
        const awarded = await this.awardBadge(userId, 'peer_champion');
        if (awarded) newBadges.push('peer_champion');
      } else if (activityType === 'first_interview') {
        const awarded = await this.awardBadge(userId, 'first_interview');
        if (awarded) newBadges.push('first_interview');
      }

      return {
        currentStreak,
        longestStreak,
        streakUpdated,
        remainingFreezes: freezeCount,
        newBadges,
      };
    } catch (err) {
      logger.error('Error recording streak activity', { userId, error: err.message });
      throw err;
    }
  }

  /**
   * Award a badge and dispense coin rewards atomically
   */
  static async awardBadge(userId, badgeCode) {
    try {
      const badgeMeta = BADGES[badgeCode];
      if (!badgeMeta) return false;

      const { data: existing } = await supabaseAdmin
        .from('user_badges')
        .select('id')
        .eq('user_id', userId)
        .eq('badge_code', badgeCode)
        .maybeSingle();

      if (existing) return false; // Already unlocked

      const { error: insertError } = await supabaseAdmin
        .from('user_badges')
        .insert({
          user_id: userId,
          badge_code: badgeCode,
          metadata: { name: badgeMeta.name, description: badgeMeta.description },
        });

      if (insertError) {
        logger.warn('Failed to insert badge', { error: insertError.message, badgeCode });
        return false;
      }

      // Award bonus coins
      if (badgeMeta.rewardCoins > 0) {
        await applyCoinTransaction({
          userId,
          amount: badgeMeta.rewardCoins,
          type: 'earn',
          description: `Achievement Unlocked: ${badgeMeta.name}`,
          referenceKey: `badge:${badgeCode}:${userId}`,
        });
      }

      logger.info('Badge successfully unlocked', { userId, badgeCode, reward: badgeMeta.rewardCoins });
      return true;
    } catch (err) {
      logger.error('Error awarding badge', { userId, badgeCode, error: err.message });
      return false;
    }
  }

  /**
   * Purchase a streak freeze with coins
   */
  static async purchaseStreakFreeze(userId, costCoins = 50) {
    try {
      const { data: streak } = await supabaseAdmin
        .from('user_streaks')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      const currentFreezes = streak?.streak_freeze_count ?? 1;
      if (currentFreezes >= 5) {
        return { success: false, error: 'Maximum freeze capacity reached (5 freezes max)' };
      }

      const spendResult = await applyCoinTransaction({
        userId,
        amount: costCoins,
        type: 'spend',
        description: 'Purchased 1 Streak Freeze token',
        referenceKey: `buy_freeze:${userId}:${Date.now()}`,
      });

      if (!spendResult.success) {
        return { success: false, error: spendResult.error || 'Insufficient coin balance' };
      }

      await supabaseAdmin.from('user_streaks').upsert({
        user_id: userId,
        current_streak: streak?.current_streak || 0,
        longest_streak: streak?.longest_streak || 0,
        last_active_date: streak?.last_active_date || null,
        streak_freeze_count: currentFreezes + 1,
        updated_at: new Date().toISOString(),
      });

      return {
        success: true,
        streakFreezeCount: currentFreezes + 1,
        newBalance: spendResult.balance,
      };
    } catch (err) {
      logger.error('Error purchasing streak freeze', { userId, error: err.message });
      return { success: false, error: err.message };
    }
  }
}

