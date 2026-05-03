import { describe, it, expect, beforeEach } from 'vitest';
import { InterviewTelemetryService } from '../services/interviewTelemetryService.js';

describe('InterviewTelemetryService', () => {
  let telemetryService;

  beforeEach(() => {
    telemetryService = new InterviewTelemetryService();
  });

  describe('buildInterviewTelemetrySnapshot - Core Metrics', () => {
    it('should initialize with default values', () => {
      const snapshot = telemetryService.buildInterviewTelemetrySnapshot({});
      expect(snapshot.totalTurns).toBe(1);
      expect(snapshot.averageResponseLatencyMs).toBe(0);
      expect(snapshot.groundingHitRate).toBe(0);
    });

    it('should increment turn count correctly', () => {
      const snapshot1 = telemetryService.buildInterviewTelemetrySnapshot({
        turnNumber: 1,
        responseLatencyMs: 100,
      });
      expect(snapshot1.totalTurns).toBe(1);

      const snapshot2 = telemetryService.buildInterviewTelemetrySnapshot({
        previousTelemetry: snapshot1,
        turnNumber: 2,
        responseLatencyMs: 150,
      });
      expect(snapshot2.totalTurns).toBe(2);
      expect(snapshot2.averageResponseLatencyMs).toBe(125);
    });

    it('should track grounding hits and calculate hit rate', () => {
      const snapshot1 = telemetryService.buildInterviewTelemetrySnapshot({
        turnNumber: 1,
        groundingUsed: true,
      });
      expect(snapshot1.groundingHits).toBe(1);
      expect(snapshot1.groundingHitRate).toBe(1);

      const snapshot2 = telemetryService.buildInterviewTelemetrySnapshot({
        previousTelemetry: snapshot1,
        turnNumber: 2,
        groundingUsed: false,
      });
      expect(snapshot2.groundingHits).toBe(1);
      expect(snapshot2.groundingHitRate).toBe(0.5);
    });

    it('should track stage transitions with timestamps', () => {
      const snapshot1 = telemetryService.buildInterviewTelemetrySnapshot({
        turnNumber: 1,
        nextStage: 'intake',
      });
      expect(snapshot1.stageTransitions.length).toBe(0);

      const snapshot2 = telemetryService.buildInterviewTelemetrySnapshot({
        previousTelemetry: snapshot1,
        turnNumber: 2,
        previousStage: 'intake',
        nextStage: 'warmup',
      });
      expect(snapshot2.stageTransitions.length).toBe(1);
      expect(snapshot2.stageTransitions[0]).toEqual({
        from: 'intake',
        to: 'warmup',
        atTurn: 2,
        timestamp: expect.any(String),
      });
    });

    it('should not track transition when stage does not change', () => {
      const snapshot1 = telemetryService.buildInterviewTelemetrySnapshot({
        turnNumber: 1,
        nextStage: 'technical',
      });

      const snapshot2 = telemetryService.buildInterviewTelemetrySnapshot({
        previousTelemetry: snapshot1,
        turnNumber: 2,
        previousStage: 'technical',
        nextStage: 'technical',
      });
      expect(snapshot2.stageTransitions.length).toBe(0);
    });
  });

  describe('buildInterviewTelemetrySnapshot - Voice Metrics', () => {
    it('should track voice provider metrics', () => {
      const snapshot = telemetryService.buildInterviewTelemetrySnapshot({
        voiceProvider: 'kokoro',
        voiceLatencyMs: 500,
        voiceFallback: false,
      });
      expect(snapshot.voiceMetrics).toHaveLength(1);
      expect(snapshot.voiceMetrics[0]).toEqual({
        provider: 'kokoro',
        latencyMs: 500,
        fallback: false,
        stage: undefined,
        timestamp: expect.any(String),
      });
    });

    it('should track fallback count and rate', () => {
      let snapshot = telemetryService.buildInterviewTelemetrySnapshot({
        voiceProvider: 'kokoro',
        voiceLatencyMs: 400,
        voiceFallback: false,
      });
      expect(snapshot.fallbackCount).toBe(0);
      expect(snapshot.fallbackRate).toBe(0);

      snapshot = telemetryService.buildInterviewTelemetrySnapshot({
        previousTelemetry: snapshot,
        voiceProvider: 'groq',
        voiceLatencyMs: 300,
        voiceFallback: true,
      });
      expect(snapshot.fallbackCount).toBe(1);
      expect(snapshot.fallbackRate).toBe(0.5);

      snapshot = telemetryService.buildInterviewTelemetrySnapshot({
        previousTelemetry: snapshot,
        voiceProvider: 'edge-tts',
        voiceLatencyMs: 200,
        voiceFallback: true,
      });
      expect(snapshot.fallbackCount).toBe(2);
      expect(Number(snapshot.fallbackRate.toFixed(2))).toBe(0.67);
    });

    it('should calculate voice average latency across providers', () => {
      let snapshot = telemetryService.buildInterviewTelemetrySnapshot({
        voiceProvider: 'kokoro',
        voiceLatencyMs: 400,
      });

      snapshot = telemetryService.buildInterviewTelemetrySnapshot({
        previousTelemetry: snapshot,
        voiceProvider: 'groq',
        voiceLatencyMs: 200,
      });

      expect(snapshot.voiceAverageLatencyMs).toBe(300);
    });

    it('should associate voice metrics with stages', () => {
      let snapshot = telemetryService.buildInterviewTelemetrySnapshot({
        nextStage: 'intake',
        voiceProvider: 'kokoro',
        voiceLatencyMs: 500,
      });

      snapshot = telemetryService.buildInterviewTelemetrySnapshot({
        previousTelemetry: snapshot,
        previousStage: 'intake',
        nextStage: 'warmup',
        voiceProvider: 'groq',
        voiceLatencyMs: 300,
      });

      expect(snapshot.voiceMetrics[0].stage).toBe('intake');
      expect(snapshot.voiceMetrics[1].stage).toBe('warmup');
    });
  });

  describe('buildInterviewTelemetrySnapshot - Feedback Quality', () => {
    it('should track feedback quality signals', () => {
      const snapshot = telemetryService.buildInterviewTelemetrySnapshot({
        feedbackQualitySignal: 85,
      });
      expect(snapshot.feedbackQualityHistory).toHaveLength(1);
      expect(snapshot.feedbackQualityHistory[0]).toEqual({
        turn: 1,
        signal: 85,
        stage: undefined,
        timestamp: expect.any(String),
      });
    });

    it('should calculate feedback quality average', () => {
      let snapshot = telemetryService.buildInterviewTelemetrySnapshot({
        feedbackQualitySignal: 80,
      });

      snapshot = telemetryService.buildInterviewTelemetrySnapshot({
        previousTelemetry: snapshot,
        feedbackQualitySignal: 90,
      });

      expect(snapshot.feedbackQualityAverage).toBe(85);
    });

    it('should ignore null feedback quality signals', () => {
      let snapshot = telemetryService.buildInterviewTelemetrySnapshot({
        feedbackQualitySignal: 80,
      });

      snapshot = telemetryService.buildInterviewTelemetrySnapshot({
        previousTelemetry: snapshot,
        feedbackQualitySignal: null,
      });

      expect(snapshot.feedbackQualityHistory).toHaveLength(1);
      expect(snapshot.feedbackQualityAverage).toBe(80);
    });
  });

  describe('buildInterviewTelemetrySnapshot - Dropoff Tracking', () => {
    it('should track user dropoff reason and timestamp', () => {
      const snapshot = telemetryService.buildInterviewTelemetrySnapshot({
        userDropoffReason: 'user_interrupted',
      });
      expect(snapshot.userDropoffReason).toBe('user_interrupted');
      expect(snapshot.droppedAt).toBeTruthy();
    });

    it('should not set dropoff data when no reason provided', () => {
      const snapshot = telemetryService.buildInterviewTelemetrySnapshot({});
      expect(snapshot.userDropoffReason).toBeNull();
      expect(snapshot.droppedAt).toBeNull();
    });
  });

  describe('getStageLatencyStats', () => {
    it('should compute per-stage latency statistics', () => {
      const telemetry = {
        voiceMetrics: [
          { stage: 'intake', latencyMs: 400, fallback: false },
          { stage: 'intake', latencyMs: 600, fallback: false },
          { stage: 'warmup', latencyMs: 300, fallback: false },
          { stage: 'warmup', latencyMs: 500, fallback: true },
        ],
      };

      const stats = telemetryService.getStageLatencyStats(telemetry);
      expect(stats.intake).toEqual({
        avgLatencyMs: 500,
        minLatencyMs: 400,
        maxLatencyMs: 600,
        count: 2,
        fallbackCount: 0,
        fallbackRate: 0,
      });
      expect(stats.warmup).toEqual({
        avgLatencyMs: 400,
        minLatencyMs: 300,
        maxLatencyMs: 500,
        count: 2,
        fallbackCount: 1,
        fallbackRate: 0.5,
      });
    });

    it('should handle empty telemetry gracefully', () => {
      const stats = telemetryService.getStageLatencyStats({});
      expect(stats).toEqual({});
    });

    it('should handle missing voiceMetrics gracefully', () => {
      const stats = telemetryService.getStageLatencyStats({ voiceMetrics: null });
      expect(stats).toEqual({});
    });
  });

  describe('estimateScoringConsistency', () => {
    it('should return null for insufficient data', () => {
      expect(telemetryService.estimateScoringConsistency([])).toBeNull();
      expect(telemetryService.estimateScoringConsistency([{ score: 80 }])).toBeNull();
      expect(telemetryService.estimateScoringConsistency(null)).toBeNull();
    });

    it('should return high consistency for uniform scores', () => {
      const history = [
        { score: 80 },
        { score: 80 },
        { score: 80 },
      ];
      const consistency = telemetryService.estimateScoringConsistency(history);
      expect(consistency).toBe(1);
    });

    it('should return lower consistency for varied scores', () => {
      const history = [
        { score: 60 },
        { score: 80 },
        { score: 100 },
      ];
      const consistency = telemetryService.estimateScoringConsistency(history);
      expect(consistency).toBeGreaterThan(0);
      expect(consistency).toBeLessThan(1);
    });

    it('should normalize by mean score', () => {
      const lowScores = [
        { score: 10 },
        { score: 20 },
        { score: 30 },
      ];
      const highScores = [
        { score: 70 },
        { score: 80 },
        { score: 90 },
      ];

      const consistencyLow = telemetryService.estimateScoringConsistency(lowScores);
      const consistencyHigh = telemetryService.estimateScoringConsistency(highScores);

      // Both have same stdDev (10), but high scores have lower relative variance
      expect(consistencyHigh).toBeGreaterThan(consistencyLow);
    });
  });

  describe('Complex Multi-Turn Interview Scenarios', () => {
    it('should aggregate complete interview telemetry', () => {
      let snapshot = telemetryService.buildInterviewTelemetrySnapshot({
        turnNumber: 1,
        nextStage: 'intake',
        responseLatencyMs: 200,
        voiceProvider: 'kokoro',
        voiceLatencyMs: 500,
        feedbackQualitySignal: 75,
      });

      snapshot = telemetryService.buildInterviewTelemetrySnapshot({
        previousTelemetry: snapshot,
        turnNumber: 2,
        previousStage: 'intake',
        nextStage: 'warmup',
        responseLatencyMs: 300,
        groundingUsed: true,
        voiceProvider: 'groq',
        voiceLatencyMs: 400,
        voiceFallback: false,
        feedbackQualitySignal: 82,
        analysisScore: 75,
      });

      snapshot = telemetryService.buildInterviewTelemetrySnapshot({
        previousTelemetry: snapshot,
        turnNumber: 3,
        previousStage: 'warmup',
        nextStage: 'technical',
        responseLatencyMs: 450,
        groundingUsed: true,
        voiceProvider: 'edge-tts',
        voiceLatencyMs: 350,
        voiceFallback: false,
        feedbackQualitySignal: 88,
        analysisScore: 78,
      });

      // Verify aggregation
      expect(snapshot.totalTurns).toBe(3);
      expect(snapshot.stageTransitions).toHaveLength(2);
      expect(snapshot.groundingHits).toBe(2);
      expect(snapshot.groundingHitRate).toEqual(2 / 3);
      expect(snapshot.voiceMetrics).toHaveLength(3);
      expect(snapshot.fallbackCount).toBe(0);
      expect(snapshot.feedbackQualityHistory).toHaveLength(3);
      expect(snapshot.feedbackQualityAverage).toBe(Math.round((75 + 82 + 88) / 3 * 10) / 10);
      expect(snapshot.latestAnalysisScore).toBe(78);
    });

    it('should detect and track interview abandonment', () => {
      let snapshot = telemetryService.buildInterviewTelemetrySnapshot({
        turnNumber: 1,
        nextStage: 'intake',
        responseLatencyMs: 200,
      });

      snapshot = telemetryService.buildInterviewTelemetrySnapshot({
        previousTelemetry: snapshot,
        turnNumber: 2,
        previousStage: 'intake',
        nextStage: 'warmup',
        userDropoffReason: 'connection_lost',
      });

      expect(snapshot.userDropoffReason).toBe('connection_lost');
      expect(snapshot.droppedAt).toBeTruthy();
      expect(snapshot.totalTurns).toBe(2);
    });
  });

  describe('Edge Cases & Data Validation', () => {
    it('should handle negative latencies gracefully', () => {
      const snapshot = telemetryService.buildInterviewTelemetrySnapshot({
        responseLatencyMs: -100,
        voiceLatencyMs: -50,
      });
      expect(snapshot.lastResponseLatencyMs).toBe(0);
      expect(snapshot.voiceAverageLatencyMs).toBe(0);
    });

    it('should handle non-numeric values gracefully', () => {
      const snapshot = telemetryService.buildInterviewTelemetrySnapshot({
        responseLatencyMs: 'not a number',
        turnNumber: 'abc',
        analysisScore: { invalid: true },
      });
      expect(snapshot.lastResponseLatencyMs).toBe(0);
      expect(snapshot.totalTurns).toBe(1);
      expect(snapshot.latestAnalysisScore).toBe(0);
    });

    it('should preserve previous telemetry arrays when not providing new data', () => {
      let snapshot = telemetryService.buildInterviewTelemetrySnapshot({
        voiceProvider: 'kokoro',
        voiceLatencyMs: 400,
        feedbackQualitySignal: 80,
      });
      const initialVoiceCount = snapshot.voiceMetrics.length;
      const initialFeedbackCount = snapshot.feedbackQualityHistory.length;

      snapshot = telemetryService.buildInterviewTelemetrySnapshot({
        previousTelemetry: snapshot,
        turnNumber: 2,
        // No voice or feedback data this turn
      });
      expect(snapshot.voiceMetrics).toHaveLength(initialVoiceCount);
      expect(snapshot.feedbackQualityHistory).toHaveLength(initialFeedbackCount);
    });
  });
});
