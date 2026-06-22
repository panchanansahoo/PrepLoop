/**
 * Database Query Timeout Configuration
 * 
 * Prevents hanging queries from blocking the application
 * by enforcing statement timeouts at the database level.
 * 
 * Applied per-connection in Supabase initialization.
 */

/**
 * SQL to set query timeouts on Supabase connection
 * 
 * Usage in supabaseClient.js:
 * await supabase.rpc('set_session_timeout', { timeout_ms: 30000 })
 */
export const QUERY_TIMEOUT_MS = 30000; // 30 seconds
export const SLOW_QUERY_THRESHOLD_MS = 5000; // Log queries slower than 5s

/**
 * Create timeout wrapper for database operations
 */
export function withTimeout(promise, timeoutMs = QUERY_TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`Operation timeout after ${timeoutMs}ms`)),
        timeoutMs
      )
    ),
  ]);
}

export default {
  QUERY_TIMEOUT_MS,
  SLOW_QUERY_THRESHOLD_MS,
  withTimeout,
};
