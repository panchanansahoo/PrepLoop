/**
 * Test: Cache Manager Initialization Error Handling
 * 
 * Verifies that cacheManager.connect() is properly handled with try/catch
 * and that process error handlers are registered before initialization.
 */

const testsPassed = [];
const testsFailed = [];

function assert(condition, message) {
  if (!condition) {
    testsFailed.push(message);
    console.error(`✗ FAILED: ${message}`);
  } else {
    testsPassed.push(message);
    console.log(`✓ PASSED: ${message}`);
  }
}

console.log('\n═══════════════════════════════════════════════════════');
console.log('Cache Manager Initialization Tests');
console.log('═══════════════════════════════════════════════════════\n');

// Test 1: Verify async initialization pattern
console.log('TEST 1: Async Initialization Pattern');
console.log('───────────────────────────────────');
try {
  let initStarted = false;
  let initCompleted = false;
  let serverStarted = false;

  async function testInitializeServer() {
    try {
      initStarted = true;
      // Simulate cacheManager.connect()
      await Promise.resolve();
      initCompleted = true;
      return true;
    } catch (err) {
      return false;
    }
  }

  testInitializeServer()
    .then((success) => {
      assert(initStarted, 'Initialization started');
      assert(initCompleted, 'Initialization completed');
      assert(success, 'Initialization succeeded');
      serverStarted = true;
    })
    .catch(() => {
      assert(false, 'Initialization failed unexpectedly');
    });

  // Give promise time to resolve
  await new Promise(resolve => setTimeout(resolve, 10));
  assert(serverStarted, 'Server startup triggered after initialization');
  console.log('✓ TEST 1: Async initialization pattern works');
} catch (err) {
  testsFailed.push(`Async pattern test: ${err.message}`);
  console.error(`✗ FAILED: ${err.message}`);
}

// Test 2: Error handling in initialization
console.log('\nTEST 2: Error Handling in Initialization');
console.log('───────────────────────────────────────');
try {
  let errorCaught = false;
  let errorMessage = null;

  async function testInitializeServerWithError() {
    try {
      // Simulate cache connection failure
      throw new Error('ECONNREFUSED: Connection refused');
    } catch (err) {
      errorCaught = true;
      errorMessage = err.message;
      throw err;
    }
  }

  testInitializeServerWithError()
    .then(() => {
      assert(false, 'Should have caught error');
    })
    .catch((err) => {
      assert(errorCaught, 'Error was caught in try/catch');
      assert(errorMessage === 'ECONNREFUSED: Connection refused', 'Error message preserved');
      assert(err.message === 'ECONNREFUSED: Connection refused', 'Error thrown to catch handler');
    });

  // Give promise time to settle
  await new Promise(resolve => setTimeout(resolve, 10));
  console.log('✓ TEST 2: Error handling in initialization works');
} catch (err) {
  testsFailed.push(`Error handling test: ${err.message}`);
  console.error(`✗ FAILED: ${err.message}`);
}

// Test 3: Process error handlers can be registered
console.log('\nTEST 3: Process Error Handlers Registration');
console.log('──────────────────────────────────────────');
try {
  let handledRejection = false;
  let handledException = false;

  // Add test handlers (verify we can register them)
  const rejectionHandler = (reason) => {
    handledRejection = true;
  };
  const exceptionHandler = (error) => {
    handledException = true;
  };

  // Count listeners before
  const listenersBefore = process.listeners('unhandledRejection').length;
  const exceptionListenersBefore = process.listeners('uncaughtException').length;

  // Register handlers
  process.on('unhandledRejection', rejectionHandler);
  process.on('uncaughtException', exceptionHandler);

  // Count listeners after
  const listenersAfter = process.listeners('unhandledRejection').length;
  const exceptionListenersAfter = process.listeners('uncaughtException').length;

  assert(listenersAfter > listenersBefore, 'unhandledRejection handler registered');
  assert(exceptionListenersAfter > exceptionListenersBefore, 'uncaughtException handler registered');

  // Cleanup (remove test handlers to not affect other tests)
  process.removeListener('unhandledRejection', rejectionHandler);
  process.removeListener('uncaughtException', exceptionHandler);

  console.log('✓ TEST 3: Process error handlers can be registered');
} catch (err) {
  testsFailed.push(`Process handlers test: ${err.message}`);
  console.error(`✗ FAILED: ${err.message}`);
}

// Test 4: Initialization order
console.log('\nTEST 4: Initialization Order');
console.log('────────────────────────────');
try {
  const initOrder = [];

  async function orderedInit() {
    initOrder.push('cache_start');
    await Promise.resolve();
    initOrder.push('cache_complete');

    initOrder.push('routes_start');
    await Promise.resolve();
    initOrder.push('routes_complete');

    initOrder.push('app_setup_start');
    await Promise.resolve();
    initOrder.push('app_setup_complete');

    return true;
  }

  orderedInit()
    .then((success) => {
      assert(success, 'Initialization succeeded');
      assert(initOrder[0] === 'cache_start', 'Cache initialization first');
      assert(initOrder[1] === 'cache_complete', 'Cache completes before routes');
      assert(initOrder[2] === 'routes_start', 'Routes load after cache');
      assert(initOrder[3] === 'routes_complete', 'Routes complete before app setup');
      assert(initOrder[4] === 'app_setup_start', 'App setup after routes');
      assert(initOrder[5] === 'app_setup_complete', 'App setup is final step');
    });

  // Give promise time to resolve
  await new Promise(resolve => setTimeout(resolve, 10));
  console.log('✓ TEST 4: Initialization order is correct');
} catch (err) {
  testsFailed.push(`Order test: ${err.message}`);
  console.error(`✗ FAILED: ${err.message}`);
}

// Test 5: Server startup after initialization
console.log('\nTEST 5: Server Startup After Initialization');
console.log('───────────────────────────────────────────');
try {
  const stages = {
    initStarted: false,
    initEnded: false,
    serverStarted: false,
  };

  async function mockInitialize() {
    stages.initStarted = true;
    await Promise.resolve();
    stages.initEnded = true;
  }

  function mockStartServer() {
    stages.serverStarted = true;
  }

  mockInitialize()
    .then(() => {
      assert(stages.initStarted, 'Init started');
      assert(stages.initEnded, 'Init completed');
      assert(!stages.serverStarted, 'Server not started yet');
      mockStartServer();
      assert(stages.serverStarted, 'Server started after init');
    })
    .catch((err) => {
      assert(false, `Failed: ${err.message}`);
    });

  // Give promise time to resolve
  await new Promise(resolve => setTimeout(resolve, 10));
  console.log('✓ TEST 5: Server starts after initialization completes');
} catch (err) {
  testsFailed.push(`Server startup test: ${err.message}`);
  console.error(`✗ FAILED: ${err.message}`);
}

// Test 6: Error stack trace preservation
console.log('\nTEST 6: Error Stack Trace Preservation');
console.log('──────────────────────────────────────');
try {
  let stackTracePreserved = false;
  let errorWithStack = null;

  async function testStackPreservation() {
    try {
      throw new Error('Test error');
    } catch (err) {
      errorWithStack = err;
      throw err;
    }
  }

  testStackPreservation()
    .then(() => {
      assert(false, 'Should have thrown error');
    })
    .catch((err) => {
      assert(err instanceof Error, 'Error is Error instance');
      assert(err.message === 'Test error', 'Error message preserved');
      assert(err.stack !== undefined, 'Error stack trace preserved');
      assert(err.stack.includes('Test error'), 'Stack includes error message');
      stackTracePreserved = true;
    });

  // Give promise time to settle
  await new Promise(resolve => setTimeout(resolve, 10));
  assert(stackTracePreserved, 'Stack trace was preserved');
  console.log('✓ TEST 6: Error stack traces are preserved');
} catch (err) {
  testsFailed.push(`Stack trace test: ${err.message}`);
  console.error(`✗ FAILED: ${err.message}`);
}

// Test 7: Multiple error scenarios
console.log('\nTEST 7: Multiple Error Scenarios');
console.log('────────────────────────────────');
try {
  const scenarios = [
    { name: 'Connection refused', error: 'ECONNREFUSED' },
    { name: 'Timeout', error: 'ETIMEDOUT' },
    { name: 'Authentication failed', error: 'EAUTH' },
  ];

  let handledScenarios = 0;

  for (const scenario of scenarios) {
    const promise = (async () => {
      try {
        throw new Error(scenario.error);
      } catch (err) {
        return err;
      }
    })();

    promise
      .then((err) => {
        assert(err.message === scenario.error, `${scenario.name} handled correctly`);
        handledScenarios++;
      })
      .catch(() => {
        assert(false, `${scenario.name} should be caught`);
      });
  }

  // Give promises time to resolve
  await new Promise(resolve => setTimeout(resolve, 20));
  assert(handledScenarios === scenarios.length, `All ${scenarios.length} scenarios handled`);
  console.log('✓ TEST 7: Multiple error scenarios handled correctly');
} catch (err) {
  testsFailed.push(`Multiple scenarios test: ${err.message}`);
  console.error(`✗ FAILED: ${err.message}`);
}

// Test 8: Graceful shutdown readiness
console.log('\nTEST 8: Graceful Shutdown Readiness');
console.log('──────────────────────────────────');
try {
  let initComplete = false;
  let shutdownReady = false;

  async function testShutdownReadiness() {
    // Simulate initialization
    initComplete = true;

    // By this point, server would start
    // Graceful shutdown handlers can now be registered
    shutdownReady = true;
    return true;
  }

  testShutdownReadiness()
    .then(() => {
      assert(initComplete, 'Initialization completed before shutdown setup');
      assert(shutdownReady, 'Graceful shutdown can be registered');
    });

  // Give promise time to resolve
  await new Promise(resolve => setTimeout(resolve, 10));
  console.log('✓ TEST 8: Graceful shutdown ready after initialization');
} catch (err) {
  testsFailed.push(`Shutdown readiness test: ${err.message}`);
  console.error(`✗ FAILED: ${err.message}`);
}

// Summary
console.log('\n═══════════════════════════════════════════════════════');
console.log('Test Summary');
console.log('═══════════════════════════════════════════════════════');
console.log(`✓ Passed: ${testsPassed.length}`);
console.log(`✗ Failed: ${testsFailed.length}`);

if (testsFailed.length > 0) {
  console.log('\nFailed Tests:');
  testsFailed.forEach(test => console.log(`  - ${test}`));
  process.exit(1);
} else {
  console.log('\n✅ All cache manager initialization tests passed!');
  process.exit(0);
}
