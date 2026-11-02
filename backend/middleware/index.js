/**
 * Backend Middleware Barrel Export
 * Groups and re-exports all middleware for clean, consistent imports across routes and services.
 */

// Authentication & Authorization
export {
  authenticateToken,
  requireAdmin,
  requireHR,
  optionalAuth,
  isAdminEmail,
  getAccessToken,
  getAdminEmails,
  DEFAULT_ADMIN_EMAILS,
} from './auth.js';

// Error Handling & Async Utilities
export {
  errorHandler,
  asyncHandler,
  AppError,
  ErrorCodes,
} from './errorHandler.js';

// Request Tracing & Correlation
export {
  requestIdMiddleware,
} from './requestId.js';

// Security & Protection
export {
  enhancedSecurity,
  getSecurityStats,
  unblockIP,
} from './securityEnhanced.js';

export {
  csrfProtection,
  csrfTokenEndpoint,
  generateCsrfToken,
} from './csrf.js';

export {
  sanitizeInput,
  sanitizeHTMLInput,
  skipSanitization,
  sanitizeString,
  sanitizeHTML,
  sanitizeObject,
} from './sanitization.js';

// Rate Limiting & Quotas
export {
  aiEndpointsLimiter,
  paymentEndpointsLimiter,
  jobsEndpointsLimiter,
  adminEndpointsLimiter,
  customInterviewLimiter,
  customInterviewSubmissionLimiter,
  expensiveFeatureLimiter,
} from './apiRateLimiter.js';

export {
  authLoginLimiter,
  forgotPasswordLimiter,
  verificationLimiter,
  contactLimiter,
  hrLoginLimiter,
  isEmailCoolingDown,
  markEmailSent,
} from './rateLimiter.js';

export {
  usageQuota,
  resetUsageQuotaCounters,
} from './usageQuota.js';

// Caching
export {
  apiCacheMiddleware,
  invalidateCache,
  getCacheStats,
} from './apiCache.js';

// Health & Diagnostics
export {
  healthCheck,
  readinessCheck,
  livenessCheck,
  detailedHealthCheck,
} from './healthCheck.js';

// Monitoring & Metrics
export {
  requestMetricsMiddleware,
  metricsEndpoint,
  errorTrackingMiddleware,
} from './monitoring.js';

// Validation
export {
  validateRequest,
  validateRequestBody,
  validateQueryParams,
  validateUrlParams,
  Joi,
} from './validation.js';

