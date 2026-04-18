const requiredEnvVars = {
  production: [
    'NODE_ENV',
    'PORT',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'FRONTEND_URL',
  ],
  development: [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
  ],
};

const optionalEnvVars = [
  'GROQ_API_KEY',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'SMTP_USER',
  'SMTP_PASS',
  'RAPIDAPI_KEY',
];

export function validateEnv() {
  const env = process.env.NODE_ENV || 'development';
  const required = requiredEnvVars[env] || requiredEnvVars.development;
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    if (env === 'production') {
      process.exit(1);
    }
  }

  const missingOptional = optionalEnvVars.filter(key => !process.env[key]);
  if (missingOptional.length > 0) {
    console.warn('⚠️  Missing optional environment variables:', missingOptional.join(', '));
    console.warn('   Some features may be disabled.');
  }

  console.log('✅ Environment validation passed');
}
