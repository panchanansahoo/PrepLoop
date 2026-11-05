import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { quotaGuard, DEGRADATION_MODES, DEFAULT_DAILY_TOKEN_BUDGET, MAX_USER_DAILY_INTERVIEWS, MAX_USER_DAILY_TURNS, MAX_IP_DAILY_TURNS, MAX_GUEST_DAILY_TURNS } from '../../services/quotaGuard.js';
import { deferredJobQueue, JOB_STATUS } from '../../services/deferredJobQueue.js';
import { buildTokenSavingHistory, callFastReply, callTurnScoring, ROUTER_MODELS } from '../../services/llmRouter.js';
import { EdgeTTS } from 'node-edge-tts';

describe('Zero-Cost Architecture Verification Suite', () => {
  beforeEach(() => {
    quotaGuard.reset();
    deferredJobQueue.reset();
  });

  describe('1. Quota Guard & Degradation Mode Switching', () => {
    it('initializes in NORMAL mode with 0% utilization', () => {
      const status = quotaGuard.getStatus();
      expect(status.mode).toBe(DEGRADATION_MODES.NORMAL);
      expect(status.utilizationPct).toBe(0);
      expect(quotaGuard.isSpeculationAllowed()).toBe(true);
      expect(quotaGuard.getMaxHistoryTurns()).toBe(4);
    });

    it('transitions automatically to LITE mode at 60% budget utilization', () => {
      // Simulate consuming 60% of budget (120,000 / 200,000 tokens)
      const sixtyPct = Math.round(DEFAULT_DAILY_TOKEN_BUDGET * 0.60);
      quotaGuard.recordUsage({ provider: 'groq', totalTokens: sixtyPct });

      const status = quotaGuard.getStatus();
      expect(status.mode).toBe(DEGRADATION_MODES.LITE);
      expect(status.utilizationPct).toBe(60);
      // In Lite mode, speculation is disabled to conserve tokens
      expect(quotaGuard.isSpeculationAllowed()).toBe(false);
      // In Lite mode, history is clamped to 2 turns
      expect(quotaGuard.getMaxHistoryTurns()).toBe(2);
    });

    it('transitions to MINIMAL mode at 90% budget utilization', () => {
      const ninetyPct = Math.round(DEFAULT_DAILY_TOKEN_BUDGET * 0.90);
      quotaGuard.recordUsage({ provider: 'groq', totalTokens: ninetyPct });

      const status = quotaGuard.getStatus();
      expect(status.mode).toBe(DEGRADATION_MODES.MINIMAL);
      expect(status.utilizationPct).toBe(90);
      expect(quotaGuard.isSpeculationAllowed()).toBe(false);
      expect(quotaGuard.getMaxHistoryTurns()).toBe(2);
    });

    it('transitions to MINIMAL mode when all primary providers fail, even under 60% budget', () => {
      quotaGuard.markProviderFailing('groq');
      quotaGuard.markProviderFailing('gemini');
      quotaGuard.markProviderFailing('openrouter');

      expect(quotaGuard.getCurrentMode()).toBe(DEGRADATION_MODES.MINIMAL);
    });

    it('transitions to WAITLIST mode when 100% of daily budget is exhausted', () => {
      quotaGuard.recordUsage({ provider: 'groq', totalTokens: DEFAULT_DAILY_TOKEN_BUDGET });

      const status = quotaGuard.getStatus();
      expect(status.mode).toBe(DEGRADATION_MODES.WAITLIST);
      expect(status.utilizationPct).toBe(100);
      expect(status.remainingTokens).toBe(0);
      expect(quotaGuard.isSpeculationAllowed()).toBe(false);
    });

    it('enforces per-user daily interview and turn caps', () => {
      const testUser = 'candidate_alice_123';

      // Initially allowed
      let cap = quotaGuard.checkUserCap(testUser);
      expect(cap.allowed).toBe(true);
      expect(cap.interviewsRemaining).toBe(MAX_USER_DAILY_INTERVIEWS);

      // Record max interviews
      for (let i = 0; i < MAX_USER_DAILY_INTERVIEWS; i++) {
        quotaGuard.recordUserInterview(testUser);
      }

      // Interview cap reached
      cap = quotaGuard.checkUserCap(testUser);
      expect(cap.allowed).toBe(false);
      expect(cap.reason).toContain('Daily interview cap reached');

      // Another user is unaffected
      const otherUser = 'candidate_bob_456';
      expect(quotaGuard.checkUserCap(otherUser).allowed).toBe(true);
    });

    it('enforces the per-IP daily turn cap for guests and authenticated users', () => {
      const ip = '192.0.2.10';
      for (let i = 0; i < MAX_IP_DAILY_TURNS; i++) {
        quotaGuard.recordUserTurn({ userId: `user_shared_${i}`, ip });
      }

      const cap = quotaGuard.checkUserCap({ userId: 'candidate_alice_123', ip });
      expect(cap.allowed).toBe(false);
      expect(cap.reason).toContain('Shared network question threshold reached');
    });

    it('increments a candidate turn exactly when a turn is recorded', () => {
      const userId = 'candidate_turn_tracking';
      quotaGuard.recordUserTurn({ userId, ip: '192.0.2.11' });

      expect(quotaGuard.checkUserCap({ userId, ip: '192.0.2.11' }).turnsRemaining).toBe(MAX_USER_DAILY_TURNS - 1);
    });

    it('enforces per-provider token buckets and RPM limits', () => {
      const check1 = quotaGuard.canUseProvider('groq', 500);
      expect(check1.allowed).toBe(true);

      // Exhaust provider limit
      quotaGuard.recordUsage({ provider: 'gemini', totalTokens: 60000 });
      const checkGemini = quotaGuard.canUseProvider('gemini', 500);
      expect(checkGemini.allowed).toBe(false);
      expect(checkGemini.reason).toContain('exceeded');
    });
  });

  describe('2. Token-Saving Rules & History Compression', () => {
    it('compresses long history to the last 2 turns (4 messages) plus running summary', () => {
      const longHistory = [
        { role: 'interviewer', content: 'Tell me about yourself.' },
        { role: 'candidate', content: 'I am a backend engineer with 3 years experience.' },
        { role: 'interviewer', content: 'How do you structure database schemas?' },
        { role: 'candidate', content: 'I use 3NF normalization and indexing.' },
        { role: 'interviewer', content: 'What about cache invalidation?' },
        { role: 'candidate', content: 'I use cache-aside with TTL.' },
      ];

      const compressed = buildTokenSavingHistory(longHistory, 'Candidate demonstrated backend competence.');
      expect(compressed).toContain('Context Summary: Candidate demonstrated backend competence.');
      expect(compressed).toContain('What about cache invalidation?');
      expect(compressed).toContain('I use cache-aside with TTL.');
      // Earliest turns should be omitted from recent turns block
      expect(compressed).not.toContain('Tell me about yourself.');
    });

    it('handles short history cleanly without dropping turns', () => {
      const shortHistory = [
        { role: 'interviewer', content: 'What is a binary search tree?' },
        { role: 'candidate', content: 'A tree where left child is smaller and right is larger.' },
      ];
      const compressed = buildTokenSavingHistory(shortHistory);
      expect(compressed).toContain('What is a binary search tree?');
      expect(compressed).toContain('A tree where left child is smaller');
    });
  });

  describe('3. LLM Router & Model Tagging', () => {
    it('attaches model tag and provider to turn scoring results', async () => {
      const evalResult = await callTurnScoring({
        previousQuestion: 'How would you scale a web service?',
        userAnswer: 'I would use load balancing, horizontal pod autoscaling, and Redis caching with read replicas.',
        questionNumber: 3,
        difficultyTag: 'medium',
      });

      expect(evalResult).toHaveProperty('score');
      expect(evalResult).toHaveProperty('evalModelUsed');
      expect(evalResult).toHaveProperty('evalProvider');
      expect(evalResult).toHaveProperty('dimensions');
      expect(typeof evalResult.score).toBe('number');
      expect(evalResult.score).toBeGreaterThanOrEqual(0);
      expect(evalResult.score).toBeLessThanOrEqual(100);
    });

    it('uses deterministic 0ms scripted fallback in MINIMAL or WAITLIST mode for fast reply', async () => {
      // Force minimal mode
      quotaGuard.recordUsage({ provider: 'groq', totalTokens: Math.round(DEFAULT_DAILY_TOKEN_BUDGET * 0.95) });

      const reply = await callFastReply({
        previousQuestion: 'Explain optimistic locking.',
        userAnswer: 'It uses a version column to detect concurrent updates.',
        questionNumber: 2,
      });

      expect(reply.modelUsed).toBe('scripted-minimal');
      expect(reply.provider).toBe('deterministic-fallback');
      expect(reply.complete).toBe(false);
      expect(reply.followUpQuestion).toBeTruthy();
    });

    it('defers scoring to Job Queue when in MINIMAL mode', async () => {
      quotaGuard.recordUsage({ provider: 'groq', totalTokens: Math.round(DEFAULT_DAILY_TOKEN_BUDGET * 0.95) });

      const evalResult = await callTurnScoring({
        previousQuestion: 'Design rate limiting.',
        userAnswer: 'Token bucket algorithm using Redis.',
        sessionId: 'session_test_999',
      });

      expect(evalResult.isDeferred).toBe(true);
      expect(evalResult.evalModelUsed).toBe('deferred-queue');
      expect(evalResult.jobId).toBeTruthy();

      const queueStats = deferredJobQueue.getStats();
      expect(queueStats.totalJobs).toBeGreaterThanOrEqual(1);
    });
  });

  describe('4. Deferred Job Queue', () => {
    it('enqueues and tracks pending score and report jobs', () => {
      const job = deferredJobQueue.enqueueScoreTurn({
        sessionId: 'session_abc',
        questionNumber: 2,
        userAnswer: 'Sample answer text',
      });

      expect(job.status).toBe(JOB_STATUS.PENDING);
      expect(job.jobId).toBeTruthy();

      const fetched = deferredJobQueue.getJob(job.jobId);
      expect(fetched).not.toBeNull();
      expect(fetched?.payload.sessionId).toBe('session_abc');

      const sessionJobs = deferredJobQueue.getJobsForSession('session_abc');
      expect(sessionJobs.length).toBe(1);
    });
  });

  describe('5. Edge TTS Resiliency & 403 Fix', () => {
    it('instantiates EdgeTTS without throwing constructor errors', () => {
      const tts = new EdgeTTS({
        voice: 'en-US-JennyNeural',
        lang: 'en-US',
      });
      expect(tts).toBeDefined();
    });
  });
});

