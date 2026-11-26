import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import JobUpdates from './JobUpdates';
import * as AuthContext from '../context/AuthContext';
import * as authFetchModule from '../utils/authFetch';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('JobUpdates Bug 7: Stale search responses do not overwrite newer results', () => {
  let authFetchMock;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ user: null });
  });

  afterEach(() => {
    vi.useRealTimers();
    authFetchMock?.mockRestore();
  });

  it('aborts the previous keyword search and ignores late stale responses', async () => {
    vi.useFakeTimers();

    const firstSearch = deferred();
    const secondSearch = deferred();
    const signals = [];

    authFetchMock = vi.spyOn(authFetchModule, 'authFetch').mockImplementation((url, options) => {
      const urlStr = String(url);
      if (urlStr.includes('/api/jobs')) {
        signals.push(options?.signal);
        if (urlStr.includes('search=python')) return firstSearch.promise;
        if (urlStr.includes('search=react')) return secondSearch.promise;
        return Promise.resolve({
          ok: true,
          json: async () => ({
            jobs: [{ id: 'init-1', company: 'InitCo', title: 'Initial Role', type: 'full-time', location: 'India' }],
            totalPages: 1,
          }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({ applications: [] }) });
    });

    render(
      <MemoryRouter>
        <JobUpdates />
      </MemoryRouter>
    );

    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByText('Initial Role')).toBeInTheDocument();

    const input = screen.getByPlaceholderText('Search jobs, companies, or locations...');

    // Trigger first search: "python"
    fireEvent.change(input, { target: { value: 'python' } });
    await act(async () => {
      vi.advanceTimersByTime(450);
    });

    // Trigger second search: "react" before "python" finishes
    fireEvent.change(input, { target: { value: 'react' } });
    await act(async () => {
      vi.advanceTimersByTime(450);
    });

    // The "python" request signal should now be aborted
    const pythonSignal = signals[1];
    const reactSignal = signals[2];
    expect(pythonSignal?.aborted).toBe(true);
    expect(reactSignal?.aborted).toBe(false);

    // Newer "react" response resolves first
    await act(async () => {
      secondSearch.resolve({
        ok: true,
        json: async () => ({
          jobs: [{ id: 'react-1', company: 'ReactCorp', title: 'React Engineer', type: 'full-time', location: 'Remote' }],
          totalPages: 1,
        }),
      });
      await Promise.resolve();
    });

    expect(screen.getByText('React Engineer')).toBeInTheDocument();

    // Older slow "python" response resolves later (even without rejecting on abort)
    await act(async () => {
      firstSearch.resolve({
        ok: true,
        json: async () => ({
          jobs: [{ id: 'py-1', company: 'PythonCorp', title: 'Stale Python Role', type: 'full-time', location: 'Pune' }],
          totalPages: 1,
        }),
      });
      await Promise.resolve();
    });

    // Newer results must remain; stale results must NOT overwrite them
    expect(screen.getByText('React Engineer')).toBeInTheDocument();
    expect(screen.queryByText('Stale Python Role')).not.toBeInTheDocument();
  });

  it('aborts in-flight AI search on mode switch and ignores stale AI responses', async () => {
    const firstAi = deferred();
    const secondAi = deferred();
    const aiSignals = [];

    authFetchMock = vi.spyOn(authFetchModule, 'authFetch').mockImplementation((url, options) => {
      const urlStr = String(url);
      if (urlStr.includes('/api/jobs/ai-search')) {
        aiSignals.push(options?.signal);
        const body = JSON.parse(options?.body || '{}');
        if (body.query === 'First AI query') return firstAi.promise;
        return secondAi.promise;
      }
      if (urlStr.includes('/api/jobs')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            jobs: [{ id: 'kw-1', company: 'KwCo', title: 'Keyword Role', type: 'full-time', location: 'India' }],
            totalPages: 1,
          }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({ applications: [] }) });
    });

    render(
      <MemoryRouter>
        <JobUpdates />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /AI Search/i }));
    const aiInput = screen.getByPlaceholderText('Describe your dream job in plain English...');

    fireEvent.change(aiInput, { target: { value: 'First AI query' } });
    fireEvent.click(screen.getByRole('button', { name: /^Search$/i }));
    expect(aiSignals).toHaveLength(1);
    expect(aiSignals[0]?.aborted).toBe(false);

    // Switch back to Keyword mode while first AI search is still in-flight, then back to AI Search
    fireEvent.click(screen.getByRole('button', { name: /Keyword/i }));
    expect(aiSignals[0]?.aborted).toBe(true);

    await waitFor(() => {
      expect(screen.getByText('Keyword Role')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /AI Search/i }));
    const aiInputAgain = screen.getByPlaceholderText('Describe your dream job in plain English...');
    fireEvent.change(aiInputAgain, { target: { value: 'Second AI query' } });
    fireEvent.keyDown(aiInputAgain, { key: 'Enter' });

    expect(aiSignals).toHaveLength(2);
    expect(aiSignals[1]?.aborted).toBe(false);

    await act(async () => {
      secondAi.resolve({
        ok: true,
        json: async () => ({
          jobs: [{ id: 'ai-new', company: 'NewAI', title: 'New AI Role', type: 'full-time', location: 'India' }],
        }),
      });
      await Promise.resolve();
    });

    expect(screen.getByText('New AI Role')).toBeInTheDocument();

    await act(async () => {
      firstAi.resolve({
        ok: true,
        json: async () => ({
          jobs: [{ id: 'ai-old', company: 'OldAI', title: 'Stale AI Role', type: 'full-time', location: 'India' }],
        }),
      });
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getByText('New AI Role')).toBeInTheDocument();
      expect(screen.queryByText('Stale AI Role')).not.toBeInTheDocument();
    });
  });
});
