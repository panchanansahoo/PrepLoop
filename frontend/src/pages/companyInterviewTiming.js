export const AUTO_SUBMIT_DELAY_MS = 4000;
export const SILENCE_TO_NEXT_QUESTION_MS = 10000;
export const VOICE_INPUT_COMMIT_DELAY_MS = 180;

export function buildVoiceAnswerSnapshot({
  userInput = '',
  accumulatedTranscript = '',
  interimText = '',
} = {}) {
  const typed = String(userInput || '').trim();
  const committed = String(accumulatedTranscript || '').trim();
  const interim = String(interimText || '').trim();

  if (typed) return typed;

  const combined = `${committed} ${interim}`.trim();
  if (combined) return combined;

  return '';
}

export function formatInterviewDuration(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const minutes = Math.floor(safeSeconds / 60).toString().padStart(2, '0');
  const seconds = (safeSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}
