import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import DeveloperPortalPage from './DeveloperPortalPage';

// Mock authFetch
vi.mock('../utils/authFetch', () => ({
  authFetch: vi.fn(),
}));

import { authFetch } from '../utils/authFetch';

describe('DeveloperPortalPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders developer portal tabs and active API keys', async () => {
    authFetch.mockImplementation((url) => {
      if (url === '/api/employer/api-keys') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              apiKeys: [
                {
                  id: 'key-1',
                  name: 'CI Integration Key',
                  prefix: 'pl_live_1a2b',
                  scopes: ['interviews:read'],
                  created_at: new Date().toISOString(),
                },
              ],
            }),
        });
      }
      if (url === '/api/employer/webhooks') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, webhooks: [] }),
        });
      }
      return Promise.reject(new Error(`Unhandled URL: ${url}`));
    });

    render(<DeveloperPortalPage />);

    expect(screen.getByText('Platform API & Webhooks')).toBeDefined();
    expect(screen.getByText('API Keys')).toBeDefined();
    expect(screen.getByText('Webhooks')).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText('CI Integration Key')).toBeDefined();
      expect(screen.getByText('pl_live_1a2b...')).toBeDefined();
    });
  });

  it('switches to webhooks tab and displays empty state', async () => {
    authFetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, apiKeys: [], webhooks: [] }),
      })
    );

    render(<DeveloperPortalPage />);

    const webhooksTab = screen.getByText('Webhooks');
    fireEvent.click(webhooksTab);

    await waitFor(() => {
      expect(screen.getByText('Webhook Subscriptions')).toBeDefined();
      expect(screen.getByText('No Webhooks Configured')).toBeDefined();
    });
  });

  it('switches to documentation tab and renders curl snippet', () => {
    authFetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, apiKeys: [], webhooks: [] }),
      })
    );

    render(<DeveloperPortalPage />);

    const docsTab = screen.getByText('Documentation & Snippets');
    fireEvent.click(docsTab);

    expect(screen.getByText(/Quickstart: Authenticating API Requests/i)).toBeDefined();
    expect(screen.getByText(/Verifying Webhook Signatures/i)).toBeDefined();
  });

  it('switches to question sets tab and displays question banks', async () => {
    authFetch.mockImplementation((url) => {
      if (url === '/api/employer/question-banks') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              questionSets: [
                {
                  id: 'bank-1',
                  title: 'Distributed Systems & Concurrency',
                  company_name: 'Stripe',
                  target_role: 'Senior Infrastructure Engineer',
                  questions: [
                    { question: 'Design an idempotent payment webhook processor' },
                  ],
                },
              ],
            }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, apiKeys: [], webhooks: [] }),
      });
    });

    render(<DeveloperPortalPage />);

    const questionSetsTab = screen.getByText('Question Sets');
    fireEvent.click(questionSetsTab);

    await waitFor(() => {
      expect(screen.getByText('Corporate Question Sets')).toBeDefined();
      expect(screen.getByText('Distributed Systems & Concurrency')).toBeDefined();
      expect(screen.getByText('Stripe')).toBeDefined();
      expect(screen.getByText(/Senior Infrastructure Engineer/i)).toBeDefined();
    });
  });
});

