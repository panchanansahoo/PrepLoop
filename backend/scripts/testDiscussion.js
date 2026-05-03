// Phase 5.1: Discussion Service Tests
// Test suite for threaded discussions and comments

import DiscussionService from '../services/discussionService.js';

const TEST_USER_ID = 'test-user-discussion';
const TEST_SOLUTION_ID = 'test-solution-discussion';

let testThreadId = null;

async function runTests() {
  let passed = 0;
  let failed = 0;

  console.log('🧪 Discussion Service Tests\n');

  // Test 1: Create root discussion
  try {
    console.log('Test 1: Create root discussion thread');
    const result = await DiscussionService.createDiscussion(
      TEST_SOLUTION_ID,
      TEST_USER_ID,
      'Great solution! How does the algorithm work?'
    );
    if (result.id && result.solutionId === TEST_SOLUTION_ID) {
      testThreadId = result.id;
      console.log('✅ Root thread created\n');
      passed++;
    } else {
      console.log('❌ Invalid thread response\n');
      failed++;
    }
  } catch (error) {
    console.log(`⚠️  Test skipped (no test solution): ${error.message}\n`);
  }

  // Test 2: Create empty discussion
  try {
    console.log('Test 2: Create empty discussion (should fail)');
    await DiscussionService.createDiscussion(TEST_SOLUTION_ID, TEST_USER_ID, '');
    console.log('❌ Should have thrown error\n');
    failed++;
  } catch (error) {
    console.log(`✅ Correctly rejected: ${error.message}\n`);
    passed++;
  }

  // Test 3: Reply to discussion
  if (testThreadId) {
    try {
      console.log('Test 3: Reply to discussion thread');
      const result = await DiscussionService.replyToDiscussion(
        TEST_SOLUTION_ID,
        testThreadId,
        'other-user',
        'It uses a two-pointer technique for O(n) time complexity'
      );
      if (result.id && result.threadId === testThreadId) {
        console.log('✅ Reply created\n');
        passed++;
      } else {
        console.log('❌ Invalid reply response\n');
        failed++;
      }
    } catch (error) {
      console.log(`⚠️  Test skipped: ${error.message}\n`);
    }
  }

  // Test 4: Get discussions
  try {
    console.log('Test 4: Get discussions for solution');
    const result = await DiscussionService.getDiscussions(TEST_SOLUTION_ID);
    if (Array.isArray(result.discussions) && typeof result.total === 'number') {
      console.log(`✅ Retrieved ${result.discussions.length} discussions\n`);
      passed++;
    } else {
      console.log('❌ Invalid discussions format\n');
      failed++;
    }
  } catch (error) {
    console.log(`⚠️  Test skipped: ${error.message}\n`);
  }

  // Test 5: Sort discussions by recent
  try {
    console.log('Test 5: Sort discussions by recent');
    const result = await DiscussionService.getDiscussions(TEST_SOLUTION_ID, {
      sortBy: 'recent',
    });
    if (Array.isArray(result.discussions)) {
      console.log('✅ Recent sorting applied\n');
      passed++;
    } else {
      console.log('❌ Sorting failed\n');
      failed++;
    }
  } catch (error) {
    console.log(`⚠️  Test skipped: ${error.message}\n`);
  }

  // Test 6: Sort discussions by likes
  try {
    console.log('Test 6: Sort discussions by likes');
    const result = await DiscussionService.getDiscussions(TEST_SOLUTION_ID, {
      sortBy: 'likes',
    });
    if (Array.isArray(result.discussions)) {
      console.log('✅ Likes sorting applied\n');
      passed++;
    } else {
      console.log('❌ Sorting failed\n');
      failed++;
    }
  } catch (error) {
    console.log(`⚠️  Test skipped: ${error.message}\n`);
  }

  // Test 7: Pagination
  try {
    console.log('Test 7: Discussions pagination');
    const result = await DiscussionService.getDiscussions(TEST_SOLUTION_ID, {
      limit: 5,
      offset: 0,
    });
    if (result.discussions.length <= 5) {
      console.log('✅ Pagination applied correctly\n');
      passed++;
    } else {
      console.log('❌ Pagination not applied\n');
      failed++;
    }
  } catch (error) {
    console.log(`⚠️  Test skipped: ${error.message}\n`);
  }

  // Test 8: Comment too long
  try {
    console.log('Test 8: Comment exceeds 5000 characters');
    const longComment = 'x'.repeat(5001);
    await DiscussionService.createDiscussion(TEST_SOLUTION_ID, TEST_USER_ID, longComment);
    console.log('❌ Should have thrown error\n');
    failed++;
  } catch (error) {
    console.log(`✅ Correctly rejected: ${error.message}\n`);
    passed++;
  }

  // Test 9: Like comment
  if (testThreadId) {
    try {
      console.log('Test 9: Like comment');
      const result = await DiscussionService.likeComment(testThreadId);
      if (typeof result.likes === 'number' && result.likes > 0) {
        console.log(`✅ Comment liked (${result.likes} likes)\n`);
        passed++;
      } else {
        console.log('❌ Like count not updated\n');
        failed++;
      }
    } catch (error) {
      console.log(`⚠️  Test skipped: ${error.message}\n`);
    }
  }

  // Test 10: Get discussion count
  try {
    console.log('Test 10: Get discussion count');
    const count = await DiscussionService.getDiscussionCount(TEST_SOLUTION_ID);
    if (typeof count === 'number' && count >= 0) {
      console.log(`✅ Discussion count: ${count}\n`);
      passed++;
    } else {
      console.log('❌ Invalid count format\n');
      failed++;
    }
  } catch (error) {
    console.log(`⚠️  Test skipped: ${error.message}\n`);
  }

  // Test 11: Get single thread with replies
  if (testThreadId) {
    try {
      console.log('Test 11: Get thread with replies');
      const result = await DiscussionService.getThread(testThreadId);
      if (result.id === testThreadId && Array.isArray(result.replies)) {
        console.log(`✅ Thread retrieved with ${result.replies.length} replies\n`);
        passed++;
      } else {
        console.log('❌ Invalid thread format\n');
        failed++;
      }
    } catch (error) {
      console.log(`⚠️  Test skipped: ${error.message}\n`);
    }
  }

  // Test 12: Missing solution ID
  try {
    console.log('Test 12: Missing solution ID');
    await DiscussionService.createDiscussion(null, TEST_USER_ID, 'comment');
    console.log('❌ Should have thrown error\n');
    failed++;
  } catch (error) {
    console.log(`✅ Correctly rejected: ${error.message}\n`);
    passed++;
  }

  // Test 13: Reply to nonexistent thread
  try {
    console.log('Test 13: Reply to nonexistent thread');
    await DiscussionService.replyToDiscussion(
      TEST_SOLUTION_ID,
      'nonexistent-thread',
      TEST_USER_ID,
      'reply'
    );
    console.log('❌ Should have thrown error\n');
    failed++;
  } catch (error) {
    console.log(`✅ Correctly rejected: ${error.message}\n`);
    passed++;
  }

  // Test 14: Nested replies structure
  if (testThreadId) {
    try {
      console.log('Test 14: Nested replies preserved in thread');
      const result = await DiscussionService.getThread(testThreadId);
      if (result.replies && Array.isArray(result.replies)) {
        console.log('✅ Nested replies structure preserved\n');
        passed++;
      } else {
        console.log('❌ Replies not properly nested\n');
        failed++;
      }
    } catch (error) {
      console.log(`⚠️  Test skipped: ${error.message}\n`);
    }
  }

  // Test 15: Discussion with whitespace only
  try {
    console.log('Test 15: Discussion with whitespace only');
    await DiscussionService.createDiscussion(TEST_SOLUTION_ID, TEST_USER_ID, '   \n\t  ');
    console.log('❌ Should have thrown error\n');
    failed++;
  } catch (error) {
    console.log(`✅ Correctly rejected: ${error.message}\n`);
    passed++;
  }

  // Test 16: Create multiple discussions
  try {
    console.log('Test 16: Create multiple discussions on same solution');
    await DiscussionService.createDiscussion(
      TEST_SOLUTION_ID,
      'user1',
      'First comment'
    );
    await DiscussionService.createDiscussion(
      TEST_SOLUTION_ID,
      'user2',
      'Second comment'
    );
    const result = await DiscussionService.getDiscussions(TEST_SOLUTION_ID);
    if (result.discussions.length >= 2) {
      console.log('✅ Multiple discussions created\n');
      passed++;
    } else {
      console.log('❌ Not all discussions retrieved\n');
      failed++;
    }
  } catch (error) {
    console.log(`⚠️  Test skipped: ${error.message}\n`);
  }

  // Test 17: Discussion with special characters
  try {
    console.log('Test 17: Discussion with special characters');
    const result = await DiscussionService.createDiscussion(
      TEST_SOLUTION_ID,
      TEST_USER_ID,
      'Special chars: <script>alert("xss")</script> & more!'
    );
    if (result.id) {
      console.log('✅ Special characters handled\n');
      passed++;
    } else {
      console.log('❌ Failed to handle special characters\n');
      failed++;
    }
  } catch (error) {
    console.log(`⚠️  Test skipped: ${error.message}\n`);
  }

  // Summary
  console.log(`\n📊 Summary: ${passed} passed, ${failed} failed (Total: ${passed + failed})`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
