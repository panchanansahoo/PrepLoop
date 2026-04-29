/**
 * Lightweight Distributed Tracing Utility
 *
 * OpenTelemetry-compatible trace/span format for request correlation
 * across async operations, DB queries, and external API calls.
 *
 * Usage:
 *   import { createTrace, createSpan } from '../utils/tracer.js';
 *   
 *   const trace = createTrace(req.requestId);
 *   const span = trace.startSpan('db.query', { query: 'SELECT ...' });
 *   // ... do work ...
 *   span.end();
 */

import { createLogger } from './structuredLogger.js';
import crypto from 'crypto';

const logger = createLogger('tracer');

const SLOW_SPAN_THRESHOLD = 500; // ms

function generateId() {
  return crypto.randomBytes(8).toString('hex');
}

export class Span {
  constructor(traceId, name, attributes = {}, parentSpanId = null) {
    this.traceId = traceId;
    this.spanId = generateId();
    this.parentSpanId = parentSpanId;
    this.name = name;
    this.attributes = attributes;
    this.startTime = Date.now();
    this.endTime = null;
    this.status = 'OK';
    this.events = [];
  }

  addEvent(name, attributes = {}) {
    this.events.push({ name, attributes, timestamp: Date.now() });
    return this;
  }

  setStatus(status, message = '') {
    this.status = status;
    if (message) this.attributes.statusMessage = message;
    return this;
  }

  setError(error) {
    this.status = 'ERROR';
    this.attributes.error = error.message;
    this.attributes.errorType = error.name;
    return this;
  }

  end() {
    this.endTime = Date.now();
    const duration = this.endTime - this.startTime;
    this.attributes.durationMs = duration;

    const logData = {
      traceId: this.traceId,
      spanId: this.spanId,
      parentSpanId: this.parentSpanId,
      name: this.name,
      duration,
      status: this.status,
      attributes: this.attributes,
    };

    if (duration > SLOW_SPAN_THRESHOLD) {
      logger.warn('Slow span detected', logData);
    } else {
      logger.debug('Span completed', logData);
    }

    return this;
  }
}

export class Trace {
  constructor(traceId) {
    this.traceId = traceId || generateId() + generateId();
    this.spans = [];
    this.rootSpan = null;
  }

  startSpan(name, attributes = {}, parentSpanId = null) {
    const span = new Span(this.traceId, name, attributes, parentSpanId);
    this.spans.push(span);
    if (!this.rootSpan) this.rootSpan = span;
    return span;
  }

  getSummary() {
    return {
      traceId: this.traceId,
      spanCount: this.spans.length,
      totalDuration: this.rootSpan ? (this.rootSpan.endTime || Date.now()) - this.rootSpan.startTime : 0,
      spans: this.spans.map(s => ({
        name: s.name, duration: s.attributes.durationMs, status: s.status,
      })),
    };
  }
}

export function createTrace(requestId) {
  return new Trace(requestId);
}

/**
 * Express middleware that creates a trace context for each request.
 */
export function tracingMiddleware() {
  return (req, res, next) => {
    const traceId = req.requestId || req.headers['x-request-id'] || generateId() + generateId();
    req.trace = new Trace(traceId);
    req.rootSpan = req.trace.startSpan('http.request', {
      method: req.method,
      path: req.path,
      userAgent: req.headers['user-agent']?.slice(0, 100),
    });

    res.on('finish', () => {
      req.rootSpan.attributes.statusCode = res.statusCode;
      req.rootSpan.end();
    });

    next();
  };
}

export default { Trace, Span, createTrace, tracingMiddleware };
