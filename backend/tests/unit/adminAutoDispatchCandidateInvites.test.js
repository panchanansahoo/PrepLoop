import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express from 'express';

// Mock auth middleware before importing admin router
vi.mock('../../middleware/auth.ts', () => ({
  authenticateToken: (req, _res, next) => {
    req.user = {
      id: 'admin_test_id',
      email: 'recruiter@preploop.com',
      user_metadata: { full_name: 'Lead Recruiter' },
    };
    next();
  },
  requireAdmin: (_req, _res, next) => next(),
  invalidateUserRole: vi.fn(),
}));

// Mock interviewMailer to track dispatchCandidateInvitations calls
vi.mock('../../utils/interviewMailer.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    dispatchCandidateInvitations: vi.fn(),
  };
});

// Mock Supabase admin client
vi.mock('../../db/supabaseClient.js', () => {
  return {
    supabaseAdmin: {
      from: vi.fn(),
    },
  };
});

import adminRouter from '../../routes/admin.js';
import { supabaseAdmin } from '../../db/supabaseClient.js';
import { dispatchCandidateInvitations } from '../../utils/interviewMailer.js';

describe('Admin Question-Sets Automatic Candidate Invitation Dispatch', () => {
  let app;
  let server = null;
  let baseUrl = '';

  beforeEach(async () => {
    vi.clearAllMocks();

    app = express();
    app.use(express.json());
    app.use('/admin', adminRouter);

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

  describe('POST /admin/question-sets', () => {
    it('automatically dispatches invitations when candidate emails are provided and autoDispatchInvites defaults to true', async () => {
      const mockInserted = {
        id: 'qs_new_1',
        title: 'Full Stack Engineer Interview',
        description: 'React + Node assessment',
        share_code: 'FS101',
        allowed_emails: ['dev1@example.com', 'dev2@example.com'],
        settings: { allowedEmails: ['dev1@example.com', 'dev2@example.com'] },
        scheduled_at: null,
        scheduled_duration_minutes: 45,
      };

      vi.mocked(supabaseAdmin.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockInserted, error: null }),
          }),
        }),
      });

      vi.mocked(dispatchCandidateInvitations).mockResolvedValue({
        total: 2,
        sent: 2,
        simulated: 0,
        failed: 0,
        isSimulated: false,
        results: [
          { email: 'dev1@example.com', status: 'sent', joinUrl: 'https://preploop.com/ai-interview?token=inv_1' },
          { email: 'dev2@example.com', status: 'sent', joinUrl: 'https://preploop.com/ai-interview?token=inv_2' },
        ],
        candidateInvites: {
          inv_1: { email: 'dev1@example.com', status: 'pending' },
          inv_2: { email: 'dev2@example.com', status: 'pending' },
        },
      });

      const response = await fetch(`${baseUrl}/admin/question-sets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Full Stack Engineer Interview',
          allowedEmails: ['dev1@example.com', 'dev2@example.com'],
          customInviteMessage: 'Looking forward to meeting you!',
          baseUrl: 'https://hire.preploop.com',
          questions: [{ question: 'Explain how Node event loop handles timers.' }],
        }),
      });

      expect(response.status).toBe(201);
      const json = await response.json();

      expect(json.questionSet).toBeDefined();
      expect(json.shareCode).toBe('FS101');
      expect(json.token).toBe('FS101');
      expect(json.dispatchResults).toBeDefined();
      expect(json.dispatchResults.total).toBe(2);
      expect(json.dispatchResults.sent).toBe(2);

      expect(dispatchCandidateInvitations).toHaveBeenCalledTimes(1);
      expect(dispatchCandidateInvitations).toHaveBeenCalledWith(
        expect.objectContaining({
          candidateEmails: ['dev1@example.com', 'dev2@example.com'],
          customMessage: 'Looking forward to meeting you!',
          baseUrl: 'https://hire.preploop.com',
          organizerName: 'Lead Recruiter',
        })
      );
    });

    it('does not dispatch invitations when autoDispatchInvites is explicitly false', async () => {
      const mockInserted = {
        id: 'qs_new_2',
        title: 'Backend Engineer Interview',
        share_code: 'BE102',
        allowed_emails: ['candidate@example.com'],
        settings: {},
      };

      vi.mocked(supabaseAdmin.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockInserted, error: null }),
          }),
        }),
      });

      const response = await fetch(`${baseUrl}/admin/question-sets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Backend Engineer Interview',
          allowedEmails: ['candidate@example.com'],
          autoDispatchInvites: false,
          questions: [{ question: 'What is ACID in databases?' }],
        }),
      });

      expect(response.status).toBe(201);
      const json = await response.json();

      expect(json.questionSet).toBeDefined();
      expect(json.dispatchResults).toBeNull();
      expect(dispatchCandidateInvitations).not.toHaveBeenCalled();
    });

    it('gracefully handles email dispatch failure without failing question set creation', async () => {
      const mockInserted = {
        id: 'qs_new_3',
        title: 'DevOps Assessment',
        share_code: 'DO103',
        allowed_emails: ['devops@example.com'],
        settings: {},
      };

      vi.mocked(supabaseAdmin.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockInserted, error: null }),
          }),
        }),
      });

      vi.mocked(dispatchCandidateInvitations).mockRejectedValue(new Error('SMTP connection timeout'));

      const response = await fetch(`${baseUrl}/admin/question-sets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'DevOps Assessment',
          allowedEmails: ['devops@example.com'],
          questions: [{ question: 'Explain Kubernetes Pod lifecycle.' }],
        }),
      });

      expect(response.status).toBe(201);
      const json = await response.json();

      expect(json.questionSet).toBeDefined();
      expect(json.dispatchResults).toBeDefined();
      expect(json.dispatchResults.failed).toBe(1);
      expect(json.dispatchResults.error).toContain('SMTP connection timeout');
    });
  });

  describe('PUT /admin/question-sets/:id', () => {
    it('dispatches invitations only to newly added candidate emails by default', async () => {
      const existingRecord = {
        id: 'qs_edit_1',
        title: 'Senior Frontend Engineer',
        share_code: 'FE201',
        allowed_emails: ['existing@example.com'],
        settings: { allowedEmails: ['existing@example.com'] },
        scheduled_at: null,
        scheduled_duration_minutes: 45,
      };

      const updatedRecord = {
        ...existingRecord,
        allowed_emails: ['existing@example.com', 'newcandidate@example.com'],
        settings: { allowedEmails: ['existing@example.com', 'newcandidate@example.com'] },
      };

      vi.mocked(supabaseAdmin.from).mockImplementation((table) => {
        if (table === 'admin_question_sets') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: existingRecord, error: null }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: updatedRecord, error: null }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      vi.mocked(dispatchCandidateInvitations).mockResolvedValue({
        total: 1,
        sent: 1,
        simulated: 0,
        failed: 0,
        isSimulated: false,
        results: [
          { email: 'newcandidate@example.com', status: 'sent', joinUrl: 'https://preploop.com/ai-interview?token=inv_new' },
        ],
        candidateInvites: {
          inv_new: { email: 'newcandidate@example.com', status: 'pending' },
        },
      });

      const response = await fetch(`${baseUrl}/admin/question-sets/qs_edit_1`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allowedEmails: ['existing@example.com', 'newcandidate@example.com'],
        }),
      });

      expect(response.status).toBe(200);
      const json = await response.json();

      expect(json.questionSet).toBeDefined();
      expect(json.dispatchResults).toBeDefined();
      expect(json.dispatchResults.total).toBe(1);

      expect(dispatchCandidateInvitations).toHaveBeenCalledTimes(1);
      expect(dispatchCandidateInvitations).toHaveBeenCalledWith(
        expect.objectContaining({
          candidateEmails: ['newcandidate@example.com'],
        })
      );
    });

    it('dispatches to all candidates when reDispatchAll is true', async () => {
      const existingRecord = {
        id: 'qs_edit_2',
        title: 'Data Scientist Evaluation',
        share_code: 'DS202',
        allowed_emails: ['ds1@example.com', 'ds2@example.com'],
        settings: { allowedEmails: ['ds1@example.com', 'ds2@example.com'] },
      };

      const updatedRecord = {
        ...existingRecord,
      };

      vi.mocked(supabaseAdmin.from).mockImplementation((table) => {
        if (table === 'admin_question_sets') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: existingRecord, error: null }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: updatedRecord, error: null }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      vi.mocked(dispatchCandidateInvitations).mockResolvedValue({
        total: 2,
        sent: 2,
        simulated: 0,
        failed: 0,
        isSimulated: false,
        results: [],
      });

      const response = await fetch(`${baseUrl}/admin/question-sets/qs_edit_2`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reDispatchAll: true,
        }),
      });

      expect(response.status).toBe(200);
      const json = await response.json();

      expect(json.dispatchResults).toBeDefined();
      expect(dispatchCandidateInvitations).toHaveBeenCalledWith(
        expect.objectContaining({
          candidateEmails: ['ds1@example.com', 'ds2@example.com'],
        })
      );
    });

    it('does not dispatch invitations if no new emails are added and reDispatchAll is false', async () => {
      const existingRecord = {
        id: 'qs_edit_3',
        title: 'Title Before',
        share_code: 'TB303',
        allowed_emails: ['candidate@example.com'],
        settings: {},
      };

      const updatedRecord = {
        ...existingRecord,
        title: 'Title After',
      };

      vi.mocked(supabaseAdmin.from).mockImplementation((table) => {
        if (table === 'admin_question_sets') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: existingRecord, error: null }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: updatedRecord, error: null }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      const response = await fetch(`${baseUrl}/admin/question-sets/qs_edit_3`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Title After',
        }),
      });

      expect(response.status).toBe(200);
      const json = await response.json();

      expect(json.questionSet.title).toBe('Title After');
      expect(json.dispatchResults).toBeNull();
      expect(dispatchCandidateInvitations).not.toHaveBeenCalled();
    });
  });
});
