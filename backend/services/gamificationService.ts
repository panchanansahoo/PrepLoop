import { supabaseAdmin } from '../db/supabaseClient.js';
import { createLogger } from '../utils/structuredLogger.js';
import { applyCoinTransaction } from '../utils/coinTransactions.js';

const logger = createLogger('gamification-service');

export interface BadgeDefinition {
  name: string;
  description: string;
  rewardCoins: number;
}

const BADGES: Record<string, BadgeDefinition> = {
  first_interview: { name: 'First Step', description: 'Completed your first mock interview', rewardCoins: 20 },
  peer_champion: { name: 'Peer Collaborator', description: 'Completed a real-time peer interview', rewardCoins: 30 },
  streak_7: { name: 'Week Warrior', description: 'Maintained a 7-day practice streak', rewardCoins: 50 },
  streak_30: { name: 'Monthly Master', description: 'Maintained a 30-day practice streak', rewardCoins: 150 },
  problem_solver: { name: 'Code Crusher', description: 'Solved 10 DSA practice problems', rewardCoins: 40 },
};

export interface UserStreakState {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  streak_freeze_count: number;
}

export interface UserBadgeState {
  badgeCode: string;
  unlockedAt: string;
  name: string;
  description: string;
  rewardCoins: number;
}

export interface GamificationState {
  streak: UserStreakState;
  badges: UserBadgeState[];
}

export class GamificationService {
  /**
   * Fetch user's current streak and badge status
   */
  static async getUserGamificationState(userId: string): Promise<GamificationState> {
    try {
      const [streakRes, badgesRes] = await Promise.all([
        supabaseAdmin.from('user_streaks').select('*').eq('user_id', userId).maybeSingle(),
        supabaseAdmin.from('user_badges').select('*').eq('user_id', userId),
      ]);

      const streakData: UserStreakState = streakRes.data || {
        user_id: userId,
        current_streak: 0,
        longest_streak: 0,
        last_active_date: null,
        streak_freeze_count: 1,
      };

      const unlockedBadges: UserBadgeState[] = (badgesRes.data || []).map((b: any) => ({
        badgeCode: b.badge_code,
        unlockedAt: b.unlocked_at,
        ...(BADGES[b.badge_code] || { name: b.badge_code, description: '', rewardCoins: 0 }),
      }));

      return {
        streak: streakData,
        badges: unlockedBadges,
      };
    } catch (err: any) {
      logger.error('Error fetching gamification state', { userId, error: err.message });
      throw err;
    }
  }

  /**
   * Record daily activity and calculate streak transition
   */
  static async recordActivity(userId: string, activityType = 'practice'): Promise<UserStreakState> {
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

      if (!existing) {
        // Initial streak creation
        const { data: created, error } = await supabaseAdmin
          .from('user_streaks')
          .insert({
            user_id: userId,
            current_streak: 1,
            longest_streak: 1,
            last_active_date: today,
            streak_freeze_count: 1,
          })
          .select()
          .single();

        if (error) throw error;
        logger.info('Initialized streak for user', { userId, streak: 1 });
        return created;
      }

      // Already active today — no change needed
      if (existing.last_active_date === today) {
        return existing;
      }

      let newStreak = existing.current_streak;
      let freezes = existing.streak_freeze_count;

      if (existing.last_active_date === yesterday) {
        // Continuous streak
        newStreak += 1;
      } else {
        // Missed one or more days: check if streak freeze can protect it
        if (freezes > 0) {
          freezes -= 1;
          newStreak += 1; // preserved
          logger.info('Streak freeze consumed for user', { userId, remainingFreezes: freezes });
        } else {
          // Reset streak to 1
          newStreak = 1;
        }
      }

      const longest = Math.max(newStreak, existing.longest_streak || 0);

      const { data: updated, error } = await supabaseAdmin
        .from('user_streaks')
        .update({
          current_streak: newStreak,
          longest_streak: longest,
          last_active_date: today,
          streak_freeze_count: freezes,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      // Check milestones for streak badge awards
      if (newStreak >= 7) {
        await this.awardBadge(userId, 'streak_7');
      }
      if (newStreak >= 30) {
        await this.awardBadge(userId, 'streak_30');
      }

      return updated;
    } catch (err: any) {
      logger.error('Failed to record activity streak', { userId, error: err.message });
      throw err;
    }
  }

  /**
   * Unlock a badge for user and award coins atomically
   */
  static async awardBadge(userId: string, badgeCode: string): Promise<boolean> {
    const badgeDef = BADGES[badgeCode];
    if (!badgeDef) return false;

    try {
      const { data: existing } = await supabaseAdmin
        .from('user_badges')
        .select('id')
        .eq('user_id', userId)
        .eq('badge_code', badgeCode)
        .maybeSingle();

      if (existing) {
        return false; // Already unlocked
      }

      await supabaseAdmin.from('user_badges').insert({
        user_id: userId,
        badge_code: badgeCode,
      });

      if (badgeDef.rewardCoins > 0) {
        await (applyCoinTransaction as any)({
          userId,
          amount: badgeDef.rewardCoins,
          type: 'credit',
          reason: `Badge Unlocked: ${badgeDef.name}`,
          referenceKey: `badge_${badgeCode}_${userId}`,
        });
      }

      logger.info('Awarded badge to user', { userId, badgeCode, reward: badgeDef.rewardCoins });
      return true;
    } catch (err: any) {
      logger.error('Failed to award badge', { userId, badgeCode, error: err.message });
      return false;
    }
  }

  /**
   * Purchase a streak freeze with user coins
   */
  static async purchaseStreakFreeze(userId: string): Promise<{ success: boolean; remainingFreezes: number; error?: string }> {
    const FREEZE_COST = 50;

    try {
      const { data: streak } = await supabaseAdmin
        .from('user_streaks')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      const currentFreezes = streak?.streak_freeze_count || 0;
      if (currentFreezes >= 5) {
        return { success: false, remainingFreezes: currentFreezes, error: 'Maximum freeze capacity reached (5)' };
      }

      // Debit coins atomically
      const tx = await (applyCoinTransaction as any)({
        userId,
        amount: -FREEZE_COST,
        type: 'debit',
        reason: 'Purchased Streak Freeze',
        referenceKey: `freeze_purchase_${Date.now()}_${userId}`,
      });

      if (!tx?.success) {
        return { success: false, remainingFreezes: currentFreezes, error: 'Insufficient coins balance' };
      }

      const { data: updated } = await supabaseAdmin
        .from('user_streaks')
        .upsert({
          user_id: userId,
          streak_freeze_count: currentFreezes + 1,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      return { success: true, remainingFreezes: updated?.streak_freeze_count || currentFreezes + 1 };
    } catch (err: any) {
      logger.error('Failed to purchase streak freeze', { userId, error: err.message });
      return { success: false, remainingFreezes: 0, error: err.message };
    }
  }
}
