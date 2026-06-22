import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('job-search-optimizer');

// Enhanced caching with TTL and LRU eviction
class JobSearchCache {
  constructor(maxSize = 100, ttl = 10 * 60 * 1000) {
    this.cache = new Map();
    this.accessOrder = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      return null;
    }

    // Update access order (LRU)
    this.accessOrder.set(key, Date.now());
    return entry.data;
  }

  set(key, data) {
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.getOldestKey();
      if (oldestKey) {
        this.cache.delete(oldestKey);
        this.accessOrder.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
    this.accessOrder.set(key, Date.now());
  }

  getOldestKey() {
    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, time] of this.accessOrder.entries()) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  clear() {
    this.cache.clear();
    this.accessOrder.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl,
      oldestEntry: this.getOldestKey(),
    };
  }
}

const jobCache = new JobSearchCache(100, 10 * 60 * 1000);

/**
 * Fetch jobs from multiple sources in parallel with fallbacks
 */
export async function fetchJobsOptimized(query, options = {}) {
  const {
    location = 'India',
    page = 1,
    limit = 20,
    sources = ['indian', 'jsearch', 'adzuna'],
    timeout = 8000,
  } = options;

  const cacheKey = `jobs_${query}_${location}_${page}`;
  
  // Check cache first
  const cached = jobCache.get(cacheKey);
  if (cached) {
    logger.debug('Returning cached jobs', { query, count: cached.length });
    return {
      jobs: cached,
      source: 'cache',
      cached: true,
    };
  }

  const startTime = Date.now();
  const results = [];
  const errors = [];

  // Create promises for each source
  const sourcePromises = [];

  if (sources.includes('indian')) {
    sourcePromises.push(
      fetchIndianJobs(query, location, timeout)
        .then(jobs => ({ source: 'indian', jobs, priority: 1 }))
        .catch(err => {
          errors.push({ source: 'indian', error: err.message });
          return null;
        })
    );
  }

  if (sources.includes('jsearch') && process.env.RAPIDAPI_KEY) {
    sourcePromises.push(
      fetchJSearchJobs(query, location, page, timeout)
        .then(jobs => ({ source: 'jsearch', jobs, priority: 2 }))
        .catch(err => {
          errors.push({ source: 'jsearch', error: err.message });
          return null;
        })
    );
  }

  if (sources.includes('adzuna') && process.env.ADZUNA_APP_ID) {
    sourcePromises.push(
      fetchAdzunaJobs(query, location, timeout)
        .then(jobs => ({ source: 'adzuna', jobs, priority: 3 }))
        .catch(err => {
          errors.push({ source: 'adzuna', error: err.message });
          return null;
        })
    );
  }

  // Wait for all sources (with timeout)
  const sourceResults = await Promise.allSettled(sourcePromises);

  // Collect successful results
  for (const result of sourceResults) {
    if (result.status === 'fulfilled' && result.value) {
      results.push(result.value);
    }
  }

  // Sort by priority and combine
  results.sort((a, b) => a.priority - b.priority);
  const allJobs = results.flatMap(r => r.jobs || []);

  // Deduplicate by title + company
  const uniqueJobs = deduplicateJobs(allJobs);

  // Limit results
  const limitedJobs = uniqueJobs.slice(0, limit);

  // Cache the results
  if (limitedJobs.length > 0) {
    jobCache.set(cacheKey, limitedJobs);
  }

  const duration = Date.now() - startTime;
  logger.info('Jobs fetched', {
    query,
    sources: results.map(r => r.source),
    count: limitedJobs.length,
    duration: `${duration}ms`,
    errors: errors.length,
  });

  return {
    jobs: limitedJobs,
    sources: results.map(r => r.source),
    errors,
    duration,
    cached: false,
  };
}

/**
 * Fetch from Indian job portals (Indeed, Naukri, Foundit)
 */
async function fetchIndianJobs(query, location, timeout) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // This would call your existing indianJobApis.js
    const { fetchAllIndianJobs } = await import('../utils/indianJobApis.js');
    const jobs = await fetchAllIndianJobs(query, location);
    clearTimeout(timeoutId);
    return jobs || [];
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Fetch from JSearch (RapidAPI)
 */
async function fetchJSearchJobs(query, location, page, timeout) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const url = `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query + ' ' + location)}&page=${page}&num_pages=1`;
    
    const response = await fetch(url, {
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        'x-rapidapi-host': 'jsearch.p.rapidapi.com',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`JSearch API error: ${response.status}`);
    }

    const result = await response.json();
    return transformJSearchJobs(result.data || []);
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Fetch from Adzuna
 */
async function fetchAdzunaJobs(query, location, timeout) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const url = `https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=${process.env.ADZUNA_APP_ID}&app_key=${process.env.ADZUNA_APP_KEY}&results_per_page=20&what=${encodeURIComponent(query)}`;
    
    const response = await fetch(url, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Adzuna API error: ${response.status}`);
    }

    const result = await response.json();
    return transformAdzunaJobs(result.results || []);
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Transform JSearch jobs to standard format
 */
function transformJSearchJobs(jobs) {
  return jobs.map(job => ({
    id: `jsearch_${job.job_id}`,
    title: job.job_title,
    company: job.employer_name,
    location: `${job.job_city || ''}, ${job.job_country || ''}`.trim(),
    type: job.job_employment_type?.toLowerCase() || 'full-time',
    salary_range: job.job_min_salary && job.job_max_salary
      ? `${job.job_min_salary} - ${job.job_max_salary} ${job.job_salary_currency || ''}`
      : null,
    description: job.job_description?.substring(0, 500),
    apply_link: job.job_apply_link,
    posted_date: job.job_posted_at_datetime_utc,
    source: 'jsearch',
    logo_url: job.employer_logo,
  }));
}

/**
 * Transform Adzuna jobs to standard format
 */
function transformAdzunaJobs(jobs) {
  return jobs.map(job => ({
    id: `adzuna_${job.id}`,
    title: job.title,
    company: job.company?.display_name || 'Unknown',
    location: job.location?.display_name || 'India',
    type: job.contract_time || 'full-time',
    salary_range: job.salary_min && job.salary_max
      ? `₹${Math.round(job.salary_min).toLocaleString('en-IN')} – ₹${Math.round(job.salary_max).toLocaleString('en-IN')}`
      : null,
    description: job.description?.substring(0, 500),
    apply_link: job.redirect_url,
    posted_date: job.created,
    source: 'adzuna',
    logo_url: null,
  }));
}

/**
 * Deduplicate jobs by title and company
 */
function deduplicateJobs(jobs) {
  const seen = new Set();
  const unique = [];

  for (const job of jobs) {
    const key = `${job.title.toLowerCase()}_${job.company.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(job);
    }
  }

  return unique;
}

/**
 * Calculate skill match score for jobs
 */
export function calculateSkillMatch(job, userSkills) {
  if (!userSkills || userSkills.length === 0) {
    return { score: 50, matchedSkills: [] };
  }

  const jobText = `${job.title} ${job.description || ''} ${(job.requirements || []).join(' ')}`.toLowerCase();
  
  const matchedSkills = userSkills.filter(skill => 
    jobText.includes(skill.toLowerCase())
  );

  // Calculate score (0-100)
  let score = 50; // Base score

  if (userSkills.length > 0) {
    // Skill overlap (0-60 points)
    const skillOverlap = (matchedSkills.length / userSkills.length) * 60;
    score = Math.round(skillOverlap);

    // Title match bonus (+20 points)
    const titleLower = job.title.toLowerCase();
    if (userSkills.some(skill => titleLower.includes(skill.toLowerCase()))) {
      score += 20;
    }

    // Recent posting bonus (+10 points)
    if (job.posted_date) {
      const daysSincePosted = (Date.now() - new Date(job.posted_date).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSincePosted <= 7) {
        score += 10;
      }
    }

    // Cap at 100
    score = Math.min(100, score);
  }

  return {
    score,
    matchedSkills: matchedSkills.slice(0, 5),
  };
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return jobCache.getStats();
}

/**
 * Clear job cache
 */
export function clearCache() {
  jobCache.clear();
  logger.info('Job cache cleared');
}

export default {
  fetchJobsOptimized,
  calculateSkillMatch,
  getCacheStats,
  clearCache,
};
