import assert from 'node:assert/strict';
import {
  buildInitialVoiceTelemetry,
  buildVoiceTelemetrySnapshot,
} from '../utils/voiceTelemetry.js';

function run() {
  const initial = buildInitialVoiceTelemetry('Technical', 'full_realtime');
  assert.equal(initial.totalTurns, 1, 'initial totalTurns should be 1');
  assert.equal(initial.currentStage, 'Technical', 'initial stage should be captured');
  assert.equal(initial.realtimeMode, 'full_realtime', 'initial mode should be captured');

  const next = buildVoiceTelemetrySnapshot({
    previousTelemetry: initial,
    turnNumber: 2,
    previousStage: 'Technical',
    nextStage: 'HR',
    responseLatencyMs: 840,
    mode: 'full_realtime',
  });

  assert.equal(next.totalTurns, 2, 'totalTurns should advance with next turn');
  assert.equal(next.currentStage, 'HR', 'currentStage should reflect nextStage');
  assert.equal(next.stageTransitions.length, 1, 'stageTransitions should track stage changes');
  assert.equal(next.stageTransitions[0].from, 'Technical', 'transition from stage should be captured');
  assert.equal(next.stageTransitions[0].to, 'HR', 'transition to stage should be captured');
  assert.equal(next.lastResponseLatencyMs, 840, 'latency should capture last turn duration');
  assert.ok(next.averageResponseLatencyMs >= 420, 'average latency should be computed');

  const stable = buildVoiceTelemetrySnapshot({
    previousTelemetry: next,
    turnNumber: 3,
    previousStage: 'HR',
    nextStage: 'HR',
    responseLatencyMs: 700,
    mode: 'full_realtime',
  });

  assert.equal(stable.stageTransitions.length, 1, 'stageTransitions should not change when stage is stable');
  assert.equal(stable.totalTurns, 3, 'totalTurns should continue increasing');

  console.log('Voice telemetry tests passed');
}

run();
