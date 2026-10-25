/* @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../lib/supabase', () => ({ supabase: null }));

import { authFetch } from './authFetch';

describe('authFetch', () => {
  beforeEach(() => {
    vi.useRealTimers();
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not fetch a CSRF token for GET requests', async () => {
    globalThis.fetch.mockResolvedValue({ status: 200, ok: true });

    const response = await authFetch('/api/thing');

    expect(response.status).toBe(200);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(globalThis.fetch.mock.calls[0][0]).toBe('/api/thing');
  });

  it('injects the CSRF token for mutating requests', async () => {
    globalThis.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ csrfToken: 'csrf-123' }),
      })
      .mockResolvedValueOnce({ status: 200, ok: true });

    await authFetch('/api/thing', { method: 'POST', body: '{}' });

    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    expect(globalThis.fetch.mock.calls[1][1].headers['X-CSRF-Token']).toBe('csrf-123');
  });

  it('aborts a request that exceeds the timeout', async () => {
    globalThis.fetch.mockImplementation((url, init) => new Promise((_, reject) => {
      const abort = () => {
        const error = new Error('Aborted');
        error.name = 'AbortError';
        reject(error);
      };
      if (init?.signal?.aborted) abort();
      else init?.signal?.addEventListener('abort', abort);
    }));

    await expect(
      authFetch('/api/slow', { method: 'GET', timeoutMs: 10 }),
    ).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('leaves timeout handling to callers that pass a signal', async () => {
    const controller = new AbortController();
    globalThis.fetch.mockResolvedValue({ status: 200, ok: true });

    await authFetch('/api/thing', { signal: controller.signal, timeoutMs: 1 });

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(globalThis.fetch.mock.calls[0][1].signal).toBe(controller.signal);
  });
});
