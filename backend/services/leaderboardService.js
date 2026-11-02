import { getRedisClient } from '../config/redis.js';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('leaderboard-service');

// In-memory fallback map if Redis is not configured in local environment
const inMemoryLeaderboards = new Map();

export class LeaderboardService {
  /**
   * Helper to get current ISO week number and year
   */
  static getWeeklyKey(date = new Date()) {
    const target = new Date(date.valueOf());
    const dayNr = (date.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
    const year = target.getFullYear();
    return `leaderboard:weekly:${year}_w${weekNumber}`;
  }

  /**
   * Record or increment user's challenge score in the weekly leaderboard
   */
  static async recordScore(userId, scorePoints) {
    const key = this.getWeeklyKey();
    const redis = getRedisClient();

    try {
      if (redis?.isOpen) {
        // Redis Sorted Set: ZINCRBY key scorePoints userId
        const newScore = await redis.zIncrBy(key, scorePoints, userId);
        logger.info('Recorded score in Redis leaderboard', { key, userId, scorePoints, newScore });
        return Number(newScore);
      }
    } catch (err) {
      logger.warn('Failed to update Redis leaderboard, falling back to memory', { error: err.message });
    }

    // In-memory fallback
    if (!inMemoryLeaderboards.has(key)) {
      inMemoryLeaderboards.set(key, new Map());
    }
    const board = inMemoryLeaderboards.get(key);
    const current = board.get(userId) || 0;
    const updated = current + scorePoints;
    board.set(userId, updated);
    return updated;
  }

  /**
   * Fetch top N users from the real-time leaderboard
   */
  static async getTopLeaderboard(limit = 50) {
    const key = this.getWeeklyKey();
    const redis = getRedisClient();

    try {
      if (redis?.isOpen) {
        // ZRANGE key 0 (limit - 1) REV WITHSCORES
        const rawResults = await redis.zRangeWithScores(key, 0, limit - 1, { REV: true });
        return await this.enrichLeaderboardUsers(rawResults.map((r, index) => ({
          userId: r.value,
          score: r.score,
          rank: index + 1,
        })));
      }
    } catch (err) {
      logger.warn('Failed to query Redis leaderboard, falling back to memory', { error: err.message });
    }

    // In-memory fallback
    const board = inMemoryLeaderboards.get(key) || new Map();
    const sorted = Array.from(board.entries())
      .map(([userId, score]) => ({ userId, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    return this.enrichLeaderboardUsers(sorted);
  }

  /**
   * Get specific user's current rank and score
   */
  static async getUserStanding(userId) {
    const key = this.getWeeklyKey();
    const redis = getRedisClient();

    try {
      if (redis?.isOpen) {
        const [score, rank] = await Promise.all([
          redis.zScore(key, userId),
          redis.zRevRank(key, userId),
        ]);

        return {
          score: score !== null ? Number(score) : 0,
          rank: rank !== null ? rank + 1 : null,
        };
      }
    } catch (err) {
      logger.warn('Failed to query user rank from Redis', { error: err.message });
    }

    // In-memory fallback
    const board = inMemoryLeaderboards.get(key) || new Map();
    const userScore = board.get(userId) || 0;
    if (userScore === 0) {
      return { score: 0, rank: null };
    }

    const allScores = Array.from(board.values()).sort((a, b) => b - a);
    const rank = allScores.indexOf(userScore) + 1;
    return { score: userScore, rank };
  }

  /**
   * Enrich user IDs with full_name and avatar from profiles
   */
  static async enrichLeaderboardUsers(entries) {
    if (!entries || entries.length === 0) return [];

    const userIds = entries.map((e) => e.userId).filter(Boolean);
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, designation, avatar_url')
      .in('id', userIds);

    const profileMap = new Map();
    (profiles || []).forEach((p) => profileMap.set(p.id, p));

    return entries.map((e) => {
      const p = profileMap.get(e.userId);
      return {
        ...e,
        name: p?.full_name || `Engineer ${String(e.userId).slice(0, 6)}`,
        designation: p?.designation || 'Software Engineer',
        avatarUrl: p?.avatar_url || null,
      };
    });
  }
}

