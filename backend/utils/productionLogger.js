/**
 * Production-safe console wrapper
 * In production:
 * - console.log → preserved for critical startup/runtime logs (via stderr)
 * - console.debug → disabled (filtered output)
 * - console.warn → preserved (via stderr)
 * - console.error → preserved (via stderr)
 * - console.info → preserved (via stderr)
 * 
 * Critical startup logs (marked with emoji or critical patterns) are
 * always logged to stderr, ensuring visibility even in production.
 * Regular debug/verbose logs are filtered out.
 */

const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info,
  debug: console.debug,
};

// Patterns that identify critical startup/runtime logs
const CRITICAL_LOG_PATTERNS = [
  /^📦/, // Loading routes
  /^✅/, // Success indicators
  /^❌/, // Error indicators
  /^🚀/, // Server startup
  /^🚨/, // Fatal/critical errors
  /^⚠️/, // Warnings
  /^ℹ️/, // Important info
  /^🔄/, // Restart/reload
  /^[✓✗]/, // Check marks
  /listening|running|started|initialized|connected|ready/i,
  /failed|error|error|exit|shutdown/i,
  /fatal|critical|panic/i,
];

/**
 * Check if a message contains critical information
 */
function isCriticalLog(message) {
  if (!message || typeof message !== 'string') return false;
  return CRITICAL_LOG_PATTERNS.some(pattern => pattern.test(message));
}

export function disableConsoleLogs() {
  if (process.env.NODE_ENV === 'production') {
    // console.log → filter critical logs to stderr, suppress others
    console.log = (...args) => {
      const message = args[0]?.toString?.() || '';
      if (isCriticalLog(message)) {
        // Route critical startup/runtime logs to stderr
        originalConsole.error(...args);
      }
      // Silent suppress non-critical logs
    };

    // console.debug → completely disabled in production
    console.debug = () => {};

    // console.info → preserved to stderr in production
    console.info = originalConsole.error;

    // console.warn and console.error remain unchanged (already go to stderr)
  }
}

export function enableConsoleLogs() {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.info = originalConsole.info;
  console.debug = originalConsole.debug;
}
