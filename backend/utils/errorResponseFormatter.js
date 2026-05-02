/**
 * Error Response Formatter
 * Provides consistent error response format across all API endpoints
 */

/**
 * Error codes used throughout the system
 */
export const ErrorCodes = {
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_INTERVIEW_TYPE: 'INVALID_INTERVIEW_TYPE',
  INVALID_DIFFICULTY: 'INVALID_DIFFICULTY',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',

  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_INVALID: 'TOKEN_INVALID',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',

  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  INTERVIEW_NOT_FOUND: 'INTERVIEW_NOT_FOUND',
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
  SESSION_EXPIRED: 'SESSION_EXPIRED',

  // Business logic errors
  INSUFFICIENT_COINS: 'INSUFFICIENT_COINS',
  INTERVIEW_ALREADY_COMPLETED: 'INTERVIEW_ALREADY_COMPLETED',
  INVALID_STATE_TRANSITION: 'INVALID_STATE_TRANSITION',

  // External service errors
  AI_SERVICE_UNAVAILABLE: 'AI_SERVICE_UNAVAILABLE',
  GROQ_API_ERROR: 'GROQ_API_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',

  // Server errors
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
};

/**
 * HTTP status codes for each error type
 */
const STATUS_CODES = {
  [ErrorCodes.VALIDATION_ERROR]: 400,
  [ErrorCodes.INVALID_INPUT]: 400,
  [ErrorCodes.MISSING_REQUIRED_FIELD]: 400,
  [ErrorCodes.INVALID_INTERVIEW_TYPE]: 400,
  [ErrorCodes.INVALID_DIFFICULTY]: 400,
  [ErrorCodes.PAYLOAD_TOO_LARGE]: 413,
  
  [ErrorCodes.UNAUTHORIZED]: 401,
  [ErrorCodes.FORBIDDEN]: 403,
  [ErrorCodes.TOKEN_INVALID]: 401,
  [ErrorCodes.TOKEN_EXPIRED]: 401,
  
  [ErrorCodes.NOT_FOUND]: 404,
  [ErrorCodes.INTERVIEW_NOT_FOUND]: 404,
  [ErrorCodes.SESSION_NOT_FOUND]: 404,
  [ErrorCodes.SESSION_EXPIRED]: 410,
  
  [ErrorCodes.INSUFFICIENT_COINS]: 402,
  [ErrorCodes.INTERVIEW_ALREADY_COMPLETED]: 409,
  [ErrorCodes.INVALID_STATE_TRANSITION]: 409,
  
  [ErrorCodes.AI_SERVICE_UNAVAILABLE]: 503,
  [ErrorCodes.GROQ_API_ERROR]: 502,
  [ErrorCodes.DATABASE_ERROR]: 500,
  [ErrorCodes.NETWORK_ERROR]: 503,
  
  [ErrorCodes.INTERNAL_SERVER_ERROR]: 500,
  [ErrorCodes.SERVICE_UNAVAILABLE]: 503,
};

/**
 * User-friendly error messages
 */
const ERROR_MESSAGES = {
  [ErrorCodes.VALIDATION_ERROR]: 'The request contains invalid data',
  [ErrorCodes.INVALID_INPUT]: 'Invalid input provided',
  [ErrorCodes.MISSING_REQUIRED_FIELD]: 'Required field is missing',
  [ErrorCodes.INVALID_INTERVIEW_TYPE]: 'Invalid interview type',
  [ErrorCodes.INVALID_DIFFICULTY]: 'Invalid difficulty level',
  [ErrorCodes.PAYLOAD_TOO_LARGE]: 'Request payload is too large',
  
  [ErrorCodes.UNAUTHORIZED]: 'Authentication required',
  [ErrorCodes.FORBIDDEN]: 'You do not have permission',
  [ErrorCodes.TOKEN_INVALID]: 'Invalid authentication token',
  [ErrorCodes.TOKEN_EXPIRED]: 'Your session has expired',
  
  [ErrorCodes.NOT_FOUND]: 'Resource not found',
  [ErrorCodes.INTERVIEW_NOT_FOUND]: 'Interview not found',
  [ErrorCodes.SESSION_NOT_FOUND]: 'Interview session not found',
  
  [ErrorCodes.INSUFFICIENT_COINS]: 'You do not have enough coins',
  [ErrorCodes.INTERVIEW_ALREADY_COMPLETED]: 'Interview is already completed',
  [ErrorCodes.INVALID_STATE_TRANSITION]: 'Cannot perform this action in current state',
  
  [ErrorCodes.AI_SERVICE_UNAVAILABLE]: 'AI service is temporarily unavailable',
  [ErrorCodes.GROQ_API_ERROR]: 'Failed to communicate with AI provider',
  [ErrorCodes.DATABASE_ERROR]: 'Database operation failed',
  [ErrorCodes.NETWORK_ERROR]: 'Network connection error',
  
  [ErrorCodes.INTERNAL_SERVER_ERROR]: 'Internal server error',
  [ErrorCodes.SERVICE_UNAVAILABLE]: 'Service is temporarily unavailable',
};

/**
 * Format a standardized error response
 * @param {string} code - Error code (from ErrorCodes)
 * @param {string} message - Custom error message (optional, uses default if not provided)
 * @param {object} details - Additional error details (optional)
 * @returns {object} Standardized error object
 */
export function formatError(code, message = null, details = null) {
  const status = STATUS_CODES[code] || 500;
  const defaultMessage = ERROR_MESSAGES[code] || 'An error occurred';
  
  return {
    success: false,
    error: {
      code,
      message: message || defaultMessage,
      ...(details && { details }),
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Respond with a formatted error
 * @param {Response} res - Express response object
 * @param {string} code - Error code
 * @param {string} message - Custom message (optional)
 * @param {object} details - Additional details (optional)
 */
export function sendError(res, code, message = null, details = null) {
  const error = formatError(code, message, details);
  const status = STATUS_CODES[code] || 500;
  
  res.status(status).json(error);
}

/**
 * Respond with a success response
 * @param {Response} res - Express response object
 * @param {object} data - Response data
 * @param {number} statusCode - HTTP status code (default: 200)
 */
export function sendSuccess(res, data, statusCode = 200) {
  res.status(statusCode).json({
    success: true,
    data,
  });
}

export default {
  ErrorCodes,
  formatError,
  sendError,
  sendSuccess,
};
