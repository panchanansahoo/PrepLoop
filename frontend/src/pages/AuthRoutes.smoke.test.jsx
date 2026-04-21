import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Signup from './Signup';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import VerifyEmail from './VerifyEmail';
import VerifyEmailPage from './VerifyEmailPage';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    login: vi.fn(),
    loginWithGoogle: vi.fn(),
    loginWithGithub: vi.fn(),
    loginWithLinkedin: vi.fn(),
  }),
}));

describe('Auth Routes - Smoke Tests (Undefined Symbol Detection)', () => {
  it('renders signup page without runtime reference errors', () => {
    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /Create your account/i })).toBeInTheDocument();
  });

  it('renders forgot password page without runtime reference errors', () => {
    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /Reset your password/i })).toBeInTheDocument();
  });

  it('renders reset password page without runtime reference errors', () => {
    render(
      <MemoryRouter>
        <ResetPassword />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /Set new password/i })).toBeInTheDocument();
  });

  it('renders verify email page without runtime reference errors', () => {
    render(
      <MemoryRouter initialEntries={["/verify-email?email=test@example.com"]}>
        <VerifyEmail />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /Check Your Email/i })).toBeInTheDocument();
  });

  it('renders verify-email callback page without runtime reference errors', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Invalid verification link' }),
    });

    render(
      <MemoryRouter initialEntries={["/verify-email?token=bad&email=test@example.com"]}>
        <VerifyEmailPage />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: /Verification Failed/i })).toBeInTheDocument();
    fetchMock.mockRestore();
  });
});
