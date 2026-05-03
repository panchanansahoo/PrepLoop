/**
 * Tests for Hint Service - Phase 1.1
 * Tests: Cooldown logic, first-reveal detection, analytics tracking
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import HintService from '../services/hintService.js';

describe('HintService', () => {
  let hintService;
  let mockSupabase;

  const mockUserId = 'user-123';
  const mockProblemId = 1;

  beforeEach(() => {
    // Create chainable mock Supabase client
    mockSupabase = {
      from: (table) => ({
        select: (columns) => ({
          eq: (field, value) => ({
            eq: (field2, value2) => ({
              eq: (field3, value3) => ({
                single: async () => mockSupabase._lastQueryResult,
              }),
              single: async () => mockSupabase._lastQueryResult,
            }),
            single: async () => mockSupabase._lastQueryResult,
          }),
          single: async () => mockSupabase._lastQueryResult,
        }),
        update: (data) => ({
          eq: (field, value) => ({
            eq: (field2, value2) => ({
              eq: (field3, value3) => mockSupabase._lastUpdateChain,
            }),
          }),
        }),
        insert: async (data) => mockSupabase._lastInsertResult,
      }),
      _lastQueryResult: {},
      _lastUpdateChain: { error: null },
      _lastInsertResult: { error: null },
    };

    hintService = new HintService(mockSupabase);
  });

  describe('getHint', () => {
    it('should reveal first hint without cooldown', async () => {
      mockSupabase._lastQueryResult = {
        data: {
          hints: {
            approach: 'Think about using a hash map',
            code: 'Use a dictionary to track seen values',
            edge_case: 'Watch out for duplicates',
          },
        },
        error: null,
      };

      // Mock first reveal (no existing record)
      mockSupabase.from = vi.fn((table) => {
        if (table === 'problems') {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({
                  data: {
                    hints: {
                      approach: 'Think about using a hash map',
                      code: 'Use a dictionary',
                      edge_case: 'Watch for duplicates',
                    },
                  },
                  error: null,
                }),
              }),
            }),
          };
        }

        if (table === 'user_hint_usage') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  eq: () => ({
                    single: async () => ({
                      data: null,
                      error: { code: 'PGRST116' },
                    }),
                  }),
                }),
              }),
            }),
            insert: async () => ({ error: null }),
          };
        }
      });

      const result = await hintService.getHint(mockUserId, mockProblemId, 'approach');

      expect(result.can_reveal).toBe(true);
      expect(result.first_reveal).toBe(true);
      expect(result.cooldown_remaining_seconds).toBe(0);
      expect(result.hint_text).toContain('hash map');
    });

    it('should enforce cooldown on subsequent reveals', async () => {
      const now = new Date();
      const cooldownUntil = new Date(now.getTime() + 2 * 60 * 1000); // 2 minutes from now

      mockSupabase.from = vi.fn((table) => {
        if (table === 'problems') {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({
                  data: {
                    hints: { approach: 'Think hash map' },
                  },
                  error: null,
                }),
              }),
            }),
          };
        }

        if (table === 'user_hint_usage') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  eq: () => ({
                    single: async () => ({
                      data: {
                        revealed_at: now.toISOString(),
                        cooldown_until: cooldownUntil.toISOString(),
                      },
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }
      });

      const result = await hintService.getHint(mockUserId, mockProblemId, 'approach');

      expect(result.can_reveal).toBe(false);
      expect(result.first_reveal).toBe(false);
      expect(result.cooldown_remaining_seconds).toBeGreaterThan(0);
      expect(result.cooldown_remaining_seconds).toBeLessThanOrEqual(120);
      expect(result.hint_text).toBeNull();
    });

    it('should allow reveal after cooldown expires', async () => {
      const now = new Date();
      const pastCooldown = new Date(now.getTime() - 1000); // 1 second ago

      mockSupabase.from = vi.fn((table) => {
        if (table === 'problems') {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({
                  data: {
                    hints: { approach: 'Use a hash map' },
                  },
                  error: null,
                }),
              }),
            }),
          };
        }

        if (table === 'user_hint_usage') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  eq: () => ({
                    single: async () => ({
                      data: {
                        revealed_at: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
                        cooldown_until: pastCooldown.toISOString(),
                      },
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
            update: () => ({
              eq: () => ({
                eq: () => ({
                  eq: () => Promise.resolve({ error: null }),
                }),
              }),
            }),
          };
        }
      });

      const result = await hintService.getHint(mockUserId, mockProblemId, 'approach');

      expect(result.can_reveal).toBe(true);
      expect(result.first_reveal).toBe(false);
      expect(result.cooldown_remaining_seconds).toBe(0);
      expect(result.hint_text).toContain('hash map');
    });

    it('should reject invalid hint type', async () => {
      await expect(hintService.getHint(mockUserId, mockProblemId, 'invalid_type')).rejects.toThrow(
        /Invalid hint type/
      );
    });

    it('should handle missing problem', async () => {
      mockSupabase.from = vi.fn((table) => {
        if (table === 'problems') {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({
                  data: null,
                  error: { message: 'Not found' },
                }),
              }),
            }),
          };
        }
      });

      await expect(hintService.getHint(mockUserId, mockProblemId, 'approach')).rejects.toThrow(
        /Problem not found/
      );
    });

    it('should all 3 hint types independently', async () => {
      // Each hint type has its own cooldown
      mockSupabase.from = vi.fn((table) => {
        if (table === 'problems') {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({
                  data: {
                    hints: {
                      approach: 'Algorithm hint',
                      code: 'Code hint',
                      edge_case: 'Edge case hint',
                    },
                  },
                  error: null,
                }),
              }),
            }),
          };
        }

        if (table === 'user_hint_usage') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  eq: () => ({
                    single: async () => ({
                      data: null,
                      error: { code: 'PGRST116' },
                    }),
                  }),
                }),
              }),
            }),
            insert: async () => ({ error: null }),
          };
        }
      });

      for (const hintType of ['approach', 'code', 'edge_case']) {
        const result = await hintService.getHint(mockUserId, mockProblemId, hintType);
        expect(result.can_reveal).toBe(true);
        expect(result.first_reveal).toBe(true);
        expect(result.hint_text).toContain('hint');
      }
    });
  });

  describe('getUserHintStatistics', () => {
    it('should aggregate hint usage by type', async () => {
      mockSupabase.from = vi.fn((table) => {
        if (table === 'user_hint_usage') {
          return {
            select: () => ({
              eq: async () => ({
                data: [
                  { problem_id: 1, hint_type: 'approach', revealed_at: '2026-05-03T10:00:00Z' },
                  { problem_id: 1, hint_type: 'code', revealed_at: '2026-05-03T10:05:00Z' },
                  { problem_id: 2, hint_type: 'approach', revealed_at: '2026-05-03T11:00:00Z' },
                  { problem_id: 3, hint_type: 'edge_case', revealed_at: '2026-05-03T12:00:00Z' },
                ],
                error: null,
              }),
            }),
          };
        }
      });

      const stats = await hintService.getUserHintStatistics(mockUserId);

      expect(stats.total_hints_revealed).toBe(4);
      expect(stats.by_type.approach).toBe(2);
      expect(stats.by_type.code).toBe(1);
      expect(stats.by_type.edge_case).toBe(1);
      expect(stats.problems_with_hints).toBe(3);
    });

    it('should handle user with no hints revealed', async () => {
      mockSupabase.from = vi.fn((table) => {
        if (table === 'user_hint_usage') {
          return {
            select: () => ({
              eq: async () => ({
                data: [],
                error: null,
              }),
            }),
          };
        }
      });

      const stats = await hintService.getUserHintStatistics(mockUserId);

      expect(stats.total_hints_revealed).toBe(0);
      expect(stats.by_type.approach).toBe(0);
      expect(stats.problems_with_hints).toBe(0);
    });
  });

  describe('updateHints', () => {
    it('should update problem hints', async () => {
      const newHints = {
        approach: 'Updated approach',
        code: 'Updated code',
        edge_case: 'Updated edge case',
      };

      mockSupabase.from = vi.fn((table) => {
        if (table === 'problems') {
          return {
            update: () => ({
              eq: () => ({
                select: async () => ({
                  data: [{ id: mockProblemId, hints: newHints }],
                  error: null,
                }),
              }),
            }),
          };
        }
      });

      const result = await hintService.updateHints(mockProblemId, newHints);

      expect(result.id).toBe(mockProblemId);
      expect(result.hints).toEqual(newHints);
    });

    it('should validate hint structure', async () => {
      await expect(hintService.updateHints(mockProblemId, null)).rejects.toThrow(
        /Hints must be an object/
      );

      await expect(hintService.updateHints(mockProblemId, 'invalid')).rejects.toThrow(
        /Hints must be an object/
      );
    });

    it('should handle missing fields in hints object', async () => {
      mockSupabase.from = vi.fn((table) => {
        if (table === 'problems') {
          return {
            update: (data) => ({
              eq: () => ({
                select: async () => ({
                  data: [{ id: mockProblemId, hints: data.hints }],
                  error: null,
                }),
              }),
            }),
          };
        }
      });

      const partialHints = { approach: 'Only approach' };
      const result = await hintService.updateHints(mockProblemId, partialHints);

      expect(result.hints.approach).toBe('Only approach');
      expect(result.hints.code).toBe('');
      expect(result.hints.edge_case).toBe('');
    });
  });

  describe('resetHintCooldown', () => {
    it('should reset cooldown for admin override', async () => {
      mockSupabase.from = vi.fn((table) => {
        if (table === 'user_hint_usage') {
          return {
            update: () => ({
              eq: () => ({
                eq: () => ({
                  eq: () => Promise.resolve({ error: null }),
                }),
              }),
            }),
          };
        }
      });

      await expect(
        hintService.resetHintCooldown(mockUserId, mockProblemId, 'approach')
      ).resolves.not.toThrow();
    });
  });
});
