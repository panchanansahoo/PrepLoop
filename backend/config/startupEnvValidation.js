/**
 * Startup Environment Validation
 * 
 * Implements fail-fast pattern for production configuration validation.
 * Inspired by concurrently v9's strict initialization checks.
 * 
 * Validates:
 * - Database connectivity environment variables
 * - Security-critical JWT configuration
 * - Production vs development configuration appropriateness
 * 
 * Pattern: Validate early, fail immediately, never start with insecure config
 */

const INSECURE_JWT_DEFAULT = 'preploop-jwt-secret-key';
const PRODUCTION_ENV = process.env.NODE_ENV === 'production';

/**
 * Get list of validation errors for current environment
 * @returns {string[]} Array of validation error messages (empty if valid)
 */
export function getProductionEnvValidationErrors() {
  const errors = [];
  const isProduction = process.env.NODE_ENV === 'production';

  // Check Supabase configuration
  if (!process.env.SUPABASE_URL) {
    errors.push('❌ SUPABASE_URL is not configured. Database connectivity will fail.');
  }

  if (!process.env.SUPABASE_ANON_KEY) {
    errors.push('❌ SUPABASE_ANON_KEY is not configured. Client-side API calls will fail.');
  }

  // Service role key only required in production
  if (isProduction && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    errors.push('❌ SUPABASE_SERVICE_ROLE_KEY is not configured. Server-side admin operations will fail in production.');
  }

  // Security check: reject insecure JWT defaults in production
  if (PRODUCTION_ENV) {
    const jwtSecret = process.env.JWT_SECRET || INSECURE_JWT_DEFAULT;
    
    if (jwtSecret === INSECURE_JWT_DEFAULT) {
      errors.push(
        '🔒 SECURITY FAILURE: JWT_SECRET must be explicitly configured in production. ' +
        'Using default secrets exposes authentication to compromise. ' +
        'Set JWT_SECRET environment variable to a strong, random secret.'
      );
    }

    if (!jwtSecret || jwtSecret.length < 32) {
      errors.push(
        '🔒 SECURITY WARNING: JWT_SECRET should be at least 32 characters in production ' +
        `(current: ${jwtSecret?.length || 0} chars).`
      );
    }
  }

  // Check for other critical configurations
  if (!process.env.FRONTEND_URL) {
    errors.push('⚠️  FRONTEND_URL is not configured. CORS validation may be overly permissive.');
  }

  return errors;
}

/**
 * Validate startup environment and throw if critical errors found
 * 
 * Uses fail-fast pattern: throws immediately with all validation errors
 * Does not allow partial failures in production
 * 
 * @throws {Error} If any validation errors are found
 */
export function validateStartupEnv() {
  const errors = getProductionEnvValidationErrors();

  if (errors.length > 0) {
    const fullMessage = [
      '🚨 STARTUP VALIDATION FAILED 🚨',
      'The application cannot start with these configuration issues:',
      '',
      ...errors,
      '',
      'Fix these issues before starting the application.',
    ].join('\n');

    console.error(fullMessage);
    throw new Error(`Startup validation failed: ${errors.length} error(s) found`);
  }

  console.log('✅ Startup environment validation passed');
}

/**
 * Generate debug information about current configuration
 * (Useful for troubleshooting, output safe for logs)
 */
export function getConfigDebugInfo() {
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasSupabaseAnonKey: !!process.env.SUPABASE_ANON_KEY,
    hasSupabaseServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasJwtSecret: !!process.env.JWT_SECRET,
    jwtSecretLength: process.env.JWT_SECRET?.length || 0,
    hasFrontendUrl: !!process.env.FRONTEND_URL,
    timestamp: new Date().toISOString(),
  };
}
