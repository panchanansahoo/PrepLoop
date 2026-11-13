import { describe, it, expect, vi, beforeEach } from 'vitest';

const { streakRows, badgeRows, mockSupabaseAdmin } = vi.hoisted(() => {
  const streakRows = new Map<string, any>();
  const badgeRows = new Map<string, any[]>();

  const mockSupabaseAdmin = {
    from: vi.fn((table: string) => {
      if (table === 'user_streaks') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn((_col: string, userId: string) => ({
              maybeSingle: vi.fn(async () => ({
                data: streakRows.get(userId) ?? null,
                error: null,
              })),
            })),
          })),
          insert: vi.fn((row: any) => ({
            select: vi.fn(() => ({
              single: vi.fn(async () => {
                streakRows.set(row.user_id, { ...row });
                return { data: { ...row }, error: null };
              }),
            })),
          })),
          update: vi.fn((patch: any) => ({
            eq: vi.fn((_col: string, userId: string) => ({
              select: vi.fn(() => ({
                single: vi.fn(async () => {
                  const updated = { ...(streakRows.get(userId) || {}), ...patch, user_id: userId };
                  streakRows.set(userId, updated);
                  return { data: updated, error: null };
                }),
              })),
            })),
          })),
        };
      }

      if (table === 'user_badges') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn((_col: string, userId: string) => ({
              maybeSingle: vi.fn(async () => ({ data: null, error: null })),
              then: (resolve: any) =>
                resolve({ data: badgeRows.get(userId) ?? [], error: null }),
            })),
          })),
        };
      }

      return {};
    }),
  };

  return { streakRows, badgeRows, mockSupabaseAdmin };
});

vi.mock('../../db/supabaseClient.js', () => ({
  supabase: mockSupabaseAdmin,
  supabaseAdmin: mockSupabaseAdmin,
  _supabaseAdmin: mockSupabaseAdmin,
  default: mockSupabaseAdmin,
}));

import { GamificationService } from '../../services/gamificationService.ts';

describe('GamificationService Daily Streaks & Badges', () => {
  beforeEach(() => {
    streakRows.clear();
    badgeRows.clear();
  });

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
    expect(result.current_streak).toBeGreaterThanOrEqual(1);
    expect(result.longest_streak).toBeGreaterThanOrEqual(1);
    expect(result.streak_freeze_count).toBeDefined();
  });
});

