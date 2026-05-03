import { normalizeInterviewType } from '../utils/typeNormalizer.js';

// ── STAR detection helpers (behavioral interviews) ────────────────────
const STAR_PATTERNS = {
  situation: /(in that situation|the context was|we were facing|at that time|when we|the problem was|the challenge was)/i,
  task: /(my task was|i was responsible for|my role was|i needed to|i had to|was assigned to)/i,
  action: /(i took the action|i decided to|i implemented|i led|i created|i built|i organized|i initiated|the action i took|i worked on|i designed)/i,
  result: /(the result was|as a result|the outcome|this led to|we achieved|we reduced|we improved|the impact|this resulted in|uptime|reduced by|increased by)/i,
};

function detectStarComponents(text) {
  const lower = String(text || '').toLowerCase();
  return {
    hasSituation: STAR_PATTERNS.situation.test(lower),
    hasTask: STAR_PATTERNS.task.test(lower),
    hasAction: STAR_PATTERNS.action.test(lower),
    hasResult: STAR_PATTERNS.result.test(lower),
  };
}

function isStarComplete(star) {
  // Complete STAR: at least 3 of 4 components present (situation is often implied)
  const count = [star.hasSituation, star.hasTask, star.hasAction, star.hasResult]
    .filter(Boolean).length;
  return count >= 3;
}

// ── Code quality signal extraction ────────────────────────────────────
function extractCodeSignals(code) {
  if (!code || typeof code !== 'string' || code.trim().length < 10) {
    return null;
  }

  const lower = code.toLowerCase();
  return {
    hasErrorHandling: /(try|catch|except|throw|raise|if.*error|if.*null|if.*none|if.*undefined|if.*!|\.catch)/.test(lower),
    hasEdgeCases: /(edge case|boundary|empty|null|undefined|zero|negative|overflow|underflow)/.test(lower),
    hasComments: /(\/\/|#\s|\/\*|\"\"\"|''')/.test(code),
    hasFunctions: /(function |def |=>|const \w+ = \(|class )/.test(code),
    lineCount: code.split('\n').length,
  };
}

// ── Adaptive follow-up difficulty logic ──────────────────────────────
/**
 * Calculate adaptive follow-up difficulty based on performance trajectory.
 * Uses rolling average of last 3 responses to determine if difficulty should increase/decrease.
 * 
 * @param {Array} scoreHistory - [{ score, turn }, ...] sorted by turn
 * @param {string} currentFollowUpDifficulty - 'basic', 'intermediate', 'advanced'
 * @param {object} scoreTrend - Pre-computed trend from calculateTrendFromHistory
 * @returns {object} { newDifficulty, change, reason, trajectory }
 */
function calculateAdaptiveFollowUpDifficulty(scoreHistory = [], currentFollowUpDifficulty = 'intermediate', scoreTrend = null) {
  const difficultyLevels = ['basic', 'intermediate', 'advanced'];
  const currentIndex = difficultyLevels.indexOf(String(currentFollowUpDifficulty).toLowerCase());
  const safeCurrentIndex = currentIndex >= 0 ? currentIndex : 1; // Default to intermediate

  // Need at least 3 responses to detect trajectory
  if (!Array.isArray(scoreHistory) || scoreHistory.length < 3) {
    return {
      newDifficulty: difficultyLevels[safeCurrentIndex],
      change: 0,
      reason: 'insufficient_data',
      trajectory: 'stable',
    };
  }

  // Calculate rolling average of last 3 responses (most recent weighted higher)
  const recent = scoreHistory.slice(-3);
  const weights = [0.2, 0.3, 0.5]; // Older → Newer (higher weight for recent)
  let rollingAvg = 0;
  for (let i = 0; i < recent.length; i++) {
    rollingAvg += (recent[i].score || 0) * weights[i];
  }

  // Determine trajectory from trend if available
  let trajectory = 'stable';
  if (scoreTrend && scoreTrend.trend) {
    trajectory = scoreTrend.trend; // 'improving', 'declining', or 'stable'
  } else {
    // Fallback: simple comparison of oldest vs newest in window
    const scoreChange = recent[recent.length - 1].score - recent[0].score;
    if (scoreChange >= 10) trajectory = 'improving';
    else if (scoreChange <= -10) trajectory = 'declining';
  }

  // Decide difficulty change: max ±1 per turn to avoid jarring jumps
  let change = 0;

  if (trajectory === 'improving' && rollingAvg >= 80) {
    // Strong performance + improving trend → increase difficulty
    change = +1;
  } else if (trajectory === 'improving' && rollingAvg >= 75 && safeCurrentIndex < difficultyLevels.length - 1) {
    // Good performance + improving → slightly increase
    change = +0.5; // Will round to +1 on next decision
  } else if (trajectory === 'declining' || rollingAvg < 65) {
    // Struggling or declining → reduce difficulty
    change = -1;
  } else if (rollingAvg < 70) {
    // Below target but not declining drastically → maintain current
    change = 0;
  }

  // Cap change to ±1 to prevent dramatic swings
  const capped = Math.max(-1, Math.min(1, change));
  // Round change for index calculation (0.5 rounds up to 1, -0.5 rounds down to -1)
  const step = capped === 0 ? 0 : (capped > 0 ? Math.ceil(capped) : Math.floor(capped));
  const newIndex = Math.max(0, Math.min(difficultyLevels.length - 1, safeCurrentIndex + step));
  const newDifficulty = difficultyLevels[newIndex];

  return {
    newDifficulty,
    change: capped,
    reason: trajectory === 'improving' ? 'performance_improving' : trajectory === 'declining' ? 'performance_declining' : 'performance_stable',
    trajectory,
    rollingAverage: Number(rollingAvg.toFixed(1)),
  };
}

export class InterviewFollowUpRulesService {
  static decideBranch({ analysis = {}, interviewContext = {}, candidateResponse = '', candidateCode = '', scoreHistory = [], scoreTrend = null } = {}) {
    const score = Number(analysis.score || 0);
    const previousScore = Number(interviewContext.previousScore || 0);
    const interviewType = normalizeInterviewType(interviewContext.interviewType || '');
    const missedConcepts = Array.isArray(analysis.nextFocus)
      ? [...analysis.nextFocus]
      : Array.isArray(interviewContext.missingAreas)
        ? [...interviewContext.missingAreas]
        : [];

    const responseText = String(candidateResponse || '').toLowerCase();
    const lowConfidenceSignals = /(not sure|i think|maybe|probably|guess|uncertain|not fully sure)/.test(responseText);

    // Type-aware depth detection: behavioral/HR depth looks different from DSA
    const dsaDepthSignals = /(because|therefore|trade.?off|complexity|edge case|example)/.test(responseText);
    const behavioralDepthSignals = /(outcome|impact|result|measurable|\d+%|reduced|improved|led|managed|\d+ team)/.test(responseText);
    const depthSignals = (interviewType === 'behavioral' || interviewType === 'hr')
      ? (dsaDepthSignals || behavioralDepthSignals)
      : dsaDepthSignals;

    // ── Code-aware analysis ───────────────────────────────────────────
    // Extract code from response if embedded, or use candidateCode parameter
    const codeBlock = candidateCode || (responseText.match(/---\s*code\s*---\n?([\s\S]*)/i)?.[1] || '');
    const codeSignals = extractCodeSignals(codeBlock);

    // Code-aware analysis — only relevant for DSA/system-design, not behavioral/HR
    if (interviewType !== 'behavioral' && interviewType !== 'hr') {
      if (codeSignals && !codeSignals.hasErrorHandling) {
        missedConcepts.push('missing_error_handling');
      }
      if (codeSignals && !codeSignals.hasEdgeCases) {
        missedConcepts.push('missing_edge_cases');
      }
    }

    // ── STAR detection (behavioral interviews) ────────────────────────
    let starAnalysis = null;
    if (interviewType === 'behavioral' || interviewType === 'hr') {
      starAnalysis = detectStarComponents(responseText);
    }

    // ── Score trend analysis (sliding window) ─────────────────────────
    // scoreTrend is pre-computed by InterviewScoringService.calculateTrendFromHistory()
    // If not provided, fall back to simple previousScore comparison
    const trend = scoreTrend || { mean: 0, stdDev: 0, trend: 'stable', volatility: 'stable', delta: 0 };

    // ── Adaptive follow-up difficulty (NEW) ──────────────────────────
    // Determine if next follow-up should be deeper, maintain, or simplify
    const currentFollowUpDifficulty = interviewContext.followUpDifficulty || 'intermediate';
    const adaptiveDifficulty = calculateAdaptiveFollowUpDifficulty(scoreHistory, currentFollowUpDifficulty, trend);

    // ── Determine next action ─────────────────────────────────────────
    let nextAction = 'deepen';
    let branchReason = 'high_quality_answer';

    // Behavioral/HR: incomplete STAR is HIGHEST priority — struggling candidates
    // with incomplete STAR need coaching most, regardless of score or volatility
    if (starAnalysis && !isStarComplete(starAnalysis)) {
      nextAction = 'star_completion';
      const missing = [];
      if (!starAnalysis.hasSituation) missing.push('situation');
      if (!starAnalysis.hasTask) missing.push('task');
      if (!starAnalysis.hasAction) missing.push('action');
      if (!starAnalysis.hasResult) missing.push('result');
      branchReason = `incomplete_star_missing_${missing.join('_')}`;
    } else if (trend.volatility === 'volatile' && scoreHistory.length >= 3) {
      // Volatility check — erratic scores need stabilization
      nextAction = 'volatility_scaffold';
      branchReason = 'volatile_score_pattern';
    } else if (score < 60 || missedConcepts.length > 1) {
      nextAction = 'targeted_correction';
      branchReason = 'missed_core_concepts';
    } else if (lowConfidenceSignals && interviewType !== 'hr' && interviewType !== 'behavioral') {
      // Only flag low confidence for DSA/system-design where hedging signals genuine uncertainty.
      // In HR/behavioral, 'I think' and 'maybe' are normal conversational patterns.
      nextAction = 'confidence_rebuild';
      branchReason = 'low_confidence_signal';
    } else if (!depthSignals) {
      nextAction = 'depth_probe';
      branchReason = 'shallow_explanation';
    }

    // ── Improvement arc tracking (enhanced with trend data) ───────────
    let improvementArc = 'stable';
    if (trend.trend !== 'stable') {
      // Use trend analysis when available
      improvementArc = trend.trend; // 'improving' or 'declining'
    } else if (previousScore > 0) {
      // Backward-compatible: single previousScore comparison
      const delta = score - previousScore;
      if (delta >= 15) {
        improvementArc = 'improving';
      } else if (delta <= -15) {
        improvementArc = 'declining';
      }
    }

    const answerQuality = score >= 80 ? 'strong' : score >= 65 ? 'medium' : 'weak';
    // For behavioral/HR, hedging words are normal speech patterns, not genuine uncertainty.
    // The action (confidence_rebuild) is already suppressed for behavioral/HR;
    // the label must also reflect this — 'low' only applies to DSA/system-design.
    const confidence = (lowConfidenceSignals && interviewType !== 'hr' && interviewType !== 'behavioral')
      ? 'low'
      : score >= 75 ? 'high' : score >= 50 ? 'medium' : 'low';
    const depth = depthSignals ? 'deep' : 'shallow';

    return {
      answerQuality,
      missedConcepts: [...new Set(missedConcepts)],
      confidence,
      depth,
      branchReason,
      nextAction,
      improvementArc,
      codeSignals,
      starAnalysis,
      scoreTrend: trend,
      // NEW: Adaptive follow-up difficulty
      adaptiveFollowUpDifficulty: adaptiveDifficulty.newDifficulty,
      adaptiveDifficultyMetadata: {
        change: adaptiveDifficulty.change,
        reason: adaptiveDifficulty.reason,
        trajectory: adaptiveDifficulty.trajectory,
        rollingAverage: adaptiveDifficulty.rollingAverage,
      },
    };
  }

  /**
   * Public method: Calculate adaptive follow-up difficulty for external use.
   * Can be called independently to determine next follow-up difficulty without full branch analysis.
   * 
   * @param {Array} scoreHistory - [{ score, turn }, ...] sorted by turn
   * @param {string} currentFollowUpDifficulty - 'basic', 'intermediate', 'advanced'
   * @param {object} scoreTrend - Pre-computed trend from calculateTrendFromHistory
   * @returns {object} { newDifficulty, change, reason, trajectory, rollingAverage }
   */
  static getAdaptiveFollowUpDifficulty(scoreHistory, currentFollowUpDifficulty, scoreTrend) {
    return calculateAdaptiveFollowUpDifficulty(scoreHistory, currentFollowUpDifficulty, scoreTrend);
  }
}

export default InterviewFollowUpRulesService;
