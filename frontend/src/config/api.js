/**
 * Centralized API configuration.
 * Import API_URL from this module instead of defining it inline.
 * 
 * In development, Vite proxies /api/* to localhost:5000 (see vite.config.js),
 * so API_URL can be empty string for relative URLs.
 * In production, VITE_API_URL should be set in the deployment environment.
 */
export const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * Build a full API endpoint URL.
 * @param {string} path - API path starting with /api/
 * @returns {string} Full URL
 */
export function apiUrl(path) {
  return `${API_URL}${path}`;
}
