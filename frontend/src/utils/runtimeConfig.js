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
const _IS_DEVELOPMENT = import.meta.env.DEV;

/**
 * Validate frontend runtime configuration
 * @throws {Error} If configuration is invalid
 */
export function validateFrontendRuntimeConfig() {
  const errors = [];
  const apiUrl = import.meta.env.VITE_API_URL;
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Supabase Configuration Checks
  if (supabaseUrl && !isValidUrl(supabaseUrl)) {
    errors.push(`❌ VITE_SUPABASE_URL is not a valid URL: "${supabaseUrl}"`);
  }

  if (IS_PRODUCTION) {
    if (!supabaseUrl) {
      errors.push('❌ VITE_SUPABASE_URL is required in production for user authentication.');
    } else if (supabaseUrl.includes('your-project-ref') || supabaseUrl.includes('placeholder-project')) {
      errors.push('🔒 SECURITY FAILURE: VITE_SUPABASE_URL contains a placeholder reference in production.');
    }

    if (!supabaseAnonKey) {
      errors.push('❌ VITE_SUPABASE_ANON_KEY is required in production for client-side API authentication.');
    } else if (supabaseAnonKey === 'your_supabase_anon_key') {
      errors.push('🔒 SECURITY FAILURE: VITE_SUPABASE_ANON_KEY contains a placeholder key in production.');
    }
  }

  // In production, VITE_API_URL is recommended but not required.
  // If it is unset, the hosting layer needs to route /api/* to the backend origin.
  if (IS_PRODUCTION) {
    if (!apiUrl) {
      console.warn(
        '⚠️  VITE_API_URL is not configured in production. ' +
        'API requests will use relative paths and depend on the hosting layer to route /api/*.'
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
      console.warn(
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
    hasSupabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
    hasSupabaseAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
    timestamp: new Date().toISOString(),
  };
}
