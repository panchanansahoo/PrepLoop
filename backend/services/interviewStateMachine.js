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

function resolveNextStage(turns = 0) {
  if (turns >= 12) return 'feedback';
  if (turns >= 10) return 'challenge';
  if (turns >= 7) return 'followup';
  if (turns >= 3) return 'technical';
  if (turns >= 1) return 'warmup';
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
  if (nextStage === 'feedback') return turns >= 12 ? 'final_turn_threshold' : 'manual_wrapup';
  return 'state_transition';
}

export class InterviewStateMachineService {
  static buildStagePlan(interviewType = 'dsa') {
    const normalizedType = String(interviewType || 'dsa').toLowerCase();
    return normalizedType === 'behavioral' ? BEHAVIORAL_STAGE_PLAN : BASE_STAGE_PLAN;
  }

  static createInitialState(interviewType = 'dsa', difficulty = 'medium', companyFocus = null) {
    const stagePlan = this.buildStagePlan(interviewType);
    const firstStage = stagePlan[0] || { key: 'intake', label: 'Intake & Setup' };
    return {
      interviewType,
      difficulty,
      companyFocus,
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
    const previousStage = String(state.stage || 'intake');
    const nextStage = resolveNextStage(turns);
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
      return 'Validate baseline understanding and ask a single low-friction follow-up.';
    }

    if (normalizedStage === 'technical') {
      return normalizedType === 'behavioral'
        ? 'Probe for concrete STAR details and measurable impact.'
        : 'Deepen technical reasoning around complexity, architecture, and trade-offs.';
    }

    if (normalizedStage === 'followup') {
      return 'Probe one missing area from the previous answer and require concrete evidence.';
    }

    if (normalizedStage === 'challenge') {
      return 'Increase pressure with a harder variant, but keep scope focused to one primary question.';
    }

    return 'Wrap up with concise feedback and one improvement action.';
  }
}
