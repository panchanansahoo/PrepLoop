const DEFAULT_TEMPLATE = 'minimal-professional';
const DEFAULT_THEME = 'light';

const asArray = (value) => (Array.isArray(value) ? value : []);
const asText = (value) => String(value ?? '').trim();

const dedupeStrings = (items = []) => {
  const seen = new Set();
  const output = [];

  items.forEach((item) => {
    const value = asText(item);
    if (!value) return;
    const key = value.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    output.push(value);
  });

  return output;
};

const dedupeObjects = (items = [], keyFn) => {
  const seen = new Set();
  const output = [];

  items.forEach((item) => {
    const key = keyFn(item);
    if (!key || seen.has(key)) return;
    seen.add(key);
    output.push(item);
  });

  return output;
};

const parseDateOrZero = (value) => {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const normalizeSlug = (value, fallback = 'portfolio') => {
  const slug = asText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || fallback;
};

const cleanSentence = (value, maxLength = 280) => asText(value).slice(0, maxLength);

const extractEmail = (text) => {
  const match = String(text || '').match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match ? match[0] : '';
};

const extractPhone = (text) => {
  const match = String(text || '').match(/(?:\+?\d[\d\s\-()]{7,}\d)/);
  return match ? match[0] : '';
};

const extractLocation = (text) => {
  const lines = String(text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 14);
  const found = lines.find((line) => /,|india|usa|uk|canada|remote|bangalore|delhi|mumbai|pune|hyderabad/i.test(line));
  return found || '';
};

const detectReadmeQuality = (content = '') => {
  const text = String(content || '');
  if (!text) return { hasReadme: false, score: 0 };

  let score = 1;
  if (/##?\s+installation|##?\s+setup|npm install|pip install|pnpm install/i.test(text)) score += 2;
  if (/##?\s+usage|##?\s+run|getting started/i.test(text)) score += 1;
  if (/screenshot|demo|preview|deployed/i.test(text)) score += 1;
  if (text.length > 1200) score += 1;

  return {
    hasReadme: true,
    score: Math.min(score, 5),
  };
};

const recencyScore = (pushedAt) => {
  const pushed = parseDateOrZero(pushedAt);
  if (!pushed) return 0;
  const ageDays = Math.max(0, Math.floor((Date.now() - pushed) / (1000 * 60 * 60 * 24)));
  if (ageDays <= 30) return 5;
  if (ageDays <= 90) return 4;
  if (ageDays <= 180) return 3;
  if (ageDays <= 365) return 2;
  return 0;
};

const hasDemoLink = (repo) => Boolean(asText(repo?.homepage)) || /demo|vercel|netlify|render/i.test(asText(repo?.description));
const topicRelevanceScore = (repo) => Math.min(asArray(repo?.topics).length, 4);

const getSourceUpdatedAt = (source) =>
  parseDateOrZero(
    source?.resumeMeta?.parsedAt
    || source?.linkedinMeta?.importedAt
    || source?.githubMeta?.fetchedAt
    || source?.updatedAt
    || 0,
  );

function buildNormalizedProfile(overrides = {}) {
  return {
    basics: {
      name: '',
      title: '',
      photo: '',
      email: '',
      phone: '',
      location: '',
      summary: '',
      website: '',
      ...(overrides.basics || {}),
    },
    socials: {
      linkedin: '',
      github: '',
      twitter: '',
      leetcode: '',
      portfolioLink: '',
      ...(overrides.socials || {}),
    },
    skills: {
      languages: [],
      frameworks: [],
      tools: [],
      domains: [],
      ...(overrides.skills || {}),
    },
    experience: asArray(overrides.experience || []),
    education: asArray(overrides.education || []),
    projects: asArray(overrides.projects || []),
    achievements: {
      awards: [],
      certifications: [],
      ranks: [],
      ...(overrides.achievements || {}),
    },
    openSource: {
      contributions: 0,
      organizations: [],
      stars: 0,
      followers: 0,
      ...(overrides.openSource || {}),
    },
    resumeMeta: {
      uploadedFile: '',
      parsedAt: null,
      confidenceScore: 0,
      ...(overrides.resumeMeta || {}),
    },
    portfolioMeta: {
      template: DEFAULT_TEMPLATE,
      theme: DEFAULT_THEME,
      slug: '',
      publishedUrl: '',
      lastUpdated: null,
      sectionVisibility: {
        hero: true,
        about: true,
        skills: true,
        experience: true,
        projects: true,
        openSource: true,
        education: true,
        achievements: true,
        contact: true,
      },
      ...(overrides.portfolioMeta || {}),
    },
    sourceMeta: {
      experienceConfidence: 0,
      skillConfidence: {},
      ...(overrides.sourceMeta || {}),
    },
  };
}

function normalizeResumeSource({ latestAnalysis = null } = {}) {
  const profile = buildNormalizedProfile();
  if (!latestAnalysis) return profile;

  const resumeText = String(latestAnalysis.resume_text || '');
  const keywords = latestAnalysis.keyword_match || {};
  const interviewProfile = latestAnalysis.interview_profile || latestAnalysis.interviewProfile || {};

  profile.basics.title = cleanSentence(interviewProfile.candidateHeadline || '');
  profile.basics.summary = cleanSentence(interviewProfile.summary || '');
  profile.basics.email = extractEmail(resumeText);
  profile.basics.phone = extractPhone(resumeText);
  profile.basics.location = extractLocation(resumeText);
  profile.resumeMeta = {
    uploadedFile: latestAnalysis.uploaded_file || '',
    parsedAt: latestAnalysis.analyzed_at || new Date().toISOString(),
    confidenceScore: Math.min(1, Math.max(0, Number(latestAnalysis.ats_score || 0) / 100)),
  };

  profile.skills = {
    languages: dedupeStrings(asArray(keywords.technical).slice(0, 20)),
    frameworks: [],
    tools: [],
    domains: dedupeStrings(asArray(interviewProfile.likelyQuestionAreas).slice(0, 10)),
  };

  return profile;
}

function normalizeLinkedinSource({ linkedinUrl = '', profileData = {} } = {}) {
  const profile = buildNormalizedProfile();

  const skills = typeof profileData.skills === 'string'
    ? profileData.skills.split(',').map((item) => item.trim())
    : asArray(profileData.skills);

  profile.basics = {
    ...profile.basics,
    name: asText(profileData.name || profileData.fullName),
    title: cleanSentence(profileData.headline || profileData.title || ''),
    summary: cleanSentence(profileData.about || profileData.summary || '', 500),
    location: asText(profileData.location),
    phone: asText(profileData.phone),
    website: asText(profileData.website),
  };

  profile.socials.linkedin = asText(linkedinUrl || profileData.linkedin || profileData.linkedinUrl);
  profile.skills = {
    ...profile.skills,
    frameworks: dedupeStrings(skills),
  };

  profile.linkedinMeta = {
    importedAt: new Date().toISOString(),
  };

  return profile;
}

function rankGithubRepositories(repositories = [], pinnedRepoNames = []) {
  const pinnedSet = new Set(asArray(pinnedRepoNames).map((name) => String(name).toLowerCase()));

  return asArray(repositories)
    .map((repo) => {
      const stars = Number(repo.stargazers_count || repo.stars || 0);
      const starsScore = Math.log2(stars + 1) * 4;
      const { hasReadme, score: readmeScore } = detectReadmeQuality(repo.readmeText || '');
      const visibilityScore =
        starsScore
        + recencyScore(repo.pushed_at)
        + (hasReadme ? 2 + readmeScore : 0)
        + (hasDemoLink(repo) ? 3 : 0)
        + (pinnedSet.has(String(repo.name || '').toLowerCase()) ? 4 : 0)
        + topicRelevanceScore(repo);

      return {
        ...repo,
        visibilityScore,
        hasReadme,
        hasDemo: hasDemoLink(repo),
      };
    })
    .sort((left, right) => right.visibilityScore - left.visibilityScore);
}

function pickFeaturedProjects(rankedRepositories = [], maxProjects = 5) {
  const upperLimit = Math.min(5, Math.max(3, Number(maxProjects) || 5));
  return asArray(rankedRepositories).slice(0, upperLimit).map((repo) => ({
    name: asText(repo.name),
    description: cleanSentence(repo.description || '', 500),
    stack: dedupeStrings([
      ...asArray(repo.stack),
      ...asArray(repo.topics),
      asText(repo.language),
    ]),
    repoUrl: asText(repo.html_url || repo.repoUrl || ''),
    liveUrl: asText(repo.homepage || repo.liveUrl || ''),
    screenshots: [],
    impact: `Visibility score ${Number(repo.visibilityScore || 0)}`,
    stars: Number(repo.stargazers_count || repo.stars || 0),
    language: asText(repo.language),
    source: 'github',
  }));
}

function normalizeGithubSource({ profileData = {}, repositories = [], pinnedRepoNames = [] } = {}) {
  const profile = buildNormalizedProfile();
  const ranked = rankGithubRepositories(repositories, pinnedRepoNames);
  const featuredProjects = pickFeaturedProjects(ranked, 5);

  const languages = dedupeStrings(asArray(repositories).map((repo) => repo.language).filter(Boolean)).slice(0, 20);
  const totalStars = asArray(repositories).reduce((sum, repo) => sum + Number(repo.stargazers_count || 0), 0);

  profile.basics = {
    ...profile.basics,
    name: asText(profileData.name),
    photo: asText(profileData.avatar_url),
    summary: cleanSentence(profileData.bio || '', 500),
    location: asText(profileData.location),
    website: asText(profileData.blog),
  };

  profile.socials = {
    ...profile.socials,
    github: asText(profileData.html_url),
    twitter: asText(profileData.twitter_username) ? `https://twitter.com/${profileData.twitter_username}` : '',
  };

  profile.skills = {
    ...profile.skills,
    languages,
  };

  profile.projects = featuredProjects;
  profile.openSource = {
    contributions: Number(profileData.public_repos || 0),
    organizations: [],
    stars: totalStars,
    followers: Number(profileData.followers || 0),
  };

  profile.githubMeta = {
    fetchedAt: new Date().toISOString(),
    rankedRepositories: ranked,
  };

  return profile;
}

const mergeFieldByPriority = (sources, extractValue, priority = ['resume', 'linkedin', 'github']) => {
  for (const sourceKey of priority) {
    const source = sources[sourceKey];
    if (!source) continue;
    const candidate = asText(extractValue(source));
    if (candidate) return candidate;
  }
  return '';
};

const mergeFieldByLatest = (sources, extractValue, fallbackPriority = ['linkedin', 'resume', 'github']) => {
  const candidates = Object.entries(sources)
    .map(([key, source]) => ({
      key,
      value: asText(extractValue(source)),
      updatedAt: getSourceUpdatedAt(source),
    }))
    .filter((item) => item.value);

  if (!candidates.length) {
    return mergeFieldByPriority(sources, extractValue, fallbackPriority);
  }

  candidates.sort((left, right) => {
    if (right.updatedAt !== left.updatedAt) return right.updatedAt - left.updatedAt;
    return fallbackPriority.indexOf(left.key) - fallbackPriority.indexOf(right.key);
  });

  return candidates[0].value;
};

function mergeNormalizedProfiles({ resume = null, linkedin = null, github = null } = {}) {
  const sourceProfiles = { resume, linkedin, github };
  const merged = buildNormalizedProfile();

  merged.basics = {
    ...merged.basics,
    name: mergeFieldByPriority(sourceProfiles, (s) => s?.basics?.name, ['resume', 'linkedin', 'github']),
    title: mergeFieldByLatest(sourceProfiles, (s) => s?.basics?.title, ['linkedin', 'resume', 'github']),
    photo: mergeFieldByPriority(sourceProfiles, (s) => s?.basics?.photo, ['github', 'linkedin', 'resume']),
    email: mergeFieldByPriority(sourceProfiles, (s) => s?.basics?.email, ['resume', 'linkedin', 'github']),
    phone: mergeFieldByPriority(sourceProfiles, (s) => s?.basics?.phone, ['resume', 'linkedin', 'github']),
    location: mergeFieldByPriority(sourceProfiles, (s) => s?.basics?.location, ['resume', 'linkedin', 'github']),
    summary: mergeFieldByPriority(sourceProfiles, (s) => s?.basics?.summary, ['linkedin', 'resume', 'github']),
    website: mergeFieldByPriority(sourceProfiles, (s) => s?.basics?.website, ['resume', 'linkedin', 'github']),
  };

  merged.socials = {
    ...merged.socials,
    linkedin: mergeFieldByPriority(sourceProfiles, (s) => s?.socials?.linkedin, ['linkedin', 'resume', 'github']),
    github: mergeFieldByPriority(sourceProfiles, (s) => s?.socials?.github, ['github', 'linkedin', 'resume']),
    twitter: mergeFieldByPriority(sourceProfiles, (s) => s?.socials?.twitter, ['github', 'linkedin', 'resume']),
    leetcode: mergeFieldByPriority(sourceProfiles, (s) => s?.socials?.leetcode, ['resume', 'linkedin', 'github']),
  };

  const allLanguages = dedupeStrings([
    ...asArray(resume?.skills?.languages),
    ...asArray(linkedin?.skills?.languages),
    ...asArray(github?.skills?.languages),
  ]);
  const allFrameworks = dedupeStrings([
    ...asArray(resume?.skills?.frameworks),
    ...asArray(linkedin?.skills?.frameworks),
    ...asArray(github?.skills?.frameworks),
  ]);
  const allTools = dedupeStrings([
    ...asArray(resume?.skills?.tools),
    ...asArray(linkedin?.skills?.tools),
    ...asArray(github?.skills?.tools),
  ]);
  const allDomains = dedupeStrings([
    ...asArray(resume?.skills?.domains),
    ...asArray(linkedin?.skills?.domains),
    ...asArray(github?.skills?.domains),
  ]);

  const skillCountMap = {};
  [resume, linkedin, github].forEach((source) => {
    const skills = [
      ...asArray(source?.skills?.languages),
      ...asArray(source?.skills?.frameworks),
      ...asArray(source?.skills?.tools),
      ...asArray(source?.skills?.domains),
    ];
    dedupeStrings(skills).forEach((skill) => {
      const key = skill.toLowerCase();
      skillCountMap[key] = (skillCountMap[key] || 0) + 1;
    });
  });

  merged.skills = {
    languages: allLanguages,
    frameworks: allFrameworks,
    tools: allTools,
    domains: allDomains,
  };

  const resumeExp = asArray(resume?.experience);
  const linkedinExp = asArray(linkedin?.experience);
  merged.experience = dedupeObjects([...resumeExp, ...linkedinExp], (exp) => (
    `${asText(exp?.company).toLowerCase()}|${asText(exp?.role).toLowerCase()}|${asText(exp?.start).toLowerCase()}`
  )).map((exp) => {
    const appearsInBoth = resumeExp.some((item) => (
      asText(item?.company).toLowerCase() === asText(exp?.company).toLowerCase()
      && asText(item?.role).toLowerCase() === asText(exp?.role).toLowerCase()
    )) && linkedinExp.some((item) => (
      asText(item?.company).toLowerCase() === asText(exp?.company).toLowerCase()
      && asText(item?.role).toLowerCase() === asText(exp?.role).toLowerCase()
    ));

    return {
      ...exp,
      confidence: appearsInBoth ? 1 : 0.6,
    };
  });

  merged.education = dedupeObjects(
    [...asArray(resume?.education), ...asArray(linkedin?.education)],
    (edu) => `${asText(edu?.institute).toLowerCase()}|${asText(edu?.degree).toLowerCase()}|${asText(edu?.year).toLowerCase()}`,
  );

  const githubProjects = asArray(github?.projects);
  const nonGithubProjects = [...asArray(resume?.projects), ...asArray(linkedin?.projects)];
  merged.projects = dedupeObjects([...githubProjects, ...nonGithubProjects], (project) => asText(project?.name).toLowerCase())
    .slice(0, 12);

  merged.achievements = {
    awards: dedupeStrings([
      ...asArray(resume?.achievements?.awards),
      ...asArray(linkedin?.achievements?.awards),
    ]),
    certifications: dedupeStrings([
      ...asArray(resume?.achievements?.certifications),
      ...asArray(linkedin?.achievements?.certifications),
    ]),
    ranks: dedupeStrings([
      ...asArray(resume?.achievements?.ranks),
      ...asArray(linkedin?.achievements?.ranks),
    ]),
  };

  merged.openSource = {
    contributions: Number(github?.openSource?.contributions || 0),
    organizations: dedupeStrings(asArray(github?.openSource?.organizations)),
    stars: Number(github?.openSource?.stars || 0),
    followers: Number(github?.openSource?.followers || 0),
  };

  merged.resumeMeta = resume?.resumeMeta || merged.resumeMeta;
  merged.sourceMeta = {
    experienceConfidence: merged.experience.length
      ? Number((merged.experience.reduce((sum, exp) => sum + Number(exp.confidence || 0), 0) / merged.experience.length).toFixed(2))
      : 0,
    skillConfidence: Object.fromEntries(
      Object.entries(skillCountMap).map(([skill, count]) => [skill, count >= 2 ? 1 : 0.5]),
    ),
  };

  return merged;
}

function buildPortfolioPayload({
  mergedProfile,
  template = DEFAULT_TEMPLATE,
  theme = DEFAULT_THEME,
  slug,
  publishedUrl,
} = {}) {
  const safeSlug = normalizeSlug(slug, normalizeSlug(mergedProfile?.basics?.name || 'portfolio'));
  const featuredProjects = asArray(mergedProfile?.projects).slice(0, 5);

  return {
    normalizedProfile: mergedProfile,
    sections: {
      hero: {
        name: mergedProfile?.basics?.name || '',
        role: mergedProfile?.basics?.title || '',
        summary: mergedProfile?.basics?.summary || '',
      },
      about: mergedProfile?.basics?.summary || '',
      skills: mergedProfile?.skills || {},
      experience: mergedProfile?.experience || [],
      featuredProjects,
      openSource: mergedProfile?.openSource || {},
      education: mergedProfile?.education || [],
      achievements: mergedProfile?.achievements || {},
      contact: {
        email: mergedProfile?.basics?.email || '',
        website: mergedProfile?.basics?.website || '',
        socials: mergedProfile?.socials || {},
      },
    },
    featuredProjects,
    template,
    theme,
    slug: safeSlug,
    isPublished: true,
    publishedUrl: asText(publishedUrl),
    lastUpdated: new Date().toISOString(),
  };
}

export {
  buildNormalizedProfile,
  normalizeResumeSource,
  normalizeLinkedinSource,
  normalizeGithubSource,
  rankGithubRepositories,
  pickFeaturedProjects,
  mergeNormalizedProfiles,
  buildPortfolioPayload,
  normalizeSlug,
};
