/**
 * Hiring Decision Service with Bar-Raiser Veto Evaluation
 *
 * Implements strict bar-raiser competency calibration for multi-round interviews.
 * Prevents naive arithmetic averaging from masking critical technical or behavioral failures.
 */

export const BAR_RAISER_THRESHOLDS = {
  dsa: 65,
  coding: 65,
  'technical coding': 65,
  'dsa / coding': 65,
  'system-design': 60,
  'system design': 60,
  system_design: 60,
  behavioral: 60,
  hr: 55,
  'hr discussion': 55,
  default: 60
};

export const ROUND_WEIGHTS = {
  dsa: 35,
  coding: 35,
  'system-design': 30,
  behavioral: 20,
  hr: 15,
  default: 20
};

/**
 * Resolves normalized round category key
 * @param {Object|string} round
 * @returns {string} normalized round type
 */
export function normalizeRoundType(round) {
  if (!round) return 'default';
  const raw = typeof round === 'string'
    ? round
    : (round.roundId || round.id || round.stage || round.name || '');

  const lower = String(raw).trim().toLowerCase();

  if (lower.includes('dsa') || lower.includes('coding') || lower.includes('algorithm')) {
    return 'dsa';
  }
  if (lower.includes('system') || lower.includes('design') || lower.includes('architecture')) {
    return 'system-design';
  }
  if (lower.includes('behavioral') || lower.includes('leadership') || lower.includes('culture')) {
    return 'behavioral';
  }
  if (lower.includes('hr')) {
    return 'hr';
  }
  return 'default';
}

/**
 * Resolves the passing threshold for a specific round
 * @param {Object|string} round
 * @param {Object} [customThresholds={}]
 * @returns {number} minimum passing score (0-100)
 */
export function getRoundThreshold(round, customThresholds = {}) {
  const normKey = normalizeRoundType(round);
  if (customThresholds && typeof customThresholds[normKey] === 'number') {
    return customThresholds[normKey];
  }
  return BAR_RAISER_THRESHOLDS[normKey] ?? BAR_RAISER_THRESHOLDS.default;
}

/**
 * Evaluates multi-round interview results using Bar-Raiser Veto logic.
 *
 * Rules:
 * 1. Each round type has a non-negotiable minimum threshold (e.g. Coding >= 65, System Design >= 60, Behavioral >= 60).
 * 2. If ANY round falls below its threshold, a Bar-Raiser Veto is triggered, resulting in NO HIRE
 *    regardless of how high other round scores are.
 * 3. If all rounds meet or exceed their thresholds, candidate advances based on calibrated weighted scoring.
 *
 * @param {Object} params
 * @param {Array<Object>} params.roundScores List of completed round records
 * @param {string} [params.company] Company identifier (optional)
 * @param {string} [params.role] Target role (optional)
 * @param {Object} [params.customThresholds] Override thresholds by round key
 * @returns {Object} Hiring committee decision payload
 */
export function evaluateBarRaiserDecision({
  roundScores = [],
  company = '',
  role = '',
  customThresholds = {}
} = {}) {
  if (!Array.isArray(roundScores) || roundScores.length === 0) {
    return {
      status: 'PENDING',
      verdict: 'Incomplete Interview Loop',
      badge: 'In Progress ⏳',
      color: '#94a3b8',
      vetoTriggered: false,
      vetoReasons: [],
      averageScore: 0,
      weightedScore: 0,
      roundEvaluations: [],
      recommendation: 'Interview loop is currently in progress. Full evaluation requires completing all scheduled rounds.',
      evaluatedAt: new Date().toISOString()
    };
  }

  const roundEvaluations = [];
  const vetoReasons = [];
  let totalScoreSum = 0;
  let totalWeightSum = 0;
  let weightedScoreSum = 0;

  for (let idx = 0; idx < roundScores.length; idx++) {
    const r = roundScores[idx] || {};
    const normKey = normalizeRoundType(r);
    const roundName = r.name || r.stage || r.roundId || `Round ${idx + 1}`;
    const rawScore = Number(r.score ?? r.percentage ?? r.finalScore?.percentage ?? 0);
    const score = Math.max(0, Math.min(100, Math.round(isNaN(rawScore) ? 0 : rawScore)));
    const threshold = getRoundThreshold(r, customThresholds);
    const passed = score >= threshold;
    const isVeto = !passed;

    if (isVeto) {
      vetoReasons.push(
        `[Bar-Raiser Veto] ${roundName} score of ${score}% failed the mandatory threshold of ${threshold}%.`
      );
    }

    const weight = ROUND_WEIGHTS[normKey] || ROUND_WEIGHTS.default;
    totalScoreSum += score;
    weightedScoreSum += score * weight;
    totalWeightSum += weight;

    roundEvaluations.push({
      roundIndex: idx,
      roundId: r.roundId || normKey,
      name: roundName,
      stage: r.stage || roundName,
      score,
      threshold,
      passed,
      veto: isVeto,
      weight,
      strengths: Array.isArray(r.strengths) ? r.strengths : [],
      improvements: Array.isArray(r.improvements) ? r.improvements : [],
      feedback: r.feedback || r.summary || ''
    });
  }

  const averageScore = Math.round(totalScoreSum / roundScores.length);
  const weightedScore = totalWeightSum > 0 ? Math.round(weightedScoreSum / totalWeightSum) : averageScore;
  const vetoTriggered = vetoReasons.length > 0;

  let status;
  let verdict;
  let badge;
  let color;
  let recommendation;

  if (vetoTriggered) {
    status = 'VETOED';
    verdict = 'No Hire (Bar-Raiser Veto)';
    badge = 'Vetoed by Bar-Raiser ❌';
    color = '#ef4444';

    const failedRoundsStr = roundEvaluations
      .filter((re) => re.veto)
      .map((re) => `${re.name} (${re.score}% vs min ${re.threshold}%)`)
      .join(', ');

    recommendation = `The Hiring Committee has issued a Bar-Raiser Veto. While average performance across rounds was ${averageScore}%, the candidate failed to satisfy minimum required competencies in: ${failedRoundsStr}. In calibrated committee deliberation, high scores in non-core rounds cannot override a failure to meet the baseline standard.`;
  } else {
    // All rounds passed their bar-raiser threshold
    if (weightedScore >= 85) {
      status = 'STRONG_HIRE';
      verdict = 'Strong Hire 🌟';
      badge = 'Strong Hire 🌟';
      color = '#22c55e';
      recommendation = `Outstanding performance across all interview dimensions. Candidate comfortably surpassed all bar-raiser thresholds with a weighted score of ${weightedScore}%, demonstrating clear domain mastery and communication excellence.`;
    } else if (weightedScore >= 70) {
      status = 'HIRE';
      verdict = 'Would Advance 👍';
      badge = 'Would Advance 👍';
      color = '#3b82f6';
      recommendation = `Consistently satisfied all competency bars with a calibrated score of ${weightedScore}%. The candidate meets the role requirements across technical and behavioral dimensions with positive committee consensus.`;
    } else if (weightedScore >= 60) {
      status = 'BORDERLINE';
      verdict = 'Borderline 🤔';
      badge = 'Borderline 🤔';
      color = '#f59e0b';
      recommendation = `Candidate met minimum passing thresholds across rounds (weighted score ${weightedScore}%), but performance was near the margin. Hiring Committee recommends an additional targeted debrief before a final leveling decision.`;
    } else {
      status = 'NO_HIRE';
      verdict = 'Needs Improvement 📚';
      badge = 'Needs Improvement 📚';
      color = '#ef4444';
      recommendation = `Overall calibrated score of ${weightedScore}% fell below the advancement threshold. Candidate should focus on targeted technical practice before reapplying.`;
    }
  }

  return {
    status,
    verdict,
    badge,
    color,
    vetoTriggered,
    vetoReasons,
    averageScore,
    weightedScore,
    company: company || '',
    role: role || '',
    passingThresholds: {
      dsa: BAR_RAISER_THRESHOLDS.dsa,
      'system-design': BAR_RAISER_THRESHOLDS['system-design'],
      behavioral: BAR_RAISER_THRESHOLDS.behavioral,
      hr: BAR_RAISER_THRESHOLDS.hr
    },
    roundEvaluations,
    recommendation,
    evaluatedAt: new Date().toISOString()
  };
}

export default {
  BAR_RAISER_THRESHOLDS,
  ROUND_WEIGHTS,
  normalizeRoundType,
  getRoundThreshold,
  evaluateBarRaiserDecision
};
