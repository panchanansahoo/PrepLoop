import { beforeEach, describe, expect, it, vi } from 'vitest';

const fixtures = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(),
  deleteUserAccount: vi.fn(),
  clearSessionCookies: vi.fn(),
  invalidateCache: vi.fn(),
}));

vi.mock('../../db/supabaseClient.js', () => ({
  supabaseAdmin: {
    from: fixtures.from,
    rpc: fixtures.rpc,
  },
}));

vi.mock('../../middleware/auth.ts', () => ({
  authenticateToken: (req, _res, next) => next(),
  optionalAuth: (req, _res, next) => next(),
}));

vi.mock('express-rate-limit', () => ({
  default: () => (_req, _res, next) => next(),
}));

vi.mock('../../middleware/apiCache.js', () => ({
  invalidateCache: fixtures.invalidateCache,
}));

vi.mock('../../middleware/uploadProtection.js', () => ({
  requireValidFileSignature: () => (_req, _res, next) => next(),
  uploadEndpointsLimiter: (_req, _res, next) => next(),
}));

vi.mock('../../routes/auth/helpers.js', () => ({
  clearSessionCookies: fixtures.clearSessionCookies,
}));

vi.mock('../../services/profileService.ts', () => ({
  getOrCreateUserProfile: vi.fn(),
  getPublicPortfolioBySlug: vi.fn(),
  updateUserProfile: vi.fn(),
  uploadUserAvatar: vi.fn(),
  claimUserCustomUrl: vi.fn(),
  getUserSettings: vi.fn(),
  updateUserSettings: vi.fn(),
  updateUserPreferences: vi.fn(),
  getGithubAutofillProfile: vi.fn(),
  deleteUserAccount: fixtures.deleteUserAccount,
  isProfilesAccessBlocked: vi.fn(() => false),
}));

import communityRouter from '../../routes/community.js';
import profileRouter from '../../routes/user/profile.js';

function createResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: undefined,
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
      return this;
    },
  };
}

function createQueryChain(resultOrFn) {
  const resolveResult = () => (typeof resultOrFn === 'function' ? resultOrFn() : resultOrFn);
  const chain = {
    select: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve(resolveResult())),
    maybeSingle: vi.fn(() => Promise.resolve(resolveResult())),
    then: (resolve, reject) => Promise.resolve(resolveResult()).then(resolve, reject),
  };
  return chain;
}

async function invokeRoute(router, method, path, reqOverrides = {}) {
  const layer = router.stack.find(
    (item) => item.route?.path === path && item.route?.methods[method]
  );
  if (!layer) {
    throw new Error(`Route not found: ${method.toUpperCase()} ${path}`);
  }
  const req = {
    ip: '127.0.0.1',
    query: {},
    params: {},
    body: {},
    headers: {},
    ...reqOverrides,
  };
  const res = createResponse();
  for (const routeLayer of layer.route.stack) {
    let advanced = false;
    await routeLayer.handle(req, res, (err) => {
      if (err) throw err;
      advanced = true;
    });
    if (!advanced) break;
  }
  return res;
}

describe('Mobile Features Backend Routes (Bugs 13, 14, 15, 19)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Bug 13 & 14: POST /posts formats author_name and reply_count and validates input', async () => {
    const missingTitle = await invokeRoute(communityRouter, 'post', '/posts', {
      user: { id: 'user-1' },
      body: { title: '   ', content: 'Body text' },
    });
    expect(missingTitle.statusCode).toBe(400);

    const postChain = createQueryChain({
      data: {
        id: 'post-99',
        user_id: 'user-1',
        title: 'Binary Search Guide',
        content: 'Use left <= right cleanly.',
        tags: ['dsa'],
        likes: 0,
        replies: 0,
        created_at: '2026-11-27T00:00:00Z',
        updated_at: '2026-11-27T00:00:00Z',
        profiles: { full_name: 'Ada Lovelace' },
        community_replies: [{ count: 0 }],
      },
      error: null,
    });
    fixtures.from.mockReturnValue(postChain);

    const res = await invokeRoute(communityRouter, 'post', '/posts', {
      user: { id: 'user-1' },
      body: { title: 'Binary Search Guide', content: 'Use left <= right cleanly.', tags: ['dsa'] },
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.post).toMatchObject({
      id: 'post-99',
      title: 'Binary Search Guide',
      author_name: 'Ada Lovelace',
      likes: 0,
      reply_count: 0,
    });
  });

  it('Bug 14 & 15: GET /posts/:id fetches single thread directly and returns 404 for missing/invalid IDs', async () => {
    fixtures.from.mockReturnValueOnce(
      createQueryChain({
        data: {
          id: 'old-thread-1',
          user_id: 'user-2',
          title: 'Older Thread Title',
          content: 'Older thread body beyond top 50',
          tags: [],
          likes: 7,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
          profiles: { full_name: 'Grace Hopper' },
          community_replies: [{ count: 3 }],
        },
        error: null,
      })
    );

    const found = await invokeRoute(communityRouter, 'get', '/posts/:id', {
      params: { id: 'old-thread-1' },
    });
    expect(found.statusCode).toBe(200);
    expect(found.body.post).toMatchObject({
      id: 'old-thread-1',
      title: 'Older Thread Title',
      content: 'Older thread body beyond top 50',
      author_name: 'Grace Hopper',
      likes: 7,
      reply_count: 3,
    });

    fixtures.from.mockReturnValueOnce(
      createQueryChain({ data: null, error: { code: '22P02', message: 'invalid uuid' } })
    );
    const invalid = await invokeRoute(communityRouter, 'get', '/posts/:id', {
      params: { id: 'bad-uuid' },
    });
    expect(invalid.statusCode).toBe(404);
  });

  it('Bug 14 & 15: POST /posts/:id/reply and GET /posts/:id/replies return author_name and 404 on invalid id', async () => {
    fixtures.rpc.mockResolvedValue({ error: null });
    fixtures.from.mockReturnValueOnce(
      createQueryChain({
        data: {
          id: 'reply-1',
          post_id: 'post-1',
          user_id: 'user-3',
          content: 'Helpful explanation!',
          profiles: { full_name: 'Alan Turing' },
        },
        error: null,
      })
    );

    const replyRes = await invokeRoute(communityRouter, 'post', '/posts/:id/reply', {
      user: { id: 'user-3' },
      params: { id: 'post-1' },
      body: { content: 'Helpful explanation!' },
    });
    expect(replyRes.statusCode).toBe(200);
    expect(replyRes.body.success).toBe(true);
    expect(replyRes.body.reply.author_name).toBe('Alan Turing');

    fixtures.from.mockReturnValueOnce(
      createQueryChain({ data: null, error: { code: '22P02', message: 'invalid uuid' } })
    );
    const badReplies = await invokeRoute(communityRouter, 'get', '/posts/:id/replies', {
      params: { id: 'bad-id' },
    });
    expect(badReplies.statusCode).toBe(404);
  });

  it('Bug 19: DELETE /account validates auth & DELETE confirmation, deletes account, clears cookies/cache', async () => {
    const unauth = await invokeRoute(profileRouter, 'delete', '/account', {
      user: null,
      body: { confirmation: 'DELETE' },
    });
    expect(unauth.statusCode).toBe(401);

    const badConfirm = await invokeRoute(profileRouter, 'delete', '/account', {
      user: { id: 'user-del-1' },
      body: { confirmation: 'WRONG' },
    });
    expect(badConfirm.statusCode).toBe(400);
    expect(fixtures.deleteUserAccount).not.toHaveBeenCalled();

    fixtures.deleteUserAccount.mockResolvedValueOnce({ success: true });
    const ok = await invokeRoute(profileRouter, 'delete', '/account', {
      user: { id: 'user-del-1' },
      body: { confirmation: ' delete ' },
    });
    expect(ok.statusCode).toBe(200);
    expect(ok.body.success).toBe(true);
    expect(fixtures.deleteUserAccount).toHaveBeenCalledWith('user-del-1');
    expect(fixtures.clearSessionCookies).toHaveBeenCalled();
    expect(fixtures.invalidateCache).toHaveBeenCalledWith('/api/user/settings/user-del-1');
    expect(fixtures.invalidateCache).toHaveBeenCalledWith('/api/user/profile/user-del-1');

    fixtures.deleteUserAccount.mockRejectedValueOnce(new Error('DB outage'));
    const fail = await invokeRoute(profileRouter, 'delete', '/account', {
      user: { id: 'user-del-1' },
      body: { confirmation: 'DELETE' },
    });
    expect(fail.statusCode).toBe(500);
  });
});
