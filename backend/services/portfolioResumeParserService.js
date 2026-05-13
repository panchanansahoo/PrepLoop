const SECTION_HEADERS = {
  experience: /(?:^|\n)\s*(experience|work experience|professional experience)\s*(?:\n|$)/i,
  education: /(?:^|\n)\s*(education|academic background)\s*(?:\n|$)/i,
  skills: /(?:^|\n)\s*(skills|technical skills|tech stack)\s*(?:\n|$)/i,
};

const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_REGEX = /(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{3,4}[\s-]?\d{3,4}/g;

const trimLine = (line) => String(line || '').trim();

const getSectionText = (sourceText, sectionKey) => {
  const keys = Object.keys(SECTION_HEADERS);
  const currentPattern = SECTION_HEADERS[sectionKey];
  const currentMatch = sourceText.match(currentPattern);
  if (!currentMatch || currentMatch.index == null) return '';

  const start = currentMatch.index + currentMatch[0].length;
  let end = sourceText.length;

  for (const key of keys) {
    if (key === sectionKey) continue;
    const pattern = SECTION_HEADERS[key];
    const maybeMatch = sourceText.slice(start).match(pattern);
    if (maybeMatch && maybeMatch.index != null) {
      end = Math.min(end, start + maybeMatch.index);
    }
  }

  return sourceText.slice(start, end).trim();
};

const parseSkills = (text) => {
  if (!text) return { languages: [], frameworks: [], tools: [], domains: [] };

  const tokens = text
    .split(/[\n,|/]+/)
    .map((entry) => entry.replace(/^[-*•]\s*/, '').trim())
    .filter(Boolean);

  return {
    languages: tokens.slice(0, 10),
    frameworks: [],
    tools: [],
    domains: [],
  };
};

const parseExperience = (text) => {
  if (!text) return [];

  const lines = text
    .split('\n')
    .map(trimLine)
    .filter(Boolean);

  const result = [];
  for (let i = 0; i < lines.length; i += 2) {
    const roleLine = lines[i];
    const detailsLine = lines[i + 1] || '';
    const [rolePart, companyPart] = roleLine.split(/\sat\s/i);

    if (!rolePart) continue;

    result.push({
      role: rolePart.trim(),
      company: companyPart ? companyPart.trim() : 'Unknown',
      startDate: null,
      endDate: null,
      achievements: detailsLine ? [detailsLine] : [],
      source: 'resume',
    });
  }

  return result;
};

const parseEducation = (text) => {
  if (!text) return [];

  return text
    .split('\n')
    .map(trimLine)
    .filter(Boolean)
    .slice(0, 4)
    .map((line) => ({
      institute: line,
      degree: null,
      year: null,
      source: 'resume',
    }));
};

const parseBasicInfo = (resumeText) => {
  const lines = String(resumeText || '')
    .split('\n')
    .map(trimLine)
    .filter(Boolean);

  const fullName = lines[0] || null;
  const emailMatch = String(resumeText || '').match(EMAIL_REGEX);
  const phoneMatch = String(resumeText || '').match(PHONE_REGEX);

  return {
    fullName,
    title: lines[1] || null,
    email: emailMatch ? emailMatch[0] : null,
    phone: phoneMatch ? phoneMatch[0] : null,
    location: null,
    summary: lines.slice(2, 5).join(' ').slice(0, 280) || null,
    website: null,
  };
};

export const parseResumeToProfile = ({ text = '', uploadedFile = null } = {}) => {
  const safeText = String(text || '').trim();

  if (!safeText) {
    return {
      basicInfo: {},
      skills: { languages: [], frameworks: [], tools: [], domains: [] },
      experience: [],
      education: [],
      achievements: [],
      uploadedFile,
      parsedAt: new Date().toISOString(),
      confidenceScore: 0,
    };
  }

  const experienceText = getSectionText(safeText, 'experience');
  const educationText = getSectionText(safeText, 'education');
  const skillsText = getSectionText(safeText, 'skills');

  const parsed = {
    basicInfo: parseBasicInfo(safeText),
    skills: parseSkills(skillsText),
    experience: parseExperience(experienceText),
    education: parseEducation(educationText),
    achievements: [],
    uploadedFile,
    parsedAt: new Date().toISOString(),
    confidenceScore: 0.6,
  };

  const confidenceSignals = [
    parsed.basicInfo.fullName,
    parsed.basicInfo.email,
    parsed.experience.length > 0,
    parsed.education.length > 0,
    parsed.skills.languages.length > 0,
  ].filter(Boolean).length;

  parsed.confidenceScore = Number((confidenceSignals / 5).toFixed(2));
  return parsed;
};

export default {
  parseResumeToProfile,
};
