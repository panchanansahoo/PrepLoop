import React from 'react';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Signup from './Signup';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
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

  it('detects 502/504 gateway errors and displays waking up message with Try Again button', async () => {
    signupMock.mockRejectedValueOnce({
      response: { status: 502 },
    });

    renderSignup();
    fillSignup({ password: 'SignupTest123!', confirmPassword: 'SignupTest123!' });

    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Our server is currently waking up. Please wait a few moments and click Try Again.'
    );
    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
  });

  it('shows duplicate email notice with interactive link to Sign In for EMAIL_ALREADY_EXISTS', async () => {
    signupMock.mockRejectedValueOnce({
      response: {
        status: 400,
        data: {
          code: 'EMAIL_ALREADY_EXISTS',
          error: 'An account with this email already exists.',
        },
      },
    });

    renderSignup();
    fillSignup({ password: 'SignupTest123!', confirmPassword: 'SignupTest123!' });

    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'An account with this email already exists. Would you like to Sign In instead?'
    );

    const signInLink = screen.getByRole('link', { name: 'Sign In' });
    expect(signInLink).toBeInTheDocument();
    fireEvent.click(signInLink);
    expect(await screen.findByText('LOGIN ROUTE')).toBeInTheDocument();
  });

  it('detects CapsLock toggling on password inputs with clean warning badge', () => {
    renderSignup();

    const passwordInput = screen.getByLabelText('Password');
    const confirmInput = screen.getByLabelText('Confirm Password');

    expect(screen.queryByText('Caps Lock is on')).not.toBeInTheDocument();

    fireEvent.keyDown(passwordInput, { key: 'CapsLock', modifierCapsLock: true });
    expect(screen.getByText('Caps Lock is on')).toBeInTheDocument();

    fireEvent.keyUp(passwordInput, { key: 'CapsLock', modifierCapsLock: false });
    expect(screen.queryByText('Caps Lock is on')).not.toBeInTheDocument();

    fireEvent.keyDown(confirmInput, { key: 'CapsLock', modifierCapsLock: true });
    expect(screen.getByText('Caps Lock is on')).toBeInTheDocument();

    fireEvent.keyUp(confirmInput, { key: 'CapsLock', modifierCapsLock: false });
    expect(screen.queryByText('Caps Lock is on')).not.toBeInTheDocument();
  });

  it('handles ECONNABORTED timeout with waking up message and Try Again button', async () => {
    const timeoutErr = new Error('Sign-up timed out. Our server may be waking up—please check your connection and click Try Again.');
    timeoutErr.code = 'ECONNABORTED';
    signupMock.mockRejectedValueOnce(timeoutErr);

    renderSignup();
    fillSignup({ password: 'SignupTest123!', confirmPassword: 'SignupTest123!' });

    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to connect to PrepLoop. Our server may be waking up—please check your connection and click Try Again.'
    );
    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
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

  it('never renders a recovery link returned in the API payload (uniform inbox guidance)', async () => {
    apiClient.post.mockResolvedValueOnce({
      message: 'If an account with that email exists, a password reset link has been sent.',
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

    expect(await screen.findByText('Check your inbox!')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Set New Password Now/i })).not.toBeInTheDocument();
  });
  it('displays actionable error message when password recovery email service returns 503', async () => {
    apiClient.post.mockRejectedValueOnce({
      response: {
        status: 503,
        data: {
          error: 'Password reset email is temporarily unavailable. Please try again later.',
          code: 'EMAIL_SERVICE_UNAVAILABLE',
        },
      },
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

    expect(await screen.findByText(/temporarily unavailable/i)).toBeInTheDocument();
  });

  it('renders expired reset link guidance with navigation back to forgot-password', async () => {
    delete window.location;
    window.location = new URL('http://localhost:5173/reset-password#error=access_denied&error_description=Email+link+is+invalid+or+has+expired');

    render(
      <MemoryRouter initialEntries={['/reset-password']}>
        <Routes>
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/forgot-password" element={<div>FORGOT PASSWORD PAGE</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText(/expired or has already been used/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Request a new password reset link/i })).toBeInTheDocument();
  });
});
