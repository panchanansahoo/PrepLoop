import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Signup from './Signup';
import ForgotPassword from './ForgotPassword';
import apiClient from '../utils/apiClient';

const { signupMock } = vi.hoisted(() => ({ signupMock: vi.fn() }));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    login: vi.fn(),
    signup: signupMock,
    loginWithGoogle: vi.fn(),
    loginWithGithub: vi.fn(),
    loginWithLinkedin: vi.fn(),
  }),
}));

vi.mock('../utils/apiClient', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

function renderSignup() {
  return render(
    <MemoryRouter initialEntries={['/signup']}>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<div>LOGIN ROUTE</div>} />
        <Route path="/check-email" element={<div>CHECK EMAIL ROUTE</div>} />
      </Routes>
    </MemoryRouter>
  );
}

function fillSignup({ password, confirmPassword }) {
  fireEvent.change(screen.getByLabelText('Full Name'), {
    target: { value: 'New User' },
  });
  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: ' New@Example.com ' },
  });
  fireEvent.change(screen.getByLabelText('Password'), {
    target: { value: password },
  });
  fireEvent.change(screen.getByLabelText('Confirm Password'), {
    target: { value: confirmPassword },
  });
}

describe('Signup page validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('blocks passwords that miss backend requirements', async () => {
    renderSignup();
    fillSignup({ password: 'password', confirmPassword: 'password' });

    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Password must include: one uppercase letter'
    );
    expect(signupMock).not.toHaveBeenCalled();
  });

  it('blocks mismatched password confirmation', async () => {
    renderSignup();
    fillSignup({ password: 'SignupTest123!', confirmPassword: 'Different123!' });

    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Passwords do not match');
    expect(signupMock).not.toHaveBeenCalled();
  });

  it('creates the account and navigates to login', async () => {
    signupMock.mockResolvedValueOnce({
      id: 'user-1',
      email: 'new@example.com',
      emailVerified: true,
    });

    renderSignup();
    fillSignup({ password: 'SignupTest123!', confirmPassword: 'SignupTest123!' });

    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    expect(await screen.findByText('LOGIN ROUTE')).toBeInTheDocument();
    expect(signupMock).toHaveBeenCalledWith('New@Example.com', 'SignupTest123!', 'New User');
  });
});

describe('Forgot password page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends a reset request and allows trying another email', async () => {
    apiClient.post.mockResolvedValueOnce({
      message: 'If an account with that email exists, a password reset link has been sent.',
      emailSent: true,
    });

    render(
      <MemoryRouter initialEntries={['/forgot-password']}>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/login" element={<div>LOGIN ROUTE</div>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: ' User@Example.com ' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Send Reset Link/i }));

    expect(await screen.findByText('Check your inbox!')).toBeInTheDocument();
    expect(apiClient.post).toHaveBeenCalledWith(
      '/api/auth/forgot-password',
      { email: 'user@example.com' },
      { skipAuthRefresh: true, skipRetry: true }
    );

    fireEvent.click(screen.getByRole('button', { name: 'Use a different email' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Send Reset Link/i })).toBeInTheDocument();
    });
  });

  it('shows the reset link in development when email delivery is unavailable', async () => {
    apiClient.post.mockResolvedValueOnce({
      message: 'If an account with that email exists, a password reset link has been sent.',
      emailSent: false,
      devResetLink: 'http://localhost:5173/reset-password#access_token=test-token',
    });

    render(
      <MemoryRouter initialEntries={['/forgot-password']}>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Send Reset Link/i }));

    expect(await screen.findByText('Password reset link ready!')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Set New Password Now/i })).toHaveAttribute(
      'href',
      'http://localhost:5173/reset-password#access_token=test-token'
    );
  });
});
