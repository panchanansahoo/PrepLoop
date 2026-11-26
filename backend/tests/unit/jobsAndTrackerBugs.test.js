import { beforeEach, describe, expect, it, vi } from 'vitest';

const fixtures = vi.hoisted(() => ({
  from: vi.fn(),
  fetchAllIndianJobs: vi.fn(),
}));

vi.mock('../../db/supabaseClient.js', () => ({
  supabaseAdmin: { from: fixtures.from },
}));

vi.mock('../../middleware/auth.ts', () => ({
  authenticateToken: (req, _res, next) => next(),
  optionalAuth: (req, _res, next) => next(),
  requireAdmin: (req, _res, next) => next(),
}));

vi.mock('../../middleware/apiRateLimiter.js', () => ({
  aiEndpointsLimiter: (_req, _res, next) => next(),
}));

vi.mock('../../utils/indianJobApis.js', () => ({
  fetchAllIndianJobs: fixtures.fetchAllIndianJobs,
}));

vi.mock('../../services/preploopCareerService.js', () => ({
  buildCareerSearchQuery: vi.fn(() => 'software developer'),
  hasMeaningfulProfileSignals: vi.fn(() => false),
  normalizeProfileSignals: vi.fn(() => ({})),
  scoreJobsAgainstProfile: vi.fn(() => []),
}));

import jobsRouter from '../../routes/jobs.js';
import jobApplicationsRouter from '../../routes/job-applications.js';
import { clearJobCache, setCachedJobs } from '../../utils/jobCache.js';

function createResponse() {
  return {
    statusCode: 200,
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
      return this;
    },
    set(name, value) {
      this.headers[name] = value;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

function createQueryChain(resultOrFn) {
  const resolveResult = () => (typeof resultOrFn === 'function' ? resultOrFn() : resultOrFn);
  const chain = {
    select: vi.fn(() => chain),
    update: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    ilike: vi.fn(() => chain),
    or: vi.fn(() => chain),
    order: vi.fn(() => chain),
    range: vi.fn(() => chain),
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
    let passedErr = null;
    await routeLayer.handle(req, res, (err) => {
      advanced = true;
      passedErr = err || null;
    });
    if (passedErr) throw passedErr;
    if (!advanced) break;
  }
  return res;
}

beforeEach(() => {
  vi.resetAllMocks();
  clearJobCache();
  fixtures.fetchAllIndianJobs.mockResolvedValue([]);
});

describe('Bug 4: Inactive job listings admin access check', () => {
  it('enforces is_active=true on GET /api/jobs even when unauthenticated caller passes include_inactive=true', async () => {
    const chain = createQueryChain({ data: [{ id: 1, title: 'Active Role', is_active: true }], count: 1, error: null });
    fixtures.from.mockReturnValue(chain);

    const res = await invokeRoute(jobsRouter, 'get', '/', {
      query: { include_inactive: 'true', source: 'admin' },
    });

    expect(res.statusCode).toBe(200);
    expect(chain.eq).toHaveBeenCalledWith('is_active', true);
    expect(res.body.jobs).toHaveLength(1);
  });

  it('enforces is_active=true and strips inactive rows when non-admin user passes include_inactive=true', async () => {
    const chain = createQueryChain({
      data: [
        { id: 1, title: 'Active Role', is_active: true },
        { id: 2, title: 'Hidden Draft', is_active: false },
      ],
      count: 1,
      error: null,
    });
    fixtures.from.mockReturnValue(chain);

    const res = await invokeRoute(jobsRouter, 'get', '/', {
      user: { id: 'user-1', role: 'user' },
      query: { include_inactive: 'true', source: 'admin' },
    });

    expect(res.statusCode).toBe(200);
    expect(chain.eq).toHaveBeenCalledWith('is_active', true);
    expect(res.body.jobs.map((j) => j.id)).toEqual([1]);
  });

  it('allows admin with include_inactive=true to view inactive listings with Cache-Control: no-store', async () => {
    const chain = createQueryChain({
      data: [
        { id: 1, title: 'Active Role', is_active: true },
        { id: 2, title: 'Hidden Draft', is_active: false },
      ],
      count: 2,
      error: null,
    });
    fixtures.from.mockReturnValue(chain);

    const res = await invokeRoute(jobsRouter, 'get', '/', {
      user: { id: 'admin-1', role: 'admin' },
      query: { include_inactive: 'true', source: 'admin' },
    });

    expect(res.statusCode).toBe(200);
    expect(chain.eq).not.toHaveBeenCalledWith('is_active', true);
    expect(res.headers['Cache-Control']).toBe('no-store');
    expect(res.body.jobs.map((j) => j.id)).toEqual([1, 2]);
  });

  it('blocks non-admin callers from viewing inactive jobs on GET /api/jobs/:id while allowing admins', async () => {
    const nonAdminChain = createQueryChain({
      data: { id: 42, title: 'Draft Job', is_active: false },
      error: null,
    });
    fixtures.from.mockReturnValueOnce(nonAdminChain);

    const anonRes = await invokeRoute(jobsRouter, 'get', '/:id', {
      params: { id: '42' },
    });
    expect(nonAdminChain.eq).toHaveBeenCalledWith('is_active', true);
    expect(anonRes.statusCode).toBe(404);

    const adminChain = createQueryChain({
      data: { id: 42, title: 'Draft Job', is_active: false },
      error: null,
    });
    fixtures.from.mockReturnValueOnce(adminChain);

    const adminRes = await invokeRoute(jobsRouter, 'get', '/:id', {
      user: { id: 'admin-1', role: 'admin' },
      params: { id: '42' },
    });
    expect(adminChain.eq).not.toHaveBeenCalledWith('is_active', true);
    expect(adminRes.statusCode).toBe(200);
    expect(adminRes.headers['Cache-Control']).toBe('no-store');
    expect(adminRes.body.id).toBe(42);
  });
});

describe('Bug 5: Jobs pagination across merged internal and external listings', () => {
  const makeAdminRows = (start, count) =>
    Array.from({ length: count }, (_, idx) => ({
      id: start + idx + 1,
      title: `Backend Role ${start + idx + 1}`,
      company: `Company ${start + idx + 1}`,
      category: 'fresher',
      type: 'full-time',
      location: 'Bengaluru, India',
      is_active: true,
    }));

  const makeExternalRows = (start, count) =>
    Array.from({ length: count }, (_, idx) => ({
      id: `ext_${start + idx + 1}`,
      title: `External Role ${start + idx + 1}`,
      company: `ExtCo ${start + idx + 1}`,
      category: 'fresher',
      type: 'full-time',
      location: 'India',
      is_active: true,
      source: 'indeed_india',
    }));

  it('reports full 250 total and 3 pages with page size 100 across merged internal + external listings', async () => {
    const external60 = makeExternalRows(0, 60);
    setCachedJobs('jobs_fresher software developer India_1', external60.slice(0, 30));
    setCachedJobs('jobs_fresher software developer India_2', external60.slice(30, 60));

    // Page 1: 100 admin jobs out of 250, total = 250 + 60 = 310, totalPages = 4
    fixtures.from.mockReturnValueOnce(
      createQueryChain({ data: makeAdminRows(0, 100), count: 250, error: null })
    );
    const page1 = await invokeRoute(jobsRouter, 'get', '/', {
      query: { page: '1', limit: '100' },
    });
    expect(page1.body.jobs).toHaveLength(100);
    expect(page1.body.total).toBe(310);
    expect(page1.body.totalPages).toBe(4);
    expect(page1.body.jobs[0].id).toBe(1);

    // Page 3: 50 admin jobs (201..250) + first 50 external jobs = 100 jobs
    fixtures.from.mockReturnValueOnce(
      createQueryChain({ data: makeAdminRows(200, 50), count: 250, error: null })
    );
    const page3 = await invokeRoute(jobsRouter, 'get', '/', {
      query: { page: '3', limit: '100' },
    });
    expect(page3.body.jobs).toHaveLength(100);
    expect(page3.body.total).toBe(310);
    expect(page3.body.totalPages).toBe(4);
    expect(page3.body.jobs[0].id).toBe(201);
    expect(page3.body.jobs[50].id).toBe('ext_1');

    // Page 4: Supabase returns PGRST103 past admin offset 300; head query returns count 250 -> remaining 10 external jobs
    fixtures.from
      .mockReturnValueOnce(createQueryChain({ data: null, error: { code: 'PGRST103', message: 'Range not satisfiable' } }))
      .mockReturnValueOnce(createQueryChain({ data: null, count: 250, error: null }));
    const page4 = await invokeRoute(jobsRouter, 'get', '/', {
      query: { page: '4', limit: '100' },
    });
    expect(page4.body.jobs).toHaveLength(10);
    expect(page4.body.jobs[0].id).toBe('ext_51');
    expect(page4.body.total).toBe(310);
    expect(page4.body.totalPages).toBe(4);
  });

  it('paginates 250 cached external listings across 3 pages when DB has 0 listings', async () => {
    const cached250 = makeExternalRows(0, 250);
    setCachedJobs('jobs_fresher software developer India_1', cached250);
    setCachedJobs('jobs_fresher software developer India_2', []);

    fixtures.from.mockImplementation(() => createQueryChain({ data: [], count: 0, error: null }));

    const p1 = await invokeRoute(jobsRouter, 'get', '/', { query: { page: '1', limit: '100' } });
    const p2 = await invokeRoute(jobsRouter, 'get', '/', { query: { page: '2', limit: '100' } });
    const p3 = await invokeRoute(jobsRouter, 'get', '/', { query: { page: '3', limit: '100' } });

    expect(p1.body.total).toBe(250);
    expect(p1.body.totalPages).toBe(3);
    expect(p1.body.jobs).toHaveLength(100);
    expect(p2.body.jobs).toHaveLength(100);
    expect(p2.body.jobs[0].id).toBe('ext_101');
    expect(p3.body.jobs).toHaveLength(50);
    expect(p3.body.jobs[0].id).toBe('ext_201');
  });
});

describe('Bug 6: External jobs respect type and category filters', () => {
  it('excludes full-time external/curated jobs when filtering by type=internship or intern', async () => {
    setCachedJobs('jobs_internship India_1', [
      {
        id: 'ext_ft',
        title: 'Full-Time Software Engineer',
        company: 'Acme',
        category: 'internship',
        type: 'FULLTIME',
        location: 'Bengaluru, India',
        is_active: true,
      },
      {
        id: 'ext_intern',
        title: 'Backend Engineering Intern',
        company: 'BetaCorp',
        category: 'internship',
        type: 'Intern',
        location: 'Bengaluru, India',
        is_active: true,
      },
    ]);
    setCachedJobs('jobs_internship India_2', []);

    fixtures.from.mockImplementation(() => createQueryChain({ data: [], count: 0, error: null }));

    const res = await invokeRoute(jobsRouter, 'get', '/', {
      query: { type: 'internship', source: 'external' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.jobs.some((j) => j.id === 'ext_ft')).toBe(false);
    expect(res.body.jobs.every((j) => j.type.toLowerCase().includes('intern'))).toBe(true);
    expect(res.body.jobs.some((j) => j.id === 'ext_intern')).toBe(true);
  });

  it('excludes non-matching categories on external/curated jobs when filtering by category', async () => {
    setCachedJobs('jobs_internship India_1', [
      {
        id: 'ext_fresher_cat',
        title: 'Graduate Intern Program',
        company: 'Gamma',
        category: 'fresher',
        type: 'internship',
        location: 'Mumbai, India',
        is_active: true,
      },
      {
        id: 'ext_intern_cat',
        title: 'Summer SWE Intern',
        company: 'Delta',
        category: 'Internship',
        type: 'internship',
        location: 'Mumbai, India',
        is_active: true,
      },
    ]);
    setCachedJobs('jobs_internship India_2', []);

    const res = await invokeRoute(jobsRouter, 'get', '/', {
      query: { category: 'internship', source: 'external' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.jobs.some((j) => j.id === 'ext_fresher_cat')).toBe(false);
    expect(res.body.jobs.some((j) => j.id === 'ext_intern_cat')).toBe(true);
    expect(res.body.jobs.every((j) => String(j.category).toLowerCase() === 'internship')).toBe(true);
  });

  it('treats type=all and category=all as unfiltered', async () => {
    setCachedJobs('jobs_fresher software developer India_1', [
      {
        id: 'ext_1',
        title: 'Full-Time Engineer',
        company: 'One',
        category: 'fresher',
        type: 'full-time',
        location: 'India',
        is_active: true,
      },
      {
        id: 'ext_2',
        title: 'SDE Intern',
        company: 'Two',
        category: 'internship',
        type: 'internship',
        location: 'India',
        is_active: true,
      },
    ]);
    setCachedJobs('jobs_fresher software developer India_2', []);

    const res = await invokeRoute(jobsRouter, 'get', '/', {
      query: { type: 'all', category: 'all', source: 'external' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.jobs.map((j) => j.id)).toEqual(['ext_1', 'ext_2']);
  });
});

describe('Bug 8 (Backend): PATCH /api/job-applications/:id sets applied_at when moving to applied', () => {
  it('sets applied_at when moving a bookmarked application with null applied_at to applied without appliedAt in body', async () => {
    const existingLookup = createQueryChain({
      data: { id: 'app-1', applied_at: null },
      error: null,
    });
    const updateChain = createQueryChain({
      data: {
        id: 'app-1',
        user_id: 'user-1',
        company: 'Linear',
        role: 'Frontend Architect',
        status: 'applied',
        applied_at: '2026-11-26T18:00:00.000Z',
        created_at: '2026-11-20T00:00:00.000Z',
        updated_at: '2026-11-26T18:00:00.000Z',
      },
      error: null,
    });
    fixtures.from.mockReturnValueOnce(existingLookup).mockReturnValueOnce(updateChain);

    const res = await invokeRoute(jobApplicationsRouter, 'patch', '/:id', {
      user: { id: 'user-1' },
      params: { id: 'app-1' },
      body: { status: 'applied' },
    });

    expect(res.statusCode).toBe(200);
    expect(updateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'applied',
        applied_at: expect.any(String),
      })
    );
    expect(res.body.application.appliedAt).toBe('2026-11-26T18:00:00.000Z');
  });

  it('preserves existing applied_at instead of overwriting it when status is applied and appliedAt is omitted', async () => {
    const originalDate = '2026-10-01T12:00:00.000Z';
    const existingLookup = createQueryChain({
      data: { id: 'app-1', applied_at: originalDate },
      error: null,
    });
    const updateChain = createQueryChain({
      data: {
        id: 'app-1',
        user_id: 'user-1',
        company: 'Stripe',
        role: 'SWE',
        status: 'applied',
        notes: 'Updated note',
        applied_at: originalDate,
        created_at: '2026-10-01T12:00:00.000Z',
        updated_at: '2026-11-26T18:00:00.000Z',
      },
      error: null,
    });
    fixtures.from.mockReturnValueOnce(existingLookup).mockReturnValueOnce(updateChain);

    const res = await invokeRoute(jobApplicationsRouter, 'patch', '/:id', {
      user: { id: 'user-1' },
      params: { id: 'app-1' },
      body: { status: 'applied', notes: 'Updated note' },
    });

    expect(res.statusCode).toBe(200);
    const updateArg = updateChain.update.mock.calls[0][0];
    expect(updateArg).not.toHaveProperty('applied_at');
    expect(res.body.application.appliedAt).toBe(originalDate);
  });

  it('returns 404 when the application does not exist for the authenticated user', async () => {
    const existingLookup = createQueryChain({ data: null, error: null });
    fixtures.from.mockReturnValueOnce(existingLookup);

    const res = await invokeRoute(jobApplicationsRouter, 'patch', '/:id', {
      user: { id: 'user-1' },
      params: { id: 'missing-id' },
      body: { status: 'applied' },
    });

    expect(res.statusCode).toBe(404);
  });
});
