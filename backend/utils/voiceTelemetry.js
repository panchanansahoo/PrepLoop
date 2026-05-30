function asNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function buildInitialVoiceTelemetry(stage = 'Technical', mode = 'full_realtime') {
  return {
    totalTurns: 1,
    currentStage: String(stage || 'Technical'),
    realtimeMode: String(mode || 'full_realtime'),
    stageTransitions: [],
    lastResponseLatencyMs: 0,
    averageResponseLatencyMs: 0,
    lastUpdatedAt: new Date().toISOString(),
  };
}

export function buildVoiceTelemetrySnapshot({
  previousTelemetry = {},
  turnNumber = 1,
  previousStage = null,
  nextStage = null,
  responseLatencyMs = 0,
  mode = 'full_realtime',
} = {}) {
  const safeTurn = Math.max(1, Math.floor(asNumber(turnNumber, 1)));
  const priorTurns = Math.max(0, Math.floor(asNumber(previousTelemetry.totalTurns, safeTurn - 1)));
  const effectiveTurns = Math.max(safeTurn, priorTurns + 1);

  const safeLatency = Math.max(0, asNumber(responseLatencyMs, 0));
  const priorAverage = Math.max(0, asNumber(previousTelemetry.averageResponseLatencyMs, 0));
  const averageResponseLatencyMs = Number(
    ((priorAverage * priorTurns + safeLatency) / effectiveTurns).toFixed(1)
  );

  const stageTransitions = Array.isArray(previousTelemetry.stageTransitions)
    ? [...previousTelemetry.stageTransitions]
    : [];

  const fromStage = String(previousStage || previousTelemetry.currentStage || '').trim();
  const toStage = String(nextStage || previousTelemetry.currentStage || 'Technical').trim();

  if (fromStage && toStage && fromStage !== toStage) {
    stageTransitions.push({
      from: fromStage,
      to: toStage,
      atTurn: effectiveTurns,
      timestamp: new Date().toISOString(),
    });
  }

  return {
    totalTurns: effectiveTurns,
    currentStage: toStage || 'Technical',
    realtimeMode: String(mode || previousTelemetry.realtimeMode || 'full_realtime'),
    stageTransitions,
    lastResponseLatencyMs: safeLatency,
    averageResponseLatencyMs,
    lastUpdatedAt: new Date().toISOString(),
  };
}

// Backwards-compatible aliases
export const _buildVoiceTelemetrySnapshot = buildVoiceTelemetrySnapshot;
export const _buildInitialVoiceTelemetry = buildInitialVoiceTelemetry;
