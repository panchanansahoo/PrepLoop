/**
 * Unified API Client
 * Re-exports the singleton axios client from utils/apiClient to ensure
 * a single shared instance, unified token refresh queue, and CSRF token store.
 */
import apiClient, { api, cachedApi } from '../utils/apiClient';

export { apiClient, api, cachedApi };
export default apiClient;
