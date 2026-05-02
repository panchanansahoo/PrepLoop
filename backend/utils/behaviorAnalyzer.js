/**
 * Behavioral Analyzer - Real-time assessment of soft skills and communication
 * Analyzes response patterns, communication quality, confidence, and technical depth
 */

/**
 * Behavior Scoring Components
 */
const BEHAVIOR_COMPONENTS = {
  CLARITY: 'clarity',           // Is the answer understandable?
  STRUCTURE: 'structure',       // Logical flow, STAR method
  ENGAGEMENT: 'engagement',     // Stories, examples, detail level
  CONCISENESS: 'conciseness',   // Relevant length, on-topic
  CONFIDENCE: 'confidence',     // Perceived confidence level
  TECHNICAL_DEPTH: 'technical_depth'  // Technical breadth and depth
};

/**
 * Confidence indicators from response
 */
const CONFIDENCE_INDICATORS = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  VERY_LOW: 'very_low'
};

/**
 * Analyze behavioral aspects of a response
 */
export function analyzeBehavior(question, answer, metadata = {}) {
  const { responseTime = 0, retries = 0, isFirstAttempt = true } = metadata;

  const confidenceResult = analyzeConfidenceLevel(answer, responseTime, retries);

  return {
    clarity: analyzeClarityScore(answer),
    structure: analyzeStructureScore(question, answer),
    engagement: analyzeEngagementScore(answer),
    conciseness: analyzeConcisenessScore(answer),
    confidence: confidenceResult,
    technicalDepth: analyzeTechnicalDepthScore(answer),
    responseTime,
    overallBehaviorScore: calculateOverallBehaviorScoreDirect(
      {
        clarity: analyzeClarityScore(answer),
        structure: analyzeStructureScore(question, answer),
        engagement: analyzeEngagementScore(answer),
        conciseness: analyzeConcisenessScore(answer),
        confidence: confidenceResult,
        technicalDepth: analyzeTechnicalDepthScore(answer)
      },
      responseTime
    )
  };
}

/**
 * Calculate overall behavior score without recursion
 */
function calculateOverallBehaviorScoreDirect(components, responseTime) {
  // Weighted average
  const score =
    (components.clarity * 0.20) +
    (components.structure * 0.15) +
    (components.engagement * 0.15) +
    (components.conciseness * 0.15) +
    (components.confidence.score * 0.15) +
    (components.technicalDepth * 0.20);

  return Math.round(score);
}

/**
 * Score clarity (0-30)
 * Is the answer understandable and well-articulated?
 */
function analyzeClarityScore(answer) {
  let score = 18; // Base score increased

  const answerLength = answer.length;
  const sentenceCount = (answer.match(/[.!?]/g) || []).length;
  const avgSentenceLength = answerLength / Math.max(sentenceCount, 1);

  // Ideal sentence length: 15-50 words (relaxed from 15-30)
  if (avgSentenceLength >= 15 && avgSentenceLength <= 50) {
    score += 7; // Good sentence structure
  } else if (avgSentenceLength < 10) {
    score -= 4; // Too fragmented
  } else if (avgSentenceLength > 70) {
    score -= 2; // Too long-winded
  }

  // Check for clear intro/conclusion
  if (startsWithClearIntro(answer)) score += 4;
  if (hasConclusion(answer)) score += 3;

  // Check for jargon/unclear language
  if (hasExcessiveJargon(answer)) score -= 3;

  return Math.max(0, Math.min(30, score));
}

/**
 * Score structure (0-20)
 * Logical flow, STAR method for behavioral questions
 */
function analyzeStructureScore(question, answer) {
  let score = 14; // Increased base score

  const isBehavioralQuestion = isBehavioral(question);

  if (isBehavioralQuestion) {
    // Check STAR method
    const hasSituation = hasSituationComponent(answer);
    const hasTask = hasTaskComponent(answer);
    const hasAction = hasActionComponent(answer);
    const hasResult = hasResultComponent(answer);

    if (hasSituation) score += 2;
    if (hasTask) score += 2;
    if (hasAction) score += 3;
    if (hasResult) score += 4; // Result is most important

    // Penalty for out-of-order STAR
    if (!isLogicallyStructured(answer)) score -= 2;
  } else {
    // For general/technical questions, check if organized by topic/projects
    if (hasSpecificExamples(answer)) score += 4;
    if (hasNumbers(answer)) score += 2;
  }

  return Math.max(0, Math.min(20, score));
}

/**
 * Score engagement (0-20)
 * Interesting examples, stories, appropriate detail level
 */
function analyzeEngagementScore(answer) {
  let score = 10; // Base score increased

  // Has specific details/examples
  if (hasSpecificExamples(answer)) score += 5;
  if (hasNumbers(answer)) score += 4;
  if (hasStories(answer)) score += 3;

  // Appropriate length
  const length = answer.length;
  if (length >= 100 && length <= 600) {
    score += 4; // Good detail level (relaxed range)
  } else if (length < 60) {
    score -= 2; // Too brief
  } else if (length > 900) {
    score -= 1; // Too long-winded
  }

  return Math.max(0, Math.min(20, score));
}

/**
 * Score conciseness (0-20)
 * Stays on-topic, doesn't ramble
 */
function analyzeConcisenessScore(answer) {
  let score = 14; // Base score increased

  // Check for off-topic content
  const onTopicRatio = calculateOnTopicRatio(answer);
  if (onTopicRatio >= 0.85) {
    score += 5; // Stays focused (relaxed threshold)
  } else if (onTopicRatio >= 0.7) {
    score += 2;
  } else {
    score -= 3;
  }

  // Check for unnecessary repetition
  if (hasRepetition(answer)) score -= 3;

  // Check for hedging language (too much uncertainty)
  if (hasExcessiveHedging(answer)) score -= 2;

  return Math.max(0, Math.min(20, score));
}

/**
 * Analyze confidence level (0-10)
 * Based on response patterns and metadata
 */
export function analyzeConfidenceLevel(answer, responseTime, retries) {
  let score = 6; // Base score

  // Response time indicator
  if (responseTime >= 2000 && responseTime <= 5000) {
    score += 2; // Good thinking time, confident
  } else if (responseTime < 1000) {
    score -= 1; // Too quick (might be memorized)
  } else if (responseTime > 15000) {
    score -= 2; // Too much hesitation
  }

  // Check linguistic confidence markers
  if (hasConfidentLanguage(answer)) score += 2;
  if (hasHesitantLanguage(answer)) score -= 2;

  // Retry penalty
  if (retries > 0) score -= (retries * 0.5);

  return {
    score: Math.max(0, Math.min(10, score)),
    level: getConfidenceLevel(score),
    indicators: getConfidenceIndicators(answer, responseTime)
  };
}

/**
 * Score technical depth (0-30)
 * How deep is technical understanding?
 */
function analyzeTechnicalDepthScore(answer) {
  let score = 8; // Base score increased

  // Check for specific technologies
  const technologies = extractTechnologies(answer);
  if (technologies.length > 0) score += Math.min(6, technologies.length);

  // Check for architectural concepts
  if (hasSoftwareArchitectureConcepts(answer)) score += 5;

  // Check for complexity analysis
  if (mentionsComplexity(answer)) score += 5;

  // Check for best practices
  if (mentionsBestPractices(answer)) score += 4;

  // Check for edge cases
  if (considersEdgeCases(answer)) score += 3;

  // Check for scalability/performance awareness
  if (mentionsScalability(answer)) score += 4;

  return Math.max(0, Math.min(30, score));
}

/**
 * Calculate overall behavior score (0-100)
 */
export function calculateOverallBehaviorScore(answer, responseTime, question) {
  const clarity = analyzeClarityScore(answer);                    // 0-30
  const structure = analyzeStructureScore(question, answer);      // 0-20
  const engagement = analyzeEngagementScore(answer);              // 0-20
  const conciseness = analyzeConcisenessScore(answer);            // 0-20
  const confidenceResult = analyzeConfidenceLevel(answer, responseTime, 0);  // 0-10
  const technicalDepth = analyzeTechnicalDepthScore(answer);      // 0-30

  // Normalize each component to 0-100 scale
  const clarityNorm = (clarity / 30) * 100;
  const structureNorm = (structure / 20) * 100;
  const engagementNorm = (engagement / 20) * 100;
  const concisenessNorm = (conciseness / 20) * 100;
  const confidenceNorm = (confidenceResult.score / 10) * 100;
  const technicalDepthNorm = (technicalDepth / 30) * 100;

  // Weighted average of normalized scores
  const score =
    (clarityNorm * 0.20) +
    (structureNorm * 0.15) +
    (engagementNorm * 0.15) +
    (concisenessNorm * 0.15) +
    (confidenceNorm * 0.15) +
    (technicalDepthNorm * 0.20);

  return Math.round(score);
}

/**
 * Identify communication strengths
 */
export function identifyStrengths(answer, metadata = {}) {
  const strengths = [];

  if (hasSpecificExamples(answer)) strengths.push('Uses concrete examples');
  if (hasConfidentLanguage(answer)) strengths.push('Communicates with confidence');
  if (isLogicallyStructured(answer)) strengths.push('Well-structured response');
  if (mentionsBestPractices(answer)) strengths.push('Aware of best practices');
  if (hasNumbers(answer)) strengths.push('Backs up claims with data');
  if (mentionsTeamwork(answer)) strengths.push('Emphasizes collaboration');

  return strengths.slice(0, 3);
}

/**
 * Identify improvement areas
 */
export function identifyImprovementAreas(answer, question, metadata = {}) {
  const areas = [];

  if (!hasSpecificExamples(answer)) areas.push('Add concrete examples');
  if (hasExcessiveHedging(answer)) areas.push('Be more assertive/confident');
  if (!isLogicallyStructured(answer)) areas.push('Organize thoughts better (STAR method)');
  if (answer.length < 80) areas.push('Provide more detail and examples');
  if (hasRepetition(answer)) areas.push('Avoid repetition');
  if (hasExcessiveJargon(answer)) areas.push('Explain technical terms');

  return areas.slice(0, 3);
}

// ─────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────

function startsWithClearIntro(answer) {
  const intro = answer.substring(0, 50).toLowerCase();
  return /^(well|so|let me|i|basically|essentially)/.test(intro);
}

function hasConclusion(answer) {
  const ending = answer.substring(answer.length - 100).toLowerCase();
  return /(so that|which resulted|in the end|overall|ultimately)/.test(ending);
}

function hasExcessiveJargon(answer) {
  const jargonCount = (answer.match(/(?:paradigm|leverage|synergy|holistic|touch base)/gi) || []).length;
  return jargonCount > 3;
}

function isBehavioral(question) {
  return /tell me about|describe|experience|example|time when|situation where|conflict|failure/i.test(question);
}

function hasSituationComponent(answer) {
  return /(?:was|were|faced|encountered|came across|situation was).*(?:problem|challenge|need|requirement)/i.test(answer);
}

function hasTaskComponent(answer) {
  return /(?:tasked with|responsible for|assigned to|had to|needed to)/.test(answer);
}

function hasActionComponent(answer) {
  return /(?:i\s+(?:built|created|designed|implemented|led|decided)|took|approach|solution)/.test(answer);
}

function hasResultComponent(answer) {
  return /(?:result|outcome|impact|achieved|improved|learned|succeeded)/.test(answer);
}

function isLogicallyStructured(answer) {
  // Check if STAR components appear in roughly correct order
  const situationPos = answer.search(/situation|was|problem/i);
  const actionPos = answer.search(/(?:built|created|implemented|decided|took)/i);
  const resultPos = answer.search(/(?:result|outcome|improved|learned)/i);

  if (situationPos === -1 || actionPos === -1) return true; // Can't verify
  return situationPos < actionPos;
}

function hasStructuredApproach(answer) {
  return /(?:approach|strategy|process|steps?|first|then|finally)/.test(answer);
}

function hasSpecificExamples(answer) {
  return /(?:for example|e\.g\.|specifically|instance|like|such as|concrete)/.test(answer);
}

function hasNumbers(answer) {
  return /\d+(?:[\.,]\d+)?(?:\s*(?:%|ms|s|users?|requests?|qps|gb|mb))?/.test(answer);
}

function hasStories(answer) {
  return answer.length > 200 && /(?:was|were|had|found|realized|discovered)/.test(answer);
}

function calculateOnTopicRatio(answer) {
  // Simplified: check for keywords vs total words
  return 0.85; // Placeholder
}

function hasRepetition(answer) {
  const words = answer.toLowerCase().split(/\s+/);
  const wordFreq = {};
  for (const word of words) {
    if (word.length > 4) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  }
  return Object.values(wordFreq).some(count => count > 3);
}

function hasExcessiveHedging(answer) {
  const hedges = (answer.match(/(?:um|uh|like|well|basically|actually|probably|hopefully|maybe|perhaps|I think|I guess|sort of|kind of|pretty|quite|apparently|supposedly)/gi) || []).length;
  return hedges > 2;
}

function hasConfidentLanguage(answer) {
  return /(?:I (?:know|understand|built|created|led)|definitely|certainly|clearly)/.test(answer);
}

function hasHesitantLanguage(answer) {
  return /(?:um|uh|uh\s*let|i'm not sure|i think|maybe)/.test(answer);
}

function getConfidenceLevel(score) {
  if (score >= 8) return CONFIDENCE_INDICATORS.HIGH;
  if (score >= 6) return CONFIDENCE_INDICATORS.MEDIUM;
  if (score >= 3) return CONFIDENCE_INDICATORS.LOW;
  return CONFIDENCE_INDICATORS.VERY_LOW;
}

function getConfidenceIndicators(answer, responseTime) {
  const indicators = [];
  if (hasConfidentLanguage(answer)) indicators.push('Confident language');
  if (responseTime > 5000) indicators.push('Thoughtful response time');
  if (hasSpecificExamples(answer)) indicators.push('Concrete examples');
  return indicators;
}

function extractTechnologies(answer) {
  const techs = [
    'react', 'node', 'python', 'java', 'go', 'kotlin',
    'postgres', 'mysql', 'mongodb', 'redis', 'elasticsearch',
    'kubernetes', 'docker', 'aws', 'gcp', 'azure',
    'graphql', 'rest', 'grpc', 'websocket'
  ];

  const found = [];
  for (const tech of techs) {
    if (new RegExp(`\\b${tech}\\b`, 'i').test(answer)) {
      found.push(tech);
    }
  }
  return found;
}

function hasSoftwareArchitectureConcepts(answer) {
  return /(?:microservices|monolith|mvc|cache|load.?balanc|sharding|replication)/.test(answer);
}

function mentionsComplexity(answer) {
  return /(?:o\(|time.?complex|space.?complex|efficient|optimize)/.test(answer);
}

function mentionsBestPractices(answer) {
  return /(?:best practice|design pattern|SOLID|DRY|KISS|clean code)/.test(answer);
}

function considersEdgeCases(answer) {
  return /(?:edge case|corner case|error handling|null check|validation)/.test(answer);
}

function mentionsScalability(answer) {
  return /(?:scale|scalable|load|throughput|latency|performance|concurrent)/.test(answer);
}

function mentionsTeamwork(answer) {
  return /(?:team|collaborate|together|others|worked with|coordinated)/.test(answer);
}

export default {
  analyzeBehavior,
  calculateOverallBehaviorScore,
  analyzeConfidenceLevel,
  identifyStrengths,
  identifyImprovementAreas,
  BEHAVIOR_COMPONENTS,
  CONFIDENCE_INDICATORS
};
