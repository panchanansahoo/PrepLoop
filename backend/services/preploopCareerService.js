const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'have', 'will', 'your', 'you', 'our', 'are', 'into', 'about',
  'role', 'team', 'work', 'years', 'year', 'must', 'required', 'requirements', 'nice', 'plus', 'good', 'strong',
  'ability', 'experience', 'developer', 'engineer', 'software', 'building', 'skills', 'skill', 'using', 'across',
  'full', 'time', 'part', 'remote', 'job', 'jobs', 'position', 'positions', 'candidate', 'candidates',
]);

const QUALIFICATION_HINTS = [
  { pattern: /\bb\.?\s*tech\b|\bbtech\b|\bb\.e\.?\b|\bbe\b/i, label: 'btech' },
  { pattern: /\bm\.?\s*tech\b|\bmtech\b|\bm\.e\.?\b|\bme\b/i, label: 'mtech' },
  { pattern: /\bb\.?\s*ca\b|\bbca\b/i, label: 'bca' },
  { pattern: /\bm\.?\s*ca\b|\bmca\b/i, label: 'mca' },
  { pattern: /\bb\.?\s*sc\b|\bbsc\b/i, label: 'bsc' },
  { pattern: /\bm\.?\s*sc\b|\bmsc\b/i, label: 'msc' },
  { pattern: /\bmba\b/i, label: 'mba' },
  { pattern: /\bph\.?\s*d\b|\bphd\b|\bdoctorate\b/i, label: 'phd' },
  { pattern: /\bdiploma\b/i, label: 'diploma' },
  { pattern: /\bgraduate\b/i, label: 'graduate' },
  { pattern: /\bdegree\b/i, label: 'degree' },
];

function normalizeString(value) {
  return String(value || '').trim();
}

function normalizeText(value) {
  return normalizeString(value)
    .toLowerCase()
    .replace(/[^a-z0-9+#.\-\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function uniqueStrings(items = []) {
  const seen = new Set();
  const output = [];

  for (const item of items) {
    const normalized = normalizeString(item);
    if (!normalized) continue;

    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    output.push(normalized);
  }

  return output;
}

function splitList(value) {
  if (Array.isArray(value)) {
    return uniqueStrings(value);
  }

  return uniqueStrings(
    String(value || '')
      .split(',')
      .map(item => item.trim())
      .filter(Boolean)
  );
}

function tokenize(value) {
  const text = normalizeText(value);
  if (!text) return [];

  return text
    .split(' ')
    .map(token => token.trim())
    .filter(token => token.length > 2 && !STOP_WORDS.has(token));
}

function extractQualificationTerms(qualification) {
  const text = normalizeText(qualification);
  if (!text) return [];

  const terms = new Set(tokenize(text));
  for (const hint of QUALIFICATION_HINTS) {
    if (hint.pattern.test(text)) {
      terms.add(hint.label);
    }
  }

  return [...terms];
}

function getJobText(job = {}) {
  return normalizeText(
    [
      job.title,
      job.company,
      job.description,
      Array.isArray(job.requirements) ? job.requirements.join(' ') : '',
      Array.isArray(job.tags) ? job.tags.join(' ') : '',
      job.location,
      job.salary_range,
    ].filter(Boolean).join(' ')
  );
}

function isLocationMatch(jobLocation, userLocation) {
  const normalizedJobLocation = normalizeText(jobLocation);
  const normalizedUserLocation = normalizeText(userLocation);

  if (!normalizedJobLocation || !normalizedUserLocation) return false;

  if (normalizedJobLocation.includes(normalizedUserLocation) || normalizedUserLocation.includes(normalizedJobLocation)) {
    return true;
  }

  return tokenize(normalizedUserLocation).some(token => normalizedJobLocation.includes(token));
}

function isQualificationMatch(jobText, qualification) {
  const qualificationTerms = extractQualificationTerms(qualification);
  if (!qualificationTerms.length) return false;

  return qualificationTerms.some(term => jobText.includes(term));
}

function isExperienceMatch(jobText, experienceLevel) {
  const normalized = normalizeText(experienceLevel);
  if (!normalized) return false;

  if (normalized.includes('fresher') || normalized.includes('entry')) {
    return /fresher|entry level|entry-level|graduate|new grad/.test(jobText);
  }

  if (normalized.includes('junior')) {
    return /junior|associate|entry level|entry-level/.test(jobText);
  }

  if (normalized.includes('mid')) {
    return /mid level|mid-level|intermediate/.test(jobText);
  }

  if (normalized.includes('senior')) {
    return /senior|lead|staff|principal/.test(jobText);
  }

  return false;
}

export function normalizeProfileSignals(profile = {}) {
  return {
    skills: splitList(profile.skills || profile.coreSkills || profile.skillSet || profile.userSkills || []),
    location: normalizeString(profile.location || profile.preferred_location || profile.userLocation),
    qualification: normalizeString(profile.qualification || profile.education || profile.degree || profile.userQualification),
    preferredRole: normalizeString(
      profile.preferred_role ||
      profile.designation ||
      profile.current_role ||
      profile.preferredRole ||
      profile.userPreferredRole
    ),
    experienceLevel: normalizeString(profile.experience_level || profile.experienceLevel),
    experienceSummary: normalizeString(profile.experience_summary || profile.experienceSummary),
  };
}

export function hasMeaningfulProfileSignals(signals = {}) {
  return Boolean(
    signals.skills?.length ||
    signals.location ||
    signals.qualification ||
    signals.preferredRole ||
    signals.experienceLevel ||
    signals.experienceSummary
  );
}

export function buildCareerSearchQuery(profileSignals = {}) {
  const signals = normalizeProfileSignals(profileSignals);
  const parts = [];

  if (signals.preferredRole) parts.push(signals.preferredRole);
  if (signals.skills.length) parts.push(...signals.skills.slice(0, 3));
  if (signals.qualification) parts.push(signals.qualification);
  if (signals.location) parts.push(signals.location);

  if (!parts.length) {
    parts.push('software developer');
  }

  return uniqueStrings(parts).join(' ').trim();
}

export function scoreJobsAgainstProfile(jobs = [], profileSignals = {}) {
  const signals = normalizeProfileSignals(profileSignals);

  return jobs.map((job) => {
    const jobText = getJobText(job);
    const matchedSkills = signals.skills.filter(skill => {
      const normalizedSkill = normalizeText(skill);
      return normalizedSkill && jobText.includes(normalizedSkill);
    });

    const matchedSignals = [];
    let score = hasMeaningfulProfileSignals(signals) ? 15 : 0;

    if (signals.skills.length > 0) {
      const skillScore = (matchedSkills.length / signals.skills.length) * 45;
      score += Math.round(skillScore);

      if (matchedSkills.length > 0) {
        matchedSignals.push(`Skills: ${matchedSkills.slice(0, 3).join(', ')}`);
      }
    } else if (/fresher|graduate|entry level|entry-level/.test(jobText)) {
      score += 10;
    }

    if (signals.preferredRole) {
      const normalizedRole = normalizeText(signals.preferredRole);
      const titleText = normalizeText(job.title);
      if (titleText.includes(normalizedRole)) {
        score += 15;
        matchedSignals.push(`Role: ${signals.preferredRole}`);
      } else if (tokenize(signals.preferredRole).some(token => jobText.includes(token))) {
        score += 10;
        matchedSignals.push(`Role: ${signals.preferredRole}`);
      }
    }

    if (isLocationMatch(job.location, signals.location)) {
      score += 18;
      matchedSignals.push(`Location: ${signals.location}`);
    }

    if (isQualificationMatch(jobText, signals.qualification)) {
      score += 18;
      matchedSignals.push(`Qualification: ${signals.qualification}`);
    }

    if (isExperienceMatch(jobText, signals.experienceLevel)) {
      score += 10;
      matchedSignals.push(`Experience: ${signals.experienceLevel}`);
    }

    const matchScore = Math.min(100, Math.max(0, Math.round(score)));

    return {
      ...job,
      matchScore,
      matchedSkills: uniqueStrings(matchedSkills).slice(0, 5),
      matchedSignals: uniqueStrings(matchedSignals).slice(0, 5),
      userSignals: {
        location: signals.location || null,
        qualification: signals.qualification || null,
        preferredRole: signals.preferredRole || null,
      },
    };
  });
}
