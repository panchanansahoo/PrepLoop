import { supabase } from '../lib/supabase';
import { buildAuthHeaders } from './authHeaders';

const DEFAULT_TIMEOUT_MS = 90_000;
const CSRF_TIMEOUT_MS = 5_000;

async function fetchWithTimeout(url, init, timeoutMs) {
  // Callers that manage their own AbortController keep full control.
  if (!timeoutMs || init?.signal) return fetch(url, init);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

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
 *         — requests time out after 90s by default; pass `timeoutMs` to override
 *           (or `0` to disable, or your own `signal` to manage it yourself).
 */
export async function authFetch(url, options = {}) {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    ...fetchOptions
  } = options;
  const method = String(fetchOptions.method || 'GET').toUpperCase();
  let csrfToken = null;
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    try {
      const csrfResponse = await fetchWithTimeout(
        '/api/csrf-token',
        { credentials: 'include' },
        Math.min(CSRF_TIMEOUT_MS, timeoutMs || CSRF_TIMEOUT_MS),
      );
      if (csrfResponse.ok) csrfToken = (await csrfResponse.json()).csrfToken;
    } catch {
      // Bearer-token requests remain valid without CSRF; cookie requests fail explicitly at the API.
    }
  }
  // Merge caller-provided headers on top of the default auth headers.
  const headers = {
    ...buildAuthHeaders(),
    ...(fetchOptions.headers || {}),
  };
  if (csrfToken) headers['X-CSRF-Token'] = csrfToken;
  if (typeof FormData !== 'undefined' && fetchOptions.body instanceof FormData) {
    delete headers['Content-Type'];
    delete headers['content-type'];
  }

  const response = await fetchWithTimeout(
    url,
    { ...fetchOptions, credentials: 'include', headers },
    timeoutMs,
  );

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

    return fetchWithTimeout(
      url,
      { ...fetchOptions, credentials: 'include', headers: retryHeaders },
      timeoutMs,
    );
  } catch {
    // Refresh threw — return the original 401 response.
    return response;
  }
}
