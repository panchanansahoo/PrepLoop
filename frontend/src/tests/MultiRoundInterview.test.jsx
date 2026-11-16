import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MultiRoundInterview from '../pages/MultiRoundInterview.jsx';

// Mock AuthContext
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-uuid', email: 'candidate@example.com' },
    isAuthenticated: true,
  }),
}));

// Mock authFetch
vi.mock('../utils/authFetch', () => ({
  authFetch: vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          session: {
            id: 'mock-session-uuid-1234',
            company: 'google',
            role: 'SDE',
            current_round: 0,
            round_scores: [],
            status: 'in_progress',
          },
        }),
    })
  ),
}));

describe('MultiRoundInterview Page & Bar-Raiser Veto UI', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('renders initial setup phase with company and round selections', () => {
    render(
      <MemoryRouter>
        <MultiRoundInterview />
      </MemoryRouter>
    );

    expect(screen.getByText(/Full Interview Loop/i)).toBeInTheDocument();
    expect(screen.getByText(/Select Interview Rounds/i)).toBeInTheDocument();
    expect(screen.getByText(/DSA \/ Coding/i)).toBeInTheDocument();
    expect(screen.getByText(/System Design/i)).toBeInTheDocument();
    expect(screen.getByText(/Start 3-Round Interview Loop/i)).toBeInTheDocument();
  });

  it('initializes multi-round session when starting interview loop', async () => {
    const { authFetch } = await import('../utils/authFetch');

    render(
      <MemoryRouter>
        <MultiRoundInterview />
      </MemoryRouter>
    );

    const startBtn = screen.getByText(/Start 3-Round Interview Loop/i);
    fireEvent.click(startBtn);

    await waitFor(() => {
      expect(authFetch).toHaveBeenCalled();
    });

    // Check transition screen is reached
    await waitFor(() => {
      expect(screen.getByText(/Round 1: DSA \/ Coding/i)).toBeInTheDocument();
      expect(screen.getByText(/Begin Round 1/i)).toBeInTheDocument();
    });
  });

  it('renders Bar-Raiser Veto banner and breakdown when candidate fails core coding threshold', async () => {
    // Seed multiRoundResult indicating final round completion with a failed coding score
    const context = {
      multiRound: true,
      sessionId: 'sess-veto-test',
      company: 'google',
      role: 'SDE',
      currentRoundIdx: 2,
      totalRounds: 3,
      selectedRounds: ['dsa', 'system-design', 'behavioral'],
      previousRounds: [
        { roundId: 'dsa', name: 'DSA / Coding', stage: 'DSA / Coding', score: 50 }, // Failed (<65)
        { roundId: 'system-design', name: 'System Design', stage: 'System Design', score: 85 },
      ],
    };

    const lastResult = {
      roundId: 'behavioral',
      stage: 'Behavioral',
      score: 90,
      strengths: ['Great communication', 'Strong STAR format'],
    };

    sessionStorage.setItem('multiRoundContext', JSON.stringify(context));
    sessionStorage.setItem('multiRoundResult', JSON.stringify(lastResult));

    render(
      <MemoryRouter>
        <MultiRoundInterview />
      </MemoryRouter>
    );

    // Final report phase should be shown
    await waitFor(() => {
      expect(screen.getByText(/Interview Loop Complete/i)).toBeInTheDocument();
    });

    // Bar-Raiser Veto callout should be prominently displayed
    expect(screen.getByText(/Bar-Raiser Veto Triggered/i)).toBeInTheDocument();
    expect(screen.getByText(/Veto Enforced/i)).toBeInTheDocument();
    expect(screen.getByText(/BAR-RAISER VETO ✗/i)).toBeInTheDocument();
    expect(screen.getByText(/Bar-Raiser Gate/i)).toBeInTheDocument();
    expect(screen.getByText(/VETOED/i)).toBeInTheDocument();
  });

  it('renders Bar-Raiser Cleared consensus when all rounds pass competency thresholds', async () => {
    const context = {
      multiRound: true,
      sessionId: 'sess-pass-test',
      company: 'google',
      role: 'SDE',
      currentRoundIdx: 2,
      totalRounds: 3,
      selectedRounds: ['dsa', 'system-design', 'behavioral'],
      previousRounds: [
        { roundId: 'dsa', name: 'DSA / Coding', stage: 'DSA / Coding', score: 85 }, // Passed (>=65)
        { roundId: 'system-design', name: 'System Design', stage: 'System Design', score: 80 }, // Passed (>=60)
      ],
    };

    const lastResult = {
      roundId: 'behavioral',
      stage: 'Behavioral',
      score: 88, // Passed (>=60)
      strengths: ['Clear answers', 'Leadership demonstrated'],
    };

    sessionStorage.setItem('multiRoundContext', JSON.stringify(context));
    sessionStorage.setItem('multiRoundResult', JSON.stringify(lastResult));

    render(
      <MemoryRouter>
        <MultiRoundInterview />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Interview Loop Complete/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Bar-Raiser Cleared/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Passed Bar/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/CLEARED/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/BAR-RAISER VETO ✗/i)).not.toBeInTheDocument();
  });
});
