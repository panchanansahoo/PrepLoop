import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import { supabaseAdmin } from '../db/supabaseClient.js';
import {
  normalizeResumeSource,
  normalizeLinkedinSource,
  normalizeGithubSource,
  mergeNormalizedProfiles,
  buildPortfolioPayload,
  normalizeSlug,
} from '../services/portfolioProfileService.js';
import { processGithubForPortfolio } from '../services/githubFetcherService.js';
import { processLinkedInForPortfolio } from '../services/linkedinImporterService.js';
import { processResumeForPortfolio } from '../services/resumeParserService.js';

const router = express.Router();

// Existing code remains the same until the generate endpoint
const githubHeaders = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'PrepLoop-Portfolio',
};

const readGithubReadme = async (username, repoName) => {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(username)}/${encodeURIComponent(repoName)}/readme`,
      { headers: githubHeaders },
    );
    if (!response.ok) return '';
    const json = await response.json();
    if (!json?.content) return '';
    return Buffer.from(String(json.content), 'base64').toString('utf8');
  } catch {
    return '';
  }
};

const getPublishedBaseUrl = (req) => {
  const host = req.get('host') || 'preploop.com';
  const protocol = req.get('x-forwarded-proto') || req.protocol || 'https';
  return `${protocol}://${host}`;
};

const toProfileProjects = (projects = []) =>
  projects.map((project) => ({
    name: project.name || '',
    description: project.description || '',
    technologies: Array.isArray(project.stack) ? project.stack.slice(0, 12) : [],
    link: project.repoUrl || '',
    liveUrl: project.liveUrl || '',
    source: project.source || 'generated',
    stars: typeof project.stars === 'number' ? project.stars : 0,
    language: project.language || '',
  }));

// New endpoint to connect and import GitHub
router.post('/connect/github', authenticateToken, body('githubUsername').isString().trim(), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { githubUsername } = req.body;
    
    if (!githubUsername) {
      return res.status(400).json({ error: 'GitHub username is required' });
    }

    // Fetch GitHub data
    const githubData = await processGithubForPortfolio(githubUsername);
    
    // Update user profile with GitHub username
    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        github_username: githubUsername,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.user.id)
      .select()
      .single();

    if (updateError) throw updateError;

    return res.status(200).json({
      success: true,
      githubData,
      profile: updatedProfile,
    });
  } catch (error) {
    console.error('GitHub connection error:', error);
    return res.status(500).json({ error: 'Failed to connect GitHub account' });
  }
});

// New endpoint to connect and import LinkedIn
router.post('/connect/linkedin', authenticateToken, body('linkedinUrl').isString().trim(), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { linkedinUrl } = req.body;
    
    if (!linkedinUrl) {
      return res.status(400).json({ error: 'LinkedIn URL is required' });
    }

    // Process LinkedIn data (for now, return skeleton)
    const linkedinData = await processLinkedInForPortfolio(linkedinUrl);
    
    // Update user's social links
    const { data: profileRow, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('social_links')
      .eq('id', req.user.id)
      .maybeSingle();

    if (profileError) throw profileError;

    const updatedSocialLinks = {
      ...(profileRow?.social_links || {}),
      linkedin: linkedinUrl,
    };

    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        social_links: updatedSocialLinks,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.user.id)
      .select()
      .single();

    if (updateError) throw updateError;

    return res.status(200).json({
      success: true,
      linkedinData,
      profile: updatedProfile,
    });
  } catch (error) {
    console.error('LinkedIn connection error:', error);
    return res.status(500).json({ error: 'Failed to connect LinkedIn account' });
  }
});

// New endpoint to upload and process resume
router.post('/upload/resume', authenticateToken, async (req, res) => {
  try {
    // Since we can't easily access multipart form data in this context,
    // we'll expect the file as base64 string in the request body
    const { fileData, fileName, fileType } = req.body;
    
    if (!fileData || !fileName || !fileType) {
      return res.status(400).json({ error: 'File data, name and type are required' });
    }
    
    // Convert base64 to buffer
    const fileBuffer = Buffer.from(fileData, 'base64');
    
    // Process the resume
    const resumeData = await processResumeForPortfolio(fileBuffer, fileType);
    
    // Store in resume_analyses table
    const { data: insertedResume, error: resumeError } = await supabaseAdmin
      .from('resume_analyses')
      .insert({
        user_id: req.user.id,
        resume_text: resumeData.text || '',
        parsed_data: resumeData.extracted,
        analyzed_at: new Date().toISOString(),
        uploaded_file: fileName,
      })
      .select()
      .single();

    if (resumeError) throw resumeError;

    return res.status(200).json({
      success: true,
      resumeData: resumeData,
      resumeAnalysis: insertedResume,
    });
  } catch (error) {
    console.error('Resume upload error:', error);
    return res.status(500).json({ error: 'Failed to process resume' });
  }
});

// Updated generate endpoint to handle all connected sources
router.post(
  '/generate',
  authenticateToken,
  body('template').optional().isString().trim(),
  body('theme').optional().isString().trim(),
  body('slug').optional().isString().trim(),
  body('githubUsername').optional().isString().trim(),
  body('linkedinUrl').optional().isString().trim(),
  body('linkedinData').optional().isObject(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { template = 'minimal-professional', theme = 'light' } = req.body || {};
      const requestedSlug = req.body?.slug || req.user?.user_metadata?.full_name || req.user?.email || 'portfolio';
      const slug = normalizeSlug(requestedSlug, 'portfolio');

      const { data: profileRow, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', req.user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      // Get latest resume
      const { data: latestResume, error: resumeError } = await supabaseAdmin
        .from('resume_analyses')
        .select('*')
        .eq('user_id', req.user.id)
        .order('analyzed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (resumeError) throw resumeError;

      // Get GitHub data
      const githubUsername = (req.body?.githubUsername || profileRow?.github_username || '').trim();
      let githubProfile = null;
      let githubRepos = [];

      if (githubUsername) {
        const [profileResponse, reposResponse] = await Promise.all([
          fetch(`https://api.github.com/users/${encodeURIComponent(githubUsername)}`, { headers: githubHeaders }),
          fetch(`https://api.github.com/users/${encodeURIComponent(githubUsername)}/repos?per_page=20&sort=updated&type=owner`, { headers: githubHeaders }),
        ]);

        if (profileResponse.ok) {
          githubProfile = await profileResponse.json();
        }
        if (reposResponse.ok) {
          githubRepos = await reposResponse.json();
        }

        const topRepoNames = githubRepos.slice(0, 10).map((repo) => repo.name).filter(Boolean);
        const readmes = await Promise.all(topRepoNames.map((repoName) => readGithubReadme(githubUsername, repoName)));
        const readmeMap = new Map(topRepoNames.map((repoName, index) => [repoName, readmes[index]]));

        githubRepos = githubRepos.map((repo) => ({
          ...repo,
          readmeText: readmeMap.get(repo.name) || '',
        }));
      }

      // Get LinkedIn data
      const linkedinUrl = req.body?.linkedinUrl || profileRow?.social_links?.linkedin || '';
      const linkedinData = req.body?.linkedinData || {};

      // Normalize sources
      const resumeSource = normalizeResumeSource({ latestAnalysis: latestResume });
      const linkedinSource = normalizeLinkedinSource({ linkedinUrl, profileData: linkedinData });
      const githubSource = normalizeGithubSource({ profileData: githubProfile || {}, repositories: githubRepos });

      // Merge profiles
      const mergedProfile = mergeNormalizedProfiles({
        resume: resumeSource,
        linkedin: linkedinSource,
        github: githubSource,
      });

      if (!mergedProfile.basics.name) {
        mergedProfile.basics.name = profileRow?.full_name || req.user?.user_metadata?.full_name || '';
      }
      if (!mergedProfile.basics.email) {
        mergedProfile.basics.email = req.user?.email || '';
      }

      const publishedBaseUrl = getPublishedBaseUrl(req);
      const publishedUrl = `${publishedBaseUrl}/u/${slug}`;

      const portfolioPayload = buildPortfolioPayload({
        mergedProfile,
        template,
        theme,
        slug,
        publishedUrl,
      });

      const updates = {
        projects: toProfileProjects(portfolioPayload.featuredProjects),
        portfolio_data: portfolioPayload,
        import_sources: {
          ...(profileRow?.import_sources || {}),
          resume: Boolean(latestResume),
          github: Boolean(githubUsername),
          linkedin: Boolean(linkedinUrl || Object.keys(linkedinData).length > 0),
          lastMergedAt: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      };

      const { data: updatedProfile, error: updateError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: req.user.id,
          full_name: profileRow?.full_name || req.user?.user_metadata?.full_name || '',
          social_links: profileRow?.social_links || {},
          ...updates,
        }, { onConflict: 'id' })
        .select('*')
        .single();

      if (updateError) throw updateError;

      return res.status(200).json({
        success: true,
        slug,
        publishedUrl,
        template,
        theme,
        portfolio: portfolioPayload,
        profile: updatedProfile,
      });
    } catch (error) {
      console.error('Portfolio generation error:', error);
      return res.status(500).json({ error: 'Failed to generate portfolio' });
    }
  },
);

// Endpoint to get user's portfolio status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const { data: profileRow, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('github_username, social_links, import_sources, portfolio_data')
      .eq('id', req.user.id)
      .maybeSingle();

    if (profileError) throw profileError;

    const { data: resumeAnalyses, error: resumeError } = await supabaseAdmin
      .from('resume_analyses')
      .select('id')
      .eq('user_id', req.user.id)
      .limit(1)
      .maybeSingle();

    if (resumeError) throw resumeError;

    return res.status(200).json({
      hasResume: !!resumeAnalyses,
      hasGithub: !!profileRow?.github_username,
      hasLinkedIn: !!profileRow?.social_links?.linkedin,
      importSources: profileRow?.import_sources || {},
      isPortfolioGenerated: !!profileRow?.portfolio_data,
      portfolioUrl: profileRow?.portfolio_data?.publishedUrl || null,
    });
  } catch (error) {
    console.error('Portfolio status error:', error);
    return res.status(500).json({ error: 'Failed to fetch portfolio status' });
  }
});

router.get(
  '/public/:slug',
  param('slug').isString().trim().isLength({ min: 2, max: 100 }),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const slug = normalizeSlug(req.params.slug);
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, portfolio_data, projects, social_links')
        .filter('portfolio_data->>slug', 'eq', slug)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data?.portfolio_data?.isPublished) {
        return res.status(404).json({ error: 'Portfolio not found' });
      }

      return res.status(200).json({
        success: true,
        slug,
        portfolio: data.portfolio_data,
        projects: data.projects || [],
        fullName: data.full_name || '',
        socials: data.social_links || {},
      });
    } catch (error) {
      console.error('Portfolio public fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch public portfolio' });
    }
  },
);

// ═══ PATCH /customize — update template/theme/slug/visibility without re-generating ═══
router.patch(
  '/customize',
  authenticateToken,
  async (req, res) => {
    try {
      const { template, theme, slug, sectionVisibility } = req.body || {};

      const { data: profileRow, error: fetchErr } = await supabaseAdmin
        .from('profiles')
        .select('portfolio_data')
        .eq('id', req.user.id)
        .maybeSingle();

      if (fetchErr) throw fetchErr;

      const existing = profileRow?.portfolio_data || {};
      const updated = { ...existing };

      if (template) updated.template = template;
      if (theme) updated.theme = theme;
      if (slug) updated.slug = normalizeSlug(slug);
      if (sectionVisibility && typeof sectionVisibility === 'object') {
        updated.sectionVisibility = { ...(existing.sectionVisibility || {}), ...sectionVisibility };
      }

      const { error: updateErr } = await supabaseAdmin
        .from('profiles')
        .update({ portfolio_data: updated })
        .eq('id', req.user.id);

      if (updateErr) throw updateErr;

      return res.status(200).json({
        success: true,
        portfolioData: updated,
      });
    } catch (error) {
      console.error('Portfolio customize error:', error);
      return res.status(500).json({ error: 'Failed to update portfolio settings' });
    }
  },
);

// ═══ GET /preview — fetch portfolio data for live preview ═══
router.get(
  '/preview',
  authenticateToken,
  async (req, res) => {
    try {
      const { data: profileRow, error } = await supabaseAdmin
        .from('profiles')
        .select('portfolio_data, full_name, social_links, projects')
        .eq('id', req.user.id)
        .maybeSingle();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        portfolio: profileRow?.portfolio_data || null,
        fullName: profileRow?.full_name || '',
        socials: profileRow?.social_links || {},
        projects: profileRow?.projects || [],
      });
    } catch (error) {
      console.error('Portfolio preview error:', error);
      return res.status(500).json({ error: 'Failed to fetch portfolio preview' });
    }
  },
);

export default router;