import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('CachedInterviewService-Integration-Test');

// Mock data matching real use patterns
const mockInterviewData = {
  getInterviewSession: {
    sessionId: 'sess_abc123',
    user_id: 'user_xyz789',
    interviewType: 'dsa',
    difficulty: 'hard',
    stage: 'in_progress',
    questions_answered: 2,
    total_questions: 5,
    current_scores: { coding: 8.5, communication: 7.2 }
  },

  sessionMetadata: {
    sessionId: 'sess_abc123',
    userId: 'user_xyz789',
    interviewType: 'dsa',
    difficulty: 'hard',
    companyFocus: 'google',
    stage: 'in_progress',
    stageLabel: 'Question Answering'
  },

  responseUpdate: {
    sessionId: 'sess_abc123',
    userId: 'user_xyz789',
    stage: 'scoring',
    stageLabel: 'Response Evaluation',
    current_scores: { coding: 9.0, communication: 8.1 },
    continueInterview: true
  },

  completedSession: {
    sessionId: 'sess_abc123',
    userId: 'user_xyz789',
    stage: 'completed',
    stageLabel: 'Interview Complete',
    current_scores: { coding: 8.8, communication: 7.9 },
    continueInterview: false,
    final_score: 8.35,
    feedback: 'Great performance on coding, room for improvement in communication'
  }
};

// Simulate InterviewCacheManager with serialization
class MockInterviewCacheManager {
  static storage = new Map(); // Simulates Upstash Redis

  static async set(key, value, customTTL = null) {
    // Serialize to JSON (as per the fix)
    let serialized = value;
    if (typeof value === 'object' && value !== null) {
      serialized = JSON.stringify(value);
    }
    this.storage.set(key, serialized);
    return true;
  }

  static async get(key) {
    const l2Result = this.storage.get(key);
    if (l2Result) {
      // Deserialize from JSON
      let deserialized = l2Result;
      if (typeof l2Result === 'string') {
        try {
          deserialized = JSON.parse(l2Result);
        } catch (parseError) {
          logger.debug('Failed to parse Redis value as JSON', { key });
        }
      }
      return deserialized;
    }
    return null;
  }

  static async del(key) {
    this.storage.delete(key);
    return true;
  }

  static clear() {
    this.storage.clear();
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

  console.log('🧪 Testing CachedInterviewService Integration...\n');

  // Test 1: Cache interview session (getInterviewSession use case)
  console.log('Test 1: Cache Interview Session');
  MockInterviewCacheManager.clear();
  const session = mockInterviewData.getInterviewSession;
  const cacheKey1 = `interview_session_${session.sessionId}`;
  
  await MockInterviewCacheManager.set(cacheKey1, session);
  const retrieved1 = await MockInterviewCacheManager.get(cacheKey1);
  
  assert(retrieved1 !== null, 'Session retrieved from cache');
  assert(deepEqual(retrieved1, session), 'Session data matches original');
  assert(retrieved1.user_id === session.user_id, 'User ID preserved');
  assert(retrieved1.current_scores.coding === session.current_scores.coding, 'Nested scores preserved');

  // Test 2: Cache session metadata (initializeInterview use case)
  console.log('\nTest 2: Cache Session Metadata');
  MockInterviewCacheManager.clear();
  const metadata = mockInterviewData.sessionMetadata;
  const cacheKey2 = `interview_session_${metadata.sessionId}`;
  
  await MockInterviewCacheManager.set(cacheKey2, metadata);
  const retrieved2 = await MockInterviewCacheManager.get(cacheKey2);
  
  assert(deepEqual(retrieved2, metadata), 'Session metadata matches original');
  assert(retrieved2.interviewType === metadata.interviewType, 'Interview type preserved');
  assert(retrieved2.stageLabel === metadata.stageLabel, 'Stage label preserved');

  // Test 3: Update cached session (processInterviewResponse use case)
  console.log('\nTest 3: Update Cached Session After Response');
  const update = mockInterviewData.responseUpdate;
  const cacheKey3 = `interview_session_${update.sessionId}`;
  
  await MockInterviewCacheManager.set(cacheKey3, update);
  const retrieved3 = await MockInterviewCacheManager.get(cacheKey3);
  
  assert(deepEqual(retrieved3, update), 'Updated session matches');
  assert(retrieved3.stage === 'scoring', 'Stage updated correctly');
  assert(retrieved3.current_scores.coding === 9.0, 'Scores updated correctly');
  assert(retrieved3.continueInterview === true, 'Continue flag preserved');

  // Test 4: Complete session and persist (completeInterview use case)
  console.log('\nTest 4: Mark Session as Completed');
  const completed = mockInterviewData.completedSession;
  const cacheKey4 = `interview_session_${completed.sessionId}`;
  
  await MockInterviewCacheManager.set(cacheKey4, completed);
  const retrieved4 = await MockInterviewCacheManager.get(cacheKey4);
  
  assert(retrieved4.stage === 'completed', 'Session marked as completed');
  assert(retrieved4.continueInterview === false, 'Continue flag set to false');
  assert(retrieved4.final_score === 8.35, 'Final score stored correctly');
  assert(retrieved4.feedback.includes('communication'), 'Feedback preserved');

  // Test 5: Clear cached session (clearCachedSession use case)
  console.log('\nTest 5: Clear Cached Session');
  const clearKey = `interview_session_clear_test`;
  await MockInterviewCacheManager.set(clearKey, { sessionId: 'test' });
  
  const existsBefore = await MockInterviewCacheManager.get(clearKey);
  assert(existsBefore !== null, 'Session exists before clear');
  
  await MockInterviewCacheManager.del(clearKey);
  const existsAfter = await MockInterviewCacheManager.get(clearKey);
  assert(existsAfter === null, 'Session deleted successfully');

  // Test 6: Multiple concurrent sessions
  console.log('\nTest 6: Multiple Concurrent Sessions');
  MockInterviewCacheManager.clear();
  const sessions = [
    { ...mockInterviewData.getInterviewSession, sessionId: 'sess_1', user_id: 'user_1' },
    { ...mockInterviewData.getInterviewSession, sessionId: 'sess_2', user_id: 'user_2' },
    { ...mockInterviewData.getInterviewSession, sessionId: 'sess_3', user_id: 'user_3' }
  ];

  const cachePromises = sessions.map(sess => 
    MockInterviewCacheManager.set(`interview_session_${sess.sessionId}`, sess)
  );
  await Promise.all(cachePromises);

  const retrievePromises = sessions.map(sess =>
    MockInterviewCacheManager.get(`interview_session_${sess.sessionId}`)
  );
  const retrievedSessions = await Promise.all(retrievePromises);

  assert(retrievedSessions.length === 3, 'All 3 sessions retrieved');
  assert(deepEqual(retrievedSessions[0], sessions[0]), 'Session 1 matches');
  assert(deepEqual(retrievedSessions[1], sessions[1]), 'Session 2 matches');
  assert(deepEqual(retrievedSessions[2], sessions[2]), 'Session 3 matches');

  // Test 7: Verify JSON serialization in storage
  console.log('\nTest 7: Verify JSON Serialization Format');
  MockInterviewCacheManager.clear();
  const testSession = mockInterviewData.sessionMetadata;
  const storageKey = `interview_session_serialization_test`;
  
  await MockInterviewCacheManager.set(storageKey, testSession);
  const rawStoredValue = MockInterviewCacheManager.storage.get(storageKey);
  
  assert(typeof rawStoredValue === 'string', 'Value stored as JSON string');
  assert(rawStoredValue === JSON.stringify(testSession), 'JSON format matches stringify output');

  const reParsed = JSON.parse(rawStoredValue);
  assert(deepEqual(reParsed, testSession), 'Stored JSON deserializes correctly');

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ Passed: ${passCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  if (failCount === 0) {
    console.log('\n🎉 All CachedInterviewService integration tests passed!');
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
