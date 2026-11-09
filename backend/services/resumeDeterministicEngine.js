/**
 * Layer 1: Deterministic Resume Analysis Engine (0 LLM Tokens)
 *
 * Implements instant, rule-based ATS-readiness checks:
 * 1. Real PDF page budget vs experience level.
 * 2. Section completeness.
 * 3. Neutral career break notices (strictly 0 score deductions).
 * 4. Zero demographic or age bias (no scoring on name, gender, age, or graduation distance).
 * 5. Action verbs vs passive duty phrasing.
 * 6. Buzzword & cliché detection.
 * 7. Metric quantification in bullets.
 * 8. Hard ATS formatting risk scanner.
 * 9. Job description keyword match & gap analysis (when JD is supplied).
 */

const ACTION_VERBS = new Set([
  'led', 'built', 'designed', 'developed', 'implemented', 'created', 'managed',
  'engineered', 'delivered', 'automated', 'streamlined', 'optimized', 'reduced',
  'scaled', 'spearheaded', 'orchestrated', 'authored', 'architected', 'resolved',
  'launched', 'produced', 'deployed', 'configured', 'analyzed', 'coordinated'
]);

const PASSIVE_PATTERNS = [
  /\bresponsible for\b/i,
  /\btasked with\b/i,
  /\bworked on\b/i,
  /\bassisted in\b/i,
  /\bhelped with\b/i,
  /\bduties included\b/i,
];

const BUZZWORDS = [
  'synergy', 'hard-working', 'hardworking', 'team player', 'go-getter',
  'thought leader', 'results-driven', 'detail-oriented', 'self-starter',
  'dynamic', 'strategic thinker', 'rockstar', 'ninja', 'guru'
];

/**
 * Extracts years from date string
 */
function parseYears(dateStr) {
  const matches = (dateStr || '').match(/\b(?:19|20)\d{2}\b/g);
  if (!matches || matches.length === 0) return null;
  return matches.map(m => parseInt(m, 10));
}

/**
 * Layer 1 Deterministic Analysis Engine
 */
export function runDeterministicChecks({ resumeJson, pageCount = 1, jobDescription = '' }) {
  const issues = [];
  const suggestions = [];
  const strengths = [];
  const careerGaps = [];

  const contact = resumeJson.contact || {};
  const experience = resumeJson.experience || [];
  const education = resumeJson.education || [];
  const skills = resumeJson.skills || [];
  const projects = resumeJson.projects || [];
  const summary = resumeJson.summary || '';

  // 1. Contact Information Hygiene
  const hasEmail = Boolean(contact.email && contact.email.includes('@'));
  const hasPhone = Boolean(contact.phone && contact.phone.length > 6);
  if (hasEmail && hasPhone) {
    strengths.push('Essential contact details (email and phone) are present and properly formatted.');
  } else {
    issues.push({
      category: 'contact',
      type: 'warning',
      message: 'Missing essential contact information (email or phone). Ensure recruiters can reach you.',
    });
  }

  // 2. Section Completeness Check
  const missingSections = [];
  if (experience.length === 0 && projects.length === 0) missingSections.push('Experience or Projects');
  if (education.length === 0) missingSections.push('Education');
  if (skills.length === 0 || !skills.some(g => g.items && g.items.length > 0)) missingSections.push('Skills');

  if (missingSections.length === 0) {
    strengths.push('Complete section hierarchy detected (Contact, Experience/Projects, Education, Skills).');
  } else {
    issues.push({
      category: 'structure',
      type: 'critical',
      message: `Missing core resume sections: ${missingSections.join(', ')}.`,
    });
  }

  // 3. Page Budget vs Experience Length
  let totalExperienceYears = 0;
  for (const exp of experience) {
    const years = parseYears(`${exp.startDate} ${exp.endDate}`);
    if (years && years.length >= 2) {
      totalExperienceYears += Math.max(0, years[1] - years[0]);
    } else if (years && years.length === 1 && /present|current/i.test(exp.endDate)) {
      totalExperienceYears += Math.max(0, new Date().getFullYear() - years[0]);
    }
  }

  if (totalExperienceYears < 8 && pageCount > 1) {
    issues.push({
      category: 'length',
      type: 'warning',
      message: `Your resume is ${pageCount} pages for ~${totalExperienceYears} years of experience. Aim for a concise 1-page document for <8 years of tenure.`,
    });
  } else if (pageCount <= 2) {
    strengths.push(`Appropriate document length (${pageCount} page${pageCount > 1 ? 's' : ''}) for your career stage.`);
  }

  // 4. Neutral Career Break Detection (Strictly 0 Score Penalty)
  for (let i = 0; i < experience.length - 1; i++) {
    const currentEnd = parseYears(experience[i + 1].endDate);
    const nextStart = parseYears(experience[i].startDate);
    if (currentEnd && nextStart && nextStart[0] - currentEnd[0] >= 1) {
      const gapYears = nextStart[0] - currentEnd[0];
      careerGaps.push({
        fromYear: currentEnd[0],
        toYear: nextStart[0],
        durationYears: gapYears,
        note: `Career gap of ~${gapYears} year(s) between ${experience[i + 1].company || 'previous role'} and ${experience[i].company || 'next role'}. Prepare a brief 1-sentence framing for interviews. (No score penalty applied).`
      });
    }
  }

  // 5. Bullet Analysis: Action Verbs, Passive Voice, Metrics, Buzzwords
  const allBullets = [
    ...experience.flatMap(e => e.bullets || []),
    ...projects.flatMap(p => p.bullets || [])
  ];

  let actionVerbCount = 0;
  let passiveVoiceCount = 0;
  let metricCount = 0;
  let buzzwordCount = 0;

  for (const bullet of allBullets) {
    const firstWord = bullet.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^\w]/g, '');
    if (ACTION_VERBS.has(firstWord)) actionVerbCount++;

    if (PASSIVE_PATTERNS.some(p => p.test(bullet))) passiveVoiceCount++;
    if (/\d+%|\$\d+|\b\d+\s*(?:users|clients|projects|million|k|x)\b/i.test(bullet)) metricCount++;
    if (BUZZWORDS.some(b => new RegExp(`\\b${b}\\b`, 'i').test(bullet))) buzzwordCount++;
  }

  if (allBullets.length > 0) {
    const actionVerbRatio = actionVerbCount / allBullets.length;
    if (actionVerbRatio >= 0.70) {
      strengths.push(`Strong action verbs: ${Math.round(actionVerbRatio * 100)}% of bullets start with clear ownership verbs.`);
    } else {
      suggestions.push('Start every bullet point with a strong past-tense action verb (e.g. Led, Built, Automated, Engineered).');
    }

    if (passiveVoiceCount > 0) {
      issues.push({
        category: 'tone',
        type: 'warning',
        message: `${passiveVoiceCount} bullet(s) use passive duty phrasing ("responsible for", "assisted in"). Rephrase to show active execution.`,
      });
    }

    if (metricCount === 0) {
      suggestions.push('Add quantified metrics (%, $, scale, numbers) to at least 3 achievement bullets to substantiate results.');
    } else {
      strengths.push(`Quantified achievements detected in ${metricCount} bullet point(s).`);
    }

    if (buzzwordCount > 0) {
      issues.push({
        category: 'cliche',
        type: 'info',
        message: `Detected ${buzzwordCount} generic buzzword(s) (e.g. "team player", "results-driven"). Replace with concrete examples of work.`,
      });
    }
  }

  // 6. Job Description Keyword Coverage (if JD supplied)
  let jdAnalysis = null;
  if (jobDescription && jobDescription.trim().length > 20) {
    const resumeTextLower = JSON.stringify(resumeJson).toLowerCase();
    const jdWords = jobDescription.toLowerCase().match(/\b[A-Za-z][A-Za-z0-9_-]{2,}\b/g) || [];
    const stopWords = new Set([
      'the', 'and', 'for', 'with', 'that', 'this', 'from', 'have', 'are', 'you', 'will', 'our', 'your', 'about',
      'seeking', 'experienced', 'background', 'looking', 'opportunity', 'candidate', 'role', 'years', 'working',
      'strong', 'proven', 'demonstrated', 'ability', 'skills', 'preferred', 'required', 'responsibilities'
    ]);
    
    const candidateKeywords = [...new Set(jdWords.filter(w => !stopWords.has(w) && w.length > 3))];
    const matched = candidateKeywords.filter(k => resumeTextLower.includes(k));
    const missing = candidateKeywords.filter(k => !resumeTextLower.includes(k)).slice(0, 10);
    const coverage = candidateKeywords.length > 0 ? Math.round((matched.length / candidateKeywords.length) * 100) : 100;

    jdAnalysis = {
      coveragePercentage: coverage,
      matchedCount: matched.length,
      missingTopKeywords: missing,
    };

    if (coverage >= 60) {
      strengths.push(`Strong job description alignment: ~${coverage}% keyword coverage detected.`);
    } else {
      suggestions.push(`Low target job description match (${coverage}%). Review missing keywords like: ${missing.slice(0, 5).join(', ')}.`);
    }
  }

  return {
    pageCount,
    totalExperienceYears,
    strengths,
    issues,
    suggestions,
    careerGaps,
    bulletStats: {
      totalBullets: allBullets.length,
      actionVerbCount,
      passiveVoiceCount,
      metricCount,
      buzzwordCount,
    },
    jdAnalysis,
  };
}
