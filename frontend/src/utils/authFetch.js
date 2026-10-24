import { supabase } from '../lib/supabase';
import { buildAuthHeaders } from './authHeaders';

/**
 * Fetch wrapper with automatic Supabase token refresh on 401.
 *
 * The axios interceptor in AuthContext handles token refresh for axios calls,
 * but many components (DSACodeEditor, CodingPlayground, TestCasePanel) use
 * raw fetch(). This utility provides the same silent-refresh behaviour for
 * fetch()-based API calls.
 *
 * Usage:  const res = await authFetch(url, { method: 'POST', body: ... });
 *         — headers (Content-Type + Authorization) are injected automatically.
 *         — on 401 the Supabase session is refreshed and the request retried once.
 */
export async function authFetch(url, options = {}) {
  const method = String(options.method || 'GET').toUpperCase();
  let csrfToken = null;
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    try {
      const csrfResponse = await fetch('/api/csrf-token', { credentials: 'include' });
      if (csrfResponse.ok) csrfToken = (await csrfResponse.json()).csrfToken;
    } catch {
      // Bearer-token requests remain valid without CSRF; cookie requests fail explicitly at the API.
    }
  }
  // Merge caller-provided headers on top of the default auth headers.
  const headers = {
    ...buildAuthHeaders(),
    ...(options.headers || {}),
  };
  if (csrfToken) headers['X-CSRF-Token'] = csrfToken;
  if (typeof FormData !== 'undefined' && options.body instanceof FormData) {
    delete headers['Content-Type'];
    delete headers['content-type'];
  }

  const response = await fetch(url, { ...options, credentials: 'include', headers });

  // If not a 401, return as-is (including 403 — that means genuine permission denial).
  if (response.status !== 401) {
    return response;
  }

  // No Supabase client configured — cannot refresh.
  if (!supabase) {
    return response;
  }

  // Attempt silent token refresh.
  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (error || !data?.session) {
      return response; // Refresh failed — return original 401.
    }

    // Keep the access token for legacy header-based callers. The refresh token
    // remains in the HttpOnly cookie issued by the backend.
    const newToken = data.session.access_token;
    localStorage.setItem('token', newToken);

    // Retry the original request with the fresh token.
    const retryHeaders = {
      ...headers,
      Authorization: `Bearer ${newToken}`,
    };

    return fetch(url, { ...options, credentials: 'include', headers: retryHeaders });
  } catch {
    // Refresh threw — return the original 401 response.
    return response;
  }
}
