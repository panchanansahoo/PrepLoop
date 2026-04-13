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
