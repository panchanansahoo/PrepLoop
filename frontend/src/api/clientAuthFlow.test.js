// @ts-nocheck
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

vi.mock('axios', () => {
  const createInstance = () => {
    const instance = vi.fn((config) => Promise.resolve({ data: { success: true }, config }));
    instance.interceptors = {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    };
    instance.defaults = { headers: { common: {} }, baseURL: 'http://localhost:5000' };
    instance.post = vi.fn();
    instance.get = vi.fn(() => Promise.resolve({ data: { csrfToken: 'test-csrf' } }));
    return instance;
  };
  return {
    default: {
      create: vi.fn(createInstance),
      post: vi.fn(),
      get: vi.fn(() => Promise.resolve({ data: { csrfToken: 'test-csrf' } })),
    },
    __esModule: true,
  };
});

import apiClient from './client';

const requestInterceptor = apiClient.interceptors.request.use.mock.calls[0]?.[0];
const responseInterceptor = apiClient.interceptors.response.use.mock.calls[0]?.[1];

describe('API Client Auth Flow', () => {
  let originalLocalStorage;
  let storageMap;

  beforeEach(() => {
    storageMap = new Map();
    originalLocalStorage = globalThis.localStorage;
    globalThis.localStorage = {
      length: 0,
      clear: vi.fn(() => storageMap.clear()),
      key: vi.fn((idx) => Array.from(storageMap.keys())[idx] || null),
      getItem: vi.fn((key) => storageMap.get(key) || null),
      setItem: vi.fn((key, value) => storageMap.set(key, value)),
      removeItem: vi.fn((key) => storageMap.delete(key)),
    };
    vi.clearAllMocks();
    axios.get.mockResolvedValue({ data: { csrfToken: 'test-csrf' } });
  });

  afterEach(() => {
    globalThis.localStorage = originalLocalStorage;
    vi.restoreAllMocks();
  });

  it('attaches Bearer token to request headers when token exists', async () => {
    storageMap.set('token', 'test-access-token');

    const config = { headers: {}, method: 'get', url: '/api/test' };
    const result = await requestInterceptor(config);

    expect(result.headers.Authorization).toBe('Bearer test-access-token');
  });

  it('generates an X-Request-ID header when crypto.randomUUID is available', async () => {
    const config = { headers: {}, method: 'get', url: '/api/test' };
    const result = await requestInterceptor(config);

    expect(result.headers['X-Request-ID']).toBeDefined();
    expect(result.headers['X-Request-ID']).toMatch(/^\d+-[a-zA-Z0-9-]+$/);
  });

  it('generates an X-Request-ID header safely in non-secure contexts where crypto.randomUUID is undefined', async () => {
    const originalCrypto = globalThis.crypto;
    try {
      // @ts-ignore
      delete globalThis.crypto;
      const config = { headers: {}, method: 'get', url: '/api/test' };
      const result = await requestInterceptor(config);

      expect(result.headers['X-Request-ID']).toBeDefined();
      expect(result.headers['X-Request-ID']).toMatch(/^\d+-[a-zA-Z0-9]+$/);
    } finally {
      globalThis.crypto = originalCrypto;
    }
  });

  it('does not attach Authorization header when no token exists', async () => {
    const config = { headers: {}, method: 'get', url: '/api/test' };
    const result = await requestInterceptor(config);

    expect(result.headers.Authorization).toBeUndefined();
  });

  it('refreshes token on 401 and retries the original request', async () => {
    storageMap.set('token', 'old-token');
    storageMap.set('refreshToken', 'old-refresh-token');

    axios.post.mockResolvedValue({ data: { token: 'new-token' } });

    const error = {
      response: { status: 401, data: { message: 'Token expired' } },
      config: {
        url: '/api/profile',
        method: 'get',
        headers: {},
        _retry: undefined,
        skipAuthRefresh: undefined,
      },
    };

    await responseInterceptor(error);

    expect(axios.post).toHaveBeenCalledWith(
      'http://localhost:5000/api/auth/refresh',
      { refreshToken: 'old-refresh-token' },
      expect.objectContaining({ withCredentials: true })
    );
    expect(storageMap.get('token')).toBe('new-token');
  });

  it('shares a single refresh across concurrent 401 requests', async () => {
    storageMap.set('token', 'old-token');
    storageMap.set('refreshToken', 'old-refresh-token');

    axios.post.mockResolvedValue({ data: { token: 'shared-token' } });

    const error1 = {
      response: { status: 401 },
      config: {
        url: '/api/a',
        method: 'get',
        headers: {},
        _retry: undefined,
        skipAuthRefresh: undefined,
      },
    };
    const error2 = {
      response: { status: 401 },
      config: {
        url: '/api/b',
        method: 'get',
        headers: {},
        _retry: undefined,
        skipAuthRefresh: undefined,
      },
    };

    // Fire both requests concurrently (without awaiting the first)
    const promise1 = responseInterceptor(error1);
    const promise2 = responseInterceptor(error2);
    await Promise.all([promise1, promise2]);

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(storageMap.get('token')).toBe('shared-token');
  });

  it('clears token when refresh fails', async () => {
    storageMap.set('token', 'old-token');
    storageMap.set('refreshToken', 'old-refresh-token');

    axios.post.mockRejectedValue(new Error('Refresh failed'));

    const error = {
      response: { status: 401 },
      config: {
        url: '/api/test',
        method: 'get',
        headers: {},
        _retry: undefined,
        skipAuthRefresh: undefined,
      },
    };

    await expect(responseInterceptor(error)).rejects.toThrow('Refresh failed');
    expect(storageMap.get('token')).toBeUndefined();
    expect(storageMap.get('refreshToken')).toBeUndefined();
  });

  it('does not retry on 401 when skipAuthRefresh is set', async () => {
    const error = {
      response: { status: 401 },
      config: {
        url: '/api/public-endpoint',
        method: 'get',
        headers: {},
        _retry: undefined,
        skipAuthRefresh: true,
      },
    };

    await expect(responseInterceptor(error)).rejects.toBe(error);
  });

  it('retries 429 with backoff', async () => {
    const error = {
      response: {
        status: 429,
        headers: { 'retry-after': '1' },
        data: { message: 'Too many requests' },
      },
      config: {
        url: '/api/test',
        method: 'get',
        headers: {},
        _retry: undefined,
        skipRetry: undefined,
      },
    };

    let called = false;
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout').mockImplementation((fn) => {
      called = true;
      if (typeof fn === 'function') {
        fn();
      }
      return 1;
    });

    try {
      await responseInterceptor(error);
      expect(called).toBe(true);
    } finally {
      setTimeoutSpy.mockRestore();
    }
  });
});
