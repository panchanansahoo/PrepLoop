#!/usr/bin/env node

/**
 * Comprehensive test script for all improvements
 */

import { spawn } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60) + '\n');
}

async function runCommand(command, args, cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: true,
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    proc.on('error', reject);
  });
}

async function checkFile(filePath, description) {
  if (existsSync(filePath)) {
    log(`✓ ${description}`, 'green');
    return true;
  } else {
    log(`✗ ${description}`, 'red');
    return false;
  }
}

async function checkEnvVariable(envPath, variable) {
  try {
    const envContent = readFileSync(envPath, 'utf-8');
    if (envContent.includes(variable)) {
      log(`✓ ${variable} found in ${envPath}`, 'green');
      return true;
    } else {
      log(`✗ ${variable} missing in ${envPath}`, 'yellow');
      return false;
    }
  } catch (error) {
    log(`✗ Could not read ${envPath}`, 'red');
    return false;
  }
}

async function testSecurity() {
  logSection('🔐 Security Tests');

  const checks = [
    await checkFile('backend/middleware/sanitization.js', 'Input sanitization middleware'),
    await checkFile('backend/config/cors.js', 'CORS configuration'),
    await checkFile('backend/middleware/requestValidation.js', 'Request validation'),
    await checkFile('backend/config/envValidation.js', 'Environment validation'),
    await checkEnvVariable('backend/.env.example', 'JWT_SECRET'),
    await checkEnvVariable('backend/.env.example', 'JWT_REFRESH_SECRET'),
  ];

  const passed = checks.filter(Boolean).length;
  const total = checks.length;

  log(`\nSecurity checks: ${passed}/${total} passed`, passed === total ? 'green' : 'yellow');
  return passed === total;
}

async function testPerformance() {
  logSection('⚡ Performance Tests');

  const checks = [
    await checkFile('backend/utils/cacheManager.js', 'Cache manager'),
    await checkFile('backend/utils/dbOptimizer.js', 'Database optimizer'),
  ];

  const passed = checks.filter(Boolean).length;
  const total = checks.length;

  log(`\nPerformance checks: ${passed}/${total} passed`, passed === total ? 'green' : 'yellow');
  return passed === total;
}

async function testFrontend() {
  logSection('🎨 Frontend Tests');

  const checks = [
    await checkFile('frontend/src/components/ErrorBoundary.jsx', 'Enhanced error boundary'),
    await checkFile('frontend/src/utils/apiClient.js', 'API client with retry'),
    await checkFile('frontend/src/utils/monitoring.js', 'Monitoring utilities'),
  ];

  const passed = checks.filter(Boolean).length;
  const total = checks.length;

  log(`\nFrontend checks: ${passed}/${total} passed`, passed === total ? 'green' : 'yellow');
  return passed === total;
}

async function testDependencies() {
  logSection('📦 Dependency Tests');

  log('Checking backend dependencies...', 'blue');
  try {
    const backendPkg = JSON.parse(readFileSync('backend/package.json', 'utf-8'));
    const requiredDeps = ['express', 'cors', 'helmet', 'joi', 'compression', 'redis'];
    
    let allFound = true;
    for (const dep of requiredDeps) {
      if (backendPkg.dependencies[dep]) {
        log(`✓ ${dep} installed`, 'green');
      } else {
        log(`✗ ${dep} missing`, 'red');
        allFound = false;
      }
    }

    return allFound;
  } catch (error) {
    log('✗ Could not read backend package.json', 'red');
    return false;
  }
}

async function testLinting() {
  logSection('🔍 Linting Tests');

  try {
    log('Running backend lint...', 'blue');
    await runCommand('npm', ['run', 'lint'], 'backend');
    log('✓ Backend lint passed', 'green');
    return true;
  } catch (error) {
    log('✗ Backend lint failed', 'red');
    return false;
  }
}

async function testEnvironment() {
  logSection('🌍 Environment Tests');

  const checks = [
    await checkFile('backend/.env.example', 'Backend .env.example'),
    await checkFile('frontend/.env.example', 'Frontend .env.example'),
  ];

  // Check if actual .env files exist
  if (existsSync('backend/.env')) {
    log('✓ Backend .env exists', 'green');
    checks.push(true);
  } else {
    log('⚠ Backend .env not found (create from .env.example)', 'yellow');
    checks.push(false);
  }

  if (existsSync('frontend/.env')) {
    log('✓ Frontend .env exists', 'green');
    checks.push(true);
  } else {
    log('⚠ Frontend .env not found (create from .env.example)', 'yellow');
    checks.push(false);
  }

  const passed = checks.filter(Boolean).length;
  const total = checks.length;

  log(`\nEnvironment checks: ${passed}/${total} passed`, passed === total ? 'green' : 'yellow');
  return passed === total;
}

async function generateReport(results) {
  logSection('📊 Test Report');

  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  const failedTests = totalTests - passedTests;

  console.log('Test Results:');
  console.log('─'.repeat(60));

  for (const [test, passed] of Object.entries(results)) {
    const status = passed ? '✓ PASS' : '✗ FAIL';
    const color = passed ? 'green' : 'red';
    log(`${status.padEnd(10)} ${test}`, color);
  }

  console.log('─'.repeat(60));
  log(`\nTotal: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`, 
    failedTests === 0 ? 'green' : 'yellow');

  if (failedTests === 0) {
    log('\n🎉 All tests passed! Your improvements are ready.', 'green');
  } else {
    log('\n⚠️  Some tests failed. Please review the issues above.', 'yellow');
  }

  return failedTests === 0;
}

async function main() {
  log('\n🚀 PrepLoop Improvements Test Suite\n', 'cyan');
  log('Testing all implemented improvements...\n', 'blue');

  const results = {
    'Security': await testSecurity(),
    'Performance': await testPerformance(),
    'Frontend': await testFrontend(),
    'Dependencies': await testDependencies(),
    'Environment': await testEnvironment(),
  };

  // Skip linting in CI or if explicitly disabled
  if (!process.env.SKIP_LINT) {
    results['Linting'] = await testLinting();
  }

  const allPassed = await generateReport(results);

  process.exit(allPassed ? 0 : 1);
}

main().catch((error) => {
  log(`\n❌ Test suite failed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
