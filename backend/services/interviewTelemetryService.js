const SPAN_STATUS_OK = 1;
const SPAN_STATUS_ERROR = 2;

function asNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asInt(value, fallback = 0) {
  return Math.floor(asNumber(value, fallback));
}

async function loadOpenTelemetryTraceApi() {
  try {
    const otel = await import('@opentelemetry/api');
    return otel?.trace || null;
  } catch {
    return null;
  }
}

export class InterviewTelemetryService {
  constructor({ tracer = null, traceApiLoader = loadOpenTelemetryTraceApi } = {}) {
    this.tracer = tracer;
    this.traceApiLoader = traceApiLoader;
    this._traceApiPromise = null;
  }

  async _getTracer() {
    if (this.tracer) {
      return this.tracer;
    }

    if (!this._traceApiPromise) {
      this._traceApiPromise = this.traceApiLoader();
    }

    const traceApi = await this._traceApiPromise;
    if (!traceApi || typeof traceApi.getTracer !== 'function') {
      return null;
    }

    this.tracer = traceApi.getTracer('preploop.interview.telemetry');
    return this.tracer;
  }

  async withSpan(name, options = {}, operation) {
    const tracer = await this._getTracer();
    if (!tracer || typeof tracer.startActiveSpan !== 'function') {
      return operation(this._createNoopSpan());
    }

    const { attributes = {} } = options;

    return tracer.startActiveSpan(name, options, async (span) => {
      if (attributes && typeof span.setAttributes === 'function') {
        span.setAttributes(attributes);
      } else if (attributes && typeof span.setAttribute === 'function') {
        for (const [key, value] of Object.entries(attributes)) {
          span.setAttribute(key, value);
        }
      }

      try {
        const result = await operation(span);
        if (typeof span.setStatus === 'function') {
          span.setStatus({ code: SPAN_STATUS_OK });
        }
        return result;
      } catch (error) {
        if (typeof span.recordException === 'function') {
          span.recordException(error);
        }
        if (typeof span.setStatus === 'function') {
          span.setStatus({
            code: SPAN_STATUS_ERROR,
            message: error?.message || 'operation_failed',
          });
        }
        throw error;
      } finally {
        if (typeof span.end === 'function') {
          span.end();
        }
      }
    });
  }

  _createNoopSpan() {
    return {
      setAttribute() {},
      setAttributes() {},
      addEvent() {},
      setStatus() {},
      recordException() {},
      end() {},
    };
  }

  buildInterviewTelemetrySnapshot({
    previousTelemetry = {},
    turnNumber = 1,
    previousStage = null,
    nextStage = null,
    responseLatencyMs = 0,
    groundingUsed = false,
    analysisScore = null,
    voiceProvider = null,
    voiceLatencyMs = 0,
    voiceFallback = false,
    feedbackQualitySignal = null,
    userDropoffReason = null,
  } = {}) {
    const safeTurn = Math.max(1, asInt(turnNumber, 1));
    const priorTurns = Math.max(0, asInt(previousTelemetry.totalTurns, safeTurn - 1));
    const priorAverageLatency = Math.max(0, asNumber(previousTelemetry.averageResponseLatencyMs, 0));
    const safeLatency = Math.max(0, asNumber(responseLatencyMs, 0));

    const inferredPriorGroundingHits = Number.isFinite(Number(previousTelemetry.groundingHits))
      ? Math.max(0, asNumber(previousTelemetry.groundingHits, 0))
      : Math.round((Math.max(0, asNumber(previousTelemetry.groundingHitRate, 0)) * priorTurns));

    const groundingHits = inferredPriorGroundingHits + (groundingUsed ? 1 : 0);
    const denominatorTurns = Math.max(safeTurn, priorTurns + 1);
    const averageResponseLatencyMs = Number(
      ((priorAverageLatency * priorTurns + safeLatency) / denominatorTurns).toFixed(1)
    );
    const groundingHitRate = Number((groundingHits / denominatorTurns).toFixed(2));

    const stageTransitions = Array.isArray(previousTelemetry.stageTransitions)
      ? [...previousTelemetry.stageTransitions]
      : [];

    if (previousStage && nextStage && String(previousStage) !== String(nextStage)) {
      stageTransitions.push({
        from: previousStage,
        to: nextStage,
        atTurn: denominatorTurns,
        timestamp: new Date().toISOString(),
      });
    }

    // Voice provider metrics (per-stage latency)
    const priorVoiceMetrics = Array.isArray(previousTelemetry.voiceMetrics)
      ? [...previousTelemetry.voiceMetrics]
      : [];

    if (voiceProvider) {
      priorVoiceMetrics.push({
        provider: voiceProvider,
        latencyMs: Math.max(0, asNumber(voiceLatencyMs, 0)),
        fallback: Boolean(voiceFallback),
        stage: nextStage || previousStage,
        timestamp: new Date().toISOString(),
      });
    }

    // Feedback quality tracking (for insights into feedback consistency)
    const feedbackQualityHistory = Array.isArray(previousTelemetry.feedbackQualityHistory)
      ? [...previousTelemetry.feedbackQualityHistory]
      : [];

    if (feedbackQualitySignal !== null && feedbackQualitySignal !== undefined) {
      feedbackQualityHistory.push({
        turn: denominatorTurns,
        signal: asNumber(feedbackQualitySignal, 0), // 0-100 scale
        stage: nextStage || previousStage,
        timestamp: new Date().toISOString(),
      });
    }

    return {
      // Core interview metrics
      totalTurns: denominatorTurns,
      stageTransitions,
      groundingHits,
      groundingHitRate,
      lastResponseLatencyMs: safeLatency,
      averageResponseLatencyMs,
      latestAnalysisScore: Number(analysisScore || 0),

      // Voice/audio metrics (new)
      voiceMetrics: priorVoiceMetrics,
      fallbackCount: priorVoiceMetrics.filter(m => m.fallback).length,
      fallbackRate: Number(
        (priorVoiceMetrics.filter(m => m.fallback).length / Math.max(1, priorVoiceMetrics.length)).toFixed(2)
      ),
      voiceAverageLatencyMs: priorVoiceMetrics.length > 0
        ? Number((priorVoiceMetrics.reduce((sum, m) => sum + m.latencyMs, 0) / priorVoiceMetrics.length).toFixed(1))
        : 0,

      // Feedback quality tracking (new)
      feedbackQualityHistory,
      feedbackQualityAverage: feedbackQualityHistory.length > 0
        ? Number((feedbackQualityHistory.reduce((sum, f) => sum + f.signal, 0) / feedbackQualityHistory.length).toFixed(1))
        : null,

      // Dropoff tracking (new)
      userDropoffReason: userDropoffReason ? String(userDropoffReason) : null,
      droppedAt: userDropoffReason ? new Date().toISOString() : null,

      lastUpdatedAt: new Date().toISOString(),
    };
  }

  /**
   * Compute per-stage latency statistics from full telemetry snapshot.
   * Returns breakdown: {stage_key: {avgLatencyMs, minLatencyMs, maxLatencyMs, count}}
   */
  getStageLatencyStats(telemetry = {}) {
    const stageStats = {};

    (Array.isArray(telemetry.voiceMetrics) ? telemetry.voiceMetrics : []).forEach(metric => {
      const stage = metric.stage || 'unknown';
      if (!stageStats[stage]) {
        stageStats[stage] = { latencies: [], fallbackCount: 0 };
      }
      stageStats[stage].latencies.push(metric.latencyMs);
      if (metric.fallback) {
        stageStats[stage].fallbackCount += 1;
      }
    });

    const result = {};
    for (const [stage, { latencies, fallbackCount }] of Object.entries(stageStats)) {
      if (latencies.length === 0) continue;
      result[stage] = {
        avgLatencyMs: Number((latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(1)),
        minLatencyMs: Math.min(...latencies),
        maxLatencyMs: Math.max(...latencies),
        count: latencies.length,
        fallbackCount,
        fallbackRate: Number((fallbackCount / latencies.length).toFixed(2)),
      };
    }
    return result;
  }

  /**
   * Compute scoring consistency check: are similar responses yielding similar scores?
   * Returns metric 0-1 (1.0 = perfect consistency, 0.0 = no consistency).
   * For use in telemetry dashboards.
   */
  estimateScoringConsistency(scoringHistory = []) {
    if (!Array.isArray(scoringHistory) || scoringHistory.length < 2) {
      return null;
    }

    // Simple heuristic: compare score variance within similar response categories
    // Higher consistency = lower variance
    const scores = scoringHistory.map(s => Number(s.score || 0)).filter(s => s > 0);
    if (scores.length < 2) return null;

    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);

    // Normalize: assume 20% stdDev is "normal" for interview scores
    // Result: 1.0 when stdDev is low, approaches 0 as stdDev increases
    const consistency = Math.max(0, 1 - (stdDev / (mean * 0.2)));
    return Number(consistency.toFixed(2));
  }
}

// Convenience: export a shared singleton instance for callers that expect
// an instantiated service (many modules import `interviewTelemetryService`).
export const interviewTelemetryService = new InterviewTelemetryService();
