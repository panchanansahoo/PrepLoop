import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PlaybackPage from './PlaybackPage';
import LearningStreakWidget from '../components/LearningStreakWidget';
import CompanyIntelligencePanel from '../components/CompanyIntelligencePanel';
import RealProjectCodeReviewPanel from '../components/RealProjectCodeReviewPanel';
import ReferralPanel from '../components/ReferralPanel';
import { ThemeProvider } from '../context/ThemeContext';

vi.mock('../utils/authFetch', () => ({
  authFetch: vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      referralUrl: 'https://preploop.io/ref/TESTUSER',
      rewardedCount: 2,
      followUps: ['Q1', 'Q2', 'Q3'],
    }),
  }),
}));

describe('Phase 2 & Phase 3 UI Components', () => {
  it('renders PlaybackPage demo transcript timeline and side-by-side view', async () => {
    render(
      <MemoryRouter initialEntries={['/interview/playback/demo-google-fullstack-swe']}>
        <Routes>
          <Route path="/interview/playback/:sessionId" element={<PlaybackPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText(/Interview Transcript Playback/i)).toBeInTheDocument();
    expect(await screen.findByLabelText(/Transcript timeline scrubber/i)).toBeInTheDocument();
    expect(await screen.findByText(/Ideal Answer & Coaching Notes/i)).toBeInTheDocument();
  });

  it('renders Streak at risk banner in LearningStreakWidget when streakAtRisk is true', () => {
    render(
      <ThemeProvider>
        <LearningStreakWidget data={{ streak: 6, bestStreak: 12, streakAtRisk: true }} />
      </ThemeProvider>
    );

    expect(screen.getByRole('alert')).toHaveTextContent(/Streak at risk!/i);
    expect(screen.getByText(/keep your 6-day streak alive/i)).toBeInTheDocument();
  });

  it('renders CompanyIntelligencePanel with role tracks and difficulty distribution', () => {
    render(
      <CompanyIntelligencePanel
        selectedCompany="Google"
        questions={[
          { question: 'Reverse a linked list', difficulty: 'easy', role: 'SWE', recencyDays: 10 },
          { question: 'Design YouTube', difficulty: 'hard', role: 'System Design', recencyDays: 120 },
        ]}
      />
    );

    expect(screen.getByText(/Company Interview Intelligence/i)).toBeInTheDocument();
    expect(screen.getByText(/1 Seen recently \(90d\)/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /SWE \(1\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Design \(1\)/i })).toBeInTheDocument();
  });

  it('renders RealProjectCodeReviewPanel form', () => {
    render(<RealProjectCodeReviewPanel />);
    expect(screen.getByText(/AI Code Review for Real Projects/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/https:\/\/github.com\/username\/project/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Run AI Project Review/i })).toBeInTheDocument();
  });

  it('renders ReferralPanel with referral link and copy button', async () => {
    render(<ReferralPanel />);
    expect(await screen.findByText(/Refer Friends, Earn 500 Coins/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Your referral link/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Copy/i })).toBeInTheDocument();
  });
});
