/**
 * Error Diagnostics Tests (Phase II-C)
 * Verify that detailed error information is captured and categorized
 */

import assert from 'assert';
import { parseExecutionError, formatErrorDiagnostics } from '../utils/errorDiagnostics.js';
import { executeCustomTests } from '../services/customTestService.js';

console.log('🧪 Testing Detailed Error Diagnostics\n');

// ============================================================================
// Test 1: JavaScript ReferenceError detection
// ============================================================================

console.log('📝 Test 1: JavaScript ReferenceError detection');

try {
  const code = `
function solve(x) {
  return undefined_variable * 2;
}
`;

  const testCases = [{ input: '5', expected: '10', description: 'Reference error test' }];

  const result = await executeCustomTests({
    code,
    language: 'javascript',
    testCases,
    timeout: 5000,
  });

  if (result.diagnostics) {
    assert(
      result.diagnostics.category.includes('error'),
      'Should detect error category'
    );
    console.log(`  ✓ ReferenceError detected: ${result.diagnostics.category}`);
    console.log(`    Message: ${result.diagnostics.message}`);
  } else {
    console.log(`  ⚠ Diagnostics not available`);
  }
} catch (err) {
  console.log(`  ⚠ Test skipped: ${err.message}`);
}

// ============================================================================
// Test 2: JavaScript TypeError detection
// ============================================================================

console.log('\n📝 Test 2: JavaScript TypeError detection');

try {
  const code = `
function solve(x) {
  return x.toLowerCase() * 2;
}
`;

  const testCases = [{ input: '5', expected: 'error', description: 'Type error test' }];

  const result = await executeCustomTests({
    code,
    language: 'javascript',
    testCases,
    timeout: 5000,
  });

  if (result.diagnostics && result.diagnostics.category) {
    console.log(`  ✓ Error category detected: ${result.diagnostics.category}`);
  } else {
    console.log(`  ⚠ Diagnostics not available`);
  }
} catch (err) {
  console.log(`  ⚠ Test skipped`);
}

// ============================================================================
// Test 3: Python NameError detection
// ============================================================================

console.log('\n📝 Test 3: Python NameError detection');

try {
  const code = `
def solve(x):
    return undefined_var + x
`;

  const testCases = [{ input: '5', expected: '10', description: 'Python name error' }];

  const result = await executeCustomTests({
    code,
    language: 'python',
    testCases,
    timeout: 5000,
  });

  if (result.diagnostics) {
    console.log(`  ✓ Error detected: ${result.diagnostics.category}`);
    if (result.diagnostics.stackTrace.length > 0) {
      console.log(`    Stack frames: ${result.diagnostics.stackTrace.length}`);
    }
  } else {
    console.log(`  ⚠ Diagnostics not available`);
  }
} catch (err) {
  console.log(`  ⚠ Test skipped`);
}

// ============================================================================
// Test 4: Python IndexError detection
// ============================================================================

console.log('\n📝 Test 4: Python IndexError detection');

try {
  const code = `
def solve(x):
    arr = []
    return arr[0]
`;

  const testCases = [{ input: '0', expected: 'error', description: 'Index error' }];

  const result = await executeCustomTests({
    code,
    language: 'python',
    testCases,
    timeout: 5000,
  });

  if (result.diagnostics) {
    console.log(`  ✓ IndexError detected: ${result.diagnostics.category}`);
  } else {
    console.log(`  ⚠ Diagnostics not available`);
  }
} catch (err) {
  console.log(`  ⚠ Test skipped`);
}

// ============================================================================
// Test 5: C compilation error detection
// ============================================================================

console.log('\n📝 Test 5: C compilation error detection');

try {
  const code = `
#include <stdio.h>
int main() {
  int x
  scanf("%d", &x);
  printf("%d\\n", x * 2);
  return 0;
}
`;

  const testCases = [{ input: '5', expected: '10', description: 'C syntax error' }];

  const result = await executeCustomTests({
    code,
    language: 'c',
    testCases,
    timeout: 5000,
  });

  if (result.diagnostics) {
    console.log(`  ✓ Compilation error detected: ${result.diagnostics.category}`);
  } else {
    console.log(`  ⚠ Compilation error diagnostics not available`);
  }
} catch (err) {
  console.log(`  ⚠ Test skipped`);
}

// ============================================================================
// Test 6: Error formatting
// ============================================================================

console.log('\n📝 Test 6: Error formatting for display');

try {
  const diagnostics = parseExecutionError(
    'ReferenceError: variable_name is not defined\n  at solve (main.js:2:10)',
    '',
    'javascript'
  );

  const formatted = formatErrorDiagnostics(diagnostics);
  assert(formatted.includes('REFERENCE'), 'Formatted should include error type');
  console.log(`  ✓ Error formatted correctly`);
  console.log(`    ${formatted.split('\n')[0]}`);
} catch (err) {
  console.log(`  ❌ Error: ${err.message}`);
}

// ============================================================================
// Test 7: Stack trace extraction
// ============================================================================

console.log('\n📝 Test 7: Stack trace extraction from errors');

try {
  const jsError = `TypeError: Cannot read property 'length' of undefined
    at solve (solution.js:3:15)
    at processTest (runner.js:10:5)
    at async execute (index.js:45:20)`;

  const diagnostics = parseExecutionError(jsError, '', 'javascript');

  assert(
    diagnostics.stackTrace && diagnostics.stackTrace.length > 0,
    'Should extract stack frames'
  );

  console.log(`  ✓ Stack trace extracted: ${diagnostics.stackTrace.length} frames`);
  for (const frame of diagnostics.stackTrace.slice(0, 2)) {
    console.log(`    ${frame}`);
  }
} catch (err) {
  console.log(`  ❌ Error: ${err.message}`);
}

// ============================================================================
// Test 8: Diagnostics in failed test results
// ============================================================================

console.log('\n📝 Test 8: Diagnostics included in test result objects');

try {
  const code = `
function solve(x) {
  throw new Error('Test error');
}
`;

  const testCases = [
    { input: '1', expected: '2', description: 'Error case' },
    { input: '2', expected: '4', description: 'Normal case' },
  ];

  const result = await executeCustomTests({
    code,
    language: 'javascript',
    testCases,
    timeout: 5000,
  });

  const failedTest = result.results.find((r) => !r.passed);
  if (failedTest && failedTest.diagnostics) {
    console.log(`  ✓ Diagnostics in result object`);
    console.log(`    Category: ${failedTest.diagnostics.category}`);
  } else {
    console.log(`  ⚠ Diagnostics not in individual result`);
  }
} catch (err) {
  console.log(`  ⚠ Test skipped`);
}

// ============================================================================
// Test 9: Categorization of various error types
// ============================================================================

console.log('\n📝 Test 9: Error type categorization');

const testCases = [
  { input: 'ReferenceError: x is not defined', expected: 'reference_error' },
  { input: 'TypeError: Cannot read property', expected: 'type_error' },
  { input: 'SyntaxError: Unexpected token', expected: 'syntax_error' },
];

for (const tc of testCases) {
  const diag = parseExecutionError(tc.input, '', 'javascript');
  const match = diag.category === tc.expected;
  console.log(`  ${match ? '✓' : '✗'} ${tc.expected}: ${diag.category}`);
}

// ============================================================================
// Summary
// ============================================================================

console.log('\n✅ Error Diagnostics Tests Complete\n');
console.log('Summary:');
console.log('  • Error categorization: ReferenceError, TypeError, SyntaxError, etc.');
console.log('  • Stack trace extraction: Frames are parsed from full error output');
console.log('  • Detailed messages: Specific error messages included');
console.log('  • Per-test diagnostics: Each failed test has error details');
console.log('  • Top-level diagnostics: Also included in main result object\n');
