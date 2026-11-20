import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import ResumeAnalyzer, { ATSGauge, KeywordTag } from '../pages/ResumeAnalyzer';
import { authFetch } from '../utils/authFetch';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'u1', name: 'Test User' },
    isAuthenticated: true,
  }),
}));

vi.mock('../utils/authFetch', () => ({
  authFetch: vi.fn(),
}));

describe('ResumeAnalyzer Modularization Compatibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ analyses: [] }),
    });
  });

  it('exports ATSGauge and KeywordTag for backward compatibility', () => {
    expect(ATSGauge).toBeDefined();
    expect(KeywordTag).toBeDefined();
  });

  it('renders ResumeAnalyzer without crashing', async () => {
    render(
      <MemoryRouter>
        <ResumeAnalyzer />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Resume Analyzer/i })).toBeInTheDocument();
    });
  });
});
