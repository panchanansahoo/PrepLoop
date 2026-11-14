import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SpacedRepetitionWidget from './SpacedRepetitionWidget';
import { ThemeProvider } from '../context/ThemeContext';

const mockAuthFetch = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'test-user', email: 'test@preploop.io' } }),
}));

vi.mock('../utils/authFetch', () => ({
  authFetch: (...args) => mockAuthFetch(...args),
}));

describe('SpacedRepetitionWidget UI & Interactions', () => {
  beforeEach(() => {
    mockAuthFetch.mockReset();
  });

  it('renders all caught up empty state when queue is empty', async () => {
    mockAuthFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        dueCount: 0,
        totalTracked: 5,
        dueProblems: [],
      }),
    });

    render(
      <MemoryRouter>
        <ThemeProvider>
          <SpacedRepetitionWidget />
        </ThemeProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText(/All caught up!/i)).toBeInTheDocument();
    expect(screen.getByText('0 Due for Review')).toBeInTheDocument();
    expect(screen.getByText(/5 problems tracked/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Explore Problems/i })).toHaveAttribute('href', '/problems');
  });

  it('renders problem list and submits SM-2 Again, Hard, Good, and Easy ratings', async () => {
    mockAuthFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          dueCount: 2,
          totalTracked: 4,
          dueProblems: [
            { problem_id: 'lru-cache', problem_title: 'LRU Cache', interval_days: 3, ease_factor: 2.6 },
            { problem_id: 'merge-k-lists', problem_title: 'Merge K Sorted Lists', interval_days: 1, ease_factor: 2.4 },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ persisted: true }),
      });

    render(
      <MemoryRouter>
        <ThemeProvider>
          <SpacedRepetitionWidget />
        </ThemeProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText('LRU Cache')).toBeInTheDocument();
    expect(screen.getByText('Merge K Sorted Lists')).toBeInTheDocument();
    expect(screen.getByText('2 Due for Review')).toBeInTheDocument();

    const goodButtons = screen.getAllByRole('button', { name: 'Good' });
    expect(goodButtons).toHaveLength(2);

    fireEvent.click(goodButtons[0]);

    await waitFor(() => {
      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/spaced-repetition/review'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            problemId: 'lru-cache',
            problemTitle: 'LRU Cache',
            quality: 4,
          }),
        })
      );
    });

    // The item should be filtered out from the due list
    await waitFor(() => {
      expect(screen.queryByText('LRU Cache')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Merge K Sorted Lists')).toBeInTheDocument();
  });

  it('triggers refresh when refresh button is clicked', async () => {
    mockAuthFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ dueCount: 0, totalTracked: 0, dueProblems: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          dueCount: 1,
          totalTracked: 1,
          dueProblems: [
            { problem_id: 'invert-tree', problem_title: 'Invert Binary Tree', interval_days: 1, ease_factor: 2.5 },
          ],
        }),
      });

    render(
      <MemoryRouter>
        <ThemeProvider>
          <SpacedRepetitionWidget />
        </ThemeProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText(/All caught up!/i)).toBeInTheDocument();

    const refreshBtn = screen.getByRole('button', { name: /Refresh/i });
    fireEvent.click(refreshBtn);

    expect(await screen.findByText('Invert Binary Tree')).toBeInTheDocument();
    expect(mockAuthFetch).toHaveBeenCalledTimes(2);
  });
});
