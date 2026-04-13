import assert from 'node:assert/strict';
import { InterviewTelemetryService } from '../services/interviewTelemetryService.js';

function createFakeTracer() {
  const spans = [];
  return {
    spans,
    startActiveSpan(name, options, callback) {
      const span = {
        name,
        options,
        attributes: {},
        events: [],
        status: null,
        ended: false,
        exception: null,
        setAttribute(key, value) {
          this.attributes[key] = value;
        },
        setAttributes(attrs = {}) {
          Object.assign(this.attributes, attrs);
        },
        addEvent(eventName, attrs = {}) {
          this.events.push({ eventName, attrs });
        },
        setStatus(status) {
          this.status = status;
        },
        recordException(error) {
          this.exception = error;
        },
        end() {
          this.ended = true;
        },
      };
      spans.push(span);
      return callback(span);
    },
  };
}

async function run() {
  const tracer = createFakeTracer();
  const service = new InterviewTelemetryService({ tracer });

  const result = await service.withSpan(
    'interview.test.success',
    { attributes: { 'interview.session_id': 's-1' } },
    async (span) => {
      span.addEvent('interview.step');
      return 42;
    }
  );

  assert.equal(result, 42, 'withSpan should return wrapped result');
  assert.equal(tracer.spans.length, 1, 'one span should be created');
  assert.equal(tracer.spans[0].name, 'interview.test.success', 'span name should match');
  assert.equal(tracer.spans[0].attributes['interview.session_id'], 's-1', 'attributes should be set');
  assert.ok(tracer.spans[0].ended, 'span should be ended');

  const snapshot = service.buildInterviewTelemetrySnapshot({
    previousTelemetry: {
      totalTurns: 1,
      stageTransitions: [],
      groundingHits: 0,
      averageResponseLatencyMs: 400,
    },
    turnNumber: 2,
    previousStage: 'intake',
    nextStage: 'technical',
    responseLatencyMs: 600,
    groundingUsed: true,
    analysisScore: 82,
  });

  assert.equal(snapshot.totalTurns, 2, 'totalTurns should increment');
  assert.equal(snapshot.groundingHits, 1, 'groundingHits should increment');
  assert.equal(snapshot.stageTransitions.length, 1, 'transition should be tracked');
  assert.equal(snapshot.latestAnalysisScore, 82, 'latestAnalysisScore should be propagated');

  const errorTracer = createFakeTracer();
  const errorService = new InterviewTelemetryService({ tracer: errorTracer });

  let threw = false;
  try {
    await errorService.withSpan('interview.test.error', {}, async () => {
      throw new Error('boom');
    });
  } catch {
    threw = true;
  }

  assert.equal(threw, true, 'withSpan should rethrow operation errors');
  assert.equal(errorTracer.spans.length, 1, 'error path should still create a span');
  assert.ok(errorTracer.spans[0].exception, 'error span should record exception');
  assert.ok(errorTracer.spans[0].ended, 'error span should end');

  console.log('Interview telemetry service tests passed');
}

run();
