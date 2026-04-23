import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('env-validator');

const REQUIRED_ENV_VARS = {
  production: [
    'NODE_ENV',
    'PORT',
    'FRONTEND_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ],
  development: [
    'NODE_ENV',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
  ],
};

const ENV_VAR_PATTERNS = {
  JWT_SECRET: /^.{32,}$/,
  JWT_REFRESH_SECRET: /^.{32,}$/,
  SUPABASE_URL: /^https:\/\/.+\.supabase\.co$/,
  PORT: /^\d+$/,
};

export function validateRequiredEnvVars() {
  const env = process.env.NODE_ENV || 'development';
  const required = REQUIRED_ENV_VARS[env] || REQUIRED_ENV_VARS.development;
  const missing = [];
  const invalid = [];

  for (const varName of required) {
    const value = process.env[varName];
    
    if (!value || value.startsWith('your_')) {
      missing.push(varName);
      continue;
    }

    const pattern = ENV_VAR_PATTERNS[varName];
    if (pattern && !pattern.test(value)) {
      invalid.push(`${varName} (invalid format)`);
    }
  }

  if (missing.length > 0) {
    logger.error('Missing required environment variables', { missing });
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (invalid.length > 0) {
    logger.error('Invalid environment variables', { invalid });
    throw new Error(`Invalid environment variables: ${invalid.join(', ')}`);
  }

  logger.info('Environment validation passed', { env });
}
