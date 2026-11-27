import { beforeEach, describe, expect, it, vi } from 'vitest';

const fixtures = vi.hoisted(() => ({
  from: vi.fn(),
  shortLink: vi.fn(),
  reserveSlug: vi.fn(),
}));

vi.mock('../../db/supabaseClient.js', () => ({
  supabaseAdmin: { from: fixtures.from },
}));
vi.mock('../../middleware/auth.ts', () => ({
  authenticateToken: vi.fn((_req, _res, next) => next?.()),
  optionalAuth: vi.fn((_req, _res, next) => next?.()),
}));
vi.mock('../../services/portfolioShortLinkService.js', () => ({
  reservePortfolioSlug: fixtures.reserveSlug,
  createShortLink: fixtures.shortLink,
  resolveShortLink: vi.fn(),
}));
vi.mock('../../services/profileService.ts', () => ({ getOrCreateUserProfile: vi.fn() }));
vi.mock('../../services/codeReviewService.ts', () => ({ reviewRealProject: vi.fn() }));

import portfolioRouter from '../../routes/portfolio.js';
import { createPortfolioSite } from '../../services/portfolioPublishService.js';

const handler = (method, path) => {
  const layer = portfolioRouter.stack.find(
    (item) => item.route?.path === path && item.route?.methods[method]
  );
  return layer.route.stack.at(-1).handle;
};

const createResponse = () => ({
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
  json(body) {
    this.body = body;
    return this;
  },
});

const query = (result) => {
  const chain = {
    select: vi.fn(() => chain),
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
  fixtures.reserveSlug.mockImplementation((slug) => Promise.resolve(slug || 'generated-slug'));
});

describe('Bug 1 & Bug 12: Portfolio publish visibility and resilient short-link handling', () => {
  const publish = handler('post', '/sites');

  it('rejects invalid visibility values with 400', async () => {
    for (const invalid of ['internal', '', null]) {
      const res = createResponse();
      await publish({ user: { id: 'owner-1' }, body: { profileId: 'prof-1', visibility: invalid } }, res);
      expect(res.statusCode).toBe(400);
      expect(fixtures.from).not.toHaveBeenCalled();
    }
  });

  it.each(['private', 'unlisted', 'public'])(
    'persists %s visibility accurately in createPortfolioSite',
    async (visibility) => {
      const profileChain = query({
        data: { id: 'prof-1', user_id: 'owner-1', basic_info: { fullName: 'Jane Doe' } },
      });
      const insert = vi.fn((values) => query({ data: { id: 'site-1', ...values } }));
      fixtures.from.mockImplementation((table) =>
        table === 'normalized_profiles' ? profileChain : { insert }
      );

      const site = await createPortfolioSite({
        userId: 'owner-1',
        profileId: 'prof-1',
        slug: 'jane-doe',
        template: 'dark',
        theme: { primaryColor: '#123456', accentColor: '#abcdef' },
        visibility,
      });

      expect(insert).toHaveBeenCalledWith(
        expect.objectContaining({
          visibility,
          published: visibility !== 'private',
          published_at: visibility === 'private' ? null : expect.any(String),
          template: 'dark',
          theme: { primaryColor: '#123456', accentColor: '#abcdef' },
        })
      );
      expect(site.visibility).toBe(visibility);
      expect(site.published).toBe(visibility !== 'private');
    }
  );

  it('returns 201 with publishedUrl and shortUrl=null when short-link creation fails', async () => {
    const profileChain = query({
      data: { id: 'prof-1', user_id: 'owner-1', basic_info: { fullName: 'Jane Doe' } },
    });
    const insert = vi.fn((values) => query({ data: { id: 'site-1', ...values } }));
    fixtures.from.mockImplementation((table) =>
      table === 'normalized_profiles' ? profileChain : { insert }
    );
    fixtures.shortLink.mockRejectedValue(new Error('short_links insert failed'));

    const res = createResponse();
    await publish(
      {
        user: { id: 'owner-1' },
        body: {
          profileId: 'prof-1',
          slug: 'jane-doe',
          visibility: 'public',
          template: 'creative',
          theme: { primaryColor: '#0f172a', accentColor: '#38bdf8', fontFamily: "'Poppins', sans-serif" },
        },
      },
      res
    );

    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject({
      id: 'site-1',
      slug: 'jane-doe',
      visibility: 'public',
      published: true,
      shortUrl: null,
      template: 'creative',
      theme: {
        primaryColor: '#0f172a',
        accentColor: '#38bdf8',
        fontFamily: "'Poppins', sans-serif",
      },
    });
    expect(res.body.publishedUrl).toMatch(/\/jane-doe\?site=1$/);
    expect(res.body.previewUrl).toBe(res.body.publishedUrl);
  });

  it('handles createShortLink returning null without failing the publish response', async () => {
    const profileChain = query({
      data: { id: 'prof-1', user_id: 'owner-1', basic_info: { fullName: 'Jane Doe' } },
    });
    const insert = vi.fn((values) => query({ data: { id: 'site-2', ...values } }));
    fixtures.from.mockImplementation((table) =>
      table === 'normalized_profiles' ? profileChain : { insert }
    );
    fixtures.shortLink.mockResolvedValue(null);

    const res = createResponse();
    await publish(
      { user: { id: 'owner-1' }, body: { profileId: 'prof-1', slug: 'jane-unlisted', visibility: 'unlisted' } },
      res
    );

    expect(res.statusCode).toBe(201);
    expect(res.body.visibility).toBe('unlisted');
    expect(res.body.published).toBe(true);
    expect(res.body.shortUrl).toBeNull();
  });
});

describe('Bug 1 & Bug 11: Public portfolio retrieval privacy & appearance', () => {
  const viewPublic = handler('get', '/public/:slug');
  const listSites = handler('get', '/sites');

  it('blocks anonymous and non-owner access to private portfolio sites while allowing owner preview', async () => {
    const site = {
      id: 'site-priv',
      user_id: 'owner-1',
      profile_id: 'prof-1',
      slug: 'jane-private',
      published: false,
      visibility: 'private',
      template: 'fresher',
      theme: { primaryColor: '#111111', accentColor: '#222222', fontFamily: "'Merriweather', serif" },
    };
    fixtures.from.mockImplementation((table) =>
      query({
        data: table === 'portfolio_sites' ? site : { basic_info: { fullName: 'Jane Private' } },
      })
    );

    const anonRes = createResponse();
    await viewPublic({ params: { slug: 'jane-private' }, query: { site: '1' } }, anonRes);
    expect(anonRes.statusCode).toBe(404);

    const otherUserRes = createResponse();
    await viewPublic({ user: { id: 'other-user' }, params: { slug: 'jane-private' }, query: { site: '1' } }, otherUserRes);
    expect(otherUserRes.statusCode).toBe(404);

    const ownerRes = createResponse();
    await viewPublic({ user: { id: 'owner-1' }, params: { slug: 'jane-private' }, query: { site: '1' } }, ownerRes);
    expect(ownerRes.statusCode).toBe(200);
    expect(ownerRes.headers['Cache-Control']).toBe('private, no-store');
    expect(ownerRes.headers['X-Robots-Tag']).toBe('noindex');
    expect(ownerRes.body.portfolio.portfolioMeta).toEqual({
      slug: 'jane-private',
      visibility: 'private',
      isOwner: true,
      template: 'fresher',
      branding: {
        primaryColor: '#111111',
        accentColor: '#222222',
        fontFamily: "'Merriweather', serif",
      },
    });
  });

  it('does not treat anonymous visitor as owner if site.user_id is missing', async () => {
    const malformedSite = {
      id: 'site-bad',
      profile_id: 'prof-1',
      slug: 'malformed',
      published: false,
      visibility: 'private',
    };
    fixtures.from.mockImplementation(() => query({ data: malformedSite }));

    const anonRes = createResponse();
    await viewPublic({ params: { slug: 'malformed' }, query: { site: '1' } }, anonRes);
    expect(anonRes.statusCode).toBe(404);
  });

  it('serves unlisted published portfolios with noindex and full appearance config', async () => {
    const site = {
      id: 'site-unl',
      user_id: 'owner-1',
      profile_id: 'prof-1',
      slug: 'jane-unlisted',
      published: true,
      visibility: 'unlisted',
      template: 'dark',
      theme: { primaryColor: '#0b1018', accentColor: '#38bdf8' },
    };
    fixtures.from.mockImplementation((table) =>
      query({
        data: table === 'portfolio_sites' ? site : { basic_info: { fullName: 'Jane Unlisted' } },
      })
    );

    const anonRes = createResponse();
    await viewPublic({ params: { slug: 'jane-unlisted' }, query: { site: '1' } }, anonRes);
    expect(anonRes.statusCode).toBe(200);
    expect(anonRes.headers['X-Robots-Tag']).toBe('noindex');
    expect(anonRes.body.portfolio.portfolioMeta).toEqual({
      slug: 'jane-unlisted',
      visibility: 'unlisted',
      isOwner: false,
      template: 'dark',
      branding: { primaryColor: '#0b1018', accentColor: '#38bdf8' },
    });
  });

  it('blocks unpublished public/unlisted sites from public access', async () => {
    const site = {
      id: 'site-unpub',
      user_id: 'owner-1',
      profile_id: 'prof-1',
      slug: 'jane-unpub',
      published: false,
      visibility: 'public',
      template: 'minimal',
      theme: {},
    };
    fixtures.from.mockImplementation(() => query({ data: site }));

    const anonRes = createResponse();
    await viewPublic({ params: { slug: 'jane-unpub' }, query: { site: '1' } }, anonRes);
    expect(anonRes.statusCode).toBe(404);
  });

  it('selects theme in GET /sites list endpoint', async () => {
    const sitesChain = query({
      data: [{ id: 'site-1', slug: 'jane', template: 'dark', theme: { primaryColor: '#123456' }, visibility: 'public' }],
    });
    fixtures.from.mockReturnValue(sitesChain);

    const res = createResponse();
    await listSites({ user: { id: 'owner-1' } }, res);
    expect(res.statusCode).toBe(200);
    expect(sitesChain.select).toHaveBeenCalledWith(expect.stringContaining('theme'));
    expect(res.body.sites[0].theme).toEqual({ primaryColor: '#123456' });
  });
});
