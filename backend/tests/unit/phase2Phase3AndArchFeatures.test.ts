import { describe, expect, it, vi } from 'vitest';

vi.mock('../../db/supabaseClient.js', () => {
  const dbError = new Error('Database offline in unit test');
  const createQueryMock = () => {
    const chain: any = {
      select: () => chain,
      insert: () => Promise.resolve({ data: null, error: dbError }),
      upsert: () => Promise.resolve({ data: null, error: dbError }),
      update: () => chain,
      delete: () => chain,
      eq: () => chain,
      order: () => chain,
      limit: () => Promise.resolve({ data: null, error: dbError }),
      maybeSingle: () => Promise.resolve({ data: null, error: dbError }),
      single: () => Promise.resolve({ data: null, error: dbError }),
    };
    return chain;
  };

  const mock = {
    from: () => createQueryMock(),
  };

  return {
    supabase: mock,
    supabaseAdmin: mock,
    _supabaseAdmin: mock,
    default: mock,
  };
});

import { createLogger, getLogLevelForEnv } from '../../utils/structuredLogger.js';
import { getInterviewPlayback, saveTranscriptTurns } from '../../services/transcriptPlaybackService.ts';
import { isStreakAtRisk, runStreakReminderJob } from '../../../workers/streakReminder.js';
import {
  buildDeterministicFollowUps,
  getCompanyIntelligence,
  markQuestionSeenRecently,
} from '../../services/companyQuestionService.ts';
import { parseGithubRepoUrl, runStaticCodeAnalysis } from '../../services/codeReviewService.ts';
import { checkFeatureAccess, normalizeTier, requireFeature } from '../../services/featureGateService.ts';
import {
  buildReferralLink,
  claimReferral,
  normalizeReferralCode,
} from '../../services/referralService.ts';
import {
  getActiveWeeklyContest,
  getWeeklyContestLeaderboard,
  gradeContestAnswers,
  submitWeeklyContest,
} from '../../services/weeklyContestService.ts';

describe('A3 Structured Logging & Observability', () => {
  it('selects environment-specific log levels', () => {
    const prev = process.env.LOG_LEVEL;
    delete process.env.LOG_LEVEL;
    expect(getLogLevelForEnv('test')).toBe('error');
    expect(getLogLevelForEnv('development')).toBe('debug');
    expect(getLogLevelForEnv('production')).toBe('info');
    if (prev !== undefined) process.env.LOG_LEVEL = prev;
  });

  it('scrubs sensitive keys and JWTs in structured log entries', () => {
    const logger = createLogger('test-op');
    const entry = logger.formatEntry('info', 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.sig', {
      password: 'secret-value',
      requestId: 'req-123',
      email: 'alice@example.com',
    });
    expect(entry.password).toBe('[REDACTED]');
    expect(entry.requestId).toBe('req-123');
    expect(entry.email).toBe('al***@example.com');
    expect(entry.message).toContain('[REDACTED_JWT]');
  });
});

describe('F2-3 Interview Recording & Transcript Playback', () => {
  it('saves transcript turns and enforces audioConsent before exposing audioUrl', async () => {
    const userId = `user-f23-${Date.now()}`;
    const sessionId = `sess-f23-${Date.now()}`;
    await saveTranscriptTurns(userId, sessionId, [
      {
        turnIndex: 0,
        speaker: 'interviewer',
        transcriptText: 'Explain consistent hashing.',
        timestampMs: 0,
      },
      {
        turnIndex: 1,
        speaker: 'candidate',
        transcriptText: 'Consistent hashing maps keys and nodes onto a ring.',
        idealAnswer: 'Discuss virtual nodes and O(log N) lookup.',
        turnScore: 86,
        timestampMs: 15000,
        audioUrl: 'https://cdn.example.com/audio.webm',
        audioConsent: false,
      },
      {
        turnIndex: 2,
        speaker: 'candidate',
        transcriptText: 'Unsafe URL test.',
        timestampMs: 25000,
        audioUrl: 'javascript:alert(1)',
        audioConsent: true,
      },
    ]);

    const playback = await getInterviewPlayback(userId, sessionId);
    expect(playback.turns.length).toBe(3);
    expect(playback.averageTurnScore).toBe(86);
    expect(playback.hasAudio).toBe(false);
    expect(playback.turns[1].audioUrl).toBeNull();
    expect(playback.turns[2].audioUrl).toBeNull();
  });
});

describe('F2-4 Daily Streak & Push/Email Reminder Worker', () => {
  it('flags streak at risk after 20 hours of inactivity', () => {
    const now = new Date('2026-11-12T18:00:00.000Z');
    expect(isStreakAtRisk('2026-11-12', now)).toBe(false);
    expect(isStreakAtRisk('2026-11-11T10:00:00.000Z', now)).toBe(true);
    expect(isStreakAtRisk('2026-11-12T04:00:00.000Z', now)).toBe(false);
  });

  it('sends email and Expo push notifications idempotently', async () => {
    const sendMail = vi.fn().mockResolvedValue({ messageId: '1' });
    const sendPush = vi.fn().mockResolvedValue({ data: { status: 'ok' } });
    const updateMock = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });

    const fakeSupabase = {
      from: (table: string) => {
        if (table === 'user_streaks') {
          return {
            select: () => ({
              gt: () => ({
                neq: () =>
                  Promise.resolve({
                    data: [{ user_id: 'u1', current_streak: 5, last_active_date: '2026-11-10' }],
                    error: null,
                  }),
              }),
            }),
          };
        }
        if (table === 'profiles') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: () =>
                  Promise.resolve({ data: { email: 'u1@example.com', full_name: 'Alice' } }),
              }),
            }),
          };
        }
        if (table === 'user_push_tokens') {
          return {
            select: () => ({
              eq: () =>
                Promise.resolve({
                  data: [
                    {
                      expo_push_token: 'ExponentPushToken[abc]',
                      email_reminders_enabled: true,
                      push_reminders_enabled: true,
                      last_reminded_date: null,
                    },
                  ],
                }),
            }),
            update: updateMock,
          };
        }
        return {};
      },
    };

    const res = await runStreakReminderJob({
      supabase: fakeSupabase,
      transporter: { sendMail },
      sendPush,
      now: new Date('2026-11-12T13:30:00.000Z'),
    });

    expect(res.evaluated).toBe(1);
    expect(res.emailsSent).toBe(1);
    expect(res.pushesSent).toBe(1);
    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(sendPush).toHaveBeenCalledTimes(1);
  });
});

describe('F2-5 Company-Specific Interview Intelligence', () => {
  it('returns role tracks, difficulty distribution, recent sighting, and 3 follow-ups', async () => {
    const intel = await getCompanyIntelligence();
    expect(intel.totalQuestions).toBeGreaterThan(0);
    expect(intel.roleTracks.map((r) => r.track)).toEqual(['SWE', 'PM', 'Data', 'Design']);
    expect(intel.difficultyDistribution).toHaveProperty('easy');
    expect(intel.difficultyDistribution).toHaveProperty('medium');
    expect(intel.difficultyDistribution).toHaveProperty('hard');

    const sighting = markQuestionSeenRecently('q-sample-1');
    expect(sighting.questionId).toBe('q-sample-1');

    const followUps = buildDeterministicFollowUps('Design a rate limiter', 'I would use Redis token bucket', 'Stripe');
    expect(followUps).toHaveLength(3);
  });
});

describe('F2-7 AI-Powered Code Review for Real Projects', () => {
  it('validates GitHub URLs safely and detects SQLi, XSS, and secrets', () => {
    expect(parseGithubRepoUrl('https://github.com/vercel/next.js')).toEqual({
      owner: 'vercel',
      repo: 'next.js',
    });
    expect(parseGithubRepoUrl('http://169.254.169.254/latest/meta-data')).toBeNull();

    const unsafeSnippet = `
      const api_key = "sk_live_supersecret12345";
      const q = \`SELECT * FROM users WHERE id = \${userId}\`;
      el.innerHTML = userInput;
    `;
    const analysis = runStaticCodeAnalysis(unsafeSnippet);
    expect(analysis.securityFindings.length).toBeGreaterThanOrEqual(3);
    expect(analysis.interviewReadinessScore).toBeLessThan(60);
  });
});

describe('G3-1 Freemium Feature Gates', () => {
  it('enforces tier gates and middleware 403 responses', async () => {
    expect(normalizeTier('premium')).toBe('elite');
    const freeCodeReview = await checkFeatureAccess({
      userId: 'u-free',
      featureKey: 'code_review_ai',
      tierOverride: 'free',
    });
    expect(freeCodeReview.allowed).toBe(false);
    expect(freeCodeReview.upgradeRequired).toBe(true);

    const proCodeReview = await checkFeatureAccess({
      userId: 'u-pro',
      featureKey: 'code_review_ai',
      currentUsageCount: 1,
      tierOverride: 'pro',
    });
    expect(proCodeReview.allowed).toBe(true);
    expect(proCodeReview.remaining).toBe(2);

    const mw = requireFeature('code_review_ai');
    const req: any = { user: { id: '00000000-0000-0000-0000-000000000000' } };
    const jsonSpy = vi.fn();
    const res: any = { status: vi.fn(() => ({ json: jsonSpy })) };
    const next = vi.fn();
    await mw(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(jsonSpy.mock.calls[0][0].code).toBe('FEATURE_GATE_BLOCKED');
  });
});

describe('G3-2 Referral & Coin Economy', () => {
  it('normalizes referral codes, builds links, and prevents self-referral', async () => {
    const code = normalizeReferralCode('alice_dev!');
    expect(code).toBe('ALICE_DEV');
    expect(buildReferralLink(code)).toContain('/ref/ALICE_DEV');

    await expect(
      claimReferral({ refereeId: 'u1', referrerId: 'u1', referralCode: 'ALICE_DEV' })
    ).rejects.toThrow(/Self-referral/i);
  });
});

describe('G3-3 Weekly Contest System with Leaderboard', () => {
  it('grades 3 problems and ranks leaderboard by score DESC then time ASC', async () => {
    const contest = getActiveWeeklyContest(new Date('2026-11-12T00:00:00Z'));
    expect(contest.problems).toHaveLength(3);
    expect(contest.durationMinutes).toBe(90);

    const graded = gradeContestAnswers(contest.problems, {
      'p1-two-sum-window': 'function hasSubarraySum(nums, k) { const map = new Map(); let sum = 0; return map.has(sum - k); }',
    });
    expect(graded.problemsSolved).toBe(1);
    expect(graded.score).toBe(100);

    const contestId = `test-contest-${Date.now()}`;
    await submitWeeklyContest({
      contestId,
      userId: 'u-slower',
      username: 'Slower',
      answers: {
        'p1-two-sum-window': 'const map = new Map(); let sum = 0; map.has(sum);',
      },
      timeTakenSeconds: 900,
    });
    await submitWeeklyContest({
      contestId,
      userId: 'u-faster',
      username: 'Faster',
      answers: {
        'p1-two-sum-window': 'const map = new Map(); let sum = 0; map.has(sum);',
      },
      timeTakenSeconds: 450,
    });

    const lb = await getWeeklyContestLeaderboard(contestId);
    expect(lb[0].username).toBe('Faster');
    expect(lb[1].username).toBe('Slower');
  });

  it('skips email reminder if user_streaks.last_reminded_date is already today (even without push tokens)', async () => {
    const sendMail = vi.fn().mockResolvedValue({ messageId: '1' });
    const fakeSupabase = {
      from: (table: string) => {
        if (table === 'user_streaks') {
          return {
            select: () => ({
              gt: () => ({
                neq: () =>
                  Promise.resolve({
                    data: [
                      {
                        user_id: 'u-no-token',
                        current_streak: 4,
                        last_active_date: '2026-11-10',
                        last_reminded_date: '2026-11-12',
                      },
                    ],
                    error: null,
                  }),
              }),
            }),
          };
        }
        if (table === 'profiles') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: () =>
                  Promise.resolve({ data: { email: 'u2@example.com', full_name: 'Bob' } }),
              }),
            }),
          };
        }
        if (table === 'user_push_tokens') {
          return {
            select: () => ({
              eq: () => Promise.resolve({ data: [] }),
            }),
          };
        }
        return {};
      },
    };

    const res = await runStreakReminderJob({
      supabase: fakeSupabase,
      transporter: { sendMail },
      now: new Date('2026-11-12T13:30:00.000Z'),
    });

    expect(res.skipped).toBe(1);
    expect(res.emailsSent).toBe(0);
    expect(sendMail).not.toHaveBeenCalled();
  });
});
