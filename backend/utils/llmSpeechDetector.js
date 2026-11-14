/**
 * llmSpeechDetector.js — Proctoring 2.0 AI-Generated Speech & Teleprompter Detection.
 *
 * Detects patterns indicative of candidates reading AI-generated answers or teleprompters:
 * 1. Canned robotic formulas ("Certainly! In order to...", "It is worth noting that...", "Delving into...")
 * 2. Unnatural syntactic uniformity / low burstiness / perplexity shifts
 * 3. Teleprompter reading cadence vs natural human conversational pauses & disfluencies
 */

export const CANNED_AI_PATTERNS = [
  // Robotic affirmations & introductory boilerplate
  {
    category: 'affirmation',
    pattern: /\b(?:certainly|absolutely|sure thing)[\s,!]+(?:in order to|let'?s|i (?:can|would be happy to)|here (?:is|are)|allow me to)\b/i,
    weight: 0.9,
    label: "Canned AI opening affirmation ('Certainly! In order to...')",
  },
  {
    category: 'boilerplate_intro',
    pattern: /\b(in order to (?:properly|effectively|successfully|comprehensively)|first and foremost,?\s*it is (?:important|crucial|essential) to)\b/i,
    weight: 0.85,
    label: "Canned AI signposting ('First and foremost, it is important to...')",
  },
  {
    category: 'ai_disclaimer',
    pattern: /\b(as an ai|as a large language model|my knowledge cutoff|i don't have personal experience|based on my training data)\b/i,
    weight: 1.0,
    label: "Explicit LLM persona leakage",
  },
  {
    category: 'cliche_vocabulary',
    pattern: /\b(delving into|delve into|testament to|tapestry of|beacon of|multifaceted approach|pivotal role in ensuring|it'?s worth noting that|it is worth noting that|it is crucial to understand)\b/i,
    weight: 0.75,
    label: "Characteristic LLM filler vocabulary",
  },
  {
    category: 'formulaic_conclusion',
    pattern: /\b(in summary,?\s*(?:by doing so|it is evident|we can see)|to summarize,?\s*in conclusion|by doing so,?\s*we ensure that)\b/i,
    weight: 0.8,
    label: "Rigid formulaic AI conclusion ('By doing so, we ensure that...')",
  },
  {
    category: 'formulaic_enumeration',
    pattern: /\b(firstly,?\s*.{10,80}secondly,?\s*.{10,80}thirdly,?\s*.{10,80}(?:finally|in conclusion))\b/is,
    weight: 0.85,
    label: "Rigid three-tier essay enumeration ('Firstly... Secondly... Thirdly... In conclusion...')",
  },
];

export const CONVERSATIONAL_DISFLUENCIES = [
  /\b(um|uh|erm|ah)\b/i,
  /\b(like,?\s*(?:you know|i mean|basically))\b/i,
  /\b(you know|i mean|sort of|kind of|let'?s see|well,?\s*honestly)\b/i,
  /\b(wait,?\s*(?:no|actually)|what i meant was|how should i put it)\b/i,
];

/**
 * Scans text for canned robotic LLM phrases and formulas.
 * @param {string} text
 * @returns {{ detected: boolean, matches: string[], score: number, categoryBreakdown: Object }}
 */
export function detectCannedPhrases(text) {
  if (!text || typeof text !== 'string') {
    return { detected: false, matches: [], score: 0, categoryBreakdown: {} };
  }

  const clean = text.trim();
  const matches = [];
  const categoryBreakdown = {};
  let totalWeight = 0;

  for (const item of CANNED_AI_PATTERNS) {
    const match = clean.match(item.pattern);
    if (match) {
      matches.push(item.label);
      categoryBreakdown[item.category] = (categoryBreakdown[item.category] || 0) + 1;
      totalWeight += item.weight;
    }
  }

  // Check for colon-heading reading patterns: e.g. "Concept One: explanation. Concept Two: explanation."
  const colonHeadings = clean.match(/\b[A-Z][a-zA-Z\s]{3,25}:\s+[A-Z]/g);
  if (colonHeadings && colonHeadings.length >= 2) {
    matches.push("Bullet-heading syntax read verbatim ('Topic: Description')");
    totalWeight += 0.7;
  }

  const score = Math.min(1.0, Number((totalWeight / 1.5).toFixed(2)));
  return {
    detected: matches.length > 0,
    matches,
    score,
    categoryBreakdown,
  };
}

/**
 * Evaluates syntactic burstiness and sentence length uniformity.
 *
 * Human conversational speech has high burstiness (intermingled short fragments,
 * hesitations, and long clauses). LLM answers exhibit uniform sentence lengths
 * with low standard deviation and high lexical symmetry (low burstiness).
 *
 * @param {string} text
 * @returns {{ score: number, burstinessCV: number, sentenceCount: number, meanSentenceLength: number, isUnnaturallyUniform: boolean }}
 */
export function analyzeBurstinessAndPerplexity(text) {
  if (!text || typeof text !== 'string') {
    return { score: 0, burstinessCV: 0, sentenceCount: 0, meanSentenceLength: 0, isUnnaturallyUniform: false };
  }

  const rawSentences = text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (rawSentences.length < 2) {
    return { score: 0, burstinessCV: 0.5, sentenceCount: rawSentences.length, meanSentenceLength: text.split(/\s+/).length, isUnnaturallyUniform: false };
  }

  const sentenceLengths = rawSentences.map((s) => s.split(/\s+/).filter(Boolean).length);
  const mean = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;

  // Standard deviation
  const variance = sentenceLengths.reduce((sum, len) => sum + Math.pow(len - mean, 2), 0) / sentenceLengths.length;
  const stdDev = Math.sqrt(variance);

  // Coefficient of Variation: CV = stdDev / mean
  const cv = mean > 0 ? stdDev / mean : 0.5;

  // If candidate speaks 3+ sentences of substantial length (>10 words each) with CV < 0.22,
  // this is characteristic of reading written AI prose.
  const isUnnaturallyUniform = rawSentences.length >= 3 && mean >= 12 && cv < 0.24;

  let score = 0;
  if (isUnnaturallyUniform) {
    score = Math.min(0.9, Number(((0.25 - cv) * 3 + 0.4).toFixed(2)));
  } else if (rawSentences.length >= 2 && cv < 0.3) {
    score = 0.3;
  }

  return {
    score,
    burstinessCV: Number(cv.toFixed(3)),
    sentenceCount: rawSentences.length,
    meanSentenceLength: Number(mean.toFixed(1)),
    isUnnaturallyUniform,
  };
}

/**
 * Detects teleprompter reading cadence vs natural conversational speech.
 *
 * Indicators:
 * - Constant words-per-minute (140 - 175 WPM)
 * - Complete absence of natural conversational disfluencies in a long answer (>50 words)
 * - Strict written-prose punctuation without cognitive pauses
 * - Monotonous pause distribution (if timing timestamps are provided)
 *
 * @param {string|Object} textOrInput
 * @param {Object} options
 * @returns {{ detected: boolean, score: number, metrics: Object, reasons: string[] }}
 */
export function detectTeleprompterCadence(textOrInput, options = {}) {
  const text = typeof textOrInput === 'string'
    ? textOrInput
    : (textOrInput?.text || textOrInput?.transcript || '');

  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const reasons = [];

  if (wordCount < 25) {
    return { detected: false, score: 0, metrics: { wordCount, disfluencyCount: 0 }, reasons: [] };
  }

  // 1. Check for conversational disfluencies
  let disfluencyCount = 0;
  for (const regex of CONVERSATIONAL_DISFLUENCIES) {
    const m = text.match(regex);
    if (m) disfluencyCount += m.length;
  }

  // In a long technical answer (>60 words), natural speakers almost always exhibit at least 1-2 disfluencies or hesitations
  const disfluencyRatio = disfluencyCount / (wordCount / 50);
  const isSterileCadence = wordCount >= 60 && disfluencyCount === 0;

  if (isSterileCadence) {
    reasons.push(`Zero conversational hesitations or disfluencies across ${wordCount} words (monotonous teleprompter delivery)`);
  }

  // 2. Timing metadata evaluation (if available from speech-to-text audio timestamps)
  const timing = options.audioMetadata || options.timestamps || textOrInput?.audioMetadata || null;
  let timingScore = 0;

  if (timing) {
    const durationSec = Number(timing.durationSeconds || timing.duration || 0);
    if (durationSec > 0) {
      const wpm = (wordCount / durationSec) * 60;
      // Typical fluent script-reading pace is 150-180 WPM without pause
      if (wpm >= 145 && wpm <= 185) {
        timingScore += 0.3;
        reasons.push(`Rapid constant reading speed of ${Math.round(wpm)} WPM`);
      }
    }

    if (Array.isArray(timing.pauseDurations) && timing.pauseDurations.length >= 3) {
      const pauses = timing.pauseDurations;
      const pauseMean = pauses.reduce((a, b) => a + b, 0) / pauses.length;
      const pauseVar = pauses.reduce((sum, p) => sum + Math.pow(p - pauseMean, 2), 0) / pauses.length;
      const pauseCv = Math.sqrt(pauseVar) / (pauseMean || 1);

      // Natural cognitive pauses have high variance; teleprompter reading breath pauses are strictly uniform
      if (pauseCv < 0.2) {
        timingScore += 0.4;
        reasons.push('Unnaturally uniform pause intervals (consistent breath pauses without thinking time)');
      }
    }
  }

  const baseScore = isSterileCadence ? 0.45 : (disfluencyRatio < 0.2 ? 0.2 : 0);
  const totalScore = Math.min(1.0, Number((baseScore + timingScore).toFixed(2)));

  return {
    detected: totalScore >= 0.45,
    score: totalScore,
    metrics: {
      wordCount,
      disfluencyCount,
      disfluencyRatio: Number(disfluencyRatio.toFixed(2)),
      timingScore,
    },
    reasons,
  };
}

/**
 * Primary AI-Generated Speech & Proctoring 2.0 Teleprompter Detector.
 *
 * Aggregates:
 * - Canned robotic patterns
 * - Syntactic burstiness / perplexity uniformity
 * - Teleprompter reading cadence
 *
 * @param {string|Object} input - Candidate transcript string or telemetry object
 * @param {Object} [options={}]
 * @returns {{
 *   isAIGenerated: boolean,
 *   confidence: number,
 *   riskLevel: 'clean'|'low'|'medium'|'high'|'critical',
 *   flagged: boolean,
 *   indicators: Object,
 *   reasons: string[],
 *   summary: string
 * }}
 */
export function detectAIGeneratedSpeech(input, options = {}) {
  const text = typeof input === 'string'
    ? input
    : (input?.text || input?.transcript || input?.answer || '');

  if (!text || text.trim().length === 0) {
    return {
      isAIGenerated: false,
      confidence: 0,
      riskLevel: 'clean',
      flagged: false,
      indicators: {
        cannedPhrases: { detected: false, score: 0 },
        syntacticPerplexity: { score: 0 },
        teleprompterCadence: { detected: false, score: 0 },
      },
      reasons: [],
      summary: 'No speech content analyzed.',
    };
  }

  const canned = detectCannedPhrases(text);
  const burstiness = analyzeBurstinessAndPerplexity(text);
  const cadence = detectTeleprompterCadence(input, options);

  // Weighted confidence synthesis
  // Canned formulas: 45% weight
  // Syntactic uniformity: 25% weight
  // Teleprompter delivery: 30% weight
  let combinedScore = (canned.score * 0.45) + (burstiness.score * 0.25) + (cadence.score * 0.30);

  // If multiple distinct canned phrases or strong canned formulas are detected
  if (canned.matches.length >= 2 || canned.score >= 0.85) {
    combinedScore = Math.max(combinedScore, Math.min(0.95, canned.score * 0.75));
  }

  // Explicit LLM persona leakage immediately spikes confidence
  if (canned.categoryBreakdown.ai_disclaimer) {
    combinedScore = Math.max(combinedScore, 0.95);
  }

  // Compound reinforcement: If canned phrases exist AND delivery is sterile/robotic
  if (canned.detected && (burstiness.isUnnaturallyUniform || cadence.detected)) {
    combinedScore = Math.min(1.0, combinedScore + 0.15);
  }

  const confidence = Math.min(1.0, Math.max(0, Number(combinedScore.toFixed(2))));
  const isAIGenerated = confidence >= 0.60;
  const flagged = confidence >= 0.60;

  const riskLevel = confidence >= 0.85 ? 'critical'
    : confidence >= 0.65 ? 'high'
    : confidence >= 0.45 ? 'medium'
    : confidence >= 0.20 ? 'low'
    : 'clean';

  const reasons = [
    ...canned.matches,
    ...(burstiness.isUnnaturallyUniform ? [`Unnaturally uniform sentence cadence (low burstiness: CV = ${burstiness.burstinessCV})`] : []),
    ...cadence.reasons,
  ];

  let summary = 'Natural human conversational speech patterns detected.';
  if (isAIGenerated) {
    summary = `Likely AI-generated or teleprompter-assisted speech detected (${Math.round(confidence * 100)}% confidence). ${reasons.slice(0, 2).join('; ')}.`;
  } else if (riskLevel === 'medium') {
    summary = `Minor robotic or formulaic patterns detected (${Math.round(confidence * 100)}% confidence). Review advised.`;
  }

  return {
    isAIGenerated,
    confidence,
    riskLevel,
    flagged,
    indicators: {
      cannedPhrases: canned,
      syntacticPerplexity: burstiness,
      teleprompterCadence: cadence,
    },
    reasons,
    summary,
  };
}

export default {
  detectCannedPhrases,
  analyzeBurstinessAndPerplexity,
  detectTeleprompterCadence,
  detectAIGeneratedSpeech,
  CANNED_AI_PATTERNS,
};
