import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import apiClient from '../utils/apiClient';

vi.mock('../lib/supabase', () => ({ supabase: null }));
vi.mock('../utils/apiClient', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));
vi.mock('../utils/authFetch', () => ({ authFetch: vi.fn() }));

function Harness() {
  const { login, signup } = useAuth();
  const [result, setResult] = useState('idle');

  const run = async (action) => {
    setResult('loading');
    try {
      const user = await action();
      setResult(`${user?.email || 'none'}:${localStorage.getItem('token') || 'no-token'}`);
    } catch (error) {
      setResult(`error:${error.message}`);
    }
  };

  return (
    <>
      <button type="button" onClick={() => run(() => login('  USER@Example.com ', 'secret'))}>
        login
      </button>
      <button
        type="button"
        onClick={() => run(() => signup(' New@Example.com ', 'SignupTest123!', ' New User '))}
      >
        signup
      </button>
      <div data-testid="result">{result}</div>
    </>
  );
}

describe('AuthContext auth flows', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('logs in with a normalized email and stores the bare API payload', async () => {
    apiClient.post.mockResolvedValueOnce({
      token: 'token-1',
      user: { id: 'user-1', email: 'user@example.com' },
    });

    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>
    );

    fireEvent.click(await screen.findByRole('button', { name: 'login' }));

    await waitFor(() => {
      expect(screen.getByTestId('result')).toHaveTextContent('user@example.com:token-1');
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      '/api/auth/login',
      { email: 'user@example.com', password: 'secret' },
      { skipAuthRefresh: true, skipRetry: true }
    );
    expect(JSON.parse(localStorage.getItem('user'))).toMatchObject({ email: 'user@example.com' });
  });

  it('normalizes signup fields and does not treat a missing token as an error', async () => {
    apiClient.post.mockResolvedValueOnce({
      message: 'User created successfully.',
      user: { id: 'user-2', email: 'new@example.com', emailVerified: true },
    });

    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>
    );

    fireEvent.click(await screen.findByRole('button', { name: 'signup' }));

    await waitFor(() => {
      expect(screen.getByTestId('result')).toHaveTextContent('new@example.com:no-token');
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      '/api/auth/signup',
      { email: 'new@example.com', password: 'SignupTest123!', fullName: 'New User' },
      { skipAuthRefresh: true, skipRetry: true }
    );
    expect(localStorage.getItem('token')).toBeNull();
  });
});
