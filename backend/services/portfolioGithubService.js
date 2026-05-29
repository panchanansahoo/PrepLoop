import { CircuitBreaker, CircuitBreakerOpenError } from '../utils/circuitBreaker.js';

const GITHUB_API_BASE = 'https://api.github.com';

// Circuit breaker for GitHub API calls
const githubBreaker = new CircuitBreaker('github', {
  failureThreshold: 5,
  resetTimeout: 60000, // 60 seconds
  halfOpenMaxAttempts: 2,
});

const githubHeaders = () => {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'Preploop-Portfolio-Generator',
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
};

const fetchJson = async (url) => {
  return githubBreaker.execute(async () => {
    const response = await fetch(url, { headers: githubHeaders() });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`GitHub API request failed (${response.status}): ${body}`);
    }

    return response.json();
  });
};

const fetchReadme = async (owner, repo) => {
  try {
    return githubBreaker.execute(async () => {
      const response = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/readme`, {
        headers: githubHeaders(),
      });

      if (!response.ok) return '';
      const data = await response.json();
      if (!data?.content) return '';

      const decoded = Buffer.from(data.content, 'base64').toString('utf8');
      return decoded;
    });
  } catch (error) {
    if (error.isCircuitBreakerError) {
      console.error('[GitHub Circuit Breaker] Circuit open for readme fetch:', error.message);
    }
    return '';
  }
};

export const fetchGithubPortfolioData = async (username) => {
  const safeUsername = String(username || '').trim();
  if (!safeUsername) {
    return {
      username: null,
      profile: {},
      repositories: [],
      organizations: [],
    };
  }

  const [profile, repos, organizations] = await Promise.all([
    fetchJson(`${GITHUB_API_BASE}/users/${encodeURIComponent(safeUsername)}`),
    fetchJson(`${GITHUB_API_BASE}/users/${encodeURIComponent(safeUsername)}/repos?per_page=100&sort=updated`),
    fetchJson(`${GITHUB_API_BASE}/users/${encodeURIComponent(safeUsername)}/orgs`),
  ]);

  const repositories = await Promise.all(
    repos.map(async (repo) => {
      const readme = await fetchReadme(safeUsername, repo.name);
      return {
        id: repo.id,
        name: repo.name,
        description: repo.description,
        html_url: repo.html_url,
        homepage: repo.homepage,
        language: repo.language,
        stargazers_count: repo.stargazers_count,
        forks_count: repo.forks_count,
        pushed_at: repo.pushed_at,
        topics: repo.topics || [],
        pinned: false,
        readme,
      };
    }),
  );

  return {
    username: safeUsername,
    profile,
    repositories,
    organizations: organizations.map((org) => org.login),
  };
};

export default {
  fetchGithubPortfolioData,
};
