import {
  CodeSignals,
  StarAnalysis,
  FollowUpDecision,
  FollowUpBranchInput,
  ScoreTrendAnalysis,
} from '../types/interview.js';

// ── STAR detection helpers (behavioral interviews) ────────────────────
const STAR_PATTERNS = {
  situation: /(in that situation|the context was|we were facing|at that time|when we|the problem was|the challenge was)/i,
  task: /(my task was|i was responsible for|my role was|i needed to|i had to|was assigned to)/i,
  action: /(i took the action|i decided to|i implemented|i led|i created|i built|i organized|i initiated|the action i took|i worked on|i designed)/i,
  result: /(the result was|as a result|the outcome|this led to|we achieved|we reduced|we improved|the impact|this resulted in|uptime|reduced by|increased by)/i,
};

function detectStarComponents(text: string): StarAnalysis {
  const lower = String(text || '').toLowerCase();
  return {
    hasSituation: STAR_PATTERNS.situation.test(lower),
    hasTask: STAR_PATTERNS.task.test(lower),
    hasAction: STAR_PATTERNS.action.test(lower),
    hasResult: STAR_PATTERNS.result.test(lower),
  };
}

function isStarComplete(star: StarAnalysis): boolean {
  // Complete STAR: at least 3 of 4 components present (situation is often implied)
  const count = [star.hasSituation, star.hasTask, star.hasAction, star.hasResult]
    .filter(Boolean).length;
  return count >= 3;
}

// ── Code quality signal extraction ────────────────────────────────────
function extractCodeSignals(code: string): CodeSignals | null {
  if (!code || typeof code !== 'string' || code.trim().length < 10) {
    return null;
  }

  const lower = code.toLowerCase();
  return {
    hasErrorHandling: /(try|catch|except|throw|raise|if.*error|if.*null|if.*none|if.*undefined|if.*!|\.catch)/.test(lower),
    hasEdgeCases: /(edge case|boundary|empty|null|undefined|zero|negative|overflow|underflow)/.test(lower),
    hasComments: /(\/\/|#\s|\/\*|"""|''')/.test(code),
    hasFunctions: /(function |def |=>|const \w+ = \(|class )/.test(code),
    lineCount: code.split('\n').length,
  };
}

export class InterviewFollowUpRulesService {
  static decideBranch({
    analysis = {},
    interviewContext = {},
    candidateResponse = '',
    candidateCode = '',
    scoreHistory = [],
    scoreTrend = null,
  }: FollowUpBranchInput = {}): FollowUpDecision {
    const score = Number(analysis.score || 0);
    const previousScore = Number(interviewContext.previousScore || 0);
    const interviewType = String(interviewContext.interviewType || '').toLowerCase();
    const missedConcepts: string[] = Array.isArray(analysis.nextFocus)
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
    const codeBlock = candidateCode || (candidateResponse.match(/---\s*code\s*---\n?([\s\S]*)/i)?.[1] || '');
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
    let starAnalysis: StarAnalysis | null = null;
    if (interviewType === 'behavioral' || interviewType === 'hr') {
      starAnalysis = detectStarComponents(responseText);
    }

    // ── Score trend analysis (sliding window) ─────────────────────────
    const trend: ScoreTrendAnalysis = scoreTrend || {
      mean: 0,
      stdDev: 0,
      trend: 'stable',
      volatility: 'stable',
      delta: 0,
    };

    // ── Determine next action ─────────────────────────────────────────
    let nextAction = 'deepen';
    let branchReason = 'high_quality_answer';

    if (starAnalysis && !isStarComplete(starAnalysis)) {
      nextAction = 'star_completion';
      const missing: string[] = [];
      if (!starAnalysis.hasSituation) missing.push('situation');
      if (!starAnalysis.hasTask) missing.push('task');
      if (!starAnalysis.hasAction) missing.push('action');
      if (!starAnalysis.hasResult) missing.push('result');
      branchReason = `incomplete_star_missing_${missing.join('_')}`;
    } else if (trend.volatility === 'volatile' && scoreHistory.length >= 3) {
      nextAction = 'volatility_scaffold';
      branchReason = 'volatile_score_pattern';
    } else if (score < 60 || missedConcepts.length > 1) {
      nextAction = 'targeted_correction';
      branchReason = 'missed_core_concepts';
    } else if (lowConfidenceSignals && interviewType !== 'hr' && interviewType !== 'behavioral') {
      nextAction = 'confidence_rebuild';
      branchReason = 'low_confidence_signal';
    } else if (!depthSignals) {
      nextAction = 'depth_probe';
      branchReason = 'shallow_explanation';
    }

    // ── Improvement arc tracking (enhanced with trend data) ───────────
    let improvementArc = 'stable';
    if (trend.trend !== 'stable') {
      improvementArc = trend.trend;
    } else if (previousScore > 0) {
      const delta = score - previousScore;
      if (delta >= 15) {
        improvementArc = 'improving';
      } else if (delta <= -15) {
        improvementArc = 'declining';
      }
    }

    const answerQuality: 'strong' | 'medium' | 'weak' = score >= 80 ? 'strong' : score >= 65 ? 'medium' : 'weak';
    const confidence: 'high' | 'medium' | 'low' = (lowConfidenceSignals && interviewType !== 'hr' && interviewType !== 'behavioral')
      ? 'low'
      : score >= 75 ? 'high' : score >= 50 ? 'medium' : 'low';
    const depth: 'deep' | 'shallow' = depthSignals ? 'deep' : 'shallow';

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
    };
  }
}

export default InterviewFollowUpRulesService;

