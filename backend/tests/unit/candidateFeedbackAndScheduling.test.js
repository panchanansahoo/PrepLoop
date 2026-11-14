import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as emailService from '../../services/emailService.js';
import express from 'express';
import {
  buildCandidateReminderEmail,
  formatCandidateSmsReminder,
  formatSlackReminderPayload,
  dispatchCandidateReminder,
} from '../../utils/interviewMailer.js';
import feedbackPortalRouter, {
  sanitizeCandidateReport,
  generateCandidateSafeFeedback,
  generateAvailableSlotWindows,
} from '../../routes/interview/feedbackPortal.js';

describe('Candidate Experience & Scheduling Automation (Pillar 4)', () => {
  describe('interviewMailer - Multi-Channel 24h & 1h Countdown Reminders', () => {
    const baseParams = {
      candidateEmail: 'candidate.jane@example.com',
      candidateName: 'Jane Doe',
      questionSetTitle: 'Senior Full-Stack Engineer Assessment',
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      durationMinutes: 45,
      joinUrl: 'https://preploop.com/ai-interview?token=inv_test123',
      companyName: 'Stripe',
      roleName: 'Senior Software Engineer',
    };

    it('builds a responsive 24h reminder email with preparation checklist', () => {
      const email = buildCandidateReminderEmail({
        ...baseParams,
        countdown: '24h',
      });

      expect(email.subject.toLowerCase()).toContain('24 hours');
      expect(email.subject).toContain('Senior Software Engineer');
      expect(email.countdown).toBe('24h');
      expect(email.html).toContain('24 HOURS REMINDER');
      expect(email.html).toContain('candidate.jane@example.com');
      expect(email.html).toContain('45 Minutes');
      expect(email.html).toContain('https://preploop.com/ai-interview?token=inv_test123');
      expect(email.html).toContain('Preparation Checklist:');
      expect(email.html).toContain('T-Minus 24 Hours');
      expect(email.text).toContain('Countdown: 24h');
    });

    it('builds an urgent 1h countdown reminder email with lobby check-in warning', () => {
      const email = buildCandidateReminderEmail({
        ...baseParams,
        countdown: '1h',
      });

      expect(email.subject).toContain('Starting in 1 Hour');
      expect(email.countdown).toBe('1h');
      expect(email.html).toContain('1 HOUR COUNTDOWN');
      expect(email.html).toContain('Enter Pre-Flight Waiting Room');
      expect(email.html).toContain('Immediate Pre-Flight Checklist:');
      expect(email.text).toContain('starts in approximately 1 hour');
    });

    it('formats concise carrier-compliant SMS reminders for 24h and 1h', () => {
      const sms24 = formatCandidateSmsReminder({
        candidateName: 'Jane',
        questionSetTitle: 'Full-Stack Eng',
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        countdown: '24h',
        joinUrl: 'https://preploop.me/j/123',
      });

      expect(sms24.countdown).toBe('24h');
      expect(sms24.text).toContain('PrepLoop Reminder: Hi Jane,');
      expect(sms24.text).toContain('is tomorrow');
      expect(sms24.length).toBeLessThan(200);

      const sms1h = formatCandidateSmsReminder({
        candidateName: 'Jane',
        questionSetTitle: 'Full-Stack Eng',
        scheduledAt: new Date(Date.now() + 3600000).toISOString(),
        countdown: '1h',
        joinUrl: 'https://preploop.me/j/123',
      });

      expect(sms1h.countdown).toBe('1h');
      expect(sms1h.text).toContain('starts in 1 hour');
      expect(sms1h.length).toBeLessThan(200);
    });

    it('formats recruiter Slack notification card for candidate reminder pings', () => {
      const slackCard = formatSlackReminderPayload({
        candidateName: 'Jane Doe',
        candidateEmail: 'jane@example.com',
        questionSetTitle: 'Frontend Engineer',
        scheduledAt: new Date(Date.now() + 3600000).toISOString(),
        countdown: '1h',
        joinUrl: 'https://preploop.com/lobby',
        durationMinutes: 45,
      });

      expect(slackCard.text).toContain('1 Hour Countdown');
      expect(slackCard.blocks.length).toBeGreaterThanOrEqual(2);
      expect(slackCard.attachments[0].color).toBe('#ef4444');
    });

    it('dispatches reminder in simulated environment without errors', async () => {
      vi.spyOn(emailService, 'isEmailConfigured').mockReturnValue(false);

      const mockQuestionSet = {
        id: 'qs_123',
        title: 'Backend Systems Interview',
        scheduled_at: new Date(Date.now() + 86400000).toISOString(),
        settings: {
          roleName: 'Staff Engineer',
          companyName: 'Acme Corp',
        },
      };

      const result = await dispatchCandidateReminder({
        questionSet: mockQuestionSet,
        candidateEmail: 'engineer@example.com',
        candidateName: 'Sam',
        countdown: '24h',
      });

      expect(result.status).toBe('simulated');
      expect(result.email).toBe('engineer@example.com');
      expect(result.countdown).toBe('24h');
      expect(result.joinUrl).toContain('token=inv_');
    });

    it('dispatches reminder when email service is configured', async () => {
      vi.spyOn(emailService, 'isEmailConfigured').mockReturnValue(true);
      vi.spyOn(emailService, 'sendEmail').mockResolvedValue({ id: 'msg_987', provider: 'resend' });

      const mockQuestionSet = {
        id: 'qs_123',
        title: 'Backend Systems Interview',
        scheduled_at: new Date(Date.now() + 3600000).toISOString(),
        settings: {
          roleName: 'Staff Engineer',
          companyName: 'Acme Corp',
        },
      };

      const result = await dispatchCandidateReminder({
        questionSet: mockQuestionSet,
        candidateEmail: 'engineer@example.com',
        candidateName: 'Sam',
        countdown: '1h',
      });

      expect(result.status).toBe('sent');
      expect(result.messageId).toBe('msg_987');
      expect(result.countdown).toBe('1h');
    });
  });

  describe('feedbackPortal - Redaction & Safe Candidate Report Synthesis', () => {
    it('strictly redacts sensitive recruiter rubrics and proctoring fields', () => {
      const sensitiveData = {
        candidateName: 'Alex',
        decision: 'rejected',
        passingScore: 80,
        score: 65,
        integrity: {
          flagged: true,
          tabSwitchCount: 14,
          pasteCount: 5,
          cheatConfidence: 0.92,
        },
        rubricWeights: { algorithms: 0.5, speed: 0.5 },
        recruiterComments: 'Candidate struggled on concurrency, recommend no hire.',
        hiringRecommendation: 'DO NOT HIRE',
        evaluationSummary: {
          strengths: ['Good communication'],
          internalNotes: 'Secret internal note',
        },
      };

      const sanitized = sanitizeCandidateReport(sensitiveData);

      expect(sanitized.candidateName).toBe('Alex');
      expect(sanitized).not.toHaveProperty('decision');
      expect(sanitized).not.toHaveProperty('passingScore');
      expect(sanitized).not.toHaveProperty('integrity');
      expect(sanitized).not.toHaveProperty('tabSwitchCount');
      expect(sanitized).not.toHaveProperty('rubricWeights');
      expect(sanitized).not.toHaveProperty('recruiterComments');
      expect(sanitized).not.toHaveProperty('hiringRecommendation');
      expect(sanitized.evaluationSummary).not.toHaveProperty('internalNotes');
      expect(sanitized.evaluationSummary.strengths).toEqual(['Good communication']);
    });

    it('generates constructive candidate-safe feedback without rubric leakage', () => {
      const mockSubmission = {
        id: 'sub_999',
        attempt_id: 'att_999',
        user_name: 'David Kim',
        user_email: 'david.kim@example.com',
        duration: 2500,
        scores: {
          executiveSummary: {
            keyStrengths: 'Key Strengths: Exemplary knowledge of database indexing and query planning.',
            growthAreas: 'Growth Areas: Elaborate more on microservice saga rollback patterns.',
            hiringRecommendation: 'STRONG HIRE - GIVE LEVEL 5',
          },
          passingScore: 75,
          decision: 'qualified',
          integrity: { flagged: false, tabSwitchCount: 0 },
          breakdown: {
            algorithms: 90,
            systemArchitecture: 85,
          },
        },
      };

      const safeReport = generateCandidateSafeFeedback(mockSubmission, {
        title: 'Backend Engineering Assessment',
        settings: { companyName: 'CloudScale', roleName: 'Senior Backend Engineer' },
      });

      expect(safeReport.candidateName).toBe('David Kim');
      expect(safeReport.companyName).toBe('CloudScale');
      expect(safeReport.evaluationSummary.strengths[0]).toContain('Exemplary knowledge of database indexing');
      expect(safeReport.evaluationSummary.growthTips[0]).toContain('Elaborate more on microservice saga rollback patterns');
      expect(safeReport).not.toHaveProperty('decision');
      expect(safeReport).not.toHaveProperty('passingScore');
      expect(safeReport).not.toHaveProperty('integrity');
      expect(JSON.stringify(safeReport)).not.toContain('STRONG HIRE');
      expect(JSON.stringify(safeReport)).not.toContain('qualified');
      expect(safeReport.recommendedResources.length).toBeGreaterThan(0);
    });

    it('generates dynamic candidate self-scheduling slot windows skipping weekends', () => {
      const slots = generateAvailableSlotWindows(new Date('2026-11-16T08:00:00Z'), 7);

      expect(slots.length).toBeGreaterThan(0);
      slots.forEach(slot => {
        expect(slot).toHaveProperty('slotId');
        expect(slot).toHaveProperty('date');
        expect(slot).toHaveProperty('time');
        expect(slot).toHaveProperty('utcTimestamp');
        expect(slot.available).toBe(true);

        const slotDay = new Date(slot.utcTimestamp).getDay();
        expect(slotDay).not.toBe(0); // Not Sunday
        expect(slotDay).not.toBe(6); // Not Saturday
      });
    });
  });

  describe('feedbackPortal - HTTP Endpoint Integration', () => {
    let app;
    let server;
    let baseUrl;

    beforeEach(async () => {
      app = express();
      app.use(express.json());
      app.use('/api/interview', feedbackPortalRouter);

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
      if (server) {
        await new Promise((resolve) => server.close(() => resolve()));
        server = null;
      }
    });

    it('GET /api/interview/feedback-portal/:token returns 400 for empty or whitespace token', async () => {
      const res = await fetch(`${baseUrl}/api/interview/feedback-portal/%20%20%20`);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/token is required/i);
    });

    it('GET /api/interview/feedback-portal/:token serves candidate-safe report for test tokens', async () => {
      const res = await fetch(`${baseUrl}/api/interview/feedback-portal/cfb_test_candidate123`);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.report).toBeDefined();
      expect(json.report.candidateName).toBe('Jordan Lee');
      expect(json.report.evaluationSummary.strengths.length).toBeGreaterThan(0);
      expect(json.report.evaluationSummary.growthTips.length).toBeGreaterThan(0);

      // Verify no leak
      expect(json.report).not.toHaveProperty('decision');
      expect(json.report).not.toHaveProperty('passingScore');
      expect(json.report).not.toHaveProperty('integrity');
      expect(JSON.stringify(json.report)).not.toContain('REDACTED_INTERNAL_DO_NOT_SHOW');
    });

    it('GET /api/interview/feedback-portal/schedule/:token returns self-scheduling availability slots', async () => {
      const res = await fetch(`${baseUrl}/api/interview/feedback-portal/schedule/demo_schedule_123`);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.scheduling).toBeDefined();
      expect(json.scheduling.availableSlots.length).toBeGreaterThan(0);
      expect(json.scheduling.durationMinutes).toBe(45);
    });

    it('POST /api/interview/feedback-portal/schedule/:token/book confirms a future slot and provides .ics calendar data', async () => {
      const futureDate = new Date(Date.now() + 2 * 86400000).toISOString();
      const res = await fetch(`${baseUrl}/api/interview/feedback-portal/schedule/demo_schedule_123/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotTimestamp: futureDate,
          candidateTimezone: 'America/New_York',
        }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.booking.scheduledAt).toBe(futureDate);
      expect(json.booking.candidateTimezone).toBe('America/New_York');
      expect(json.booking.calendarIcs).toContain('BEGIN:VCALENDAR');
    });

    it('POST /api/interview/feedback-portal/schedule/:token/book rejects booking in the past', async () => {
      const pastDate = new Date(Date.now() - 3600000).toISOString();
      const res = await fetch(`${baseUrl}/api/interview/feedback-portal/schedule/demo_schedule_123/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotTimestamp: pastDate,
        }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/cannot book a slot in the past/i);
    });
  });
});
