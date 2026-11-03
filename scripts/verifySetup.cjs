const fs = require('node:fs');
const path = require('node:path');

function unique(items) {
  return [...new Set(items)];
}

function parseCliOptions(argv) {
  const options = {
    strict: false,
    requireKeys: [],
  };

  for (const arg of argv) {
    if (arg === '--strict') {
      options.strict = true;
      continue;
    }

    if (arg.startsWith('--require=')) {
      const raw = arg.slice('--require='.length);
      const keys = raw
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);
      options.requireKeys.push(...keys);
    }
  }

  options.requireKeys = unique(options.requireKeys);
  return options;
}

function parseEnvFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const values = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eqIdx = trimmed.indexOf('=');
    if (eqIdx <= 0) continue;

    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

function validateSection(name, envValues, requiredKeys, optionalKeys) {
  const missingRequired = requiredKeys.filter((k) => !envValues[k]);
  const missingOptional = optionalKeys.filter((k) => !envValues[k]);

  console.log(`\n[${name}]`);

  if (missingRequired.length === 0) {
    console.log('  [OK] Required keys present');
  } else {
    console.log('  [ERROR] Missing required keys:');
    for (const key of missingRequired) {
      console.log(`    - ${key}`);
    }
  }

  if (missingOptional.length === 0) {
    console.log('  [OK] Optional integrations configured');
  } else {
    console.log('  [WARN] Missing optional keys (feature-dependent):');
    for (const key of missingOptional) {
      console.log(`    - ${key}`);
    }
  }

  return missingRequired;
}

function main() {
  const options = parseCliOptions(process.argv.slice(2));
  const root = process.cwd();
  const backendEnvPath = path.join(root, 'backend', '.env');
  const frontendEnvPath = path.join(root, 'frontend', '.env');

  console.log('Running setup verification...');
  if (options.strict) {
    console.log('[MODE] strict (all known keys are required)');
  }
  if (options.requireKeys.length > 0) {
    console.log(`[MODE] extra required keys: ${options.requireKeys.join(', ')}`);
  }

  const missingFiles = [];
  if (!fs.existsSync(backendEnvPath)) missingFiles.push('backend/.env');
  if (!fs.existsSync(frontendEnvPath)) missingFiles.push('frontend/.env');

  if (missingFiles.length > 0) {
    console.log('\n[ERROR] Missing environment files:');
    for (const file of missingFiles) {
      console.log(`  - ${file}`);
    }
    console.log('\nCreate them from examples:');
    console.log('  copy backend\\.env.example backend\\.env');
    console.log('  copy frontend\\.env.example frontend\\.env');
    process.exit(1);
  }

  const backendEnv = parseEnvFile(backendEnvPath);
  const frontendEnv = parseEnvFile(frontendEnvPath);

  const backendRequiredBase = ['PORT', 'FRONTEND_URL', 'SUPABASE_URL', 'SUPABASE_ANON_KEY'];
  const backendOptional = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'DATABASE_URL',
    'HR_AUTH_ENABLED',
    'JWT_SECRET',
    'GROQ_API_KEY',
    'GEMINI_API_KEY',
    'SMTP_USER',
    'SMTP_PASS',
    'RECAPTCHA_SECRET_KEY',
    'RAPIDAPI_KEY',
    'ADZUNA_APP_ID',
    'ADZUNA_APP_KEY',
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET',
    'RAZORPAY_WEBHOOK_SECRET',
    'SUPABASE_DB_PASSWORD',
    'SUPABASE_KEY',
    'JWT_REFRESH_SECRET',
    'ACCESS_TOKEN_SECRET',
    'REFRESH_TOKEN_SECRET',
    'FIELD_ENCRYPTION_KEY',
    'METRICS_API_KEY',
    'PRODUCTION_FRONTEND_URL',
    'ADMIN_EMAILS',
    'REDIS_URL',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
    'ELEVENLABS_API_KEY',
    'OPENAI_API_KEY',
    'NVIDIA_API_KEY',
    'NVIDIA_MODEL',
    'SMTP_HOST',
    'SMTP_PORT',
    'EMAIL_FROM',
    'NODE_ENV',
  ];
  const frontendRequiredBase = ['VITE_API_URL', 'VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
  const frontendOptional = [];

  const backendKnown = new Set([...backendRequiredBase, ...backendOptional]);
  const frontendKnown = new Set([...frontendRequiredBase, ...frontendOptional]);

  const unknownRequired = options.requireKeys.filter(
    (key) => !backendKnown.has(key) && !frontendKnown.has(key),
  );

  if (unknownRequired.length > 0) {
    console.log('\n[ERROR] Unknown keys passed via --require:');
    for (const key of unknownRequired) {
      console.log(`  - ${key}`);
    }
    console.log('Use comma-separated known keys, for example: --require=GROQ_API_KEY,RAZORPAY_KEY_ID');
    process.exit(1);
  }

  const backendExtraRequired = options.requireKeys.filter((key) => backendKnown.has(key));
  const frontendExtraRequired = options.requireKeys.filter((key) => frontendKnown.has(key));

  const backendRequired = unique([
    ...backendRequiredBase,
    ...(options.strict ? backendOptional : []),
    ...backendExtraRequired,
  ]);

  const frontendRequired = unique([
    ...frontendRequiredBase,
    ...(options.strict ? frontendOptional : []),
    ...frontendExtraRequired,
  ]);

  const backendOptionalEffective = options.strict
    ? backendOptional.filter((k) => !backendRequired.includes(k))
    : backendOptional.filter((k) => !backendExtraRequired.includes(k));

  const frontendOptionalEffective = options.strict
    ? frontendOptional.filter((k) => !frontendRequired.includes(k))
    : frontendOptional.filter((k) => !frontendExtraRequired.includes(k));

  const backendMissing = validateSection(
    'Backend',
    backendEnv,
    backendRequired,
    backendOptionalEffective,
  );

  const frontendMissing = validateSection(
    'Frontend',
    frontendEnv,
    frontendRequired,
    frontendOptionalEffective,
  );

  const allMissing = [...backendMissing, ...frontendMissing];
  const consistencyErrors = [];
  if (backendEnv.HR_AUTH_ENABLED === 'true' && !backendEnv.DATABASE_URL) {
    consistencyErrors.push(
      'HR_AUTH_ENABLED=true requires DATABASE_URL to be defined in backend/.env for PostgreSQL queries (or set HR_AUTH_ENABLED=false for local dev).'
    );
  }

  if (consistencyErrors.length > 0) {
    console.log('\n[ERROR] Inconsistent environment configuration:');
    for (const err of consistencyErrors) {
      console.log(`  - ${err}`);
    }
  }

  const allFailures = [...allMissing, ...consistencyErrors];
  if (allFailures.length > 0) {
    console.log('\nSetup verification failed. Fix issues and re-run: npm run verify:setup');
    console.log('Tip: require specific integration keys with --require=KEY1,KEY2 or use --strict for full enforcement.');
    process.exit(1);
  }

  console.log('\nSetup verification passed. You are ready to run the app.');
}

main();