import type {
  CodeSignals,
  StarAnalysis,
  FollowUpDecision,
  FollowUpBranchInput,
  ScoreTrendAnalysis,
  PerformanceMomentum,
} from '../types/interview.ts';
import { InterviewStateMachineService, areDifficultiesComparable } from './interviewStateMachine.js';

// ── Canonical Qualitative Recovery Phrasing ───────────────────────────
export const QUALITATIVE_RECOVERY_PHRASES: string[] = [
  "Much clearer breakdown this time — that shows strong adaptability.",
  "Good recovery on the trade-offs there; let's carry that forward.",
  "Solid adjustment on the complexity aspect. Let's keep exploring that.",
  "That clarifies the earlier ambiguity nicely. Good self-correction.",
  "Nicely turned around — your explanation of the core mechanics is much sharper.",
];

export const RECOVERY_PHRASES = QUALITATIVE_RECOVERY_PHRASES;

// ── Exclusion Guard Patterns ───────────────────────────────────────────
export const DONT_KNOW_REGEX = /\b(?:i\s*(?:don'?t|do\s*not)(?:\s+(?:really|actually|quite))?\s*know|not\s+(?:sure|quite\s+sure|certain|familiar)|no\s+idea|haven'?t\s+used|don'?t\s+remember|do\s*not\s+remember|can'?t\s+recall|cannot\s+recall|do\s*not\s+recall|don'?t\s+recall|no\s+clue|haven'?t\s+(?:implemented|worked)|have\s+not\s+(?:implemented|worked)|not\s+(?:very\s+)?familiar)\b/i;
export const CLARIFICATION_REGEX = /^(?:could\s+you|can\s+you|can\s+we|are\s+we|should\s+this|does\s+the|can\s+it|do\s+you\s+mean|what\s+do\s+you\s+mean|would\s+you|repeat|please\s+clarify)\b/i;
export const OFF_TOPIC_REGEX = /\b(?:hiking|crypto|bitcoin|ethereum|laptop battery|professor was|vacation|weather)\b/i;

// ── Invariant Validator: Zero Numeric Leaks ────────────────────────────
export function validatePhrasingHasZeroNumericLeaks(phrasing: string): boolean {
  if (typeof phrasing !== 'string') return false;
  if (/\d/.test(phrasing)) {
    throw new Error(`Numeric leak detected in qualitative phrasing: contains digit in "${phrasing}"`);
  }
  if (phrasing.includes('%')) {
    throw new Error(`Numeric leak detected in qualitative phrasing: contains % in "${phrasing}"`);
  }
  if (/\b(?:score|points?|delta|percent|out of 100|out of 10)\b/i.test(phrasing)) {
    throw new Error(`Numeric metric leak detected in qualitative phrasing in "${phrasing}"`);
  }
  return true;
}

// ── Dynamic Feature Flag Evaluation ───────────────────────────────────
export function isRecoveryBranchingEnabled(options: { forceEnabled?: boolean } = {}): boolean {
  if (typeof options?.forceEnabled === 'boolean') {
    return options.forceEnabled;
  }
  const flag1 = process.env.FEATURE_FLAG_RECOVERY_BRANCHING;
  const flag2 = process.env.FEATURE_AI_INTERVIEW_RECOVERY_BRANCHING;
  return flag1 === 'true' || flag1 === '1' || flag2 === 'true' || flag2 === '1';
}

// ── Qualitative Phrasing Selection & Rotation ──────────────────────────
export function getQualitativeRecoveryPhrase({
  turnNumber = 0,
  sessionSeed = 0,
  phraseIndex = null,
}: {
  turnNumber?: number;
  sessionSeed?: number | string;
  phraseIndex?: number | null;
} = {}): string {
  const phrases = QUALITATIVE_RECOVERY_PHRASES;
  let idx: number;
  if (typeof phraseIndex === 'number' && Number.isInteger(phraseIndex)) {
    idx = Math.abs(phraseIndex) % phrases.length;
  } else {
    let seed = 0;
    if (typeof sessionSeed === 'number' && Number.isFinite(sessionSeed)) {
      seed = Math.floor(sessionSeed);
    } else if (typeof sessionSeed === 'string' && sessionSeed.length > 0) {
      for (let i = 0; i < sessionSeed.length; i++) {
        seed = ((seed << 5) - seed + sessionSeed.charCodeAt(i)) | 0;
      }
    }
    const turn = Math.floor(Number(turnNumber || 0));
    idx = Math.abs(turn + seed) % phrases.length;
  }
  const phrase = phrases[idx];
  validatePhrasingHasZeroNumericLeaks(phrase);
  return phrase;
}

export function selectQualitativeRecoveryPhrase(args: {
  turnNumber?: number;
  turn?: number;
  sessionSeed?: number | string;
  sessionId?: string;
  phraseIndex?: number | null;
} = {}): string {
  return getQualitativeRecoveryPhrase({
    turnNumber: args.turnNumber ?? args.turn ?? 0,
    sessionSeed: args.sessionSeed ?? args.sessionId ?? 0,
    phraseIndex: args.phraseIndex ?? null,
  });
}

// ── Telemetry-Only Momentum Tracking ───────────────────────────────────
export function calculateMomentum(
  currentScore: number | null | undefined,
  previousScore: number | null | undefined,
  options: { isFirstTurn?: boolean; hasPriorScore?: boolean } = {}
): { momentum: PerformanceMomentum; delta: number } {
  if (
    previousScore === null ||
    previousScore === undefined ||
    !Number.isFinite(Number(previousScore)) ||
    options.isFirstTurn ||
    options.hasPriorScore === false
  ) {
    return { momentum: 'neutral', delta: 0 };
  }

  const curr = Number(currentScore || 0);
  const prev = Number(previousScore || 0);
  const delta = curr - prev;

  let momentum: PerformanceMomentum = 'neutral';
  if (delta >= 10) {
    momentum = 'positive';
  } else if (delta <= -10) {
    momentum = 'negative';
  }

  return { momentum, delta };
}

// ── Exclusion Guards ───────────────────────────────────────────────────
export function isTurnExcludedFromRecovery({
  candidateResponse = '',
  answerType = '',
  isSkipped = false,
  isClarification = false,
  turnType = '',
  score = null,
}: {
  candidateResponse?: string;
  answerType?: string;
  isSkipped?: boolean;
  isClarification?: boolean;
  turnType?: string;
  score?: number | null;
} = {}): boolean {
  if (isSkipped === true || turnType === 'skipped' || answerType === 'skipped') {
    return true;
  }
  if (isClarification === true || turnType === 'clarification' || answerType === 'clarification') {
    return true;
  }
  if (turnType === 'unscored') {
    return true;
  }
  if (answerType === 'dont_know' || answerType === 'off_topic' || answerType === 'stuck_silence') {
    return true;
  }

  const text = String(candidateResponse || '').trim();
  if (text.length < 5) {
    return true;
  }
  if (/^(?:skip|pass|next question)\b/i.test(text)) {
    return true;
  }
  if (DONT_KNOW_REGEX.test(text)) {
    return true;
  }
  if (CLARIFICATION_REGEX.test(text) || (text.endsWith('?') && text.length < 90 && !text.toLowerCase().includes('because'))) {
    return true;
  }
  if (OFF_TOPIC_REGEX.test(text)) {
    return true;
  }

  return false;
}

export const isExcludedFromRecovery = isTurnExcludedFromRecovery;

// ── Topic Equivalence Helper ───────────────────────────────────────────
export function isSameTopic(topicA?: string | null, topicB?: string | null): boolean {
  if (!topicA || !topicB) return false;
  const a = String(topicA).toLowerCase().trim();
  const b = String(topicB).toLowerCase().trim();
  return a === b || a.includes(b) || b.includes(a);
}

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
  static decideBranch(input: FollowUpBranchInput = {}): FollowUpDecision {
    const {
      analysis = {},
      interviewContext = {},
      candidateResponse = '',
      candidateCode = '',
      scoreHistory = [],
      scoreTrend = null,
    } = input;

    const score = Number(analysis.score || 0);

    // ── Resolve previous score ───────────────────────────────────────
    let prevScore: number | null = null;
    let hasExplicitPriorScore = false;

    if (typeof input.previousScore === 'number' && Number.isFinite(input.previousScore)) {
      prevScore = input.previousScore;
      hasExplicitPriorScore = true;
    } else if (typeof interviewContext.previousScore === 'number' && Number.isFinite(interviewContext.previousScore)) {
      prevScore = interviewContext.previousScore;
      hasExplicitPriorScore = true;
    } else if (Array.isArray(scoreHistory) && scoreHistory.length > 0) {
      const lastHistory = scoreHistory[scoreHistory.length - 1];
      const histScore = typeof lastHistory === 'number' ? lastHistory : lastHistory?.score;
      if (typeof histScore === 'number' && Number.isFinite(histScore)) {
        prevScore = histScore;
        hasExplicitPriorScore = true;
      }
    }

    const turnNumber = Number(
      input.turnNumber ??
      input.turnIndex ??
      interviewContext.turns ??
      interviewContext.turnNumber ??
      1
    );

    // Determine if this is Turn 1 baseline / uninitialized
    const isTurnOneBaseline =
      (!hasExplicitPriorScore && (!scoreHistory || scoreHistory.length === 0)) ||
      (turnNumber <= 1 && (!scoreHistory || scoreHistory.length === 0) && input.previousScore === undefined && interviewContext.hasPriorScore !== true && prevScore === 0);

    const hasValidPriorTurn = !isTurnOneBaseline && prevScore !== null;

    // ── Momentum Tracking (Telemetry-only) ────────────────────────────
    const { momentum, delta: momentumDelta } = calculateMomentum(score, prevScore, {
      isFirstTurn: isTurnOneBaseline,
      hasPriorScore: hasValidPriorTurn,
    });

    const interviewType = String(interviewContext.interviewType || '').toLowerCase();
    const missedConcepts: string[] = Array.isArray(analysis.nextFocus)
      ? [...analysis.nextFocus]
      : Array.isArray(interviewContext.missingAreas)
        ? [...interviewContext.missingAreas]
        : [];

    const responseText = String(candidateResponse || '').toLowerCase();
    const lowConfidenceSignals = /(not sure|i think|maybe|probably|guess|uncertain|not fully sure)/.test(responseText);

    const dsaDepthSignals = /(because|therefore|trade.?off|complexity|edge case|example)/.test(responseText);
    const behavioralDepthSignals = /(outcome|impact|result|measurable|\d+%|reduced|improved|led|managed|\d+ team)/.test(responseText);
    const depthSignals = (interviewType === 'behavioral' || interviewType === 'hr')
      ? (dsaDepthSignals || behavioralDepthSignals)
      : dsaDepthSignals;

    // ── Code signals ──────────────────────────────────────────────────
    const codeBlock = candidateCode || (String(candidateResponse || '').match(/---\s*code\s*---\n?([\s\S]*)/i)?.[1] || '');
    const codeSignals = extractCodeSignals(codeBlock);

    if (interviewType !== 'behavioral' && interviewType !== 'hr') {
      if (codeSignals && !codeSignals.hasErrorHandling) {
        missedConcepts.push('missing_error_handling');
      }
      if (codeSignals && !codeSignals.hasEdgeCases) {
        missedConcepts.push('missing_edge_cases');
      }
    }

    // ── STAR detection (behavioral/HR) ────────────────────────────────
    let starAnalysis: StarAnalysis | null = null;
    if (interviewType === 'behavioral' || interviewType === 'hr') {
      starAnalysis = detectStarComponents(responseText);
    }

    const trend: ScoreTrendAnalysis = scoreTrend || {
      mean: 0,
      stdDev: 0,
      trend: 'stable',
      volatility: 'stable',
      delta: 0,
    };

    // ── Recovery Branching Eligibility Check ──────────────────────────
    const forceEnabled = typeof input.forceEnabled === 'boolean'
      ? input.forceEnabled
      : typeof input.options?.forceEnabled === 'boolean'
        ? input.options.forceEnabled
        : undefined;

    const recoveryEnabled = isRecoveryBranchingEnabled({ forceEnabled });

    let isRecoveryEligible = false;
    let recoveryPhrase: string | undefined = undefined;

    if (recoveryEnabled && hasValidPriorTurn && prevScore !== null) {
      const isSkipped = Boolean(input.isSkipped ?? interviewContext.isSkipped);
      const isClarification = Boolean(input.isClarification ?? interviewContext.isClarification);
      const answerType = input.answerType ?? interviewContext.answerType ?? input.turnType ?? interviewContext.turnType;

      const isExcluded = isTurnExcludedFromRecovery({
        candidateResponse,
        answerType,
        isSkipped,
        isClarification,
        score,
      });

      if (!isExcluded) {
        const topic = input.topic || interviewContext.currentTopic || interviewContext.topic;
        const previousTopic = input.previousTopic || interviewContext.previousTopic || interviewContext.lastInterviewerTopic;

        const currentDifficulty =
          input.difficultyTier ||
          input.currentDifficulty ||
          interviewContext.currentDifficulty ||
          interviewContext.difficulty ||
          'medium';
        const previousDifficulty =
          input.previousDifficultyTier ||
          input.previousDifficulty ||
          interviewContext.previousDifficulty ||
          interviewContext.lastScoredDifficulty ||
          currentDifficulty;

        const topicMatches = Boolean(topic && previousTopic && isSameTopic(topic, previousTopic));
        const diffMatches = areDifficultiesComparable(previousDifficulty, currentDifficulty);

        // Same topic OR equivalent difficulty level
        const topicOrDifficultyEligible = (topic && previousTopic)
          ? (topicMatches || diffMatches)
          : diffMatches;

        const scoreJump = score - prevScore;
        const isGenuineScoreRecovery = prevScore < 50 && scoreJump > 15;

        if (topicOrDifficultyEligible && isGenuineScoreRecovery) {
          isRecoveryEligible = true;
          const phraseIndex = input.phraseIndex ?? input.options?.phraseIndex ?? null;
          const sessionSeed = input.sessionSeed ?? input.options?.sessionSeed ?? interviewContext.sessionId ?? interviewContext.sessionSeed ?? 0;
          recoveryPhrase = getQualitativeRecoveryPhrase({
            turnNumber,
            sessionSeed,
            phraseIndex,
          });
        }
      }
    }

    // ── Decision Flow ─────────────────────────────────────────────────
    let nextAction = 'deepen';
    let branchReason = 'high_quality_answer';
    let recoveryDetected = false;

    if (starAnalysis && !isStarComplete(starAnalysis)) {
      // 1. Behavioral/HR: incomplete STAR is highest priority
      nextAction = 'star_completion';
      const missing: string[] = [];
      if (!starAnalysis.hasSituation) missing.push('situation');
      if (!starAnalysis.hasTask) missing.push('task');
      if (!starAnalysis.hasAction) missing.push('action');
      if (!starAnalysis.hasResult) missing.push('result');
      branchReason = `incomplete_star_missing_${missing.join('_')}`;
    } else if (isRecoveryEligible) {
      // 2. Genuine recovery branch detected
      nextAction = 'affirm_recovery';
      branchReason = 'genuine_recovery_detected';
      recoveryDetected = true;
    } else if (trend.volatility === 'volatile' && scoreHistory.length >= 3) {
      // 3. Score volatility
      nextAction = 'volatility_scaffold';
      branchReason = 'volatile_score_pattern';
    } else if (score < 60 || missedConcepts.length > 1) {
      // 4. Missed concepts / low score
      nextAction = 'targeted_correction';
      branchReason = 'missed_core_concepts';
    } else if (lowConfidenceSignals && interviewType !== 'hr' && interviewType !== 'behavioral') {
      // 5. Low confidence signal
      nextAction = 'confidence_rebuild';
      branchReason = 'low_confidence_signal';
    } else if (!depthSignals) {
      // 6. Shallow explanation
      nextAction = 'depth_probe';
      branchReason = 'shallow_explanation';
    }

    // ── Improvement Arc Tracking ──────────────────────────────────────
    let improvementArc = 'stable';
    if (trend.trend !== 'stable') {
      improvementArc = trend.trend;
    } else if (hasValidPriorTurn && prevScore !== null && prevScore > 0) {
      const delta = score - prevScore;
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

    const numericHistory: number[] = Array.isArray(scoreHistory)
      ? scoreHistory.map((s: any) => (typeof s === 'number' ? s : Number(s?.score))).filter(Number.isFinite)
      : [];

    const adaptiveDifficulty = (InterviewStateMachineService as any).computeAdaptiveDifficulty({
      currentDifficulty: interviewContext.currentDifficulty || interviewContext.difficulty || 'medium',
      scoreHistory: numericHistory,
      recentScores: [...numericHistory, score],
      stuckCount: Number(interviewContext.stuckCount) || 0,
      interviewType,
    });

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
      adaptiveDifficulty,
      momentum,
      momentumDelta,
      recoveryDetected,
      recoveryPhrase,
      phrasing: recoveryPhrase,
    };
  }
}

export default InterviewFollowUpRulesService;
