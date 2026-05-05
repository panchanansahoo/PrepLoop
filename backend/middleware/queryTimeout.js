/**
 * Query Timeout Middleware
 * 
 * Sets a per-request timeout to prevent runaway database queries
 * or slow AI operations from holding connections indefinitely.
 * 
 * Usage: app.use(queryTimeout({ timeoutMs: 30000 }))
 */

const DEFAULT_TIMEOUT_MS = 30_000; // 30 seconds

/**
 * Creates middleware that aborts requests exceeding the timeout.
 * AI-heavy endpoints get a longer timeout; reads get a shorter one.
 */
export function queryTimeout(options = {}) {
  const defaultMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;

  // Routes that need longer timeouts (AI processing, file uploads)
  const longTimeoutPaths = [
    '/api/ai',
    '/api/ai-features',
    '/api/voice',
    '/api/company-interview',
    '/api/interview-suite',
    '/api/code-review',
    '/api/resume',
    '/api/copilot',
  ];

  const LONG_TIMEOUT_MS = options.longTimeoutMs || 120_000; // 2 minutes for AI

  return (req, res, next) => {
    // Skip for health checks and websocket upgrades
    if (req.path.startsWith('/health') || req.headers.upgrade === 'websocket') {
      return next();
    }

    const isLongPath = longTimeoutPaths.some(p => req.originalUrl.startsWith(p));
    const timeoutMs = isLongPath ? LONG_TIMEOUT_MS : defaultMs;

    const timer = setTimeout(() => {
      if (!res.headersSent) {
        console.error(`⏱️ Request timeout after ${timeoutMs}ms: ${req.method} ${req.originalUrl}`);
        res.status(504).json({
          error: 'Request timeout',
          message: 'The server took too long to respond. Please try again.',
        });
      }
    }, timeoutMs);

    // Clear timeout when response finishes
    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));

    next();
  };
}

export default queryTimeout;
