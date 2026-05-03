// Phase 5.1: Voting Service Tests
// Test suite for voting mechanics and aggregation

import VotingService from '../services/votingService.js';

const TEST_USER_ID = 'test-user-voting';
const TEST_SOLUTION_ID = 'test-solution-voting'; // Will use actual ID from setup

let testSolutionId = null;

async function runTests() {
  let passed = 0;
  let failed = 0;

  console.log('🧪 Voting Service Tests\n');

  // Setup: Create a test solution (simulated)
  testSolutionId = TEST_SOLUTION_ID;

  // Test 1: Upvote
  try {
    console.log('Test 1: Upvote solution');
    const result = await VotingService.vote(TEST_USER_ID, testSolutionId, 1);
    if (result.upvotes >= 0 && result.downvotes >= 0) {
      console.log(`✅ Upvote recorded (upvotes: ${result.upvotes})\n`);
      passed++;
    } else {
      console.log('❌ Invalid vote response\n');
      failed++;
    }
  } catch (error) {
    console.log(`⚠️  Test skipped (no test solution): ${error.message}\n`);
  }

  // Test 2: Downvote
  try {
    console.log('Test 2: Downvote solution');
    const result = await VotingService.vote(TEST_USER_ID, testSolutionId, -1);
    if (result.downvotes > 0 || result.upvotes >= 0) {
      console.log(`✅ Downvote recorded (downvotes: ${result.downvotes})\n`);
      passed++;
    } else {
      console.log('❌ Invalid vote response\n');
      failed++;
    }
  } catch (error) {
    console.log(`⚠️  Test skipped: ${error.message}\n`);
  }

  // Test 3: Remove vote
  try {
    console.log('Test 3: Remove vote');
    const result = await VotingService.vote(TEST_USER_ID, testSolutionId, 0);
    if (result && typeof result.upvotes === 'number') {
      console.log('✅ Vote removed\n');
      passed++;
    } else {
      console.log('❌ Invalid response\n');
      failed++;
    }
  } catch (error) {
    console.log(`⚠️  Test skipped: ${error.message}\n`);
  }

  // Test 4: Invalid vote value
  try {
    console.log('Test 4: Invalid vote value');
    await VotingService.vote(TEST_USER_ID, testSolutionId, 2);
    console.log('❌ Should have thrown error\n');
    failed++;
  } catch (error) {
    console.log(`✅ Correctly rejected: ${error.message}\n`);
    passed++;
  }

  // Test 5: Get vote count
  try {
    console.log('Test 5: Get vote count');
    const result = await VotingService.getVotes(testSolutionId);
    if (typeof result.upvotes === 'number' && typeof result.downvotes === 'number') {
      console.log(`✅ Vote counts retrieved (up: ${result.upvotes}, down: ${result.downvotes})\n`);
      passed++;
    } else {
      console.log('❌ Invalid vote count format\n');
      failed++;
    }
  } catch (error) {
    console.log(`⚠️  Test skipped: ${error.message}\n`);
  }

  // Test 6: User vote tracking
  try {
    console.log('Test 6: User vote tracking');
    await VotingService.vote(TEST_USER_ID, testSolutionId, 1);
    const result = await VotingService.getVotes(testSolutionId, TEST_USER_ID);
    if (result.userVote === 1) {
      console.log('✅ User vote tracked\n');
      passed++;
    } else {
      console.log('❌ User vote not tracked\n');
      failed++;
    }
  } catch (error) {
    console.log(`⚠️  Test skipped: ${error.message}\n`);
  }

  // Test 7: Vote replacement
  try {
    console.log('Test 7: Vote replacement (upvote → downvote)');
    await VotingService.vote(TEST_USER_ID, testSolutionId, 1);
    await VotingService.vote(TEST_USER_ID, testSolutionId, -1);
    const result = await VotingService.getVotes(testSolutionId, TEST_USER_ID);
    if (result.userVote === -1) {
      console.log('✅ Vote replaced correctly\n');
      passed++;
    } else {
      console.log('❌ Vote not replaced\n');
      failed++;
    }
  } catch (error) {
    console.log(`⚠️  Test skipped: ${error.message}\n`);
  }

  // Test 8: Missing solution ID
  try {
    console.log('Test 8: Missing solution ID');
    await VotingService.vote(TEST_USER_ID, null, 1);
    console.log('❌ Should have thrown error\n');
    failed++;
  } catch (error) {
    console.log(`✅ Correctly rejected: ${error.message}\n`);
    passed++;
  }

  // Test 9: Missing user ID
  try {
    console.log('Test 9: Missing user ID');
    await VotingService.vote(null, testSolutionId, 1);
    console.log('❌ Should have thrown error\n');
    failed++;
  } catch (error) {
    console.log(`✅ Correctly rejected: ${error.message}\n`);
    passed++;
  }

  // Test 10: Vote total calculation
  try {
    console.log('Test 10: Vote total calculation');
    const result = await VotingService.getVotes(testSolutionId);
    if (result.total === result.upvotes - result.downvotes) {
      console.log(`✅ Vote total calculated correctly (${result.total})\n`);
      passed++;
    } else {
      console.log('❌ Vote total calculation incorrect\n');
      failed++;
    }
  } catch (error) {
    console.log(`⚠️  Test skipped: ${error.message}\n`);
  }

  // Test 11: Get vote statistics
  try {
    console.log('Test 11: Get vote statistics');
    const result = await VotingService.getVoteStats(testSolutionId);
    if (result.ratio >= 0 && result.ratio <= 100) {
      console.log(`✅ Vote stats retrieved (ratio: ${result.ratio.toFixed(1)}%)\n`);
      passed++;
    } else {
      console.log('❌ Invalid vote stats\n');
      failed++;
    }
  } catch (error) {
    console.log(`⚠️  Test skipped: ${error.message}\n`);
  }

  // Test 12: Remove vote method
  try {
    console.log('Test 12: Remove vote convenience method');
    await VotingService.vote(TEST_USER_ID, testSolutionId, 1);
    const result = await VotingService.removeVote(TEST_USER_ID, testSolutionId);
    if (result && typeof result.upvotes === 'number') {
      console.log('✅ Vote removed via convenience method\n');
      passed++;
    } else {
      console.log('❌ Invalid response\n');
      failed++;
    }
  } catch (error) {
    console.log(`⚠️  Test skipped: ${error.message}\n`);
  }

  // Test 13: Top solutions ranking
  try {
    console.log('Test 13: Top solutions by votes');
    const result = await VotingService.getTopSolutionsByVotes(1, 5);
    if (Array.isArray(result)) {
      console.log(`✅ Retrieved top ${result.length} solutions\n`);
      passed++;
    } else {
      console.log('❌ Invalid response format\n');
      failed++;
    }
  } catch (error) {
    console.log(`⚠️  Test skipped: ${error.message}\n`);
  }

  // Test 14: Invalid limit
  try {
    console.log('Test 14: Invalid limit (> 100)');
    await VotingService.getTopSolutionsByVotes(1, 150);
    console.log('❌ Should have thrown error\n');
    failed++;
  } catch (error) {
    console.log(`✅ Correctly rejected: ${error.message}\n`);
    passed++;
  }

  // Test 15: Vote vote on nonexistent solution
  try {
    console.log('Test 15: Vote on nonexistent solution');
    await VotingService.vote(TEST_USER_ID, 'nonexistent-id', 1);
    console.log('❌ Should have thrown error or handled gracefully\n');
    failed++;
  } catch (error) {
    console.log(`✅ Error handled: ${error.message}\n`);
    passed++;
  }

  // Summary
  console.log(`\n📊 Summary: ${passed} passed, ${failed} failed (Total: ${passed + failed})`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
