#!/usr/bin/env node

/**
 * Phase 3 UX Integration Verification
 * Checks that all Phase 3 components are properly integrated
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🎨 Phase 3 UX Integration Verification\n');
console.log('=' .repeat(70));

const frontendSrc = path.join(__dirname, '..', 'frontend', 'src');

// Check component files
console.log('\n📋 Checking Component Files...\n');

const components = [
  'context/ThemeContext.jsx',
  'components/ThemeToggle.jsx',
  'components/Skeleton.jsx',
  'components/ErrorBoundary.jsx',
  'components/Toast.jsx',
  'components/SkipLink.jsx',
  'hooks/useToast.js',
  'utils/errorHandler.js',
];

let allComponentsExist = true;
for (const component of components) {
  const filePath = path.join(frontendSrc, component);
  const exists = fs.existsSync(filePath);
  const status = exists ? '✅' : '❌';
  console.log(`${status} ${component}`);
  
  if (!exists) {
    allComponentsExist = false;
  }
}

if (!allComponentsExist) {
  console.log('\n❌ Some components are missing!');
  process.exit(1);
}

console.log('\n✅ All component files present!\n');

// Check App.jsx integration
console.log('🔍 Checking App.jsx Integration...\n');

const appJsxPath = path.join(frontendSrc, 'App.jsx');
const appJsxContent = fs.readFileSync(appJsxPath, 'utf-8');

const integrations = [
  { name: 'SkipLink import', pattern: /import SkipLink from ['"]\.\/components\/SkipLink['"]/ },
  { name: 'useToast import', pattern: /import.*useToast.*from ['"]\.\/hooks\/useToast['"]/ },
  { name: 'ToastContainer import', pattern: /import.*ToastContainer.*from ['"]\.\/hooks\/useToast['"]/ },
  { name: 'SkipLink usage', pattern: /<SkipLink\s*\/>/ },
  { name: 'ToastContainer usage', pattern: /<ToastContainer/ },
  { name: 'useToast hook', pattern: /const.*=.*useToast\(\)/ },
  { name: 'ThemeProvider', pattern: /<ThemeProvider>/ },
  { name: 'GlobalErrorBoundary', pattern: /<GlobalErrorBoundary>/ },
];

let allIntegrationsPresent = true;
for (const integration of integrations) {
  const found = integration.pattern.test(appJsxContent);
  const status = found ? '✅' : '❌';
  console.log(`${status} ${integration.name}`);
  
  if (!found) {
    allIntegrationsPresent = false;
  }
}

if (!allIntegrationsPresent) {
  console.log('\n⚠️  Some integrations are missing from App.jsx');
  console.log('\n💡 Run the integration guide in PHASE3_COMPLETE.md\n');
} else {
  console.log('\n✅ All integrations present in App.jsx!\n');
}

// Check package.json for dependencies
console.log('📦 Checking Frontend Dependencies...\n');

const packageJsonPath = path.join(__dirname, '..', 'frontend', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
const deps = packageJson.dependencies || {};

const requiredDeps = ['lucide-react'];
let allDepsInstalled = true;

for (const dep of requiredDeps) {
  const installed = deps[dep] !== undefined;
  const status = installed ? '✅' : '❌';
  console.log(`${status} ${dep}`);
  
  if (!installed) {
    allDepsInstalled = false;
  }
}

if (!allDepsInstalled) {
  console.log('\n⚠️  Some dependencies are missing');
  console.log('\n💡 Install with: cd frontend && npm install lucide-react\n');
} else {
  console.log('\n✅ All dependencies installed!\n');
}

// Summary
console.log('='.repeat(70));
console.log('\n📊 VERIFICATION SUMMARY\n');

if (allComponentsExist && allIntegrationsPresent && allDepsInstalled) {
  console.log('✅ ALL CHECKS PASSED!\n');
  console.log('Phase 3 is fully integrated and ready to use.\n');
  console.log('🎯 Next Steps:');
  console.log('   1. Start dev server: cd frontend && npm run dev');
  console.log('   2. Test theme toggle in header');
  console.log('   3. Trigger toast: window.toast.success("Test")');
  console.log('   4. Verify loading skeletons on slow pages');
  console.log('   5. Test error boundary by causing an error\n');
} else {
  console.log('⚠️  SOME CHECKS FAILED\n');
  console.log('Please review the issues above and fix them.\n');
  console.log('📚 See PHASE3_COMPLETE.md for integration guide\n');
}

console.log('='.repeat(70));
console.log('\n✨ Verification complete!\n');
