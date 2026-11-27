import { beforeEach, describe, expect, it, vi } from 'vitest';

const fixtures = vi.hoisted(() => ({
  from: vi.fn(),
  getUserById: vi.fn(),
  updateUserById: vi.fn(),
  usersMeta: new Map<string, Record<string, any>>(),
}));

vi.mock('../../db/supabaseClient.js', () => ({
  supabaseAdmin: {
    from: fixtures.from,
    auth: {
      admin: {
        getUserById: fixtures.getUserById,
        updateUserById: fixtures.updateUserById,
      },
    },
  },
}));

vi.mock('../../middleware/auth.ts', () => ({
  authenticateToken: (req: any, _res: any, next: any) => {
    req.user = req.user || { id: 'user-1' };
    next();
  },
  optionalAuth: (req: any, _res: any, next: any) => next(),
}));

import { LearningPathService } from '../../services/learningPathService.js';
import learningRouter from '../../routes/user/learning.js';

function createResponse() {
  return {
    statusCode: 200,
    body: undefined as any,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: any) {
      this.body = payload;
      return this;
    },
  };
}

function getRouteHandler(method: string, path: string) {
  const layer = (learningRouter as any).stack.find(
    (entry: any) => entry.route && entry.route.path === path && entry.route.methods[method],
  );
  if (!layer) throw new Error(`Route not found: ${method.toUpperCase()} ${path}`);
  return layer.route.stack[layer.route.stack.length - 1].handle;
}

describe('Learning Path & Track Fixes (Bugs #1-#3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fixtures.usersMeta.clear();
    fixtures.from.mockImplementation(() => {
      const chain: any = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
      };
      return chain;
    });
    fixtures.getUserById.mockImplementation(async (userId: string) => ({
      data: { user: { id: userId, user_metadata: fixtures.usersMeta.get(userId) || {} } },
      error: null,
    }));
    fixtures.updateUserById.mockImplementation(async (userId: string, payload: any) => {
      fixtures.usersMeta.set(userId, payload.user_metadata || {});
      return { data: { user: { id: userId, user_metadata: payload.user_metadata } }, error: null };
    });
  });

  it('Bug #1: getDsaPathWithProgress returns 14 modules with normalized counts and getDsaModule resolves by slug or numeric id', async () => {
    const pathData = await LearningPathService.getDsaPathWithProgress('new-user');
    expect(Array.isArray(pathData.modules)).toBe(true);
    expect(pathData.modules).toHaveLength(14);
    expect(pathData.modules.every((m: any) => m.completed_topics === 0)).toBe(true);

    const bySlug = await LearningPathService.getDsaModule('array', 'new-user');
    const byId = await LearningPathService.getDsaModule('1', 'new-user');
    expect(bySlug?.title).toBe('Array Fundamentals');
    expect(byId?.title).toBe('Array Fundamentals');
    expect(bySlug?.content).toBeTruthy();
  });

  it('Bug #2 & #3: all 14 HR, System Design, and Technical modules resolve with 0 completed for new learners', async () => {
    const expectedIds = {
      hr: ['hr1', 'hr2', 'hr3', 'hr4', 'hr5'],
      'system-design': ['sd1', 'sd2', 'sd3', 'sd4', 'sd5'],
      technical: ['tech1', 'tech2', 'tech3', 'tech4'],
    };

    for (const [track, ids] of Object.entries(expectedIds)) {
      const trackRes = await LearningPathService.getTrackPathWithProgress(track, 'brand-new-user');
      expect(trackRes?.modules.map((m: any) => m.id)).toEqual(ids);
      expect(trackRes?.modules.every((m: any) => m.completed_topics === 0 && !m.completed)).toBe(true);

      for (const topicId of ids) {
        const mod = await LearningPathService.getTrackModule(track, topicId, 'brand-new-user');
        expect(mod).not.toBeNull();
        expect(mod?.content.length).toBeGreaterThan(20);
        expect(mod?.completed).toBe(false);
      }
    }
  });

  it('Bug #3: marking a topic complete persists only for the acting user and refreshes track progress', async () => {
    const completeHandler = getRouteHandler('post', '/learning-paths/:topicId/complete');
    const trackHandler = getRouteHandler('get', '/learning-path/:track');

    const postRes = createResponse();
    await completeHandler({ user: { id: 'user-a' }, params: { topicId: 'hr1' } }, postRes);
    expect(postRes.statusCode).toBe(200);
    expect(postRes.body).toMatchObject({
      success: true,
      topicId: 'hr1',
      completed: true,
      completed_topics: 2,
      total_topics: 2,
    });

    const userATrackRes = createResponse();
    await trackHandler({ user: { id: 'user-a' }, params: { track: 'hr' } }, userATrackRes);
    expect(userATrackRes.statusCode).toBe(200);
    expect(userATrackRes.body.modules[0]).toMatchObject({ id: 'hr1', completed_topics: 2, total_topics: 2, completed: true });
    expect(userATrackRes.body.modules[1]).toMatchObject({ id: 'hr2', completed_topics: 0, completed: false });

    const userBTrackRes = createResponse();
    await trackHandler({ user: { id: 'user-b' }, params: { track: 'hr' } }, userBTrackRes);
    expect(userBTrackRes.statusCode).toBe(200);
    expect(userBTrackRes.body.modules.every((m: any) => m.completed_topics === 0)).toBe(true);
  });
});
