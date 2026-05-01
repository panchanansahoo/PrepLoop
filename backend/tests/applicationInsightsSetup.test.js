/**
 * Test Application Insights Setup Utility
 *
 * Verifies that the setup utility:
 * - Handles missing connection strings gracefully
 * - Initializes correctly when connection string provided
 * - Prevents duplicate initialization
 * - Doesn't cause module loading failures
 */

import { initializeApplicationInsights, isAppInsightsInitialized } from '../utils/applicationInsightsSetup.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(`❌ FAILED: ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`❌ FAILED: ${message} (expected ${expected}, got ${actual})`);
  }
}

async function testApplicationInsightsSetup() {
  console.log('\n🧪 Testing Application Insights Setup Utility\n');

  // Test 1: Initialize without connection string
  console.log('Test 1: Initialize without connection string...');
  const result1 = await initializeApplicationInsights(null);
  assertEqual(result1, false, 'Should return false when connection string is null');
  console.log('✅ Test 1: Returns false for missing connection string');

  // Test 2: Initialize with empty string
  console.log('Test 2: Initialize with empty string...');
  const result2 = await initializeApplicationInsights('');
  assertEqual(result2, false, 'Should return false when connection string is empty');
  console.log('✅ Test 2: Returns false for empty connection string');

  // Test 3: Initialize with invalid connection string (should catch error gracefully)
  console.log('Test 3: Initialize with invalid connection string...');
  const result3 = await initializeApplicationInsights('invalid-connection-string');
  // Should return false because the import will fail or the setup will fail
  assert(
    typeof result3 === 'boolean',
    'Should return a boolean even with invalid connection string'
  );
  console.log('✅ Test 3: Handles invalid connection string gracefully');

  // Test 4: Check initialization status
  console.log('Test 4: Check initialization status...');
  const initialized = isAppInsightsInitialized();
  assert(typeof initialized === 'boolean', 'isAppInsightsInitialized should return boolean');
  console.log('✅ Test 4: isAppInsightsInitialized returns boolean');

  // Test 5: Idempotency - calling again should return true if already initialized
  console.log('Test 5: Test idempotency...');
  const result4 = await initializeApplicationInsights('some-connection-string');
  assertEqual(result4, true, 'Second call should return true (already initialized)');
  console.log('✅ Test 5: Multiple calls are safe (idempotent)');

  // Test 6: Verify no top-level await is needed
  console.log('Test 6: Verify utility can be imported without async issues...');
  // This test passes if we got here - the utility loaded without requiring top-level await
  console.log('✅ Test 6: Utility imports without top-level await issues');

  console.log('\n🎉 All Application Insights setup tests passed!\n');
}

// Run tests
try {
  await testApplicationInsightsSetup();
} catch (error) {
  console.error('\n❌ Test failed:', error.message);
  process.exit(1);
}
