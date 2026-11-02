import { describe, it, expect } from 'vitest';
import { GamificationService } from '../../services/gamificationService.js';

describe('GamificationService Daily Streaks & Badges', () => {
  it('retrieves user gamification state with fallback defaults', async () => {
    const userId = '00000000-0000-0000-0000-000000000002';
    const state = await GamificationService.getUserGamificationState(userId);

    expect(state).toBeDefined();
    expect(state.streak).toBeDefined();
    expect(state.streak.user_id).toBe(userId);
    expect(state.badges).toBeInstanceOf(Array);
  });

  it('records practice activity and tracks streak progression', async () => {
    const userId = '00000000-0000-0000-0000-000000000003';
    const result = await GamificationService.recordActivity(userId, 'practice');

    expect(result).toBeDefined();
    expect(result.currentStreak).toBeGreaterThanOrEqual(1);
    expect(result.longestStreak).toBeGreaterThanOrEqual(1);
    expect(result.remainingFreezes).toBeDefined();
  });
});

