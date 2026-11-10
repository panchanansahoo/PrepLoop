/**
 * Resume Fabrication Guard & Integrity Verification Engine (v6.1)
 *
 * Implements code-level verification for AI-generated resume rewrites, summaries, and tailoring:
 *  1. Negative lookbehind & lookahead metric normalization (handles $450,000 vs 450k; ignores '10 managers', '5 bullets', 'B2B', 'GA4').
 *  2. Semantic outcome family inflection & direction consistency.
 *  3. Two-tier ownership hierarchy (Strong vs Mild) with strict verb/noun disambiguation.
 *  4. Scope expansion phrase checker ('enterprise-wide', 'multi-million', etc.).
 *  5. Unsupported qualifier detector ('on schedule', 'secure', 'scalable', 'under budget').
 *  6. Entity & vocabulary validation using 20k common words list + business taxonomy (no false flags on Next.js, numbers, or sentence-initial verbs).
 *  7. Enforce Read-Only Core in code (deep-compares credential fields to prevent hallucinated degrees, certs, employers).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Metric regex with negative lookbehind & lookahead:
// - Won't match attached letters like 'B2B' or 'GA4'
// - Won't match space followed by word starting with letter (e.g. '10 managers' -> '10', not '10 m')
export const METRIC_REGEX = /(?<![A-Za-z])(?:[$€£]\s*)?\d+(?:,\d{3})*(?:\.\d+)?(?:\s?(?:%|[kmbx](?![A-Za-z])))?|\b(?:doubled|tripled|quadrupled)\b/gi;

/**
 * Normalizes metric tokens into comparable strings:
 * - '$450,000' -> '450000'
 * - '450k' -> '450000'
 * - '38 %' -> '38%'
 * - '2.5m' -> '2500000'
 */
export function normalizeMetricToken(token) {
  const str = String(token || '').toLowerCase().replace(/[\s,]/g, '').replace(/[$€£]/g, '');

  const kMatch = str.match(/^(\d+(?:\.\d+)?)k$/);
  if (kMatch) return String(Math.round(parseFloat(kMatch[1]) * 1000));

  const mMatch = str.match(/^(\d+(?:\.\d+)?)m$/);
  if (mMatch) return String(Math.round(parseFloat(mMatch[1]) * 1000000));

  const bMatch = str.match(/^(\d+(?:\.\d+)?)b$/);
  if (bMatch) return String(Math.round(parseFloat(bMatch[1]) * 1000000000));

  return str;
}

/**
 * Hyphen-preserving tokenizer for vocabulary building and text analysis
 */
export function tokenizeWords(text) {
  return String(text || '').toLowerCase().match(/\b[\w]+(?:-[\w]+)*\b/g) || [];
}

/**
 * Builds vocabulary set containing unigrams and bigrams from raw resume text
 */
export function buildResumeVocabulary(textOrJson) {
  let text = '';
  if (typeof textOrJson === 'string') {
    text = textOrJson;
  } else if (textOrJson && typeof textOrJson === 'object') {
    text = JSON.stringify(textOrJson);
  }

  const tokens = tokenizeWords(text);
  const vocab = new Set();

  for (let i = 0; i < tokens.length; i++) {
    vocab.add(tokens[i]);
    // Also add sub-parts of hyphenated words (e.g. 'cross-team' -> 'cross', 'team')
    if (tokens[i].includes('-')) {
      tokens[i].split('-').forEach(p => { if (p) vocab.add(p); });
    }
    if (i < tokens.length - 1) {
      vocab.add(`${tokens[i]} ${tokens[i + 1]}`);
    }
  }

  return vocab;
}

// Load the 20,000 common English words list
let commonWords20k = new Set();
try {
  const wordsPath = path.resolve(__dirname, '../data/commonEnglishWords20k.json');
  if (fs.existsSync(wordsPath)) {
    const raw = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));
    commonWords20k = new Set(raw.map(w => String(w).toLowerCase()));
  }
} catch {
  // Fallback to basic dictionary if file load fails
}

// Professional resume and business vocabulary extension
export const RESUME_BUSINESS_WORDS = new Set([
  'backlog', 'codebase', 'roadmap', 'sprint', 'scrum', 'agile', 'kanban',
  'refactor', 'refactored', 'refactoring', 'onboarding', 'stakeholder', 'stakeholders',
  'maintainable', 'scalable', 'modular', 'microservice', 'microservices',
  'frontend', 'backend', 'fullstack', 'relational', 'utilizing', 'cross-functional',
  'cross-team', 'pipeline', 'pipelines', 'turnaround', 'workflow', 'workflows',
  'telemetry', 'analytics', 'dashboard', 'dashboards', 'partnered', 'partnering',
  'authored', 'authoring', 'streamlined', 'streamlining', 'orchestrating',
  'benchmarked', 'benchmarking', 'automated', 'automating', 'deployed', 'deploying',
  'configured', 'configuring', 'provisioned', 'provisioning', 'monitored', 'monitoring',
  'optimized', 'optimizing', 'resolved', 'resolving', 'implemented', 'implementing',
  'developed', 'developing', 'engineered', 'engineering', 'executed', 'executing',
  'conducted', 'conducting', 'collaborated', 'collaborating', 'designed', 'designing',
  'scaled', 'scaling', 'increased', 'increasing', 'reduced', 'reducing', 'decreased',
  'cut', 'cutting', 'lowered', 'lowering', 'saved', 'saving', 'improved', 'improving',
  'enhanced', 'enhancing', 'boosted', 'boosting', 'gained', 'gaining', 'yielded',
  'expanded', 'expanding', 'managed', 'managing', 'delivered', 'delivering',
  'handled', 'handling', 'tracked', 'tracking', 'tested', 'testing', 'regression',
  'unit', 'integration', 'e2e', 'api', 'apis', 'rest', 'graphql', 'json', 'sql',
  'nosql', 'ci', 'cd', 'devops', 'cloud', 'latency', 'throughput', 'velocity',
  'cadence', 'milestone', 'milestones', 'deliverable', 'deliverables', 'retention',
  'conversion', 'engagement', 'outreach', 'campaign', 'campaigns', 'spec', 'specs',
  'specification', 'specifications', 'architecture', 'architectural', 'infrastructure',
  'compliance', 'governance', 'protocol', 'protocols', 'formatting', 'documentation',
  'participant', 'participants', 'attendee', 'attendees', 'monthly', 'quarterly',
  'annual', 'annually', 'weekly', 'daily', 'year-over-year', 'per', 'via', 'using'
]);

// Known proprietary software, tools, and platforms that must exist in candidate resume vocabulary
export const PROPRIETARY_TOOLS_AND_BRANDS = new Set([
  'lexisnexis', 'salesforce', 'snowflake', 'kubernetes', 'datadog', 'playwright',
  'jira', 'confluence', 'tableau', 'looker', 'hubspot', 'marketo', 'workday',
  'servicenow', 'splunk', 'elasticsearch', 'mongodb', 'redis', 'docker', 'terraform',
  'ansible', 'jenkins', 'github', 'gitlab', 'aws', 'azure', 'gcp', 'newrelic',
  'dynatrace', 'postman', 'figma', 'canva', 'shopify', 'stripe', 'pagerduty',
  'grafana', 'prometheus', 'kafka', 'rabbitmq', 'airflow', 'dbt', 'spark', 'hadoop'
]);

// Combined master dictionary (excluding proprietary tools so they cannot be excused as generic words)
export const MASTER_COMMON_WORDS = new Set(
  [...commonWords20k, ...RESUME_BUSINESS_WORDS].filter(w => !PROPRIETARY_TOOLS_AND_BRANDS.has(w))
);

// Scope expansion phrases that inflate project impact
export const SCOPE_EXPANSION_PHRASES = [
  'enterprise-wide', 'company-wide', 'organization-wide', 'org-wide',
  'multi-million', 'multimillion', 'entire company', 'entire organization',
  'global scale', 'across all departments', 'across the enterprise'
];

// Unsupported qualifiers that fabricate claims of timeliness, budget, or architectural quality
export const UNSUPPORTED_QUALIFIERS = [
  'on schedule', 'on time', 'under budget', 'ahead of schedule',
  'production-ready', 'fault-tolerant', 'cost-effective',
  'zero-downtime', 'seamless', 'flawless', 'secure', 'scalable',
  'high-performance', 'bulletproof'
];

// Outcome families with direction mapping
export const OUTCOME_FAMILIES = {
  INCREASE: {
    regex: /\b(?:increase[ds]?|increasing|grew|grow[ns]?|growing|boost(?:ed|ing|s)?|accelerat(?:ed|ing|es?)|expand(?:ed|ing|s)?|maximiz(?:ed|ing|es?)|scal(?:ed|ing|es?)|rais(?:ed|ing|es?)|lift(?:ed|ing|s)?|gain(?:ed|ing|es?)|generat(?:ed|ing|es?))\b/i,
    direction: 'up',
  },
  DECREASE_SAVE: {
    regex: /\b(?:reduc(?:ed|ing|es?)|decrease[ds]?|decreasing|sav(?:ed|ing|es?)|cut(?:ting|s)?|minimiz(?:ed|ing|es?)|lower(?:ed|ing|s)?|shorten(?:ed|ing|s)?|eliminat(?:ed|ing|es?))\b/i,
    direction: 'down',
  },
  QUALITY_IMPROVE: {
    regex: /\b(?:improv(?:ed|ing|es?)|enhanc(?:ed|ing|es?)|streamlin(?:ed|ing|es?)|optimiz(?:ed|ing|es?)|yield(?:ed|ing|s)?)\b/i,
    direction: 'neutral',
  },
};

/**
 * Checks if 'lead' is used strictly as a noun/title rather than an action verb
 * Applied equally to original and generated text
 */
export function isNounLead(text) {
  if (!/\blead\b/i.test(text)) return false;
  const isTitleModifier = /\blead\s+(?:developer|engineer|designer|architect|manager|analyst|specialist|consultant|technician|qa|tester|programmer)\b/i.test(text);
  const isCompoundTitle = /\b(?:team|tech|project|group|engineering|technical)\s+lead\b/i.test(text);
  return isTitleModifier || isCompoundTitle;
}

/**
 * Tests for Strong Leadership verbs (strictly action verb forms only)
 * Specifically excludes ordinary uses like 'found a bug', 'own tools', 'direct reports', 'head of'
 */
export function hasStrongLeadershipVerb(text) {
  const lower = String(text || '').toLowerCase();

  // Explicit leadership verb past forms
  if (/\b(?:led|spearheaded|architected|pioneered|orchestrated)\b/i.test(lower)) {
    // If it's 'led', make sure it's not a noun-lead like 'lead developer'
    return !isNounLead(lower);
  }

  // Active gerund forms at or near beginning
  if (/\b(?:spearheading|architecting|pioneering|orchestrating)\b/i.test(lower)) return true;

  // 'founded' / 'co-founded' (explicit past tense / verb form, NOT 'found a bug')
  if (/\b(?:co-founded|founded)\b/i.test(lower)) return true;

  // 'directed' (NOT 'direct reports' or 'direct impact')
  if (/\bdirected\b/i.test(lower) && !/\bdirect\s+(?:reports|impact|feedback)/i.test(lower)) return true;

  // 'headed' (NOT 'head of')
  if (/\bheaded\b/i.test(lower) && !/\bhead\s+of\b/i.test(lower)) return true;

  // 'owned' (NOT 'my own' or 'own tools')
  if (/\bowned\b/i.test(lower) && !/\b(?:my|our|their|his|her)\s+own\b/i.test(lower)) return true;

  // 'lead' or 'leading' as active verb
  if (/\b(?:lead|leading)\b/i.test(lower) && !isNounLead(lower)) {
    return true;
  }

  return false;
}

/**
 * Tests for Mild Execution verbs (managed, delivered, established, drove, coordinated, oversaw)
 */
export function hasMildExecutionVerb(text) {
  const lower = String(text || '').toLowerCase();
  return /\b(?:manag(?:ed|ing|es?)|deliver(?:ed|ing|s)?|establish(?:ed|ing|es?)|drov(?:e)|driv(?:ing|es?)|coordinat(?:ed|ing|es?)|overs(?:aw)|oversee(?:ing|s)?)\b/i.test(lower);
}

/**
 * Tests for Supporting verbs (assisted, helped, supported, contributed, etc.)
 */
export function hasSupportingVerb(text) {
  const lower = String(text || '').toLowerCase();
  return /\b(?:assist(?:ed|ing|s)?|help(?:ed|ing|s)?|support(?:ed|ing|s)?|contribut(?:ed|ing|es?)|participat(?:ed|ing|es?)|shadow(?:ed|ing|s)?|aid(?:ed|ing|s)?)\b/i.test(lower);
}

/**
 * Universal Code-Level Fabrication Guard (v6.1)
 */
export function verifyAISuggestion({
  originalText = '',
  entryContextText = '',
  generatedText = '',
  resumeVocabularySet = new Set(),
}) {
  const origStr = String(originalText || '').trim();
  const genStr = String(generatedText || '').trim();
  const contextStr = String(entryContextText || '').trim();

  if (!genStr) {
    return { valid: false, reason: 'Generated text is empty' };
  }

  // Identical text check: if the rewrite is identical to original, always valid
  if (origStr.toLowerCase() === genStr.toLowerCase()) {
    return { valid: true };
  }

  // 1. Strip bracketed placeholders first so placeholders cannot excuse fabricated numbers
  const placeholderRegex = /\[(?:add|specify|insert|estimate):[^\]]*\]/gi;
  const strippedGenerated = genStr.replace(placeholderRegex, '');

  // 2. Metrics & Numbers Check: must exist in originalText or same entryContext
  const origMetrics = new Set((origStr.match(METRIC_REGEX) || []).map(normalizeMetricToken));
  const entryMetrics = new Set((contextStr.match(METRIC_REGEX) || []).map(normalizeMetricToken));
  const rawGenMetrics = strippedGenerated.match(METRIC_REGEX) || [];
  const generatedMetrics = rawGenMetrics.map(normalizeMetricToken);

  // Set of raw generated metric strings to exclude from entity checking
  const genMetricTokens = new Set(rawGenMetrics.flatMap(m => tokenizeWords(m)));

  for (const metric of generatedMetrics) {
    if (!origMetrics.has(metric) && !entryMetrics.has(metric)) {
      return { valid: false, reason: `Invented or transferred metric: '${metric}'` };
    }
  }

  const origLower = origStr.toLowerCase();
  const genLower = genStr.toLowerCase();

  // 3. Scope Expansion Check (Restored & Independent of Verbs)
  for (const phrase of SCOPE_EXPANSION_PHRASES) {
    if (genLower.includes(phrase) && !origLower.includes(phrase) && !contextStr.toLowerCase().includes(phrase)) {
      return { valid: false, reason: `Unsubstantiated scope expansion: '${phrase}'` };
    }
  }

  // 4. Unsupported Qualifiers Check ('on schedule', 'under budget', 'secure', 'scalable', etc.)
  for (const qualifier of UNSUPPORTED_QUALIFIERS) {
    if (genLower.includes(qualifier) && !origLower.includes(qualifier) && !contextStr.toLowerCase().includes(qualifier)) {
      return { valid: false, reason: `Unsupported qualifier claim: '${qualifier}'` };
    }
  }

  // 5. Outcome Direction & Family Consistency Check
  let origDirection = null;
  for (const fam of Object.values(OUTCOME_FAMILIES)) {
    if (fam.regex.test(origLower)) {
      origDirection = fam.direction;
      break;
    }
  }

  for (const [name, fam] of Object.entries(OUTCOME_FAMILIES)) {
    const origHadFamily = fam.regex.test(origLower);
    const genHasFamily = fam.regex.test(genLower);

    if (!origHadFamily && genHasFamily) {
      // If original had no direction word and no metric, fail
      if (!origDirection && origMetrics.size === 0) {
        return { valid: false, reason: `Unsubstantiated outcome claim in family: '${name}'` };
      }
      // If original had an opposite direction (e.g. was 'up' / increase, but rewrite is 'down' / decrease)
      if (origDirection && fam.direction !== 'neutral' && origDirection !== fam.direction) {
        return { valid: false, reason: `Outcome direction mismatch: original was '${origDirection}', rewrite introduced '${fam.direction}'` };
      }
    }
  }

  // 6. Two-Tier Ownership Inflation Check
  const origHadStrong = hasStrongLeadershipVerb(origLower);
  const genHasStrong = hasStrongLeadershipVerb(genLower);
  if (!origHadStrong && genHasStrong) {
    return { valid: false, reason: 'Strong ownership inflation detected (upgraded to leading/architecting/spearheading)' };
  }

  const origHadSupporting = hasSupportingVerb(origLower);
  const genHasMild = hasMildExecutionVerb(genLower);
  if (origHadSupporting && !origHadStrong && genHasMild) {
    return { valid: false, reason: 'Mild ownership inflation detected (upgraded supporting role to managing/delivering)' };
  }

  // 7. Entity & Cross-Domain Vocabulary Check (Safe sentence lookbehind: /(?<=[.!?])\s+/)
  const sentences = genStr.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
  for (const sent of sentences) {
    const tokens = tokenizeWords(sent);
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      // Skip purely numeric tokens (handled by metric check)
      if (/^\d+$/.test(token)) continue;

      // Skip tokens that are part of verified metrics (e.g. '450k', '38%')
      if (genMetricTokens.has(token)) continue;

      // Skip short tokens (< 3 chars)
      if (token.length < 3) continue;

      // If word is in common English vocabulary (20k + business), pass
      if (MASTER_COMMON_WORDS.has(token)) continue;

      // If hyphenated word, check if subparts are common words
      if (token.includes('-')) {
        const parts = token.split('-');
        if (parts.every(p => !p || MASTER_COMMON_WORDS.has(p) || resumeVocabularySet.has(p))) continue;
      }

      // If word or token exists in candidate's resume vocabulary, pass
      if (resumeVocabularySet.has(token)) continue;

      // Check if it is part of a known bigram in resume vocabulary
      const nextToken = tokens[i + 1];
      if (nextToken && resumeVocabularySet.has(`${token} ${nextToken}`)) continue;
      const prevToken = tokens[i - 1];
      if (prevToken && resumeVocabularySet.has(`${prevToken} ${token}`)) continue;

      // If not in common dictionary and not in resume vocabulary, flag as invented entity
      return { valid: false, reason: `Invented entity, software, or organization: '${token}'` };
    }
  }

  return { valid: true };
}

/**
 * Deep-compares two ResumeJSON objects to ensure read-only factual core was not tampered with
 * Allowed fields to modify: summary, experience[].bullets, projects[].bullets
 */
export function enforceReadOnlyCore(originalJson = {}, modifiedJson = {}) {
  if (!originalJson || !modifiedJson) {
    return { valid: false, reason: 'Missing original or modified JSON' };
  }

  const deepEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  // 1. Contact Info must be 100% identical
  if (!deepEqual(originalJson.contact, modifiedJson.contact)) {
    return { valid: false, reason: 'Contact information must remain read-only' };
  }

  // 2. Education must be 100% identical
  if (!deepEqual(originalJson.education, modifiedJson.education)) {
    return { valid: false, reason: 'Education credentials and dates must remain read-only' };
  }

  // 3. Certifications must be 100% identical
  if (!deepEqual(originalJson.certifications, modifiedJson.certifications)) {
    return { valid: false, reason: 'Certifications must remain read-only' };
  }

  // 4. Skills must be 100% identical
  if (!deepEqual(originalJson.skills, modifiedJson.skills)) {
    return { valid: false, reason: 'Skills must remain read-only (AI cannot auto-claim skills)' };
  }

  // 5. Experience core metadata (company, title, dates, location) must be identical
  const origExp = originalJson.experience || [];
  const modExp = modifiedJson.experience || [];
  if (origExp.length !== modExp.length) {
    return { valid: false, reason: 'Experience entries count cannot be altered by AI' };
  }

  for (let i = 0; i < origExp.length; i++) {
    const o = origExp[i];
    const m = modExp[i];
    if (o.company !== m.company || o.title !== m.title || o.startDate !== m.startDate || o.endDate !== m.endDate || o.location !== m.location) {
      return { valid: false, reason: `Experience metadata for entry ${i + 1} (${o.company}) was altered` };
    }
  }

  // 6. Projects core metadata (name, role/dates/tech) must be identical
  const origProj = originalJson.projects || [];
  const modProj = modifiedJson.projects || [];
  if (origProj.length !== modProj.length) {
    return { valid: false, reason: 'Projects count cannot be altered by AI' };
  }

  for (let i = 0; i < origProj.length; i++) {
    const o = origProj[i];
    const m = modProj[i];
    if (o.name !== m.name || !deepEqual(o.tech, m.tech)) {
      return { valid: false, reason: `Project metadata for entry ${i + 1} (${o.name}) was altered` };
    }
  }

  // 7. Additional entries must be identical
  if (!deepEqual(originalJson.additional, modifiedJson.additional)) {
    return { valid: false, reason: 'Additional entries must remain read-only' };
  }

  return { valid: true };
}
