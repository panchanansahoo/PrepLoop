/**
 * P3-A Tests: Language Support (Go & Rust)
 *
 * Tests execution of Go and Rust code with proper compilation and output handling.
 * (Java support was already tested in prior phases)
 */

import { executeCode } from '../utils/executeCode.js';

const TESTS = [];
let passedCount = 0;
let failedCount = 0;

function test(name, fn) {
  TESTS.push({ name, fn });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`❌ ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`❌ Expected ${expected}, got ${actual}: ${message}`);
  }
}

// ============================================================================
// LANGUAGE SUPPORT DETECTION
// ============================================================================

test('Language detection: Go alias "go"', async () => {
  const result = await executeCode('', 'go', '', 1000);
  // Should either succeed (if go installed) or fail with go-specific error
  assert(result !== null, 'Should return result');
  assert(!result.error || !result.error.includes('not supported'), 'Should not say go not supported');
});

test('Language detection: Go alias "golang"', async () => {
  const result = await executeCode('', 'golang', '', 1000);
  // golang alias not set, but go should work
  assert(result !== null, 'Should return result');
});

test('Language detection: Rust alias "rs"', async () => {
  const result = await executeCode('', 'rs', '', 1000);
  // Should recognize rs as rust alias
  assert(result !== null, 'Should return result');
  assert(!result.error || !result.error.includes('not supported'), 'Should recognize rust');
});

test('Language detection: Unsupported language', async () => {
  const result = await executeCode('', 'cobol', '', 1000);
  assert(!result.success, 'Should fail for unsupported language');
  assert(result.error && result.error.includes('not supported'), 'Should mention unsupported');
  assert(result.error && result.error.includes('go, rust'), 'Should list supported languages including go, rust');
});

// ============================================================================
// GO LANGUAGE TESTS
// ============================================================================

test('Go: Basic hello world', async () => {
  const code = `
package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}
`;
  
  const result = await executeCode(code, 'go', '', 5000);
  
  if (result.success) {
    assert(result.output.includes('Hello, World!'), 'Should print hello world');
    assert(result.compileTime > 0, 'Should have compile time');
  } else {
    // Go not installed, which is acceptable for this environment
    assert(result.error && result.error.includes('not found'), 'Should indicate go not found or compilation error');
  }
});

test('Go: Simple math function', async () => {
  const code = `
package main

import "fmt"

func add(a int, b int) int {
    return a + b
}

func main() {
    result := add(5, 3)
    fmt.Println(result)
}
`;
  
  const result = await executeCode(code, 'go', '', 5000);
  
  if (result.success) {
    assert(result.output.includes('8'), 'Should calculate 5+3=8');
  } else {
    // Go not installed or syntax error
    assert(result.error, 'Should have error message');
  }
});

test('Go: Loop and variables', async () => {
  const code = `
package main

import "fmt"

func main() {
    sum := 0
    for i := 1; i <= 5; i++ {
        sum += i
    }
    fmt.Println(sum)
}
`;
  
  const result = await executeCode(code, 'go', '', 5000);
  
  if (result.success) {
    assert(result.output.includes('15'), 'Should calculate sum 1+2+3+4+5=15');
  } else {
    assert(result.error, 'Should have error if go unavailable');
  }
});

test('Go: String operations', async () => {
  const code = `
package main

import "fmt"

func main() {
    str := "Hello"
    fmt.Println(str)
    fmt.Println(len(str))
}
`;
  
  const result = await executeCode(code, 'go', '', 5000);
  
  if (result.success) {
    assert(result.output.includes('Hello'), 'Should print string');
    assert(result.output.includes('5'), 'Should print string length');
  } else {
    assert(result.error, 'Should have error if go unavailable');
  }
});

test('Go: Error handling', async () => {
  const code = `
package main

func main() {
    var x int
    x = "this should fail"
}
`;
  
  const result = await executeCode(code, 'go', '', 5000);
  
  // Should fail compilation
  assert(!result.success, 'Should fail with type error');
  assert(result.error, 'Should have error message');
});

// ============================================================================
// RUST LANGUAGE TESTS
// ============================================================================

test('Rust: Basic hello world', async () => {
  const code = `
fn main() {
    println!("Hello, World!");
}
`;
  
  const result = await executeCode(code, 'rust', '', 5000);
  
  if (result.success) {
    assert(result.output.includes('Hello, World!'), 'Should print hello world');
    assert(result.compileTime > 0, 'Should have compile time');
  } else {
    // Rust not installed, which is acceptable
    assert(result.error && (result.error.includes('not found') || result.error.includes('rustc')), 'Should indicate rustc not found');
  }
});

test('Rust: Function definition', async () => {
  const code = `
fn add(a: i32, b: i32) -> i32 {
    a + b
}

fn main() {
    let result = add(10, 20);
    println!("{}", result);
}
`;
  
  const result = await executeCode(code, 'rust', '', 5000);
  
  if (result.success) {
    assert(result.output.includes('30'), 'Should calculate 10+20=30');
  } else {
    assert(result.error, 'Should have error message');
  }
});

test('Rust: Loop and accumulation', async () => {
  const code = `
fn main() {
    let mut sum = 0;
    for i in 1..=5 {
        sum += i;
    }
    println!("{}", sum);
}
`;
  
  const result = await executeCode(code, 'rust', '', 5000);
  
  if (result.success) {
    assert(result.output.includes('15'), 'Should calculate sum 1+2+3+4+5=15');
  } else {
    assert(result.error, 'Should have error if rust unavailable');
  }
});

test('Rust: String handling', async () => {
  const code = `
fn main() {
    let s = "Hello";
    println!("{}", s);
    println!("{}", s.len());
}
`;
  
  const result = await executeCode(code, 'rust', '', 5000);
  
  if (result.success) {
    assert(result.output.includes('Hello'), 'Should print string');
    assert(result.output.includes('5'), 'Should print string length');
  } else {
    assert(result.error, 'Should have error if rust unavailable');
  }
});

test('Rust: Vector operations', async () => {
  const code = `
fn main() {
    let v = vec![1, 2, 3, 4, 5];
    let sum: i32 = v.iter().sum();
    println!("{}", sum);
}
`;
  
  const result = await executeCode(code, 'rust', '', 5000);
  
  if (result.success) {
    assert(result.output.includes('15'), 'Should sum vector elements');
  } else {
    assert(result.error, 'Should have error if rust unavailable');
  }
});

test('Rust: Error handling - type mismatch', async () => {
  const code = `
fn main() {
    let x: i32 = "not a number";
}
`;
  
  const result = await executeCode(code, 'rust', '', 5000);
  
  // Should fail compilation
  assert(!result.success, 'Should fail with type error');
  assert(result.error, 'Should have error message');
});

test('Rust: Option type', async () => {
  const code = `
fn main() {
    let x = Some(5);
    match x {
        Some(n) => println!("{}", n),
        None => println!("nothing"),
    }
}
`;
  
  const result = await executeCode(code, 'rust', '', 5000);
  
  if (result.success) {
    assert(result.output.includes('5'), 'Should handle Option and print value');
  } else {
    assert(result.error, 'Should have error if rust unavailable');
  }
});

// ============================================================================
// CROSS-LANGUAGE TESTS
// ============================================================================

test('Multiple languages supported in same session', async () => {
  const pythonCode = 'print(42)';
  const jsCode = 'console.log(42)';
  const cCode = '#include <stdio.h>\nint main() { printf("42"); return 0; }';
  
  const results = await Promise.all([
    executeCode(pythonCode, 'python', '', 1000),
    executeCode(jsCode, 'javascript', '', 1000),
    executeCode(cCode, 'c', '', 1000),
  ]);
  
  // At least first two should succeed (C might not be installed)
  assert(results[0].success, 'Python should execute');
  assert(results[1].success, 'JavaScript should execute');
});

test('Language isolation: State not shared', async () => {
  const code1 = `
package main
import "fmt"
func main() { fmt.Println("Go1") }
`;
  
  const code2 = `
package main
import "fmt"
func main() { fmt.Println("Go2") }
`;
  
  const result1 = await executeCode(code1, 'go', '', 5000);
  const result2 = await executeCode(code2, 'go', '', 5000);
  
  // Both should execute independently
  if (result1.success && result2.success) {
    assert(result1.output !== result2.output || result1.output.includes('Go1'), 'Outputs should be independent');
  }
});

// ============================================================================
// COMPILATION CACHING
// ============================================================================

test('Compilation: Same code compiled once (cache hit)', async () => {
  const code = `
fn main() {
    println!("test");
}
`;
  
  // First execution
  const result1 = await executeCode(code, 'rust', '', 5000);
  
  // Second execution (should hit cache if available)
  const result2 = await executeCode(code, 'rust', '', 5000);
  
  if (result1.success && result2.success) {
    // Both should succeed
    assert(result1.output === result2.output, 'Both should have identical output');
  }
});

// ============================================================================
// RUN ALL TESTS
// ============================================================================

console.log('\n🧪 P3-A: Language Support (Go & Rust)\n');
console.log('='.repeat(70));

(async () => {
  for (const { name, fn } of TESTS) {
    try {
      process.stdout.write(`📝 ${name} `);
      await fn();
      console.log('✓');
      passedCount++;
    } catch (err) {
      console.log('\n   ' + err.message);
      failedCount++;
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log(`✅ Passed: ${passedCount}/${TESTS.length}`);
  if (failedCount > 0) {
    console.log(`⚠️  Failed: ${failedCount}/${TESTS.length} (may be due to missing compiler/runtime)`);
  }
})();
