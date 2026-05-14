const LINKEDIN_PROFILE_URL_REGEX = /^https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/in\/[a-zA-Z0-9-_%]+\/?$/i;

export const validateLinkedinUrl = (url) => {
  const safeUrl = String(url || '').trim();
  if (!safeUrl) return { valid: true, value: null };

  if (!LINKEDIN_PROFILE_URL_REGEX.test(safeUrl)) {
    return { valid: false, error: 'Invalid LinkedIn profile URL format' };
  }

  return { valid: true, value: safeUrl };
};

// Parse pasted LinkedIn "About" export text into structured profile data
export const parseLinkedinExportText = (text = '') => {
  const safe = String(text || '').trim();
  if (!safe) return null;

  const lines = safe.split('\n').map((l) => l.trim()).filter(Boolean);

  // Name is usually the first non-empty line
  const fullName = lines[0] || null;

  // Headline: second line if it doesn't look like a URL or email
  const headline = lines[1] && !lines[1].includes('@') && !lines[1].startsWith('http') ? lines[1] : null;

  // Location: look for a line matching city/country pattern
  const locationLine = lines.find((l) => /^[A-Z][a-z]+[,\s]+[A-Z]/.test(l) && l.length < 60);

  // Summary: longest paragraph-like block (>80 chars)
  const summary = lines.find((l) => l.length > 80) || null;

  // Skills: lines after a "Skills" header
  const skillsIdx = lines.findIndex((l) => /^skills$/i.test(l));
  const skills = skillsIdx >= 0
    ? lines.slice(skillsIdx + 1, skillsIdx + 20)
        .filter((l) => l.length < 60 && !l.includes(':'))
    : [];

  // Experience: lines after "Experience" header
  const expIdx = lines.findIndex((l) => /^experience$/i.test(l));
  const experience = expIdx >= 0
    ? lines.slice(expIdx + 1, expIdx + 30)
        .filter((l) => l.length > 5)
        .slice(0, 10)
        .map((l) => ({ role: l, company: 'Unknown', source: 'linkedin' }))
    : [];

  // Education: lines after "Education" header
  const eduIdx = lines.findIndex((l) => /^education$/i.test(l));
  const education = eduIdx >= 0
    ? lines.slice(eduIdx + 1, eduIdx + 10)
        .filter((l) => l.length > 3)
        .slice(0, 4)
        .map((l) => ({ institute: l, degree: null, year: null, source: 'linkedin' }))
    : [];

  return {
    fullName,
    headline,
    summary,
    location: locationLine || null,
    skills,
    experience,
    education,
  };
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
  parseLinkedinExportText,
};
