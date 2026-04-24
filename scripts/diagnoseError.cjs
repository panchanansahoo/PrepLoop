#!/usr/bin/env node

/**
 * Diagnostic script to identify implementation issues
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 Running diagnostics...\n');

const checks = [
  {
    name: 'Node.js Version',
    check: () => {
      const version = process.version;
      const major = parseInt(version.slice(1));
      return {
        pass: major >= 18,
        message: `${version} ${major >= 18 ? '✓' : '✗ (Need 18+)'}`
      };
    }
  },
  {
    name: 'Backend Directory',
    check: () => ({
      pass: fs.existsSync('backend'),
      message: fs.existsSync('backend') ? 'Found ✓' : 'Missing ✗'
    })
  },
  {
    name: 'Frontend Directory',
    check: () => ({
      pass: fs.existsSync('frontend'),
      message: fs.existsSync('frontend') ? 'Found ✓' : 'Missing ✗'
    })
  },
  {
    name: 'dbPoolUnified.js',
    check: () => ({
      pass: fs.existsSync('backend/config/dbPoolUnified.js'),
      message: fs.existsSync('backend/config/dbPoolUnified.js') ? 'Found ✓' : 'Missing ✗'
    })
  },
  {
    name: 'securityEnhanced.js',
    check: () => ({
      pass: fs.existsSync('backend/middleware/securityEnhanced.js'),
      message: fs.existsSync('backend/middleware/securityEnhanced.js') ? 'Found ✓' : 'Missing ✗'
    })
  },
  {
    name: 'apiCache.js',
    check: () => ({
      pass: fs.existsSync('backend/middleware/apiCache.js'),
      message: fs.existsSync('backend/middleware/apiCache.js') ? 'Found ✓' : 'Missing ✗'
    })
  },
  {
    name: 'rateLimiterAdvanced.js',
    check: () => ({
      pass: fs.existsSync('backend/middleware/rateLimiterAdvanced.js'),
      message: fs.existsSync('backend/middleware/rateLimiterAdvanced.js') ? 'Found ✓' : 'Missing ✗'
    })
  },
  {
    name: 'vite.config.optimized.js',
    check: () => ({
      pass: fs.existsSync('frontend/vite.config.optimized.js'),
      message: fs.existsSync('frontend/vite.config.optimized.js') ? 'Found ✓' : 'Missing ✗'
    })
  },
  {
    name: 'monitoring-enhanced.js',
    check: () => ({
      pass: fs.existsSync('backend/routes/monitoring-enhanced.js'),
      message: fs.existsSync('backend/routes/monitoring-enhanced.js') ? 'Found ✓' : 'Missing ✗'
    })
  },
  {
    name: 'Backend index.js',
    check: () => ({
      pass: fs.existsSync('backend/index.js'),
      message: fs.existsSync('backend/index.js') ? 'Found ✓' : 'Missing ✗'
    })
  }
];

let allPassed = true;
const missingFiles = [];

console.log('📋 Checking prerequisites:\n');

checks.forEach(({ name, check }) => {
  const result = check();
  console.log(`  ${name}: ${result.message}`);
  
  if (!result.pass) {
    allPassed = false;
    if (name.includes('.js')) {
      missingFiles.push(name);
    }
  }
});

console.log('\n' + '='.repeat(60) + '\n');

if (allPassed) {
  console.log('✅ All checks passed! You can run the implementation script.\n');
  console.log('Run: node scripts/implementImprovements.js\n');
} else {
  console.log('❌ Some checks failed!\n');
  
  if (missingFiles.length > 0) {
    console.log('Missing improvement files:');
    missingFiles.forEach(file => console.log(`  - ${file}`));
    console.log('\n⚠️  The improvement files need to be created first.');
    console.log('These files should have been provided in the previous conversation.\n');
  }
  
  console.log('Please fix the issues above before running the implementation.\n');
}

// Additional check: Try to import the implementation script
console.log('🔍 Checking implementation script syntax...\n');

try {
  const scriptPath = path.join(process.cwd(), 'scripts', 'implementImprovements.js');
  const scriptContent = fs.readFileSync(scriptPath, 'utf8');
  
  // Basic syntax checks
  if (!scriptContent.includes('class ImplementationManager')) {
    console.log('⚠️  Implementation script structure issue detected\n');
  } else {
    console.log('✓ Implementation script structure looks good\n');
  }
} catch (error) {
  console.log(`✗ Error reading implementation script: ${error.message}\n`);
}

console.log('Diagnostic complete!\n');
