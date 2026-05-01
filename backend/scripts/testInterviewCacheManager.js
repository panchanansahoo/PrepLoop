import NodeCache from 'node-cache';
import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('InterviewCacheManager-Test');

// Simulate the optimized InterviewCacheManager
const memoryCache = new NodeCache({ stdTTL: 60, checkperiod: 70 });

const TTL_ACTIVE_SESSION = 1800;
const TTL_COMPLETED_SESSION = 86400;

// Mock Redis client that simulates Upstash behavior
class MockUpstashRedis {
  constructor() {
    this.storage = new Map();
  }

  async get(key) {
    return this.storage.get(key) || null;
  }

  async set(key, value, options) {
    // Upstash REST API returns strings
    this.storage.set(key, value);
    return 'OK';
  }

  async del(key) {
    this.storage.delete(key);
    return 1;
  }
}

const mockRedis = new MockUpstashRedis();

class TestInterviewCacheManager {
  static getSessionTTL(sessionMetadata) {
    if (!sessionMetadata) return TTL_ACTIVE_SESSION;
    return sessionMetadata.stage === 'completed' || sessionMetadata.continueInterview === false
      ? TTL_COMPLETED_SESSION
      : TTL_ACTIVE_SESSION;
  }

  static async get(key) {
    const l1Result = memoryCache.get(key);
    if (l1Result) {
      return l1Result;
    }

    const l2Result = await mockRedis.get(key);
    if (l2Result) {
      let deserialized = l2Result;
      if (typeof l2Result === 'string') {
        try {
          deserialized = JSON.parse(l2Result);
        } catch (parseError) {
          logger.debug('Failed to parse Redis value as JSON, using raw value', { key });
        }
      }

      memoryCache.set(key, deserialized);
      return deserialized;
    }

    return null;
  }

  static async set(key, value, customTTL = null) {
    const ttl = customTTL || this.getSessionTTL(value);

    memoryCache.set(key, value, Math.min(60, ttl));

    let serialized = value;
    try {
      if (typeof value === 'object' && value !== null) {
        serialized = JSON.stringify(value);
      }
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

  console.log('🧪 Testing InterviewCacheManager Serialization/Deserialization...\n');

  // Test 1: Serialize and deserialize simple object
  console.log('Test 1: Simple Object Serialization');
  await TestInterviewCacheManager.clear();
  const session1 = {
    sessionId: 'session_123',
    userId: 'user_456',
    interviewType: 'dsa',
    difficulty: 'medium',
    stage: 'in_progress'
  };
  await TestInterviewCacheManager.set('interview_session_123', session1);
  const retrieved1 = await TestInterviewCacheManager.get('interview_session_123');
  assert(deepEqual(retrieved1, session1), 'Simple object serialized and deserialized correctly');

  // Test 2: Clear L1 cache and retrieve from L2 (Redis)
  console.log('\nTest 2: Redis Fallback After L1 Eviction');
  await TestInterviewCacheManager.clear();
  const session2 = {
    sessionId: 'session_789',
    userId: 'user_101',
    stage: 'completed',
    continueInterview: false,
    scores: { coding: 8, communication: 7 }
  };
  await TestInterviewCacheManager.set('interview_session_789', session2);
  // Simulate L1 eviction by clearing memory cache
  memoryCache.flushAll();
  const retrieved2 = await TestInterviewCacheManager.get('interview_session_789');
  assert(deepEqual(retrieved2, session2), 'Object correctly retrieved from Redis after L1 eviction');

  // Test 3: Nested objects with arrays
  console.log('\nTest 3: Complex Nested Structures');
  await TestInterviewCacheManager.clear();
  const session3 = {
    sessionId: 'session_999',
    userId: 'user_202',
    stage: 'in_progress',
    responses: [
      { questionId: 'q1', answer: 'Test answer 1', score: 8 },
      { questionId: 'q2', answer: 'Test answer 2', score: 7 }
    ],
    metadata: {
      startTime: new Date('2026-05-01T14:00:00Z').toISOString(),
      scores: {
        coding: 8,
        communication: 7,
        problemSolving: 8
      }
    }
  };
  await TestInterviewCacheManager.set('interview_session_999', session3);
  memoryCache.flushAll();
  const retrieved3 = await TestInterviewCacheManager.get('interview_session_999');
  assert(deepEqual(retrieved3, session3), 'Complex nested structure preserved through serialization');

  // Test 4: TTL determination for active sessions
  console.log('\nTest 4: Active Session TTL');
  await TestInterviewCacheManager.clear();
  const activeSession = {
    sessionId: 'active_1',
    stage: 'in_progress'
  };
  await TestInterviewCacheManager.set('interview_session_active_1', activeSession);
  const ttl1 = TestInterviewCacheManager.getSessionTTL(activeSession);
  assert(ttl1 === TTL_ACTIVE_SESSION, `Active session TTL is ${TTL_ACTIVE_SESSION}s`);

  // Test 5: TTL determination for completed sessions
  console.log('\nTest 5: Completed Session TTL');
  const completedSession = {
    sessionId: 'completed_1',
    stage: 'completed',
    continueInterview: false
  };
  const ttl2 = TestInterviewCacheManager.getSessionTTL(completedSession);
  assert(ttl2 === TTL_COMPLETED_SESSION, `Completed session TTL is ${TTL_COMPLETED_SESSION}s`);

  // Test 6: String values (non-object)
  console.log('\nTest 6: Non-Object String Values');
  await TestInterviewCacheManager.clear();
  const stringValue = 'simple string cache value';
  await TestInterviewCacheManager.set('string_key', stringValue);
  memoryCache.flushAll();
  const retrievedString = await TestInterviewCacheManager.get('string_key');
  assert(retrievedString === stringValue, 'Non-object string values handled correctly');

  // Test 7: Number values
  console.log('\nTest 7: Number Values');
  await TestInterviewCacheManager.clear();
  const numberValue = 42;
  await TestInterviewCacheManager.set('number_key', numberValue);
  memoryCache.flushAll();
  const retrievedNumber = await TestInterviewCacheManager.get('number_key');
  assert(retrievedNumber === numberValue, 'Number values handled correctly');

  // Test 8: Null and undefined handling
  console.log('\nTest 8: Null Values');
  await TestInterviewCacheManager.clear();
  const nullValue = null;
  await TestInterviewCacheManager.set('null_key', nullValue);
  const retrievedNull = await TestInterviewCacheManager.get('null_key');
  assert(retrievedNull === nullValue, 'Null values handled correctly');

  // Test 9: Deletion consistency
  console.log('\nTest 9: Deletion Consistency');
  await TestInterviewCacheManager.clear();
  const session9 = { sessionId: 'session_del', userId: 'user_del' };
  await TestInterviewCacheManager.set('interview_del', session9);
  const existsBefore = await TestInterviewCacheManager.get('interview_del');
  assert(existsBefore !== null, 'Value exists before deletion');
  
  await TestInterviewCacheManager.del('interview_del');
  const existsAfter = await TestInterviewCacheManager.get('interview_del');
  assert(existsAfter === null, 'Value deleted from both L1 and L2 caches');

  // Test 10: Large object serialization (performance test)
  console.log('\nTest 10: Large Object Serialization Performance');
  await TestInterviewCacheManager.clear();
  const largeSession = {
    sessionId: 'large_session',
    userId: 'user_large',
    responses: Array.from({ length: 100 }, (_, i) => ({
      questionId: `q_${i}`,
      answer: `Answer to question ${i}`,
      score: Math.random() * 10,
      feedback: 'Good work!'.repeat(10)
    }))
  };

  const start = Date.now();
  await TestInterviewCacheManager.set('interview_large', largeSession);
  memoryCache.flushAll();
  const largeRetrieved = await TestInterviewCacheManager.get('interview_large');
  const duration = Date.now() - start;

  assert(deepEqual(largeRetrieved, largeSession) && duration < 100, `Large object processed in ${duration}ms (< 100ms target)`);

  // Test 11: Verify Redis storage contains JSON strings
  console.log('\nTest 11: Redis Storage Format Verification');
  await TestInterviewCacheManager.clear();
  const testSession = { sessionId: 'verify_1', test: true };
  await TestInterviewCacheManager.set('interview_verify', testSession);
  const redisRawValue = mockRedis.storage.get('interview_verify');
  assert(typeof redisRawValue === 'string', 'Redis stores JSON strings, not objects');
  assert(redisRawValue === JSON.stringify(testSession), 'Redis value matches JSON.stringify output');

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ Passed: ${passCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  if (failCount === 0) {
    console.log('\n🎉 All serialization tests passed!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed');
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
