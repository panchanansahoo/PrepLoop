import { beforeEach, describe, expect, it, vi } from 'vitest';

const fixtures = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(),
  shortLink: vi.fn(),
}));

vi.mock('../../db/supabaseClient.js', () => ({
  supabaseAdmin: { from: fixtures.from, rpc: fixtures.rpc },
}));
vi.mock('../../middleware/auth.ts', () => ({
  authenticateToken: vi.fn(),
  optionalAuth: vi.fn(),
  requireAdmin: vi.fn(),
}));
vi.mock('../../services/portfolioShortLinkService.js', () => ({
  reservePortfolioSlug: (slug) => Promise.resolve(slug),
  createShortLink: fixtures.shortLink,
  resolveShortLink: vi.fn(),
}));
vi.mock('../../services/profileService.ts', () => ({ getOrCreateUserProfile: vi.fn() }));
vi.mock('../../services/codeReviewService.ts', () => ({ reviewRealProject: vi.fn() }));

import portfolioRouter from '../../routes/portfolio.js';
import blogRouter from '../../routes/blog.js';
import { parseLinkedinExportText } from '../../services/portfolioLinkedinService.js';

const handler = (router, method, path) => {
  const layer = router.stack.find(item => item.route?.path === path && item.route?.methods[method]);
  return layer.route.stack.at(-1).handle;
};

const response = () => ({
  statusCode: 200,
  headers: {},
  set(name, value) { this.headers[name] = value; return this; },
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});

const query = (result) => {
  const chain = {
    select: vi.fn(() => chain),
    update: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    single: vi.fn().mockResolvedValue(result),
    maybeSingle: vi.fn().mockResolvedValue(result),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  };
  return chain;
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe('Public portfolios', () => {
  const publish = handler(portfolioRouter, 'post', '/sites');
  const view = handler(portfolioRouter, 'get', '/public/:slug');

  it.each(['private', 'unlisted', 'public'])('stores %s visibility even if short links fail', async visibility => {
    const profile = query({ data: { basic_info: { fullName: 'Jane' } } });
    const insert = vi.fn(values => query({ data: { id: 'site-1', ...values } }));
    fixtures.from.mockImplementation(table => table === 'normalized_profiles' ? profile : { insert });
    fixtures.shortLink.mockRejectedValue(new Error('Unavailable'));

    const res = response();
    await publish({ user: { id: 'owner' }, body: { profileId: 'profile-1', slug: 'jane', visibility } }, res);

    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ visibility, published: visibility !== 'private' }));
    expect(res.statusCode).toBe(201);
    expect(res.body.shortUrl).toBeNull();
    if (visibility === 'private') {
      expect(fixtures.shortLink).not.toHaveBeenCalled();
      expect(res.body.publishedUrl).toBeNull();
    } else {
      expect(res.body.publishedUrl).toMatch(/jane\?site=1$/);
    }
  });

  it('allows an owner preview and keeps a private portfolio out of anonymous responses', async () => {
    const site = { user_id: 'owner', visibility: 'private', published: false, profile_id: 'profile-1', template: 'dark', theme: { accentColor: '#112233' } };
    fixtures.from.mockImplementation(table => query({ data: table === 'portfolio_sites'
      ? site
      : { basic_info: { fullName: 'Jane' } } }));
    const request = { params: { slug: 'jane' }, query: { site: '1' } };

    const anonymous = response();
    await view(request, anonymous);
    expect(anonymous.statusCode).toBe(404);

    const owner = response();
    await view({ ...request, user: { id: 'owner' } }, owner);
    expect(owner.headers['Cache-Control']).toContain('no-store');
    expect(owner.body.portfolio.portfolioMeta).toMatchObject({
      visibility: 'private', isOwner: true, template: 'dark', branding: { accentColor: '#112233' },
    });
  });
});

describe('Published blog articles', () => {
  it('requires published status in both legacy and editorial lookups and disables caching', async () => {
    const legacy = query({ data: null, error: new Error('Missing author relationship') });
    const legacyFallback = query({ data: null });
    const editorial = query({ data: null });
    fixtures.from.mockReturnValueOnce(legacy).mockReturnValueOnce(legacyFallback).mockReturnValueOnce(editorial);
    const res = response();
    await handler(blogRouter, 'get', '/:slug')({ params: { slug: 'draft' }, query: {} }, res);
    expect(legacy.eq).toHaveBeenCalledWith('is_published', true);
    expect(legacyFallback.eq).toHaveBeenCalledWith('is_published', true);
    expect(editorial.eq).toHaveBeenCalledWith('status', 'published');
    expect(res.headers['Cache-Control']).toBe('no-store');
    expect(res.statusCode).toBe(404);
  });

  it('rejects any unpublished legacy or non-published editorial row defensively', async () => {
    const legacy = query({ data: { id: 'legacy-draft', slug: 'secret', is_published: false } });
    fixtures.from.mockReturnValueOnce(legacy);
    const res = response();
    await handler(blogRouter, 'get', '/:slug')({ params: { slug: 'secret' }, query: {} }, res);
    expect(res.statusCode).toBe(404);
  });

  it('publishes editorial posts via admin endpoint and serves them in main list and detail routes', async () => {
    const publishQuery = query({
      data: {
        id: 'editorial-1',
        slug: 'admin-post',
        title: 'Admin Post',
        content: '<p>Hello world</p>',
        status: 'published',
        published_at: '2026-04-05T10:00:00.000Z',
        featured_image_url: 'https://cdn.example.com/cover.png',
        view_count: 3,
      },
    });
    fixtures.from.mockReturnValueOnce(publishQuery);
    const publishRes = response();
    await handler(blogRouter, 'patch', '/admin/posts/:id/publish')({ params: { id: 'editorial-1' } }, publishRes);
    expect(publishQuery.update).toHaveBeenCalledWith(expect.objectContaining({
      status: 'published',
      published_at: expect.any(String),
      updated_at: expect.any(String),
    }));
    expect(publishRes.statusCode).toBe(200);
    expect(publishRes.body.post.status).toBe('published');

    const legacyList = query({ data: [{ id: 'legacy', slug: 'one', created_at: '2026-04-01', content: 'One' }] });
    const editorialList = query({ data: [publishRes.body.post] });
    fixtures.from.mockReturnValueOnce(legacyList).mockReturnValueOnce(editorialList);
    const listRes = response();
    await handler(blogRouter, 'get', '/')({ query: {} }, listRes);
    expect(listRes.body.map(row => row.id)).toEqual(['editorial-1', 'legacy']);
    expect(listRes.body[0]).toMatchObject({
      source: 'editorial',
      category: 'General',
      cover_image: 'https://cdn.example.com/cover.png',
      views: 3,
      excerpt: 'Hello world',
      author: { full_name: 'PrepLoop Team', avatar_url: null },
    });
    expect(listRes.body[0]).not.toHaveProperty('content');

    const editorialDetail = query({ data: publishRes.body.post });
    fixtures.from.mockReturnValueOnce(editorialDetail);
    fixtures.rpc.mockResolvedValue({});
    const detailRes = response();
    await handler(blogRouter, 'get', '/:slug')({ params: { slug: 'admin-post' }, query: { source: 'editorial', format: 'mobile' } }, detailRes);
    expect(fixtures.from).toHaveBeenLastCalledWith('blog_posts');
    expect(fixtures.rpc).toHaveBeenCalledWith('increment_blog_post_view', { post_id: 'editorial-1' });
    expect(detailRes.statusCode).toBe(200);
    expect(detailRes.body).toMatchObject({
      id: 'editorial-1',
      source: 'editorial',
      rendered_content: '<p>Hello world</p>',
    });
  });

  it('merges editorial articles for All/General/whitespace categories and excludes them for specific legacy categories', async () => {
    const legacyGeneral = query({ data: [] });
    const editorialGeneral = query({ data: [{ id: 'ed-1', slug: 'ed-1', published_at: '2026-04-02', content: [{ type: 'paragraph', content: [{ text: 'Block excerpt' }] }] }] });
    fixtures.from.mockReturnValueOnce(legacyGeneral).mockReturnValueOnce(editorialGeneral);
    const generalRes = response();
    await handler(blogRouter, 'get', '/')({ query: { category: '  ' } }, generalRes);
    expect(generalRes.body[0]).toMatchObject({ id: 'ed-1', excerpt: 'Block excerpt' });

    const legacyDsa = query({ data: [{ id: 'dsa-1', slug: 'dsa-1', category: 'DSA', created_at: '2026-04-01', content: 'Binary search' }] });
    fixtures.from.mockReturnValueOnce(legacyDsa);
    const dsaRes = response();
    await handler(blogRouter, 'get', '/')({ query: { category: 'DSA' } }, dsaRes);
    expect(fixtures.from).toHaveBeenCalledTimes(3);
    expect(dsaRes.body.map(r => r.id)).toEqual(['dsa-1']);
  });

  it('falls back to editorial posts by slug when source is omitted and sanitizes mobile rendered content', async () => {
    const legacyMiss = query({ data: null });
    const editorialHit = query({
      data: {
        id: 'ed-2',
        slug: 'blocks-and-xss',
        status: 'published',
        published_at: '2026-04-03',
        content: JSON.stringify([
          { type: 'heading', content: [{ text: 'Title' }] },
          { type: 'paragraph', content: ['Hello ', { text: 'world', styles: { bold: true } }] },
        ]),
      },
    });
    fixtures.from.mockReturnValueOnce(legacyMiss).mockReturnValueOnce(editorialHit);
    fixtures.rpc.mockResolvedValue({});
    const res = response();
    await handler(blogRouter, 'get', '/:slug')({ params: { slug: 'blocks-and-xss' }, query: { format: 'mobile' } }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.rendered_content).toBe('<h2>Title</h2><p>Hello <strong>world</strong></p>');
  });
});

describe('LinkedIn text', () => {
  it('treats an About excerpt as a summary and groups a role with its company and dates', () => {
    expect(parseLinkedinExportText('I build tools.\nI mentor developers.')).toMatchObject({
      fullName: null, headline: null, summary: 'I build tools.\nI mentor developers.',
    });
    expect(parseLinkedinExportText('Experience\nEngineer\nAcme\n2021 - Present').experience)
      .toEqual([{ role: 'Engineer', company: 'Acme', duration: '2021 - Present', source: 'linkedin' }]);
  });
});
