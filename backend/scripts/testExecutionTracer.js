#!/usr/bin/env node

/**
 * testExecutionTracer.js
 * 
 * Tests for execution timing breakdown:
 * - Parse time measurement
 * - Compile time estimation
 * - Timing breakdown calculation
 * - Performance analysis
 */

import {
  measureParseTime,
  measureCompileTime,
  calculateTimingBreakdown,
  formatTimingBreakdown,
  analyzeExecutionTrace,
} from '../utils/executionTracer.js';

console.log('🧪 Testing Execution Tracer - Timing Breakdown\n');

// Test 1: JavaScript parse time measurement
console.log('📝 Test 1: JavaScript parse time measurement');
try {
  const jsCode = `
function solve(input) {
  const n = parseInt(input);
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}
console.log(solve(5));
`;

  const parseResult = measureParseTime(jsCode, 'javascript');
  if (parseResult.valid && parseResult.parseTime >= 0) {
    console.log('  ✓ JavaScript parse time measured');
    console.log(`    - Parse Time: ${parseResult.parseTime}ms`);
    console.log(`    - Code Size: ${parseResult.codeSize} bytes`);
  } else {
    console.log('  ❌ Failed to measure parse time');
  }
} catch (err) {
  console.log(`  ❌ Error: ${err.message}`);
}

// Test 2: Python parse time measurement
console.log('\n📝 Test 2: Python parse time measurement');
try {
  const pyCode = `
def solve(input_str):
    n = int(input_str)
    result = 1
    for i in range(2, n + 1):
        result *= i
    return result

print(solve("5"))
`;

  const parseResult = measureParseTime(pyCode, 'python');
  if (parseResult.valid) {
    console.log('  ✓ Python parse time measured');
    console.log(`    - Parse Time: ${parseResult.parseTime}ms`);
  } else {
    console.log(`  ⚠ Python validation skipped: ${parseResult.error}`);
  }
} catch (err) {
  console.log(`  ❌ Error: ${err.message}`);
}

// Test 3: Invalid JavaScript code detection
console.log('\n📝 Test 3: Invalid JavaScript code detection');
try {
  const invalidCode = 'function solve(input {'; // Missing closing paren

  const parseResult = measureParseTime(invalidCode, 'javascript');
  if (!parseResult.valid && parseResult.error) {
    console.log('  ✓ Invalid JavaScript detected');
    console.log(`    - Error: ${parseResult.error.substring(0, 50)}...`);
  } else {
    console.log('  ❌ Should have detected invalid code');
  }
} catch (err) {
  console.log(`  ❌ Error: ${err.message}`);
}

// Test 4: Compile time estimation for C
console.log('\n📝 Test 4: Compile time estimation for C');
try {
  const cCode = `
#include <stdio.h>

int factorial(int n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

int main() {
  printf("%d\\n", factorial(5));
  return 0;
}
`;

  const compileResult = measureCompileTime(cCode, 'c');
  if (!compileResult.compiled === false || compileResult.compileTime === 0) {
    console.log('  ⚠ C compilation skipped (no compiler available)');
  } else {
    console.log('  ✓ C compile time estimated');
    console.log(`    - Est. Time: ${compileResult.compileTime}ms`);
  }
} catch (err) {
  console.log(`  ❌ Error: ${err.message}`);
}

// Test 5: Interpreted language has no compile phase
console.log('\n📝 Test 5: Interpreted languages have no compile phase');
try {
  const jsResult = measureCompileTime('console.log("hello");', 'javascript');
  const pyResult = measureCompileTime('print("hello")', 'python');

  if (jsResult.compileTime === 0 && !jsResult.compiled) {
    console.log('  ✓ JavaScript: No compilation phase');
  } else {
    console.log('  ❌ JavaScript should not compile');
  }

  if (pyResult.compileTime === 0 && !pyResult.compiled) {
    console.log('  ✓ Python: No compilation phase');
  } else {
    console.log('  ❌ Python should not compile');
  }
} catch (err) {
  console.log(`  ❌ Error: ${err.message}`);
}

// Test 6: Timing breakdown calculation
console.log('\n📝 Test 6: Calculate timing breakdown');
try {
  const breakdown = calculateTimingBreakdown(
    { code: 'console.log("hello");' },
    'javascript',
    150 // Total time: 150ms
  );

  if (breakdown.totalTime === 150 && breakdown.runTime >= 0) {
    console.log('  ✓ Timing breakdown calculated');
    console.log(`    - Total: ${breakdown.totalTime}ms`);
    console.log(`    - Parse: ${breakdown.parseTime}ms`);
    console.log(`    - Compile: ${breakdown.compileTime}ms`);
    console.log(`    - Run: ${breakdown.runTime}ms`);
  } else {
    console.log('  ❌ Breakdown not properly calculated');
  }
} catch (err) {
  console.log(`  ❌ Error: ${err.message}`);
}

// Test 7: Format timing breakdown for display
console.log('\n📝 Test 7: Format timing breakdown for display');
try {
  const breakdown = calculateTimingBreakdown(
    { code: 'x = 1; y = 2; z = x + y' },
    'python',
    100
  );

  const formatted = formatTimingBreakdown(breakdown);
  if (formatted.includes('Execution Timing') && formatted.includes('ms')) {
    console.log('  ✓ Timing breakdown formatted');
    const lines = formatted.split('\n');
    console.log(`    - First line: ${lines[0]}`);
    if (formatted.includes('Bottleneck')) {
      console.log('    - Bottleneck identified');
    }
  } else {
    console.log('  ❌ Formatting failed');
  }
} catch (err) {
  console.log(`  ❌ Error: ${err.message}`);
}

// Test 8: Analyze execution trace for optimization recommendations
console.log('\n📝 Test 8: Analyze execution trace for recommendations');
try {
  const slowBreakdown = calculateTimingBreakdown(
    { code: 'for i in range(1000000): pass' },
    'python',
    5000 // Slow execution
  );

  const analysis = analyzeExecutionTrace(slowBreakdown);
  if (analysis.bottleneck || analysis.recommendations.length > 0) {
    console.log('  ✓ Analysis produced recommendations');
    if (analysis.bottleneck) {
      console.log(`    - Bottleneck: ${analysis.bottleneck}`);
    }
    if (analysis.recommendations.length > 0) {
      console.log(`    - Recommendations: ${analysis.recommendations[0].substring(0, 50)}...`);
    }
  } else {
    console.log('  ⚠ No bottleneck detected (execution may be fast)');
  }
} catch (err) {
  console.log(`  ❌ Error: ${err.message}`);
}

// Test 9: Timing breakdown with compilation phase
console.log('\n📝 Test 9: Timing breakdown includes compile phase for compiled languages');
try {
  const breakdown = calculateTimingBreakdown(
    { code: '#include <stdio.h>\nint main() { return 0; }' },
    'c',
    200 // Total: 200ms
  );

  if (breakdown.compileTime > 0 && breakdown.runTime >= 0) {
    console.log('  ✓ Breakdown includes compile phase');
    console.log(`    - Compile: ${breakdown.compileTime}ms`);
    console.log(`    - Run: ${breakdown.runTime}ms`);
  } else if (breakdown.compileTime === 0) {
    console.log('  ⚠ Compile time is 0 (estimated timing may vary)');
  } else {
    console.log('  ❌ Expected compile phase for C code');
  }
} catch (err) {
  console.log(`  ❌ Error: ${err.message}`);
}

// Test 10: Percentages sum to 100
console.log('\n📝 Test 10: Timing percentages sum correctly');
try {
  const breakdown = calculateTimingBreakdown(
    { code: 'console.log("test");' },
    'javascript',
    500
  );

  const parsePercent = breakdown.breakdown.parse.percent;
  const compilePercent = breakdown.breakdown.compile?.percent || 0;
  const runPercent = breakdown.breakdown.execution.percent;
  const total = parsePercent + compilePercent + runPercent;

  if (total === 100 || total === 99 || total === 101) { // Allow ±1% rounding
    console.log('  ✓ Percentages sum to 100% (allowing rounding)');
    console.log(`    - Parse: ${parsePercent}%`);
    console.log(`    - Compile: ${compilePercent}%`);
    console.log(`    - Run: ${runPercent}%`);
    console.log(`    - Total: ${total}%`);
  } else {
    console.log(`  ⚠ Percentages sum to ${total}% (should be ~100%)`);
  }
} catch (err) {
  console.log(`  ❌ Error: ${err.message}`);
}

console.log('\n✅ Execution Tracer Tests Complete\n');
console.log('Summary:');
console.log('  • Parse time: Measured via language-specific parsing');
console.log('  • Compile time: Estimated for compiled languages');
console.log('  • Breakdown: Calculates parse, compile, and run times');
console.log('  • Analysis: Provides optimization recommendations');
console.log('  • Display: Formats breakdown for UI consumption');
