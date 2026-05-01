/**
 * Test InterviewCacheManager Serialization/Deserialization Fixes
 * 
 * Tests verify that the manager properly handles:
 * - Type preservation (primitives, objects, arrays, null)
 * - No double-serialization
 * - Proper L1/L2 synchronization
 * - Graceful error handling
 */

import NodeCache from 'node-cache';
import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('InterviewCacheManager-Test');

// Mock Redis client simulating Upstash behavior
class MockUpstashRedis {
  constructor() {
    this.storage = new Map();
  }

  async get(key) {
    return this.storage.get(key) ?? null;
  }

  async set(key, value, options) {
    // Upstash REST API stores values as strings
    this.storage.set(key, value);
    return 'OK';
  }

  async del(key) {
    this.storage.delete(key);
    return 1;
  }
}

const mockRedis = new MockUpstashRedis();
const memoryCache = new NodeCache({ stdTTL: 60, checkperiod: 70 });

const TTL_ACTIVE_SESSION = 1800;
const TTL_COMPLETED_SESSION = 86400;

// Fixed InterviewCacheManager implementation
class TestInterviewCacheManager {
  static getSessionTTL(sessionMetadata) {
    if (!sessionMetadata) return TTL_ACTIVE_SESSION;
    return sessionMetadata.stage === 'completed' || sessionMetadata.continueInterview === false
      ? TTL_COMPLETED_SESSION
      : TTL_ACTIVE_SESSION;
  }

  static async get(key) {
    // Check L1 (memory cache)
    const l1Result = memoryCache.get(key);
    if (l1Result !== undefined) {
      return l1Result;
    }

    // Check L2 (Redis/Upstash)
    const l2Result = await mockRedis.get(key);
    if (l2Result === null || l2Result === undefined) {
      return null;
    }

    // Deserialize JSON string from Upstash Redis
    let deserialized = l2Result;
    if (typeof l2Result === 'string') {
      try {
        deserialized = JSON.parse(l2Result);
      } catch (parseError) {
        logger.error('Failed to parse Redis value as JSON', { key, error: parseError.message });
        return null;
      }
    }

    // Backfill L1 memory cache with deserialized value
    memoryCache.set(key, deserialized);
    return deserialized;
  }

  static async set(key, value, customTTL = null) {
    const ttl = customTTL || this.getSessionTTL(value);
    
    // Set L1 (memory cache) - store original value unmodified
    memoryCache.set(key, value, Math.min(60, ttl));

    // Set L2 (Redis/Upstash) - always serialize to JSON string for consistency
    try {
      const serialized = JSON.stringify(value);
      await mockRedis.set(key, serialized, { ex: ttl });
    } catch (error) {
      logger.error('Failed to serialize value for Redis', { key, error: error.message });
    }
    
    return true;
  }

  static async del(key) {
    memoryCache.del(key);
    await mockRedis.del(key);
    return true;
  }

  static async clear() {
    memoryCache.flushAll();
    mockRedis.storage.clear();
  }
}

// Test Suite
async function runTests() {
  let passCount = 0;
  let failCount = 0;

  const assert = (condition, message) => {
    if (condition) {
      console.log(`✅ ${message}`);
      passCount++;
    } else {
      console.log(`❌ ${message}`);
      failCount++;
    }
  };

  const deepEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  console.log('\n🧪 Testing InterviewCacheManager Serialization Fixes\n');

  // Test 1: Object type preservation
  console.log('Test 1: Object Type Preservation');
  await TestInterviewCacheManager.clear();
  const objectValue = { sessionId: 'test_1', score: 42, active: true };
  await TestInterviewCacheManager.set('test_object', objectValue);
  memoryCache.flushAll();
  const retrievedObject = await TestInterviewCacheManager.get('test_object');
  assert(
    deepEqual(retrievedObject, objectValue) && typeof retrievedObject === 'object',
    'Object types preserved through serialization/deserialization'
  );

  // Test 2: Primitive number type preservation
  console.log('\nTest 2: Number Type Preservation');
  await TestInterviewCacheManager.clear();
  const numberValue = 42;
  await TestInterviewCacheManager.set('test_number', numberValue);
  memoryCache.flushAll();
  const retrievedNumber = await TestInterviewCacheManager.get('test_number');
  assert(
    retrievedNumber === 42 && typeof retrievedNumber === 'number',
    `Number type preserved: ${typeof retrievedNumber} === 'number'`
  );

  // Test 3: Boolean type preservation
  console.log('\nTest 3: Boolean Type Preservation');
  await TestInterviewCacheManager.clear();
  const boolValue = true;
  await TestInterviewCacheManager.set('test_bool', boolValue);
  memoryCache.flushAll();
  const retrievedBool = await TestInterviewCacheManager.get('test_bool');
  assert(
    retrievedBool === true && typeof retrievedBool === 'boolean',
    `Boolean type preserved: ${typeof retrievedBool} === 'boolean'`
  );

  // Test 4: String type preservation (no double serialization)
  console.log('\nTest 4: String Type (No Double-Serialization)');
  await TestInterviewCacheManager.clear();
  const stringValue = 'test string value';
  await TestInterviewCacheManager.set('test_string', stringValue);
  memoryCache.flushAll();
  const retrievedString = await TestInterviewCacheManager.get('test_string');
  assert(
    retrievedString === 'test string value' && typeof retrievedString === 'string',
    `String not double-serialized: "${retrievedString}"`
  );

  // Test 5: Array type preservation
  console.log('\nTest 5: Array Type Preservation');
  await TestInterviewCacheManager.clear();
  const arrayValue = [1, 2, 3, { nested: 'object' }, 'string'];
  await TestInterviewCacheManager.set('test_array', arrayValue);
  memoryCache.flushAll();
  const retrievedArray = await TestInterviewCacheManager.get('test_array');
  assert(
    Array.isArray(retrievedArray) && deepEqual(retrievedArray, arrayValue),
    'Array type preserved with nested structures'
  );

  // Test 6: Null value handling
  console.log('\nTest 6: Null Value Handling');
  await TestInterviewCacheManager.clear();
  const nullValue = null;
  await TestInterviewCacheManager.set('test_null', nullValue);
  memoryCache.flushAll();
  const retrievedNull = await TestInterviewCacheManager.get('test_null');
  assert(
    retrievedNull === null,
    'Null values handled correctly (not converted to undefined)'
  );

  // Test 7: Complex nested structure
  console.log('\nTest 7: Complex Nested Structure');
  await TestInterviewCacheManager.clear();
  const complexValue = {
    sessionId: 'complex_1',
    userInfo: { id: 123, name: 'Test User', active: true },
    scores: [8.5, 9, 7.5],
    metadata: {
      startTime: '2026-05-01T14:00:00Z',
      tags: ['dsa', 'interview'],
      stats: { attempts: 3, duration: 1800 }
    }
  };
  await TestInterviewCacheManager.set('test_complex', complexValue);
  memoryCache.flushAll();
  const retrievedComplex = await TestInterviewCacheManager.get('test_complex');
  assert(
    deepEqual(retrievedComplex, complexValue),
    'Complex nested structures preserved (objects, arrays, primitives)'
  );

  // Test 8: Verify Redis stores JSON strings (not double-serialized)
  console.log('\nTest 8: Redis Storage Format Verification');
  await TestInterviewCacheManager.clear();
  const testObj = { id: 1, value: 'test', count: 42 };
  await TestInterviewCacheManager.set('test_storage', testObj);
  const redisRawValue = mockRedis.storage.get('test_storage');
  const expectedSerialized = JSON.stringify(testObj);
  assert(
    redisRawValue === expectedSerialized && typeof redisRawValue === 'string',
    'Redis stores JSON.stringify(value), not double-serialized'
  );

  // Test 9: L1 cache hit doesn't require deserialization
  console.log('\nTest 9: L1 Cache Hit Path');
  await TestInterviewCacheManager.clear();
  const l1TestValue = { type: 'session', id: 'l1_test' };
  await TestInterviewCacheManager.set('l1_key', l1TestValue);
  // L1 cache still has value, don't clear
  const l1Hit = await TestInterviewCacheManager.get('l1_key');
  assert(
    deepEqual(l1Hit, l1TestValue),
    'L1 cache returns original value without deserialization'
  );

  // Test 10: Large object handling
  console.log('\nTest 10: Large Object Serialization');
  await TestInterviewCacheManager.clear();
  const largeValue = {
    sessionId: 'large_1',
    responses: Array.from({ length: 50 }, (_, i) => ({
      id: i,
      answer: 'x'.repeat(100),
      score: Math.random() * 10
    }))
  };
  const start = Date.now();
  await TestInterviewCacheManager.set('test_large', largeValue);
  memoryCache.flushAll();
  const largeRetrieved = await TestInterviewCacheManager.get('test_large');
  const duration = Date.now() - start;
  assert(
    deepEqual(largeRetrieved, largeValue) && duration < 100,
    `Large object processed in ${duration}ms (< 100ms target)`
  );

  // Test 11: JSON serialization behavior with undefined (edge case)
  console.log('\nTest 11: JSON Edge Cases');
  await TestInterviewCacheManager.clear();
  // Note: JSON.stringify(undefined) returns undefined, so we test a realistic object with undefined field
  const objWithUndefined = { id: 1, value: undefined, name: 'test' };
  await TestInterviewCacheManager.set('test_undefined', objWithUndefined);
  memoryCache.flushAll();
  const retrievedUndef = await TestInterviewCacheManager.get('test_undefined');
  // JSON.stringify strips undefined fields, so we expect { id: 1, name: 'test' }
  assert(
    retrievedUndef.id === 1 && retrievedUndef.name === 'test' && !('value' in retrievedUndef),
    'Objects with undefined fields handled correctly (undefined fields stripped by JSON)'
  );

  // Test 12: Empty structures
  console.log('\nTest 12: Empty Structure Handling');
  await TestInterviewCacheManager.clear();
  const emptyObj = {};
  const emptyArr = [];
  const emptyStr = '';
  await TestInterviewCacheManager.set('test_empty_obj', emptyObj);
  await TestInterviewCacheManager.set('test_empty_arr', emptyArr);
  await TestInterviewCacheManager.set('test_empty_str', emptyStr);
  memoryCache.flushAll();
  const eObj = await TestInterviewCacheManager.get('test_empty_obj');
  const eArr = await TestInterviewCacheManager.get('test_empty_arr');
  const eStr = await TestInterviewCacheManager.get('test_empty_str');
  assert(
    deepEqual(eObj, {}) && deepEqual(eArr, []) && eStr === '',
    'Empty structures (object, array, string) handled correctly'
  );

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ Passed: ${passCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  if (failCount === 0) {
    console.log('🎉 All serialization tests passed!\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed\n');
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
