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
      stageHistory: [
        {
          stage: firstStage.key,
          atTurn: 0,
          reason: 'session_initialized',
        },
      ],
    };
  }

  static advanceState(state = {}) {
    const stagePlan = Array.isArray(state.stagePlan) && state.stagePlan.length > 0
      ? state.stagePlan
      : this.buildStagePlan(state.interviewType);
    const turns = Number.isFinite(Number(state.turns)) ? Number(state.turns) : 0;
    const totalQuestions = Number.isFinite(Number(state.totalQuestions)) && state.totalQuestions > 0
      ? Number(state.totalQuestions)
      : null;
    const previousStage = String(state.stage || 'intake');
    const nextStage = resolveNextStage(turns, totalQuestions);
    const stageIndex = Math.max(0, stagePlan.findIndex((stage) => stage.key === nextStage));
    const stageMeta = stagePlan[stageIndex] || stagePlan[0] || { key: 'intake', label: 'Intake & Setup' };
    const transitionReason = deriveTransitionReason(previousStage, stageMeta.key, turns);

    const stageHistory = Array.isArray(state.stageHistory) ? [...state.stageHistory] : [];
    const shouldAppendHistory = stageHistory.length === 0 || stageHistory[stageHistory.length - 1]?.stage !== stageMeta.key;
    if (shouldAppendHistory) {
      stageHistory.push({
        stage: stageMeta.key,
        atTurn: turns,
        reason: transitionReason,
      });
    }

    return {
      ...state,
      stagePlan,
      stageIndex,
      stage: stageMeta.key,
      stageLabel: stageMeta.label,
      transitionReason,
      stageHistory,
    };
  }

  static buildStageDirective(stage = 'intake', interviewType = 'dsa') {
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
}
