/**
 * Production-safe console wrapper
 * Removes console.log in production, keeps error/warn
 */

const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info,
  debug: console.debug,
};

export function disableConsoleLogs() {
  if (process.env.NODE_ENV === 'production') {
    console.log = () => {};
    console.debug = () => {};
    console.info = originalConsole.error; // Redirect info to error in production
  }
}

export function enableConsoleLogs() {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.info = originalConsole.info;
  console.debug = originalConsole.debug;
}
