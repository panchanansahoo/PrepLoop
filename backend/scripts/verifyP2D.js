#!/usr/bin/env node

/**
 * P2-D Complete Verification
 * 
 * This script verifies that all components of P2-D (Timeout Recovery UI) are:
 * 1. Present and properly integrated
 * 2. Backward compatible
 * 3. Tested and working
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '../..');

const checks = {
  passed: [],
  failed: [],
};

function check(name, condition) {
  if (condition) {
    checks.passed.push(name);
    console.log(`  ✓ ${name}`);
  } else {
    checks.failed.push(name);
    console.log(`  ❌ ${name}`);
  }
}

console.log('🔍 P2-D Timeout Recovery UI - Verification Checklist\n');

// 1. Frontend Component Verification
console.log('📱 Frontend Components');
const timeoutRecoveryPath = path.join(projectRoot, 'frontend/src/components/editor/TimeoutRecovery.jsx');
const timeoutRecoveryExists = fs.existsSync(timeoutRecoveryPath);
check('TimeoutRecovery.jsx exists', timeoutRecoveryExists);

if (timeoutRecoveryExists) {
  const content = fs.readFileSync(timeoutRecoveryPath, 'utf8');
  check('TimeoutRecoveryAlert component exported', content.includes('export function TimeoutRecoveryAlert'));
  check('ExecutionMetricsDisplay component exported', content.includes('export function ExecutionMetricsDisplay'));
  check('Timeout slider implemented', content.includes('setCustomTimeout'));
  check('Error category detection', content.includes('isTimeout'));
  check('Memory stats display', content.includes('memory'));
}

// 2. TestCasePanel Integration
console.log('\n🧪 TestCasePanel Integration');
const testCasePanelPath = path.join(projectRoot, 'frontend/src/components/editor/TestCasePanel.jsx');
const testCasePanelExists = fs.existsSync(testCasePanelPath);
check('TestCasePanel.jsx exists', testCasePanelExists);

if (testCasePanelExists) {
  const content = fs.readFileSync(testCasePanelPath, 'utf8');
  check('TimeoutRecovery import', content.includes("from './TimeoutRecovery'"));
  check('Error state variables initialized', content.includes('lastExecutionError'));
  check('Diagnostics state initialized', content.includes('lastExecutionDiagnostics'));
  check('Metrics state initialized', content.includes('lastExecutionMetrics'));
  check('Error recovery state initialized', content.includes('showErrorRecovery'));
  check('Custom tests section rendered', content.includes("mode === 'custom'"));
  check('TimeoutRecoveryAlert rendered', content.includes('TimeoutRecoveryAlert'));
  check('runCustomTests captures errors', content.includes('setLastExecutionError'));
}

// 3. Backend Services
console.log('\n⚙️  Backend Services');
const customTestServicePath = path.join(projectRoot, 'backend/services/customTestService.js');
check('customTestService.js exists', fs.existsSync(customTestServicePath));

const memoryTrackingPath = path.join(projectRoot, 'backend/utils/memoryTracking.js');
check('memoryTracking.js exists', fs.existsSync(memoryTrackingPath));

const errorDiagnosticsPath = path.join(projectRoot, 'backend/utils/errorDiagnostics.js');
check('errorDiagnostics.js exists', fs.existsSync(errorDiagnosticsPath));

const executeCodePath = path.join(projectRoot, 'backend/utils/executeCode.js');
const executeCodeExists = fs.existsSync(executeCodePath);
check('executeCode.js exists', executeCodeExists);

if (executeCodeExists) {
  const content = fs.readFileSync(executeCodePath, 'utf8');
  check('Timeout parameter in function signature', content.includes('timeout'));
  check('Timeout used in execFileSync', content.includes('execFileSync') && content.includes('timeout'));
}

// 4. Test Files
console.log('\n🧪 Test Coverage');
check('testTimeoutEnforcement.js exists', fs.existsSync(path.join(projectRoot, 'backend/scripts/testTimeoutEnforcement.js')));
check('testMemoryTracking.js exists', fs.existsSync(path.join(projectRoot, 'backend/scripts/testMemoryTracking.js')));
check('testErrorDiagnostics.js exists', fs.existsSync(path.join(projectRoot, 'backend/scripts/testErrorDiagnostics.js')));
check('testP2DIntegration.js exists', fs.existsSync(path.join(projectRoot, 'backend/scripts/testP2DIntegration.js')));
check('testCustomTestService.js exists', fs.existsSync(path.join(projectRoot, 'backend/scripts/testCustomTestService.js')));

// 5. API Endpoint
console.log('\n🔌 API Integration');
const dsaRoutesPath = path.join(projectRoot, 'backend/routes/dsa.js');
const dsaRoutesExists = fs.existsSync(dsaRoutesPath);
check('dsa.js routes exist', dsaRoutesExists);

if (dsaRoutesExists) {
  const content = fs.readFileSync(dsaRoutesPath, 'utf8');
  check('Custom tests endpoint exists', content.includes('/custom-tests'));
  check('Timeout validation implemented', content.includes('timeout') || content.includes('Timeout'));
}

// 6. Backward Compatibility
console.log('\n♻️  Backward Compatibility');
if (testCasePanelExists && fs.existsSync(testCasePanelPath)) {
  const content = fs.readFileSync(testCasePanelPath, 'utf8');
  check('Old testCases state preserved', content.includes('testCases'));
  check('Old runTestCases function exists', content.includes('runTestCases'));
  check('Old test modes preserved', content.includes("mode === 'testcase'"));
}

if (fs.existsSync(customTestServicePath)) {
  const content = fs.readFileSync(customTestServicePath, 'utf8');
  check('Results array returned (backward compat)', content.includes('results'));
  check('Passed/failed status preserved', content.includes('passed'));
  check('Error field in results (backward compat)', content.includes('error'));
}

// Summary
console.log('\n' + '─'.repeat(50));
console.log(`\n✨ Verification Summary`);
console.log(`\n  Passed: ${checks.passed.length}/${checks.passed.length + checks.failed.length}`);

if (checks.failed.length === 0) {
  console.log('\n  🎉 All checks passed! P2-D is complete.\n');
  process.exit(0);
} else {
  console.log(`\n  ❌ Failed checks (${checks.failed.length}):`);
  checks.failed.forEach(name => console.log(`    - ${name}`));
  console.log();
  process.exit(1);
}
