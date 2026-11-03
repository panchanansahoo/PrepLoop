import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// CSRF token handling (double-submit pattern for cookie-authenticated mutations)
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
let csrfTokenCache = null;
let csrfTokenRequest = null;

function readCsrfCookie() {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)__csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function getCsrfToken(forceRefresh = false) {
  if (!forceRefresh) {
    const cookieToken = readCsrfCookie();
    if (cookieToken) return cookieToken;
    if (csrfTokenCache) return csrfTokenCache;
  }

  if (!csrfTokenRequest) {
    csrfTokenRequest = axios
      .get(`${apiClient.defaults.baseURL}/api/csrf-token`, { withCredentials: true })
      .then((response) => {
        csrfTokenCache = response.data?.csrfToken || null;
        return csrfTokenCache;
      })
      .catch(() => null)
      .finally(() => {
        csrfTokenRequest = null;
      });
  }

  return csrfTokenRequest;
}

// Token refresh queue (single in-flight refresh, waiters resolved/rejected together)
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

apiClient.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Cookie-authenticated mutations need the double-submit CSRF header.
    const method = String(config.method || 'get').toUpperCase();
    if (!SAFE_METHODS.has(method)) {
      let csrfToken = await getCsrfToken();
      if (!csrfToken) {
        csrfToken = await getCsrfToken(true);
      }
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
      config.headers['X-Requested-With'] = 'XMLHttpRequest';
    }

    // Add request ID for tracing
    config.headers['X-Request-ID'] = `${Date.now()}-${crypto.randomUUID()}`;

    return config;
  },
  (error) => Promise.reject(error)
);

  apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Handle network errors with bounded retry
    if (!error.response && !originalRequest._networkRetry && !originalRequest.skipRetry) {
      originalRequest._networkRetryCount = (originalRequest._networkRetryCount || 0) + 1;
      originalRequest._retry = true;

      if (originalRequest._networkRetryCount <= 3) {
        await sleep(1000 * originalRequest._networkRetryCount);
        return apiClient(originalRequest);
      }
      originalRequest._networkRetry = true;
    }

    // Handle 401 Unauthorized - Token refresh (single in-flight refresh)
    if (error.response?.status === 401 && !originalRequest._authRefresh && !originalRequest.skipAuthRefresh) {
      originalRequest._authRefresh = true;
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const csrfToken = await getCsrfToken();
        const response = await axios.post(
          `${apiClient.defaults.baseURL}/api/auth/refresh`,
          refreshToken ? { refreshToken } : {},
          {
            withCredentials: true,
            headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : {},
          }
        );

        const { token } = response.data;
        localStorage.setItem('token', token);

        apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
        originalRequest.headers.Authorization = `Bearer ${token}`;

        processQueue(null, token);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle a stale/missing CSRF token: refresh it and replay once.
    const csrfErrorCode = error.response?.data?.code;
    if (
      error.response?.status === 403 &&
      typeof csrfErrorCode === 'string' &&
      csrfErrorCode.startsWith('CSRF_') &&
      !originalRequest._csrfRetry
    ) {
      originalRequest._csrfRetry = true;
      originalRequest._retry = true;
      csrfTokenCache = null;
      const csrfToken = await getCsrfToken(true);
      if (csrfToken) {
        originalRequest.headers['X-CSRF-Token'] = csrfToken;
        return apiClient(originalRequest);
      }
    }

    // Handle 429 Too Many Requests - Retry with backoff (bounded to 1 attempt)
    if (error.response?.status === 429 && !originalRequest._rateLimitRetry && !originalRequest.skipRetry) {
      originalRequest._rateLimitRetry = true;
      originalRequest._retry = true;
      const retryAfter = Number(error.response.headers?.['retry-after']) || 1;
      await sleep(retryAfter * 1000);
      return apiClient(originalRequest);
    }

    // Handle 503 Service Unavailable - Retry (bounded to 1 attempt)
    if (error.response?.status === 503 && !originalRequest._serverUnavailableRetry && !originalRequest.skipRetry) {
      originalRequest._serverUnavailableRetry = true;
      originalRequest._retry = true;
      await sleep(2000);
      return apiClient(originalRequest);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
