import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { InterviewTelemetryService } from '../../services/interviewTelemetryService.js';

// ── #11 Telemetry Gaps: logEvent structured stderr fallback ───────────────────
describe('InterviewTelemetryService', () => {
  describe('#11 logEvent – structured JSON stderr fallback', () => {
    let stderrSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    });

    afterEach(() => {
      stderrSpy.mockRestore();
    });

    it('writes a newline-terminated JSON object to stderr', () => {
      const svc = new InterviewTelemetryService();
      svc.logEvent('interview.turn.scored', { sessionId: 'sess-1', turnIndex: 2, score: 7.5 });

      expect(stderrSpy).toHaveBeenCalledOnce();
      const raw = String(stderrSpy.mock.calls[0][0]);
      expect(raw.endsWith('\n')).toBe(true);
      const parsed = JSON.parse(raw.trim());
      expect(parsed.event).toBe('interview.turn.scored');
      expect(parsed.sessionId).toBe('sess-1');
      expect(parsed.turnIndex).toBe(2);
      expect(parsed.score).toBe(7.5);
      expect(typeof parsed.timestamp).toBe('string');
    });

    it('defaults event name to "interview.event" when called with empty string', () => {
      const svc = new InterviewTelemetryService();
      svc.logEvent('', { foo: 'bar' });

      const raw = String(stderrSpy.mock.calls[0][0]);
      const parsed = JSON.parse(raw.trim());
      expect(parsed.event).toBe('interview.event');
      expect(parsed.foo).toBe('bar');
    });

    it('includes all data fields in the JSON output', () => {
      const svc = new InterviewTelemetryService();
      svc.logEvent('interview.session.started', {
        sessionId: 'sess-99',
        latencyMs: 123,
        groundingHit: true,
        difficulty: 'hard',
      });

      const raw = String(stderrSpy.mock.calls[0][0]);
      const parsed = JSON.parse(raw.trim());
      expect(parsed.sessionId).toBe('sess-99');
      expect(parsed.latencyMs).toBe(123);
      expect(parsed.groundingHit).toBe(true);
      expect(parsed.difficulty).toBe('hard');
    });

    it('buffers events by sessionId and flushes them in batch', async () => {
      const insertedRows: any[] = [];
      const mockSupabase = {
        from: (table: string) => ({
          insert: async (rows: any[]) => {
            insertedRows.push(...rows);
            return { error: null };
          },
        }),
      };

      const svc = new InterviewTelemetryService();
      svc.logEvent('turn.scored', { sessionId: 'sess-abc', turnIndex: 1 });
      svc.logEvent('turn.scored', { sessionId: 'sess-abc', turnIndex: 2 });
      svc.logEvent('turn.scored', { sessionId: 'sess-other', turnIndex: 1 });

      const flushed = await svc.flushEvents('sess-abc', mockSupabase);
      expect(flushed.length).toBe(2);
      expect(insertedRows.length).toBe(2);
      expect(insertedRows[0].session_id).toBe('sess-abc');
      expect(insertedRows[1].session_id).toBe('sess-abc');

      // Subsequent flush returns empty array because buffer was cleared
      const secondFlush = await svc.flushEvents('sess-abc', mockSupabase);
      expect(secondFlush.length).toBe(0);
    });
  });

  // ── Existing withSpan + noop span behaviour ───────────────────────────────
  describe('withSpan – noop fallback when OTEL is unavailable', () => {
    it('runs the operation and returns its result when no tracer is available', async () => {
      const svc = new InterviewTelemetryService({
        // Force OTEL load to fail
        traceApiLoader: async () => null,
      });
      const result = await svc.withSpan('test.span', {}, async (span) => {
        // noop span should expose these methods without throwing
        span.setAttribute('k', 'v');
        span.setStatus({ code: 1 });
        span.end();
        return 42;
      });
      expect(result).toBe(42);
    });
  });

  // ── buildInterviewTelemetrySnapshot unit tests ────────────────────────────
  describe('buildInterviewTelemetrySnapshot', () => {
    it('computes correct averageResponseLatencyMs on first turn', () => {
      const svc = new InterviewTelemetryService();
      const snap = svc.buildInterviewTelemetrySnapshot({
        previousTelemetry: {},
        turnNumber: 1,
        responseLatencyMs: 500,
        groundingUsed: true,
        analysisScore: 72,
      });
      expect(snap.totalTurns).toBe(1);
      expect(snap.averageResponseLatencyMs).toBe(500);
      expect(snap.groundingHits).toBe(1);
      expect(snap.groundingHitRate).toBe(1);
      expect(snap.latestAnalysisScore).toBe(72);
    });

    it('accumulates stage transitions', () => {
      const svc = new InterviewTelemetryService();
      const snap = svc.buildInterviewTelemetrySnapshot({
        previousTelemetry: { stageTransitions: [] },
        turnNumber: 2,
        previousStage: 'intake',
        nextStage: 'technical',
        responseLatencyMs: 400,
        groundingUsed: false,
        analysisScore: null,
      });
      expect(snap.stageTransitions.length).toBe(1);
      expect(snap.stageTransitions[0].from).toBe('intake');
      expect(snap.stageTransitions[0].to).toBe('technical');
    });
  });
});

