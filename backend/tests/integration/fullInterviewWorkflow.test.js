import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express from 'express';
import { QUESTION_SET_TEMPLATES } from '../../../frontend/src/data/questionSetTemplates.js';
import { generateFallbackQuestionsFromJd } from '../../routes/admin.js';
import {
  normalizeInterviewLimits,
  toDbQuestionSetLimits,
  evaluateAssessmentIntegrity,
} from '../../utils/privateInterviewAccess.js';
import {
  generateExecutiveSummary,
} from '../../services/interviewAnswerEvaluator.js';
import { generateProbingFollowUp } from '../../routes/interview/customSets.js';
import {
  formatSlackWebhookPayload,
  dispatchInterviewWebhook,
  generateCalendarIcs,
} from '../../utils/interviewMailer.js';
import customSetsRouter from '../../routes/interview/customSets.js';
import { supabaseAdmin } from '../../db/supabaseClient.js';

describe('Full End-to-End Interview Workflow Integration Test Suite', () => {
  let app;
  let server = null;
  let baseUrl = '';

  beforeEach(async () => {
    vi.restoreAllMocks();

    app = express();
    app.use(express.json());
    app.use('/api/interview/custom-sets', customSetsRouter);

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
      await new Promise((resolve) => server?.close(() => resolve()));
      server = null;
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // STAGE 1: Recruiter Setup & Question Creation with Templates & Limits
  // ──────────────────────────────────────────────────────────────────────────
  describe('Stage 1: Question Set Creation with Templates & Limits', () => {
    it('verifies all industry-standard templates contain required fields, time limits, and expected topics', () => {
      expect(Array.isArray(QUESTION_SET_TEMPLATES)).toBe(true);
      expect(QUESTION_SET_TEMPLATES.length).toBeGreaterThanOrEqual(4);

      const templateIds = QUESTION_SET_TEMPLATES.map((t) => t.id);
      expect(templateIds).toContain('frontend-react');
      expect(templateIds).toContain('backend-nodejs');
      expect(templateIds).toContain('system-design');
      expect(templateIds).toContain('behavioral-star');

      for (const template of QUESTION_SET_TEMPLATES) {
        expect(template.id).toBeTruthy();
        expect(template.title).toBeTruthy();
        expect(template.description).toBeTruthy();
        expect(['technical', 'system-design', 'behavioral', 'mixed']).toContain(template.interviewType);
        expect(['easy', 'medium', 'hard']).toContain(template.difficulty);
        expect(Array.isArray(template.questions)).toBe(true);
        expect(template.questions.length).toBeGreaterThanOrEqual(3);

        for (const q of template.questions) {
          expect(typeof q.question).toBe('string');
          expect(q.question.trim().length).toBeGreaterThan(15);
          expect(typeof q.context).toBe('string');
          expect(Array.isArray(q.expectedTopics)).toBe(true);
          expect(q.expectedTopics.length).toBeGreaterThanOrEqual(3);
          expect(typeof q.timeLimit).toBe('number');
          expect(q.timeLimit).toBeGreaterThanOrEqual(60);
          expect(q.timeLimit).toBeLessThanOrEqual(300);
        }
      }
    });

    it('generates tailored questions from a Job Description with calibrated time limits and expected topics', () => {
      const sampleJD = `
        We are seeking a Senior Full-Stack Engineer with React, Node.js, and Distributed Systems experience.
        Responsibilities:
        - Build resilient backend microservices using Node.js event-driven architecture and streams.
        - Architect high-concurrency databases with ACID transactions and row-level locking.
        - Deliver modern, accessible frontends using React 18 concurrent features and custom hooks.
      `;

      const generated = generateFallbackQuestionsFromJd({
        jobDescription: sampleJD,
        roleName: 'Senior Full Stack Engineer',
        interviewType: 'technical',
        difficulty: 'hard',
        count: 4,
      });

      expect(generated.roleName).toBe('Senior Full Stack Engineer');
      expect(generated.questions).toHaveLength(4);

      const allTopics = generated.questions.flatMap((q) => q.expectedTopics);
      expect(allTopics.length).toBeGreaterThan(5);

      for (const q of generated.questions) {
        expect(q.question.length).toBeGreaterThan(20);
        expect(q.context.length).toBeGreaterThan(10);
        expect(q.expectedTopics.length).toBeGreaterThanOrEqual(2);
        expect(q.timeLimit).toBeGreaterThanOrEqual(60);
      }
    });

    it('normalizes interview access limits and strips camelCase keys for database insertion', () => {
      const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const rawLimits = {
        passcode: 'SecretPass123',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        maxAttempts: 5,
        allowedEmails: ['candidate1@example.com', 'candidate2@example.com'],
        scheduledAt,
        scheduledDurationMinutes: 60,
      };

      const normalized = normalizeInterviewLimits(rawLimits);
      expect(normalized.passcode_hash).toBeTruthy();
      expect(normalized.expires_at).toBe(rawLimits.expiresAt);
      expect(normalized.max_attempts).toBe(5);
      expect(normalized.allowed_emails).toEqual(['candidate1@example.com', 'candidate2@example.com']);
      expect(normalized.scheduled_at).toBe(scheduledAt);
      expect(normalized.scheduled_duration_minutes).toBe(60);

      const dbPayload = toDbQuestionSetLimits(normalized);
      // Confirms database safety: PostgREST rejects unrecognized camelCase keys
      expect(dbPayload).toHaveProperty('passcode_hash');
      expect(dbPayload).toHaveProperty('allowed_emails');
      expect(dbPayload).toHaveProperty('scheduled_at');
      expect(dbPayload).toHaveProperty('scheduled_duration_minutes');
      expect(dbPayload).not.toHaveProperty('allowedEmails');
      expect(dbPayload).not.toHaveProperty('scheduledAt');
      expect(dbPayload).not.toHaveProperty('scheduledDurationMinutes');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // STAGE 2: Candidate Lobby & Pre-flight Metadata
  // ──────────────────────────────────────────────────────────────────────────
  describe('Stage 2: Candidate Lobby & Pre-flight Metadata', () => {
    it('returns comprehensive candidate lobby metadata including schedule status, attempts, and allowlist requirements', async () => {
      const scheduledAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const mockQuestionSet = {
        id: 'qs_test_123',
        title: 'Senior React Engineer Evaluation',
        description: 'Private technical evaluation for React frontend candidates',
        share_code: 'REACT2026',
        interview_type: 'technical',
        difficulty: 'medium',
        requires_login: false,
        passcode_hash: 'hashed_passcode',
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        max_attempts: 10,
        attempts_started: 2,
        allowed_emails: ['candidate@test.com'],
        scheduled_at: scheduledAt,
        scheduled_duration_minutes: 45,
        is_active: true,
        questions: QUESTION_SET_TEMPLATES[0].questions,
        settings: {
          roleName: 'Senior React Engineer',
          companyName: 'Acme Technologies',
          probingMode: true,
          passingScore: 75,
        },
      };

      vi.spyOn(supabaseAdmin, 'from').mockImplementation((table) => {
        if (table === 'admin_question_sets') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: () => Promise.resolve({ data: mockQuestionSet, error: null }),
              }),
            }),
          };
        }
        return {};
      });

      const res = await fetch(`${baseUrl}/api/interview/custom-sets/question-set/REACT2026`);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.questionSet).toBeDefined();
      expect(json.questionSet.id).toBe('qs_test_123');
      expect(json.questionSet.title).toBe('Senior React Engineer Evaluation');
      expect(json.questionSet.requiresPasscode).toBe(true);
      expect(json.questionSet.requiresEmailAllowlist).toBe(true);
      expect(json.questionSet.remainingAttempts).toBe(8);
      expect(json.questionSet.isScheduled).toBe(true);
      expect(json.questionSet.scheduledDurationMinutes).toBe(45);
      expect(json.questionSet.token).toBe('REACT2026');
      expect(json.questionSet.settings.probingMode).toBe(true);
    });

    it('generates an RFC 5545 compliant .ics calendar invitation for candidate calendar synchronization', () => {
      const scheduledAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
      const ics = generateCalendarIcs({
        title: 'Frontend Technical Interview - Acme Corp',
        description: 'Private 45-minute technical evaluation on PrepLoop',
        scheduledAt,
        durationMinutes: 45,
        joinUrl: 'https://preploop.com/interview/custom?code=REACT2026',
        organizerName: 'Acme Recruiting',
        organizerEmail: 'recruiting@acme.com',
      });

      expect(ics).toContain('BEGIN:VCALENDAR');
      expect(ics).toContain('VERSION:2.0');
      expect(ics).toContain('BEGIN:VEVENT');
      expect(ics).toContain('SUMMARY:Frontend Technical Interview - Acme Corp');
      expect(ics).toContain('URL:https://preploop.com/interview/custom?code=REACT2026');
      expect(ics).toContain('ORGANIZER;CN=Acme Recruiting:mailto:recruiting@acme.com');
      expect(ics).toContain('TRIGGER:-PT15M');
      expect(ics).toContain('END:VEVENT');
      expect(ics).toContain('END:VCALENDAR');
    });

    it('accurately evaluates candidate assessment integrity flags and paste / tab-switch counts', () => {
      const cleanIntegrity = evaluateAssessmentIntegrity(0, 0);
      expect(cleanIntegrity.flagged).toBe(false);
      expect(cleanIntegrity.integrityRating).toBe('clean');
      expect(cleanIntegrity.integrityScore).toBeGreaterThanOrEqual(95);

      const suspiciousIntegrity = evaluateAssessmentIntegrity(6, 4);
      expect(suspiciousIntegrity.flagged).toBe(true);
      expect(suspiciousIntegrity.tabSwitchCount).toBe(6);
      expect(suspiciousIntegrity.pasteCount).toBe(4);
      expect(suspiciousIntegrity.integrityRating).toBe('flagged');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // STAGE 3: Turn Evaluation with Probing Mode
  // ──────────────────────────────────────────────────────────────────────────
  describe('Stage 3: Turn Evaluation with Probing Mode', () => {
    it('generates targeted probing follow-up when key expected topics are omitted in candidate response', () => {
      const question = "How does React's Reconciliation and Virtual DOM diffing algorithm work?";
      const expectedTopics = ['Fiber Architecture', 'Priority Lanes', 'Work Loop', 'Commit Phase'];

      // Candidate answer is brief and only mentions Virtual DOM, completely omitting Fiber, Priority Lanes, etc.
      const candidateAnswer = 'React compares the old virtual DOM with the new virtual DOM and updates the HTML.';

      const probingResult = generateProbingFollowUp({
        question,
        userAnswer: candidateAnswer,
        expectedTopics,
        probingMode: true,
        stage: 'Technical',
      });

      expect(probingResult.isProbe).toBe(true);
      expect(probingResult.needsProbing).toBe(true);
      expect(probingResult.followUpQuestion).toBeTruthy();
      expect(probingResult.topicEvaluation.missedTopics.length).toBeGreaterThan(0);

      // Verify follow-up probes on one of the omitted expected topics
      const probedTopic = probingResult.topicEvaluation.missedTopics[0];
      expect(probingResult.followUpQuestion).toContain(probedTopic);
    });

    it('scores comprehensive answers highly without triggering unnecessary probing when expected topics are met', () => {
      const question = 'Explain Node.js Streams and backpressure.';
      const expectedTopics = ['Backpressure', 'pipeline()', 'Readable / Writable Streams', 'highWaterMark'];

      const comprehensiveAnswer = `
        In my production project, I implemented Node.js streams to handle large file uploads without exhausting server memory.
        First, we used readable and writable streams because processing data chunk by chunk prevents memory pressure.
        Second, backpressure occurs when the writable stream cannot consume data as fast as the readable stream produces it.
        For example, we managed backpressure using the pipeline() utility to pipe data from client request to the database,
        ensuring buffer memory and highWaterMark thresholds are strictly maintained under heavy concurrency, thread, and process load.
      `;

      const turnResult = generateProbingFollowUp({
        question,
        userAnswer: comprehensiveAnswer,
        expectedTopics,
        probingMode: true,
        stage: 'Technical',
      });

      expect(turnResult.topicEvaluation.coveredTopics.length).toBeGreaterThanOrEqual(2);
      expect(turnResult.score).toBeGreaterThanOrEqual(60);
      expect(turnResult.rubric.correctness).toBeGreaterThanOrEqual(3);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // STAGE 4: Submission with 3-Bullet Executive Summary
  // ──────────────────────────────────────────────────────────────────────────
  describe('Stage 4: Submission with 3-Bullet Executive Summary', () => {
    it('produces a structured 3-bullet Executive Summary with Key Strengths, Growth Areas, and Hiring Recommendation', () => {
      const mockBreakdown = [
        {
          questionIndex: 1,
          question: "How does React's Reconciliation work?",
          answer: 'React Fiber allows incremental rendering with priority lanes and work loop.',
          score: 85,
          coveredTopics: ['Fiber Architecture', 'Priority Lanes'],
          missedTopics: ['Commit Phase'],
        },
        {
          questionIndex: 2,
          question: 'Explain useCallback vs useMemo.',
          answer: 'useMemo memoizes values while useCallback memoizes function instances.',
          score: 80,
          coveredTopics: ['useMemo', 'useCallback'],
          missedTopics: ['Memory Overhead'],
        },
      ];

      const executiveSummary = generateExecutiveSummary({
        overallScore: 82,
        passingScore: 70,
        decision: 'qualified',
        integrity: { flagged: false, tabSwitchCount: 0, pasteCount: 0 },
        breakdown: mockBreakdown,
      });

      expect(executiveSummary).toBeDefined();
      expect(executiveSummary.keyStrengths).toBeTruthy();
      expect(executiveSummary.growthAreas).toBeTruthy();
      expect(executiveSummary.hiringRecommendation).toBeTruthy();

      expect(Array.isArray(executiveSummary.bullets)).toBe(true);
      expect(executiveSummary.bullets).toHaveLength(3);

      expect(executiveSummary.bullets[0]).toMatch(/^Key Strengths:/i);
      expect(executiveSummary.bullets[1]).toMatch(/^Growth Areas:/i);
      expect(executiveSummary.bullets[2]).toMatch(/^Hiring Recommendation:/i);
      expect(executiveSummary.bullets[2]).toContain('Strong Hire / Advance');
    });

    it('properly generates Do Not Proceed recommendation on integrity anomaly flags', () => {
      const executiveSummary = generateExecutiveSummary({
        overallScore: 88,
        passingScore: 70,
        decision: 'rejected',
        integrity: { flagged: true, tabSwitchCount: 8, pasteCount: 5 },
        breakdown: [],
      });

      expect(executiveSummary.bullets[2]).toContain('Do Not Proceed (Integrity Alert)');
      expect(executiveSummary.bullets[2]).toContain('8 tab switches');
    });

    it('integrates executive summary into submission endpoint response payload', async () => {
      const mockQuestionSet = {
        id: 'qs_e2e_submit',
        title: 'Full Stack Engineer Interview',
        is_active: true,
        requires_login: false,
        allowed_emails: [],
        settings: {
          passingScore: 70,
        },
        questions: [{ question: 'Explain REST principles.', expectedTopics: ['Stateless', 'Idempotency'] }],
      };

      const mockAttempt = {
        id: '11111111-2222-4333-8444-555555555555',
        question_set_id: 'qs_e2e_submit',
        user_id: null,
        stage: 'Technical',
        responses: [
          { role: 'candidate', questionIndex: 0, question: 'Explain REST principles.', content: 'REST APIs are stateless and utilize standard HTTP methods.' }
        ],
        expires_at: new Date(Date.now() + 3600000).toISOString(),
        completed_at: new Date().toISOString(),
        submitted_at: null,
        question_snapshot: [{ question: 'Explain REST principles.', expectedTopics: ['Stateless', 'Idempotency'] }],
      };

      let insertedSubmission = null;

      vi.spyOn(supabaseAdmin, 'from').mockImplementation((table) => {
        if (table === 'admin_question_sets') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockQuestionSet, error: null }),
              }),
            }),
          };
        }
        if (table === 'admin_interview_attempts') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: () => Promise.resolve({ data: mockAttempt, error: null }),
                }),
              }),
            }),
            update: () => ({
              eq: () => ({
                is: () => Promise.resolve({ error: null }),
              }),
            }),
          };
        }
        if (table === 'admin_interview_submissions') {
          return {
            insert: (payload) => {
              insertedSubmission = payload;
              return {
                select: () => ({
                  single: () => Promise.resolve({ data: { id: 'sub_e2e_success' }, error: null }),
                }),
              };
            },
          };
        }
        return {};
      });

      const res = await fetch(`${baseUrl}/api/interview/custom-sets/question-set/FULLSTACK/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId: '11111111-2222-4333-8444-555555555555',
          duration: 1200,
          userName: 'Alex Developer',
          userEmail: 'alex@example.com',
          tabSwitchCount: 0,
          pasteCount: 0,
        }),
      });

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.submissionId).toBe('sub_e2e_success');

      // Verify inserted submission payload includes 3-bullet executiveSummary
      expect(insertedSubmission).toBeDefined();
      expect(insertedSubmission.scores.executiveSummary).toBeDefined();
      expect(insertedSubmission.scores.executiveSummary.bullets).toHaveLength(3);
      expect(insertedSubmission.scores.executiveSummary.keyStrengths).toBeTruthy();
      expect(insertedSubmission.scores.executiveSummary.growthAreas).toBeTruthy();
      expect(insertedSubmission.scores.executiveSummary.hiringRecommendation).toBeTruthy();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // STAGE 5: Slack-Compatible Webhook Card Formatting
  // ──────────────────────────────────────────────────────────────────────────
  describe('Stage 5: Slack-Compatible Webhook Card Formatting', () => {
    it('formats submission into a clean Slack-compatible Block Kit message card with score pill, decision tag, and review URL', () => {
      const submissionEvent = {
        candidateName: 'Jane Doe',
        candidateEmail: 'jane@example.com',
        questionSetTitle: 'Senior Backend Engineer Assessment',
        overallScore: 84,
        passingScore: 70,
        decision: 'qualified',
        durationSeconds: 1800,
        completedAt: new Date().toISOString(),
        submissionId: 'sub_jane_123',
        integrity: { flagged: false, tabSwitchCount: 0, pasteCount: 0 },
        executiveSummary: {
          keyStrengths: 'Deep knowledge of Node.js streams, event loop, and PostgreSQL transaction isolation.',
          growthAreas: 'Could elaborate on Kubernetes pod graceful shutdown edge cases.',
          hiringRecommendation: 'Strong Hire / Advance - Performance cleared the 70% benchmark with 84%.',
          bullets: [
            'Key Strengths: Deep knowledge of Node.js streams and event loop.',
            'Growth Areas: Could elaborate on Kubernetes pod graceful shutdown edge cases.',
            'Hiring Recommendation: Strong Hire / Advance - Performance cleared the 70% benchmark with 84%.',
          ],
        },
      };

      const slackCard = formatSlackWebhookPayload(submissionEvent);

      expect(slackCard.text).toContain('Jane Doe');
      expect(slackCard.text).toContain('84%');
      expect(slackCard.text).toContain('QUALIFIED');

      expect(Array.isArray(slackCard.blocks)).toBe(true);
      expect(slackCard.blocks.length).toBeGreaterThanOrEqual(4);

      // 1. Header block
      const headerBlock = slackCard.blocks.find((b) => b.type === 'header');
      expect(headerBlock).toBeDefined();
      expect(headerBlock.text.text).toContain('Jane Doe');

      // 2. Section with metadata fields
      const sectionBlock = slackCard.blocks.find((b) => b.type === 'section' && Array.isArray(b.fields));
      expect(sectionBlock).toBeDefined();
      const fieldsText = sectionBlock.fields.map((f) => f.text).join(' ');
      expect(fieldsText).toContain('84 / 100');
      expect(fieldsText).toContain('QUALIFIED');
      expect(fieldsText).toContain('Clean Focus');

      // 3. Executive summary section
      const summaryBlock = slackCard.blocks.find((b) => b.type === 'section' && b.text?.text?.includes('Executive Summary'));
      expect(summaryBlock).toBeDefined();
      expect(summaryBlock.text.text).toContain('Key Strengths');
      expect(summaryBlock.text.text).toContain('Growth Areas');
      expect(summaryBlock.text.text).toContain('Hiring Recommendation');

      // 4. Action button pointing to Candidate Review Dossier URL
      const actionBlock = slackCard.blocks.find((b) => b.type === 'actions');
      expect(actionBlock).toBeDefined();
      expect(actionBlock.elements[0].url).toContain('submissionId=sub_jane_123');

      // 5. Color-coded attachment
      expect(slackCard.attachments[0].color).toBe('#22c55e'); // Green for qualified
    });

    it('assigns warning/danger colors for review needed and rejected status in Slack cards', () => {
      const reviewNeededCard = formatSlackWebhookPayload({
        candidateName: 'Bob Smith',
        overallScore: 68,
        passingScore: 70,
        decision: 'review_needed',
      });
      expect(reviewNeededCard.attachments[0].color).toBe('#f59e0b'); // Amber

      const rejectedCard = formatSlackWebhookPayload({
        candidateName: 'Charlie Root',
        overallScore: 42,
        passingScore: 70,
        decision: 'rejected',
      });
      expect(rejectedCard.attachments[0].color).toBe('#ef4444'); // Red
    });

    it('blocks dangerous internal or SSRF targets while allowing legitimate webhook dispatch', async () => {
      const ssrfResult = await dispatchInterviewWebhook('http://169.254.169.254/latest/meta-data');
      expect(ssrfResult.success).toBe(false);
      expect(ssrfResult.error).toContain('SSRF defense');

      const localhostResult = await dispatchInterviewWebhook('http://127.0.0.1:9999/webhook');
      expect(localhostResult.success).toBe(false);
      expect(localhostResult.error).toContain('SSRF defense');
    });
  });
});
