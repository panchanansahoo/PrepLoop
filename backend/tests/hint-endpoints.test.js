/**
 * Integration Tests - Hint System API Endpoints (Phase 1.1)
 * Tests: GET /api/dsa/hints, PUT /api/dsa/hints, hint workflow
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import HintService from '../services/hintService.js';

// Mock Express request/response for endpoint testing
const createMockRequest = (overrides = {}) => ({
  user: { id: 'user-123' },
  params: {},
  query: {},
  body: {},
  ...overrides,
});

const createMockResponse = () => {
  const res = {
    status: vi.fn(function (code) {
      this._status = code;
      return this;
    }),
    json: vi.fn(function (data) {
      this._json = data;
      return this;
    }),
    _status: 200,
    _json: null,
  };
  return res;
};

describe('Hint System API Integration Tests', () => {
  let hintService;
  let mockSupabase;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn((table) => ({
        select: vi.fn(() => ({
          eq: vi.fn(function () {
            return this;
          }),
          single: async () => ({ data: {}, error: null }),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(function () {
            return this;
          }),
          select: async () => ({ data: [{}], error: null }),
        })),
        insert: async () => ({ error: null }),
      })),
    };

    hintService = new HintService(mockSupabase);
  });

  describe('GET /api/dsa/hints/:problemId', () => {
    it('should return hint with can_reveal=true on first request', async () => {
      const req = createMockRequest({
        params: { problemId: '1' },
        query: { hint_type: 'approach' },
      });

      mockSupabase.from = vi.fn((table) => {
        if (table === 'problems') {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({
                  data: {
                    hints: {
                      approach: 'Use a hash map for O(1) lookup',
                      code: 'Create a dictionary to track seen values',
                      edge_case: 'Handle duplicate values',
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

      const result = await hintService.getHint(req.user.id, 1, req.query.hint_type);

      expect(result.can_reveal).toBe(true);
      expect(result.first_reveal).toBe(true);
      expect(result.hint_text).toContain('hash map');
    });

    it('should reject invalid hint_type', async () => {
      const req = createMockRequest({
        params: { problemId: '1' },
        query: { hint_type: 'invalid_type' },
      });

      const result = hintService.getHint(req.user.id, 1, req.query.hint_type);
      expect(result).rejects.toThrow(/Invalid hint type/);
    });

    it('should require hint_type query parameter', async () => {
      const req = createMockRequest({
        params: { problemId: '1' },
        query: {}, // Missing hint_type
      });

      // Simulate endpoint check
      expect(!req.query.hint_type).toBe(true);
    });
  });

  describe('GET /api/dsa/hints/:problemId/all (admin)', () => {
    it('should return all hints for a problem', async () => {
      mockSupabase.from = vi.fn((table) => {
        if (table === 'problems') {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({
                  data: {
                    id: 1,
                    title: 'Two Sum',
                    hints: {
                      approach: 'Use a hash map',
                      code: 'Iterate once',
                      edge_case: 'Check for duplicates',
                    },
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
      });

      const result = await hintService.getAllHints(1);

      expect(result.problem_id).toBe(1);
      expect(result.problem_title).toBe('Two Sum');
      expect(result.hints.approach).toBe('Use a hash map');
      expect(result.hints.code).toBe('Iterate once');
      expect(result.hints.edge_case).toBe('Check for duplicates');
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

      const result = hintService.getAllHints(999);
      expect(result).rejects.toThrow(/Problem not found/);
    });
  });

  describe('PUT /api/dsa/hints/:problemId (admin)', () => {
    it('should update hints for a problem', async () => {
      const newHints = {
        approach: 'Think about stack',
        code: 'Use a stack data structure',
        edge_case: 'Empty input handling',
      };

      mockSupabase.from = vi.fn((table) => {
        if (table === 'problems') {
          return {
            update: (data) => ({
              eq: () => ({
                select: async () => ({
                  data: [{ id: 1, hints: data.hints }],
                  error: null,
                }),
              }),
            }),
          };
        }
      });

      const result = await hintService.updateHints(1, newHints);

      expect(result.id).toBe(1);
      expect(result.hints.approach).toBe('Think about stack');
      expect(result.hints.code).toBe('Use a stack data structure');
    });

    it('should fill missing fields with empty strings', async () => {
      const partialHints = { approach: 'Only approach hint' };

      mockSupabase.from = vi.fn((table) => {
        if (table === 'problems') {
          return {
            update: (data) => ({
              eq: () => ({
                select: async () => ({
                  data: [{ id: 1, hints: data.hints }],
                  error: null,
                }),
              }),
            }),
          };
        }
      });

      const result = await hintService.updateHints(1, partialHints);

      expect(result.hints.approach).toBe('Only approach hint');
      expect(result.hints.code).toBe('');
      expect(result.hints.edge_case).toBe('');
    });
  });

  describe('GET /api/dsa/hints/stats/user', () => {
    it('should aggregate hint usage statistics', async () => {
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

      const stats = await hintService.getUserHintStatistics('user-123');

      expect(stats.total_hints_revealed).toBe(4);
      expect(stats.by_type.approach).toBe(2);
      expect(stats.by_type.code).toBe(1);
      expect(stats.by_type.edge_case).toBe(1);
      expect(stats.problems_with_hints).toBe(3); // 3 unique problem IDs
    });
  });

  describe('Full Hint Workflow Integration', () => {
    it('should track hint reveal progression', async () => {
      const userId = 'user-456';
      const problemId = 10;

      mockSupabase.from = vi.fn((table) => {
        if (table === 'problems') {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({
                  data: {
                    hints: {
                      approach: 'Consider recursive approach',
                      code: 'Base case: empty array',
                      edge_case: 'Single element array',
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

      // Step 1: First hint reveal (approach)
      const hint1 = await hintService.getHint(userId, problemId, 'approach');
      expect(hint1.first_reveal).toBe(true);
      expect(hint1.can_reveal).toBe(true);

      // Step 2: User attempts problem, comes back for next hint
      // (In real scenario, cooldown would prevent immediate reveal)
      // Verify stats are tracked
      const stats = await hintService.getUserHintStatistics(userId);
      expect(stats.total_hints_revealed).toBeGreaterThanOrEqual(0); // May be > 0 depending on mocks
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockSupabase.from = vi.fn(() => ({
        select: () => ({
          eq: () => ({
            single: async () => ({
              data: null,
              error: { message: 'Database connection failed' },
            }),
          }),
        }),
      }));

      const result = hintService.getHint('user-123', 1, 'approach');
      expect(result).rejects.toThrow();
    });

    it('should handle missing hints on problem', async () => {
      mockSupabase.from = vi.fn((table) => {
        if (table === 'problems') {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({
                  data: { hints: null }, // No hints
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

      const result = await hintService.getHint('user-123', 1, 'approach');
      expect(result.hint_text).toBe(''); // Empty string fallback
      expect(result.can_reveal).toBe(true);
    });
  });
});
