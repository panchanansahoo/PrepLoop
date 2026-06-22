import express from 'express';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { authenticateToken, requireAdmin, optionalAuth } from '../middleware/auth.js';
import { buildCareerOpsHistoryRecord, mapCareerOpsHistoryRow } from '../utils/careerOps.js';
import { fetchAllIndianJobs } from '../utils/indianJobApis.js';
import { getCachedJobs, setCachedJobs, checkRateLimit } from '../utils/jobCache.js';
import {
  buildCareerSearchQuery,
  hasMeaningfulProfileSignals,
  normalizeProfileSignals,
  scoreJobsAgainstProfile,
} from '../services/preploopCareerService.js';
import { createLogger } from '../utils/structuredLogger.js';

const router = express.Router();
const logger = createLogger('jobs');

// ─── Free Job API (JSearch via RapidAPI) ─────────────────────────
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';
const JSEARCH_HOST = 'jsearch.p.rapidapi.com';

// ─── Adzuna API (free tier, India-focused) ───────────────────────
const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID || '';
const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY || '';

// ─── Free Indian Job APIs (no key required) ───────────────────────
const _ALLOWED_INDIAN_JOB_HOSTS = new Set(['www.naukri.com', 'in.indeed.com', 'www.foundit.in']);

// ─── Groq API for AI-powered search ─────────────────────────────
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

const ALLOWED_EXTERNAL_JOB_HOSTS = new Set([JSEARCH_HOST, 'api.adzuna.com', 'www.naukri.com', 'in.indeed.com', 'www.foundit.in', 'www.linkedin.com']);

function ensureAllowedExternalJobUrl(candidateUrl) {
  const parsed = new URL(candidateUrl);
  if (parsed.protocol !== 'https:' || !ALLOWED_EXTERNAL_JOB_HOSTS.has(parsed.hostname)) {
    throw new Error(`Blocked external jobs URL host: ${parsed.hostname}`);
  }
  return parsed.toString();
}

// ─── Curated fallback jobs (always available) ────────────────────
const CURATED_JOBS = [
  {
    id: 'curated_1', title: 'Software Engineer – Fresher', company: 'TCS',
    category: 'fresher', type: 'full-time', location: 'Mumbai, India',
    salary_range: '₹3.5 – 7 LPA', description: 'TCS is hiring fresh graduates for full-stack development roles across multiple locations. Strong fundamentals in Java, Python, or JavaScript required.',
    requirements: ['B.Tech / B.E. in CS / IT', 'Knowledge of Java or Python', 'Good problem-solving skills'],
    apply_link: 'https://www.tcs.com/careers', deadline: null, is_active: true,
    tags: ['TCS', 'Full-time'], source: 'curated', created_at: new Date().toISOString(), logo_url: null,
  },
  {
    id: 'curated_2', title: 'Associate Software Engineer', company: 'Infosys',
    category: 'fresher', type: 'full-time', location: 'Bengaluru, India',
    salary_range: '₹3.6 – 6 LPA', description: 'Infosys recruits freshers via InfyTQ platform. Roles span web development, cloud computing, and data engineering.',
    requirements: ['B.E. / B.Tech', '60% aggregate', 'No active backlogs'],
    apply_link: 'https://www.infosys.com/careers', deadline: null, is_active: true,
    tags: ['Infosys', 'Full-time'], source: 'curated', created_at: new Date().toISOString(), logo_url: null,
  },
  {
    id: 'curated_3', title: 'SDE Intern – 6 months', company: 'Amazon',
    category: 'internship', type: 'internship', location: 'Hyderabad, India',
    salary_range: '₹80,000 /month', description: 'Amazon 6-month SDE internship for pre-final year students. Work on real production systems at scale.',
    requirements: ['Pre-final year B.Tech CS', 'DSA proficiency', 'Familiar with OOP'],
    apply_link: 'https://www.amazon.jobs/en/teams/internships', deadline: null, is_active: true,
    tags: ['Amazon', 'Internship'], source: 'curated', created_at: new Date().toISOString(), logo_url: null,
  },
  {
    id: 'curated_4', title: 'Junior Developer – Off Campus', company: 'Wipro',
    category: 'off-campus', type: 'full-time', location: 'Pune, India',
    salary_range: '₹3.5 – 5 LPA', description: 'Wipro off-campus hiring for 2024/2025 batch. Roles in WILP programme across SAP, Java, and cloud tracks.',
    requirements: ['B.Tech / MCA', '60% throughout', 'Willing to relocate'],
    apply_link: 'https://careers.wipro.com', deadline: null, is_active: true,
    tags: ['Wipro', 'Off-Campus'], source: 'curated', created_at: new Date().toISOString(), logo_url: null,
  },
  {
    id: 'curated_5', title: 'Graduate Engineer Trainee', company: 'HCLTech',
    category: 'campus', type: 'full-time', location: 'Noida, India',
    salary_range: '₹4 – 7 LPA', description: 'HCLTech campus hiring through TechBee and direct campus drives. Roles in product engineering and digital services.',
    requirements: ['B.Tech CS/IT/ECE', 'Strong communication skills', 'Willingness to learn'],
    apply_link: 'https://www.hcltech.com/careers', deadline: null, is_active: true,
    tags: ['HCLTech', 'Campus'], source: 'curated', created_at: new Date().toISOString(), logo_url: null,
  },
  {
    id: 'curated_6', title: 'SDE-1 (New Grad)', company: 'Google',
    category: 'fresher', type: 'full-time', location: 'Bengaluru, India',
    salary_range: '₹15 – 25 LPA', description: 'Google new graduate SDE-1 role. Work on large-scale distributed systems, search infrastructure, or Android platform.',
    requirements: ['B.Tech / MS in CS', 'Strong DSA & algorithms', 'Experience with C++, Java, or Python'],
    apply_link: 'https://careers.google.com', deadline: null, is_active: true,
    tags: ['Google', 'Full-time'], source: 'curated', created_at: new Date().toISOString(), logo_url: null,
  },
];

async function fetchExternalJobs(query = 'fresher software developer India', page = 1) {
  // Ensure query includes India context
  const indianQuery = query.toLowerCase().includes('india') ? query : `${query} India`;
  
  // Check cache first
  const cacheKey = `jobs_${indianQuery}_${page}`;
  const cached = getCachedJobs(cacheKey);
  if (cached) {
    logger.info(`Returning ${cached.length} cached Indian jobs for: ${indianQuery}`);
    return cached;
  }

  let aggregatedJobs = [];

  // ── Priority 1: Free Indian Job APIs (Indeed, Naukri, Foundit, LinkedIn) ──
  try {
    logger.info(`Fetching Indian jobs for query: ${indianQuery}`);
    const indianJobs = await Promise.race([
      fetchAllIndianJobs(indianQuery, 'India'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
    ]);
    
    if (indianJobs && indianJobs.length > 0) {
      logger.info(`Fetched ${indianJobs.length} jobs from Indian job portals`);
      aggregatedJobs.push(...indianJobs);
    } else {
      logger.info('No jobs from Indian portals, trying fallbacks...');
    }
  } catch (error) {
    logger.error('Indian job APIs error', { error: error.message });
  }

  // ── Try JSearch (RapidAPI) - Filter for India only ──
  if (RAPIDAPI_KEY && aggregatedJobs.length < 50) {
    try {
      const url = `https://${JSEARCH_HOST}/search?query=${encodeURIComponent(indianQuery)}&page=${page}&num_pages=1&date_posted=month`;
      const safeUrl = ensureAllowedExternalJobUrl(url);
      const response = await fetch(safeUrl, {
        headers: {
          'x-rapidapi-key': RAPIDAPI_KEY,
          'x-rapidapi-host': JSEARCH_HOST,
        },
      });

      if (response.ok) {
        const result = await response.json();
        const jobs = (result.data || [])
          .filter(job => {
            const country = (job.job_country || '').toLowerCase();
            const location = `${job.job_city || ''} ${job.job_state || ''} ${country}`.toLowerCase();
            return country === 'india' || location.includes('india');
          })
          .map(job => ({
            id: `ext_${job.job_id}`,
            title: job.job_title,
            company: job.employer_name,
            category: detectCategory(job),
            type: job.job_employment_type?.toLowerCase() || 'full-time',
            location: job.job_city
              ? `${job.job_city}, ${job.job_state || ''} ${job.job_country || ''}`.trim()
              : job.job_country || 'Remote',
            salary_range: job.job_min_salary && job.job_max_salary
              ? `${job.job_min_salary} - ${job.job_max_salary} ${job.job_salary_currency || ''}`
              : null,
            description: job.job_description?.substring(0, 500) + '...',
            requirements: job.job_highlights?.Qualifications || [],
            apply_link: job.job_apply_link,
            deadline: job.job_offer_expiration_datetime_utc || null,
            is_active: true,
            tags: [job.employer_name, job.job_employment_type].filter(Boolean),
            source: 'jsearch',
            created_at: job.job_posted_at_datetime_utc || new Date().toISOString(),
            logo_url: job.employer_logo,
          }));

        if (jobs.length > 0) {
          logger.info(`Fetched ${jobs.length} Indian jobs from JSearch`);
          aggregatedJobs.push(...jobs);
        }
      }
    } catch (error) {
      logger.error('JSearch API error', { error: error.message });
    }
  }

  // ── Fallback 1: Adzuna API (India-focused, free tier) ──
  if (ADZUNA_APP_ID && ADZUNA_APP_KEY && aggregatedJobs.length < 50) {
    try {
      // Adzuna's URL already scopes to India (/in/), so strip "India" and "fresher" from keywords
      const cleanQuery = indianQuery.replace(/\bIndia\b/gi, '').replace(/\bfresher\b/gi, '').trim() || 'software developer';
      const keyword = encodeURIComponent(cleanQuery);
      const adzunaUrl = `https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&results_per_page=50&what=${keyword}&max_days_old=30`;
      const safeAdzunaUrl = ensureAllowedExternalJobUrl(adzunaUrl);
      const response = await fetch(safeAdzunaUrl);

      if (response.ok) {
        const result = await response.json();
        const jobs = (result.results || []).map((job, idx) => ({
          id: `adz_${job.id || idx}`,
          title: job.title,
          company: job.company?.display_name || 'Unknown',
          category: detectCategory({ job_title: job.title, job_description: job.description || '' }),
          type: job.contract_time || 'full-time',
          location: job.location?.display_name || 'India',
          salary_range: job.salary_min && job.salary_max
            ? `₹${Math.round(job.salary_min).toLocaleString('en-IN')} – ₹${Math.round(job.salary_max).toLocaleString('en-IN')}`
            : null,
          description: (job.description || '').substring(0, 500) + '...',
          requirements: [],
          apply_link: job.redirect_url,
          deadline: null,
          is_active: true,
          tags: [job.company?.display_name, job.category?.label, 'India'].filter(Boolean),
          source: 'adzuna',
          created_at: job.created || new Date().toISOString(),
          logo_url: null,
        }));

        if (jobs.length > 0) {
          logger.info(`Fetched ${jobs.length} Indian jobs from Adzuna`);
          aggregatedJobs.push(...jobs);
        }
      }
    } catch (error) {
      logger.error('Adzuna API error', { error: error.message });
    }
  }

  // ── Skip Remotive API (not India-focused) ──
  // Remotive is primarily for remote jobs outside India

  if (aggregatedJobs.length === 0) {
    // ── Final fallback: curated Indian jobs ──
    logger.info('Using curated Indian fallback jobs');
    aggregatedJobs = CURATED_JOBS;
  }

  // Deduplicate jobs by title and company to avoid exact matches showing up multiple times
  const uniqueJobsMap = new Map();
  for (const job of aggregatedJobs) {
    const dedupKey = `${job.title?.toLowerCase()}-${job.company?.toLowerCase()}`;
    if (!uniqueJobsMap.has(dedupKey)) {
      uniqueJobsMap.set(dedupKey, job);
    }
  }
  
  const finalJobs = Array.from(uniqueJobsMap.values());
  setCachedJobs(cacheKey, finalJobs);
  return finalJobs;
}

function detectCategory(job) {
  const title = (job.job_title || '').toLowerCase();
  const desc = (job.job_description || '').toLowerCase();

  if (title.includes('intern') || desc.includes('internship')) return 'internship';
  if (title.includes('fresher') || title.includes('entry level') || title.includes('graduate')) return 'fresher';
  if (title.includes('campus') || desc.includes('campus placement')) return 'campus';
  return 'off-campus';
}

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'have', 'will', 'your', 'you', 'our', 'are', 'into', 'about',
  'role', 'team', 'work', 'years', 'year', 'must', 'required', 'requirements', 'nice', 'plus', 'good', 'strong',
  'ability', 'experience', 'developer', 'engineer', 'software', 'building', 'skills', 'skill', 'using', 'across',
]);

function normalizeText(input) {
  return String(input || '').toLowerCase().replace(/[^a-z0-9+#.\-\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function tokenize(input) {
  const text = normalizeText(input);
  if (!text) return [];
  return text
    .split(' ')
    .map(token => token.trim())
    .filter(token => token.length > 2 && !STOP_WORDS.has(token));
}

function uniqueStrings(items) {
  const seen = new Set();
  const output = [];
  for (const item of items || []) {
    const normalized = String(item || '').trim();
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(normalized);
  }
  return output;
}

function extractJdKeywords(jobDescription) {
  const explicitLines = String(jobDescription || '')
    .split('\n')
    .filter(line => /must|required|requirements|need|looking for/i.test(line));

  const explicitTokens = tokenize(explicitLines.join(' '));
  const allTokens = tokenize(jobDescription);
  const combined = [...explicitTokens, ...allTokens];
  return uniqueStrings(combined).slice(0, 40);
}

function splitSkills(input) {
  if (Array.isArray(input)) {
    return uniqueStrings(input.map(x => String(x || '').trim()).filter(Boolean));
  }

  const raw = String(input || '').trim();
  if (!raw) return [];
  return uniqueStrings(raw.split(',').map(item => item.trim()).filter(Boolean));
}

function isMissingCareerOpsSchema(error) {
  const code = String(error?.code || '').toUpperCase();
  const message = String(error?.message || '').toLowerCase();
  return code === 'PGRST204' || code === '42P01' || message.includes('career_ops_evaluations');
}

function evaluateCareerOpsFit({ jobDescription, candidateProfile }) {
  const profile = candidateProfile || {};
  const headline = String(profile.headline || profile.candidateHeadline || '').trim();
  const summary = String(profile.summary || '').trim();
  const coreSkills = splitSkills(profile.coreSkills || profile.skills || []);
  const projectHighlights = Array.isArray(profile.projectHighlights) ? profile.projectHighlights.slice(0, 5) : [];
  const yearsOfExperience = Number(profile.yearsOfExperience || 0);

  const candidateText = [headline, summary, ...coreSkills, ...projectHighlights].join(' ');
  const jdText = String(jobDescription || '');
  const jdKeywords = extractJdKeywords(jdText);
  const candidateTokens = new Set(tokenize(candidateText));

  const matchedKeywords = jdKeywords.filter(keyword => candidateTokens.has(String(keyword).toLowerCase()));
  const unmatchedKeywords = jdKeywords.filter(keyword => !candidateTokens.has(String(keyword).toLowerCase()));

  const skillOverlapRatio = jdKeywords.length ? matchedKeywords.length / jdKeywords.length : 0;
  const projectSignal = projectHighlights.length >= 2 ? 1 : projectHighlights.length === 1 ? 0.6 : 0;
  const summarySignal = summary.length >= 80 ? 1 : summary.length >= 35 ? 0.6 : 0.25;
  const experienceSignal = yearsOfExperience >= 3 ? 1 : yearsOfExperience >= 1 ? 0.7 : 0.45;

  const dimensions = [
    {
      id: 'skill-overlap',
      label: 'Skill Overlap',
      weight: 0.4,
      score: Number((Math.min(1, skillOverlapRatio * 1.25) * 5).toFixed(2)),
    },
    {
      id: 'project-proof',
      label: 'Project Proof',
      weight: 0.2,
      score: Number((projectSignal * 5).toFixed(2)),
    },
    {
      id: 'profile-clarity',
      label: 'Profile Clarity',
      weight: 0.15,
      score: Number((summarySignal * 5).toFixed(2)),
    },
    {
      id: 'experience-fit',
      label: 'Experience Fit',
      weight: 0.15,
      score: Number((experienceSignal * 5).toFixed(2)),
    },
    {
      id: 'portfolio-depth',
      label: 'Portfolio Depth',
      weight: 0.1,
      score: Number((Math.min(1, coreSkills.length / 8) * 5).toFixed(2)),
    },
  ];

  const weightedTotal = dimensions.reduce((sum, d) => sum + d.score * d.weight, 0);
  const overallScore = Number(weightedTotal.toFixed(2));

  const scoreBand = overallScore >= 4.2
    ? 'Strong Match'
    : overallScore >= 3.3
      ? 'Potential Match'
      : 'Low Match';

  const topMatches = uniqueStrings([
    ...matchedKeywords.slice(0, 5).map(keyword => `Relevant keyword match: ${keyword}`),
    headline ? `Clear profile headline: ${headline}` : '',
    projectHighlights[0] ? `Project evidence: ${projectHighlights[0]}` : '',
  ]).slice(0, 6);

  const gaps = uniqueStrings([
    ...unmatchedKeywords.slice(0, 6).map(keyword => `Missing or weak signal for: ${keyword}`),
    projectHighlights.length === 0 ? 'No project highlights provided to prove impact.' : '',
    summary.length < 40 ? 'Candidate summary is too short for strong recruiter context.' : '',
  ]).slice(0, 6);

  const actionPlan = uniqueStrings([
    unmatchedKeywords[0] ? `Add one quantified bullet covering "${unmatchedKeywords[0]}" in your resume summary.` : '',
    unmatchedKeywords[1] ? `Create a STAR story that demonstrates "${unmatchedKeywords[1]}" for interviews.` : '',
    'Tailor the top 3 resume bullets to mirror this JD language before applying.',
    'Prepare one project deep-dive with architecture, trade-offs, and measurable results.',
    'Draft a role-specific intro note explaining why this role fits your trajectory.',
  ]).slice(0, 5);

  return {
    overallScore,
    scoreBand,
    dimensions,
    topMatches,
    gaps,
    actionPlan,
    metadata: {
      matchedKeywordCount: matchedKeywords.length,
      keywordUniverse: jdKeywords.length,
      candidateSkillCount: coreSkills.length,
    },
  };
}

// ─── GET /api/jobs/skill-match — Skill-matched job recommendations ───
router.get('/skill-match', authenticateToken, async (req, res) => {
  try {
    // Fetch user profile to get skills and preferences
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      logger.error('Profile fetch error', { error: profileError.message, code: profileError.code });
    }

    const profileSignals = normalizeProfileSignals(profileData || {});
    const hasSignals = hasMeaningfulProfileSignals(profileSignals);

    // If user has no meaningful career signals, return 3 most recent jobs from database
    if (!hasSignals) {
      logger.info('User has no career signals - fetching 3 most recent jobs', { userId: req.user.id });
      
      const { data: recentJobs, error: jobsError } = await supabaseAdmin
        .from('job_listings')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(3);

      if (jobsError) {
        logger.error('Recent jobs fetch error', { error: jobsError.message });
      }

      const jobs = (recentJobs || []).map(job => ({
        ...job,
        matchScore: 50,
        matchedSkills: [],
        matchedSignals: [],
        source: job.source || 'admin'
      }));

      return res.json({
        jobs,
        userSkills: [],
        userLocation: null,
        userQualification: null,
        searchQuery: 'Recent Jobs',
        profileComplete: false,
        timestamp: new Date().toISOString()
      });
    }

    // Build intelligent search query based on user profile
    const searchQuery = buildCareerSearchQuery(profileSignals);
    
    logger.info('Skill-match query', {
      userId: req.user.id,
      searchQuery,
      skills: profileSignals.skills.join(', ') || 'none',
      location: profileSignals.location || 'none',
      qualification: profileSignals.qualification || 'none',
    });

    // Fetch jobs based on the query
    const jobs = await fetchExternalJobs(searchQuery, 1);

    // Calculate match scores based on user skills
    const matchedJobs = scoreJobsAgainstProfile(jobs, profileSignals);

    // Sort by match score (highest first)
    matchedJobs.sort((a, b) => b.matchScore - a.matchScore);

    // Filter out very low matches (below 30%)
    const filteredJobs = matchedJobs.filter(job => job.matchScore >= 30);

    res.json({
      jobs: filteredJobs.slice(0, 10),
      userSkills: profileSignals.skills,
      userLocation: profileSignals.location || null,
      userQualification: profileSignals.qualification || null,
      userPreferredRole: profileSignals.preferredRole || null,
      searchQuery,
      profileComplete: hasSignals,
      profileSignals,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Skill-match jobs error', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch skill-matched jobs' });
  }
});

// ─── GET /api/jobs/live — Real-time job updates (polling endpoint) ───
router.get('/live', async (req, res) => {
  try {
    const { query = 'software developer', lastUpdate } = req.query;
    const cacheKey = `jobs_${query}_1`;
    
    // Check if we have fresh data
    const cached = getCachedJobs(cacheKey);
    if (cached && lastUpdate) {
      const lastUpdateTime = new Date(lastUpdate).getTime();
      const cacheTime = Date.now() - (10 * 60 * 1000); // Cache is 10 min old max
      
      if (lastUpdateTime > cacheTime) {
        return res.json({
          jobs: [],
          hasUpdates: false,
          message: 'No new jobs since last check',
          nextPoll: 60 // seconds
        });
      }
    }

    // Fetch fresh jobs
    const jobs = await fetchExternalJobs(query, 1);
    
    res.json({
      jobs: jobs.slice(0, 50),
      hasUpdates: true,
      timestamp: new Date().toISOString(),
      nextPoll: 300, // Poll every 5 minutes
      query
    });
  } catch (error) {
    logger.error('Live jobs error', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch live jobs' });
  }
});

// ─── POST /api/jobs/ai-search — AI-powered natural-language search ───
router.post('/ai-search', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || query.trim().length < 3) {
      return res.status(400).json({ error: 'Please enter a search query (at least 3 characters).' });
    }

    let parsedParams = null;
    let aiSuggestions = [];
    let searchQuery = query; // Declare searchQuery before first assignment

    // ── Use Groq LLM to parse the natural language query ──
    if (GROQ_API_KEY) {
      try {
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              {
                role: 'system',
                content: `You are a job search assistant. Parse the user's natural language job search query and extract structured parameters. Respond ONLY with valid JSON, no markdown, no explanation.

Return this exact JSON structure:
{
  "role": "extracted job role/title (e.g., 'software developer', 'data analyst')",
  "location": "extracted location or null",
  "job_type": "full-time|part-time|internship|contract or null",
  "experience_level": "fresher|junior|mid|senior or null",
  "skills": ["skill1", "skill2"],
  "salary_preference": "extracted salary info or null",
  "optimized_query": "a clean, optimized search query string for job APIs",
  "suggestions": ["3 related search suggestions the user might also be interested in"]
}`
              },
              {
                role: 'user',
                content: query
              }
            ],
            temperature: 0.3,
            max_tokens: 400,
          }),
        });

        if (groqResponse.ok) {
          const groqResult = await groqResponse.json();
          const content = groqResult.choices?.[0]?.message?.content?.trim() || '';
          
          // Parse the JSON response
          try {
            const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const parsed = JSON.parse(jsonStr);
            parsedParams = {
              role: parsed.role || null,
              location: parsed.location || null,
              job_type: parsed.job_type || null,
              experience_level: parsed.experience_level || null,
              skills: Array.isArray(parsed.skills) ? parsed.skills : [],
              salary_preference: parsed.salary_preference || null,
            };
            aiSuggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3) : [];
            // Fix: use let instead of var to avoid function-scope leak
            searchQuery = parsed.optimized_query || query;
          } catch (parseErr) {
            logger.error('Failed to parse Groq JSON response', { error: parseErr.message });
          }
        }
      } catch (groqErr) {
        logger.error('Groq API error', { error: groqErr.message });
      }
    }

    // Fallback: use original query if AI parsing failed
    const finalQuery = searchQuery || query;

    // ── Fetch jobs using the optimized query ──
    const jobs = await fetchExternalJobs(finalQuery, 1);

    // If we have location from AI, filter results by location
    let filteredJobs = jobs;
    if (parsedParams?.location) {
      const loc = parsedParams.location.toLowerCase();
      const locationMatched = jobs.filter(j =>
        (j.location || '').toLowerCase().includes(loc)
      );
      // Only use filtered results if we got some matches
      if (locationMatched.length > 0) {
        filteredJobs = locationMatched;
      }
    }

    // If we have job_type from AI, prioritize matching types
    if (parsedParams?.job_type) {
      const typeStr = parsedParams.job_type.toLowerCase();
      filteredJobs.sort((a, b) => {
        const aMatch = (a.type || '').toLowerCase().includes(typeStr) ? 0 : 1;
        const bMatch = (b.type || '').toLowerCase().includes(typeStr) ? 0 : 1;
        return aMatch - bMatch;
      });
    }

    res.json({
      jobs: filteredJobs,
      total: filteredJobs.length,
      ai_parsed: parsedParams,
      ai_suggestions: aiSuggestions,
      query_used: finalQuery,
      ai_powered: !!parsedParams,
    });
  } catch (error) {
    logger.error('AI Job search error', { error: error.message });
    res.status(500).json({ error: 'AI search failed. Please try again.' });
  }
});

// ─── GET /api/jobs — List jobs (admin + external API combined) ───
router.get('/', optionalAuth, async (req, res) => {
  try {
    // Rate limiting
    const identifier = req.user?.id || req.ip || 'anonymous';
    const rateLimit = checkRateLimit(identifier);
    
    if (!rateLimit.allowed) {
      return res.status(429).json({ 
        error: `Too many requests. Please try again in ${rateLimit.resetIn} seconds.`,
        retryAfter: rateLimit.resetIn
      });
    }

    // Set rate limit headers
    res.setHeader('X-RateLimit-Remaining', rateLimit.remaining);

    const {
      category,
      company,
      type,
      search,
      page = 1,
      limit = 50,
      source,
    } = req.query;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    let adminJobs = [];
    let externalJobs = [];
    let totalAdmin = 0;

    // ── Fetch admin-posted jobs from Supabase ──
    let query = supabaseAdmin
      .from('job_listings')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Only show active jobs unless admin requests all
    if (req.query.include_inactive !== 'true') {
      query = query.eq('is_active', true);
    }

    if (category && category !== 'all') query = query.eq('category', category);
    if (company) query = query.ilike('company', `%${company}%`);
    if (type) query = query.eq('type', type);
    if (search) {
      query = query.or(`title.ilike.%${search}%,company.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, count, error } = await query.range(offset, offset + parseInt(limit) - 1);

    if (error) {
      logger.error('Supabase job fetch error', { error: error.message, code: error.code });
    } else {
      adminJobs = (data || []).map(j => ({ ...j, source: 'admin' }));
      totalAdmin = count || 0;
    }

    // ── Fetch external API jobs (only page 1 or when specifically requested) ──
    const searchQuery = search || category || 'fresher software developer India';
    if (source !== 'admin' && parseInt(page, 10) <= 2) {
      externalJobs = await fetchExternalJobs(searchQuery, parseInt(page, 10));
    }

    // Combine and send
    const allJobs = source === 'external'
      ? externalJobs
      : source === 'admin'
        ? adminJobs
        : [...adminJobs, ...externalJobs];

    // Respect the limit parameter for the combined results
    const requestedLimit = Math.min(50, parseInt(limit, 10));
    const combinedJobs = allJobs.slice(0, requestedLimit);

    res.json({
      jobs: combinedJobs,
      total: totalAdmin + externalJobs.length,
      page: parseInt(page),
      totalPages: Math.ceil(totalAdmin / parseInt(limit, 10)) || 1,
      hasExternalApi: !!RAPIDAPI_KEY,
      cached: !!getCachedJobs(`jobs_${searchQuery}_${parseInt(page, 10)}`),
      rateLimit: {
        remaining: rateLimit.remaining,
        limit: 10
      }
    });
  } catch (error) {
    logger.error('Jobs fetch error', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch job listings' });
  }
});

// ─── POST /api/jobs/career-ops/evaluate — JD-fit score + action plan ─────
router.post('/career-ops/evaluate', authenticateToken, async (req, res) => {
  try {
    const {
      jobDescription = '',
      candidateProfile = {},
      company = '',
      role = '',
    } = req.body || {};

    const normalizedJobDescription = String(jobDescription || '').trim();
    if (normalizedJobDescription.length < 40) {
      return res.status(400).json({
        error: 'jobDescription must be at least 40 characters.',
      });
    }

    const fit = evaluateCareerOpsFit({
      jobDescription: normalizedJobDescription,
      candidateProfile,
    });

    const historyRecord = buildCareerOpsHistoryRecord(req.user.id, {
      ...req.body,
      ...fit,
      candidateProfile,
    });

    let historyItem = null;
    try {
      const { data: insertedRow, error: insertError } = await supabaseAdmin
        .from('career_ops_evaluations')
        .insert(historyRecord)
        .select('*')
        .single();

      if (insertError) {
        if (!isMissingCareerOpsSchema(insertError)) throw insertError;
      } else if (insertedRow) {
        historyItem = mapCareerOpsHistoryRow(insertedRow);
      }
    } catch (persistError) {
      if (!isMissingCareerOpsSchema(persistError)) {
        logger.warn('Career Ops persistence skipped', { error: persistError.message || String(persistError) });
      }
    }

    return res.json({
      ...fit,
      company: String(company || '').trim() || null,
      role: String(role || '').trim() || null,
      generatedAt: new Date().toISOString(),
      historyItem,
    });
  } catch (error) {
    logger.error('Career Ops evaluate error', { error: error.message });
    return res.status(500).json({ error: 'Failed to evaluate job fit.' });
  }
});

// ─── GET /api/jobs/career-ops/history — saved evaluations ───────────
router.get('/career-ops/history', authenticateToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabaseAdmin
      .from('career_ops_evaluations')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      if (isMissingCareerOpsSchema(error)) {
        return res.json({ data: [], pagination: { page, limit, total: 0, pages: 0 } });
      }
      throw error;
    }

    return res.json({
      data: (data || []).map(mapCareerOpsHistoryRow),
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    logger.error('Career Ops history error', { error: error.message });
    return res.status(500).json({ error: 'Failed to fetch Career Ops history' });
  }
});

// ─── GET /api/jobs/:id — Single job detail ───────────────────────
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prevent parseInt(NaN) errors for external job string IDs
    if (isNaN(parseInt(id, 10))) {
      return res.status(404).json({ error: 'Job listing not found or is external' });
    }

    const { data, error } = await supabaseAdmin
      .from('job_listings')
      .select('*')
      .eq('id', parseInt(id, 10))
      .single();

    if (error) throw error;
    res.json(data);
  } catch (_error) {
    res.status(404).json({ error: 'Job listing not found' });
  }
});

// ─── POST /api/jobs — Admin create job ───────────────────────────
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      title, company, category, type,
      location, salary_range, description,
      requirements, apply_link, deadline, tags,
    } = req.body;

    if (!title || !company || !description) {
      return res.status(400).json({ error: 'Title, company, and description are required' });
    }

    const { data, error } = await supabaseAdmin
      .from('job_listings')
      .insert({
        title,
        company,
        category: category || 'fresher',
        type: req.body.job_type || type || 'full-time',
        location,
        salary_range,
        description,
        requirements: requirements || [],
        apply_link,
        deadline,
        tags: tags || [],
        is_active: req.body.is_active !== false,
        posted_by: req.user.id,
        source: 'admin',
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    logger.error('Create job error', { error: error.message });
    res.status(500).json({ error: 'Failed to create job listing' });
  }
});

// ─── PUT /api/jobs/:id — Admin update job ────────────────────────
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    // Map frontend field name to DB column
    if (updates.job_type) {
      updates.type = updates.job_type;
      delete updates.job_type;
    }
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('job_listings')
      .update(updates)
      .eq('id', parseInt(id))
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    logger.error('Update job error', { error: error.message });
    res.status(500).json({ error: 'Failed to update job listing' });
  }
});

// ─── DELETE /api/jobs/:id — Admin delete job ─────────────────────
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('job_listings')
      .delete()
      .eq('id', parseInt(id));

    if (error) throw error;
    res.json({ message: 'Job listing deleted successfully' });
  } catch (error) {
    logger.error('Delete job error', { error: error.message });
    res.status(500).json({ error: 'Failed to delete job listing' });
  }
});

// ─── PATCH /api/jobs/:id/toggle — Toggle active/inactive ────────
router.patch('/:id/toggle', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Get current status
    const { data: current, error: fetchErr } = await supabaseAdmin
      .from('job_listings')
      .select('is_active')
      .eq('id', parseInt(id))
      .single();

    if (fetchErr) throw fetchErr;

    const { data, error } = await supabaseAdmin
      .from('job_listings')
      .update({ is_active: !current.is_active, updated_at: new Date().toISOString() })
      .eq('id', parseInt(id))
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    logger.error('Toggle job error', { error: error.message });
    res.status(500).json({ error: 'Failed to toggle job status' });
  }
});

export default router;
