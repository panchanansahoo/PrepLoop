/**
 * Centralized API configuration.
 * Import API_URL from this module instead of defining it inline.
 * 
 * In development, Vite proxies /api/* to localhost:5000 (see vite.config.js),
 * so API_URL can be empty string for relative URLs.
 * In production on preploop.me or Vercel, Vercel proxies /api/* to the backend on Render,
 * so relative URLs ('') prevent third-party cookie blocking and CORS preflight issues.
 */
function resolveApiUrl() {
  if (typeof window !== 'undefined') {
    const hostname = (window.location.hostname || '').toLowerCase();
    if (
      hostname === 'preploop.me' ||
      hostname === 'www.preploop.me' ||
      hostname.endsWith('.preploop.me') ||
      hostname.endsWith('.vercel.app')
    ) {
      return '';
    }
  }
  return import.meta.env.VITE_API_URL || '';
}

export const API_URL = resolveApiUrl();

/**
 * Build a full API endpoint URL.
 * @param {string} path - API path starting with /api/
 * @returns {string} Full URL
 */
export function apiUrl(path) {
  return `${API_URL}${path}`;
}
