import { describe, it, expect, beforeEach, vi } from 'vitest';
import { quotaGuard, DEGRADATION_MODES, DEFAULT_DAILY_TOKEN_BUDGET, MAX_USER_DAILY_INTERVIEWS, MAX_IP_DAILY_INTERVIEWS } from '../../services/quotaGuard.js';
import { deferredJobQueue, JOB_STATUS } from '../../services/deferredJobQueue.js';
import {
  callFastReply,
  callTurnScoring,
  callInterviewReport,
  sanitizePromptForFreeTier,
  ROUTER_MODELS,
} from '../../services/llmRouter.js';

describe('Zero-Cost Fallbacks & Concurrency Test Suite (Item 8)', { timeout: 35000 }, () => {
  beforeEach(() => {
    quotaGuard.reset();
    deferredJobQueue.reset();
  });

  describe('A. Intentional Provider Failures & Cascade Verifications', () => {
    it('cascades from Groq failure to Google AI Studio or OpenRouter with correct model tags', async () => {
      // Intentionally trip Groq into failure cooldown
      quotaGuard.markProviderFailing('groq');

      const evalResult = await callTurnScoring({
        previousQuestion: 'Explain database indexing.',
        userAnswer: 'B-Trees provide O(log n) lookups and range scans by balancing nodes.',
        questionNumber: 2,
        difficultyTag: 'medium',
      });

      expect(evalResult).toHaveProperty('score');
      expect(evalResult.evalProvider).not.toBe('groq');
      // Should cascade to gemini, openrouter, or heuristic-estimated
      expect(['gemini', 'openrouter', 'heuristic-estimated']).toContain(evalResult.evalProvider);
      expect(evalResult.evalModelUsed).toBeTruthy();
    }, 30000);

    it('cascades to deterministic fallback when all cloud providers fail', async () => {
      // Force all cloud providers to failing state
      quotaGuard.markProviderFailing('groq');
      quotaGuard.markProviderFailing('gemini');
      quotaGuard.markProviderFailing('cerebras');
      quotaGuard.markProviderFailing('openrouter');

      const reply = await callFastReply({
        previousQuestion: 'How do you design a distributed lock?',
        userAnswer: 'Using Redis with Redlock algorithm or Zookeeper ephemeral nodes.',
        questionNumber: 3,
      });

      expect(['scripted-minimal', 'deterministic-fallback']).toContain(reply.modelUsed);
      expect(reply.provider).toBe('deterministic-fallback');
      expect(reply.followUpQuestion).toBeTruthy();
      expect(reply.followUpQuestion.endsWith('?')).toBe(true);

      const scoreResult = await callTurnScoring({
        previousQuestion: 'How do you design a distributed lock?',
        userAnswer: 'Using Redis with Redlock algorithm or Zookeeper ephemeral nodes.',
        questionNumber: 3,
      });

      // Heuristic fallback must be explicitly marked as estimated!
      expect(scoreResult.isEstimated).toBe(true);
      expect(scoreResult.status).toBe('estimated');
      expect(scoreResult.evalProvider).toBe('heuristic-estimated');
    });

    it('sanitizes candidate PII before sending to public free-tier models', () => {
      const rawPrompt = 'Candidate Alice Smith (email: alice.smith@university.edu, phone: +1-555-123-4567) built a fullstack React and Node app.';
      const sanitized = sanitizePromptForFreeTier(rawPrompt);

      expect(sanitized).not.toContain('alice.smith@university.edu');
      expect(sanitized).not.toContain('+1-555-123-4567');
      expect(sanitized).toContain('[candidate_email_redacted]');
      expect(sanitized).toContain('[phone_redacted]');
      expect(sanitized).toContain('React and Node app');
    });
  });

  describe('B. Never Kill In-Progress Interview (15% Reserve Buffer)', () => {
    it('blocks NEW sessions at 85% budget utilization but allows IN-PROGRESS sessions to finish', () => {
      // Simulate 86% daily budget consumption (inside the 15% reserve buffer)
      const eightySixPct = Math.round(DEFAULT_DAILY_TOKEN_BUDGET * 0.86);
      quotaGuard.recordUsage({ provider: 'groq', totalTokens: eightySixPct });

      // Check for a NEW session start -> should enter WAITLIST
      const newSessionMode = quotaGuard.getCurrentMode({ isNewSession: true });
      expect(newSessionMode).toBe(DEGRADATION_MODES.WAITLIST);

      // Check for an IN-PROGRESS session turn -> should NOT be waitlisted!
      const activeSessionMode = quotaGuard.getCurrentMode({ isNewSession: false });
      expect(activeSessionMode).not.toBe(DEGRADATION_MODES.WAITLIST);
      expect(activeSessionMode).toBe(DEGRADATION_MODES.LITE);
    });

    it('informs the candidate with interviewerNotice when operating in Minimal/Scripted mode', async () => {
      // Simulate 92% budget utilization (MINIMAL mode)
      const ninetyTwoPct = Math.round(DEFAULT_DAILY_TOKEN_BUDGET * 0.92);
      quotaGuard.recordUsage({ provider: 'groq', totalTokens: ninetyTwoPct });

      const reply = await callFastReply({
        previousQuestion: 'What is tail call optimization?',
        userAnswer: 'It avoids growing the call stack by replacing the frame with the called function frame.',
        questionNumber: 4,
      });

      expect(reply.isScriptedMode).toBe(true);
      expect(reply.interviewerNotice).toContain('Operating in offline interview mode');
    });
  });

  describe('C. Shared Campus / Office Network IP Protection', () => {
    it('allows multiple distinct students on the same shared campus IP', () => {
      const sharedCampusIp = '198.51.100.42'; // University gateway IP

      // Student 1 starts 3 interviews
      for (let i = 0; i < MAX_USER_DAILY_INTERVIEWS; i++) {
        expect(quotaGuard.checkUserCap({ userId: 'student_1', ip: sharedCampusIp }).allowed).toBe(true);
        quotaGuard.recordUserInterview({ userId: 'student_1', ip: sharedCampusIp });
      }
      // Student 1 hits their personal cap
      expect(quotaGuard.checkUserCap({ userId: 'student_1', ip: sharedCampusIp }).allowed).toBe(false);

      // Student 2 on the SAME campus IP is NOT blocked
      expect(quotaGuard.checkUserCap({ userId: 'student_2', ip: sharedCampusIp }).allowed).toBe(true);
      quotaGuard.recordUserInterview({ userId: 'student_2', ip: sharedCampusIp });

      // Student 3 on the SAME campus IP is also NOT blocked
      expect(quotaGuard.checkUserCap({ userId: 'student_3', ip: sharedCampusIp }).allowed).toBe(true);
    });

    it('stops unauthenticated guests exceeding the strict guest cap on a single IP', () => {
      const guestIp = '203.0.113.15';

      quotaGuard.recordUserInterview({ userId: null, ip: guestIp });
      quotaGuard.recordUserInterview({ userId: null, ip: guestIp });

      const check = quotaGuard.checkUserCap({ userId: null, ip: guestIp });
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('Guest interview limit reached');
    });
  });

  describe('D. Rate Limit Header Synchronization & 3 Concurrent Sessions', () => {
    it('syncs actual remaining tokens from provider headers and throttles before 429', () => {
      // Simulate receiving Groq response headers showing critically low remaining tokens
      const mockHeaders = {
        'x-ratelimit-remaining-tokens': '250',
        'x-ratelimit-limit-tokens': '8000',
        'x-ratelimit-reset-tokens': '450ms',
        'x-ratelimit-remaining-requests': '990',
      };

      quotaGuard.syncProviderHeaders('groq', ROUTER_MODELS.GROQ_20B, mockHeaders);

      const status = quotaGuard.getStatus();
      const modelKey = `groq:${ROUTER_MODELS.GROQ_20B}`;
      expect(status.serverRateLimitState[modelKey]).toBeDefined();
      expect(status.serverRateLimitState[modelKey].remainingTokens).toBe(250);

      // Because remaining tokens < 400, model is immediately protected from 429
      const canUse = quotaGuard.canUseModel(ROUTER_MODELS.GROQ_20B, 300);
      expect(canUse.allowed).toBe(false);
    });

    it('handles 3 concurrent interview sessions cleanly under RPM limits', async () => {
      const sessions = ['session_1', 'session_2', 'session_3'];

      const runTurnForSession = async (sessionId: string, i: number) => {
        return callFastReply({
          previousQuestion: `Question for ${sessionId} turn ${i}`,
          userAnswer: `Answer from ${sessionId} explaining complexity and edge cases in detail.`,
          questionNumber: i + 1,
          totalQuestions: 6,
          company: 'Google',
          role: 'Software Engineer',
          stage: 'Technical',
          userId: `user_${sessionId}`,
          ip: `192.168.1.${i + 10}`,
        });
      };

      // Fire 3 simultaneous candidate turns concurrently
      const results = await Promise.all(
        sessions.map((sid, idx) => runTurnForSession(sid, idx + 1))
      );

      expect(results.length).toBe(3);
      for (const res of results) {
        expect(res).toHaveProperty('followUpQuestion');
        expect(res).toHaveProperty('microReaction');
        expect(typeof res.latencyMs).toBe('number');
      }
    }, 30000);
  });
});
