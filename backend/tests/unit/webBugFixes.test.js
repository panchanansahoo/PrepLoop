import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock('../../db/supabaseClient.js', () => ({
  supabaseAdmin: { from: mocks.from },
}));

vi.mock('../../middleware/auth.ts', () => ({
  authenticateToken: (req, _res, next) => {
    req.user = { id: 'user-1', email: 'test@example.com' };
    next();
  },
  optionalAuth: (req, _res, next) => {
    req.user = { id: 'user-1', email: 'test@example.com' };
    next();
  },
}));

vi.mock('../../middleware/rateLimiter.js', () => ({
  aiLimiter: (_req, _res, next) => next(),
  codeExecutionLimiter: (_req, _res, next) => next(),
}));

vi.mock('../../middleware/usageQuota.ts', () => ({
  usageQuota: () => (_req, _res, next) => next(),
  checkQuota: () => Promise.resolve({ allowed: true }),
}));

vi.mock('../../services/interviewTelemetryService.js', () => ({
  default: { logEvent: vi.fn(), flushEvents: vi.fn() },
}));

vi.mock('../../services/interviewScoringRules.js', () => ({
  classifyCandidateAnswer: vi.fn(),
  resolveDynamicDifficulty: vi.fn(),
  computeInterviewScore: vi.fn(),
}));

import { deleteSavedInterview } from '../../services/deleteSavedInterview.js';
import companySessionRouter from '../../routes/company-interview/session.js';
import interviewSessionRouter from '../../routes/interview/session.js';
import notesRouter from '../../routes/notes.js';
import { getComprehensiveUserStats } from '../../services/dashboardService.js';

function getHandler(router, method, path) {
  const layer = router.stack.find(
    (item) => item.route?.path === path && item.route?.methods[method]
  );
  if (!layer) {
    throw new Error(`Route not found: ${method.toUpperCase()} ${path}`);
  }
  return layer.route.stack.at(-1).handle;
}

function createMockRes() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    headersSent: false,
    set(name, value) {
      this.headers[name] = value;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      this.headersSent = true;
      return this;
    },
  };
}

function createChain(result) {
  const chain = {
    select: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    is: vi.fn(() => chain),
    in: vi.fn(() => chain),
    or: vi.fn(() => chain),
    ilike: vi.fn(() => chain),
    gte: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    range: vi.fn(() => Promise.resolve(result)),
    single: vi.fn(() => Promise.resolve(result)),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  };
  return chain;
}

describe('Backend Bug Fixes (#5, #7, #9)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Bug #5: deleteSavedInterview and DELETE routes propagate DB errors with 5xx', () => {
    it('throws DB error when mock_interviews delete fails', async () => {
      const dbError = new Error('permission denied for table mock_interviews');
      const client = {
        from: vi.fn(() => createChain({ error: dbError })),
      };

      await expect(deleteSavedInterview(client, 'user-1', '42')).rejects.toThrow('permission denied');
      expect(client.from).toHaveBeenCalledWith('mock_interviews');
    });

    it('throws DB error when interview_sessions delete fails', async () => {
      const dbError = new Error('db connection lost');
      const client = {
        from: vi.fn(() => createChain({ error: dbError })),
      };

      await expect(
        deleteSavedInterview(client, 'user-1', '550e8400-e29b-41d4-a716-446655440000')
      ).rejects.toThrow('db connection lost');
      expect(client.from).toHaveBeenCalledWith('interview_sessions');
    });

    it('DELETE /company-interview/sessions/:id returns 500 when DB delete returns error', async () => {
      mocks.from.mockImplementation(() => createChain({ error: new Error('delete failure') }));

      const handler = getHandler(companySessionRouter, 'delete', '/sessions/:id');
      const req = { params: { id: 'ai-interview-123' }, user: { id: 'user-1' } };
      const res = createMockRes();
      await handler(req, res);

      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe('Failed to delete session');
    });

    it('DELETE /interview/:id returns 500 when DB delete returns error', async () => {
      mocks.from.mockImplementation(() => createChain({ error: new Error('delete failure') }));

      const handler = getHandler(interviewSessionRouter, 'delete', '/:id');
      const req = { params: { id: '42' }, user: { id: 'user-1' } };
      const res = createMockRes();
      await handler(req, res);

      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe('Failed to delete interview');
    });
  });

  describe('Bug #7: notes.js pagination beyond 20 items, standalone creation, and note updates', () => {
    it('GET /bookmarks returns page 2 with accurate pagination metadata beyond 20 items', async () => {
      const page2Rows = Array.from({ length: 5 }, (_, i) => ({
        id: 21 + i,
        question_title: `Item ${21 + i}`,
        question_type: 'dsa',
        tags: [],
        note: '',
      }));

      const chain = createChain({ data: page2Rows, count: 25, error: null });
      mocks.from.mockReturnValue(chain);

      const handler = getHandler(notesRouter, 'get', '/bookmarks');
      const req = { query: { page: '2', limit: '20' }, user: { id: 'user-1' } };
      const res = createMockRes();
      await handler(req, res);

      expect(res.statusCode).toBe(200);
      expect(chain.range).toHaveBeenCalledWith(20, 39);
      expect(res.body.bookmarks).toHaveLength(5);
      expect(res.body.pagination).toEqual({
        page: 2,
        limit: 20,
        total: 25,
        hasMore: false,
      });
    });

    it('POST /bookmark creates standalone note with null question_id and rejects duplicate problem bookmark', async () => {
      const inserted = { id: 101, question_id: null, question_title: 'My Note', question_type: 'custom', note: 'hello', tags: [] };
      mocks.from.mockImplementation(() => createChain({ data: inserted, error: null }));

      const handler = getHandler(notesRouter, 'post', '/bookmark');
      const res1 = createMockRes();
      await handler(
        { body: { questionTitle: 'My Note', questionType: 'custom', note: 'hello', tags: [] }, user: { id: 'user-1' } },
        res1
      );
      expect(res1.statusCode).toBe(200);
      expect(res1.body.bookmark.id).toBe(101);

      mocks.from.mockImplementation(() => createChain({ data: { id: 55 }, error: null }));
      const res2 = createMockRes();
      await handler(
        { body: { questionId: 'two-sum', questionTitle: 'Two Sum', questionType: 'dsa', note: 'second' }, user: { id: 'user-1' } },
        res2
      );
      expect(res2.statusCode).toBe(400);
      expect(res2.body.error).toBe('Already bookmarked');
    });

    it('PUT /bookmark/:id/note updates existing bookmark note and returns 404 when missing', async () => {
      const handler = getHandler(notesRouter, 'put', '/bookmark/:id/note');

      mocks.from.mockImplementation(() => createChain({ data: { id: 55, note: 'updated', tags: ['DP'] }, error: null }));
      const res1 = createMockRes();
      await handler({ params: { id: '55' }, body: { note: 'updated', tags: ['DP'] }, user: { id: 'user-1' } }, res1);
      expect(res1.statusCode).toBe(200);
      expect(res1.body.bookmark.note).toBe('updated');

      mocks.from.mockImplementation(() => createChain({ data: null, error: null }));
      const res2 = createMockRes();
      await handler({ params: { id: '999' }, body: { note: 'updated' }, user: { id: 'user-1' } }, res2);
      expect(res2.statusCode).toBe(404);
    });
  });

  describe('Bug #9: dashboardService excludes mirrored mock_interviews and builds real heatmapData', () => {
    it('filters mock_interviews by source_interview_session_id is null and counts daily accepted submissions', async () => {
      const todayIso = new Date().toISOString();
      const todayKey = todayIso.slice(0, 10);
      const mockChainByTable = {};

      mocks.from.mockImplementation((table) => {
        if (table === 'user_progress') {
          return createChain({ data: [{ problem_id: 1, status: 'solved' }], error: null });
        }
        if (table === 'submissions') {
          return createChain({
            data: [{ submitted_at: todayIso, status: 'accepted', problem_id: 1, execution_time: 12, problems: { title: 'Two Sum', difficulty: 'easy' } }],
            error: null,
          });
        }
        if (table === 'mock_interviews') {
          const c = createChain({ data: [{ id: 1, interview_type: 'Technical', overall_score: 80, started_at: todayIso, completed_at: todayIso }], error: null });
          mockChainByTable.mock_interviews = c;
          return c;
        }
        if (table === 'interview_sessions') {
          return createChain({
            data: [{ id: 'uuid-1', interview_type: 'Behavioral', interview_score: 90, performance_metrics: {}, started_at: todayIso, completed_at: todayIso, created_at: todayIso }],
            error: null,
          });
        }
        if (table === 'patterns') {
          return createChain({ data: [{ id: 1, name: 'Arrays' }], error: null });
        }
        if (table === 'problems') {
          return createChain({ data: [{ id: 1, title: 'Two Sum', difficulty: 'easy', pattern_id: 1 }], error: null });
        }
        return createChain({ data: [], error: null });
      });

      const stats = await getComprehensiveUserStats('user-1');

      expect(mockChainByTable.mock_interviews.is).toHaveBeenCalledWith('source_interview_session_id', null);
      expect(stats.stats.mockInterviews).toBe(2);
      expect(stats.heatmapData[todayKey]?.solved).toBe(1);
    });
  });
});
