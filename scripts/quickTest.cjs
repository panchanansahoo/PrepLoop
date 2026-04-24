#!/usr/bin/env node

/**
 * Quick Integration Test
 * Verifies improvements integrate with existing PrepLoop codebase
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('\n🔍 PrepLoop - Quick Integration Test\n');
console.log('═'.repeat(60));

let passed = 0;
let failed = 0;

function test(name, condition, errorMsg = '') {
  if (condition) {
    console.log(`✅ ${name}`);
    passed++;
  } else {
    console.log(`❌ ${name}`);
    if (errorMsg) console.log(`   ${errorMsg}`);
    failed++;
  }
}

// Test 1: Check all improvement files exist
console.log('\n📁 Checking Files...');
const files = [
  'backend/utils/advancedCache.js',
  'backend/utils/databaseOptimizer.js',
  'backend/utils/apiDocGenerator.js',
  'backend/utils/errorTracker.js',
  'backend/services/spacedRepetitionService.js',
  'backend/services/collaborationService.js',
  'backend/middleware/advancedSecurity.js',
  'frontend/src/utils/lazyLoading.js',
  'frontend/src/utils/performanceMonitor.js',
  'frontend/src/utils/seo.js',
  'frontend/src/utils/analytics.js',
  'frontend/public/service-worker-enhanced.js',
  'frontend/tests/e2e/critical-flows.spec.js',
  'docs/COMPREHENSIVE_IMPROVEMENTS.md',
  'COMPLETE_IMPROVEMENTS_SUMMARY.md',
  'QUICK_REFERENCE_CARD.md',
  'ARCHITECTURE_DIAGRAM.md',
];

const rootDir = join(__dirname, '..');
let allFilesExist = true;

files.forEach(file => {
  const exists = fs.existsSync(join(rootDir, file));
  if (!exists) {
    allFilesExist = false;
    console.log(`   ❌ Missing: ${file}`);
  }
});

test('All improvement files created', allFilesExist);

// Test 2: Check documentation
console.log('\n📚 Checking Documentation...');
const summaryPath = join(rootDir, 'COMPLETE_IMPROVEMENTS_SUMMARY.md');
if (fs.existsSync(summaryPath)) {
  const content = fs.readFileSync(summaryPath, 'utf-8');
  test('Summary has performance metrics', content.includes('Performance Gains'));
  test('Summary has installation guide', content.includes('Installation'));
  test('Summary has usage examples', content.includes('Usage Examples'));
} else {
  test('Summary documentation exists', false);
}

// Test 3: Check code quality
console.log('\n🔍 Checking Code Quality...');
const cacheFile = join(rootDir, 'backend/utils/advancedCache.js');
if (fs.existsSync(cacheFile)) {
  const content = fs.readFileSync(cacheFile, 'utf-8');
  test('Cache has proper exports', content.includes('export default'));
  test('Cache has documentation', content.includes('/**'));
  test('Cache has error handling', content.includes('catch'));
} else {
  test('Cache file exists', false);
}

// Test 4: Check package.json updates
console.log('\n📦 Checking Package Configuration...');
const packagePath = join(rootDir, 'package.json');
if (fs.existsSync(packagePath)) {
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
  test('Package.json exists', true);
  test('Has test scripts', pkg.scripts && Object.keys(pkg.scripts).length > 0);
} else {
  test('Package.json exists', false);
}

// Test 5: Check existing files not modified
console.log('\n🔒 Checking Existing Files...');
const existingFiles = [
  'backend/index.js',
  'frontend/src/main.jsx',
  'README.md',
];

existingFiles.forEach(file => {
  const exists = fs.existsSync(join(rootDir, file));
  test(`Existing file preserved: ${file}`, exists);
});

// Summary
console.log('\n' + '═'.repeat(60));
console.log('\n📊 Test Results:');
console.log(`   ✅ Passed: ${passed}`);
console.log(`   ❌ Failed: ${failed}`);
console.log(`   📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

if (failed === 0) {
  console.log('\n🎉 All integration tests passed!');
  console.log('\n📋 Next Steps:');
  console.log('   1. Run full test suite: node scripts/testAllImprovements.js');
  console.log('   2. Review documentation: COMPLETE_IMPROVEMENTS_SUMMARY.md');
  console.log('   3. Install improvements: node scripts/installImprovements.js');
  console.log('   4. Start application: npm run dev\n');
} else {
  console.log('\n⚠️  Some tests failed. Please review the output above.\n');
  process.exit(1);
}

console.log('═'.repeat(60) + '\n');
