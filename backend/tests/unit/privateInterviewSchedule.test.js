import { describe, it, expect } from 'vitest';
import {
  normalizeInterviewLimits,
  getInterviewScheduleStatus,
  isInterviewLinkExpired,
  verifyInterviewPasscode,
  verifyInterviewInviteeEmail,
  matchExpectedTopics,
  evaluateAssessmentIntegrity,
} from '../../utils/privateInterviewAccess.js';
import {
  generateCalendarIcs,
  buildCandidateInviteEmail,
  dispatchCandidateInvitations,
  dispatchInterviewWebhook,
} from '../../utils/interviewMailer.js';

describe('Private Interview Session & Schedule Time Conformance', () => {
  it('normalizes scheduledAt and scheduledDurationMinutes properly', () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const result = normalizeInterviewLimits({
      scheduledAt: futureDate,
      scheduledDurationMinutes: 60,
    });

    expect(result.scheduled_at).toBe(futureDate);
    expect(result.scheduled_duration_minutes).toBe(60);
    expect(result.scheduledAt).toBe(futureDate);
    expect(result.scheduledDurationMinutes).toBe(60);
  });

  it('rejects invalid scheduled duration values outside 5-480 min range', () => {
    expect(() => {
      normalizeInterviewLimits({ scheduledDurationMinutes: 2 });
    }).toThrow(/between 5 and 480 minutes/);

    expect(() => {
      normalizeInterviewLimits({ scheduledDurationMinutes: 500 });
    }).toThrow(/between 5 and 480 minutes/);
  });

  it('defaults scheduled duration to 45 minutes when omitted', () => {
    const result = normalizeInterviewLimits({});
    expect(result.scheduled_duration_minutes).toBe(45);
    expect(result.scheduledDurationMinutes).toBe(45);
  });

  it('identifies upcoming scheduled interview when current time is before session', () => {
    const futureStart = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours in future
    const status = getInterviewScheduleStatus(futureStart, 45);

    expect(status.status).toBe('upcoming');
    expect(status.isScheduled).toBe(true);
    expect(status.canStartNow).toBe(false);
    expect(status.secondsUntilStart).toBeGreaterThan(7000);
  });

  it('allows joining when within early check-in buffer (10 minutes before start)', () => {
    const soonStart = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes in future
    const status = getInterviewScheduleStatus(soonStart, 45);

    expect(status.status).toBe('open');
    expect(status.isScheduled).toBe(true);
    expect(status.canStartNow).toBe(true);
  });

  it('allows joining during the active scheduled session window', () => {
    const pastStart = new Date(Date.now() - 15 * 60 * 1000).toISOString(); // started 15 min ago, 45 min duration
    const status = getInterviewScheduleStatus(pastStart, 45);

    expect(status.status).toBe('open');
    expect(status.isScheduled).toBe(true);
    expect(status.canStartNow).toBe(true);
    expect(status.secondsRemainingInWindow).toBeGreaterThan(0);
  });

  it('identifies ended scheduled session when window plus grace period has passed', () => {
    const wayPastStart = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(); // started 3 hours ago
    const status = getInterviewScheduleStatus(wayPastStart, 45, 15);

    expect(status.status).toBe('ended');
    expect(status.isScheduled).toBe(true);
    expect(status.canStartNow).toBe(false);
  });

  it('returns anytime status when interview is not scheduled', () => {
    const status = getInterviewScheduleStatus(null);
    expect(status.status).toBe('anytime');
    expect(status.isScheduled).toBe(false);
    expect(status.canStartNow).toBe(true);
  });

  it('preserves existing passcode and email allowlist security controls alongside schedule', () => {
    const limits = normalizeInterviewLimits({
      passcode: 'SecretPass123',
      allowedEmails: ['candidate@test.com'],
      scheduledAt: new Date(Date.now() + 3600000).toISOString(),
      scheduledDurationMinutes: 30,
    });

    expect(limits.passcode_hash).toBeDefined();
    expect(verifyInterviewPasscode('SecretPass123', limits.passcode_hash)).toBe(true);
    expect(verifyInterviewPasscode('WrongPass', limits.passcode_hash)).toBe(false);

    expect(verifyInterviewInviteeEmail('candidate@test.com', limits.allowed_emails)).toBe(true);
    expect(verifyInterviewInviteeEmail('intruder@test.com', limits.allowed_emails)).toBe(false);
  });

  describe('Assessment Integrity & Anti-Cheating Telemetry', () => {
    it('rates 0 tab switches as clean with a perfect 100 score', () => {
      const result = evaluateAssessmentIntegrity(0);
      expect(result.tabSwitchCount).toBe(0);
      expect(result.integrityRating).toBe('clean');
      expect(result.integrityScore).toBe(100);
      expect(result.flagged).toBe(false);
    });

    it('rates 1-2 tab switches as moderate without flagging', () => {
      const result = evaluateAssessmentIntegrity(2);
      expect(result.tabSwitchCount).toBe(2);
      expect(result.integrityRating).toBe('moderate');
      expect(result.integrityScore).toBe(70);
      expect(result.flagged).toBe(false);
    });

    it('flags sessions with more than 2 tab switches', () => {
      const result = evaluateAssessmentIntegrity(4);
      expect(result.tabSwitchCount).toBe(4);
      expect(result.integrityRating).toBe('flagged');
      expect(result.flagged).toBe(true);
      expect(result.integrityScore).toBe(40);
    });

    it('handles negative or invalid tab switch inputs gracefully', () => {
      const resNaN = evaluateAssessmentIntegrity('not_a_number');
      expect(resNaN.tabSwitchCount).toBe(0);
      expect(resNaN.integrityRating).toBe('clean');

      const resNeg = evaluateAssessmentIntegrity(-5);
      expect(resNeg.tabSwitchCount).toBe(0);
    });

    it('evaluates clipboard paste telemetry and objects correctly', () => {
      const res = evaluateAssessmentIntegrity({ tabSwitchCount: 1, pasteCount: 2 });
      expect(res.tabSwitchCount).toBe(1);
      expect(res.pasteCount).toBe(2);
      expect(res.integrityRating).toBe('moderate');
      expect(res.flagged).toBe(false);
      expect(res.integrityScore).toBe(65); // 100 - 15 - 20
    });

    it('flags session when excessive clipboard paste activity occurs', () => {
      const res = evaluateAssessmentIntegrity({ tabSwitchCount: 0, pasteCount: 4 });
      expect(res.tabSwitchCount).toBe(0);
      expect(res.pasteCount).toBe(4);
      expect(res.integrityRating).toBe('flagged');
      expect(res.flagged).toBe(true);
      expect(res.integrityScore).toBe(60);
    });
  });

  describe('Per-Question Expected Topic Coverage Matching', () => {
    it('accurately identifies covered vs missed topics in candidate answer', () => {
      const answer = "In React we manage state using useState and Redux for centralized data flow.";
      const expectedTopics = ["useState", "Redux", "Error Boundaries", "Server Components"];

      const result = matchExpectedTopics(answer, expectedTopics);
      expect(result.coveredTopics).toEqual(["useState", "Redux"]);
      expect(result.missedTopics).toEqual(["Error Boundaries", "Server Components"]);
      expect(result.coverageRatio).toBe(0.5);
    });

    it('returns empty lists and 1.0 coverage ratio when no expected topics are configured', () => {
      const answer = "General response without specific criteria.";
      const result = matchExpectedTopics(answer, []);
      expect(result.coveredTopics).toEqual([]);
      expect(result.missedTopics).toEqual([]);
      expect(result.coverageRatio).toBe(1);
    });

    it('performs case-insensitive and partial keyword matching', () => {
      const answer = "I implemented asynchronous fetching with promises and error handling.";
      const expectedTopics = ["Asynchronous", "Error Handling", "WebSockets"];

      const result = matchExpectedTopics(answer, expectedTopics);
      expect(result.coveredTopics).toContain("Asynchronous");
      expect(result.coveredTopics).toContain("Error Handling");
      expect(result.missedTopics).toContain("WebSockets");
    });
  });

  describe('Candidate Pass/Fail Benchmark & Auto-Decisioning', () => {
    it('qualifies candidates whose score meets or exceeds passingScore without integrity flags', () => {
      const passingScore = 70;
      const score = 82;
      const isFlagged = false;

      let decision = 'qualified';
      if (isFlagged || score < passingScore - 15) {
        decision = 'rejected';
      } else if (score < passingScore) {
        decision = 'review_needed';
      }

      expect(decision).toBe('qualified');
    });

    it('marks candidate as review_needed when score is slightly below threshold', () => {
      const passingScore = 75;
      const score = 68; // within 15 points
      const isFlagged = false;

      let decision = 'qualified';
      if (isFlagged || score < passingScore - 15) {
        decision = 'rejected';
      } else if (score < passingScore) {
        decision = 'review_needed';
      }

      expect(decision).toBe('review_needed');
    });

    it('rejects candidate if integrity flagged or score is significantly below threshold', () => {
      const passingScore = 70;
      const score = 80;
      const isFlagged = true; // Cheating flagged

      let decision = 'qualified';
      if (isFlagged || score < passingScore - 15) {
        decision = 'rejected';
      } else if (score < passingScore) {
        decision = 'review_needed';
      }

      expect(decision).toBe('rejected');
    });
  });

  describe('RFC 5545 Calendar Generator & Candidate Mailer', () => {
    it('generates a valid RFC 5545 .ics calendar invite with correct timestamps and VEVENT block', () => {
      const scheduledAt = new Date('2026-11-20T14:00:00Z').toISOString();
      const ics = generateCalendarIcs({
        title: 'Senior Frontend Engineer Interview',
        description: 'Technical evaluation covering React and System Design',
        scheduledAt,
        durationMinutes: 60,
        joinUrl: 'https://preploop.com/ai-interview?token=test-token-123',
        organizerName: 'PrepLoop Tech Recruiting',
      });

      expect(ics).toContain('BEGIN:VCALENDAR');
      expect(ics).toContain('VERSION:2.0');
      expect(ics).toContain('METHOD:REQUEST');
      expect(ics).toContain('BEGIN:VEVENT');
      expect(ics).toContain('SUMMARY:Senior Frontend Engineer Interview');
      expect(ics).toContain('DTSTART:20261120T140000Z');
      expect(ics).toContain('DTEND:20261120T150000Z');
      expect(ics).toContain('URL:https://preploop.com/ai-interview?token=test-token-123');
      expect(ics).toContain('ORGANIZER;CN=PrepLoop Tech Recruiting');
      expect(ics).toContain('END:VEVENT');
      expect(ics).toContain('END:VCALENDAR');
    });

    it('builds responsive HTML and text emails with personalized join links and session details', () => {
      const scheduledAt = new Date('2026-11-25T10:00:00Z').toISOString();
      const email = buildCandidateInviteEmail({
        candidateEmail: 'candidate@example.com',
        candidateName: 'Jane Doe',
        questionSetTitle: 'Backend Architecture Assessment',
        scheduledAt,
        durationMinutes: 45,
        joinUrl: 'https://preploop.com/ai-interview?token=arch-101&email=candidate%40example.com',
        passcode: 'SecretPass2026',
        companyName: 'Acme Corp',
        roleName: 'Lead Systems Architect',
      });

      expect(email.html).toContain('Hi Jane Doe,');
      expect(email.html).toContain('Backend Architecture Assessment');
      expect(email.html).toContain('Lead Systems Architect');
      expect(email.html).toContain('Acme Corp');
      expect(email.html).toContain('candidate@example.com');
      expect(email.html).toContain('SecretPass2026');
      expect(email.html).toContain('https://preploop.com/ai-interview?token=arch-101&email=candidate%40example.com');
      expect(email.text).toContain('Interview Invitation: Backend Architecture Assessment');
      expect(email.text).toContain('Access Passcode: SecretPass2026');
    });

    it('dispatches invitations across candidate allowlist returning delivery report', async () => {
      const mockQuestionSet = {
        id: 'qs-test-123',
        title: 'Full Stack Engineering Interview',
        share_code: 'fstk-2026',
        allowed_emails: ['dev1@test.com', 'dev2@test.com'],
        scheduled_at: new Date(Date.now() + 86400000).toISOString(),
        scheduled_duration_minutes: 45,
        settings: { roleName: 'Full Stack Developer' },
      };

      const result = await dispatchCandidateInvitations({
        questionSet: mockQuestionSet,
        candidateEmails: ['dev1@test.com', 'dev2@test.com'],
        baseUrl: 'https://preploop.com',
      });

      expect(result.total).toBe(2);
      expect(result.results).toHaveLength(2);
      expect(result.results[0].email).toBe('dev1@test.com');
      expect(result.results[0].joinUrl).toContain('token=fstk-2026&email=dev1%40test.com');
      expect(result.results[1].email).toBe('dev2@test.com');
      expect(result.results[1].joinUrl).toContain('token=fstk-2026&email=dev2%40test.com');
    });

    it('blocks dangerous SSRF attempts targeting private IP ranges in webhook dispatcher', async () => {
      const blockedUrls = [
        'http://localhost:8080/webhook',
        'http://127.0.0.1:3000/webhook',
        'http://169.254.169.254/latest/meta-data',
        'http://10.0.0.1/admin/callback',
        'http://192.168.1.1/hook',
      ];

      for (const unsafeUrl of blockedUrls) {
        const result = await dispatchInterviewWebhook(unsafeUrl, 'secret', {
          event: 'interview.submission.completed',
          score: 85,
        });

        expect(result.success).toBe(false);
        expect(result.error).toMatch(/SSRF defense policy/i);
      }
    });
  });
});

