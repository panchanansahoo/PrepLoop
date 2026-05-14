export function getPredictivePromptCandidates({
  interviewType = '',
  answerDraft = '',
  telemetryStage = '',
  averageResponseLatencyMs = null,
} = {}) {
  const normalizedType = String(interviewType || '').toLowerCase();
  const normalizedDraft = String(answerDraft || '').toLowerCase();
  const normalizedStage = String(telemetryStage || '').toLowerCase();
  const latencyMs = Number.isFinite(Number(averageResponseLatencyMs))
    ? Number(averageResponseLatencyMs)
    : null;

  const candidates = [
    'Can you share a concrete example for that?',
    'What was the measurable impact of that decision?',
  ];

  if (normalizedType === 'coding' || normalizedType === 'dsa') {
    candidates.push('Can you walk through the time and space complexity?');
  } else if (normalizedType === 'system-design') {
    candidates.push('How would this design behave at 10x scale?');
  } else if (normalizedType === 'behavioral') {
    candidates.push('What did you learn from that experience?');
  }

  if (/trade\s?off|edge\s?case|complexity/.test(normalizedDraft)) {
    candidates.push('Good direction. What trade-off did you choose and why?');
  }

  if (normalizedStage === 'intro' || normalizedStage === 'warmup') {
    candidates.push('What constraints did you clarify before starting?');
  }

  if (latencyMs !== null && latencyMs >= 10000) {
    candidates.push('Can you summarize your approach in one sentence before details?');
  }

  return Array.from(new Set(candidates));
}
