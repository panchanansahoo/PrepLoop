import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { parseResumeToProfile } from '../services/portfolioResumeParserService.js';
import { fetchGithubPortfolioData } from '../services/portfolioGithubService.js';
import { normalizeLinkedinPayload, validateLinkedinUrl } from '../services/portfolioLinkedinService.js';
import { mergePortfolioProfile } from '../services/portfolioProfileNormalizerService.js';
import { createPortfolioSite, unpublishPortfolioSite } from '../services/portfolioPublishService.js';
import { createShortLink, reservePortfolioSlug, resolveShortLink } from '../services/portfolioShortLinkService.js';

const router = express.Router();
const DEFAULT_PUBLIC_DOMAIN = process.env.PORTFOLIO_PUBLIC_DOMAIN || 'https://preploop.com/u';

const ensureString = (value, maxLength = 300) => String(value || '').trim().slice(0, maxLength);

const mapProfileRowToResponse = (row) => ({
  id: row.id,
  userId: row.user_id,
  basicInfo: row.basic_info || {},
  contacts: row.contacts || {},
  socials: row.socials || {},
  skills: row.skills || {},
  experience: row.experience || [],
  education: row.education || [],
  projects: row.projects || [],
  certifications: row.certifications || [],
  achievements: row.achievements || [],
  metadata: row.metadata || {},
  dataQualityScore: Number(row.data_quality_score || 0),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// POST /api/portfolio/profiles/import
router.post('/profiles/import', authenticateToken, async (req, res) => {
  try {
    const {
      resumeText,
      resumeMeta,
      githubUsername,
      linkedin,
    } = req.body || {};

    const safeGithubUsername = ensureString(githubUsername, 80);
    const linkedinUrlValidation = validateLinkedinUrl(linkedin?.url);

    if (!linkedinUrlValidation.valid) {
      return res.status(400).json({ error: linkedinUrlValidation.error });
    }

    const resume = parseResumeToProfile({
      text: ensureString(resumeText, 20000),
      uploadedFile: ensureString(resumeMeta?.fileName, 255) || null,
    });

    const github = safeGithubUsername
      ? await fetchGithubPortfolioData(safeGithubUsername)
      : { username: null, profile: {}, repositories: [], organizations: [] };

    const linkedinPayload = normalizeLinkedinPayload({
      ...linkedin,
      url: linkedinUrlValidation.value,
    });

    const merged = mergePortfolioProfile({
      resume,
      github,
      linkedin: linkedinPayload,
    });

    const { data, error } = await supabaseAdmin
      .from('normalized_profiles')
      .insert({
        user_id: req.user.id,
        basic_info: merged.basicInfo,
        contacts: {
          email: merged.basicInfo.email,
          phone: merged.basicInfo.phone,
          website: merged.basicInfo.website,
        },
        socials: merged.socials,
        skills: merged.skills,
        experience: merged.experience,
        education: merged.education,
        projects: merged.projects,
        certifications: merged.certifications || [],
        achievements: merged.achievements || [],
        metadata: merged.metadata,
        data_quality_score: merged.metadata.dataQualityScore,
      })
      .select('*')
      .single();

    if (error || !data) {
      console.error('Portfolio import save failed:', error);
      return res.status(500).json({ error: 'Failed to save normalized portfolio profile' });
    }

    return res.status(201).json(mapProfileRowToResponse(data));
  } catch (error) {
    console.error('Portfolio import error:', error);
    return res.status(500).json({ error: 'Failed to import portfolio profile' });
  }
});

// GET /api/portfolio/profiles/:id
router.get('/profiles/:id', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('normalized_profiles')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Portfolio profile not found' });
    }

    return res.json(mapProfileRowToResponse(data));
  } catch (error) {
    console.error('Fetch portfolio profile error:', error);
    return res.status(500).json({ error: 'Failed to fetch portfolio profile' });
  }
});

// PUT /api/portfolio/profiles/:id
router.put('/profiles/:id', authenticateToken, async (req, res) => {
  try {
    const allowedFields = [
      'basicInfo',
      'contacts',
      'socials',
      'skills',
      'experience',
      'education',
      'projects',
      'certifications',
      'achievements',
      'metadata',
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body || {}, field)) {
        const dbField = field.replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`);
        updates[dbField] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields provided for update' });
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('normalized_profiles')
      .update(updates)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select('*')
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Portfolio profile not found or update failed' });
    }

    return res.json(mapProfileRowToResponse(data));
  } catch (error) {
    console.error('Update portfolio profile error:', error);
    return res.status(500).json({ error: 'Failed to update portfolio profile' });
  }
});

// GET /api/portfolio/sites
router.get('/sites', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('portfolio_sites')
      .select('id, profile_id, slug, template, published, published_at, created_at, updated_at, visibility')
      .eq('user_id', req.user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch portfolio sites' });
    }

    return res.json({ sites: data || [] });
  } catch (error) {
    console.error('List portfolio sites error:', error);
    return res.status(500).json({ error: 'Failed to list portfolio sites' });
  }
});

// POST /api/portfolio/sites
router.post('/sites', authenticateToken, async (req, res) => {
  try {
    const { profileId, slug, template, theme } = req.body || {};

    if (!profileId) {
      return res.status(400).json({ error: 'profileId is required' });
    }

    const safeTemplate = ensureString(template || 'minimal', 32) || 'minimal';
    const reservedSlug = await reservePortfolioSlug(ensureString(slug, 80));

    const site = await createPortfolioSite({
      userId: req.user.id,
      profileId,
      slug: reservedSlug,
      template: safeTemplate,
      theme: typeof theme === 'object' && theme !== null ? theme : {},
    });

    const publishedUrl = `${DEFAULT_PUBLIC_DOMAIN}/${site.slug}`;
    const shortLink = await createShortLink({
      portfolioSiteId: site.id,
      fullUrl: publishedUrl,
      preferredSlug: reservedSlug,
    });

    return res.status(201).json({
      id: site.id,
      slug: site.slug,
      template: site.template,
      published: site.published,
      publishedAt: site.published_at,
      publishedUrl,
      shortUrl: shortLink.short_url,
    });
  } catch (error) {
    console.error('Create portfolio site error:', error);
    return res.status(500).json({ error: 'Failed to create portfolio site' });
  }
});

// GET /api/portfolio/public/:slug
router.get('/public/:slug', async (req, res) => {
  try {
    const slug = ensureString(req.params.slug, 100);
    if (!slug) {
      return res.status(400).json({ error: 'Invalid slug' });
    }

    const { data: site, error: siteError } = await supabaseAdmin
      .from('portfolio_sites')
      .select('id, profile_id, slug, published, visibility')
      .eq('slug', slug)
      .single();

    if (siteError || !site) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    if (!site.published || (site.visibility !== 'public' && site.visibility !== 'unlisted')) {
      return res.status(404).json({ error: 'Portfolio not available' });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('normalized_profiles')
      .select('basic_info, socials, skills, experience, education, projects, achievements')
      .eq('id', site.profile_id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'Portfolio profile not found' });
    }

    return res.json({
      portfolio: {
        basics: {
          name: profile.basic_info?.fullName || '',
          title: profile.basic_info?.headline || '',
          photo: profile.basic_info?.photo || '',
          location: profile.basic_info?.location || '',
          email: profile.basic_info?.email || '',
          website: profile.basic_info?.website || '',
          summary: profile.basic_info?.summary || '',
        },
        socials: profile.socials || {},
        skills: profile.skills || {},
        experience: profile.experience || [],
        education: profile.education || [],
        projects: profile.projects || [],
        achievements: profile.achievements || [],
        portfolioMeta: {
          slug: site.slug,
          visibility: site.visibility,
        },
      },
    });
  } catch (error) {
    console.error('Public portfolio fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch public portfolio' });
  }
});

// GET /api/portfolio/sites/:id
router.get('/sites/:id', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('portfolio_sites')
      .select('id, profile_id, slug, template, theme, published, published_at, visibility, created_at, updated_at')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Portfolio site not found' });
    }

    return res.json({
      ...data,
      publishedUrl: `${DEFAULT_PUBLIC_DOMAIN}/${data.slug}`,
    });
  } catch (error) {
    console.error('Get portfolio site error:', error);
    return res.status(500).json({ error: 'Failed to fetch portfolio site' });
  }
});

// DELETE /api/portfolio/sites/:id
router.delete('/sites/:id', authenticateToken, async (req, res) => {
  try {
    await unpublishPortfolioSite({
      userId: req.user.id,
      siteId: req.params.id,
    });

    return res.status(204).send();
  } catch (error) {
    console.error('Delete/unpublish portfolio site error:', error);
    return res.status(500).json({ error: 'Failed to unpublish portfolio site' });
  }
});

// GET /api/portfolio/short-links/:slug/resolve
router.get('/short-links/:slug/resolve', async (req, res) => {
  try {
    const fullUrl = await resolveShortLink(req.params.slug);
    if (!fullUrl) {
      return res.status(404).json({ error: 'Short link not found' });
    }

    return res.redirect(302, fullUrl);
  } catch (error) {
    console.error('Resolve short link error:', error);
    return res.status(500).json({ error: 'Failed to resolve short link' });
  }
});

export default router;
