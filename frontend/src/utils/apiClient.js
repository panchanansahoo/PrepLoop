import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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

/**
 * Request interceptor - Add auth token
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
    if (!error.response && !originalRequest._retry) {
      originalRequest._retry = true;
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

      if (originalRequest._retryCount <= 3) {
        await sleep(1000 * originalRequest._retryCount);
        return apiClient(originalRequest);
      }
    }

    // Handle 401 Unauthorized - Token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Skip token refresh for guest users (no token = preview mode)
      const token = localStorage.getItem('token');
      if (!token) {
        return Promise.reject(error);
      }

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
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${API_URL}/api/auth/refresh`, {
          refreshToken,
        });

        const { token, refreshToken: newRefreshToken } = response.data;
        localStorage.setItem('token', token);
        // Rotate the stored refresh token — old one is now invalidated server-side
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }
        
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

    // Handle 429 Too Many Requests - Retry with backoff
    if (error.response?.status === 429 && !originalRequest._retry) {
      originalRequest._retry = true;
      const retryAfter = error.response.headers['retry-after'] || 5;
      await sleep(retryAfter * 1000);
      return apiClient(originalRequest);
    }

    // Handle 503 Service Unavailable - Retry
    if (error.response?.status === 503 && !originalRequest._retry) {
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
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
 * Cache wrapper for GET requests (auto-evicts stale entries)
 */
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const CACHE_MAX_SIZE = 200;

export const cachedApi = {
  get: async (url, config = {}) => {
    const cacheKey = `${url}${JSON.stringify(config)}`;
    const cached = cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    // Evict stale entries before adding new ones
    if (cache.size >= CACHE_MAX_SIZE) {
      const now = Date.now();
      for (const [key, entry] of cache.entries()) {
        if (now - entry.timestamp >= CACHE_DURATION) {
          cache.delete(key);
        }
      }
      // If still at limit, evict oldest
      if (cache.size >= CACHE_MAX_SIZE) {
        cache.delete(cache.keys().next().value);
      }
    }

    const data = await api.get(url, config);
    cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  },

  clear: () => cache.clear(),

  clearKey: (url) => {
    for (const key of cache.keys()) {
      if (key.startsWith(url)) cache.delete(key);
    }
  },
};

export default api;
