/**
 * Centralized API configuration
 * All files should import API_URL from here instead of duplicating the env resolution.
 */
export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

/**
 * Build a full API endpoint URL.
 * @param {string} path — e.g. '/api/jobs?limit=3'
 * @returns {string} Full URL like 'http://localhost:5000/api/jobs?limit=3'
 */
export function apiUrl(path) {
  const safePath = path.startsWith('/') ? path : `/${path}`;
  return `${API_URL}${safePath}`;
}
