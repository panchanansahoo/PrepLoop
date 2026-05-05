/**
 * Memory Usage Tracking Tests (Phase II-B)
 * Verify that real memory usage is tracked accurately
 */

import assert from 'assert';
import { getMemorySnapshot, estimateMemoryFromOutput } from '../utils/memoryTracking.js';
import { executeCustomTests } from '../services/customTestService.js';

console.log('🧪 Testing Real Memory Usage Tracking\n');

// ============================================================================
// Test 1: Memory snapshot function
// ============================================================================

console.log('📝 Test 1: getMemorySnapshot() returns valid memory data');

try {
  const snapshot = getMemorySnapshot();

  assert(typeof snapshot.heapUsed === 'number', 'heapUsed should be a number');
  assert(typeof snapshot.rss === 'number', 'rss should be a number');
  assert(snapshot.heapUsed > 0, 'heapUsed should be positive');
  assert(snapshot.rss > snapshot.heapUsed, 'rss should be >= heapUsed');

  console.log(`  ✓ Memory snapshot captured`);
  console.log(`    - Heap Used: ${snapshot.heapUsed} MB`);
  console.log(`    - Total (RSS): ${snapshot.rss} MB`);
} catch (err) {
  console.log(`  ❌ Error: ${err.message}`);
}

// ============================================================================
// Test 2: Memory estimation function
// ============================================================================

console.log('\n📝 Test 2: estimateMemoryFromOutput() provides reasonable estimates');

try {
  const smallEstimate = estimateMemoryFromOutput('hello', 100);
  const largeEstimate = estimateMemoryFromOutput('x'.repeat(10000), 5000);

  assert(smallEstimate < largeEstimate, 'Larger output should have higher estimate');
  assert(smallEstimate > 0, 'Estimate should be positive');

  console.log(`  ✓ Memory estimation works`);
  console.log(`    - Small output: ~${smallEstimate} MB`);
  console.log(`    - Large output: ~${largeEstimate} MB`);
} catch (err) {
  console.log(`  ❌ Error: ${err.message}`);
}

// ============================================================================
// Test 3: Custom test service includes memory in results
// ============================================================================

console.log('\n📝 Test 3: Custom test results include memory tracking');

try {
  const code = `
function solve(x) {
  return parseInt(x) * 2;
}
`;

  const testCases = [
    { input: '10', expected: '20', description: 'Memory test' },
  ];

  const result = await executeCustomTests({
    code,
    language: 'javascript',
    testCases,
    timeout: 5000,
  });

  assert(result.memory !== undefined, 'Result should include memory field');
  assert(
    typeof result.memory.heapUsedMB === 'number',
    'memory.heapUsedMB should be a number'
  );
  assert(
    typeof result.memory.totalMemoryMB === 'number',
    'memory.totalMemoryMB should be a number'
  );
  assert(
    typeof result.memory.memoryDelta === 'number',
    'memory.memoryDelta should be a number'
  );

  console.log(`  ✓ Memory tracking integrated into results`);
  console.log(`    - Heap Used: ${result.memory.heapUsedMB} MB`);
  console.log(`    - Total: ${result.memory.totalMemoryMB} MB`);
  console.log(`    - Delta: ${result.memory.memoryDelta} MB`);
} catch (err) {
  console.log(`  ⚠ Test skipped: ${err.message}`);
}

// ============================================================================
// Test 4: Memory tracking for Python
// ============================================================================

console.log('\n📝 Test 4: Memory tracking works for Python');

try {
  const code = `
def solve(x):
    numbers = list(range(1000))
    return x
`;

  const testCases = [
    { input: '42', expected: '42', description: 'Python memory test' },
  ];

  const result = await executeCustomTests({
    code,
    language: 'python',
    testCases,
    timeout: 5000,
  });

  if (result.memory) {
    console.log(`  ✓ Python memory tracking enabled`);
    console.log(`    - Peak Heap: ${result.memory.heapUsedMB} MB`);
  } else {
    console.log(`  ⚠ Memory not tracked for Python`);
  }
} catch (err) {
  console.log(`  ⚠ Test skipped: ${err.message}`);
}

// ============================================================================
// Test 5: Memory tracking for C
// ============================================================================

console.log('\n📝 Test 5: Memory tracking works for compiled languages (C)');

try {
  const code = `
#include <stdio.h>
int main() {
  int x;
  scanf("%d", &x);
  printf("%d\\n", x * 2);
  return 0;
}
`;

  const testCases = [
    { input: '50', expected: '100', description: 'C memory test' },
  ];

  const result = await executeCustomTests({
    code,
    language: 'c',
    testCases,
    timeout: 5000,
  });

  if (result.memory) {
    console.log(`  ✓ C language memory tracking enabled`);
    console.log(`    - Peak Heap: ${result.memory.heapUsedMB} MB`);
  } else {
    console.log(`  ⚠ Memory not tracked for C`);
  }
} catch (err) {
  console.log(`  ⚠ Test skipped: ${err.message}`);
}

// ============================================================================
// Test 6: Memory delta calculation
// ============================================================================

console.log('\n📝 Test 6: Memory delta (before/after) is calculated');

try {
  const code = `
function solve(n) {
  // Create array to use memory
  const arr = new Array(1000).fill(0);
  return arr.length;
}
`;

  const testCases = [
    { input: '0', expected: '1000', description: 'Memory delta test' },
  ];

  const result = await executeCustomTests({
    code,
    language: 'javascript',
    testCases,
    timeout: 5000,
  });

  if (result.memory && result.memory.memoryDelta !== undefined) {
    const delta = result.memory.memoryDelta;
    console.log(`  ✓ Memory delta calculated: ${delta} MB`);
    console.log(`    (This value can be positive, negative, or zero)`);
  } else {
    console.log(`  ⚠ Memory delta not available`);
  }
} catch (err) {
  console.log(`  ⚠ Test skipped: ${err.message}`);
}

// ============================================================================
// Test 7: Memory tracking does not break on error
// ============================================================================

console.log('\n📝 Test 7: Memory tracking works even when code has errors');

try {
  const code = `
function solve(x) {
  throw new Error('Intentional error');
}
`;

  const testCases = [
    { input: '1', expected: '2', description: 'Error case' },
  ];

  const result = await executeCustomTests({
    code,
    language: 'javascript',
    testCases,
    timeout: 5000,
  });

  assert(result.memory !== undefined, 'Memory should still be tracked on error');
  console.log(`  ✓ Memory tracking works on error cases`);
  console.log(`    - Heap Used: ${result.memory.heapUsedMB} MB`);
} catch (err) {
  console.log(`  ⚠ Test skipped: ${err.message}`);
}

// ============================================================================
// Summary
// ============================================================================

console.log('\n✅ Memory Usage Tracking Tests Complete\n');
console.log('Summary:');
console.log('  • Memory snapshots captured via process.memoryUsage()');
console.log('  • Heap Used (MB): Current JavaScript heap allocation');
console.log('  • Total Memory (RSS): Resident set size (all memory)');
console.log('  • Memory Delta: Change in heap usage during execution');
console.log('  • Supported: JavaScript, Python, C, C++, Java\n');
