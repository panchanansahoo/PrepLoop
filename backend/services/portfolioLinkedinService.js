const LINKEDIN_PROFILE_URL_REGEX = /^https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/in\/[a-zA-Z0-9-_%]+\/?$/i;
const LINKEDIN_HANDLE_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9-_%]{1,99}$/;

export const normalizeLinkedinIdOrUrl = (rawInput) => {
  const safe = String(rawInput || '').trim();
  if (!safe) {
    return { valid: false, error: 'Please enter a LinkedIn username or profile URL.' };
  }

  if (/^https?:\/\//i.test(safe) || /linkedin\.com/i.test(safe)) {
    const withProtocol = /^https?:\/\//i.test(safe) ? safe : `https://${safe}`;
    try {
      const parsed = new URL(withProtocol);
      const hostname = parsed.hostname.toLowerCase();
      if (!hostname.endsWith('linkedin.com')) {
        return { valid: false, error: 'Please enter a valid LinkedIn profile URL or user ID.' };
      }
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts[0]?.toLowerCase() !== 'in' || !parts[1] || !LINKEDIN_HANDLE_REGEX.test(parts[1])) {
        return { valid: false, error: 'Invalid LinkedIn profile URL. Expected format: linkedin.com/in/username' };
      }
      const slug = parts[1];
      return { valid: true, slug, url: `https://www.linkedin.com/in/${slug}` };
    } catch {
      return { valid: false, error: 'Invalid LinkedIn profile URL format' };
    }
  }

  const cleanSlug = safe.replace(/^@+/, '').replace(/^\/+|\/+$/g, '');
  if (!LINKEDIN_HANDLE_REGEX.test(cleanSlug)) {
    return { valid: false, error: 'Invalid LinkedIn user ID. Use letters, numbers, or hyphens (e.g. john-doe).' };
  }

  return { valid: true, slug: cleanSlug, url: `https://www.linkedin.com/in/${cleanSlug}` };
};

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

  const lines = safe.split(/\r?\n/).map(line => line.trim())
    .filter(line => line && !/^Page \d+ of \d+$/i.test(line));
  const heading = /^(contact(?: info)?|top skills|skills|summary|about|experience|education|languages|certifications|honors(?: & awards)?|publications|projects|recommendations|activity)$/i;
  const sections = { intro: [] };
  let section = 'intro';
  for (const line of lines) {
    if (heading.test(line)) {
      section = line.toLowerCase();
      sections[section] ||= [];
    } else {
      sections[section].push(line);
    }
  }
  const intro = sections.intro.filter(line => !/@|https?:|linkedin\.com/i.test(line));
  const linkedin = safe.match(/\b(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w%-]+/i)?.[0];
  const skills = sections.skills || sections['top skills'] || [];

  const contact = sections.contact || sections['contact info'] || [];
  const phone = contact.map(line => line.replace(/\s*\((?:mobile|home|work)\)$/i, '').trim())
    .find(line => /^\+?[\d(). -]+$/.test(line) && /^\d{7,15}$/.test(line.replace(/\D/g, '')));
  const website = contact.map(line => line.split(/\s/)[0])
    .find(line => /^https?:\/\//i.test(line) && !/linkedin\.com/i.test(line));

  return {
    phone: phone || null,
    website: website || null,
    fullName: intro[0] || null,
    headline: intro[1] || null,
    summary: (sections.about || sections.summary || []).join(' ') || intro.find(line => line.length > 80) || null,
    location: intro.slice(2).find(line => line.includes(',') && line.length < 100) || null,
    linkedin: linkedin ? linkedin.replace(/^(?!https?:\/\/)/i, 'https://') : null,
    // LinkedIn's PDF sidebar lists up to three top skills before the main column.
    skills: skills.slice(0, sections.skills ? 20 : 3),
    experience: (sections.experience || []).slice(0, 30).map(role => ({ role, source: 'linkedin' })),
    education: (sections.education || []).slice(0, 10).map(institute => ({ institute, source: 'linkedin' })),
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

export const normalizeExternalLinkedinRecord = (raw = {}, fallbackUrl = '') => {
  const fullName = raw.full_name || raw.fullName || [raw.first_name || raw.firstName, raw.last_name || raw.lastName].filter(Boolean).join(' ') || '';
  const currentRole = raw.headline || raw.occupation || raw.title || '';
  const bio = raw.summary || raw.about || '';
  const locationParts = [raw.city, raw.state, raw.country_full_name || raw.country].filter(Boolean);
  const location = raw.location || raw.geo?.full || locationParts.join(', ');

  const rawExperiences = Array.isArray(raw.experiences)
    ? raw.experiences
    : Array.isArray(raw.position)
      ? raw.position
      : [];

  const firstExp = rawExperiences[0] || {};
  const company = raw.company || firstExp.company || firstExp.companyName || '';
  const experience = rawExperiences
    .slice(0, 8)
    .map((exp) => {
      if (typeof exp === 'string') return exp;
      const role = exp.title || exp.role || '';
      const org = exp.company || exp.companyName || '';
      const span = [
        exp.starts_at?.year || exp.start?.year,
        exp.ends_at?.year || exp.end?.year || (exp.starts_at?.year || exp.start?.year ? 'Present' : ''),
      ].filter(Boolean).join('–');
      return [role, org ? `at ${org}` : '', span ? `(${span})` : ''].filter(Boolean).join(' ');
    })
    .filter(Boolean)
    .join('; ');

  const rawEducations = Array.isArray(raw.education)
    ? raw.education
    : Array.isArray(raw.educations)
      ? raw.educations
      : [];

  const education = rawEducations
    .slice(0, 4)
    .map((edu) => {
      if (typeof edu === 'string') return edu;
      const degree = edu.degree_name || edu.degree || edu.field_of_study || '';
      const school = edu.school || edu.schoolName || edu.institute || '';
      return [degree, school ? `from ${school}` : ''].filter(Boolean).join(' ');
    })
    .filter(Boolean)
    .join('; ');

  const rawSkills = Array.isArray(raw.skills)
    ? raw.skills.map((s) => (typeof s === 'string' ? s : s?.name || s?.skill || '')).filter(Boolean)
    : [];

  const website = Array.isArray(raw.personal_urls) ? raw.personal_urls[0] || '' : (raw.website || '');
  const avatarUrl = raw.profile_pic_url || raw.profilePicture || raw.avatar_url || '';

  return {
    fullName: String(fullName).trim(),
    currentRole: String(currentRole).trim(),
    bio: String(bio).trim(),
    skills: Array.from(new Set(rawSkills)).slice(0, 20).join(', '),
    experience,
    education,
    location: String(location || '').trim(),
    company: String(company || '').trim(),
    website: String(website || '').trim(),
    avatar_url: /^https:\/\//i.test(String(avatarUrl || '')) ? String(avatarUrl).trim() : '',
    linkedin: fallbackUrl || raw.linkedin || raw.url || '',
  };
};

export const fetchLinkedinProfileById = async (linkedinInput, fetchImpl = fetch) => {
  const normalized = normalizeLinkedinIdOrUrl(linkedinInput);
  if (!normalized.valid) {
    return { valid: false, error: normalized.error };
  }

  const { slug, url: linkedinUrl } = normalized;
  const proxycurlKey = String(process.env.PROXYCURL_API_KEY || '').trim();
  const rapidApiKey = String(process.env.RAPIDAPI_KEY || '').trim();
  const rapidApiHost = String(process.env.RAPIDAPI_LINKEDIN_HOST || '').trim();
  const rapidApiPath = String(process.env.RAPIDAPI_LINKEDIN_PATH || '/get-profile-data-by-url').trim();

  if (proxycurlKey) {
    try {
      const endpoint = `https://nubela.co/proxycurl/api/v2/linkedin?url=${encodeURIComponent(linkedinUrl)}&skills=include`;
      const response = await fetchImpl(endpoint, {
        headers: { Authorization: `Bearer ${proxycurlKey}` },
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) {
        return {
          valid: true,
          available: false,
          reason: 'provider_error',
          slug,
          linkedinUrl,
          error: `LinkedIn provider returned ${response.status}`,
          profileData: { linkedin: linkedinUrl },
        };
      }
      const rawData = await response.json();
      return {
        valid: true,
        available: true,
        slug,
        linkedinUrl,
        profileData: normalizeExternalLinkedinRecord(rawData, linkedinUrl),
      };
    } catch (err) {
      return {
        valid: true,
        available: false,
        reason: 'provider_error',
        slug,
        linkedinUrl,
        error: err?.message || 'LinkedIn lookup timed out',
        profileData: { linkedin: linkedinUrl },
      };
    }
  }

  if (rapidApiHost && rapidApiKey) {
    try {
      const pathWithSlash = rapidApiPath.startsWith('/') ? rapidApiPath : `/${rapidApiPath}`;
      const separator = pathWithSlash.includes('?') ? '&' : '?';
      const endpoint = `https://${rapidApiHost}${pathWithSlash}${separator}url=${encodeURIComponent(linkedinUrl)}`;
      const response = await fetchImpl(endpoint, {
        headers: {
          'x-rapidapi-key': rapidApiKey,
          'x-rapidapi-host': rapidApiHost,
        },
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) {
        return {
          valid: true,
          available: false,
          reason: 'provider_error',
          slug,
          linkedinUrl,
          error: `LinkedIn provider returned ${response.status}`,
          profileData: { linkedin: linkedinUrl },
        };
      }
      const payload = await response.json();
      const rawData = payload?.data || payload;
      return {
        valid: true,
        available: true,
        slug,
        linkedinUrl,
        profileData: normalizeExternalLinkedinRecord(rawData, linkedinUrl),
      };
    } catch (err) {
      return {
        valid: true,
        available: false,
        reason: 'provider_error',
        slug,
        linkedinUrl,
        error: err?.message || 'LinkedIn lookup timed out',
        profileData: { linkedin: linkedinUrl },
      };
    }
  }

  return {
    valid: true,
    available: false,
    reason: 'no_provider_configured',
    slug,
    linkedinUrl,
    profileData: { linkedin: linkedinUrl },
  };
};

export default {
  validateLinkedinUrl,
  normalizeLinkedinIdOrUrl,
  normalizeExternalLinkedinRecord,
  fetchLinkedinProfileById,
  normalizeLinkedinPayload,
  parseLinkedinExportText,
};
