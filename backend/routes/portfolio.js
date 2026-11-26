import express from 'express';
import { createRequire } from 'module';
import multer from 'multer';
import { authenticateToken, optionalAuth } from '../middleware/auth.ts';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { requireValidFileSignature, uploadEndpointsLimiter } from '../middleware/uploadProtection.js';
import { sanitizeDocumentForPrompt } from '../utils/promptInjectionGuard.js';
import { parseResumeToProfile } from '../services/portfolioResumeParserService.js';
import { fetchGithubPortfolioData } from '../services/portfolioGithubService.js';
import { normalizeLinkedinPayload, validateLinkedinUrl, parseLinkedinExportText } from '../services/portfolioLinkedinService.js';
import { resolveProfileLinkedin } from '../utils/profileUtils.js';
import { getOrCreateUserProfile } from '../services/profileService.ts';
import { mergePortfolioProfile } from '../services/portfolioProfileNormalizerService.js';
import { createPortfolioSite, unpublishPortfolioSite } from '../services/portfolioPublishService.js';
import { normalizePortfolioAppearance } from '../services/portfolioRendererService.js';
import { createShortLink, reservePortfolioSlug, resolveShortLink } from '../services/portfolioShortLinkService.js';
import { reviewRealProject } from '../services/codeReviewService.ts';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    const isAllowedExt = /\.(pdf|docx|doc|txt)$/i.test(file.originalname || '');
    if (allowedMimes.includes(file.mimetype) || isAllowedExt) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Only PDF, DOC, DOCX, and TXT are supported.'));
    }
  },
});
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const router = express.Router();
const DEFAULT_PUBLIC_DOMAIN = process.env.PORTFOLIO_PUBLIC_DOMAIN || 'https://preploop.me/u';

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

// POST /api/portfolio/profiles/parse-linkedin
router.post('/profiles/parse-linkedin', authenticateToken, (req, res) => {
  try {
    const { exportText } = req.body || {};
    if (!exportText || !String(exportText).trim()) {
      return res.status(400).json({ error: 'exportText is required' });
    }
    const parsed = parseLinkedinExportText(String(exportText).slice(0, 15000));
    return res.json({ parsed });
  } catch (error) {
    console.error('LinkedIn export parse error:', error);
    return res.status(500).json({ error: 'Failed to parse LinkedIn export' });
  }
});

// POST /api/portfolio/profiles/import-resume (PDF or DOCX upload)
router.post('/profiles/import-resume', authenticateToken, uploadEndpointsLimiter, upload.single('resume'), requireValidFileSignature(['pdf', 'docx']), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No resume file uploaded' });
    }

    let resumeText = '';
    try {
      const extension = String(req.file.originalname || '').toLowerCase().split('.').pop();
      if (req.file.mimetype === 'application/pdf' || extension === 'pdf') {
        const parsed = await pdfParse(req.file.buffer);
        resumeText = parsed.text || '';
      } else if (
        req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        || extension === 'docx'
      ) {
        const parsed = await mammoth.extractRawText({ buffer: req.file.buffer });
        resumeText = parsed.value || '';
      } else {
        return res.status(415).json({ error: 'Unsupported resume format. Upload a PDF or DOCX file.' });
      }
    } catch (parseError) {
      console.error('Resume document parsing error:', parseError.message);
      return res.status(422).json({ error: 'Could not extract text from this resume. Please upload a text-based PDF or DOCX file.' });
    }

    // Sanitize extracted resume text against prompt injection triggers
    const safeResumeText = sanitizeDocumentForPrompt(resumeText, 20000);

    const resume = parseResumeToProfile({
      text: safeResumeText,
      uploadedFile: req.file.safeName || req.file.originalname || null,
    });

    return res.json({
      resumeText: safeResumeText,
      fileName: req.file.safeName || req.file.originalname,
      parsed: resume,
    });
  } catch (error) {
    console.error('Resume PDF parse error:', error);
    return res.status(500).json({ error: 'Failed to process resume' });
  }
});

// POST /api/portfolio/profiles/import
router.post('/profiles/import', authenticateToken, async (req, res) => {
  try {
    const {
      resumeText,
      resumeMeta,
      githubUsername,
      linkedin,
      useSavedProfile,
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

    // If exportText provided, parse it and merge into linkedin payload
    let parsedExport = {};
    if (linkedin?.exportText) {
      const exp = parseLinkedinExportText(String(linkedin.exportText).slice(0, 15000));
      if (exp) parsedExport = exp;
    }

    const linkedinPayload = normalizeLinkedinPayload({
      ...parsedExport,
      ...linkedin,
      headline: linkedin?.headline || parsedExport.headline,
      summary: linkedin?.summary || parsedExport.summary,
      skills: parsedExport.skills || [],
      experience: parsedExport.experience || [],
      education: parsedExport.education || [],
      url: linkedinUrlValidation.value || parsedExport.linkedin,
    });

    const merged = mergePortfolioProfile({
      resume,
      github,
      linkedin: linkedinPayload,
    });

    if (useSavedProfile === true) {
      const savedProfile = await getOrCreateUserProfile(req.user);
      if (savedProfile.degraded) return res.status(503).json({ error: 'Saved profile temporarily unavailable' });

      const saved = savedProfile.user || {};
      const basics = {
        fullName: saved.fullName,
        headline: saved.currentRole,
        summary: saved.bio,
        photo: saved.avatar_url,
        location: saved.location,
        website: saved.website,
      };
      for (const [key, value] of Object.entries(basics)) {
        if (value) merged.basicInfo[key] = value;
      }
      for (const key of ['linkedin', 'twitter']) {
        if (saved.socialLinks?.[key]) merged.socials[key] = saved.socialLinks[key];
      }
      if (saved.githubUsername) merged.socials.github = saved.githubUsername;
      if (saved.socialLinks?.portfolio) merged.socials.portfolioLink = saved.socialLinks.portfolio;
      if (saved.skills) {
        const skills = String(saved.skills).split(',').map(skill => skill.trim()).filter(Boolean);
        merged.skills.languages = [...new Set([...skills, ...merged.skills.languages])];
      }
      if (saved.experienceSummary) {
        const roles = saved.experienceSummary.split(/[;\n]+/).map(role => role.trim()).filter(Boolean);
        merged.experience = roles.map(role => ({ role, source: 'profile' }));
      }
      if (saved.education) {
        merged.education = [{ institute: saved.education, source: 'profile' }];
      }
      if (Array.isArray(saved.projects) && saved.projects.length) {
        merged.projects = [...saved.projects.map(project => ({ ...project, featured: project.featured ?? true })), ...merged.projects];
      }
      merged.metadata.importSources.push('profile');
    }

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
      .select('id, profile_id, slug, template, theme, published, published_at, created_at, updated_at, visibility')
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
    const { profileId, slug, template, theme, visibility = 'public' } = req.body || {};
    if (!['public', 'unlisted', 'private'].includes(visibility)) {
      return res.status(400).json({ error: 'Invalid portfolio visibility' });
    }

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
      theme,
      visibility,
    });

    const portfolioUrl = `${DEFAULT_PUBLIC_DOMAIN}/${site.slug}?site=1`;
    let shortUrl = null;
    if (site.published) {
      try {
        const shortLink = await createShortLink({
          portfolioSiteId: site.id,
          fullUrl: portfolioUrl,
          preferredSlug: reservedSlug,
        });
        shortUrl = shortLink?.short_url || null;
      } catch (error) {
        console.warn('Portfolio published without a short link:', error.message);
      }
    }

    return res.status(201).json({
      id: site.id,
      slug: site.slug,
      template: site.template,
      theme: site.theme || {},
      published: site.published,
      publishedAt: site.published_at,
      visibility: site.visibility,
      publishedUrl: site.published ? portfolioUrl : null,
      previewUrl: portfolioUrl,
      shortUrl,
    });
  } catch (error) {
    console.error('Create portfolio site error:', error);
    if (error.message === 'Profile not found') {
      return res.status(404).json({ error: 'Portfolio profile not found' });
    }
    return res.status(500).json({ error: 'Failed to create portfolio site' });
  }
});

// GET /api/portfolio/public/:slug
router.get('/public/:slug', optionalAuth, async (req, res) => {
  res.set('Cache-Control', 'private, no-store');
  try {
    const slug = ensureString(req.params.slug, 100);
    if (!slug) {
      return res.status(400).json({ error: 'Invalid slug' });
    }

    const { data: site, error: siteError } = await supabaseAdmin
      .from('portfolio_sites')
      .select('id, user_id, profile_id, slug, published, visibility, template, theme')
      .eq('slug', slug)
      .maybeSingle();

    if (siteError) throw siteError;
    if (!site && req.query.site === '1') {
      return res.status(404).json({ error: 'Portfolio not found' });
    }
    if (!site) {
      // Fallback: check profiles table by exact custom_url or UUID lookup
      let { data: userProfile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('custom_url', slug)
        .maybeSingle();

      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(slug);
      if (!userProfile && isUUID) {
        const byId = await supabaseAdmin.from('profiles').select('*').eq('id', slug).maybeSingle();
        if (byId.data) userProfile = byId.data;
      }

      if (userProfile) {
        const isProfileOwner = Boolean(req.user?.id && userProfile.id && req.user.id === userProfile.id);
        if (!userProfile.is_public && !isProfileOwner) {
          return res.status(403).json({ error: 'This portfolio is private' });
        }
        if (!userProfile.is_public) res.set('X-Robots-Tag', 'noindex');

        let parsedSocialLinks = {};
        if (typeof userProfile.social_links === 'string') {
          try { parsedSocialLinks = JSON.parse(userProfile.social_links); } catch (_e) {}
        } else if (typeof userProfile.social_links === 'object' && userProfile.social_links !== null) {
          parsedSocialLinks = userProfile.social_links;
        }

        const skillsList = (String(userProfile.skills || '')).split(',').map(s => s.trim()).filter(Boolean);

        return res.json({
          portfolio: {
            basics: {
              name: userProfile.full_name || 'PrepLoop Member',
              title: userProfile.designation || userProfile.current_role || '',
              photo: userProfile.avatar_url || '',
              location: userProfile.location || '',
              email: userProfile.email || '',
              website: userProfile.website || '',
              summary: userProfile.bio || '',
            },
            socials: {
              github: userProfile.github_username || '',
              linkedin: resolveProfileLinkedin(parsedSocialLinks, userProfile.linkedin),
              twitter: userProfile.twitter || parsedSocialLinks.twitter || '',
              portfolio: userProfile.portfolio || parsedSocialLinks.portfolio || '',
            },
            skills: { languages: skillsList, frameworks: [], tools: [], domains: [] },
            experience: (String(userProfile.experience || userProfile.experience_summary || '')).split(/\n|\.|;/).map(s => s.trim()).filter(Boolean),
            education: userProfile.education ? [userProfile.education] : [],
            projects: Array.isArray(userProfile.projects) ? userProfile.projects : [],
            achievements: Array.isArray(userProfile.certifications) ? userProfile.certifications : [],
            portfolioMeta: {
              slug: userProfile.custom_url || slug,
              visibility: userProfile.is_public ? 'public' : 'private',
              isOwner: isProfileOwner,
              theme: userProfile.profile_theme || 'aurora',
            },
          },
        });
      }

      return res.status(404).json({ error: 'Portfolio not found' });
    }

    const isOwner = Boolean(req.user?.id && site.user_id && req.user.id === site.user_id);
    const isShared = Boolean(site.published) && ['public', 'unlisted'].includes(site.visibility);
    if (!isShared && !(isOwner && site.visibility === 'private')) {
      return res.status(404).json({ error: 'Portfolio not available' });
    }
    if (site.visibility !== 'public') res.set('X-Robots-Tag', 'noindex');

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('normalized_profiles')
      .select('basic_info, socials, skills, experience, education, projects, achievements')
      .eq('id', site.profile_id)
      .maybeSingle();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'Portfolio profile not found' });
    }

    const appearance = normalizePortfolioAppearance(site.template, site.theme);

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
          isOwner,
          template: appearance.template,
          branding: appearance.theme,
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
      publishedUrl: data.published ? `${DEFAULT_PUBLIC_DOMAIN}/${data.slug}?site=1` : null,
      previewUrl: `${DEFAULT_PUBLIC_DOMAIN}/${data.slug}?site=1`,
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

// POST /api/portfolio/code-review (F2-7: AI-Powered Code Review for Real Projects)
router.post('/code-review', authenticateToken, async (req, res) => {
  try {
    const { repoUrl, code, language } = req.body || {};
    if (!repoUrl && !code) {
      return res.status(400).json({ error: 'Provide either a GitHub repoUrl or pasted code' });
    }
    const review = await reviewRealProject({ repoUrl, code, language });
    return res.json(review);
  } catch (error) {
    const isClientError = /Invalid GitHub|required/i.test(error.message || '');
    return res.status(isClientError ? 400 : 500).json({
      error: error.message || 'Failed to analyze project code',
    });
  }
});

export default router;
