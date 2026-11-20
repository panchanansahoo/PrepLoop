import { authFetch } from '../../../utils/authFetch';

/**
 * Structured API client for Admin Dashboard operations.
 * Wraps authFetch with JSON encoding/decoding, query parameter serialization,
 * and structured error responses.
 */
export const adminApi = {
  get: async (url, config = {}) => {
    let fullUrl = url;
    if (config.params) {
      const searchParams = new URLSearchParams();
      for (const [key, val] of Object.entries(config.params)) {
        if (val !== undefined && val !== null && val !== '') {
          searchParams.append(key, val);
        }
      }
      const qs = searchParams.toString();
      if (qs) {
        fullUrl += (fullUrl.includes('?') ? '&' : '?') + qs;
      }
    }
    const { params: _params, ...restConfig } = config;
    const res = await authFetch(fullUrl, { method: 'GET', ...restConfig });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const error = new Error(data?.error || `Request failed with status ${res.status}`);
      error.response = { status: res.status, data };
      throw error;
    }
    return { data, status: res.status };
  },

  post: async (url, body = {}, config = {}) => {
    const { headers = {}, ...restConfig } = config;
    const res = await authFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
      ...restConfig,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const error = new Error(data?.error || `Request failed with status ${res.status}`);
      error.response = { status: res.status, data };
      throw error;
    }
    return { data, status: res.status };
  },

  put: async (url, body = {}, config = {}) => {
    const { headers = {}, ...restConfig } = config;
    const res = await authFetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
      ...restConfig,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const error = new Error(data?.error || `Request failed with status ${res.status}`);
      error.response = { status: res.status, data };
      throw error;
    }
    return { data, status: res.status };
  },

  patch: async (url, body = {}, config = {}) => {
    const { headers = {}, ...restConfig } = config;
    const res = await authFetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
      ...restConfig,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const error = new Error(data?.error || `Request failed with status ${res.status}`);
      error.response = { status: res.status, data };
      throw error;
    }
    return { data, status: res.status };
  },

  delete: async (url, config = {}) => {
    const res = await authFetch(url, { method: 'DELETE', ...config });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const error = new Error(data?.error || `Request failed with status ${res.status}`);
      error.response = { status: res.status, data };
      throw error;
    }
    return { data, status: res.status };
  },
};

export default adminApi;
