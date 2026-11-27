/* @vitest-environment jsdom */
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';

const mocks = vi.hoisted(() => ({
  authFetch: vi.fn(),
}));

vi.mock('../utils/authFetch', () => ({
  authFetch: mocks.authFetch,
}));

vi.mock('../context/ThemeContext', () => ({
  useTheme: () => ({ theme: 'dark', toggleTheme: vi.fn() }),
}));

import TimedPractice from '../pages/TimedPractice';
import { CalcWidget } from '../pages/AptitudePractice';

describe('TimedPractice & AptitudePractice bug regressions (#2-#7)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('Bug #2: reports solved problems and elapsed time when timer expires without pausing', async () => {
    vi.useFakeTimers();
    mocks.authFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        sessionId: 'timed_1',
        duration: 10,
        problems: [
          { id: 'p1', title: 'Two Sum', difficulty: 'easy', pattern: 'Hash Map' },
          { id: 'p2', title: 'Valid Parentheses', difficulty: 'easy', pattern: 'Stack' },
        ],
      }),
    });

    render(
      <MemoryRouter>
        <TimedPractice />
      </MemoryRouter>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('10-Min Quick Round'));
      await Promise.resolve();
    });

    expect(screen.getByText('Two Sum')).toBeInTheDocument();

    // Mark problem 1 solved
    fireEvent.click(screen.getByRole('button', { name: /Solved/i }));

    // Let full 10-minute timer expire
    await act(async () => {
      vi.advanceTimersByTime(10 * 60 * 1000 + 1000);
      await Promise.resolve();
    });

    expect(screen.getByText('Session Complete!')).toBeInTheDocument();
    const solvedCard = screen.getByText('Solved').closest('.tp-result-card');
    expect(solvedCard).toHaveTextContent('1');
    const timeCard = screen.getByText('Time Used').closest('.tp-result-card');
    expect(timeCard).toHaveTextContent('10:00');
  });

  it('Bug #3: does not crash when API returns zero problems and shows visible error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.authFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        sessionId: 'timed_empty',
        duration: 10,
        problems: [],
      }),
    });

    render(
      <MemoryRouter>
        <TimedPractice />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('10-Min Quick Round'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/no practice problems/i);
    });
    expect(screen.getByText('10-Min Quick Round')).toBeEnabled();
    consoleSpy.mockRestore();
  });

  it('Bug #4: Last-Day Revision requests weak-area selection mode', async () => {
    mocks.authFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        sessionId: 'timed_last_day',
        duration: 20,
        problems: [{ id: 'p9', title: 'Weak Problem', difficulty: 'medium', pattern: 'DP' }],
      }),
    });

    render(
      <MemoryRouter>
        <TimedPractice />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Last-Day Revision'));

    await waitFor(() => {
      expect(screen.getByText('Weak Problem')).toBeInTheDocument();
    });

    const [, requestInit] = mocks.authFetch.mock.calls[0];
    const body = JSON.parse(requestInit.body);
    expect(body).toMatchObject({
      mode: 'last-day',
      focus: 'weak-areas',
      count: 10,
      duration: 20,
    });
  });

  it('Bug #5: starting a new round after finishing early while paused resets paused state', async () => {
    vi.useFakeTimers();
    mocks.authFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        sessionId: 'timed_2',
        duration: 10,
        problems: [{ id: 'p1', title: 'Two Sum', difficulty: 'easy', pattern: 'Arrays' }],
      }),
    });

    render(
      <MemoryRouter>
        <TimedPractice />
      </MemoryRouter>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('10-Min Quick Round'));
      await Promise.resolve();
    });

    // Pause round, then finish early, then try another session
    fireEvent.click(screen.getByRole('button', { name: /Pause timer/i }));
    fireEvent.click(screen.getByRole('button', { name: /Finish Early/i }));
    expect(screen.getByText('Session Complete!')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Try Another Session/i }));

    await act(async () => {
      fireEvent.click(screen.getByText('10-Min Quick Round'));
      await Promise.resolve();
    });

    expect(screen.getByText('10:00')).toBeInTheDocument();
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByText('09:55')).toBeInTheDocument();
  });

  it('Bug #6: failed Timed Practice start shows visible error feedback', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.authFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Service temporarily unavailable' }),
    });

    render(
      <MemoryRouter>
        <TimedPractice />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('30-Min Full Mock'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Service temporarily unavailable');
    });
    expect(screen.getByText('30-Min Full Mock')).toBeEnabled();
    consoleSpy.mockRestore();
  });

  it('Bug #7: Aptitude CalcWidget computes chained operations accurately (2 + 3 + 4 = 9)', () => {
    render(<CalcWidget onClose={vi.fn()} isLight={false} />);

    const pressSeq = (seq) => {
      seq.forEach((btn) => fireEvent.click(screen.getByRole('button', { name: btn })));
    };
    const display = () => screen.getByTestId('calc-display');

    // 2 + 3 + 4 = 9
    pressSeq(['2', '+', '3', '+', '4', '=']);
    expect(display()).toHaveTextContent('9');

    // Clear and test 10 - 3 - 2 = 5
    pressSeq(['C', '1', '0', '-', '3', '-', '2', '=']);
    expect(display()).toHaveTextContent('5');

    // Operator change before second operand: 2 + × 4 = 8
    pressSeq(['C', '2', '+', '×', '4', '=']);
    expect(display()).toHaveTextContent('8');

    // Division by zero gives Error without crashing
    pressSeq(['C', '5', '÷', '0', '=']);
    expect(display()).toHaveTextContent('Error');
  });
});
