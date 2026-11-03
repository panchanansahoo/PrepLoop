import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('env-validation');

/**
 * Common placeholder patterns that indicate a value was never configured
 */
const PLACEHOLDER_PATTERNS = [
  /your_/i,
  /_here$/i,
  /_hier$/i,
  /example\.com$/i,
  /your_secret_here/i,
  /your_api_key_here/i,
  /your_jwt_secret_here/i,
  /your_supabase_url_here/i,
  /your_supabase_anon_key_here/i,
  /your_supabase_service_role_key_here/i,
  /your_resend_api_key_here/i,
  /your_razorpay_key_id_here/i,
  /your_razorpay_key_secret_here/i,
  /your_gemini_api_key_here/i,
  /your_groq_api_key_here/i,
  /your_nvidia_api_key_here/i,
  /your_elevenlabs_api_key_here/i,
  /your_openai_api_key_here/i,
  /your_adzuna_app_id_here/i,
  /your_adzuna_app_key_here/i,
  /your_rapidapi_key_here/i,
];

/**
 * Required environment variables for all environments
 */
const REQUIRED_VARS = [
  'NODE_ENV',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET',
];

/**
 * Required environment variables for production only
 */
const PRODUCTION_REQUIRED_VARS = [
  'FRONTEND_URL',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
];

/**
 * Optional but recommended environment variables
 */
const RECOMMENDED_VARS = [
  'GROQ_API_KEY',
  'GEMINI_API_KEY',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
];

/**
 * Validate environment variable format
 */
const validators = {
  PORT: (value) => {
    const port = Number(value);
    if (isNaN(port) || port < 1 || port > 65535) {
      throw new Error('PORT must be a valid port number (1-65535)');
    }
  },
  
  NODE_ENV: (value) => {
    const trimmedValue = value.trim().toLowerCase();
    if (!['development', 'production', 'test', 'staging'].includes(trimmedValue)) {
      throw new Error(`NODE_ENV must be one of: development, production, test, staging (got: "${value}")`);
    }
  },
  
  SUPABASE_URL: (value) => {
    if (!value.startsWith('https://')) {
      throw new Error('SUPABASE_URL must start with https://');
    }
  },
  
  FRONTEND_URL: (value) => {
    if (!value.startsWith('http://') && !value.startsWith('https://')) {
      throw new Error('FRONTEND_URL must be a valid URL');
    }
  },
  
  JWT_SECRET: (value) => {
    if (value.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters long');
    }
    if (process.env.NODE_ENV !== 'test') {
      const lower = value.toLowerCase();
      if (lower.includes('your_jwt_secret') || lower.includes('placeholder') || lower.includes('changeme') || /^(.)\1+$/.test(value)) {
        throw new Error('JWT_SECRET must not use insecure placeholder or repeated character patterns');
      }
    }
  },
  
  JWT_REFRESH_SECRET: (value) => {
    if (value.length < 32) {
      throw new Error('JWT_REFRESH_SECRET must be at least 32 characters long');
    }
    if (process.env.NODE_ENV !== 'test') {
      const lower = value.toLowerCase();
      if (lower.includes('your_jwt_refresh') || lower.includes('placeholder') || lower.includes('changeme') || /^(.)\1+$/.test(value)) {
        throw new Error('JWT_REFRESH_SECRET must not use insecure placeholder or repeated character patterns');
      }
    }
  },
};

/**
 * Validate all required environment variables
 */
export function validateEnvironment() {
  const errors = [];
  const warnings = [];
  const isProduction = process.env.NODE_ENV === 'production';

  // Safely default PORT if not explicitly provided
  process.env.PORT = process.env.PORT || '5000';

  // Bridge PRODUCTION_FRONTEND_URL to FRONTEND_URL if needed
  if (!process.env.FRONTEND_URL && process.env.PRODUCTION_FRONTEND_URL) {
    process.env.FRONTEND_URL = process.env.PRODUCTION_FRONTEND_URL;
  }

  // Check required variables
  const requiredVars = isProduction 
    ? [...REQUIRED_VARS, ...PRODUCTION_REQUIRED_VARS]
    : REQUIRED_VARS;

  for (const varName of requiredVars) {
    const value = process.env[varName];
    
    if (!value || value.trim() === '') {
      errors.push(`Missing required environment variable: ${varName}`);
      continue;
    }

    // Run specific validator if exists
    if (validators[varName]) {
      try {
        validators[varName](value);
      } catch (error) {
        errors.push(`Invalid ${varName}: ${error.message}`);
      }
    }
  }

  // Check recommended variables
  for (const varName of RECOMMENDED_VARS) {
    if (!process.env[varName]) {
      warnings.push(`Recommended environment variable not set: ${varName}`);
    }
  }

  // Warn about placeholder values in non-production environments
  const CRITICAL_VARS = [
    'JWT_SECRET',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SMTP_PASS',
    'RAZORPAY_KEY_SECRET',
    'GROQ_API_KEY',
    'GEMINI_API_KEY',
  ];
  for (const varName of CRITICAL_VARS) {
    const value = process.env[varName];
    if (!value) continue;
    const isPlaceholder = PLACEHOLDER_PATTERNS.some(p => p.test(value));
    if (isPlaceholder) {
      warnings.push(
        `Placeholder value detected for ${varName} ("${value}"). ` +
        'Replace with a real secret before deploying to production.'
      );
    }
  }

  // Log results
  if (errors.length > 0) {
    logger.error('Environment validation failed', { errors });
    console.error('\n❌ Environment Validation Errors:');
    errors.forEach(error => console.error(`  - ${error}`));
    console.error('\nPlease check your .env file and ensure all required variables are set.\n');
    process.exit(1);
  }

  if (warnings.length > 0) {
    logger.warn('Environment validation warnings', { warnings });
    console.warn('\n⚠️  Environment Validation Warnings:');
    warnings.forEach(warning => console.warn(`  - ${warning}`));
    console.warn('');
  }

  logger.info('Environment validation passed', {
    environment: process.env.NODE_ENV,
    requiredVarsCount: requiredVars.length,
    warningsCount: warnings.length,
  });

  console.log('✅ Environment validation passed');
}

/**
 * Get environment variable with fallback
 */
export function getEnv(key, defaultValue = undefined) {
  const value = process.env[key];
  if (value === undefined || value === '') {
    if (defaultValue === undefined) {
      throw new Error(`Environment variable ${key} is required but not set`);
    }
    return defaultValue;
  }
  return value;
}

/**
 * Get boolean environment variable
 */
export function getEnvBoolean(key, defaultValue = false) {
  const value = process.env[key];
  if (value === undefined || value === '') return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Get number environment variable
 */
export function getEnvNumber(key, defaultValue = undefined) {
  const value = process.env[key];
  if (value === undefined || value === '') {
    if (defaultValue === undefined) {
      throw new Error(`Environment variable ${key} is required but not set`);
    }
    return defaultValue;
  }
  const num = Number(value);
  if (isNaN(num)) {
    throw new Error(`Environment variable ${key} must be a number`);
  }
  return num;
}
