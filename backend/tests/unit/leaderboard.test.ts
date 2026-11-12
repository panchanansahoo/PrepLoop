import { describe, it, expect } from 'vitest';
import { LeaderboardService } from '../../services/leaderboardService.ts';

describe('LeaderboardService Real-Time Ranking', () => {
  it('generates consistent ISO weekly keys', () => {
    const key = LeaderboardService.getWeeklyKey(new Date('2026-11-02T12:00:00Z'));
    expect(key).toMatch(/^leaderboard:weekly:\d{4}_w\d+$/);
  });

  it('records scores and computes accurate ranking orders', async () => {
    const userA = '00000000-0000-0000-0000-000000000010';
    const userB = '00000000-0000-0000-0000-000000000020';

    await LeaderboardService.recordScore(userA, 50);
    await LeaderboardService.recordScore(userB, 75);

    const leaderboard = await LeaderboardService.getTopLeaderboard(10);
    expect(leaderboard.length).toBeGreaterThanOrEqual(2);

    const standingB = await LeaderboardService.getUserStanding(userB);
    const standingA = await LeaderboardService.getUserStanding(userA);

    expect(standingB.score).toBeGreaterThanOrEqual(75);
    expect(standingA.score).toBeGreaterThanOrEqual(50);
    expect(standingB.rank).toBeLessThanOrEqual(standingA.rank!);
  });
});

