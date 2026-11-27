/* @vitest-environment jsdom */
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';

const mocks = vi.hoisted(() => ({
  sampleCallCount: 0,
}));

const makeQuestion = (id, difficulty, sub = 'percentages') => ({
  id,
  question: `Question ${id} (${difficulty})`,
  difficulty,
  xp: difficulty === 'hard' ? 30 : difficulty === 'medium' ? 20 : 10,
  correctAnswer: 'A',
  explanation: `Explanation for ${id}`,
  theory: `Theory for ${id}`,
  options: [
    { label: 'A', value: `Option A for ${id}` },
    { label: 'B', value: `Option B for ${id}` },
    { label: 'C', value: `Option C for ${id}` },
    { label: 'D', value: `Option D for ${id}` },
  ],
  sub,
});

const MOCK_BANK = [
  makeQuestion('q-easy-1', 'easy', 'percentages'),
  makeQuestion('q-easy-2', 'easy', 'percentages'),
  makeQuestion('q-med-1', 'medium', 'percentages'),
  makeQuestion('q-med-2', 'medium', 'percentages'),
  makeQuestion('q-med-3', 'medium', 'percentages'),
  makeQuestion('q-med-4', 'medium', 'averages'),
  makeQuestion('q-med-5', 'medium', 'averages'),
  makeQuestion('q-hard-1', 'hard', 'percentages'),
  makeQuestion('q-hard-2', 'hard', 'percentages'),
  makeQuestion('q-hard-3', 'hard', 'averages'),
];

vi.mock('../context/ThemeContext', () => ({
  useTheme: () => ({ theme: 'dark', toggleTheme: vi.fn() }),
}));

vi.mock('../data/aptitudeData', () => ({
  APTITUDE_CATEGORIES: {
    quantitative: { id: 'quantitative', title: 'Quantitative Aptitude', subcategories: {} },
  },
  FORMULA_SHEETS: { percentages: ['Profit = SP - CP'] },
  getSubcategoryQuestions: (_cat, sub) => MOCK_BANK.filter((q) => q.sub === sub),
  getCategoryQuestions: () => MOCK_BANK,
  getAllQuestions: () => MOCK_BANK,
  filterByDifficulty: (qs, diff) => {
    if (!diff || diff === 'all') return qs;
    return qs.filter((q) => q.difficulty === diff);
  },
  getRandomQuestions: (qs, n) => {
    mocks.sampleCallCount += 1;
    // Rotate differently on each call so a fresh sample is guaranteed to differ from the prior sample
    const offset = (mocks.sampleCallCount - 1) % Math.max(1, qs.length);
    const rotated = [...qs.slice(offset), ...qs.slice(0, offset)];
    return rotated.slice(0, Math.min(n, rotated.length));
  },
}));

import AptitudePractice from '../pages/AptitudePractice';
import AptitudeResults from '../pages/AptitudeResults';

function LocationSpy() {
  const loc = useLocation();
  return <div data-testid="location-url">{`${loc.pathname}${loc.search}`}</div>;
}

function renderAptitudeApp(initialEntry) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <LocationSpy />
      <Routes>
        <Route path="/aptitude/practice/:category" element={<AptitudePractice />} />
        <Route path="/aptitude/results" element={<AptitudeResults />} />
        <Route path="/aptitude" element={<div>Aptitude Hub</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('AptitudePractice & AptitudeResults Bug Fixes (#4, #5, #9)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sampleCallCount = 0;
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  describe('Bug #4: Speed mode persists per-question remaining time across navigation', () => {
    it('resumes remaining seconds when returning via Previous or Question Navigator instead of resetting to 30s', () => {
      vi.useFakeTimers();
      renderAptitudeApp('/aptitude/practice/quantitative?sub=percentages&mode=speed&difficulty=all&count=3');

      expect(screen.getByText(/Question q-easy-1/)).toBeInTheDocument();
      expect(screen.getByTestId('practice-timer')).toHaveTextContent('30s');

      // Spend 12s on Q1 -> 18s remaining
      act(() => {
        vi.advanceTimersByTime(12000);
      });
      expect(screen.getByTestId('practice-timer')).toHaveTextContent('18s');

      // Navigate to Q2, spend 5s -> 25s remaining
      fireEvent.click(screen.getByRole('button', { name: /Next/i }));
      expect(screen.getByText(/Question q-easy-2/)).toBeInTheDocument();
      expect(screen.getByTestId('practice-timer')).toHaveTextContent('30s');
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(screen.getByTestId('practice-timer')).toHaveTextContent('25s');

      // Return to Q1 via Previous -> must resume from 18s, not 30s
      fireEvent.click(screen.getByRole('button', { name: /Previous/i }));
      expect(screen.getByText(/Question q-easy-1/)).toBeInTheDocument();
      expect(screen.getByTestId('practice-timer')).toHaveTextContent('18s');

      // Spend 3 more seconds on Q1 -> 15s remaining
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(screen.getByTestId('practice-timer')).toHaveTextContent('15s');

      // Return to Q2 via Question Navigator -> must resume from 25s
      fireEvent.click(screen.getByTitle('Question Grid'));
      fireEvent.click(screen.getByRole('button', { name: '2' }));
      expect(screen.getByText(/Question q-easy-2/)).toBeInTheDocument();
      expect(screen.getByTestId('practice-timer')).toHaveTextContent('25s');
    });

    it('handles questions whose time already reached 0s without resetting or bouncing on revisit', () => {
      vi.useFakeTimers();
      renderAptitudeApp('/aptitude/practice/quantitative?sub=percentages&mode=speed&difficulty=all&count=2');

      expect(screen.getByText(/Question q-easy-1/)).toBeInTheDocument();

      // Let Q1 expire (30s) -> auto-advances to Q2
      act(() => {
        vi.advanceTimersByTime(30000);
      });
      expect(screen.getByText(/Question q-easy-2/)).toBeInTheDocument();
      expect(screen.getByTestId('practice-timer')).toHaveTextContent('30s');

      // Revisit expired Q1 via Previous -> stays on Q1, shows 0s, disables options
      fireEvent.click(screen.getByRole('button', { name: /Previous/i }));
      expect(screen.getByText(/Question q-easy-1/)).toBeInTheDocument();
      expect(screen.getByTestId('practice-timer')).toHaveTextContent('0s');
      expect(screen.getByRole('status')).toHaveTextContent(/Time's up/i);
      expect(screen.getByRole('button', { name: /Option A for q-easy-1/i })).toBeDisabled();

      // Time passing while viewing expired Q1 does not go negative or bounce away
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(screen.getByText(/Question q-easy-1/)).toBeInTheDocument();
      expect(screen.getByTestId('practice-timer')).toHaveTextContent('0s');

      // Move to Q2 (still 30s left) and let it expire -> finishes session since all questions are at 0s
      fireEvent.click(screen.getByRole('button', { name: /Next/i }));
      expect(screen.getByTestId('practice-timer')).toHaveTextContent('30s');
      act(() => {
        vi.advanceTimersByTime(30000);
      });
      expect(screen.getByTestId('practice-timer')).toHaveTextContent('0s');
      expect(screen.getByRole('button', { name: /Option A for q-easy-2/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /Finish & View Results/i })).toBeInTheDocument();
    });
  });

  describe('Bug #5: Learning mode tracks study time and reports non-zero Time and Avg Time', () => {
    it('records elapsed time in Learning mode and displays accurate Time and Avg Time in AptitudeResults', () => {
      vi.useFakeTimers();
      renderAptitudeApp('/aptitude/practice/quantitative?sub=percentages&mode=learning&difficulty=all&count=2');

      // Learning mode hides the live countdown timer bar
      expect(screen.queryByTestId('practice-timer')).not.toBeInTheDocument();

      // Spend 6s on Q1 and answer
      act(() => {
        vi.advanceTimersByTime(6000);
      });
      fireEvent.click(screen.getByRole('button', { name: /Option A for q-easy-1/i }));
      expect(screen.getByText('Explanation for q-easy-1')).toBeInTheDocument();

      // Move to Q2, spend 4s and answer
      fireEvent.click(screen.getByRole('button', { name: /Next/i }));
      act(() => {
        vi.advanceTimersByTime(4000);
      });
      fireEvent.click(screen.getByRole('button', { name: /Option B for q-easy-2/i }));

      // Finish and check AptitudeResults
      fireEvent.click(screen.getByRole('button', { name: /Finish & View Results/i }));
      expect(screen.getByTestId('location-url')).toHaveTextContent('/aptitude/results');

      const timeLabel = screen.getByText('Time');
      expect(timeLabel.parentElement).toHaveTextContent('10s');

      const avgLabel = screen.getByText('Avg Time');
      expect(avgLabel.parentElement).toHaveTextContent('5s');
    });
  });

  describe('Bug #9: Retry Same Set preserves exact question set and session configuration', () => {
    it('preserves hard difficulty, mode, and subcategory when retrying a hard-only session', () => {
      renderAptitudeApp('/aptitude/practice/quantitative?sub=percentages&mode=practice&difficulty=hard');

      // Only hard percentages questions (q-hard-1, q-hard-2) should be loaded
      expect(screen.getByText('1 / 2')).toBeInTheDocument();
      expect(screen.getByText(/Question q-hard-1/)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Option A for q-hard-1/i }));
      fireEvent.click(screen.getByRole('button', { name: /Next/i }));
      expect(screen.getByText(/Question q-hard-2/)).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /Option A for q-hard-2/i }));

      fireEvent.click(screen.getByRole('button', { name: /Finish & View Results/i }));
      expect(screen.getByTestId('location-url')).toHaveTextContent('/aptitude/results');

      fireEvent.click(screen.getByRole('button', { name: /Retry Same Set/i }));

      const urlText = screen.getByTestId('location-url').textContent;
      expect(urlText).toContain('/aptitude/practice/quantitative?');
      const params = new URLSearchParams(urlText.split('?')[1]);
      expect(params.get('sub')).toBe('percentages');
      expect(params.get('mode')).toBe('practice');
      expect(params.get('difficulty')).toBe('hard');
      expect(params.get('count')).toBe('2');

      // Must still have the exact 2 hard questions, NOT reset to difficulty=all
      expect(screen.getByText('1 / 2')).toBeInTheDocument();
      expect(screen.getByText(/Question q-hard-1/)).toBeInTheDocument();
      expect(screen.queryByText(/easy/)).not.toBeInTheDocument();
    });

    it('preserves the exact sampled question set and order for mixed/speed rounds without redrawing', () => {
      renderAptitudeApp('/aptitude/practice/all?mode=speed&difficulty=medium&count=3');

      // Initial sample starts at q-med-1, q-med-2, q-med-3
      expect(screen.getByText('1 / 3')).toBeInTheDocument();
      expect(screen.getByText(/Question q-med-1/)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Next/i }));
      expect(screen.getByText(/Question q-med-2/)).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /Next/i }));
      expect(screen.getByText(/Question q-med-3/)).toBeInTheDocument();

      const callsBeforeRetry = mocks.sampleCallCount;
      fireEvent.click(screen.getByRole('button', { name: /Finish & View Results/i }));
      fireEvent.click(screen.getByRole('button', { name: /Retry Same Set/i }));

      const urlText = screen.getByTestId('location-url').textContent;
      const params = new URLSearchParams(urlText.split('?')[1]);
      expect(params.get('mode')).toBe('speed');
      expect(params.get('difficulty')).toBe('medium');
      expect(params.get('count')).toBe('3');
      expect(params.get('sub')).toBeNull();

      // Must NOT redraw a fresh random sample
      expect(mocks.sampleCallCount).toBe(callsBeforeRetry);
      expect(screen.getByText('1 / 3')).toBeInTheDocument();
      expect(screen.getByText(/Question q-med-1/)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Next/i }));
      expect(screen.getByText(/Question q-med-2/)).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /Next/i }));
      expect(screen.getByText(/Question q-med-3/)).toBeInTheDocument();
    });
  });
});
