import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import express from 'express';

// Mock auth middleware for route testing
vi.mock('../../middleware/auth.ts', () => ({
  authenticateToken: (req, _res, next) => {
    req.user = req.testUser || { id: 'test-user-id', email: 'test@preploop.com' };
    next();
  },
}));

import fresherRouter, {
  sessions as fresherSessions,
  cleanupStaleSessions,
  cleanupStaleSessionsAsync,
  getActiveSession,
  storeSession,
  persistSession,
  loadSessionAsync,
  deleteSessionAsync,
  SESSION_TTL_MS,
  COMPLETED_SESSION_TTL_MS,
  MAX_SESSIONS,
  FRESHER_SESSION_TTL_SEC,
  FRESHER_COMPLETED_TTL_SEC,
  FRESHER_CACHE_PREFIX,
} from '../../routes/fresher-interview.js';
import * as redisConfig from '../../config/redis.js';
import * as upstashConfig from '../../config/upstashRedis.js';

describe('Distributed Redis Session Architecture for Fresher Interview', () => {
  let app;
  let server = null;
  let baseUrl = '';

  beforeEach(async () => {
    fresherSessions.clear();
    vi.restoreAllMocks();

    app = express();
    app.use(express.json());
    app.use('/api/fresher-interview', fresherRouter);

    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const address = server?.address();
        if (address && typeof address === 'object') {
          baseUrl = `http://127.0.0.1:${address.port}`;
        }
        resolve();
      });
    });
  });

  afterEach(async () => {
    fresherSessions.clear();
    vi.restoreAllMocks();
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      server = null;
    }
  });

  describe('1. Distributed Session Persistence & Retrieval with Node-Redis', () => {
    it('persists active session to Redis with explicit 7200s TTL', async () => {
      const mockRedis = {
        isOpen: true,
        isReady: true,
        set: vi.fn().mockResolvedValue('OK'),
        get: vi.fn(),
        del: vi.fn().mockResolvedValue(1),
      };
      vi.spyOn(redisConfig, 'getRedisClient').mockReturnValue(mockRedis);

      const sessionId = 'test-session-redis-active';
      const sessionData = {
        userId: 'user-123',
        phase: 'intro',
        currentQuestionIndex: 0,
        askedQuestions: ['Question 1'],
        responses: [],
      };

      await persistSession(sessionId, sessionData);

      // Verify node-redis was called with exact prefix, JSON string, and 7200s TTL
      const expectedKey = `${FRESHER_CACHE_PREFIX}${sessionId}`;
      expect(mockRedis.set).toHaveBeenCalledTimes(1);
      expect(mockRedis.set).toHaveBeenCalledWith(
        expectedKey,
        expect.any(String),
        { EX: 7200 }
      );
      expect(FRESHER_SESSION_TTL_SEC).toBe(7200);

      // Verify local memory fallback was also populated
      expect(fresherSessions.has(sessionId)).toBe(true);
    });

    it('persists completed session to Redis with explicit 900s TTL', async () => {
      const mockRedis = {
        isOpen: true,
        isReady: true,
        set: vi.fn().mockResolvedValue('OK'),
        get: vi.fn(),
        del: vi.fn().mockResolvedValue(1),
      };
      vi.spyOn(redisConfig, 'getRedisClient').mockReturnValue(mockRedis);

      const sessionId = 'test-session-redis-complete';
      const sessionData = {
        userId: 'user-123',
        phase: 'complete',
        completedAt: new Date().toISOString(),
        completedAtMs: Date.now(),
        askedQuestions: ['Q1', 'Q2'],
        responses: [],
      };

      await persistSession(sessionId, sessionData);

      const expectedKey = `${FRESHER_CACHE_PREFIX}${sessionId}`;
      expect(mockRedis.set).toHaveBeenCalledWith(
        expectedKey,
        expect.any(String),
        { EX: 900 }
      );
      expect(FRESHER_COMPLETED_TTL_SEC).toBe(900);
    });

    it('loads session from Redis and syncs to local memory map', async () => {
      const sessionId = 'test-session-load';
      const storedData = {
        userId: 'user-remote',
        phase: 'hr',
        currentQuestionIndex: 2,
        askedQuestions: ['Q1', 'Q2'],
        responses: [],
        lastAccessedAt: Date.now(),
      };

      const mockRedis = {
        isOpen: true,
        isReady: true,
        get: vi.fn().mockResolvedValue(JSON.stringify(storedData)),
        set: vi.fn(),
        del: vi.fn(),
      };
      vi.spyOn(redisConfig, 'getRedisClient').mockReturnValue(mockRedis);

      // Memory cache starts empty
      expect(fresherSessions.has(sessionId)).toBe(false);

      const session = await loadSessionAsync(sessionId);

      expect(mockRedis.get).toHaveBeenCalledWith(`${FRESHER_CACHE_PREFIX}${sessionId}`);
      expect(session).not.toBeNull();
      expect(session.userId).toBe('user-remote');
      expect(session.phase).toBe('hr');

      // Local memory fallback was synchronized
      expect(fresherSessions.has(sessionId)).toBe(true);
      expect(getActiveSession(sessionId).userId).toBe('user-remote');
    });

    it('deletes session from both Redis and local memory map', async () => {
      const sessionId = 'test-session-delete';
      const mockRedis = {
        isOpen: true,
        isReady: true,
        del: vi.fn().mockResolvedValue(1),
        set: vi.fn(),
        get: vi.fn(),
      };
      vi.spyOn(redisConfig, 'getRedisClient').mockReturnValue(mockRedis);

      // Pre-populate in memory
      fresherSessions.set(sessionId, { userId: 'user-1' });
      expect(fresherSessions.has(sessionId)).toBe(true);

      await deleteSessionAsync(sessionId);

      expect(mockRedis.del).toHaveBeenCalledWith(`${FRESHER_CACHE_PREFIX}${sessionId}`);
      expect(fresherSessions.has(sessionId)).toBe(false);
    });
  });

  describe('2. Distributed Session Persistence & Retrieval with Upstash Redis', () => {
    it('persists and loads session using Upstash REST client when node-redis is unavailable', async () => {
      // Node-redis disabled
      vi.spyOn(redisConfig, 'getRedisClient').mockReturnValue(null);

      const mockUpstash = {
        set: vi.fn().mockResolvedValue('OK'),
        get: vi.fn().mockResolvedValue(JSON.stringify({
          userId: 'user-upstash',
          phase: 'technical',
          currentQuestionIndex: 1,
          askedQuestions: ['Q1'],
          responses: [],
          lastAccessedAt: Date.now(),
        })),
        del: vi.fn().mockResolvedValue(1),
      };
      vi.spyOn(upstashConfig, 'getUpstashRedisClient').mockReturnValue(mockUpstash);

      const sessionId = 'test-session-upstash';
      await persistSession(sessionId, {
        userId: 'user-upstash',
        phase: 'technical',
        currentQuestionIndex: 1,
      });

      expect(mockUpstash.set).toHaveBeenCalledWith(
        `${FRESHER_CACHE_PREFIX}${sessionId}`,
        expect.any(String),
        { ex: 7200 }
      );

      const loaded = await loadSessionAsync(sessionId);
      expect(mockUpstash.get).toHaveBeenCalledWith(`${FRESHER_CACHE_PREFIX}${sessionId}`);
      expect(loaded.userId).toBe('user-upstash');

      await deleteSessionAsync(sessionId);
      expect(mockUpstash.del).toHaveBeenCalledWith(`${FRESHER_CACHE_PREFIX}${sessionId}`);
    });
  });

  describe('3. Graceful Local In-Memory Fallback when Redis is Unconfigured or Unreachable', () => {
    it('falls back seamlessly to in-process Map when Redis is null / disabled', async () => {
      vi.spyOn(redisConfig, 'getRedisClient').mockReturnValue(null);
      vi.spyOn(upstashConfig, 'getUpstashRedisClient').mockReturnValue(null);

      const sessionId = 'test-session-fallback';
      await persistSession(sessionId, {
        userId: 'user-fallback',
        phase: 'intro',
        currentQuestionIndex: 0,
      });

      // Retained in local memory Map
      expect(fresherSessions.has(sessionId)).toBe(true);

      const loaded = await loadSessionAsync(sessionId);
      expect(loaded).not.toBeNull();
      expect(loaded.userId).toBe('user-fallback');

      await deleteSessionAsync(sessionId);
      expect(fresherSessions.has(sessionId)).toBe(false);
    });

    it('enforces SESSION_TTL_MS (2 hours) and COMPLETED_SESSION_TTL_MS (15 min) in fallback mode', async () => {
      vi.spyOn(redisConfig, 'getRedisClient').mockReturnValue(null);
      vi.spyOn(upstashConfig, 'getUpstashRedisClient').mockReturnValue(null);

      const now = Date.now();

      // Active session expired past 2 hours
      const expiredActiveId = 'expired-active';
      fresherSessions.set(expiredActiveId, {
        userId: 'usr_exp',
        phase: 'intro',
        lastAccessedAt: now - (SESSION_TTL_MS + 1000),
      });

      // Active session valid within 2 hours
      const validActiveId = 'valid-active';
      fresherSessions.set(validActiveId, {
        userId: 'usr_valid',
        phase: 'intro',
        lastAccessedAt: now - 5000,
      });

      expect(await loadSessionAsync(expiredActiveId)).toBeNull();
      expect(fresherSessions.has(expiredActiveId)).toBe(false);

      const validLoaded = await loadSessionAsync(validActiveId);
      expect(validLoaded).not.toBeNull();
      expect(validLoaded.userId).toBe('usr_valid');

      // Completed session expired past 15 min
      const expiredCompletedId = 'expired-completed';
      fresherSessions.set(expiredCompletedId, {
        userId: 'usr_comp',
        phase: 'complete',
        completedAtMs: now - (COMPLETED_SESSION_TTL_MS + 1000),
      });

      cleanupStaleSessions();
      expect(fresherSessions.has(expiredCompletedId)).toBe(false);
    });

    it('bounds in-memory fallback capacity to MAX_SESSIONS (500) with LRU eviction', () => {
      fresherSessions.clear();
      const now = Date.now();

      for (let i = 0; i < 520; i++) {
        storeSession(`sess_${i}`, {
          userId: `usr_${i}`,
          phase: 'intro',
          lastAccessedAt: now - 10000 + i,
        });
      }

      expect(fresherSessions.size).toBe(MAX_SESSIONS);
      expect(fresherSessions.size).toBe(500);
      expect(fresherSessions.has('sess_0')).toBe(false);
      expect(fresherSessions.has('sess_19')).toBe(false);
      expect(fresherSessions.has('sess_20')).toBe(true);
      expect(fresherSessions.has('sess_519')).toBe(true);
    });
  });

  describe('4. Error Resilience & Non-Crashing Async Operations', () => {
    it('survives Redis connection errors during persistSession without crashing', async () => {
      const mockRedis = {
        isOpen: true,
        set: vi.fn().mockRejectedValue(new Error('ECONNREFUSED: Connection lost to Redis server')),
      };
      vi.spyOn(redisConfig, 'getRedisClient').mockReturnValue(mockRedis);
      vi.spyOn(upstashConfig, 'getUpstashRedisClient').mockReturnValue(null);

      const sessionId = 'session-error-persist';
      await expect(persistSession(sessionId, { userId: 'resilient-user', phase: 'intro' })).resolves.not.toThrow();

      // Local fallback must remain active despite Redis error
      expect(fresherSessions.has(sessionId)).toBe(true);
      expect(fresherSessions.get(sessionId).userId).toBe('resilient-user');
    });

    it('survives Redis timeout during loadSessionAsync and falls back to memory', async () => {
      const mockRedis = {
        isOpen: true,
        get: vi.fn().mockRejectedValue(new Error('ETIMEDOUT: Redis read timeout')),
      };
      vi.spyOn(redisConfig, 'getRedisClient').mockReturnValue(mockRedis);
      vi.spyOn(upstashConfig, 'getUpstashRedisClient').mockReturnValue(null);

      const sessionId = 'session-error-load';
      fresherSessions.set(sessionId, {
        userId: 'fallback-user',
        phase: 'technical',
        lastAccessedAt: Date.now(),
      });

      const session = await loadSessionAsync(sessionId);
      expect(session).not.toBeNull();
      expect(session.userId).toBe('fallback-user');
    });

    it('survives Redis error during deleteSessionAsync without throwing', async () => {
      const mockRedis = {
        isOpen: true,
        del: vi.fn().mockRejectedValue(new Error('READONLY You cannot write against a read only replica')),
      };
      vi.spyOn(redisConfig, 'getRedisClient').mockReturnValue(mockRedis);
      vi.spyOn(upstashConfig, 'getUpstashRedisClient').mockReturnValue(null);

      const sessionId = 'session-error-delete';
      fresherSessions.set(sessionId, { userId: 'del-user' });

      await expect(deleteSessionAsync(sessionId)).resolves.not.toThrow();
      expect(fresherSessions.has(sessionId)).toBe(false);
    });

    it('handles cleanupStaleSessionsAsync safely without throwing', async () => {
      await expect(cleanupStaleSessionsAsync()).resolves.not.toThrow();
    });
  });

  describe('5. End-to-End Route Handlers with Distributed Redis & Fallback', () => {
    it('executes full interview flow (start, answer, get, delete) backed by Redis', async () => {
      const redisStore = new Map();
      const mockRedis = {
        isOpen: true,
        isReady: true,
        set: vi.fn((key, val, options) => {
          redisStore.set(key, { val, options });
          return Promise.resolve('OK');
        }),
        get: vi.fn((key) => {
          const entry = redisStore.get(key);
          return Promise.resolve(entry ? entry.val : null);
        }),
        del: vi.fn((key) => {
          redisStore.delete(key);
          return Promise.resolve(1);
        }),
      };
      vi.spyOn(redisConfig, 'getRedisClient').mockReturnValue(mockRedis);

      // 1. POST /start
      const startRes = await fetch(`${baseUrl}/api/fresher-interview/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewerName: 'Alice',
          role: 'Junior Engineer',
          company: 'Acme Corp',
          roundName: 'Round 1',
          roundType: 'hr',
        }),
      });

      expect(startRes.status).toBe(200);
      const startData = await startRes.json();
      expect(startData.sessionId).toBeDefined();
      expect(startData.phase).toBe('intro');
      expect(startData.questionNumber).toBe(1);

      // Verify Redis was written to with 7200s TTL
      const expectedRedisKey = `${FRESHER_CACHE_PREFIX}${startData.sessionId}`;
      expect(mockRedis.set).toHaveBeenCalledWith(
        expectedRedisKey,
        expect.any(String),
        { EX: 7200 }
      );

      // 2. GET /session/:sessionId
      const getRes = await fetch(`${baseUrl}/api/fresher-interview/session/${startData.sessionId}`);
      expect(getRes.status).toBe(200);
      const sessionInfo = await getRes.json();
      expect(sessionInfo.session.phase).toBe('intro');

      // 3. POST /answer
      const answerRes = await fetch(`${baseUrl}/api/fresher-interview/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: startData.sessionId,
          answer: 'I am a passionate software engineer with hands-on experience in Node.js and Redis.',
        }),
      });

      expect(answerRes.status).toBe(200);
      const answerData = await answerRes.json();
      expect(answerData.questionNumber).toBe(2);
      expect(answerData.nextQuestion).toBeDefined();

      // 4. DELETE /session/:sessionId
      const delRes = await fetch(`${baseUrl}/api/fresher-interview/session/${startData.sessionId}`, {
        method: 'DELETE',
      });
      expect(delRes.status).toBe(200);
      const delData = await delRes.json();
      expect(delData.success).toBe(true);

      // Verify deletion from Redis
      expect(mockRedis.del).toHaveBeenCalledWith(expectedRedisKey);
      expect(redisStore.has(expectedRedisKey)).toBe(false);

      // Subsequent GET should 404
      const get404 = await fetch(`${baseUrl}/api/fresher-interview/session/${startData.sessionId}`);
      expect(get404.status).toBe(404);
    });

    it('rejects /answer with 400 for empty or whitespace answer', async () => {
      const sessionId = 'test-empty-ans';
      fresherSessions.set(sessionId, {
        userId: 'test-user-id',
        phase: 'intro',
        askedQuestions: ['Tell me about yourself.'],
        responses: [],
        currentQuestionIndex: 0,
      });

      const res = await fetch(`${baseUrl}/api/fresher-interview/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, answer: '   ' }),
      });

      expect(res.status).toBe(400);
      const err = await res.json();
      expect(err.error).toMatch(/non-empty string/i);
    });

    it('rejects /start with 400 when roundType is invalid', async () => {
      const res = await fetch(`${baseUrl}/api/fresher-interview/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roundType: 'invalid-round' }),
      });

      expect(res.status).toBe(400);
      const err = await res.json();
      expect(err.error).toMatch(/roundType must be/i);
    });
  });
});
