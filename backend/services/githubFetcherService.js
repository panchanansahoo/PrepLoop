import { supabaseAdmin } from '../db/supabaseClient.js';

const githubHeaders = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'PrepLoop-Portfolio',
};

/**
 * Fetch GitHub profile data
 * @param {string} username - GitHub username
 * @returns {Promise<Object>} GitHub profile data
 */
export const fetchGithubProfile = async (username) => {
  try {
    const response = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
      headers: githubHeaders,
    });
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching GitHub profile:', error);
    throw error;
  }
};

/**
 * Fetch GitHub repositories for a user
 * @param {string} username - GitHub username
 * @returns {Promise<Array>} List of repositories
 */
export const fetchGithubRepositories = async (username) => {
  try {
    // Get user's repositories
    const response = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated&type=owner`, 
      { headers: githubHeaders }
    );
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    
    const repos = await response.json();
    
    // Fetch additional details for top repos
    const topRepos = repos.slice(0, 20);
    const detailedRepos = await Promise.all(
      topRepos.map(async (repo) => {
        // Fetch topics for the repo
        const topicsResponse = await fetch(
          `https://api.github.com/repos/${encodeURIComponent(username)}/${encodeURIComponent(repo.name)}/topics`,
          { headers: githubHeaders }
        );
        
        let topics = [];
        if (topicsResponse.ok) {
          const topicsData = await topicsResponse.json();
          topics = topicsData.names || [];
        }
        
        // Fetch contributors count
        const contributorsResponse = await fetch(
          `https://api.github.com/repos/${encodeURIComponent(username)}/${encodeURIComponent(repo.name)}/contributors`,
          { headers: githubHeaders }
        );
        
        let contributors = 0;
        if (contributorsResponse.ok) {
          const contributorsData = await contributorsResponse.json();
          contributors = contributorsData.length || 0;
        }
        
        return {
          ...repo,
          topics,
          contributors,
        };
      })
    );
    
    return detailedRepos;
  } catch (error) {
    console.error('Error fetching GitHub repositories:', error);
    throw error;
  }
};

/**
 * Calculate repository visibility score based on various factors
 * @param {Object} repo - Repository object
 * @returns {number} Visibility score
 */
export const calculateRepoVisibilityScore = (repo) => {
  if (!repo) return 0;
  
  // Base score from stars
  const starsScore = Math.log2((repo.stargazers_count || 0) + 1) * 10;
  
  // Recency bonus (more recent pushes get higher score)
  const pushedAt = repo.pushed_at ? new Date(repo.pushed_at).getTime() : 0;
  const now = Date.now();
  const daysSincePush = (now - pushedAt) / (1000 * 60 * 60 * 24);
  
  let recencyBonus = 0;
  if (daysSincePush <= 30) recencyBonus = 10; // Pushed in last 30 days
  else if (daysSincePush <= 90) recencyBonus = 5; // Pushed in last 90 days
  else if (daysSincePush <= 180) recencyBonus = 2; // Pushed in last 180 days
  
  // Has README bonus
  const hasReadme = repo.has_readme || repo.readme_present || repo.description?.length > 50 ? 5 : 0;
  
  // Has demo/live URL bonus
  const hasDemo = repo.homepage || repo.html_url?.includes('demo') ? 15 : 0;
  
  // Language bonus
  const languageBonus = repo.language ? 3 : 0;
  
  // Topic relevance bonus
  const topicBonus = Math.min(repo.topics?.length || 0, 5) * 2;
  
  // Contributors bonus
  const contributorBonus = Math.min((repo.contributors || 0), 10);
  
  // Visibility score calculation
  return starsScore + recencyBonus + hasReadme + hasDemo + languageBonus + topicBonus + contributorBonus;
};

/**
 * Rank repositories based on visibility score
 * @param {Array} repositories - Array of repository objects
 * @returns {Array} Ranked repositories
 */
export const rankRepositories = (repositories = []) => {
  return repositories
    .map(repo => ({
      ...repo,
      visibilityScore: calculateRepoVisibilityScore(repo),
    }))
    .sort((a, b) => b.visibilityScore - a.visibilityScore);
};

/**
 * Select top projects based on ranking
 * @param {Array} rankedRepositories - Ranked repositories
 * @param {number} count - Number of projects to select (default: 5)
 * @returns {Array} Selected projects
 */
export const selectTopProjects = (rankedRepositories = [], count = 5) => {
  const maxCount = Math.min(5, Math.max(3, Number(count) || 5));
  return rankedRepositories.slice(0, maxCount).map(repo => ({
    name: repo.name || '',
    description: (repo.description || '').substring(0, 200) || 'No description provided',
    stack: [
      ...(repo.topics || []),
      repo.language || '',
    ].filter(Boolean),
    repoUrl: repo.html_url || '',
    liveUrl: repo.homepage || '',
    screenshots: [], // Will be populated later if available
    impact: `⭐ ${repo.stargazers_count || 0} | 📝 Updated ${new Date(repo.pushed_at).toLocaleDateString()}`,
    stars: repo.stargazers_count || 0,
    language: repo.language || '',
    source: 'github',
  }));
};

/**
 * Fetch and process GitHub data for portfolio
 * @param {string} githubUsername - GitHub username
 * @returns {Promise<Object>} Processed GitHub data for portfolio
 */
export const processGithubForPortfolio = async (githubUsername) => {
  if (!githubUsername) {
    throw new Error('GitHub username is required');
  }
  
  try {
    // Fetch profile and repositories
    const [profile, repositories] = await Promise.all([
      fetchGithubProfile(githubUsername),
      fetchGithubRepositories(githubUsername),
    ]);
    
    // Rank repositories
    const rankedRepos = rankRepositories(repositories);
    
    // Select top projects
    const topProjects = selectTopProjects(rankedRepos);
    
    // Calculate stats
    const totalStars = repositories.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
    const totalForks = repositories.reduce((sum, repo) => sum + (repo.forks_count || 0), 0);
    
    // Extract unique languages and topics
    const languages = [...new Set(
      repositories
        .map(repo => repo.language)
        .filter(lang => lang)
    )].slice(0, 20);
    
    const allTopics = repositories.flatMap(repo => repo.topics || []);
    const uniqueTopics = [...new Set(allTopics)].slice(0, 30);
    
    return {
      profile: {
        name: profile.name || profile.login || '',
        bio: profile.bio || '',
        avatar: profile.avatar_url || '',
        location: profile.location || '',
        blog: profile.blog || '',
        company: profile.company || '',
        followers: profile.followers || 0,
        following: profile.following || 0,
        publicRepos: profile.public_repos || 0,
        githubUrl: profile.html_url || '',
      },
      repositories: rankedRepos,
      topProjects,
      stats: {
        totalStars,
        totalForks,
        languages,
        topics: uniqueTopics,
        contributedProjects: repositories.length,
      },
    };
  } catch (error) {
    console.error('Error processing GitHub for portfolio:', error);
    throw error;
  }
};