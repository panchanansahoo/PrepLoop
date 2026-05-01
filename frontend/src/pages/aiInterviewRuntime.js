export const SUPPORTED_INTERVIEW_RUNTIME_MODES = ['full_realtime'];

export const DEFAULT_INTERVIEW_RUNTIME_MODE = 'full_realtime';

export function isStrictRealtimeMode(interviewRuntimeMode) {
  return interviewRuntimeMode === DEFAULT_INTERVIEW_RUNTIME_MODE;
}

export function getInteractionFormat(interviewRuntimeMode) {
  return isStrictRealtimeMode(interviewRuntimeMode) ? 'voice' : 'text';
}

export function getSupportedInterviewRuntimeModes() {
  return [...SUPPORTED_INTERVIEW_RUNTIME_MODES];
}

export function getDefaultInterviewRuntimeMode() {
  return DEFAULT_INTERVIEW_RUNTIME_MODE;
}

export function buildRealtimeFailureMessage(reason) {
  const normalizedReason = typeof reason === 'string' && reason.trim().length > 0
    ? reason.trim()
    : 'Realtime voice infrastructure is unavailable right now.';

  return `Realtime interview could not start. ${normalizedReason}`;
}

export function buildFollowUpRecoveryBundle({
  stage = 'Technical',
  experienceLevel = 'fresher',
} = {}) {
  const normalizedStage = String(stage || 'Technical').trim();
  const isFresher = String(experienceLevel || '').trim().toLowerCase() === 'fresher';

  if (normalizedStage === 'HR' || normalizedStage === 'Behavioral') {
    return {
      feedback: "Thanks for sharing that. Let's keep this practical and structured.",
      nextQuestion: 'Can you walk me through a real situation where you handled a challenge and what you learned from it?',
    };
  }

  if (normalizedStage === 'System Design') {
    return {
      feedback: isFresher
        ? 'Nice attempt. Let\'s shape your answer with clearer system blocks.'
        : 'Solid direction. Let\'s sharpen the architecture decisions.',
      nextQuestion: 'Can you break your design into core components and explain one trade-off you would make for scalability?',
    };
  }

  if (normalizedStage === 'DSA / Coding') {
    return {
      feedback: 'Good start. Let\'s make the solution more interview-ready.',
      nextQuestion: 'How would you optimize this approach for time and space complexity, and what trade-offs would you accept?',
    };
  }

  return {
    feedback: isFresher
      ? 'Good effort. Let\'s tighten the answer with one concrete example.'
      : 'Good signal. Let\'s deepen this with stronger reasoning.',
    nextQuestion: 'Can you explain your approach step-by-step with one real-world example and one trade-off?',
  };
}

const ADAPTIVE_DIFFICULTY_LEVELS = new Set(['easy', 'medium', 'hard']);

export function getAdaptiveCoachingSignal(payload = {}) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const adaptivePayload = payload.adaptive_update && typeof payload.adaptive_update === 'object'
    ? payload.adaptive_update
    : {};

  const adaptiveNote = [
    payload.adaptiveNote,
    adaptivePayload.note,
    adaptivePayload.message,
  ]
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .find((value) => value.length > 0) || '';

  const difficultyLevel = [
    payload.difficultyLevel,
    adaptivePayload.level,
    adaptivePayload.difficulty,
  ]
    .map((value) => String(value || '').trim().toLowerCase())
    .find((value) => ADAPTIVE_DIFFICULTY_LEVELS.has(value)) || null;

  if (!adaptiveNote && !difficultyLevel) {
    return null;
  }

  return {
    adaptiveNote,
    difficultyLevel,
  };
}

export function describeDifficultyLevel(level) {
  if (level === 'hard') return 'Challenge Up';
  if (level === 'medium') return 'Balanced';
  if (level === 'easy') return 'Reinforcement';
  return 'Adaptive';
}

export function buildAdaptiveTimelineEntries(conversation = []) {
  if (!Array.isArray(conversation)) {
    return [];
  }

  let turn = 0;

  return conversation
    .filter((message) => message && message.role === 'feedback' && message.adaptiveSignal)
    .map((message) => {
      turn += 1;
      const signal = message.adaptiveSignal || {};
      const difficultyLevel = String(signal.difficultyLevel || '').trim().toLowerCase() || null;

      return {
        id: `adaptive-${turn}`,
        turn,
        difficultyLevel,
        difficultyLabel: describeDifficultyLevel(difficultyLevel),
        adaptiveNote: String(signal.adaptiveNote || '').trim(),
      };
    })
    .filter((entry) => entry.adaptiveNote.length > 0 || entry.difficultyLevel);
}

function toAdaptiveDifficultyValue(level) {
  if (level === 'easy') return 3;
  if (level === 'medium') return 6;
  if (level === 'hard') return 9;
  return 5;
}

export function buildAdaptiveSparklineData(entries = [], { width = 112, height = 26 } = {}) {
  if (!Array.isArray(entries) || entries.length === 0) {
    return {
      path: '',
      points: [],
      minValue: null,
      maxValue: null,
    };
  }

  const values = entries.map((entry) => toAdaptiveDifficultyValue(entry.difficultyLevel));
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const span = Math.max(1, maxValue - minValue);

  const points = entries.map((entry, index) => {
    const value = toAdaptiveDifficultyValue(entry.difficultyLevel);
    const x = entries.length === 1
      ? 0
      : Math.round((index / (entries.length - 1)) * width);
    const y = maxValue === minValue
      ? Math.round(height / 2)
      : Math.round((1 - ((value - minValue) / span)) * height);

    return {
      id: entry.id || `adaptive-point-${index + 1}`,
      x,
      y,
      value,
      turn: entry.turn || index + 1,
    };
  });

  const path = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  return {
    path,
    points,
    minValue,
    maxValue,
  };
}

export function buildAdaptivePointTooltip(entry = {}) {
  const turn = Number(entry.turn) || 0;
  const difficultyLabel = String(entry.difficultyLabel || 'Adaptive').trim();
  const adaptiveNote = String(entry.adaptiveNote || '').trim();

  if (!adaptiveNote) {
    return `Turn ${turn}: ${difficultyLabel}`;
  }

  return `Turn ${turn}: ${difficultyLabel} — ${adaptiveNote}`;
}

function normalizeCodeForSubmission(value) {
  return String(value || '').replace(/\r\n/g, '\n').trim();
}

export function hasMeaningfulCode(code = '', { boilerplate = '' } = {}) {
  const normalizedCode = normalizeCodeForSubmission(code);
  const normalizedBoilerplate = normalizeCodeForSubmission(boilerplate);

  if (!normalizedCode) {
    return false;
  }

  return !normalizedBoilerplate || normalizedCode !== normalizedBoilerplate;
}

export function resolveSubmittedAnswer({
  providedAnswer = '',
  userInput = '',
  transcript = '',
  code = '',
  boilerplate = '',
} = {}) {
  const normalizedProvidedAnswer = typeof providedAnswer === 'string'
    ? providedAnswer.trim()
    : '';

  const answer = [normalizedProvidedAnswer, userInput, transcript]
    .map((value) => String(value || '').trim())
    .find((value) => value.length > 0) || '';
  const normalizedCode = hasMeaningfulCode(code, { boilerplate })
    ? normalizeCodeForSubmission(code)
    : '';

  return {
    answer,
    fullAnswer: normalizedCode && answer
      ? `${answer}\n\n--- Code ---\n${normalizedCode}`
      : normalizedCode
        ? `--- Code ---\n${normalizedCode}`
        : answer,
  };
}
