/**
 * apiFetch — A lightweight wrapper around the centralized axios client.
 *
 * This gives every caller the same benefits as `api/client.js`:
 *   ✅ Automatic auth token injection
 *   ✅ Automatic retry with exponential backoff (3x for 5xx / network errors)
 *   ✅ Automatic 401 → redirect to /login
 *
 * Usage:
 *   import { apiFetch } from '../utils/apiFetch';
 *
 *   // GET — returns data directly (not wrapped in response)
 *   const data = await apiFetch.get('/api/jobs?limit=3');
 *
 *   // POST
 *   const result = await apiFetch.post('/api/payment/create-order', { plan: 'pro' });
 *
 *   // With AbortController (recommended in useEffect)
 *   const controller = new AbortController();
 *   const data = await apiFetch.get('/api/user/dashboard', { signal: controller.signal });
 *   // cleanup: controller.abort();
 */

import apiClient from '../api/client';

/**
 * Wrapper that returns response.data directly (like fetch().json()).
 * Accepts the same config as axios but is simpler to consume.
 */
export const apiFetch = {
  /**
   * @param {string} url — relative API path (e.g. '/api/jobs')
   * @param {import('axios').AxiosRequestConfig} [config]
   * @returns {Promise<any>} Parsed response data
   */
  async get(url, config = {}) {
    const response = await apiClient.get(url, config);
    return response.data;
  },

  /**
   * @param {string} url
   * @param {any} [data]
   * @param {import('axios').AxiosRequestConfig} [config]
   * @returns {Promise<any>}
   */
  async post(url, data, config = {}) {
    const response = await apiClient.post(url, data, config);
    return response.data;
  },

  /**
   * @param {string} url
   * @param {any} [data]
   * @param {import('axios').AxiosRequestConfig} [config]
   * @returns {Promise<any>}
   */
  async put(url, data, config = {}) {
    const response = await apiClient.put(url, data, config);
    return response.data;
  },

  /**
   * @param {string} url
   * @param {any} [data]
   * @param {import('axios').AxiosRequestConfig} [config]
   * @returns {Promise<any>}
   */
  async patch(url, data, config = {}) {
    const response = await apiClient.patch(url, data, config);
    return response.data;
  },

  /**
   * @param {string} url
   * @param {import('axios').AxiosRequestConfig} [config]
   * @returns {Promise<any>}
   */
  async delete(url, config = {}) {
    const response = await apiClient.delete(url, config);
    return response.data;
  },
};

export default apiFetch;
