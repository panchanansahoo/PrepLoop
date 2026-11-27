import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React, { useState } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import apiClient from '../utils/apiClient';
import { authFetch } from '../utils/authFetch';
import {
  getAccountStorageKey,
  readInterviewHistory,
  updateInterviewHistory,
} from '../utils/accountStorage';

vi.mock('../lib/supabase', () => ({ supabase: null }));
vi.mock('../utils/apiClient', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));
vi.mock('../utils/authFetch', () => ({ authFetch: vi.fn() }));

function Harness() {
  const { user, login, signup, refreshSubscription } = useAuth();
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
        onClick={() =>
          run(() =>
            signup(' NEW@Example.com ', 'SignupTest123!', ' New User ')
          )
        }
      >
        signup
      </button>
      <button
        type="button"
        onClick={() =>
          refreshSubscription()
            .then(() => setResult('refreshed'))
            .catch((error) => setResult(`error:${error.message}`))
        }
      >
        refreshSubscription
      </button>
      <div data-testid="tier">{user?.subscriptionTier || 'none'}</div>
      <div data-testid="result">{result}</div>
    </>
  );
}

describe('AuthContext auth flows', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
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

  it('strips access_token and token from user object before persisting to localStorage (E6)', async () => {
    apiClient.post.mockResolvedValueOnce({
      token: 'jwt-header-token',
      user: { id: 'user-3', email: 'strip@example.com', access_token: 'secret-token', token: 'inner-token' },
    });

    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>
    );

    fireEvent.click(await screen.findByRole('button', { name: 'login' }));

    await waitFor(() => {
      expect(screen.getByTestId('result')).toHaveTextContent('strip@example.com:jwt-header-token');
    });

    expect(localStorage.getItem('token')).toBe('jwt-header-token');
    const storedUser = JSON.parse(localStorage.getItem('user'));
    expect(storedUser.email).toBe('strip@example.com');
    expect(storedUser.access_token).toBeUndefined();
    expect(storedUser.token).toBeUndefined();
  });

  it('renders children immediately without full-screen loading blocker', () => {
    function Child() {
      const { loading } = useAuth();
      return <div data-testid="child-mounted">Ready: {String(!loading)}</div>;
    }

    render(
      <AuthProvider>
        <Child />
      </AuthProvider>
    );

    // Child should be mounted immediately in the DOM without waiting for network
    expect(screen.getByTestId('child-mounted')).toBeInTheDocument();
  });

  it('refreshes subscriptionTier in state and persists it to localStorage', async () => {
    localStorage.setItem('token', 'token-sub');
    localStorage.setItem(
      'user',
      JSON.stringify({ id: 'user-sub', email: 'sub@example.com', subscriptionTier: 'free', access_token: 'leak' })
    );
    authFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: { id: 'user-sub', subscriptionTier: 'pro' },
      }),
    });

    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>
    );

    expect(screen.getByTestId('tier')).toHaveTextContent('free');
    fireEvent.click(screen.getByRole('button', { name: 'refreshSubscription' }));

    await waitFor(() => {
      expect(screen.getByTestId('tier')).toHaveTextContent('pro');
    });

    expect(authFetch).toHaveBeenCalledWith('/api/user/profile');
    const persisted = JSON.parse(localStorage.getItem('user'));
    expect(persisted.subscriptionTier).toBe('pro');
    expect(persisted.subscription_tier).toBe('pro');
    expect(persisted.access_token).toBeUndefined();
  });

  it('clears account-scoped interview history, code drafts, and notes caches on logout', async () => {
    localStorage.setItem('token', 'tok-a');
    localStorage.setItem('user', JSON.stringify({ id: 'user-a', email: 'a@example.com' }));
    updateInterviewHistory('user-a', () => [{ id: 'sess-a' }]);
    localStorage.setItem(getAccountStorageKey('sql-code-1', 'user-a'), 'SELECT 1;');
    localStorage.setItem(getAccountStorageKey('dsa-code-1-python', 'user-a'), 'def s(): pass');
    localStorage.setItem(getAccountStorageKey('notes', 'user-a'), '[{"id":99}]');
    localStorage.setItem('preploop_local_interview_history', '[{"id":"legacy"}]');
    localStorage.setItem('preploop_bookmarks', '[{"id":"legacy-bm"}]');
    authFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    function LogoutButton() {
      const { logout } = useAuth();
      return <button type="button" onClick={logout}>logout</button>;
    }

    render(
      <AuthProvider>
        <LogoutButton />
      </AuthProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'logout' }));

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBeNull();
    });
    expect(readInterviewHistory('user-a')).toEqual([]);
    expect(localStorage.getItem(getAccountStorageKey('sql-code-1', 'user-a'))).toBeNull();
    expect(localStorage.getItem(getAccountStorageKey('dsa-code-1-python', 'user-a'))).toBeNull();
    expect(localStorage.getItem(getAccountStorageKey('notes', 'user-a'))).toBeNull();
    expect(localStorage.getItem('preploop_local_interview_history')).toBeNull();
    expect(localStorage.getItem('preploop_bookmarks')).toBeNull();
  });
});
