import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
    
    if (!config || !config.retry) {
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

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default apiClient;
