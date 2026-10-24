/**
 * Request ID Middleware
 * 
 * Assigns unique request IDs and propagates them through the request lifecycle
 * for distributed tracing and correlation of logs.
 * 
 * Features:
 * - Generates UUID for each request
 * - Exposes via res.locals.requestId and X-Request-ID header
 * - Enables request tracing across multiple services
 */

import { randomUUID } from 'crypto';

export const requestIdMiddleware = (req, res, next) => {
  const suppliedRequestId = req.get('X-Request-ID');
  const requestId = suppliedRequestId && /^[A-Za-z0-9._-]{1,100}$/.test(suppliedRequestId)
    ? suppliedRequestId
    : randomUUID();
  
  res.locals.requestId = requestId;
  res.set('X-Request-ID', requestId);
  
  // Store in request object for use in services
  req.requestId = requestId;
  
  next();
};

export default requestIdMiddleware;
