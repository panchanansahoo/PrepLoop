import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const isInvalidToken403 = (error) => {
  const status = error?.response?.status;
  if (status !== 403) return false;

  const code = String(error?.response?.data?.code || '').toUpperCase();
  const message = String(error?.response?.data?.error || error?.response?.data?.message || '').toLowerCase();

  return code === 'INVALID_TOKEN' || message.includes('invalid or expired token');
};

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
