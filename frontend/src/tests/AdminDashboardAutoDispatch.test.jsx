import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminDashboard from '../pages/AdminDashboard.jsx';
import { authFetch } from '../utils/authFetch';

vi.mock('../utils/authFetch', () => ({
  authFetch: vi.fn(),
}));

describe('AdminDashboard - Auto-dispatch Candidate Invitations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authFetch.mockImplementation(async (url, options = {}) => {
      const method = options.method || 'GET';
      if (url.includes('/admin/stats')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            totalUsers: 10,
            activeUsers: 5,
            totalPosts: 2,
            totalInterviews: 12,
            tierCounts: {},
            interviewTypeCounts: {},
          }),
        };
      }
      if (url.includes('/admin/question-sets') && method === 'GET') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            questionSets: [],
            total: 0,
            page: 1,
          }),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({}),
      };
    });
  });

  it('renders autoDispatchInvites checked by default and displays callout when candidate emails are entered', async () => {
    render(<AdminDashboard />);

    // Switch to question-sets tab
    const qSetsTab = await screen.findByRole('button', { name: /Question Sets/i });
    fireEvent.click(qSetsTab);

    // Click Create Question Set
    const createBtn = await screen.findByRole('button', { name: /Create Question Set/i });
    fireEvent.click(createBtn);

    // Verify checkbox is rendered and checked by default
    const checkbox = screen.getByLabelText(/Automatically send invitation emails to candidate allowlist upon saving/i);
    expect(checkbox).toBeDefined();
    expect(checkbox.checked).toBe(true);

    // Initially allowlist is empty, so badge should not be present
    expect(screen.queryByText(/will automatically receive personalized join links/i)).toBeNull();

    // Enter candidate emails into allowlist input
    const allowlistInput = screen.getByPlaceholderText(/e\.g\. candidate1@company\.com/i);
    fireEvent.change(allowlistInput, { target: { value: 'candidate1@company.com, candidate2@company.com' } });

    // Badge should appear with 2 candidates
    expect(await screen.findByText(/📨 2 candidate\(s\) will automatically receive personalized join links and calendar invites\./i)).toBeDefined();

    // Verify custom invite message textarea exists
    const customMsgTextarea = screen.getByPlaceholderText(/custom invitation message for candidates/i);
    expect(customMsgTextarea).toBeDefined();
    fireEvent.change(customMsgTextarea, { target: { value: 'Welcome to the engineering interview!' } });
    expect(customMsgTextarea.value).toBe('Welcome to the engineering interview!');
  });

  it('submits autoDispatchInvites and customInviteMessage in payload and displays sent success message', async () => {
    let capturedPayload = null;
    authFetch.mockImplementation(async (url, options = {}) => {
      const method = options.method || 'GET';
      if (url.includes('/admin/stats')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ totalUsers: 1, activeUsers: 1 }),
        };
      }
      if (url.includes('/admin/question-sets') && method === 'GET') {
        return {
          ok: true,
          status: 200,
          json: async () => ({ questionSets: [], total: 0 }),
        };
      }
      if (url.includes('/admin/question-sets') && method === 'POST') {
        capturedPayload = JSON.parse(options.body);
        return {
          ok: true,
          status: 201,
          json: async () => ({
            token: 'test-token-123',
            questionSet: { id: 'qs-1', share_code: 'test-token-123' },
            dispatchResults: {
              sent: 2,
              failed: 0,
              total: 2,
              isSimulated: false,
            },
          }),
        };
      }
      return { ok: true, status: 200, json: async () => ({}) };
    });

    const { container } = render(<AdminDashboard />);

    // Switch to question-sets tab
    const qSetsTab = await screen.findByRole('button', { name: /Question Sets/i });
    fireEvent.click(qSetsTab);

    // Open Create modal
    const createBtn = await screen.findByRole('button', { name: /Create Question Set/i });
    fireEvent.click(createBtn);

    // Fill Title
    const titleInput = await screen.findByPlaceholderText(/e\.g\. Senior Frontend React Assessment/i);
    fireEvent.change(titleInput, { target: { value: 'Backend Engineer Assessment' } });

    // Fill question 1
    const questionInput = screen.getByPlaceholderText(/e\.g\. Explain how event loops work in Node\.js\./i);
    fireEvent.change(questionInput, { target: { value: 'Explain database indexing tradeoffs.' } });

    // Fill allowlist
    const allowlistInput = screen.getByPlaceholderText(/e\.g\. candidate1@company\.com/i);
    fireEvent.change(allowlistInput, { target: { value: 'eng1@example.com, eng2@example.com' } });

    // Fill custom invite message
    const customMsgTextarea = screen.getByPlaceholderText(/custom invitation message for candidates/i);
    fireEvent.change(customMsgTextarea, { target: { value: 'Please take your time on the architecture question.' } });

    // Submit modal form
    const form = container.querySelector('.admin-modal form');
    fireEvent.submit(form);

    // Check payload passed to POST
    await waitFor(() => {
      expect(capturedPayload).not.toBeNull();
    });
    expect(capturedPayload.autoDispatchInvites).toBe(true);
    expect(capturedPayload.customInviteMessage).toBe('Please take your time on the architecture question.');
    expect(capturedPayload.allowedEmails).toEqual(['eng1@example.com', 'eng2@example.com']);

    // Check success notification
    expect(await screen.findByText(/Question set created and invitation emails sent to 2 candidate\(s\)!/i)).toBeDefined();
  });

  it('displays simulation success message when dispatchResults.isSimulated is true', async () => {
    authFetch.mockImplementation(async (url, options = {}) => {
      const method = options.method || 'GET';
      if (url.includes('/admin/stats')) {
        return { ok: true, status: 200, json: async () => ({}) };
      }
      if (url.includes('/admin/question-sets') && method === 'GET') {
        return { ok: true, status: 200, json: async () => ({ questionSets: [], total: 0 }) };
      }
      if (url.includes('/admin/question-sets') && method === 'POST') {
        return {
          ok: true,
          status: 201,
          json: async () => ({
            token: 'test-token-sim',
            questionSet: { id: 'qs-sim', share_code: 'test-token-sim' },
            dispatchResults: {
              sent: 0,
              failed: 0,
              total: 3,
              isSimulated: true,
            },
          }),
        };
      }
      return { ok: true, status: 200, json: async () => ({}) };
    });

    const { container } = render(<AdminDashboard />);

    const qSetsTab = await screen.findByRole('button', { name: /Question Sets/i });
    fireEvent.click(qSetsTab);

    const createBtn = await screen.findByRole('button', { name: /Create Question Set/i });
    fireEvent.click(createBtn);

    const titleInput = await screen.findByPlaceholderText(/e\.g\. Senior Frontend React Assessment/i);
    fireEvent.change(titleInput, { target: { value: 'Simulated Candidate Run' } });

    const questionInput = screen.getByPlaceholderText(/e\.g\. Explain how event loops work in Node\.js\./i);
    fireEvent.change(questionInput, { target: { value: 'What is eventual consistency?' } });

    const allowlistInput = screen.getByPlaceholderText(/e\.g\. candidate1@company\.com/i);
    fireEvent.change(allowlistInput, { target: { value: 'a@ex.com, b@ex.com, c@ex.com' } });

    const form = container.querySelector('.admin-modal form');
    fireEvent.submit(form);

    expect(await screen.findByText(/Question set created! Single-use invite tokens generated for 3 candidate\(s\) \(email simulation mode\)\./i)).toBeDefined();
  });

  it('supports editing an existing question set and dispatches invites with updated message', async () => {
    let putPayload = null;
    const existingSet = {
      id: 'existing-qs-42',
      title: 'Existing DevOps Set',
      description: 'DevOps screening',
      interview_type: 'technical',
      difficulty: 'hard',
      is_active: true,
      allowed_emails: ['dev1@company.com'],
      questions: [{ question: 'Explain Kubernetes controllers', context: '', expectedTopics: 'reconciliation', timeLimit: 90 }],
      settings: {
        autoDispatchInvites: true,
        customInviteMessage: 'Initial message',
      },
    };

    authFetch.mockImplementation(async (url, options = {}) => {
      const method = options.method || 'GET';
      if (url.includes('/admin/stats')) {
        return { ok: true, status: 200, json: async () => ({}) };
      }
      if (url.includes('/admin/question-sets') && method === 'GET') {
        return { ok: true, status: 200, json: async () => ({ questionSets: [existingSet], total: 1 }) };
      }
      if (url.includes('/admin/question-sets/existing-qs-42') && method === 'PUT') {
        putPayload = JSON.parse(options.body);
        return {
          ok: true,
          status: 200,
          json: async () => ({
            questionSet: existingSet,
            dispatchResults: {
              sent: 1,
              failed: 0,
              total: 1,
              isSimulated: false,
            },
          }),
        };
      }
      return { ok: true, status: 200, json: async () => ({}) };
    });

    const { container } = render(<AdminDashboard />);

    const qSetsTab = await screen.findByRole('button', { name: /Question Sets/i });
    fireEvent.click(qSetsTab);

    // Find and click the edit button for Existing DevOps Set
    const editBtn = await screen.findByTitle('Edit Question Set');
    fireEvent.click(editBtn);

    // Check allowlist has existing email and badge displays
    expect(await screen.findByText(/📨 1 candidate\(s\) will automatically receive personalized join links and calendar invites\./i)).toBeDefined();

    // Check custom invite message is loaded
    const customMsgTextarea = screen.getByPlaceholderText(/custom invitation message for candidates/i);
    expect(customMsgTextarea.value).toBe('Initial message');

    // Change message
    fireEvent.change(customMsgTextarea, { target: { value: 'Updated invite instructions.' } });

    // Submit form
    const form = container.querySelector('.admin-modal form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(putPayload).not.toBeNull();
    });
    expect(putPayload.autoDispatchInvites).toBe(true);
    expect(putPayload.customInviteMessage).toBe('Updated invite instructions.');

    expect(await screen.findByText(/Question set created and invitation emails sent to 1 candidate\(s\)!/i)).toBeDefined();
  });
});
