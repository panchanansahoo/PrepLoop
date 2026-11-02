import { describe, it, expect } from 'vitest';
import {
  buildInitialVoiceTelemetry,
  buildVoiceTelemetrySnapshot,
} from '../../utils/voiceTelemetry.js';
import { InterviewSimulatorService } from '../../services/aiService.js';

describe('Voice & Interview Telemetry Aggregation', () => {
  it('builds initial voice telemetry with proper stage and realtime mode', () => {
    const initial = buildInitialVoiceTelemetry('Technical', 'full_realtime');
    expect(initial.totalTurns).toBe(1);
    expect(initial.currentStage).toBe('Technical');
    expect(initial.realtimeMode).toBe('full_realtime');
  });

  it('tracks voice telemetry transitions and computes average latency', () => {
    const initial = buildInitialVoiceTelemetry('Technical', 'full_realtime');
    const next = buildVoiceTelemetrySnapshot({
      previousTelemetry: initial,
      turnNumber: 2,
      previousStage: 'Technical',
      nextStage: 'HR',
      responseLatencyMs: 840,
      mode: 'full_realtime',
    });

    expect(next.totalTurns).toBe(2);
    expect(next.currentStage).toBe('HR');
    expect(next.stageTransitions).toHaveLength(1);
    expect(next.stageTransitions[0].from).toBe('Technical');
    expect(next.stageTransitions[0].to).toBe('HR');
    expect(next.lastResponseLatencyMs).toBe(840);
    expect(next.averageResponseLatencyMs).toBeGreaterThanOrEqual(420);

    const stable = buildVoiceTelemetrySnapshot({
      previousTelemetry: next,
      turnNumber: 3,
      previousStage: 'HR',
      nextStage: 'HR',
      responseLatencyMs: 700,
      mode: 'full_realtime',
    });

    expect(stable.stageTransitions).toHaveLength(1);
    expect(stable.totalTurns).toBe(3);
  });

  it('computes interview simulation telemetry snapshots, grounding hit rates and latency updates', () => {
    const telemetry = InterviewSimulatorService._buildInterviewTelemetrySnapshot({
      previousTelemetry: {
        totalTurns: 2,
        stageTransitions: [{ from: 'intake', to: 'warmup', atTurn: 1 }],
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

    expect(telemetry.totalTurns).toBe(3);
    expect(telemetry.stageTransitions).toHaveLength(2);
    expect(telemetry.stageTransitions[1].from).toBe('warmup');
    expect(telemetry.stageTransitions[1].to).toBe('technical');
    expect(telemetry.stageTransitions[1].atTurn).toBe(3);
    expect(telemetry.stageTransitions[1].timestamp).toBeDefined();
    expect(telemetry.lastResponseLatencyMs).toBe(1200);
    expect(telemetry.averageResponseLatencyMs).toBeGreaterThanOrEqual(900);
    expect(telemetry.groundingHitRate).toBe(0.67);
    expect(telemetry.latestAnalysisScore).toBe(78);
    expect(telemetry.groundingHits).toBe(2);
    expect(telemetry.lastUpdatedAt).toBeDefined();

    const noTransition = InterviewSimulatorService._buildInterviewTelemetrySnapshot({
      previousTelemetry: telemetry,
      turnNumber: 4,
      previousStage: 'technical',
      nextStage: 'technical',
      responseLatencyMs: 1000,
      groundingUsed: false,
      analysisScore: 72,
    });

    expect(noTransition.stageTransitions).toHaveLength(2);
    expect(noTransition.totalTurns).toBe(4);
    expect(noTransition.groundingHitRate).toBe(0.5);
    expect(noTransition.groundingHits).toBe(2);
  });
});

