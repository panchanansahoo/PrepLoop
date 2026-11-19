import { supabaseAdmin } from '../db/supabaseClient.js';

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
  constructor({ tracer = null, traceApiLoader = loadOpenTelemetryTraceApi, supabase = null, autoRegisterShutdown = true } = {}) {
    this.tracer = tracer;
    this.traceApiLoader = traceApiLoader;
    this._traceApiPromise = null;
    this.supabase = supabase || (process.env.NODE_ENV !== 'test' ? supabaseAdmin : null);
    this._eventBuffer = new Map();
    this._shutdownHandlerRegistered = false;
    if (autoRegisterShutdown && process.env.NODE_ENV !== 'test') {
      this.registerShutdownHandler();
    }
  }

  /**
   * #11 Telemetry: Structured JSON event logger.
   * When OTEL is unavailable, writes newline-delimited JSON to stderr so
   * log aggregators (Cloud Logging, Datadog, etc.) can still ingest events.
   * Buffers events per sessionId so they can be flushed to DB at session end.
   *
   * @param {string} event  - Dot-separated event name, e.g. 'interview.turn.scored'
   * @param {object} data   - Arbitrary key-value payload (must be JSON-serializable)
   */
  logEvent(event, data = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      event: String(event || 'interview.event'),
      ...data,
    };
    // Write to stderr so it doesn't pollute stdout/response streams
    process.stderr.write(JSON.stringify(entry) + '\n');

    if (data && data.sessionId) {
      const sid = String(data.sessionId);
      if (!this._eventBuffer.has(sid)) {
        this._eventBuffer.set(sid, []);
      }
      this._eventBuffer.get(sid).push({
        session_id: sid,
        event_name: entry.event,
        payload: entry,
        created_at: entry.timestamp,
      });
    }
  }

  /**
   * Flushes buffered telemetry events for a given session to Supabase.
   *
   * @param {string} sessionId
   * @param {object} [client] - Optional supabase client override
   * @returns {Promise<Array>} Array of flushed events
   */
  async flushEvents(sessionId, client = null) {
    if (!sessionId) return [];
    const sid = String(sessionId);
    const events = this._eventBuffer.get(sid) || [];
    this._eventBuffer.delete(sid);
    if (!events.length) return [];

    const dbClient = client || this.supabase || (process.env.NODE_ENV !== 'test' ? supabaseAdmin : null);
    if (dbClient && typeof dbClient.from === 'function') {
      try {
        const { error } = await dbClient.from('interview_telemetry_events').insert(events);
        if (error) {
          process.stderr.write(`[telemetry-flush-error] ${error.message || JSON.stringify(error)}\n`);
        }
      } catch (err) {
        process.stderr.write(`[telemetry-flush-error] ${err?.message}\n`);
      }
    }
    return events;
  }

  /**
   * Flushes all buffered telemetry events across all active sessions.
   * Useful during graceful process shutdown (SIGTERM / SIGINT).
   */
  async flushAllEvents(client = null) {
    const sessionIds = Array.from(this._eventBuffer.keys());
    const allFlushed = [];
    for (const sid of sessionIds) {
      const flushed = await this.flushEvents(sid, client);
      allFlushed.push(...flushed);
    }
    return allFlushed;
  }

  /**
   * Registers process-level termination listeners (SIGTERM / SIGINT)
   * to flush remaining in-memory telemetry buffers to the database before exit.
   */
  registerShutdownHandler() {
    if (this._shutdownHandlerRegistered) return;
    this._shutdownHandlerRegistered = true;

    const handler = async () => {
      try {
        await this.flushAllEvents();
      } catch (err) {
        process.stderr.write(`[telemetry-shutdown-error] ${err?.message}\n`);
      }
    };

    if (typeof process !== 'undefined' && typeof process.once === 'function') {
      process.once('SIGTERM', handler);
      process.once('SIGINT', handler);
    }
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
