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
  // Use client-provided X-Request-ID or generate new one
  const requestId = req.get('X-Request-ID') || randomUUID();
  
  res.locals.requestId = requestId;
  res.set('X-Request-ID', requestId);
  
  // Store in request object for use in services
  req.requestId = requestId;
  
  next();
};

export default requestIdMiddleware;
