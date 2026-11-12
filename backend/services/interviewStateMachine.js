const BASE_STAGE_PLAN = [
  { key: 'intake', label: 'Intake & Setup' },
  { key: 'warmup', label: 'Warmup' },
  { key: 'technical', label: 'Core Round' },
  { key: 'followup', label: 'Follow-up Probing' },
  { key: 'challenge', label: 'Challenge Round' },
  { key: 'feedback', label: 'Feedback & Wrap-up' },
];

const BEHAVIORAL_STAGE_PLAN = [
  { key: 'intake', label: 'Intake & Setup' },
  { key: 'warmup', label: 'Warmup' },
  { key: 'technical', label: 'Story Deep-Dive' },
  { key: 'followup', label: 'Leadership Probing' },
  { key: 'challenge', label: 'Pressure Scenario' },
  { key: 'feedback', label: 'Feedback & Wrap-up' },
];

const HR_STAGE_PLAN = [
  { key: 'intake', label: 'Introduction' },
  { key: 'warmup', label: 'Background & Motivation' },
  { key: 'technical', label: 'Culture Fit & Values' },
  { key: 'followup', label: 'Situational Probing' },
  { key: 'challenge', label: 'Scenario Challenge' },
  { key: 'feedback', label: 'Feedback & Wrap-up' },
];

const SYSTEM_DESIGN_STAGE_PLAN = [
  { key: 'intake', label: 'Intake & Clarification' },
  { key: 'warmup', label: 'Requirements Gathering' },
  { key: 'technical', label: 'Architecture Design' },
  { key: 'followup', label: 'Deep-Dive Probing' },
  { key: 'challenge', label: 'Scale & Edge Cases' },
  { key: 'feedback', label: 'Feedback & Wrap-up' },
];

// ── Proportional stage thresholds (as % of totalQuestions) ────────────
// Ratio = turns / totalQuestions. Evaluated top-down; first match wins.
// Boundaries designed for natural pacing across 5–20 question interviews.
const PROPORTIONAL_THRESHOLDS = [
  [0.90, 'feedback'],    // Last ~10% → wrap-up (turn 12+ of 13)
  [0.75, 'challenge'],   // 75–90% → challenge round (turn 10+ of 13)
  [0.50, 'followup'],    // 50–75% → follow-up probing (turn 7+ of 13)
  [0.20, 'technical'],   // 20–50% → core round (turn 3+ of 13)
  [0.01, 'warmup'],      // 1–20% → warmup (turn 1+ of 13)
  [0.00, 'intake'],      // 0% → intake (turn 0)
];

export const DIFFICULTY_TIERS = ['easy', 'medium', 'hard', 'staff_architectural'];

export function getDifficultyTierIndex(difficulty = 'medium') {
  const norm = String(difficulty || 'medium').toLowerCase().trim();
  const index = DIFFICULTY_TIERS.indexOf(norm);
  return index >= 0 ? index : 1; // Default to medium (index 1)
}

export function areDifficultiesComparable(diffA, diffB) {
  const idxA = getDifficultyTierIndex(diffA);
  const idxB = getDifficultyTierIndex(diffB);
  return Math.abs(idxA - idxB) <= 1;
}

export function normalizeScoreByDifficulty(rawScore, difficulty = 'medium') {
  if (rawScore === null || rawScore === undefined) return null;
  const numScore = Number(rawScore);
  if (!Number.isFinite(numScore)) return null;

  const clamped = Math.max(0, Math.min(100, numScore));
  const normDiff = String(difficulty || 'medium').toLowerCase().trim();

  switch (normDiff) {
    case 'easy':
      // Multiplier 0.70 with cap 70 ensures easy questions cannot score >= 85
      return Math.min(70, Math.round(clamped * 0.70));
    case 'hard':
      // Multiplier 1.15 with cap 100
      return Math.min(100, Math.round(clamped * 1.15));
    case 'staff_architectural':
      // Multiplier 1.25 with cap 100
      return Math.min(100, Math.round(clamped * 1.25));
    case 'medium':
    default:
      return Math.min(100, Math.max(0, Math.round(clamped * 1.00)));
  }
}

export function isTurnExcludedFromStreaks(turn = {}) {
  if (turn.isSkipped === true || turn.answerType === 'skipped' || turn.turnType === 'skipped') {
    return true;
  }
  if (turn.isClarification === true || turn.answerType === 'clarification' || turn.turnType === 'clarification') {
    return true;
  }
  if (turn.isUnscored === true || turn.turnType === 'unscored') {
    return true;
  }
  if (turn.score === null || turn.score === undefined) {
    return true;
  }
  const score = Number(turn.score);
  return !Number.isFinite(score);
}

export function isAdaptivePacingEnabled(options = {}) {
  if (typeof options?.forceEnabled === 'boolean') {
    return options.forceEnabled;
  }
  const flag1 = process.env.FEATURE_FLAG_ADAPTIVE_STATE_MACHINE;
  const flag2 = process.env.FEATURE_AI_INTERVIEW_ADAPTIVE_PACING;
  return flag1 === 'true' || flag1 === '1' || flag2 === 'true' || flag2 === '1';
}

// Legacy fixed thresholds for backward compatibility (no totalQuestions)
function resolveNextStageLegacy(turns = 0) {
  if (turns >= 12) return 'feedback';
  if (turns >= 10) return 'challenge';
  if (turns >= 7) return 'followup';
  if (turns >= 3) return 'technical';
  if (turns >= 1) return 'warmup';
  return 'intake';
}

/**
 * Resolve the next stage using proportional thresholds based on totalQuestions.
 * Falls back to legacy fixed thresholds when totalQuestions is not available.
 */
function resolveNextStage(turns = 0, totalQuestions = null) {
  const total = Number.isFinite(Number(totalQuestions)) && totalQuestions > 0
    ? Number(totalQuestions)
    : null;

  if (!total) {
    return resolveNextStageLegacy(turns);
  }

  const ratio = turns / total;
  for (const [threshold, stage] of PROPORTIONAL_THRESHOLDS) {
    if (ratio >= threshold) return stage;
  }
  return 'intake';
}

function deriveTransitionReason(previousStage, nextStage, turns) {
  if (previousStage === nextStage) {
    return `remain_${nextStage}`;
  }

  if (nextStage === 'warmup') return 'post_intake_transition';
  if (nextStage === 'technical') return 'turn_threshold_technical';
  if (nextStage === 'followup') return 'turn_threshold_followup';
  if (nextStage === 'challenge') return 'turn_threshold_challenge';
  if (nextStage === 'feedback') return turns >= 12 ? 'final_turn_threshold' : 'proportional_wrapup';
  return 'state_transition';
}

export class InterviewStateMachineService {
  static buildStagePlan(interviewType = 'dsa') {
    const normalizedType = String(interviewType || 'dsa').toLowerCase();
    if (normalizedType === 'behavioral') return BEHAVIORAL_STAGE_PLAN;
    if (normalizedType === 'hr') return HR_STAGE_PLAN;
    if (normalizedType === 'system_design' || normalizedType === 'system-design') return SYSTEM_DESIGN_STAGE_PLAN;
    return BASE_STAGE_PLAN;
  }

  static createInitialState(interviewType = 'dsa', difficulty = 'medium', companyFocus = null, totalQuestions = null) {
    const stagePlan = this.buildStagePlan(interviewType);
    const firstStage = stagePlan[0] || { key: 'intake', label: 'Intake & Setup' };
    return {
      interviewType,
      difficulty,
      companyFocus,
      totalQuestions: Number.isFinite(Number(totalQuestions)) && totalQuestions > 0 ? Number(totalQuestions) : null,
      turns: 0,
      stagePlan,
      stageIndex: 0,
      stage: firstStage.key,
      stageLabel: firstStage.label,
      transitionReason: 'session_initialized',
      consecutiveLowScores: 0,
      consecutiveHighScores: 0,
      lastScoredDifficulty: null,
      scaffoldingActive: false,
      scaffoldingAction: 'NONE',
      skipChallenge: false,
      shouldExtendTechnical: false,
      extendedTurnsCount: 0,
      isTerminated: false,
      stageHistory: [
        {
          stage: firstStage.key,
          atTurn: 0,
          reason: 'session_initialized',
        },
      ],
    };
  }

  static advanceState(state = {}, options = {}) {
    const {
      score: _s,
      rawScore: _rs,
      currentScore: _cs,
      isSkipped: _sk,
      isClarification: _cl,
      isUnscored: _un,
      answerType: _at,
      turnType: _tt,
      ...cleanState
    } = state;

    const stagePlan = Array.isArray(cleanState.stagePlan) && cleanState.stagePlan.length > 0
      ? cleanState.stagePlan
      : this.buildStagePlan(cleanState.interviewType);
    const turns = Number.isFinite(Number(cleanState.turns)) ? Number(cleanState.turns) : 0;
    const totalQuestions = Number.isFinite(Number(cleanState.totalQuestions)) && cleanState.totalQuestions > 0
      ? Number(cleanState.totalQuestions)
      : null;
    const previousStage = String(cleanState.stage || 'intake');

    // Check dynamic runtime feature flag
    const adaptiveEnabled = isAdaptivePacingEnabled({
      forceEnabled: options?.forceEnabled ?? cleanState?.forceEnabled,
    });

    if (!adaptiveEnabled) {
      // Exact backward-compatible proportional stage progression
      const nextStage = resolveNextStage(turns, totalQuestions);
      const stageIndex = Math.max(0, stagePlan.findIndex((stage) => stage.key === nextStage));
      const stageMeta = stagePlan[stageIndex] || stagePlan[0] || { key: 'intake', label: 'Intake & Setup' };
      const transitionReason = deriveTransitionReason(previousStage, stageMeta.key, turns);

      const stageHistory = Array.isArray(cleanState.stageHistory) ? [...cleanState.stageHistory] : [];
      const shouldAppendHistory = stageHistory.length === 0 || stageHistory[stageHistory.length - 1]?.stage !== stageMeta.key;
      if (shouldAppendHistory) {
        stageHistory.push({
          stage: stageMeta.key,
          atTurn: turns,
          reason: transitionReason,
        });
      }

      return {
        ...cleanState,
        stagePlan,
        stageIndex,
        stage: stageMeta.key,
        stageLabel: stageMeta.label,
        transitionReason,
        stageHistory,
        consecutiveLowScores: cleanState.consecutiveLowScores ?? 0,
        consecutiveHighScores: cleanState.consecutiveHighScores ?? 0,
        lastScoredDifficulty: cleanState.lastScoredDifficulty ?? null,
        scaffoldingActive: cleanState.scaffoldingActive ?? false,
        scaffoldingAction: cleanState.scaffoldingAction ?? 'NONE',
        skipChallenge: cleanState.skipChallenge ?? false,
        shouldExtendTechnical: cleanState.shouldExtendTechnical ?? false,
        extendedTurnsCount: cleanState.extendedTurnsCount ?? 0,
        isTerminated: cleanState.isTerminated ?? false,
      };
    }

    // ── ADAPTIVE PACING (Milestone 2 - Features 9–14) ────────────────────

    // Rule 1: Inviolable Global Hard Turn Budget Ceiling (Feature 13)
    if (totalQuestions !== null && turns >= totalQuestions) {
      const feedbackIndex = Math.max(0, stagePlan.findIndex((s) => s.key === 'feedback'));
      const stageMeta = stagePlan[feedbackIndex] || { key: 'feedback', label: 'Feedback & Wrap-up' };
      const transitionReason = 'hard_turn_budget_ceiling_reached';

      const stageHistory = Array.isArray(cleanState.stageHistory) ? [...cleanState.stageHistory] : [];
      const lastHistory = stageHistory[stageHistory.length - 1];
      const shouldAppendHistory = stageHistory.length === 0
        || lastHistory?.stage !== stageMeta.key
        || lastHistory?.reason !== transitionReason;

      if (shouldAppendHistory) {
        stageHistory.push({
          stage: stageMeta.key,
          atTurn: turns,
          reason: transitionReason,
        });
      }

      return {
        ...cleanState,
        stagePlan,
        stageIndex: feedbackIndex,
        stage: stageMeta.key,
        stageLabel: stageMeta.label,
        transitionReason,
        stageHistory,
        consecutiveLowScores: cleanState.consecutiveLowScores ?? 0,
        consecutiveHighScores: cleanState.consecutiveHighScores ?? 0,
        lastScoredDifficulty: cleanState.lastScoredDifficulty ?? null,
        scaffoldingActive: false,
        scaffoldingAction: 'NONE',
        skipChallenge: Boolean(cleanState.skipChallenge),
        shouldExtendTechnical: false,
        extendedTurnsCount: cleanState.extendedTurnsCount ?? 0,
        isTerminated: true,
      };
    }

    // Turn parameters extraction from options or state
    const rawScoreInput = options.score !== undefined
      ? options.score
      : options.rawScore !== undefined
        ? options.rawScore
        : state.score !== undefined
          ? state.score
          : state.rawScore !== undefined
            ? state.rawScore
            : state.currentScore !== undefined
              ? state.currentScore
              : null;

    const diffInput = options.difficultyTier
      || options.difficulty
      || state.currentDifficulty
      || state.difficulty
      || cleanState.currentDifficulty
      || cleanState.difficulty
      || 'medium';

    const isSkippedInput = Boolean(
      options.isSkipped !== undefined
        ? options.isSkipped
        : options.answerType === 'skipped' || options.turnType === 'skipped'
          ? true
          : state.isSkipped || state.answerType === 'skipped' || state.turnType === 'skipped'
    );

    const isClarificationInput = Boolean(
      options.isClarification !== undefined
        ? options.isClarification
        : options.answerType === 'clarification' || options.turnType === 'clarification'
          ? true
          : (options.score !== undefined ? false : state.isClarification || state.answerType === 'clarification' || state.turnType === 'clarification')
    );

    const isUnscoredInput = Boolean(
      options.isUnscored !== undefined
        ? options.isUnscored
        : options.turnType === 'unscored'
          ? true
          : (options.score !== undefined ? false : state.isUnscored || state.turnType === 'unscored')
    );

    const turnData = {
      score: rawScoreInput,
      difficulty: diffInput,
      isSkipped: isSkippedInput,
      isClarification: isClarificationInput,
      isUnscored: isUnscoredInput,
      answerType: options.answerType || (options.score !== undefined ? undefined : state.answerType),
      turnType: options.turnType || (options.score !== undefined ? undefined : state.turnType),
    };

    const isExcluded = isTurnExcludedFromStreaks(turnData);

    let consecutiveLowScores = cleanState.consecutiveLowScores ?? 0;
    let consecutiveHighScores = cleanState.consecutiveHighScores ?? 0;
    let lastScoredDifficulty = cleanState.lastScoredDifficulty ?? null;
    let skipChallenge = Boolean(cleanState.skipChallenge);
    let scaffoldingActive = Boolean(cleanState.scaffoldingActive);
    let scaffoldingAction = cleanState.scaffoldingAction || 'NONE';
    let shouldExtendTechnical = Boolean(cleanState.shouldExtendTechnical);
    let extendedTurnsCount = Number(cleanState.extendedTurnsCount || 0);

    if (!isExcluded) {
      const rawScore = Number(turnData.score);
      const diffTier = String(turnData.difficulty || 'medium').toLowerCase();
      const normalizedScore = normalizeScoreByDifficulty(rawScore, diffTier);

      if (rawScore < 40) {
        // Consecutive low score check on comparable difficulty (|tierIndex1 - tierIndex2| <= 1)
        if (lastScoredDifficulty && areDifficultiesComparable(lastScoredDifficulty, diffTier)) {
          consecutiveLowScores += 1;
        } else {
          consecutiveLowScores = 1;
        }
        consecutiveHighScores = 0;
        lastScoredDifficulty = diffTier;
      } else if (normalizedScore !== null && normalizedScore >= 85 && diffTier !== 'easy') {
        // High score on non-trivial difficulty (normalized score >= 85 and tier !== 'easy')
        consecutiveHighScores += 1;
        consecutiveLowScores = 0;
        lastScoredDifficulty = diffTier;
      } else if (diffTier === 'easy' && rawScore >= 85) {
        // High score on easy question: MUST NEVER increment consecutiveHighScores
        // Preserves existing consecutiveHighScores, resets low score streak
        consecutiveLowScores = 0;
        lastScoredDifficulty = diffTier;
      } else {
        // Neutral score (40 <= score < 85, or easy question in 40..84): resets both streaks
        consecutiveLowScores = 0;
        consecutiveHighScores = 0;
        lastScoredDifficulty = diffTier;
      }

      // Update scaffolding action based on low score streak
      if (consecutiveLowScores >= 2) {
        skipChallenge = true;
        scaffoldingActive = true;
        shouldExtendTechnical = true;
        if (consecutiveLowScores === 2) {
          scaffoldingAction = 'BREAKDOWN_QUESTION';
        } else {
          scaffoldingAction = 'PROGRESSIVE_HINT';
        }
      } else if (rawScore >= 40) {
        // Recovery clears active scaffolding and technical extension flag
        scaffoldingActive = false;
        scaffoldingAction = 'NONE';
        shouldExtendTechnical = false;
      }
    }

    // ── Stage Progression Resolution ─────────────────────────────────────
    const baseNextStage = resolveNextStage(turns, totalQuestions);
    let nextStage = baseNextStage;
    let transitionReason;

    // Check High-Score Early Challenge Acceleration (Feature 11)
    if (consecutiveHighScores >= 3 && previousStage !== 'challenge' && previousStage !== 'feedback') {
      nextStage = 'challenge';
      transitionReason = 'sustained_high_scores_early_challenge';
    } else if (previousStage === 'challenge' && baseNextStage !== 'feedback') {
      // Once advanced to challenge, remain in challenge until feedback or budget ceiling
      nextStage = 'challenge';
      transitionReason = 'remain_challenge';
    } else if (consecutiveLowScores >= 2 && (previousStage === 'technical' || baseNextStage === 'technical') && baseNextStage !== 'feedback') {
      // Check Low-Score Stage Extension (Feature 10)
      if (baseNextStage !== 'technical') {
        // Normal schedule reached followup, extend technical by up to 2 turns
        if (extendedTurnsCount < 2) {
          extendedTurnsCount += 1;
          nextStage = 'technical';
          transitionReason = 'consecutive_low_scores_scaffolding_extension';
        } else {
          nextStage = baseNextStage;
          transitionReason = deriveTransitionReason(previousStage, nextStage, turns);
        }
      } else {
        // Currently within technical stage with active low-score scaffolding extension
        nextStage = 'technical';
        transitionReason = 'consecutive_low_scores_scaffolding_extension';
      }
    } else if (baseNextStage === 'challenge' && skipChallenge) {
      // Challenge Stage Skip (Feature 10)
      // Struggling candidate skips challenge stage and remains in followup
      nextStage = 'followup';
      transitionReason = 'pacing_skip_challenge';
    } else {
      // Default proportional transition or remain
      nextStage = baseNextStage;
      transitionReason = deriveTransitionReason(previousStage, nextStage, turns);
    }

    const stageIndex = Math.max(0, stagePlan.findIndex((stage) => stage.key === nextStage));
    const stageMeta = stagePlan[stageIndex] || stagePlan[0] || { key: 'intake', label: 'Intake & Setup' };

    const stageHistory = Array.isArray(cleanState.stageHistory) ? [...cleanState.stageHistory] : [];
    const lastHistory = stageHistory[stageHistory.length - 1];
    const shouldAppendHistory = stageHistory.length === 0
      || lastHistory?.stage !== stageMeta.key
      || (transitionReason === 'sustained_high_scores_early_challenge' && lastHistory?.reason !== transitionReason);

    if (shouldAppendHistory) {
      stageHistory.push({
        stage: stageMeta.key,
        atTurn: turns,
        reason: transitionReason,
      });
    }

    return {
      ...cleanState,
      stagePlan,
      stageIndex,
      stage: stageMeta.key,
      stageLabel: stageMeta.label,
      transitionReason,
      stageHistory,
      consecutiveLowScores,
      consecutiveHighScores,
      lastScoredDifficulty,
      scaffoldingActive,
      scaffoldingAction,
      skipChallenge,
      shouldExtendTechnical,
      extendedTurnsCount,
      isTerminated: false,
    };
  }

  static buildStageDirective(stage = 'intake', interviewType = 'dsa', options = {}) {
    if (options?.scaffoldingAction === 'BREAKDOWN_QUESTION') {
      return 'The candidate is struggling. Break down the problem into smaller sub-problems and guide them step-by-step.';
    }
    if (options?.scaffoldingAction === 'PROGRESSIVE_HINT') {
      return 'The candidate is stuck. Provide a progressive conceptual hint to guide them forward without revealing the full solution.';
    }

    const normalizedStage = String(stage || 'intake').toLowerCase();
    const normalizedType = String(interviewType || 'dsa').toLowerCase();

    if (normalizedStage === 'intake') {
      return 'Set expectations, confirm constraints, and ask one narrow kickoff question.';
    }

    if (normalizedStage === 'warmup') {
      if (normalizedType === 'hr') return 'Explore motivation, background, and career goals with a supportive tone.';
      return 'Validate baseline understanding and ask a single low-friction follow-up.';
    }

    if (normalizedStage === 'technical') {
      if (normalizedType === 'behavioral') return 'Probe for concrete STAR details and measurable impact.';
      if (normalizedType === 'hr') return 'Assess cultural fit, values alignment, and team collaboration style.';
      if (normalizedType === 'system_design' || normalizedType === 'system-design') {
        return 'Guide the candidate through high-level architecture, data flow, and component selection.';
      }
      return 'Deepen technical reasoning around complexity, architecture, and trade-offs.';
    }

    if (normalizedStage === 'followup') {
      if (normalizedType === 'hr') return 'Probe with situational questions to reveal decision-making and conflict resolution style.';
      if (normalizedType === 'system_design' || normalizedType === 'system-design') {
        return 'Deep-dive into specific component choices, database schema, and API design decisions.';
      }
      return 'Probe one missing area from the previous answer and require concrete evidence.';
    }

    if (normalizedStage === 'challenge') {
      if (normalizedType === 'hr') return 'Present a challenging workplace scenario and evaluate judgment under pressure.';
      if (normalizedType === 'system_design' || normalizedType === 'system-design') {
        return 'Challenge with extreme scale, failure modes, and ask for specific bottleneck mitigations.';
      }
      return 'Increase pressure with a harder variant, but keep scope focused to one primary question.';
    }

    return 'Wrap up with concise feedback and one improvement action.';
  }

  static computeAdaptiveDifficulty({
    currentDifficulty = 'medium',
    scoreHistory = [],
    recentScores = [],
    stuckCount = 0,
    interviewType: _interviewType = 'dsa',
  } = {}) {
    const DIFFICULTY_TIERS = ['easy', 'medium', 'hard', 'staff_architectural'];
    const normDiff = String(currentDifficulty || 'medium').toLowerCase();
    const currentIndex = Math.max(0, DIFFICULTY_TIERS.indexOf(normDiff));
    const scores = (recentScores.length > 0 ? recentScores : scoreHistory).filter(Number.isFinite);

    if (scores.length === 0) {
      return {
        difficulty: currentDifficulty,
        direction: 'maintain',
        reason: 'initial_turn',
        recommendedDifficulty: currentDifficulty,
      };
    }

    const recentThree = scores.slice(-3);
    const avgRecent = recentThree.reduce((a, b) => a + b, 0) / recentThree.length;
    const latest = scores[scores.length - 1];

    // Candidate struggling or stuck -> scaffold and step down difficulty
    if (stuckCount >= 2 || (latest < 55 && avgRecent < 60)) {
      const newIndex = Math.max(0, currentIndex - 1);
      const newDifficulty = DIFFICULTY_TIERS[newIndex];
      return {
        difficulty: newDifficulty,
        direction: newIndex < currentIndex ? 'step_down' : 'floor',
        reason: stuckCount >= 2 ? 'stuck_scaffolding' : 'struggling_remedial',
        recommendedDifficulty: newDifficulty,
      };
    }

    // Candidate excelling consistently -> challenge and step up difficulty
    if (scores.length >= 2 && avgRecent >= 82 && latest >= 80) {
      const newIndex = Math.min(DIFFICULTY_TIERS.length - 1, currentIndex + 1);
      const newDifficulty = DIFFICULTY_TIERS[newIndex];
      return {
        difficulty: newDifficulty,
        direction: newIndex > currentIndex ? 'step_up' : 'ceiling',
        reason: 'mastery_demonstrated',
        recommendedDifficulty: newDifficulty,
      };
    }

    return {
      difficulty: currentDifficulty,
      direction: 'maintain',
      reason: 'steady_performance',
      recommendedDifficulty: currentDifficulty,
    };
  }

  static normalizeScoreByDifficulty(rawScore, difficulty = 'medium') {
    return normalizeScoreByDifficulty(rawScore, difficulty);
  }

  static areDifficultiesComparable(diffA, diffB) {
    return areDifficultiesComparable(diffA, diffB);
  }

  static isTurnExcludedFromStreaks(turn = {}) {
    return isTurnExcludedFromStreaks(turn);
  }

  static isAdaptivePacingEnabled(options = {}) {
    return isAdaptivePacingEnabled(options);
  }
}
