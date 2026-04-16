/**
 * Frontend Runtime Configuration Validation
 * 
 * Implements fail-fast pattern for frontend environment validation.
 * Runs after app bundle loads but before React initialization.
 * 
 * Validates:
 * - API endpoint configuration
 * - Production vs development environment appropriateness
 * - URL format and origin restrictions
 * 
 * Pattern: Validate early, fail with clear diagnostics
 */

const IS_PRODUCTION = import.meta.env.PROD;
const IS_DEVELOPMENT = import.meta.env.DEV;

/**
 * Validate frontend runtime configuration
 * @throws {Error} If configuration is invalid
 */
export function validateFrontendRuntimeConfig() {
  const errors = [];
  const apiUrl = import.meta.env.VITE_API_URL;

  // In production, VITE_API_URL is required
  if (IS_PRODUCTION) {
    if (!apiUrl) {
      errors.push(
        '❌ VITE_API_URL is not configured in production. ' +
        'API requests will fail. Set VITE_API_URL environment variable to your backend URL.'
      );
    }

    if (apiUrl && !isValidUrl(apiUrl)) {
      errors.push(
        `❌ VITE_API_URL is not a valid URL: "${apiUrl}". ` +
        'Must be a fully qualified URL (e.g., https://api.example.com)'
      );
    }

    // Production shouldn't use localhost
    if (apiUrl && apiUrl.includes('localhost')) {
      errors.push(
        '⚠️  VITE_API_URL contains "localhost" in production. ' +
        'Production frontends should use external API URLs. ' +
        `Current: "${apiUrl}"`
      );
    }
  }

  if (errors.length > 0) {
    const fullMessage = [
      '🚨 FRONTEND VALIDATION FAILED 🚨',
      'The application cannot initialize with these configuration issues:',
      '',
      ...errors,
      '',
      'Fix these issues and reload the page.',
      '',
      'Current environment:',
      `  Mode: ${IS_PRODUCTION ? 'production' : 'development'}`,
      `  VITE_API_URL: ${apiUrl || '(not set)'}`,
    ].join('\n');

    console.error(fullMessage);
    throw new Error(`Frontend validation failed: ${errors.length} error(s) found`);
  }

  console.log('✅ Frontend runtime configuration validated');
  console.log(`📡 API endpoint: ${apiUrl || '(default: http://localhost:5000/api)'}`);
}

/**
 * Check if string is a valid HTTP/HTTPS URL
 * @param {string} urlString - URL to validate
 * @returns {boolean} True if valid URL
 */
function isValidUrl(urlString) {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Get current frontend configuration (safe for logging)
 */
export function getFrontendConfigInfo() {
  return {
    mode: IS_PRODUCTION ? 'production' : 'development',
    apiUrl: import.meta.env.VITE_API_URL || '(default)',
    timestamp: new Date().toISOString(),
  };
}
