/**
 * Profile Data Transformation & Computation Helpers
 */

export function buildInitialProfile(user) {
  return {
    fullName: user?.fullName || '',
    full_name: user?.fullName || '',
    email: user?.email || '',
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
    socialLinks: {
      twitter: '',
      linkedin: '',
      portfolio: '',
      dribbble: '',
    },
  };
}

export function normalizeProfileData(data) {
  const merged = { ...(data?.user || {}), ...(data || {}) };
  return {
    fullName: merged.fullName ?? merged.full_name ?? '',
    full_name: merged.full_name ?? merged.fullName ?? '',
    email: merged.email ?? '',
    bio: merged.bio ?? '',
    currentRole: merged.currentRole ?? merged.designation ?? merged.role_title ?? '',
    designation: merged.designation ?? merged.currentRole ?? '',
    experience: merged.experience ?? merged.experienceLevel ?? merged.experience_level ?? '',
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

