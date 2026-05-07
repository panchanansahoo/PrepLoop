import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('error-handler');

export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (err, req, res, next) => {
  const requestId = req.requestId || res.locals.requestId || 'unknown';
  
  const error = { ...err };
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
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    error.statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired';
    error.statusCode = 401;
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    error.message = Object.values(err.errors).map(e => e.message).join(', ');
    error.statusCode = 400;
  }

  // Don't leak error details in production
  const response = {
    error: error.message || 'Internal server error',
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
