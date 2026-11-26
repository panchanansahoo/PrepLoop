import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Settings from './Settings';
import { ThemeProvider } from '../context/ThemeContext';

const mockLogout = vi.fn().mockResolvedValue(undefined);
const mockNavigate = vi.fn();
const mockAuthFetch = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'usr_123',
      fullName: 'Alex Rivera',
      email: 'alex@example.com',
      subscriptionTier: 'pro',
    },
    logout: mockLogout,
  }),
}));

vi.mock('../utils/authFetch', () => ({
  authFetch: (...args) => mockAuthFetch(...args),
}));

function renderSettings() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <Settings />
      </ThemeProvider>
    </MemoryRouter>
  );
}

describe('Settings Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('loads settings, displays real subscription plan, and persists updates', async () => {
    mockAuthFetch.mockImplementation(async (url, options) => {
      if (!options?.method || options.method === 'GET') {
        return {
          ok: true,
          json: async () => ({
            settings: {
              full_name: 'Alex Rivera',
              experience_level: 'advanced',
              subscription_tier: 'pro',
              emailNotifications: true,
              practiceReminders: false,
              weeklyReport: true,
              language: 'en',
              codeEditor: 'vscode',
              difficulty: 'hard',
            },
          }),
        };
      }
      if (url.endsWith('/api/user/settings') && options.method === 'PUT') {
        const parsed = JSON.parse(options.body);
        return {
          ok: true,
          json: async () => ({
            settings: {
              ...parsed,
              experience_level: parsed.experienceLevel,
              subscription_tier: 'pro',
            },
          }),
        };
      }
      return { ok: false, json: async () => ({ error: 'Unexpected call' }) };
    });

    renderSettings();

    await waitFor(() => {
      expect(screen.getByText('Up to date')).toBeInTheDocument();
    });

    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Manage plan/i })).toHaveAttribute('href', '/pricing');
    expect(screen.getByRole('switch', { name: 'Practice reminders' })).toHaveAttribute('aria-checked', 'false');

    // Toggle email notifications off and change language to Hindi
    fireEvent.click(screen.getByRole('switch', { name: 'Email notifications' }));
    fireEvent.change(screen.getByLabelText('Language'), { target: { value: 'hi' } });

    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

    await waitFor(() => {
      expect(screen.getByText('Settings saved successfully.')).toBeInTheDocument();
    });

    const putCall = mockAuthFetch.mock.calls.find(([, opts]) => opts?.method === 'PUT');
    expect(putCall).toBeDefined();
    const sentBody = JSON.parse(putCall[1].body);
    expect(sentBody).toMatchObject({
      emailNotifications: false,
      practiceReminders: false,
      weeklyReport: true,
      language: 'hi',
      codeEditor: 'vscode',
      difficulty: 'hard',
      experienceLevel: 'advanced',
    });
    expect(sentBody.fullName).toBeUndefined();
    expect(localStorage.getItem('app-language')).toBe('hi');
    expect(localStorage.getItem('pg-voice-errors-lang')).toBe('hi');
  });

  it('validates and submits Change Password modal', async () => {
    mockAuthFetch.mockImplementation(async (url, options) => {
      if (!options?.method || options.method === 'GET') {
        return {
          ok: true,
          json: async () => ({
            settings: {
              experience_level: 'intermediate',
              subscription_tier: 'free',
              emailNotifications: true,
              practiceReminders: true,
              weeklyReport: true,
              language: 'en',
              codeEditor: 'vscode',
              difficulty: 'medium',
            },
          }),
        };
      }
      if (url.endsWith('/api/auth/change-password')) {
        return {
          ok: true,
          json: async () => ({ success: true, message: 'Password updated successfully.' }),
        };
      }
      return { ok: false, json: async () => ({ error: 'Error' }) };
    });

    renderSettings();
    await waitFor(() => expect(screen.getByText('Up to date')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /^Change$/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Current Password'), { target: { value: 'OldPass123!' } });
    fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'weak' } });
    fireEvent.change(screen.getByLabelText('Confirm New Password'), { target: { value: 'weak' } });
    fireEvent.click(screen.getByRole('button', { name: 'Update Password' }));

    expect(screen.getByRole('alert')).toHaveTextContent(/New password requirement missing/i);

    fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'StrongPass@2026' } });
    fireEvent.change(screen.getByLabelText('Confirm New Password'), { target: { value: 'StrongPass@2026' } });
    fireEvent.click(screen.getByRole('button', { name: 'Update Password' }));

    await waitFor(() => {
      expect(screen.getByText('Password updated successfully.')).toBeInTheDocument();
    });
  });

  it('requires typing DELETE before deleting account and logs out on success', async () => {
    mockAuthFetch.mockImplementation(async (url, options) => {
      if (!options?.method || options.method === 'GET') {
        return {
          ok: true,
          json: async () => ({
            settings: {
              experience_level: 'beginner',
              subscription_tier: 'free',
            },
          }),
        };
      }
      if (url.endsWith('/api/user/account') && options.method === 'DELETE') {
        return { ok: true, json: async () => ({ success: true }) };
      }
      return { ok: false, json: async () => ({ error: 'Error' }) };
    });

    renderSettings();
    await waitFor(() => expect(screen.getByText('Up to date')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /^Delete$/i }));
    const submitBtn = screen.getByRole('button', { name: /Delete Permanently/i });
    expect(submitBtn).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Type DELETE to confirm'), { target: { value: 'DELETE' } });
    expect(submitBtn).not.toBeDisabled();

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  it('supports discarding unsaved changes and resetting to defaults', async () => {
    mockAuthFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        settings: {
          experience_level: 'advanced',
          subscription_tier: 'free',
          emailNotifications: false,
          practiceReminders: true,
          weeklyReport: true,
          language: 'es',
          codeEditor: 'vim',
          difficulty: 'hard',
        },
      }),
    });

    renderSettings();
    await waitFor(() => expect(screen.getByText('Up to date')).toBeInTheDocument());

    // Change language and discard
    fireEvent.change(screen.getByLabelText('Language'), { target: { value: 'hi' } });
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Discard' }));
    expect(screen.getByLabelText('Language')).toHaveValue('es');
    expect(screen.getByText('Up to date')).toBeInTheDocument();

    // Reset defaults
    fireEvent.click(screen.getByRole('button', { name: /Reset defaults/i }));
    expect(screen.getByLabelText('Language')).toHaveValue('en');
    expect(screen.getByLabelText('Code Editor')).toHaveValue('vscode');
    expect(screen.getByLabelText('Default difficulty')).toHaveValue('medium');
    expect(screen.getByRole('switch', { name: 'Email notifications' })).toHaveAttribute('aria-checked', 'true');
  });
});
