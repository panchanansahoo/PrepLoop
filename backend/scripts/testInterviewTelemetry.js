import assert from 'node:assert/strict';
import { InterviewSimulatorService } from '../services/aiService.js';

function run() {
  const telemetry = InterviewSimulatorService._buildInterviewTelemetrySnapshot({
    previousTelemetry: {
      totalTurns: 2,
      stageTransitions: [
        { from: 'intake', to: 'warmup', atTurn: 1 },
      ],
      averageResponseLatencyMs: 900,
      groundingHitRate: 0.5,
    },
    turnNumber: 3,
    previousStage: 'warmup',
    nextStage: 'technical',
    responseLatencyMs: 1200,
    groundingUsed: true,
    analysisScore: 78,
  });

  assert.equal(telemetry.totalTurns, 3, 'totalTurns should increment per response');
  assert.equal(telemetry.stageTransitions.length, 2, 'stageTransitions should append when stage changes');
  assert.equal(telemetry.stageTransitions[1].from, 'warmup', 'transition should preserve previous stage');
  assert.equal(telemetry.stageTransitions[1].to, 'technical', 'transition should capture next stage');
  assert.equal(telemetry.stageTransitions[1].atTurn, 3, 'transition should capture turn number');
  assert.ok(telemetry.stageTransitions[1].timestamp, 'transition should include timestamp');
  assert.equal(telemetry.lastResponseLatencyMs, 1200, 'lastResponseLatencyMs should capture latest latency');
  assert.ok(telemetry.averageResponseLatencyMs >= 900, 'averageResponseLatencyMs should be recalculated');
  assert.equal(telemetry.groundingHitRate, 0.67, 'groundingHitRate should be rounded to 2 decimals');
  assert.equal(telemetry.latestAnalysisScore, 78, 'latestAnalysisScore should capture analysis score');
  assert.equal(telemetry.groundingHits, 2, 'groundingHits should increase when grounding is used');
  assert.ok(telemetry.lastUpdatedAt, 'lastUpdatedAt should always be present');

  const noTransition = InterviewSimulatorService._buildInterviewTelemetrySnapshot({
    previousTelemetry: telemetry,
    turnNumber: 4,
    previousStage: 'technical',
    nextStage: 'technical',
    responseLatencyMs: 1000,
    groundingUsed: false,
    analysisScore: 72,
  });

  assert.equal(noTransition.stageTransitions.length, 2, 'stageTransitions should not grow if stage remains same');
  assert.equal(noTransition.totalTurns, 4, 'totalTurns should keep increasing');
  assert.equal(noTransition.groundingHitRate, 0.5, 'groundingHitRate should update using all turns');
  assert.equal(noTransition.groundingHits, 2, 'groundingHits should remain unchanged when grounding is not used');

  console.log('Interview telemetry tests passed');
}

run();
