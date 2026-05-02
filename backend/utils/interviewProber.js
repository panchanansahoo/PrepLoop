/**
 * Interview Prober - Smart contextual follow-up question generator
 * Analyzes answer quality and generates targeted follow-up questions
 * to probe deeper on weaknesses and missing elements
 */

/**
 * Question Gap Types - What's missing from the answer
 */
const GAP_TYPES = {
  IMPACT: 'impact',           // No metrics, no quantifiable results
  TECHNICAL_DEPTH: 'technical_depth',  // Shallow technical explanation
  CHALLENGE: 'challenge',     // Didn't explain the difficulty/problem
  SOLUTION: 'solution',       // How was it solved?
  LEARNING: 'learning',       // What did you learn?
  TEAM_ROLE: 'team_role',     // Your specific contribution
  TIMELINE: 'timeline',       // How long? When?
  EXAMPLES: 'examples',       // Concrete examples missing
  TRADE_OFFS: 'trade_offs',   // Didn't discuss pros/cons
  WHY: 'why'                  // Why that approach?
};

/**
 * Probing Strategy Types
 */
const PROBING_STRATEGIES = {
  CLARIFICATION: 'clarification',    // "Can you explain that more?"
  DEPTH: 'depth',                    // "How did you solve the technical part?"
  EXAMPLE: 'example',                // "Can you give me a concrete example?"
  CHALLENGE: 'challenge',            // "What was the hardest part?"
  ALTERNATIVE: 'alternative',        // "Would you do it differently now?"
  MEASUREMENT: 'measurement',        // "What was the impact?"
  CONTRADICTION: 'contradiction',    // "Earlier you said X, but now Y?"
  HYPOTHETICAL: 'hypothetical'       // "What if the requirement changed?"
};

/**
 * Analyze gaps in answer and recommend follow-ups
 */
export function analyzeAnswerGaps(question, answer, context = {}) {
  const gaps = [];
  const answerLower = answer.toLowerCase();

  // Check for impact metrics
  if (!hasImpactMetrics(answer)) {
    gaps.push({
      type: GAP_TYPES.IMPACT,
      severity: 'high',
      reason: 'No quantifiable results or impact mentioned',
      followUpStrategy: PROBING_STRATEGIES.MEASUREMENT
    });
  }

  // Check for technical depth (if technical question)
  if (isQuestionTechnical(question) && !hasTechnicalDepth(answer)) {
    gaps.push({
      type: GAP_TYPES.TECHNICAL_DEPTH,
      severity: 'high',
      reason: 'Technical explanation lacks depth',
      followUpStrategy: PROBING_STRATEGIES.DEPTH
    });
  }

  // Check for challenge/problem statement
  if (!mentionsChallengeOrProblem(answer)) {
    gaps.push({
      type: GAP_TYPES.CHALLENGE,
      severity: 'medium',
      reason: 'Didn\'t explain the problem or challenge',
      followUpStrategy: PROBING_STRATEGIES.CHALLENGE
    });
  }

  // Check for solution approach
  if (!mentionsSolution(answer)) {
    gaps.push({
      type: GAP_TYPES.SOLUTION,
      severity: 'high',
      reason: 'Solution/approach not clearly explained',
      followUpStrategy: PROBING_STRATEGIES.DEPTH
    });
  }

  // Check for learning
  if (!mentionsLearning(answer)) {
    gaps.push({
      type: GAP_TYPES.LEARNING,
      severity: 'low',
      reason: 'No learning or takeaway mentioned',
      followUpStrategy: PROBING_STRATEGIES.CLARIFICATION
    });
  }

  // Check for personal contribution (if story-based)
  if (isStoryQuestion(question) && !mentionsPersonalRole(answer)) {
    gaps.push({
      type: GAP_TYPES.TEAM_ROLE,
      severity: 'medium',
      reason: 'Your specific role/contribution unclear',
      followUpStrategy: PROBING_STRATEGIES.CLARIFICATION
    });
  }

  // Check for concrete examples
  if (!hasConcreteExamples(answer)) {
    gaps.push({
      type: GAP_TYPES.EXAMPLES,
      severity: 'low',
      reason: 'No concrete examples or details provided',
      followUpStrategy: PROBING_STRATEGIES.EXAMPLE
    });
  }

  return {
    gaps,
    gapCount: gaps.length,
    severity: calculateGapSeverity(gaps),
    needsFollowUp: gaps.length > 0
  };
}

/**
 * Generate follow-up questions based on gaps
 */
export function generateFollowUpQuestions(question, answer, gaps = [], context = {}) {
  if (!gaps || gaps.length === 0) {
    return {
      followUps: [],
      count: 0,
      reason: 'No significant gaps detected'
    };
  }

  const followUps = [];
  const maxFollowUps = 3;

  // Sort gaps by severity
  const sortedGaps = gaps.sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  // Generate follow-up for each high-priority gap
  for (let i = 0; i < Math.min(sortedGaps.length, maxFollowUps); i++) {
    const gap = sortedGaps[i];
    const followUp = generateFollowUpForGap(question, answer, gap, context);
    if (followUp) followUps.push(followUp);
  }

  return {
    followUps,
    count: followUps.length,
    topGaps: sortedGaps.slice(0, 2),
    recommendations: generateProbeRecommendations(sortedGaps)
  };
}

/**
 * Generate single follow-up question for a gap
 */
function generateFollowUpForGap(originalQuestion, answer, gap, context = {}) {
  const answerLength = answer.length;
  const isShortAnswer = answerLength < 100;

  switch (gap.type) {
    case GAP_TYPES.IMPACT:
      return {
        followUp: 'What was the impact or outcome of this? Any metrics - users reached, time saved, revenue generated?',
        strategy: 'measurement',
        priority: 'high'
      };

    case GAP_TYPES.TECHNICAL_DEPTH:
      return {
        followUp: 'Can you walk me through the technical implementation? What specific technologies or algorithms did you use?',
        strategy: 'depth',
        priority: 'high'
      };

    case GAP_TYPES.CHALLENGE:
      return {
        followUp: 'What was the main challenge or problem you were trying to solve?',
        strategy: 'challenge',
        priority: 'medium'
      };

    case GAP_TYPES.SOLUTION:
      return {
        followUp: 'How did you approach solving this? Walk me through your solution.',
        strategy: 'depth',
        priority: 'high'
      };

    case GAP_TYPES.LEARNING:
      return {
        followUp: 'What did you learn from this experience? What would you do differently?',
        strategy: 'alternative',
        priority: 'low'
      };

    case GAP_TYPES.TEAM_ROLE:
      return {
        followUp: 'What was your specific role in this project? What did you personally contribute?',
        strategy: 'clarification',
        priority: 'medium'
      };

    case GAP_TYPES.EXAMPLES:
      return {
        followUp: 'Can you provide a specific example or walk through a concrete scenario?',
        strategy: 'example',
        priority: 'low'
      };

    case GAP_TYPES.TRADE_OFFS:
      return {
        followUp: 'Did you consider any alternative approaches? Why did you choose this one?',
        strategy: 'alternative',
        priority: 'medium'
      };

    default:
      return null;
  }
}

/**
 * Helper: Check if answer has impact metrics
 */
function hasImpactMetrics(answer) {
  const metricPatterns = [
    /(\d+)\s*(users?|customers?|people|requests|qps|throughput)/i,
    /(\d+)\s*%\s*(improvement|increase|decrease|reduction)/i,
    /save.*(?:time|hours?|days?)/i,
    /reduce.*(?:latency|cost|overhead)/i,
    /improved?\s*.*(?:performance|speed|reliability)/i,
    /(million|thousand|hundred)\s*(users?|requests|queries)/i
  ];

  return metricPatterns.some(pattern => pattern.test(answer));
}

/**
 * Helper: Check if question is technical
 */
function isQuestionTechnical(question) {
  const technicalKeywords = [
    'how', 'implement', 'design', 'architecture', 'algorithm',
    'database', 'api', 'system', 'technical', 'code',
    'framework', 'tool', 'technology', 'scale', 'performance'
  ];

  const questionLower = question.toLowerCase();
  return technicalKeywords.some(keyword => questionLower.includes(keyword));
}

/**
 * Helper: Check if answer has technical depth
 */
function hasTechnicalDepth(answer) {
  const depthIndicators = [
    /(?:framework|library|language|database|algorithm|design\s*pattern)/i,
    /(?:redis|sql|nosql|cache|cdn|kubernetes|docker)/i,
    /(?:o\(.*\)|time\s*complexity|space\s*complexity)/i,
    /(?:api|rest|graphql|grpc|websocket)/i,
    /(?:load\s*balanc|sharding|replication|transaction)/i
  ];

  return depthIndicators.some(indicator => indicator.test(answer));
}

/**
 * Helper: Check if mentions challenge/problem
 */
function mentionsChallengeOrProblem(answer) {
  const patterns = [
    /challenge|problem|difficulty|obstacle|issue|constraint/i,
    /was\s*(difficult|hard|complex|tricky)/i,
    /had\s*to\s*(handle|deal\s*with|overcome|solve)/i
  ];

  return patterns.some(pattern => pattern.test(answer));
}

/**
 * Helper: Check if mentions solution
 */
function mentionsSolution(answer) {
  const patterns = [
    /solve|solution|approach|implement|build|create|develop/i,
    /decided\s*to|chose\s*to|used\s*(?:a|an)/i,
    /i\s*(?:built|created|implemented|designed)/i
  ];

  return patterns.some(pattern => pattern.test(answer));
}

/**
 * Helper: Check if mentions learning
 */
function mentionsLearning(answer) {
  const patterns = [
    /learn|learned|realized|discovered|understood|appreciate/i,
    /key\s*(?:takeaway|lesson|insight)/i,
    /would\s*(?:do|handle|approach).*differently/i
  ];

  return patterns.some(pattern => pattern.test(answer));
}

/**
 * Helper: Check if is story/behavioral question
 */
function isStoryQuestion(question) {
  const storyKeywords = [
    'tell me about', 'describe', 'experience', 'example',
    'conflict', 'failure', 'challenging', 'achievement',
    'time when', 'situation where'
  ];

  const questionLower = question.toLowerCase();
  return storyKeywords.some(keyword => questionLower.includes(keyword));
}

/**
 * Helper: Check if mentions personal role
 */
function mentionsPersonalRole(answer) {
  const patterns = [
    /\bi\s*(?:led|managed|designed|built|created|owned)/i,
    /my\s*(?:role|responsibility|contribution)/i,
    /personally?\s*(?:built|created|implemented)/i,
    /i\s*was\s*(?:responsible|in\s*charge|lead)/i
  ];

  return patterns.some(pattern => pattern.test(answer));
}

/**
 * Helper: Check if has concrete examples
 */
function hasConcreteExamples(answer) {
  const patterns = [
    /for\s*example|e\.g\.|specifically|instance|like/i,
    /\b(?:postgres|redis|react|python|java|go|kubernetes)/i,
    /\d+\s*(?:ms|seconds?|minutes?|hours?|days?)/i
  ];

  return patterns.some(pattern => pattern.test(answer));
}

/**
 * Helper: Calculate overall gap severity
 */
function calculateGapSeverity(gaps) {
  if (gaps.length === 0) return 'none';
  
  const highCount = gaps.filter(g => g.severity === 'high').length;
  const mediumCount = gaps.filter(g => g.severity === 'medium').length;

  if (highCount >= 2) return 'critical';
  if (highCount === 1 && mediumCount >= 2) return 'high';
  if (highCount === 1) return 'medium';
  if (mediumCount >= 2) return 'medium';
  return 'low';
}

/**
 * Helper: Generate probe recommendations
 */
function generateProbeRecommendations(gaps) {
  const recommendations = [];

  if (gaps.some(g => g.type === GAP_TYPES.IMPACT)) {
    recommendations.push('Focus on impact metrics - quantify the outcome');
  }

  if (gaps.some(g => g.type === GAP_TYPES.TECHNICAL_DEPTH)) {
    recommendations.push('Probe technical implementation - gauge depth of understanding');
  }

  if (gaps.some(g => g.type === GAP_TYPES.TEAM_ROLE)) {
    recommendations.push('Clarify personal contribution - distinguish individual from team effort');
  }

  if (gaps.some(g => g.type === GAP_TYPES.CHALLENGE)) {
    recommendations.push('Understand the problem - what made this challenging?');
  }

  return recommendations.slice(0, 3);
}

/**
 * Get context-aware probing questions
 */
export function getContextAwareProbes(context = {}) {
  const { interviewType = 'general', difficulty = 'medium', previousAnswerScores = [] } = context;

  const probes = [];

  // If user struggling overall
  if (previousAnswerScores.length > 0) {
    const avgScore = previousAnswerScores.reduce((a, b) => a + b, 0) / previousAnswerScores.length;
    if (avgScore < 50) {
      probes.push({
        type: 'empathy',
        message: 'Take a deep breath. Let\'s slow down and work through this together.'
      });
    }
  }

  // Interview-type specific probes
  if (interviewType === 'behavioral') {
    probes.push({
      type: 'star_method',
      message: 'Can you structure that using the STAR method - Situation, Task, Action, Result?'
    });
  }

  if (interviewType === 'technical') {
    probes.push({
      type: 'whiteboard',
      message: 'Walk me through how you\'d implement this. What\'s the time and space complexity?'
    });
  }

  if (interviewType === 'system-design') {
    probes.push({
      type: 'tradeoffs',
      message: 'What trade-offs are you making? How would you scale this?'
    });
  }

  return probes;
}

export default {
  analyzeAnswerGaps,
  generateFollowUpQuestions,
  getContextAwareProbes,
  GAP_TYPES,
  PROBING_STRATEGIES
};
