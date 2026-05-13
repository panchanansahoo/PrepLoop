const LINKEDIN_PROFILE_URL_REGEX = /^https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/in\/[a-zA-Z0-9-_%]+\/?$/i;

export const validateLinkedinUrl = (url) => {
  const safeUrl = String(url || '').trim();
  if (!safeUrl) return { valid: true, value: null };

  if (!LINKEDIN_PROFILE_URL_REGEX.test(safeUrl)) {
    return { valid: false, error: 'Invalid LinkedIn profile URL format' };
  }

  return { valid: true, value: safeUrl };
};

export const normalizeLinkedinPayload = ({
  url,
  headline,
  summary,
  experience = [],
  education = [],
  skills = [],
  fullName,
  location,
} = {}) => {
  return {
    url: String(url || '').trim() || null,
    basicInfo: {
      fullName: fullName ? String(fullName).trim() : null,
      headline: headline ? String(headline).trim() : null,
      summary: summary ? String(summary).trim() : null,
      location: location ? String(location).trim() : null,
    },
    experience: Array.isArray(experience)
      ? experience.map((item) => ({ ...item, source: 'linkedin' }))
      : [],
    education: Array.isArray(education)
      ? education.map((item) => ({ ...item, source: 'linkedin' }))
      : [],
    skills: Array.isArray(skills) ? skills.filter(Boolean) : [],
    achievements: [],
  };
};

export default {
  validateLinkedinUrl,
  normalizeLinkedinPayload,
};
