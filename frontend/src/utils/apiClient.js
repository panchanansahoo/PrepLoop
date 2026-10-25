import axios from 'axios';
import { API_URL } from '../config/api.js';

/**
 * Create axios instance with default config
 */
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

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
    // Prefer the cookie because other clients (authFetch) rotate it.
    const cookieToken = readCsrfCookie();
    if (cookieToken) return cookieToken;
    if (csrfTokenCache) return csrfTokenCache;
  }

  if (!csrfTokenRequest) {
    csrfTokenRequest = axios
      .get(`${API_URL}/api/csrf-token`, { withCredentials: true })
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

/**
 * Request interceptor - Add auth token and CSRF header
 */
apiClient.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Cookie-authenticated mutations need the double-submit CSRF header.
    const method = String(config.method || 'get').toUpperCase();
    if (!SAFE_METHODS.has(method)) {
      const csrfToken = await getCsrfToken();
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
    }
    
    // Add request ID for tracing
    config.headers['X-Request-ID'] = generateRequestId();
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Handle errors and retries
 */
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle network errors with retry
    // Auth requests opt out with skipRetry so a wrong password / offline backend
    // reports immediately instead of retrying with backoff.
    if (!error.response && !originalRequest._retry && !originalRequest.skipRetry) {
      originalRequest._retry = true;
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

      if (originalRequest._retryCount <= 3) {
        await sleep(1000 * originalRequest._retryCount);
        return apiClient(originalRequest);
      }
    }

    // Handle 401 Unauthorized - Token refresh
    // Public endpoints (e.g. password reset with a recovery token) opt out with
    // skipAuthRefresh so an invalid token is shown to the user instead of
    // silently bouncing them to /login.
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.skipAuthRefresh) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        // Prefer the HttpOnly refresh cookie set by the backend; fall back to
        // a stored refresh token for older sessions. The refresh endpoint is
        // cookie-authenticated, so it needs the double-submit CSRF header.
        const csrfToken = await getCsrfToken();
        const response = await axios.post(
          `${API_URL}/api/auth/refresh`,
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
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle a stale/missing CSRF token: refresh it and replay once.
    // The replay is safe because a CSRF failure means the request was never processed.
    const csrfErrorCode = error.response?.data?.code;
    if (
      error.response?.status === 403 &&
      typeof csrfErrorCode === 'string' &&
      csrfErrorCode.startsWith('CSRF_') &&
      !originalRequest._csrfRetry
    ) {
      originalRequest._csrfRetry = true;
      csrfTokenCache = null;
      const csrfToken = await getCsrfToken(true);
      if (csrfToken) {
        originalRequest.headers['X-CSRF-Token'] = csrfToken;
        return apiClient(originalRequest);
      }
    }

    // Handle 429 Too Many Requests - Retry with backoff
    if (error.response?.status === 429 && !originalRequest._retry && !originalRequest.skipRetry) {
      originalRequest._retry = true;
      const retryAfter = error.response.headers['retry-after'] || 5;
      await sleep(retryAfter * 1000);
      return apiClient(originalRequest);
    }

    // Handle 503 Service Unavailable - Retry
    if (error.response?.status === 503 && !originalRequest._retry && !originalRequest.skipRetry) {
      originalRequest._retry = true;
      await sleep(2000);
      return apiClient(originalRequest);
    }

    return Promise.reject(error);
  }
);

/**
 * Helper functions
 */
function generateRequestId() {
  return `${Date.now()}-${crypto.randomUUID()}`;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * API methods with error handling
 */
export const api = {
  // GET request
  get: async (url, config = {}) => {
    try {
      const response = await apiClient.get(url, config);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  // POST request
  post: async (url, data, config = {}) => {
    try {
      const response = await apiClient.post(url, data, config);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  // PUT request
  put: async (url, data, config = {}) => {
    try {
      const response = await apiClient.put(url, data, config);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  // PATCH request
  patch: async (url, data, config = {}) => {
    try {
      const response = await apiClient.patch(url, data, config);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  // DELETE request
  delete: async (url, config = {}) => {
    try {
      const response = await apiClient.delete(url, config);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  // Upload file
  upload: async (url, file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiClient.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        },
      });
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },
};

/**
 * Handle API errors
 */
function handleApiError(error) {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    
    console.error('API Error:', {
      status,
      message: data.message || 'Unknown error',
      errors: data.errors,
    });

    // Show user-friendly error messages
    if (status === 400) {
      console.error('Bad Request:', data.message);
    } else if (status === 403) {
      console.error('Forbidden:', data.message);
    } else if (status === 404) {
      console.error('Not Found:', data.message);
    } else if (status === 500) {
      console.error('Server Error: Please try again later');
    }
  } else if (error.request) {
    // Request made but no response
    console.error('Network Error: Please check your internet connection');
  } else {
    // Error in request setup
    console.error('Request Error:', error.message);
  }
}

/**
 * Cache wrapper for GET requests
 */
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const cachedApi = {
  get: async (url, config = {}) => {
    const cacheKey = `${url}${JSON.stringify(config)}`;
    const cached = cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    const data = await api.get(url, config);
    cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  },

  clear: () => {
    cache.clear();
  },

  clearKey: (url) => {
    for (const key of cache.keys()) {
      if (key.startsWith(url)) {
        cache.delete(key);
      }
    }
  },
};

export default api;
