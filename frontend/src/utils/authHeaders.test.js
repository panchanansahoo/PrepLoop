import { describe, expect, it, beforeEach } from 'vitest';
import { buildAuthHeaders, mergeAuthHeaders, resolveAuthToken } from './authHeaders';

describe('buildAuthHeaders', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('prefers user access_token when available', () => {
    const headers = buildAuthHeaders({ access_token: 'user-access-token' });
    expect(headers.Authorization).toBe('Bearer user-access-token');
  });

  it('falls back to localStorage token when user token is missing', () => {
    localStorage.setItem('token', 'local-token');
    const headers = buildAuthHeaders(null);
    expect(headers.Authorization).toBe('Bearer local-token');
  });

  it('falls back to auth_token storage keys for legacy compatibility', () => {
    sessionStorage.setItem('auth_token', 'legacy-auth-token');
    const headers = buildAuthHeaders(undefined);
    expect(headers.Authorization).toBe('Bearer legacy-auth-token');
  });

  it('returns only content type when no token is available', () => {
    const headers = buildAuthHeaders({});
    expect(headers).toEqual({ 'Content-Type': 'application/json' });
  });

  it('resolves auth token using storage fallback even when user has no token fields', () => {
    localStorage.setItem('token', 'stored-token');
    expect(resolveAuthToken({ id: 'u-1', email: 'demo@example.com' })).toBe('stored-token');
  });

  it('merges Headers input and injects Authorization from token storage', () => {
    sessionStorage.setItem('token', 'session-token');

    const baseHeaders = new Headers({
      'X-Feature-Source': 'ai-interview',
      'Content-Type': 'application/json',
    });

    const merged = mergeAuthHeaders(baseHeaders, { id: 'u-2' });

    expect(merged['x-feature-source']).toBe('ai-interview');
    expect(merged.Authorization).toBe('Bearer session-token');
  });

  it('does not overwrite an existing authorization header', () => {
    localStorage.setItem('token', 'local-token');

    const merged = mergeAuthHeaders({ authorization: 'Bearer already-set' }, null);

    expect(merged.authorization).toBe('Bearer already-set');
    expect(merged.Authorization).toBeUndefined();
  });
});
