/**
 * Profile Data Transformation & Computation Helpers
 */

export function buildInitialProfile(user) {
  return {
    fullName: user?.fullName || '',
    full_name: user?.fullName || '',
    email: user?.email || '',
    subscriptionTier: user?.subscriptionTier || user?.subscription_tier || 'free',
    subscriptionExpiresAt: user?.subscriptionExpiresAt || user?.subscription_expires_at || null,
    subscriptionBillingCycle: user?.subscriptionBillingCycle || user?.subscription_billing_cycle || null,
    subscriptionStatus: user?.subscriptionStatus || user?.subscription_status || 'free',
    subscriptionCancelledAt: user?.subscriptionCancelledAt || user?.subscription_cancelled_at || null,
    cancelAtPeriodEnd: Boolean(user?.cancelAtPeriodEnd),
    coins: user?.coins ?? 0,
    bio: '',
    currentRole: '',
    designation: '',
    experience: '',
    experienceLevel: '',
    experience_level: '',
    skills: '',
    education: '',
    githubUsername: '',
    phone: '',
    location: '',
    website: '',
    company: '',
    yearsOfExperience: '',
    specialization: '',
    profileTheme: 'aurora',
    projects: [],
    certifications: [],
    socialLinks: {
      twitter: '',
      linkedin: '',
      portfolio: '',
      dribbble: '',
    },
  };
}

export function normalizeLinkedinInput(rawValue) {
  const safe = String(rawValue || '').trim();
  if (!safe) return null;

  const HANDLE_RE = /^[a-zA-Z0-9][a-zA-Z0-9-_%]{1,99}$/;
  if (/^https?:\/\//i.test(safe) || /linkedin\.com/i.test(safe)) {
    try {
      const parsed = new URL(/^https?:\/\//i.test(safe) ? safe : `https://${safe}`);
      if (!parsed.hostname.toLowerCase().endsWith('linkedin.com')) return null;
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts[0]?.toLowerCase() !== 'in' || !parts[1] || !HANDLE_RE.test(parts[1])) return null;
      return {
        slug: parts[1],
        url: `https://www.linkedin.com/in/${parts[1]}`,
      };
    } catch {
      return null;
    }
  }

  const cleanSlug = safe.replace(/^@+/, '').replace(/^\/+|\/+$/g, '');
  if (!HANDLE_RE.test(cleanSlug)) return null;
  return {
    slug: cleanSlug,
    url: `https://www.linkedin.com/in/${cleanSlug}`,
  };
}

export function fillLinkedinBlanks(profile, imported) {
  const next = { ...profile };
  for (const key of ['fullName', 'currentRole', 'bio', 'skills', 'experience', 'education', 'location', 'company', 'website', 'phone', 'avatar_url', 'githubUsername']) {
    const value = imported[key];
    if (!String(profile[key] || '').trim() && typeof value === 'string' && value.trim()) {
      next[key] = value.trim();
    }
  }
  if (next.fullName !== profile.fullName) next.full_name = next.fullName;
  if (next.currentRole !== profile.currentRole) next.designation = next.currentRole;
  if (next.githubUsername !== profile.githubUsername) next.github_username = next.githubUsername;
  if (Array.isArray(imported.projects) && imported.projects.length > 0 && (!Array.isArray(profile.projects) || profile.projects.length === 0)) {
    next.projects = imported.projects;
  }
  const socialUpdates = {};
  if (imported.linkedin && !profile.socialLinks?.linkedin?.trim()) {
    socialUpdates.linkedin = imported.linkedin;
  }
  if (imported.twitter && !profile.socialLinks?.twitter?.trim()) {
    socialUpdates.twitter = imported.twitter;
  }
  if (Object.keys(socialUpdates).length > 0) {
    next.socialLinks = { ...(profile.socialLinks || {}), ...socialUpdates };
  }
  return next;
}

export function normalizeProfileData(data) {
  const merged = { ...(data?.user || {}), ...(data || {}) };
  return {
    fullName: merged.fullName ?? merged.full_name ?? '',
    full_name: merged.full_name ?? merged.fullName ?? '',
    email: merged.email ?? '',
    subscriptionTier: merged.subscriptionTier ?? merged.subscription_tier ?? 'free',
    subscriptionExpiresAt: merged.subscriptionExpiresAt ?? merged.subscription_expires_at ?? null,
    subscriptionBillingCycle: merged.subscriptionBillingCycle ?? merged.subscription_billing_cycle ?? null,
    subscriptionStatus: merged.subscriptionStatus ?? merged.subscription_status ?? null,
    subscriptionCancelledAt: merged.subscriptionCancelledAt ?? merged.subscription_cancelled_at ?? null,
    cancelAtPeriodEnd: Boolean(merged.cancelAtPeriodEnd),
    coins: merged.coins ?? 0,
    bio: merged.bio ?? '',
    currentRole: merged.currentRole ?? merged.designation ?? merged.role_title ?? '',
    designation: merged.designation ?? merged.currentRole ?? '',
    experience: merged.experience ?? merged.experienceSummary ?? merged.experience_summary ?? '',
    experienceLevel: merged.experienceLevel ?? merged.experience_level ?? '',
    experience_level: merged.experience_level ?? merged.experienceLevel ?? '',
    skills: merged.skills ?? '',
    education: merged.education ?? '',
    githubUsername: merged.githubUsername ?? merged.github_username ?? '',
    phone: merged.phone ?? '',
    location: merged.location ?? '',
    website: merged.website ?? '',
    company: merged.company ?? '',
    yearsOfExperience: merged.yearsOfExperience ?? merged.years_of_experience ?? '',
    specialization: merged.specialization ?? '',
    profileTheme: merged.profileTheme ?? merged.profile_theme ?? 'aurora',
    avatar_url: merged.avatar_url ?? '',
    custom_url: merged.custom_url ?? '',
    is_public: merged.is_public ?? false,
    projects: Array.isArray(merged.projects) ? merged.projects : [],
    certifications: Array.isArray(merged.certifications) ? merged.certifications : [],
    socialLinks: merged.socialLinks ?? merged.social_links ?? {
      twitter: merged.twitter ?? '',
      linkedin: merged.linkedin ?? '',
      portfolio: merged.portfolio ?? '',
      dribbble: merged.dribbble ?? '',
    },
  };
}

export function buildProfilePayload(profile) {
  const trimmedFullName = profile.fullName?.trim() || '';
  const trimmedCurrentRole = profile.currentRole?.trim() || '';
  const trimmedExperience = profile.experience?.trim() || '';
  const trimmedCompany = profile.company?.trim() || '';
  const trimmedYearsExp = profile.yearsOfExperience?.trim() || '';
  const trimmedSpecialization = profile.specialization?.trim() || '';

  return {
    ...profile,
    fullName: trimmedFullName,
    full_name: trimmedFullName,
    currentRole: trimmedCurrentRole,
    designation: trimmedCurrentRole,
    experience: trimmedExperience,
    experienceLevel: trimmedExperience,
    experience_level: trimmedExperience,
    skills: profile.skills?.trim() || '',
    education: profile.education?.trim() || '',
    bio: profile.bio?.trim() || '',
    githubUsername: profile.githubUsername?.trim() || '',
    github_username: profile.githubUsername?.trim() || '',
    phone: profile.phone?.trim() || '',
    location: profile.location?.trim() || '',
    website: profile.website?.trim() || '',
    company: trimmedCompany,
    yearsOfExperience: trimmedYearsExp,
    specialization: trimmedSpecialization,
    projects: Array.isArray(profile.projects) ? profile.projects : undefined,
    certifications: Array.isArray(profile.certifications) ? profile.certifications : undefined,
    socialLinks: profile.socialLinks || {},
  };
}

export function splitSkillChips(skillsValue = '', resumeProfile = null) {
  const explicitSkills = String(skillsValue || '')
    .split(',')
    .map((skill) => skill.trim())
    .filter(Boolean);

  const inferredSkills = Array.isArray(resumeProfile?.coreSkills)
    ? resumeProfile.coreSkills.map((skill) => String(skill || '').trim()).filter(Boolean)
    : [];

  const merged = [...explicitSkills, ...inferredSkills];
  const deduped = [];
  const seen = new Set();

  merged.forEach((skill) => {
    const key = skill.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    deduped.push(skill);
  });

  return deduped.slice(0, 14);
}

export function calculateProfileCompletion(profile, resumeSnapshot) {
  const fields = [
    profile.fullName,
    profile.bio,
    profile.currentRole,
    profile.skills,
    profile.education,
    profile.phone,
    profile.location,
    profile.website,
    profile.company,
    profile.yearsOfExperience,
    profile.specialization,
    profile.experience,
    profile.githubUsername,
    profile.socialLinks?.linkedin,
  ];
  const filled = fields.filter((f) => String(f || '').trim().length > 0).length;
  return Math.round((filled / fields.length) * 100);
}

export function splitExperiencePoints(profileExperience = '', resumeProfile = null) {
  const normalized = String(profileExperience || '').trim();

  if (!normalized) {
    return Array.isArray(resumeProfile?.likelyQuestionAreas)
      ? resumeProfile.likelyQuestionAreas.slice(0, 4)
      : [];
  }

  const bullets = normalized
    .split(/\n|\.|;/)
    .map((part) => part.trim())
    .filter((part) => part.length > 5)
    .slice(0, 4);

  if (bullets.length) return bullets;
  return [normalized];
}

export function hasNonEmptyText(value) {
  return String(value || '').trim().length > 0;
}

export function isHighConfidenceHeadline(value) {
  const headline = String(value || '').trim();
  if (headline.length < 10) return false;
  const low = headline.toLowerCase();
  if (low.includes('student candidate')) return false;
  if (low.includes('candidate with')) return false;
  if (low.includes('project-based experience')) return false;
  return true;
}

export function filterHighConfidenceExperienceAreas(items = []) {
  const knownFallbacks = [
    'projects mentioned on the resume',
    'technical choices and trade-offs',
    'ownership and collaboration examples',
  ];

  return items
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .filter((item) => item.length > 8)
    .filter((item) => !knownFallbacks.includes(item.toLowerCase()));
}

export async function readApiErrorMessage(response, fallbackMessage) {
  const data = await response.json().catch(() => ({}));
  return data?.error || data?.message || fallbackMessage;
}

export const AUTOFILL_FIELD_LABELS = {
  currentRole: 'Current Role',
  skills: 'Skills',
  experience: 'Experience',
  bio: 'Bio',
};

const UNSAFE_PROTOCOL_RE = /^(?:javascript|data|vbscript):/i;

export function normalizeExternalUrl(rawValue) {
  const trimmed = String(rawValue || '').trim();
  if (!trimmed || UNSAFE_PROTOCOL_RE.test(trimmed)) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed.replace(/^\/+/, '')}`;
}

export function buildSocialUrl(platform, rawValue) {
  const trimmed = String(rawValue || '').trim();
  if (!trimmed || UNSAFE_PROTOCOL_RE.test(trimmed)) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const clean = trimmed.replace(/^@+/, '').replace(/^\/+/, '');
  switch (platform) {
    case 'linkedin':
      if (/linkedin\.com\//i.test(clean)) return `https://${clean}`;
      return `https://www.linkedin.com/in/${clean}`;
    case 'twitter':
      if (/(?:twitter|x)\.com\//i.test(clean)) return `https://${clean}`;
      return `https://x.com/${clean}`;
    case 'dribbble':
      if (/dribbble\.com\//i.test(clean)) return `https://${clean}`;
      return `https://dribbble.com/${clean}`;
    case 'portfolio':
    case 'website':
    default:
      return normalizeExternalUrl(trimmed);
  }
}

export function normalizeGithubHandle(rawValue) {
  let trimmed = String(rawValue || '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed) || trimmed.includes('github.com')) {
    try {
      const urlStr = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
      const parsed = new URL(urlStr);
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts.length > 0) trimmed = parts[0];
    } catch {
      // keep raw trimmed value
    }
  }
  trimmed = trimmed.replace(/^@+/, '');
  return /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(trimmed) ? trimmed : null;
}

export function getPlanBadgeMeta(subscriptionTier) {
  const tier = String(subscriptionTier || 'free').trim().toLowerCase();
  if (tier === 'elite') {
    return { tier: 'elite', label: 'Elite', pill: 'ELITE', isPaid: true };
  }
  if (tier === 'premium' || tier === 'enterprise') {
    return { tier, label: 'Premium', pill: 'PREMIUM', isPaid: true };
  }
  if (tier === 'pro') {
    return { tier, label: 'Pro', pill: 'PRO', isPaid: true };
  }
  return { tier: 'free', label: 'Explorer (Free)', pill: 'FREE', isPaid: false };
}

