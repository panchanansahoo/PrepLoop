#!/usr/bin/env node
/**
 * Test script to verify all critical fixes are working
 */

console.log('🧪 Testing Critical Fixes...\n');

const tests = [];
let passed = 0;
let failed = 0;

// Test 1: Check if new files exist
const fs = await import('fs');
const path = await import('path');

const requiredFiles = [
  'backend/middleware/apiRateLimiter.js',
  'backend/middleware/envValidator.js',
  'backend/middleware/cache.js',
  'backend/utils/cacheService.js',
  'backend/utils/productionLogger.js',
  'backend/.eslintrc.json',
  'backend/.prettierrc.json',
  'frontend/.eslintrc.json',
  'scripts/scan-secrets.js',
  'scripts/generate-jwt-secrets.js',
  'backend/scripts/backup-db.js',
  'backend/scripts/health-monitor.js',
  '.github/workflows/security.yml',
  'docs/SECURITY.md',
  'docs/PERFORMANCE.md',
  'docs/DEPLOYMENT_CHECKLIST.md',
  'CRITICAL_FIXES_SUMMARY.md',
  'QUICK_START_SECURITY.md',
];

console.log('📁 Checking required files...');
for (const file of requiredFiles) {
  try {
    await fs.promises.access(file);
    console.log(`  ✅ ${file}`);
    passed++;
  } catch {
    console.log(`  ❌ ${file} - MISSING`);
    failed++;
  }
}

// Test 2: Check backend/index.js modifications
console.log('\n🔧 Checking backend/index.js modifications...');
try {
  const indexContent = await fs.promises.readFile('backend/index.js', 'utf-8');
  
  const checks = [
    { name: 'Production logger import', pattern: /disableConsoleLogs/ },
    { name: 'API rate limiters import', pattern: /apiRateLimiter/ },
    { name: 'AI endpoints rate limiter', pattern: /app\.use\('\/api\/ai', aiEndpointsLimiter\)/ },
    { name: 'Payment endpoints rate limiter', pattern: /app\.use\('\/api\/payment', paymentEndpointsLimiter\)/ },
    { name: 'Jobs endpoints rate limiter', pattern: /app\.use\('\/api\/jobs', jobsEndpointsLimiter\)/ },
    { name: 'Admin endpoints rate limiter', pattern: /app\.use\('\/api\/admin', adminEndpointsLimiter\)/ },
  ];
  
  for (const check of checks) {
    if (check.pattern.test(indexContent)) {
      console.log(`  ✅ ${check.name}`);
      passed++;
    } else {
      console.log(`  ❌ ${check.name} - NOT FOUND`);
      failed++;
    }
  }
} catch (error) {
  console.log(`  ❌ Error reading backend/index.js: ${error.message}`);
  failed++;
}

// Test 3: Check CORS configuration
console.log('\n🌐 Checking CORS configuration...');
try {
  const corsContent = await fs.promises.readFile('backend/config/cors.js', 'utf-8');
  
  if (corsContent.includes('allowedPorts.includes(parseInt(match[2], 10))')) {
    console.log('  ✅ CORS restricted to specific ports');
    passed++;
  } else {
    console.log('  ❌ CORS not properly restricted');
    failed++;
  }
} catch (error) {
  console.log(`  ❌ Error reading CORS config: ${error.message}`);
  failed++;
}

// Test 4: Check .env.example updates
console.log('\n🔐 Checking .env.example updates...');
try {
  const envContent = await fs.promises.readFile('backend/.env.example', 'utf-8');
  
  const envChecks = [
    { name: 'JWT_SECRET', pattern: /JWT_SECRET=/ },
    { name: 'JWT_REFRESH_SECRET', pattern: /JWT_REFRESH_SECRET=/ },
    { name: 'JWT_EXPIRES_IN', pattern: /JWT_EXPIRES_IN=/ },
    { name: 'JWT_REFRESH_EXPIRES_IN', pattern: /JWT_REFRESH_EXPIRES_IN=/ },
  ];
  
  for (const check of envChecks) {
    if (check.pattern.test(envContent)) {
      console.log(`  ✅ ${check.name} present`);
      passed++;
    } else {
      console.log(`  ❌ ${check.name} - MISSING`);
      failed++;
    }
  }
} catch (error) {
  console.log(`  ❌ Error reading .env.example: ${error.message}`);
  failed++;
}

// Test 5: Check package.json scripts
console.log('\n📦 Checking package.json scripts...');
try {
  const pkgContent = await fs.promises.readFile('package.json', 'utf-8');
  const pkg = JSON.parse(pkgContent);
  
  const scriptChecks = [
    'scan:secrets',
    'backup:db',
    'monitor:health',
    'generate:jwt',
    'lint:fix',
    'format',
  ];
  
  for (const script of scriptChecks) {
    if (pkg.scripts[script]) {
      console.log(`  ✅ ${script} script`);
      passed++;
    } else {
      console.log(`  ❌ ${script} script - MISSING`);
      failed++;
    }
  }
} catch (error) {
  console.log(`  ❌ Error reading package.json: ${error.message}`);
  failed++;
}

// Summary
console.log('\n' + '='.repeat(50));
console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed\n`);

if (failed === 0) {
  console.log('✅ All critical fixes verified successfully!\n');
  console.log('Next steps:');
  console.log('  1. Run: npm run generate:jwt');
  console.log('  2. Add secrets to backend/.env');
  console.log('  3. Run: npm run verify:setup:strict');
  console.log('  4. Run: npm run dev\n');
  process.exit(0);
} else {
  console.log('❌ Some tests failed. Please review the output above.\n');
  process.exit(1);
}
