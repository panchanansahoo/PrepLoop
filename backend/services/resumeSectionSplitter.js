/**
 * Heuristic Local Resume Section Splitter (Zero-Cost Ingestion Path)
 *
 * Parses standard, well-structured resumes into canonical ResumeJSON using local regex heuristics:
 *  - Spends 0 LLM tokens when confidence >= 0.80
 *  - Detects standard section boundaries, date formats, and bullet delimiters
 *  - Flags low-confidence parses so system can fall back to Gemini Flash-Lite or prompt user review
 */

const SECTION_HEADERS = [
  { key: 'summary', regex: /^(?:(?:professional|executive|career)?\s*summary|profile|about\s+me|objective)\b/i },
  { key: 'experience', regex: /^(?:(?:work|professional|career|relevant|research)?\s*experience|employment\s+history|career\s+history)\b/i },
  { key: 'education', regex: /^(?:education|academic\s+(?:background|qualifications)|degrees)\b/i },
  { key: 'skills', regex: /^(?:(?:technical|core|key|design|executive|professional|areas\s+of)?\s*(?:skills|competencies|expertise|proficiencies|toolkit)|skills\s*(?:&|and)\s*(?:tools|proficiencies))\b/i },
  { key: 'projects', regex: /^(?:(?:key|selected|technical|academic)?\s*projects)\b/i },
  { key: 'certifications', regex: /^(?:(?:licenses\s*(?:&|and)\s*)?certifications|certifications\s*(?:&|and)\s*licenses|certificates|licenses)\b/i },
  { key: 'additional', regex: /^(?:awards|honors|volunteering|publications|leadership|extracurricular)\b/i },
];

const DATE_RANGE_REGEX = /(?:\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+)?\b(?:19|20)\d{2}(?:-\d{2})?\b(?:\s*[-–—to]+\s*(?:(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+)?\b(?:19|20)\d{2}(?:-\d{2})?\b|present|current))?/i;
const BULLET_START_REGEX = /^[•\-*▪▸►–\u2022\u2023\u25E6\u2043\u2219]\s*/;

/**
 * Splits plain resume text into identified section text blocks
 */
export function splitIntoSections(rawText) {
  const lines = String(rawText || '').split('\n').map(l => l.trim());
  const sections = {};
  let currentSection = 'header';
  sections[currentSection] = [];

  for (const line of lines) {
    if (!line) continue;

    // Check if line is a section heading
    let matchedKey = null;
    if (line.length < 40 && !line.includes('.') && !BULLET_START_REGEX.test(line)) {
      for (const h of SECTION_HEADERS) {
        if (h.regex.test(line.replace(/[:\-#_]/g, '').trim())) {
          matchedKey = h.key;
          break;
        }
      }
    }

    if (matchedKey) {
      currentSection = matchedKey;
      if (!sections[currentSection]) sections[currentSection] = [];
    } else {
      sections[currentSection].push(line);
    }
  }

  return sections;
}

/**
 * Parses raw text lines of an experience block into structured role objects
 */
function parseExperienceLines(lines = []) {
  const entries = [];
  let currentEntry = null;

  for (const line of lines) {
    const isBullet = BULLET_START_REGEX.test(line);
    const dateMatch = line.match(DATE_RANGE_REGEX);

    // If line has date range and looks like a title/company header line
    if (dateMatch && !isBullet && line.length < 100) {
      if (currentEntry) entries.push(currentEntry);

      const dateStr = dateMatch[0];
      const withoutDate = line.replace(dateStr, '').replace(/[-–|]/g, ' ').trim();
      const parts = withoutDate.split(/\s{2,}|\bat\b|[|,]\s+/i).map(p => p.trim()).filter(Boolean);

      currentEntry = {
        title: parts[0] || 'Role',
        company: parts[1] || '',
        startDate: dateStr.split(/[-–—to]+/i)[0]?.trim() || '',
        endDate: dateStr.split(/[-–—to]+/i)[1]?.trim() || 'Present',
        location: '',
        current: /present|current/i.test(dateStr),
        bullets: [],
      };
    } else if (isBullet && currentEntry) {
      currentEntry.bullets.push(line.replace(BULLET_START_REGEX, '').trim());
    } else if (currentEntry) {
      // Continuation line or bullet without marker
      if (currentEntry.bullets.length > 0 && line.length > 20) {
        currentEntry.bullets.push(line);
      } else if (!currentEntry.company && line.length < 60) {
        currentEntry.company = line;
      }
    }
  }

  if (currentEntry) entries.push(currentEntry);
  return entries;
}

/**
 * Parses raw text lines of an education block into structured education objects
 */
function parseEducationLines(lines = []) {
  const entries = [];
  let current = null;

  for (const line of lines) {
    if (!line) continue;
    const dateMatch = line.match(DATE_RANGE_REGEX);
    const isDegree = /\b(?:bachelor|master|phd|b\.s|m\.s|b\.a|m\.a|associate|btech|mtech|diploma|degree)\b/i.test(line);
    const isUniversity = /\b(?:university|college|institute|school|academy)\b/i.test(line);

    // If current entry already has institution and this line is degree, attach it
    if (current && isDegree && !current.degree) {
      current.degree = line;
      if (dateMatch && !current.graduationDate) current.graduationDate = dateMatch[0];
      continue;
    }

    // If current entry already has degree and this line is institution, attach it
    if (current && isUniversity && !current.institution) {
      current.institution = line;
      if (dateMatch && !current.graduationDate) current.graduationDate = dateMatch[0];
      continue;
    }

    // Start a new education entry if line has university, degree, or date
    if (isDegree || isUniversity || dateMatch) {
      if (current) entries.push(current);
      current = {
        degree: isDegree ? line : '',
        institution: isUniversity ? line : '',
        graduationDate: dateMatch ? dateMatch[0] : '',
        location: '',
        highlights: [],
      };
    } else if (current && line.length > 5) {
      current.highlights.push(line);
    }
  }

  if (current) entries.push(current);
  return entries;
}

/**
 * Parses raw skills section into structured [{ group, items[] }]
 */
function parseSkillsLines(lines = []) {
  const groups = [];
  for (const line of lines) {
    if (!line) continue;
    // Check if line has a category prefix, e.g. "Languages: Python, JavaScript"
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0 && colonIdx < 30) {
      const groupName = line.slice(0, colonIdx).trim();
      const items = line.slice(colonIdx + 1).split(/[•,;|/]/).map(s => s.trim()).filter(Boolean);
      if (items.length > 0) groups.push({ group: groupName, items });
    } else {
      const items = line.split(/[•,;|/]/).map(s => s.trim()).filter(Boolean);
      if (items.length > 0) {
        groups.push({ group: groups.length === 0 ? 'Technical Skills' : 'Tools & Platforms', items });
      }
    }
  }
  return groups.length > 0 ? groups : [{ group: 'Core Skills', items: [] }];
}

/**
 * Parses raw text lines of a projects block into structured project objects
 */
function parseProjectsLines(lines = []) {
  const entries = [];
  let currentEntry = null;

  for (const line of lines) {
    if (!line) continue;
    const isBullet = BULLET_START_REGEX.test(line);
    const dateMatch = line.match(DATE_RANGE_REGEX);

    if (dateMatch && !isBullet && line.length < 100) {
      if (currentEntry) entries.push(currentEntry);
      const dateStr = dateMatch[0];
      const withoutDate = line.replace(dateStr, '').replace(/[-–|]/g, ' ').trim();
      currentEntry = {
        name: withoutDate || 'Project',
        role: '',
        tech: [],
        link: '',
        dates: dateStr,
        bullets: [],
      };
    } else if (isBullet && currentEntry) {
      currentEntry.bullets.push(line.replace(BULLET_START_REGEX, '').trim());
    } else if (currentEntry) {
      if (currentEntry.bullets.length > 0 && line.length > 20) {
        currentEntry.bullets.push(line);
      }
    } else if (!isBullet && line.length > 3 && line.length < 80) {
      if (currentEntry) entries.push(currentEntry);
      currentEntry = {
        name: line,
        role: '',
        tech: [],
        link: '',
        dates: '',
        bullets: [],
      };
    }
  }

  if (currentEntry) entries.push(currentEntry);
  return entries;
}

/**
 * Parses raw text lines of certifications block into structured certification objects
 */
function parseCertificationsLines(lines = []) {
  const certs = [];
  for (const line of lines) {
    if (!line) continue;
    const clean = line.replace(BULLET_START_REGEX, '').trim();
    if (clean.length > 3) {
      const parts = clean.split(/[-–|]/).map(p => p.trim());
      certs.push({
        name: parts[0] || clean,
        issuer: parts[1] || '',
        date: clean.match(DATE_RANGE_REGEX)?.[0] || '',
      });
    }
  }
  return certs;
}

/**
 * Computes heuristic parse confidence (0.0 to 1.0)
 */
export function calculateParseConfidence(sections, parsed) {
  let score = 0;

  // Work experience or projects (crucial for students/freshers)
  const hasExp = Boolean(sections.experience && sections.experience.length > 0);
  const hasProjects = Boolean(sections.projects && sections.projects.length > 0);

  if (hasExp) {
    score += 0.35;
    if (hasProjects) score += 0.05; // Bonus for having both
  } else if (hasProjects) {
    score += 0.35; // Projects substitute for experience for fresh graduates
  }

  if (sections.education && sections.education.length > 0) score += 0.25;
  if (sections.skills && sections.skills.length > 0) score += 0.20;
  if (sections.summary && sections.summary.length > 0) score += 0.10;
  if (sections.certifications && sections.certifications.length > 0) score += 0.05;

  // Verify that experience or projects entries have actual bullets
  if (hasExp && parsed.experience && parsed.experience.length > 0) {
    const hasBullets = parsed.experience.some(e => e.bullets && e.bullets.length > 0);
    if (!hasBullets) score -= 0.15;
  } else if (hasProjects && parsed.projects && parsed.projects.length > 0) {
    const hasBullets = parsed.projects.some(p => p.bullets && p.bullets.length > 0);
    if (!hasBullets) score -= 0.15;
  }

  return Math.max(0, Math.min(1.0, Math.round(score * 100) / 100));
}

/**
 * Main Heuristic Section Splitter Entrypoint
 */
export function parseResumeHeuristic(rawText) {
  const sections = splitIntoSections(rawText);

  const experience = parseExperienceLines(sections.experience || []);
  const education = parseEducationLines(sections.education || []);
  const skills = parseSkillsLines(sections.skills || []);
  const projects = parseProjectsLines(sections.projects || []);
  const certifications = parseCertificationsLines(sections.certifications || []);

  const parsedJson = {
    title: 'Parsed Resume',
    summary: (sections.summary || []).join(' ').trim(),
    contact: {
      fullName: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      portfolio: '',
      github: '',
    },
    skills,
    experience,
    education,
    projects,
    certifications,
    additional: [],
  };

  const confidence = calculateParseConfidence(sections, parsedJson);

  return {
    success: confidence >= 0.80,
    confidence: Math.round(confidence * 100) / 100,
    data: parsedJson,
    sectionsDetected: Object.keys(sections).filter(k => k !== 'header'),
    tokensUsed: 0,
    source: confidence >= 0.80 ? 'heuristic' : 'llm_fallback_needed',
  };
}
