import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SpacedRepetitionWidget from '../components/SpacedRepetitionWidget';
import ResumeGapAnalyzerModal from '../components/ResumeGapAnalyzerModal';
import JobTracker from './JobTracker';

const mockAuthFetch = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-1', email: 'dev@preploop.io' } }),
}));

vi.mock('../utils/authFetch', () => ({
  authFetch: (...args) => mockAuthFetch(...args),
}));

describe('Phase 2 Frontend Components', () => {
  beforeEach(() => {
    mockAuthFetch.mockReset();
  });

  it('SpacedRepetitionWidget renders due problems and submits SM-2 rating', async () => {
    mockAuthFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          dueCount: 1,
          totalTracked: 3,
          dueProblems: [
            { problem_id: 'two-sum', problem_title: 'Two Sum', interval_days: 1, ease_factor: 2.5 },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ persisted: true }),
      });

    render(
      <MemoryRouter>
        <SpacedRepetitionWidget />
      </MemoryRouter>
    );

    expect(await screen.findByText('Two Sum')).toBeInTheDocument();
    expect(screen.getByText('1 Due for Review')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Good' }));
    await waitFor(() => {
      expect(mockAuthFetch).toHaveBeenCalledTimes(2);
    });
  });

  it('ResumeGapAnalyzerModal validates via shared Zod contract and displays gap analysis', async () => {
    mockAuthFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        matchScore: 75,
        matchedSkills: ['react', 'typescript'],
        missingSkills: ['docker'],
        talkingPoints: ['Highlight React performance wins'],
        practiceQuestions: ['How do you containerize a React + Node app?'],
      }),
    });

    render(
      <MemoryRouter>
        <ResumeGapAnalyzerModal
          isOpen
          onClose={() => {}}
          initialJobTitle="Frontend Engineer"
          initialCompany="Acme"
          initialJobDescription="Looking for React, TypeScript, and Docker experience in production."
          initialResumeText="Experienced Frontend Engineer building React and TypeScript web applications."
        />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /Analyze My Resume Fit/i }));
    expect(await screen.findByText('75%')).toBeInTheDocument();
    expect(screen.getByText('docker')).toBeInTheDocument();
    expect(screen.getByText('Highlight React performance wins')).toBeInTheDocument();
  });

  it('JobTracker renders Kanban board and creates a new application card', async () => {
    mockAuthFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          applications: [
            { id: 'app-1', company: 'Stripe', role: 'Backend Engineer', status: 'applied', notes: 'Referral submitted' },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          application: { id: 'app-2', company: 'Linear', role: 'Product Engineer', status: 'bookmarked', notes: '' },
        }),
      });

    render(
      <MemoryRouter>
        <JobTracker />
      </MemoryRouter>
    );

    expect(await screen.findByText('Backend Engineer')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Add Application/i }));
    fireEvent.change(screen.getByPlaceholderText('Company *'), { target: { value: 'Linear' } });
    fireEvent.change(screen.getByPlaceholderText('Role *'), { target: { value: 'Product Engineer' } });
    fireEvent.click(screen.getByRole('button', { name: /Save Card/i }));

    expect(await screen.findByText('Product Engineer')).toBeInTheDocument();
  });
});
