import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('error-handler');

export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  RATE_LIMITED: 'RATE_LIMITED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  AI_SERVICE_ERROR: 'AI_SERVICE_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
};

export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (err, req, res, next) => {
  const requestId = req.requestId || res.locals.requestId || 'unknown';
  
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // Log error with context
  logger.error('Request error', {
    requestId,
    method: req.method,
    path: req.originalUrl,
    statusCode: error.statusCode,
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    userId: req.user?.id,
    isOperational: err.isOperational
  });

  // Supabase errors
  if (err.code === 'PGRST116') {
    error.message = 'Resource not found';
    error.statusCode = 404;
    error.code = ErrorCodes.NOT_FOUND;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    error.statusCode = 401;
    error.code = ErrorCodes.UNAUTHORIZED;
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired';
    error.statusCode = 401;
    error.code = ErrorCodes.UNAUTHORIZED;
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    error.message = Object.values(err.errors).map(e => e.message).join(', ');
    error.statusCode = 400;
    error.code = ErrorCodes.VALIDATION_ERROR;
  }

  // Multer file size errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    error.message = 'File too large';
    error.statusCode = 413;
    error.code = ErrorCodes.FILE_TOO_LARGE;
  }

  // Rate limit errors
  if (err.statusCode === 429 || error.statusCode === 429) {
    error.code = ErrorCodes.RATE_LIMITED;
  }

  // Determine the error code to include in the response
  const errorCode = error.code || err.code || ErrorCodes.INTERNAL_ERROR;
  // Only use known ErrorCodes values; fall back to INTERNAL_ERROR for unknown codes
  const responseCode = Object.values(ErrorCodes).includes(errorCode)
    ? errorCode
    : ErrorCodes.INTERNAL_ERROR;

  // Don't leak error details in production
  const response = {
    error: error.message || 'Internal server error',
    code: responseCode,
    requestId
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    // SECURITY (M2): Sanitize error details — strip sensitive properties
    // that might contain connection strings, passwords, or API keys
    const SENSITIVE_KEYS = ['password', 'secret', 'connectionString', 'authorization', 'cookie', 'apiKey', 'token'];
    const sanitizeDetails = (obj) => {
      if (!obj || typeof obj !== 'object') return obj;
      const safe = {};
      for (const [key, value] of Object.entries(obj)) {
        if (SENSITIVE_KEYS.some(k => key.toLowerCase().includes(k.toLowerCase()))) {
          safe[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
          safe[key] = sanitizeDetails(value);
        } else {
          safe[key] = value;
        }
      }
      return safe;
    };
    response.details = sanitizeDetails({ code: err.code, name: err.name, message: err.message });
  }

  res.status(error.statusCode).json(response);
};

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
