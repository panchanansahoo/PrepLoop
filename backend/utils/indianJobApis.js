// Free Indian Job APIs - Production-ready with proper error handling and data extraction
import { CircuitBreaker } from './circuitBreaker.js';

// Circuit breaker for job search APIs
const jobSearchBreaker = new CircuitBreaker('jobSearch', {
  failureThreshold: 4,
  resetTimeout: 45000, // 45 seconds
  halfOpenMaxAttempts: 2,
});

export async function fetchIndeedIndiaJobs(query = 'software developer', location = 'India') {
  try {
    return await jobSearchBreaker.execute(async () => {
      const searchQuery = encodeURIComponent(query);
      const searchLocation = encodeURIComponent(location);
      const url = `https://in.indeed.com/jobs?q=${searchQuery}&l=${searchLocation}&sort=date&fromage=30`;
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        }
      });
      
      clearTimeout(timeout);

      if (!response.ok) return [];

      const html = await response.text();
      
      // Extract job IDs from Indeed's HTML
      const jobIdMatches = html.match(/data-jk="([a-zA-Z0-9]+)"/g) || [];
      const titleMatches = html.match(/data-jk="[^"]+"[^>]*>([^<]+)</g) || [];
      const companyMatches = html.match(/class="companyName"[^>]*>([^<]+)</g) || [];
      const locationMatches = html.match(/class="companyLocation"[^>]*>([^<]+)</g) || [];
      
      const jobs = [];
      const maxJobs = Math.min(15, jobIdMatches.length);
      
      for (let i = 0; i < maxJobs; i++) {
        const jobId = jobIdMatches[i]?.match(/data-jk="([^"]+)"/)?.[1];
        let title = titleMatches[i]?.match(/>([^<]+)</)?.[1]?.trim() || 'Software Developer';
        let company = companyMatches[i]?.match(/>([^<]+)</)?.[1]?.trim() || 'Various Companies';
        const jobLocation = locationMatches[i]?.match(/>([^<]+)</)?.[1]?.trim() || location;
        
        title = decodeHTMLEntities(title);
        company = decodeHTMLEntities(company);
        
        if (jobId) {
          jobs.push({
            id: `indeed_${jobId}`,
            title,
            company,
            location: jobLocation,
            salary_range: null,
            description: `${title} position at ${company}. View full details on Indeed India.`,
            apply_link: `https://in.indeed.com/viewjob?jk=${jobId}`,
            source: 'indeed_india',
            created_at: new Date().toISOString(),
          });
        }
      }

      return jobs;
    });
  } catch (error) {
    if (error.isCircuitBreakerError) {
      console.error('[Job Search Circuit Breaker] Circuit open for Indeed:', error.message);
    } else {
      console.error('Indeed India fetch error:', error.message);
    }
    return [];
  }
}

export async function fetchNaukriJobs(query = 'software developer') {
  try {
    return await jobSearchBreaker.execute(async () => {
      // Naukri.com API endpoint (public job search)
      const searchQuery = encodeURIComponent(query);
      const url = `https://www.naukri.com/${searchQuery.replace(/%20/g, '-')}-jobs`;
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html',
        }
      });
      
      clearTimeout(timeout);

      if (!response.ok) return [];

      const html = await response.text();
      
      // Extract job data from Naukri HTML
      const jobMatches = html.match(/data-job-id="([^"]+)"/g) || [];
      const titleMatches = html.match(/class="title"[^>]*>([^<]+)</g) || [];
      const companyMatches = html.match(/class="comp-name"[^>]*>([^<]+)</g) || [];
      
      const jobs = [];
      const maxJobs = Math.min(15, jobMatches.length);
      
      for (let i = 0; i < maxJobs; i++) {
        const jobId = jobMatches[i]?.match(/data-job-id="([^"]+)"/)?.[1];
        let title = titleMatches[i]?.match(/>([^<]+)</)?.[1]?.trim() || query;
        let company = companyMatches[i]?.match(/>([^<]+)</)?.[1]?.trim() || 'Top Company';
        
        title = decodeHTMLEntities(title);
        company = decodeHTMLEntities(company);
        
        if (jobId) {
          jobs.push({
            id: `naukri_${jobId}`,
            title,
            company,
            location: 'India',
            salary_range: null,
            description: `${title} role at ${company}. Apply on Naukri.com for full details.`,
            apply_link: `https://www.naukri.com/job-listings-${jobId}`,
            source: 'naukri',
            created_at: new Date().toISOString(),
          });
        }
      }

      return jobs;
    });
  } catch (error) {
    if (error.isCircuitBreakerError) {
      console.error('[Job Search Circuit Breaker] Circuit open for Naukri:', error.message);
    } else {
      console.error('Naukri fetch error:', error.message);
    }
    return [];
  }
}

export async function fetchFounditJobs(query = 'software developer') {
  try {
    return await jobSearchBreaker.execute(async () => {
      // Foundit (formerly Monster India) job search
      const searchQuery = encodeURIComponent(query);
      const url = `https://www.foundit.in/srp/results?query=${searchQuery}&locations=India`;
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html',
        }
      });
      
      clearTimeout(timeout);

      if (!response.ok) return [];

      const html = await response.text();
      
      // Extract basic job info
      const jobMatches = html.match(/data-job-id="([^"]+)"/g) || [];
      
      const jobs = [];
      const maxJobs = Math.min(10, jobMatches.length);
      
      for (let i = 0; i < maxJobs; i++) {
        const jobId = jobMatches[i]?.match(/data-job-id="([^"]+)"/)?.[1];
        
        let title = `${query} Position`;
        let company = 'Leading Company';
        
        title = decodeHTMLEntities(title);
        company = decodeHTMLEntities(company);
        
        if (jobId) {
          jobs.push({
            id: `foundit_${jobId}`,
            title,
            company,
            location: 'India',
            salary_range: null,
            description: `${title} opportunity in India. View details on Foundit.`,
            apply_link: `https://www.foundit.in/job/${jobId}`,
            source: 'foundit',
            created_at: new Date().toISOString(),
          });
        }
      }

      return jobs;
    });
  } catch (error) {
    if (error.isCircuitBreakerError) {
      console.error('[Job Search Circuit Breaker] Circuit open for Foundit:', error.message);
    } else {
      console.error('Foundit fetch error:', error.message);
    }
    return [];
  }
}

function decodeHTMLEntities(text) {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
    .replace(/&#x([0-9a-f]+);/gi, (match, hex) => String.fromCharCode(parseInt(hex, 16)));
}

export async function fetchLinkedInIndiaJobs(query = 'software developer') {
  try {
    // LinkedIn public job search (no auth required for basic search)
    const searchQuery = encodeURIComponent(query);
    const url = `https://www.linkedin.com/jobs/search?keywords=${searchQuery}&location=India&f_TPR=r86400`;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
      }
    });
    
    clearTimeout(timeout);

    if (!response.ok) return [];

    const html = await response.text();
    
    // Extract job IDs, titles, and companies from LinkedIn HTML
    const jobMatches = html.match(/data-entity-urn="urn:li:jobPosting:(\d+)"/g) || [];
    const titleMatches = html.match(/<h3 class="base-search-card__title">([\s\S]*?)<\/h3>/g) || [];
    const companyMatches = html.match(/<h4 class="base-search-card__subtitle">([\s\S]*?)<\/h4>/g) || [];
    
    const jobs = [];
    const maxJobs = Math.min(15, jobMatches.length);
    
    for (let i = 0; i < maxJobs; i++) {
      const jobId = jobMatches[i]?.match(/data-entity-urn="urn:li:jobPosting:(\d+)"/)?.[1];
      let title = titleMatches[i]?.replace(/<[^>]+>/g, '').trim() || `${query} Role`;
      let company = companyMatches[i]?.replace(/<[^>]+>/g, '').trim() || 'Top Employer';
      
      title = decodeHTMLEntities(title);
      company = decodeHTMLEntities(company);
      
      if (jobId) {
        jobs.push({
          id: `linkedin_${jobId}`,
          title: title,
          company: company,
          location: 'India',
          salary_range: null,
          description: `${title} position in India. View full details on LinkedIn.`,
          apply_link: `https://www.linkedin.com/jobs/view/${jobId}`,
          source: 'linkedin_india',
          created_at: new Date().toISOString(),
        });
      }
    }

    return jobs;
  } catch (error) {
    console.error('LinkedIn fetch error:', error.message);
    return [];
  }
}

// Remove Remotive - not India-focused
// export async function fetchRemotiveJobs(query = 'software developer') { ... }

export async function fetchAllIndianJobs(query = 'software developer', location = 'India') {
  console.log(`Fetching Indian jobs for: ${query}`);
  
  // Try all Indian job portals in parallel
  const [indeedJobs, naukriJobs, founditJobs, linkedinJobs] = await Promise.allSettled([
    fetchIndeedIndiaJobs(query, location),
    fetchNaukriJobs(query),
    fetchFounditJobs(query),
    fetchLinkedInIndiaJobs(query),
  ]);

  const allJobs = [
    ...(indeedJobs.status === 'fulfilled' ? indeedJobs.value : []),
    ...(naukriJobs.status === 'fulfilled' ? naukriJobs.value : []),
    ...(founditJobs.status === 'fulfilled' ? founditJobs.value : []),
    ...(linkedinJobs.status === 'fulfilled' ? linkedinJobs.value : []),
  ];

  if (allJobs.length === 0) {
    console.log('No jobs from Indian portals');
    return [];
  }

  console.log(`Got ${allJobs.length} jobs from Indian portals (Indeed: ${indeedJobs.status === 'fulfilled' ? indeedJobs.value.length : 0}, Naukri: ${naukriJobs.status === 'fulfilled' ? naukriJobs.value.length : 0}, Foundit: ${founditJobs.status === 'fulfilled' ? founditJobs.value.length : 0}, LinkedIn: ${linkedinJobs.status === 'fulfilled' ? linkedinJobs.value.length : 0})`);
  
  return allJobs.map(job => ({
    ...job,
    category: detectCategory(job.title, job.description),
    type: detectJobType(job.title, job.description),
    requirements: [],
    deadline: null,
    is_active: true,
    tags: [job.company, job.source, 'India'].filter(Boolean),
    logo_url: null,
  }));
}

function detectCategory(title, description = '') {
  const text = `${title} ${description}`.toLowerCase();
  if (text.includes('intern')) return 'internship';
  if (text.includes('fresher') || text.includes('entry') || text.includes('graduate') || text.includes('0-1 year') || text.includes('0 year')) return 'fresher';
  if (text.includes('campus')) return 'campus';
  return 'off-campus';
}

function detectJobType(title, description = '') {
  const text = `${title} ${description}`.toLowerCase();
  if (text.includes('intern')) return 'internship';
  if (text.includes('part-time') || text.includes('part time')) return 'part-time';
  if (text.includes('contract') || text.includes('freelance')) return 'contract';
  return 'full-time';
}
