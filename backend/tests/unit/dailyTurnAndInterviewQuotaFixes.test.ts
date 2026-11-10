import { describe, it, expect, beforeEach, vi } from 'vitest';
import { quotaGuard, createQuotaMiddleware, MAX_USER_DAILY_TURNS, MAX_USER_DAILY_INTERVIEWS } from '../../services/quotaGuard.js';
import { callTurnScoring } from '../../services/llmRouter.js';

describe('Daily Turn Limits & Interview Allowance Bug Fixes', () => {
  beforeEach(() => {
    quotaGuard.reset();
  });

  describe('1. Turn Scoring Quota Usage Recording', () => {
    it('records a user turn when scoring with userId and ip', async () => {
      const userId = 'candidate_turn_scoring_user_1';
      const ip = '192.168.1.101';

      const initialCap = quotaGuard.checkUserCap({ userId, ip });
      expect(initialCap.allowed).toBe(true);
      expect(initialCap.turnsRemaining).toBe(MAX_USER_DAILY_TURNS);

      const result = await callTurnScoring({
        previousQuestion: 'Explain the difference between optimistic and pessimistic locking.',
        userAnswer: 'Optimistic locking assumes conflicts are rare and verifies record version before committing. Pessimistic locking locks records on read.',
        questionNumber: 2,
        difficultyTag: 'medium',
        userId,
        ip,
      });

      expect(result).toHaveProperty('score');
      expect(result.turnRecorded).toBe(true);

      const updatedCap = quotaGuard.checkUserCap({ userId, ip });
      expect(updatedCap.turnsRemaining).toBe(MAX_USER_DAILY_TURNS - 1);
    });

    it('enforces MAX_USER_DAILY_TURNS when daily turn limit is reached', async () => {
      const userId = 'candidate_turn_exhaustion_user';
      const ip = '192.168.1.102';

      // Record up to MAX_USER_DAILY_TURNS
      for (let i = 0; i < MAX_USER_DAILY_TURNS; i++) {
        quotaGuard.recordUserTurn({ userId, ip });
      }

      const capCheck = quotaGuard.checkUserCap({ userId, ip });
      expect(capCheck.allowed).toBe(false);
      expect(capCheck.turnsRemaining).toBe(0);
      expect(capCheck.reason).toContain('Daily question cap reached');
    });

    it('records user turn on heuristic fallback when LLM fails or is unavailable', async () => {
      const userId = 'candidate_turn_fallback_user';
      const ip = '192.168.1.103';

      // Temporarily mark providers as failing to trigger heuristic fallback
      quotaGuard.markProviderFailing('groq', 60000);
      quotaGuard.markProviderFailing('gemini', 60000);
      quotaGuard.markProviderFailing('openrouter', 60000);

      const result = await callTurnScoring({
        previousQuestion: 'What is idempotency in REST APIs?',
        userAnswer: 'An operation is idempotent if making multiple identical requests has the same effect as making a single request.',
        questionNumber: 3,
        difficultyTag: 'medium',
        userId,
        ip,
      });

      expect(result.isEstimated).toBe(true);
      expect(result.turnRecorded).toBe(true);

      const updatedCap = quotaGuard.checkUserCap({ userId, ip });
      expect(updatedCap.turnsRemaining).toBe(MAX_USER_DAILY_TURNS - 1);
    });
  });

  describe('2. Interview Start Allowance Safeguards', () => {
    it('allows full interviews remaining before any session start', () => {
      const userId = 'candidate_fresh_session_user';
      const initialCap = quotaGuard.checkUserCap({ userId });
      expect(initialCap.interviewsRemaining).toBe(MAX_USER_DAILY_INTERVIEWS);
    });

    it('does not consume interview quota when start checks fail prior to session creation', () => {
      const userId = 'candidate_failed_start_user';
      const ip = '192.168.1.104';

      // Only check cap without recording interview (simulating a 400/401/404/410/429 early exit)
      const capCheck = quotaGuard.checkUserCap({ userId, ip });
      expect(capCheck.allowed).toBe(true);

      // Verify no interview allowance was consumed
      const capCheckAfter = quotaGuard.checkUserCap({ userId, ip });
      expect(capCheckAfter.interviewsRemaining).toBe(MAX_USER_DAILY_INTERVIEWS);
    });

    it('consumes interview quota only upon successful session creation', () => {
      const userId = 'candidate_successful_start_user';
      const ip = '192.168.1.105';

      // Simulating successful session creation via withRuntime
      quotaGuard.recordUserInterview({ userId, ip });

      const capCheckAfter = quotaGuard.checkUserCap({ userId, ip });
      expect(capCheckAfter.interviewsRemaining).toBe(MAX_USER_DAILY_INTERVIEWS - 1);
    });
  });

  describe('3. createQuotaMiddleware Route Enforcement (Track 3.2)', () => {
    it('allows requests through when within quota limits', () => {
      const middleware = createQuotaMiddleware();
      const req = { user: { id: 'usr_mw_1' }, ip: '10.0.0.1', body: {} };
      let nextCalled = false;
      const res = {};
      middleware(req, res, () => { nextCalled = true; });
      expect(nextCalled).toBe(true);
      expect(req.quotaMode).toBeDefined();
    });

    it('returns 429 when turns quota is exceeded', () => {
      const userId = 'usr_mw_exhausted';
      const ip = '10.0.0.2';
      for (let i = 0; i < MAX_USER_DAILY_TURNS; i++) {
        quotaGuard.recordUserTurn({ userId, ip });
      }

      const middleware = createQuotaMiddleware();
      const req = { user: { id: userId }, ip, body: {} };
      let statusCode = null;
      let jsonPayload = null;
      const res = {
        status: (code) => {
          statusCode = code;
          return {
            json: (payload) => { jsonPayload = payload; },
          };
        },
      };

      middleware(req, res, () => {});
      expect(statusCode).toBe(429);
      expect(jsonPayload?.code).toBe('TURN_QUOTA_EXCEEDED');
    });
  });
});

