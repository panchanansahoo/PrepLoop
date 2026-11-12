import { describe, it, expect, vi, beforeEach } from 'vitest';
import http from 'http';
import WebSocket from 'ws';
import { RealtimeInterviewService } from '../../services/realtimeInterviewService.js';
import {
  reportCache,
  getCachedReport,
  setCachedReport,
  computeReportCacheKey,
} from '../../routes/company-interview/evaluation.js';

describe('AI Interview Regression & Verification: Areas #3 and #5', () => {
  describe('Area #3 — WebSocket Session Resilience', () => {
    let service: RealtimeInterviewService;

    beforeEach(() => {
      service = new RealtimeInterviewService();
    });

    it('initializes with empty sessions and disconnectedSessions maps', () => {
      expect(service.sessions instanceof Map).toBe(true);
      expect(service.disconnectedSessions instanceof Map).toBe(true);
      expect(service.getActiveSessionCount()).toBe(0);
    });

    it('generates unique session IDs', () => {
      const id1 = service.generateSessionId();
      const id2 = service.generateSessionId();
      expect(id1).toMatch(/^session_\d+_[a-f0-9]+$/);
      expect(id2).toMatch(/^session_\d+_[a-f0-9]+$/);
      expect(id1).not.toBe(id2);
    });

    it('successfully handles resume for a preserved disconnected session', async () => {
      const targetId = 'session_test_resume_123';
      const mockWs = {
        send: vi.fn(),
      };

      // Put session into disconnected pool (as if ws closed within 60s window)
      service.disconnectedSessions.set(targetId, {
        context: { role: 'Frontend Engineer', stage: 'Coding', conversation: [] },
        state: 'active_question',
        disconnectedAt: Date.now(),
        timeoutTimer: setTimeout(() => {}, 60000),
      });

      const activeTempSession = {
        ws: mockWs,
        context: {},
        state: 'idle',
      };
      service.sessions.set('temp_socket_id', activeTempSession);

      await service.handleResume('temp_socket_id', activeTempSession, {
        type: 'resume',
        targetSessionId: targetId,
      });

      // Old temp session deleted, new resumed session activated
      expect(service.sessions.has('temp_socket_id')).toBe(false);
      expect(service.sessions.has(targetId)).toBe(true);
      expect(service.disconnectedSessions.has(targetId)).toBe(false);

      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"resumed"')
      );
      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining(targetId)
      );
    });

    it('fails gracefully when resuming an expired or nonexistent session', async () => {
      const mockWs = { send: vi.fn() };
      const activeSession = { ws: mockWs, context: {}, state: 'idle' };

      await service.handleResume('some_curr_id', activeSession, {
        type: 'resume',
        targetSessionId: 'nonexistent_or_expired_id',
      });

      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"resume_failed"')
      );
    });

    it('processes handleAnswer and transitions interviewer mood without crashing', async () => {
      const mockWs = { send: vi.fn() };
      const session = {
        ws: mockWs,
        context: {
          company: 'Google',
          role: 'Software Engineer',
          stage: 'Technical',
          difficulty: 'medium',
          experienceLevel: 'fresher',
          totalQuestions: 10,
          questionIndex: 1,
          turns: 0,
          scoreHistory: [],
          moodState: 'neutral',
          conversation: [],
        },
        state: 'active_question',
      };

      vi.spyOn(service, 'generateFeedback').mockResolvedValue({
        comment: 'Good start.',
        score: 80,
      });
      vi.spyOn(service, 'generateNextQuestion').mockResolvedValue('Explain hash maps.');

      await service.handleAnswer(session, {
        answer: 'A hash map uses a hash function to map keys to array buckets for O(1) average lookup time, handling collisions via chaining or open addressing.',
        code: '',
        language: 'javascript',
      });

      const sentPayloads = mockWs.send.mock.calls.map(([raw]) => JSON.parse(raw));
      const feedbackMsg = sentPayloads.find((p) => p.type === 'feedback');
      const questionMsg = sentPayloads.find((p) => p.type === 'question');

      expect(feedbackMsg).toBeDefined();
      expect(feedbackMsg.mood).toEqual(
        expect.objectContaining({
          state: expect.any(String),
          expression: expect.any(String),
          avatarOverlay: expect.any(String),
          ttsProsody: expect.objectContaining({
            rate: expect.any(String),
            pitch: expect.any(String),
            energy: expect.any(String),
          }),
        })
      );
      expect(questionMsg).toBeDefined();
      expect(questionMsg.mood).toBe(feedbackMsg.mood.state);

      // Consecutive very short answers should escalate mood to impatient
      await service.handleAnswer(session, { answer: 'dunno', code: '', language: 'javascript' });
      await service.handleAnswer(session, { answer: 'not sure', code: '', language: 'javascript' });
      expect(session.context.moodState).toBe('impatient');
    });

    it('handles empty/null answer and uninitialized context safely', async () => {
      const mockWs = { send: vi.fn() };
      const session = {
        ws: mockWs,
        context: {
          conversation: [],
          questionIndex: 0,
          company: 'General',
          role: 'Software Engineer',
          stage: 'Technical',
        },
        state: 'idle',
      };

      vi.spyOn(service, 'generateFeedback').mockResolvedValue(null as any);
      vi.spyOn(service, 'generateNextQuestion').mockResolvedValue('Follow-up question?');

      await service.handleAnswer(session, { answer: null, code: '', language: 'javascript' });

      const sentPayloads = mockWs.send.mock.calls.map(([raw]) => JSON.parse(raw));
      const feedbackMsg = sentPayloads.find((p) => p.type === 'feedback');
      expect(feedbackMsg).toBeDefined();
      expect(feedbackMsg.feedback).toBeTruthy();
      expect(feedbackMsg.score).toBe(25);
      expect(feedbackMsg.mood.state).toBe('skeptical');
    });

    it('completes a real WebSocket start -> answer -> feedback/question round-trip', async () => {
      const server = http.createServer();
      service.initialize(server);

      vi.spyOn(service, 'generateQuestion').mockResolvedValue('Explain event loop in Node.js.');
      vi.spyOn(service, 'generateFeedback').mockResolvedValue({
        comment: 'Clear explanation of call stack and callback queue.',
        score: 82,
      });
      vi.spyOn(service, 'generateNextQuestion').mockResolvedValue('How do microtasks differ from macrotasks?');

      await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
      const addr = server.address() as { port: number };
      const ws = new WebSocket(`ws://127.0.0.1:${addr.port}/ws/interview`);

      const received: any[] = [];
      await new Promise<void>((resolve, reject) => {
        ws.on('error', reject);
        ws.on('message', (raw) => {
          const msg = JSON.parse(raw.toString());
          received.push(msg);

          if (msg.type === 'connected') {
            ws.send(JSON.stringify({ type: 'start', company: 'Acme', role: 'Backend Engineer' }));
          } else if (msg.type === 'question' && msg.questionIndex === 1) {
            ws.send(JSON.stringify({
              type: 'answer',
              answer: 'The Node.js event loop processes synchronous calls on the call stack first, then drains the microtask queue before moving to macrotask phases like timers and I/O callbacks.',
            }));
          } else if (msg.type === 'question' && msg.questionIndex === 2) {
            resolve();
          }
        });
      });

      try {
        const types = received.map((m) => m.type);
        expect(types).toContain('connected');
        expect(types).toContain('processing');
        const feedback = received.find((m) => m.type === 'feedback');
        expect(feedback).toBeDefined();
        expect(feedback.mood).toBeDefined();
        expect(['neutral', 'impressed', 'skeptical', 'curious', 'impatient']).toContain(feedback.mood.state);
      } finally {
        ws.close();
        await new Promise<void>((resolve) => {
          for (const s of service.disconnectedSessions.values()) {
            if (s.timeoutTimer) clearTimeout(s.timeoutTimer);
          }
          service.wss?.close(() => server.close(() => resolve()));
        });
      }
    });
  });

  describe('Area #5 — Report Generation Latency & Caching', () => {
    beforeEach(() => {
      reportCache.clear();
    });

    it('computes consistent cache keys for session IDs and conversations', () => {
      const keyFromSession = computeReportCacheKey({ sessionId: 'session_abc' });
      expect(keyFromSession).toBe('session:session_abc');

      const keyFromConvo = computeReportCacheKey({
        conversation: [
          { role: 'interviewer', content: 'Tell me about yourself' },
          { role: 'candidate', content: 'I am a software engineer' },
        ],
      });
      expect(keyFromConvo).toMatch(/^hash:interviewer:\d+\|candidate:\d+$/);

      expect(computeReportCacheKey({})).toBeNull();
    });

    it('stores and retrieves cached reports within TTL', () => {
      const sampleReport = { overallScore: 88, verdict: 'Strong Hire' };
      setCachedReport('session:test_cache_1', sampleReport);

      const retrieved = getCachedReport('session:test_cache_1');
      expect(retrieved).toEqual(sampleReport);
    });

    it('expires cached reports after TTL', () => {
      const sampleReport = { overallScore: 75, verdict: 'Would Advance' };
      // Manually set timestamp beyond 15 min TTL
      reportCache.set('session:expired_cache', {
        report: sampleReport,
        timestamp: Date.now() - 16 * 60 * 1000,
      });

      const retrieved = getCachedReport('session:expired_cache');
      expect(retrieved).toBeNull();
      expect(reportCache.has('session:expired_cache')).toBe(false);
    });
  });
});

