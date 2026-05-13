const RECENT_ACTIVITY_DAYS = 120;
const DEFAULT_FEATURED_COUNT = 5;

const toArray = (value) => (Array.isArray(value) ? value : []);

const normalizeSkill = (skill) => String(skill || '').trim();

const uniqueSkills = (skills = []) => {
  const map = new Map();
  for (const raw of skills) {
    const skill = normalizeSkill(raw);
    if (!skill) continue;

    const key = skill.toLowerCase();
    if (!map.has(key)) map.set(key, skill);
  }

  return Array.from(map.values());
};

const normalizeDate = (date) => {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const daysSince = (date) => {
  if (!date) return Number.POSITIVE_INFINITY;
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
};

const hasReadmeContent = (repo = {}) => {
  const readme = String(repo.readme || '').trim();
  return readme.length > 0;
};

const hasLiveDemo = (repo = {}) => {
  if (repo.homepage && String(repo.homepage).trim()) return true;
  const readme = String(repo.readme || '');
  return /https?:\/\//i.test(readme);
};

const normalizeRepoStars = (stars) => Math.min(Number(stars || 0), 1000) / 1000;
const normalizeRepoForks = (forks) => Math.min(Number(forks || 0), 250) / 250;

export const scoreRepositoryVisibility = (repo = {}) => {
  const stars = normalizeRepoStars(repo.stargazers_count);
  const forks = normalizeRepoForks(repo.forks_count);
  const recentBonus = daysSince(normalizeDate(repo.pushed_at)) <= RECENT_ACTIVITY_DAYS ? 1 : 0;
  const readmeBonus = hasReadmeContent(repo) ? 1 : 0;
  const demoBonus = hasLiveDemo(repo) ? 1 : 0;
  const pinnedBonus = repo.pinned ? 1 : 0;
  const topicBonus = toArray(repo.topics).length > 0 ? 1 : 0;

  const score =
    stars * 0.35 +
    forks * 0.1 +
    recentBonus * 0.2 +
    readmeBonus * 0.15 +
    demoBonus * 0.1 +
    pinnedBonus * 0.07 +
    topicBonus * 0.03;

  return Number(Math.max(0, Math.min(1, score)).toFixed(4));
};

export const selectFeaturedProjects = (projects = [], count = DEFAULT_FEATURED_COUNT) => {
  return toArray(projects)
    .slice()
    .sort((a, b) => Number(b.visibilityScore || 0) - Number(a.visibilityScore || 0))
    .slice(0, Math.max(1, count));
};

const mergeExperience = (resumeExperience = [], linkedinExperience = []) => {
  const deduped = new Map();

  for (const item of [...toArray(resumeExperience), ...toArray(linkedinExperience)]) {
    const company = String(item.company || '').trim();
    const role = String(item.role || '').trim();
    const startDate = String(item.startDate || item.start || '').trim();
    const key = `${company.toLowerCase()}|${role.toLowerCase()}|${startDate}`;

    if (!company || !role) continue;

    if (!deduped.has(key)) {
      deduped.set(key, {
        company,
        role,
        startDate: item.startDate || item.start || null,
        endDate: item.endDate || item.end || null,
        achievements: toArray(item.achievements),
        sources: [item.source || (toArray(resumeExperience).includes(item) ? 'resume' : 'linkedin')],
      });
      continue;
    }

    const existing = deduped.get(key);
    existing.achievements = uniqueSkills([...toArray(existing.achievements), ...toArray(item.achievements)]);
    existing.sources = uniqueSkills([...toArray(existing.sources), item.source || 'linkedin']);
  }

  return Array.from(deduped.values())
    .map((item) => ({
      ...item,
      confidenceScore: item.sources.length >= 2 ? 1 : 0.8,
    }))
    .sort((a, b) => {
      const bDate = normalizeDate(a.startDate);
      const aDate = normalizeDate(b.startDate);
      if (!aDate && !bDate) return 0;
      if (!aDate) return 1;
      if (!bDate) return -1;
      return aDate.getTime() - bDate.getTime();
    });
};

const collectSkillGroups = ({ resume = {}, linkedin = {}, github = {} }) => {
  const resumeSkills = resume.skills || {};
  const githubLanguages = toArray(github.repositories).map((repo) => repo.language).filter(Boolean);

  return {
    languages: uniqueSkills([
      ...toArray(resumeSkills.languages),
      ...toArray(resumeSkills.language),
      ...githubLanguages,
    ]),
    frameworks: uniqueSkills([
      ...toArray(resumeSkills.frameworks),
      ...toArray(linkedin.skills),
    ]),
    tools: uniqueSkills(toArray(resumeSkills.tools)),
    domains: uniqueSkills(toArray(resumeSkills.domains)),
  };
};

const mapGitHubProjects = (github = {}) => {
  const projects = toArray(github.repositories).map((repo) => {
    const visibilityScore = scoreRepositoryVisibility(repo);
    return {
      id: String(repo.id || repo.name || Math.random()),
      name: repo.name,
      description: repo.description || '',
      stack: uniqueSkills([
        repo.language,
        ...toArray(repo.topics),
      ]),
      repoUrl: repo.html_url || null,
      liveUrl: repo.homepage || null,
      screenshots: [],
      impact: '',
      sourceId: 'github',
      visibilityScore,
      featured: false,
      metrics: {
        stars: Number(repo.stargazers_count || 0),
        forks: Number(repo.forks_count || 0),
        hasReadme: hasReadmeContent(repo),
        hasDemo: hasLiveDemo(repo),
        pinned: Boolean(repo.pinned),
        recentDays: daysSince(normalizeDate(repo.pushed_at)),
      },
    };
  });

  const featured = new Set(selectFeaturedProjects(projects).map((project) => project.id));
  return projects.map((project) => ({
    ...project,
    featured: featured.has(project.id),
  }));
};

const computeDataQualityScore = (profile) => {
  let checks = 0;
  let score = 0;

  checks += 1;
  if (profile?.basicInfo?.fullName) score += 1;

  checks += 1;
  if (profile?.basicInfo?.headline) score += 1;

  checks += 1;
  if (toArray(profile?.experience).length > 0) score += 1;

  checks += 1;
  if (toArray(profile?.projects).length > 0) score += 1;

  checks += 1;
  if (toArray(profile?.skills?.languages).length + toArray(profile?.skills?.frameworks).length > 0) score += 1;

  return Number((score / checks).toFixed(2));
};

export const mergePortfolioProfile = ({ resume = {}, linkedin = {}, github = {} } = {}) => {
  const resumeBasics = resume.basicInfo || {};
  const linkedinBasics = linkedin.basicInfo || {};

  const projects = mapGitHubProjects(github);

  const merged = {
    basicInfo: {
      fullName: resumeBasics.fullName || linkedinBasics.fullName || github.profile?.name || null,
      headline: linkedinBasics.headline || resumeBasics.headline || resumeBasics.title || null,
      photo: linkedinBasics.photo || github.profile?.avatar_url || resumeBasics.photo || null,
      email: resumeBasics.email || linkedinBasics.email || null,
      phone: resumeBasics.phone || linkedinBasics.phone || null,
      location: resumeBasics.location || linkedinBasics.location || null,
      summary: linkedinBasics.summary || resumeBasics.summary || github.profile?.bio || null,
      website: resumeBasics.website || linkedinBasics.website || github.profile?.blog || null,
    },
    socials: {
      linkedin: linkedin.url || linkedinBasics.linkedin || null,
      github: github.username || github.profile?.login || null,
      twitter: linkedinBasics.twitter || resumeBasics.twitter || null,
      leetcode: resumeBasics.leetcode || null,
      portfolioLink: resumeBasics.portfolioLink || null,
    },
    skills: collectSkillGroups({ resume, linkedin, github }),
    experience: mergeExperience(resume.experience, linkedin.experience),
    education: toArray(resume.education).length > 0 ? toArray(resume.education) : toArray(linkedin.education),
    projects,
    achievements: uniqueSkills([
      ...toArray(resume.achievements),
      ...toArray(linkedin.achievements),
    ]),
    openSource: {
      contributions: Number(github.profile?.public_repos || 0),
      organizations: toArray(github.organizations),
      stars: toArray(github.repositories).reduce((sum, repo) => sum + Number(repo.stargazers_count || 0), 0),
      followers: Number(github.profile?.followers || 0),
    },
    resumeMeta: {
      uploadedFile: resume.uploadedFile || null,
      parsedAt: resume.parsedAt || null,
      confidenceScore: Number(resume.confidenceScore || 0),
    },
    metadata: {
      lastUpdated: new Date().toISOString(),
      importSources: ['resume', 'github', 'linkedin'].filter((source) => {
        if (source === 'resume') return Object.keys(resume).length > 0;
        if (source === 'github') return Object.keys(github).length > 0;
        return Object.keys(linkedin).length > 0;
      }),
    },
  };

  merged.metadata.dataQualityScore = computeDataQualityScore(merged);
  return merged;
};

export default {
  mergePortfolioProfile,
  scoreRepositoryVisibility,
  selectFeaturedProjects,
};
