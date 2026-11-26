import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Profile from './Profile';

const mockNavigate = vi.fn();
const mockAuthFetch = vi.fn();
const mockRefreshBalance = vi.fn();
const mockRefreshDashboard = vi.fn();
const mockLogout = vi.fn();

const mockUser = {
  id: '11111111-2222-4333-8444-555555555555',
  fullName: "José O'Connor · 田中太郎",
  email: 'jose@example.com',
  subscriptionTier: 'pro',
};

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    logout: mockLogout,
  }),
}));

vi.mock('../context/CoinContext', () => ({
  useCoins: () => ({
    refreshBalance: mockRefreshBalance,
  }),
}));

vi.mock('../hooks/useDashboardData', () => ({
  default: () => ({
    data: { stats: { mockInterviews: 2, problemsSolved: 5, resumesAnalyzed: 1 } },
    refresh: mockRefreshDashboard,
  }),
}));

vi.mock('../utils/authFetch', () => ({
  authFetch: (...args) => mockAuthFetch(...args),
}));

vi.mock('../components/AIMatchReportModal', () => ({
  default: () => null,
}));

function buildProfileResponsePayload(overrides = {}) {
  return {
    user: {
      id: mockUser.id,
      email: mockUser.email,
      fullName: mockUser.fullName,
      bio: 'Distributed systems engineer',
      currentRole: 'Staff Engineer',
      skills: 'Go, TypeScript, React',
      experience: 'Lead Engineer at Acme',
      education: 'M.S. Computer Science',
      githubUsername: 'jose-gh',
      custom_url: '',
      is_public: false,
      profileTheme: 'aurora',
      socialLinks: { linkedin: 'https://www.linkedin.com/in/jose-li' },
      ...overrides,
    },
  };
}

function setupDefaultFetch(profileOverrides = {}, extraHandlers = {}) {
  mockAuthFetch.mockImplementation(async (url, options = {}) => {
    const key = `${options.method || 'GET'} ${url}`;
    if (extraHandlers[key]) {
      return extraHandlers[key](url, options);
    }
    if (url === '/api/user/profile' && (!options.method || options.method === 'GET')) {
      return { ok: true, json: async () => buildProfileResponsePayload(profileOverrides) };
    }
    if (url === '/api/resume/latest') {
      return { ok: true, json: async () => ({ resumeProfile: null }) };
    }
    if (url === '/api/jobs/skill-match') {
      return { ok: true, json: async () => ({ jobs: [] }) };
    }
    return { ok: true, json: async () => ({}) };
  });
}

describe('Profile Page bug regressions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses user UUID as default public link and keeps Copy Public Link disabled while private (Bugs 3 & 6)', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('Clipboard blocked'));
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    setupDefaultFetch({ is_public: false, custom_url: '' });
    render(<MemoryRouter><Profile /></MemoryRouter>);

    const link = await screen.findByTitle('Open public profile in new tab');
    expect(link).toHaveAttribute('href', `/u/${mockUser.id}`);

    const copyBtn = screen.getByRole('button', { name: /Copy Public Link/i });
    expect(copyBtn).toBeDisabled();
    fireEvent.click(copyBtn);

    const putCalls = mockAuthFetch.mock.calls.filter(([, opts]) => opts?.method === 'PUT');
    expect(putCalls).toHaveLength(0);
    expect(writeText).not.toHaveBeenCalled();

    // Explicitly toggle visibility to public, then simulate clipboard failure
    setupDefaultFetch(
      { is_public: false },
      {
        'PUT /api/user/profile': async (_u, opts) => ({
          ok: true,
          json: async () => buildProfileResponsePayload({ is_public: JSON.parse(opts.body).is_public }),
        }),
      }
    );
    fireEvent.click(screen.getByRole('button', { name: /Make profile public/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Copy Public Link/i })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: /Copy Public Link/i }));
    expect(await screen.findByText(/Could not copy the profile link/i)).toBeInTheDocument();
  });

  it('does not update local LinkedIn state or claim ID was saved when profile PUT fails (Bug 8)', async () => {
    setupDefaultFetch(
      { socialLinks: { linkedin: '' } },
      {
        'POST /api/resume/import-linkedin': async () => ({
          ok: true,
          json: async () => ({
            success: true,
            imported: false,
            linkedinUrl: 'https://www.linkedin.com/in/jane-doe',
            message: 'LinkedIn ID linked! Paste your profile text.',
          }),
        }),
        'PUT /api/user/profile': async () => ({
          ok: false,
          json: async () => ({ error: 'Database write failed' }),
        }),
      }
    );

    render(<MemoryRouter><Profile /></MemoryRouter>);

    const input = await screen.findByPlaceholderText(/Enter LinkedIn user ID or URL/i);
    fireEvent.change(input, { target: { value: 'jane-doe' } });
    fireEvent.click(screen.getByRole('button', { name: /Auto-Fill from LinkedIn ID/i }));

    expect(await screen.findByText('Database write failed')).toBeInTheDocument();
    expect(screen.queryByText(/LinkedIn ID linked!/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Paste your LinkedIn profile text/i)).not.toBeInTheDocument();
  });

  it('hands off useSavedProfile flag alongside social handles to PortfolioCreator (Bug 9)', async () => {
    setupDefaultFetch({
      githubUsername: 'jose-gh',
      socialLinks: { linkedin: 'https://www.linkedin.com/in/jose-li' },
    });

    render(<MemoryRouter><Profile /></MemoryRouter>);

    const portfolioTab = await screen.findByRole('button', { name: /^Portfolio$/i });
    fireEvent.click(portfolioTab);

    const customizeBtn = await screen.findByRole('button', { name: /Customize Portfolio/i });
    fireEvent.click(customizeBtn);

    expect(mockNavigate).toHaveBeenCalledWith('/portfolio-creator', {
      state: {
        form: {
          useSavedProfile: true,
          githubUsername: 'jose-gh',
          linkedinUrl: 'https://www.linkedin.com/in/jose-li',
        },
      },
    });
  });
});
