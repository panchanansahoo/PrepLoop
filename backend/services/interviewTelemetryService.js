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

    return {
      totalTurns: denominatorTurns,
      stageTransitions,
      groundingHits,
      groundingHitRate,
      lastResponseLatencyMs: safeLatency,
      averageResponseLatencyMs,
      latestAnalysisScore: Number(analysisScore || 0),
      lastUpdatedAt: new Date().toISOString(),
    };
  }
}

// Convenience: export a shared singleton instance for callers that expect
// an instantiated service (many modules import `interviewTelemetryService`).
export const interviewTelemetryService = new InterviewTelemetryService();
