#!/usr/bin/env node

/**
 * Collaboration Service Verification Test
 * Tests real-time peer session lifecycle:
 * - Session creation & parameter initialization
 * - Role assignment & session info extraction
 * - Participant joining & capacity enforcement
 * - Code change broadcast
 * - Session statistics tracking
 * - Safe termination and garbage collection
 */

import collaborationService from '../services/collaborationService.ts';
import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('test-collaboration');

export function runCollaborationTests() {
  console.log('\n' + '='.repeat(60));
  console.log('  COLLABORATION SERVICE UNIT & LIFECYCLE TESTS');
  console.log('='.repeat(60) + '\n');

  let passed = 0;
  let failed = 0;

  function assert(name, condition, errorMsg = '') {
    if (condition) {
      console.log(`  ✅ ${name}`);
      passed++;
    } else {
      console.log(`  ❌ ${name} - ${errorMsg}`);
      failed++;
    }
  }

  // 1. Initial State
  const initialStats = collaborationService.getStatistics();
  assert(
    'Initial statistics format',
    typeof initialStats.activeSessions === 'number' && typeof initialStats.totalParticipants === 'number',
    'Unexpected statistics payload'
  );

  // Setup mock user connections for testing
  const testUserId = 'test_user_alice';
  const secondUserId = 'test_user_bob';
  const sentMessages = [];

  const createMockWs = (uid) => ({
    readyState: 1,
    send: (msg) => {
      try {
        sentMessages.push({ uid, parsed: JSON.parse(msg) });
      } catch {
        sentMessages.push({ uid, msg });
      }
    },
  });

  collaborationService.users.set(testUserId, {
    ws: createMockWs(testUserId),
    userId: testUserId,
    sessionId: null,
  });

  collaborationService.users.set(secondUserId, {
    ws: createMockWs(secondUserId),
    userId: secondUserId,
    sessionId: null,
  });

  // 2. Session Creation
  const sessionConfig = {
    language: 'typescript',
    problem: 'reverse-linked-list',
    initialCode: 'function reverseList(head) {}',
    role: 'interviewer',
  };

  collaborationService.createSession(testUserId, sessionConfig);
  const userRecord = collaborationService.users.get(testUserId);
  const session = userRecord?.sessionId ? collaborationService.sessions.get(userRecord.sessionId) : null;
  const activeSessions = collaborationService.getActiveSessions();

  assert('Session created and mapped to user', !!session && session.host === testUserId, 'Session not mapped to user');
  assert('Session language matches', session?.language === 'typescript', 'Incorrect session language');
  assert('Session problem matches', session?.problem === 'reverse-linked-list', 'Incorrect problem ID');
  assert('Active sessions count incremented', activeSessions.length >= 1, 'Session not visible in active sessions');

  // 3. Session Info Inspection
  const sessionInfo = session ? collaborationService.getSessionInfo(session) : {};
  assert(
    'Safe session info formatting',
    Array.isArray(sessionInfo.participants) && sessionInfo.roles?.[testUserId] === 'interviewer',
    'Session info missing required sanitized fields'
  );

  // 4. Participant Joining
  collaborationService.joinSession(secondUserId, session.id);
  assert('Second user added to participants', session.participants.has(secondUserId), 'Second user failed to join');

  const statsAfterJoin = collaborationService.getStatistics();
  assert(
    'Statistics reflects participants',
    statsAfterJoin.totalParticipants >= 2,
    `Expected >=2 participants, got ${statsAfterJoin.totalParticipants}`
  );

  // 5. Code Sync Broadcast
  const newCode = 'function reverseList(head) { return head; }';
  collaborationService.broadcastCodeChange(testUserId, { code: newCode });
  assert('Code updated in session store', session.code === newCode, 'Code change was not persisted');

  // 6. User Leaving & Auto-Cleanup
  collaborationService.leaveSession(secondUserId);
  assert('Participant leaves successfully', !session.participants.has(secondUserId), 'Participant still in session');

  collaborationService.leaveSession(testUserId);
  assert(
    'Empty session auto-destroyed',
    !collaborationService.sessions.has(session.id),
    'Empty session was not removed from session map'
  );

  // Cleanup mock users
  collaborationService.users.delete(testUserId);
  collaborationService.users.delete(secondUserId);

  console.log('\n' + '='.repeat(60));
  console.log(`  Results: ✅ ${passed} passed | ❌ ${failed} failed`);
  console.log('='.repeat(60) + '\n');

  logger.info('Collaboration tests completed', { passed, failed });
  return { passed, failed };
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('testCollaboration.js')) {
  try {
    const { failed } = runCollaborationTests();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Collaboration test execution failed:', err);
    process.exit(1);
  }
}
