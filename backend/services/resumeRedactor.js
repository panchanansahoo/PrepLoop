/**
 * Server-Side Resume PII Extractor & Redactor
 *
 * Implements best-effort redaction before dispatching text to external AI services:
 * 1. Extracts emails, phone numbers, and web/LinkedIn links into an in-memory map.
 * 2. Detects candidate names even when the name is NOT on the first line
 *    (e.g. preceded by 'CURRICULUM VITAE', header banners, or phone numbers).
 * 3. Restores personal details deterministically in code into the canonical ResumeJSON.
 */

const HAS_EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
const HAS_PHONE_REGEX = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/;
const HAS_URL_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:linkedin\.com\/in\/[\w-]+|github\.com\/[\w-]+|[a-zA-Z0-9-]+\.(?:com|org|dev|me|io|net)(?:\/[^\s,]*)?)/i;

const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const PHONE_REGEX = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
const URL_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:linkedin\.com\/in\/[\w-]+|github\.com\/[\w-]+|[a-zA-Z0-9-]+\.(?:com|org|dev|me|io|net)(?:\/[^\s,]*)?)/gi;

const HEADER_IGNORE_PATTERNS = [
  /^curriculum\s+vitae$/i,
  /^resume$/i,
  /^cv$/i,
  /^personal\s+profile$/i,
  /^contact\s+information$/i,
  /^page\s+\d+/i,
  /^confidential$/i,
  /^(?:work\s+experience|professional\s+experience|experience|employment\s+history|career\s+history)$/i,
  /^(?:academic\s+background|education|qualifications|academic\s+qualifications)$/i,
  /^(?:technical\s+skills|core\s+competencies|core\s+skills|skills|areas\s+of\s+expertise|expertise|toolkit)$/i,
  /^(?:professional\s+summary|executive\s+summary|summary|profile|about\s+me|objective)$/i,
  /^(?:certifications|licenses|projects|publications|awards|honors)$/i,
];

/**
 * Checks if a candidate token/phrase is name-like (2 to 4 capitalized words)
 */
function isNameLikePhrase(phrase) {
  if (!phrase || phrase.length > 50) return false;
  // Strip trailing professional credentials (e.g. ", CPA", ", RN, BSN", ", Esq.", ", Ph.D.")
  const clean = phrase.replace(/,\s*(?:CPA|RN|BSN|MD|PHD|ESQ|PE|PMP|MBA|MS|BS|BA|MA|DO|[A-Z]{2,4})(?:,\s*[A-Z]{2,4})*$/i, '').trim();
  const words = clean.split(/\s+/);
  if (words.length < 2 || words.length > 4) return false;
  return words.every(w => /^[A-Z][a-zA-Z.'-]*$/.test(w));
}

/**
 * Heuristic name extractor from top of resume text (scans top 10 lines)
 */
export function extractCandidateName(rawText) {
  const lines = String(rawText || '')
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);

  for (const line of lines.slice(0, 10)) {
    // Skip obvious header words and known section titles
    if (HEADER_IGNORE_PATTERNS.some(pat => pat.test(line))) continue;

    // Check if line is a compound header with delimiters (e.g. "Jason Tyler | jason@email.com | 555-1234")
    if (line.includes('|') || line.includes('•')) {
      const firstPart = line.split(/[|•]/)[0].trim();
      if (isNameLikePhrase(firstPart)) {
        return firstPart;
      }
      continue;
    }

    // Skip lines with emails, phone numbers, or URLs
    if (HAS_EMAIL_REGEX.test(line) || HAS_PHONE_REGEX.test(line) || HAS_URL_REGEX.test(line)) continue;

    // Skip lines that look like addresses or locations ('New York, NY 10001')
    if (/\b\d+\s+.*?\b(?:street|st\.|ave|avenue|road|rd\.|blvd|lane|drive|way|court|ct\.|apt|suite|box)\b/i.test(line)) continue;
    if (/\b(?:apt|suite|box|p\.o\.\s*box|zip\s*code)\b/i.test(line)) continue;
    if (/\b[A-Z]{2}\s+\d{5}\b/.test(line)) continue;

    // Check if line itself matches candidate name pattern
    if (isNameLikePhrase(line)) {
      return line;
    }
  }

  return '';
}

/**
 * Redacts PII from resume text before external LLM dispatch
 */
export function redactResumeText(rawText) {
  let text = String(rawText || '');
  const piiMap = {
    name: '',
    emails: [],
    phones: [],
    links: [],
  };

  // 1. Extract and Redact Name
  const detectedName = extractCandidateName(text);
  if (detectedName) {
    piiMap.name = detectedName;
    // Replace all occurrences of detected name with [CANDIDATE_NAME]
    const escapedName = detectedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    text = text.replace(new RegExp(`\\b${escapedName}\\b`, 'g'), '[CANDIDATE_NAME]');
  }

  // 2. Extract and Redact Emails
  text = text.replace(EMAIL_REGEX, (match) => {
    piiMap.emails.push(match);
    return `[REDACTED_EMAIL_${piiMap.emails.length}]`;
  });

  // 3. Extract and Redact Phones
  text = text.replace(PHONE_REGEX, (match) => {
    // Skip if it looks like a year range ('2020-2024')
    if (/^\d{4}[-–]\d{4}$/.test(match.trim())) return match;
    piiMap.phones.push(match);
    return `[REDACTED_PHONE_${piiMap.phones.length}]`;
  });

  // 4. Extract and Redact URLs & Profiles
  text = text.replace(URL_REGEX, (match) => {
    piiMap.links.push(match);
    return `[REDACTED_LINK_${piiMap.links.length}]`;
  });

  return {
    redactedText: text,
    piiMap,
  };
}

/**
 * Restores redacted contact details back into canonical ResumeJSON
 */
export function rehydrateResumeJson(resumeJson, piiMap) {
  if (!resumeJson || typeof resumeJson !== 'object') return resumeJson;

  const copy = JSON.parse(JSON.stringify(resumeJson));
  copy.contact = copy.contact || {};

  // Restore name if empty or placeholder
  if (piiMap.name && (!copy.contact.fullName || copy.contact.fullName === '[CANDIDATE_NAME]')) {
    copy.contact.fullName = piiMap.name;
  }

  // Restore primary email
  if (piiMap.emails && piiMap.emails.length > 0) {
    if (!copy.contact.email || copy.contact.email.includes('[REDACTED_EMAIL')) {
      copy.contact.email = piiMap.emails[0];
    }
  }

  // Restore primary phone
  if (piiMap.phones && piiMap.phones.length > 0) {
    if (!copy.contact.phone || copy.contact.phone.includes('[REDACTED_PHONE')) {
      copy.contact.phone = piiMap.phones[0];
    }
  }

  // Restore links (identify LinkedIn, GitHub, portfolio)
  if (piiMap.links && piiMap.links.length > 0) {
    for (const link of piiMap.links) {
      if (/linkedin\.com/i.test(link) && !copy.contact.linkedin) {
        copy.contact.linkedin = link;
      } else if (/github\.com/i.test(link) && !copy.contact.github) {
        copy.contact.github = link;
      } else if (!copy.contact.portfolio && !/linkedin|github/i.test(link)) {
        copy.contact.portfolio = link;
      }
    }
  }

  return copy;
}

/**
 * Scrub candidate PII (emails, phone numbers, URLs, SSN/card patterns)
 * from conversation transcripts before persistence or external dispatch.
 */
export function redactTranscriptText(rawText) {
  if (!rawText || typeof rawText !== 'string') return rawText;
  let text = rawText;
  text = text.replace(EMAIL_REGEX, '[REDACTED_EMAIL]');
  text = text.replace(PHONE_REGEX, (match) => {
    if (/^\d{4}[-–]\d{4}$/.test(match.trim())) return match;
    return '[REDACTED_PHONE]';
  });
  text = text.replace(URL_REGEX, '[REDACTED_LINK]');
  text = text.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[REDACTED_SSN]');
  text = text.replace(/\b(?:\d{4}[ -]?){3}\d{4}\b/g, '[REDACTED_CARD]');
  return text;
}

/**
 * Scrub candidate PII from an array of turn objects.
 */
export function redactTranscriptTurns(transcript) {
  if (!Array.isArray(transcript)) return transcript;
  return transcript.map(turn => {
    if (!turn || typeof turn !== 'object') return turn;
    return {
      ...turn,
      text: typeof turn.text === 'string' ? redactTranscriptText(turn.text) : turn.text,
      userAnswer: typeof turn.userAnswer === 'string' ? redactTranscriptText(turn.userAnswer) : turn.userAnswer,
      candidateResponse: typeof turn.candidateResponse === 'string' ? redactTranscriptText(turn.candidateResponse) : turn.candidateResponse,
    };
  });
}

