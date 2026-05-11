import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const SAFE_METHODS = new Set(['get', 'head', 'options']);
const CSRF_TOKEN_CACHE_KEY = 'preploop_csrf_token';
let csrfTokenPromise = null;

const isInvalidToken403 = (error) => {
  const status = error?.response?.status;
  if (status !== 403) return false;

  const code = String(error?.response?.data?.code || '').toUpperCase();
  const message = String(error?.response?.data?.error || error?.response?.data?.message || '').toLowerCase();

  return code === 'INVALID_TOKEN' || message.includes('invalid or expired token');
};

const isCsrfError = (error) => {
  const status = error?.response?.status;
  if (status !== 403) return false;

  const code = String(error?.response?.data?.code || '').toUpperCase();
  const message = String(error?.response?.data?.error || error?.response?.data?.message || '').toLowerCase();

  return code === 'EBADCSRFTOKEN' || message.includes('csrf');
};

const getCachedCsrfToken = () => {
  try {
    return localStorage.getItem(CSRF_TOKEN_CACHE_KEY);
  } catch {
    return null;
  }
};

const setCachedCsrfToken = (token) => {
  try {
    if (token) {
      localStorage.setItem(CSRF_TOKEN_CACHE_KEY, token);
    }
  } catch {
    // Ignore storage failures and fall back to in-memory token usage.
  }
};

const clearCachedCsrfToken = () => {
  try {
    localStorage.removeItem(CSRF_TOKEN_CACHE_KEY);
  } catch {
    // Ignore storage failures.
  }
};

const fetchCsrfToken = async () => {
  if (csrfTokenPromise) return csrfTokenPromise;

  csrfTokenPromise = apiClient.get('/api/auth/csrf-token', {
    headers: { Authorization: undefined },
    skipCsrf: true,
    retry: { count: 0, maxRetries: 0 },
  }).then((response) => {
    const token = response?.data?.csrfToken || null;
    if (!token) {
      throw new Error('CSRF token unavailable');
    }

    setCachedCsrfToken(token);
    return token;
  }).finally(() => {
    csrfTokenPromise = null;
  });

  return csrfTokenPromise;
};

apiClient.interceptors.request.use(
  async (config) => {
    const method = String(config.method || 'get').toLowerCase();
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (!SAFE_METHODS.has(method) && !config.skipCsrf) {
      let csrfToken = getCachedCsrfToken();
      if (!csrfToken) {
        csrfToken = await fetchCsrfToken();
      }

      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    
    if (!config) return Promise.reject(error);
    if (!config.retry) {
      config.retry = { count: 0, maxRetries: 3 };
    }

    const shouldRetry = 
      error.response?.status >= 500 || 
      error.code === 'ECONNABORTED' ||
      error.code === 'ERR_NETWORK';

    if (shouldRetry && config.retry.count < config.retry.maxRetries) {
      config.retry.count++;
      const delay = Math.min(1000 * Math.pow(2, config.retry.count), 10000);
      await sleep(delay);
      return apiClient(config);
    }

    if (isCsrfError(error) && config && !config._csrfRetry) {
      clearCachedCsrfToken();
      config._csrfRetry = true;
      const csrfToken = await fetchCsrfToken().catch(() => null);
      if (csrfToken) {
        config.headers = config.headers || {};
        config.headers['X-CSRF-Token'] = csrfToken;
        return apiClient(config);
      }
    }

    if (error.response?.status === 401 || isInvalidToken403(error)) {
      const hadToken = localStorage.getItem('token');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      // Only redirect if user was previously logged in (not guest preview)
      if (hadToken) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
