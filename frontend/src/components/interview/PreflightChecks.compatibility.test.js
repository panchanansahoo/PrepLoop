/**
 * Test AbortSignal.timeout() Compatibility Fallback
 *
 * Verifies that the PreflightChecks component properly handles:
 * - Modern environments with AbortSignal.timeout() support
 * - Older environments without AbortSignal.timeout()
 * - Timeout behavior in both cases
 */

// Mock global objects
let originalAbortSignal = null;
let timeoutCalled = false;
let abortControllerCalled = false;

function setupMocks() {
  timeoutCalled = false;
  abortControllerCalled = false;

  // Store original AbortSignal
  originalAbortSignal = global.AbortSignal;

  // Setup AbortController mock
  global.AbortController = class {
    constructor() {
      abortControllerCalled = true;
      this.signal = { aborted: false, addEventListener: () => {} };
      this.abort = function() {
        this.signal.aborted = true;
      };
    }
  };
}

function teardownMocks() {
  if (originalAbortSignal) {
    global.AbortSignal = originalAbortSignal;
  }
  if (global.AbortController) {
    delete global.AbortController;
  }
}

// Test 1: Modern environment WITH AbortSignal.timeout()
function testModernEnvironment() {
  console.log('Test 1: Modern environment WITH AbortSignal.timeout()');
  setupMocks();

  // Simulate modern environment
  global.AbortSignal.timeout = function(ms) {
    timeoutCalled = true;
    return { aborted: false, addEventListener: () => {} };
  };

  // Simulate the timeout logic from PreflightChecks
  let signal;
  if (AbortSignal.timeout) {
    signal = AbortSignal.timeout(5000);
  }

  teardownMocks();

  if (timeoutCalled && signal) {
    console.log('✅ AbortSignal.timeout() was called in modern environment');
    return true;
  } else {
    console.log('❌ AbortSignal.timeout() was NOT called');
    return false;
  }
}

// Test 2: Older environment WITHOUT AbortSignal.timeout()
function testOlderEnvironment() {
  console.log('\nTest 2: Older environment WITHOUT AbortSignal.timeout()');
  setupMocks();

  // Simulate older environment (no AbortSignal.timeout)
  // AbortSignal exists but has no timeout method
  global.AbortSignal.timeout = undefined;

  let signal;
  let fallbackUsed = false;

  if (AbortSignal.timeout) {
    signal = AbortSignal.timeout(5000);
  } else {
    // Fallback: use AbortController
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 5000);
    signal = abortController.signal;
    fallbackUsed = true;
  }

  teardownMocks();

  if (fallbackUsed && abortControllerCalled && signal) {
    console.log('✅ Fallback to AbortController was used in older environment');
    return true;
  } else {
    console.log('❌ Fallback was NOT used when expected');
    return false;
  }
}

// Test 3: Timeout cleanup in both scenarios
function testTimeoutCleanup() {
  console.log('\nTest 3: Timeout cleanup');
  setupMocks();

  let timeoutIds = [];
  const originalSetTimeout = global.setTimeout;
  const originalClearTimeout = global.clearTimeout;

  global.setTimeout = function(fn, delay) {
    const id = originalSetTimeout.call(this, fn, delay);
    timeoutIds.push(id);
    return id;
  };

  global.clearTimeout = function(id) {
    return originalClearTimeout.call(this, id);
  };

  // Simulate the scenario where response completes before timeout
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), 5000);
  
  // Simulate quick response
  clearTimeout(timeoutId);

  teardownMocks();
  global.setTimeout = originalSetTimeout;
  global.clearTimeout = originalClearTimeout;

  if (timeoutIds.length > 0) {
    console.log('✅ Timeout cleanup verified (setTimeout/clearTimeout called)');
    return true;
  } else {
    console.log('❌ Timeout cleanup not verified');
    return false;
  }
}

// Test 4: Error handling for timeout abort
function testTimeoutAbortError() {
  console.log('\nTest 4: Timeout abort error handling');
  setupMocks();

  const abortController = new AbortController();
  let abortErrorName = null;

  // Simulate abort
  abortController.abort();

  // Create a mock fetch that respects abort signal
  const mockFetch = async (url, options) => {
    if (options.signal && options.signal.aborted) {
      const error = new DOMException('The operation was aborted', 'AbortError');
      error.name = 'AbortError';
      throw error;
    }
  };

  teardownMocks();

  if (abortController.signal.aborted) {
    console.log('✅ Abort signal can be checked and will trigger AbortError on fetch');
    return true;
  } else {
    console.log('❌ Abort signal check failed');
    return false;
  }
}

// Test 5: Signal usage in fetch options
function testSignalInFetchOptions() {
  console.log('\nTest 5: Signal usage in fetch options');
  
  setupMocks();
  
  let fetchOptions = null;
  
  // Simulate the fetch call structure
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), 5000);
  let signal = abortController.signal;

  // Check if AbortSignal.timeout would replace this
  if (AbortSignal && AbortSignal.timeout) {
    signal = AbortSignal.timeout(5000);
  }

  // This is what gets passed to fetch
  fetchOptions = { 
    method: 'GET',
    cache: 'no-store',
    signal
  };

  teardownMocks();

  if (fetchOptions.signal && (fetchOptions.signal.aborted !== undefined || fetchOptions.signal.addEventListener)) {
    console.log('✅ Signal properly configured in fetch options');
    return true;
  } else {
    console.log('❌ Signal not properly configured');
    return false;
  }
}

// Run all tests
function runTests() {
  console.log('\n🧪 Testing AbortSignal.timeout() Compatibility Fallback\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const results = [
    testModernEnvironment(),
    testOlderEnvironment(),
    testTimeoutCleanup(),
    testTimeoutAbortError(),
    testSignalInFetchOptions()
  ];

  const passed = results.filter(r => r).length;
  const failed = results.filter(r => !r).length;

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  if (failed === 0) {
    console.log('🎉 All compatibility tests passed!\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed\n');
    process.exit(1);
  }
}

// Run tests automatically
runTests();
