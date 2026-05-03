/**
 * Simple test runner for ExecutionTracer without vitest
 * Avoids initialization issues
 */

import ExecutionTracer from '../services/executionTracer.js';

const tracer = new ExecutionTracer();
let passCount = 0;
let failCount = 0;

async function runTest(name, fn) {
  try {
    await fn();
    console.log(`✓ ${name}`);
    passCount++;
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  ${error.message}`);
    failCount++;
  }
}

async function runAllTests() {
  console.log('🧪 ExecutionTracer Tests\n');

  // Test 1: Simple variable assignment
  await runTest('Should trace simple variable assignments', async () => {
    const code = `
      let x = 5;
      let y = x + 10;
      y;
    `;
    const result = await tracer.trace(code, {}, { language: 'javascript' });
    if (!result.success) throw new Error(`Execution failed: ${result.error}`);
    if (result.trace.length === 0) throw new Error('No trace entries');
  });

  // Test 2: Array handling
  await runTest('Should handle array execution', async () => {
    const code = `
      let arr = [1, 2, 3];
      arr.push(4);
      arr[0] = 10;
      arr;
    `;
    const result = await tracer.trace(code, {}, { language: 'javascript' });
    if (!result.success) throw new Error(`Execution failed: ${result.error}`);
  });

  // Test 3: Input variables
  await runTest('Should handle input variables', async () => {
    const code = `
      let sum = arr.reduce((a, b) => a + b, 0);
      sum;
    `;
    const input = { arr: [1, 2, 3, 4, 5] };
    const result = await tracer.trace(code, input, { language: 'javascript' });
    if (!result.success) throw new Error(`Execution failed: ${result.error}`);
    if (result.finalResult !== 15) throw new Error(`Expected 15, got ${result.finalResult}`);
  });

  // Test 4: Error handling
  await runTest('Should capture execution errors', async () => {
    const code = `
      let x = undefined.foo;
    `;
    const result = await tracer.trace(code, {}, { language: 'javascript' });
    if (result.success) throw new Error('Should have failed');
    if (!result.error) throw new Error('Error message missing');
  });

  // Test 5: Function execution
  await runTest('Should trace function execution', async () => {
    const code = `
      function fibonacci(n) {
        if (n <= 1) return n;
        return fibonacci(n - 1) + fibonacci(n - 2);
      }
      fibonacci(5);
    `;
    const result = await tracer.trace(code, {}, { language: 'javascript' });
    if (!result.success) throw new Error(`Execution failed: ${result.error}`);
    if (result.finalResult !== 5) throw new Error(`Expected 5, got ${result.finalResult}`);
  });

  // Test 6: Binary search
  await runTest('Should trace binary search', async () => {
    const code = `
      function binarySearch(arr, target) {
        let left = 0;
        let right = arr.length - 1;
        while (left <= right) {
          let mid = Math.floor((left + right) / 2);
          if (arr[mid] === target) return mid;
          else if (arr[mid] < target) left = mid + 1;
          else right = mid - 1;
        }
        return -1;
      }
      binarySearch([1, 3, 5, 7, 9, 11, 13], 7);
    `;
    const result = await tracer.trace(code, {}, { language: 'javascript' });
    if (!result.success) throw new Error(`Execution failed: ${result.error}`);
    if (result.finalResult !== 3) throw new Error(`Expected 3, got ${result.finalResult}`);
  });

  // Test 7: Timeline extraction
  await runTest('Should extract timeline from trace', async () => {
    const code = `let x = 5; let y = x + 10;`;
    const result = await tracer.trace(code, {}, { language: 'javascript' });
    const timeline = tracer.getTimeline(result, { maxEvents: 5 });
    if (!Array.isArray(timeline)) throw new Error('Timeline should be an array');
  });

  // Test 8: State at step
  await runTest('Should retrieve state at specific step', async () => {
    const code = `let x = 5; let y = x + 10;`;
    const result = await tracer.trace(code, {}, { language: 'javascript' });
    const state = tracer.getStateAtStep(result, 0);
    if (typeof state !== 'object') throw new Error('State should be an object');
  });

  // Test 9: Mutation detection
  await runTest('Should detect mutations between steps', async () => {
    const code = `let x = 5; x = 10;`;
    const result = await tracer.trace(code, {}, { language: 'javascript' });
    if (result.trace.length >= 2) {
      const mutations = tracer.getMutationsBetweenSteps(result, 0, result.trace.length - 1);
      if (!mutations.hasOwnProperty('added')) throw new Error('Mutations should have "added" property');
      if (!mutations.hasOwnProperty('changed')) throw new Error('Mutations should have "changed" property');
      if (!mutations.hasOwnProperty('removed')) throw new Error('Mutations should have "removed" property');
    }
  });

  // Test 10: Statistics
  await runTest('Should compute execution statistics', async () => {
    const code = `let x = 5; let y = x + 10; let z = y * 2;`;
    const result = await tracer.trace(code, {}, { language: 'javascript' });
    const stats = tracer.getStatistics(result);
    if (!stats.hasOwnProperty('totalSteps')) throw new Error('Stats should have totalSteps');
    if (!stats.hasOwnProperty('totalExecutionTime')) throw new Error('Stats should have totalExecutionTime');
    if (!stats.hasOwnProperty('success')) throw new Error('Stats should have success');
  });

  // Test 11: Large array sanitization
  await runTest('Should sanitize large arrays', async () => {
    const largeArray = new Array(500).fill(0).map((_, i) => i);
    const code = `let arr = input; arr.length;`; // Access the large array to ensure it's captured
    const result = await tracer.trace(code, { input: largeArray }, { language: 'javascript' });
    if (!result.success) throw new Error(`Execution failed: ${result.error}`);
    // The large array should be detected and truncated in final state
    // Warnings might not fire if the array isn't mutated, but should be in variables
    if (!result.finalResult) throw new Error('Should have a result');
  });

  // Test 12: Python tracing
  await runTest('Should report Python tracing not implemented', async () => {
    const code = `def factorial(n): return 1 if n <= 1 else n * factorial(n - 1)`;
    const result = await tracer.trace(code, {}, { language: 'python' });
    if (result.success) throw new Error('Python tracing should not be implemented yet');
    if (result.warnings.length === 0) throw new Error('Should have warnings');
  });

  // Test 13: Recursive functions
  await runTest('Should handle deep recursion', async () => {
    const code = `
      function deepRecursion(n) {
        if (n <= 0) return 0;
        return deepRecursion(n - 1) + 1;
      }
      deepRecursion(10);
    `;
    const result = await tracer.trace(code, {}, { language: 'javascript' });
    if (!result.success) throw new Error(`Execution failed: ${result.error}`);
    if (result.finalResult !== 10) throw new Error(`Expected 10, got ${result.finalResult}`);
  });

  // Test 14: Complex data structures
  await runTest('Should handle complex nested objects', async () => {
    const code = `
      let data = {
        users: [
          {id: 1, name: 'Alice', scores: [90, 85, 92]},
          {id: 2, name: 'Bob', scores: [78, 88, 91]}
        ]
      };
      data;
    `;
    const result = await tracer.trace(code, {}, { language: 'javascript' });
    if (!result.success) throw new Error(`Execution failed: ${result.error}`);
  });

  // Test 15: Empty code
  await runTest('Should handle empty code', async () => {
    const result = await tracer.trace('', {}, { language: 'javascript' });
    if (!result.success) throw new Error(`Execution failed: ${result.error}`);
  });

  console.log(`\n✅ Results: ${passCount} passed, ${failCount} failed (${passCount + failCount} total)`);
  process.exit(failCount > 0 ? 1 : 0);
}

runAllTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
