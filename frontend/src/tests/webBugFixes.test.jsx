/* @vitest-environment jsdom */
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';

const mocks = vi.hoisted(() => ({
  authFetch: vi.fn(),
  useAuth: vi.fn(),
  useDashboardData: vi.fn(),
  apiPost: vi.fn(),
  apiGet: vi.fn(),
  routeParams: { problemId: '1' },
}));

vi.mock('../lib/supabase', () => ({ supabase: null }));
vi.mock('../utils/apiClient', () => ({
  default: { get: mocks.apiGet, post: mocks.apiPost },
}));
vi.mock('../utils/authFetch', () => ({
  authFetch: mocks.authFetch,
}));
vi.mock('../context/ThemeContext', () => ({
  useTheme: () => ({ theme: 'dark', toggleTheme: vi.fn() }),
}));
vi.mock('../hooks/useDashboardData', () => ({
  default: mocks.useDashboardData,
}));
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useParams: () => mocks.routeParams,
  };
});
vi.mock('@monaco-editor/react', () => ({
  default: ({ value, onChange }) => (
    <textarea
      data-testid="monaco-mock"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    />
  ),
}));
vi.mock('../components/editor/DSAToolbar', () => ({
  default: () => <div data-testid="dsa-toolbar" />,
}));
vi.mock('../components/editor/ProblemDescriptionPanel', () => ({
  default: () => <div data-testid="problem-desc" />,
}));
vi.mock('../components/editor/VisualizationPanel', () => ({
  default: () => <div data-testid="viz-panel" />,
}));
vi.mock('../components/editor/TestCasePanel', () => ({
  default: () => <div data-testid="testcase-panel" />,
}));
vi.mock('../components/solver/HintsPanel', () => ({
  default: () => <div data-testid="hints-panel" />,
}));
vi.mock('react-resizable-panels', () => ({
  Panel: ({ children }) => <div>{children}</div>,
  Group: ({ children }) => <div>{children}</div>,
  PanelGroup: ({ children }) => <div>{children}</div>,
  Separator: () => <div />,
  PanelResizeHandle: () => <div />,
}));

import {
  clearAccountStorage,
  getAccountStorageKey,
  readInterviewHistory,
  updateInterviewHistory,
} from '../utils/accountStorage';
import InterviewHistoryPage from '../pages/InterviewHistory';
import InterviewHistoryComponent from '../components/InterviewHistory';
import HistoryPage from '../pages/History';
import NotesBookmarks from '../pages/NotesBookmarks';
import Analytics from '../pages/Analytics';
import SQLCodeEditor from '../pages/SQLCodeEditor';
import DSACodeEditor from '../pages/DSACodeEditor';

vi.mock('../context/AuthContext', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useAuth: () => mocks.useAuth(),
  };
});

describe('Web Bug Fixes (#1, #2, #5, #6, #7, #9)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
    mocks.routeParams = { problemId: '1' };
    mocks.useAuth.mockReturnValue({
      user: { id: 'user-a', email: 'a@example.com' },
      loading: false,
      getAuthHeaders: () => ({ Authorization: 'Bearer tok-a' }),
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('Bug #1: Interview history account scoping, no fallback on failure, sign-out cleanup', () => {
    it('scopes local interview history by userId and clears all caches on clearAccountStorage', () => {
      updateInterviewHistory('user-a', () => [{ id: 'sess-a', company: 'Google', conversation: [{ role: 'candidate', content: 'secret A' }] }]);
      updateInterviewHistory('user-b', () => [{ id: 'sess-b', company: 'Meta', conversation: [{ role: 'candidate', content: 'secret B' }] }]);
      localStorage.setItem('preploop_local_interview_history', JSON.stringify([{ id: 'legacy', company: 'Legacy' }]));
      localStorage.setItem(getAccountStorageKey('dsa-code-1-python', 'user-a'), 'def a(): pass');
      localStorage.setItem(getAccountStorageKey('notes', 'user-a'), '[{"id":1}]');

      expect(readInterviewHistory('user-a').map((s) => s.id)).toEqual(['sess-a']);
      expect(readInterviewHistory('user-b').map((s) => s.id)).toEqual(['sess-b']);
      expect(readInterviewHistory(null)).toEqual([]);

      clearAccountStorage('user-a');
      expect(readInterviewHistory('user-a')).toEqual([]);
      expect(localStorage.getItem(getAccountStorageKey('dsa-code-1-python', 'user-a'))).toBeNull();
      expect(localStorage.getItem(getAccountStorageKey('notes', 'user-a'))).toBeNull();
      expect(localStorage.getItem('preploop_local_interview_history')).toBeNull();
    });

    it('never falls back to cached sessions or transcripts when server returns 401/403/500', async () => {
      updateInterviewHistory('user-a', () => [{
        id: 'cached-1',
        session_id: 'cached-1',
        company: 'SecretCorp',
        role: 'Engineer',
        stage: 'Technical',
        conversation: [{ role: 'candidate', content: 'Private cached transcript' }],
        completed_at: new Date().toISOString(),
      }]);

      mocks.authFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal Server Error' }),
      });

      render(
        <MemoryRouter initialEntries={['/interview-history?session_id=cached-1']}>
          <InterviewHistoryPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
      expect(screen.queryByText('SecretCorp')).not.toBeInTheDocument();
      expect(screen.queryByText('Private cached transcript')).not.toBeInTheDocument();
    });

    it('components/InterviewHistory and pages/History do not fall back to local cache on HTTP 403', async () => {
      updateInterviewHistory('user-a', () => [{
        id: 'cached-2',
        company: 'LeakCo',
        role: 'SWE',
        stage: 'Technical',
        completed_at: new Date().toISOString(),
      }]);

      mocks.authFetch.mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ error: 'Forbidden' }),
      });

      render(
        <MemoryRouter>
          <InterviewHistoryComponent />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
      expect(screen.queryByText('LeakCo')).not.toBeInTheDocument();

      cleanup();

      render(
        <MemoryRouter>
          <HistoryPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
      expect(screen.queryByText(/LeakCo/)).not.toBeInTheDocument();
    });
  });

  describe('Bug #2: Web code drafts are account-scoped and isolated across accounts', () => {
    it('isolates SQL drafts between user-a and user-b', async () => {
      mocks.routeParams = { problemId: '1' };
      const { rerender } = render(
        <MemoryRouter>
          <SQLCodeEditor />
        </MemoryRouter>
      );

      const editor = await screen.findByTestId('monaco-mock');
      fireEvent.change(editor, { target: { value: 'SELECT * FROM user_a_secret;' } });

      await waitFor(() => {
        expect(localStorage.getItem(getAccountStorageKey('sql-code-1', 'user-a'))).toBe('SELECT * FROM user_a_secret;');
      });

      mocks.useAuth.mockReturnValue({
        user: { id: 'user-b', email: 'b@example.com' },
        loading: false,
        getAuthHeaders: () => ({ Authorization: 'Bearer tok-b' }),
      });

      rerender(
        <MemoryRouter>
          <SQLCodeEditor />
        </MemoryRouter>
      );

      const editorB = await screen.findByTestId('monaco-mock');
      expect(editorB.value).not.toContain('user_a_secret');
    });

    it('isolates DSA drafts between user-a and user-b', async () => {
      mocks.routeParams = { problemId: 'two-sum' };
      mocks.authFetch.mockResolvedValue({ ok: false, json: async () => ({}) });

      const { rerender } = render(
        <MemoryRouter>
          <DSACodeEditor />
        </MemoryRouter>
      );

      const editor = await screen.findByTestId('monaco-mock');
      fireEvent.change(editor, { target: { value: '# user-a private solution' } });

      await waitFor(() => {
        expect(localStorage.getItem(getAccountStorageKey('dsa-code-1-python', 'user-a'))).toBe('# user-a private solution');
      });

      mocks.useAuth.mockReturnValue({
        user: { id: 'user-b', email: 'b@example.com' },
        loading: false,
        getAuthHeaders: () => ({ Authorization: 'Bearer tok-b' }),
      });

      rerender(
        <MemoryRouter>
          <DSACodeEditor />
        </MemoryRouter>
      );

      const editorB = await screen.findByTestId('monaco-mock');
      expect(editorB.value).not.toContain('user-a private solution');
    });
  });

  describe('Bug #5: Interview deletion keeps item and shows error on server 500', () => {
    it('keeps session in list and displays error when DELETE fails with 500', async () => {
      const session = {
        id: 'sess-500',
        session_id: 'sess-500',
        company: 'AcmeCorp',
        role: 'Backend Engineer',
        stage: 'Technical',
        difficulty: 'medium',
        overall_score: 85,
        conversation: [{ role: 'interviewer', content: 'Hello' }],
        completed_at: new Date().toISOString(),
      };

      mocks.authFetch.mockImplementation(async (url, opts) => {
        if (opts?.method === 'DELETE') {
          return {
            ok: false,
            status: 500,
            json: async () => ({ error: 'Failed to delete session' }),
          };
        }
        if (String(url).includes('/sessions/sess-500')) {
          return { ok: true, status: 200, json: async () => session };
        }
        return { ok: true, status: 200, json: async () => [session] };
      });
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      render(
        <MemoryRouter>
          <InterviewHistoryPage />
        </MemoryRouter>
      );

      const row = await screen.findByText(/AcmeCorp/);
      fireEvent.click(row);

      const delBtn = await screen.findByRole('button', { name: /Delete/i });
      fireEvent.click(delBtn);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Failed to delete session');
      });

      fireEvent.click(screen.getByRole('button', { name: /Back to History/i }));
      expect(screen.getByText(/AcmeCorp/)).toBeInTheDocument();
    });
  });

  describe('Bugs #6 & #7: Web Notes error preservation, load failure state, and pagination > 20', () => {
    it('keeps editor open with user edits and error when save fails', async () => {
      const bookmark = {
        id: 10,
        question_title: 'Two Sum',
        question_type: 'dsa',
        tags: ['Arrays'],
        note: 'Original note',
        created_at: new Date().toISOString(),
      };

      mocks.authFetch.mockImplementation(async (_url, opts) => {
        if (opts?.method === 'PUT') {
          return {
            ok: false,
            status: 500,
            json: async () => ({ error: 'Database write failed' }),
          };
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({ bookmarks: [bookmark], pagination: { page: 1, limit: 100, total: 1, hasMore: false } }),
        };
      });

      render(<NotesBookmarks />);

      await screen.findByText('Two Sum');
      const cardButtons = screen.getAllByRole('button');
      const editBtn = cardButtons.find((btn) => btn.querySelector('svg.lucide-edit3, svg.lucide-square-pen') || btn.closest('.nb-card-actions'));
      fireEvent.click(editBtn);

      const textarea = screen.getByPlaceholderText('Edit your note...');
      fireEvent.change(textarea, { target: { value: 'Unsaved critical edit' } });

      fireEvent.click(screen.getByRole('button', { name: /Update/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Database write failed');
      });
      expect(screen.getByDisplayValue('Unsaved critical edit')).toBeInTheDocument();
    });

    it('shows load error with retry instead of empty state when fetch fails and no cache exists', async () => {
      mocks.authFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      });

      render(<NotesBookmarks />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Could not load your notes.');
      });
      expect(screen.getByRole('button', { name: /Try again/i })).toBeInTheDocument();
      expect(screen.queryByText(/No bookmarks yet/i)).not.toBeInTheDocument();
    });

    it('loads all pages beyond 20 bookmarks', async () => {
      const makePage = (start, count) => Array.from({ length: count }, (_, idx) => ({
        id: start + idx,
        question_title: `Bookmark #${start + idx}`,
        question_type: 'dsa',
        tags: [],
        note: '',
        created_at: new Date().toISOString(),
      }));

      mocks.authFetch.mockImplementation(async (url) => {
        if (String(url).includes('page=1')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              bookmarks: makePage(1, 20),
              pagination: { page: 1, limit: 100, total: 25, hasMore: true },
            }),
          };
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({
            bookmarks: makePage(21, 5),
            pagination: { page: 2, limit: 100, total: 25, hasMore: false },
          }),
        };
      });

      render(<NotesBookmarks />);

      await screen.findByText('Bookmark #25');
      expect(screen.getByText('25 items saved')).toBeInTheDocument();
    });
  });

  describe('Bug #9: Web Analytics displays real daily counts and honest N/A solve time', () => {
    it('uses heatmapData for 7-day chart and shows N/A instead of fabricated avg solve time', () => {
      const todayKey = new Date().toISOString().slice(0, 10);
      mocks.useDashboardData.mockReturnValue({
        data: {
          stats: { problemsSolved: 70, mockInterviews: 4 },
          bestStreak: 6,
          weeklyGoals: { easy: 2, medium: 1, hard: 0 },
          heatmapData: { [todayKey]: { solved: 3, xp: 75, easy: 2, medium: 1, hard: 0 } },
          topicProgress: [{ name: 'Arrays', solved: 5, total: 10 }],
        },
        loading: false,
        error: null,
      });

      render(<Analytics />);

      expect(screen.getByText('N/A')).toBeInTheDocument();
      expect(screen.queryByText('19m')).not.toBeInTheDocument();
      expect(screen.getByText('Arrays')).toBeInTheDocument();
      expect(screen.getByText('5 / 10 solved')).toBeInTheDocument();
      // Today's bar shows 3; other days with no heatmap entry show 0 (never distributed 70/7 = 10)
      expect(screen.queryByText('10')).not.toBeInTheDocument();
    });
  });
});
