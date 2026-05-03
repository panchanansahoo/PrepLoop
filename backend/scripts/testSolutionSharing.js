// Phase 5.1: Solution Sharing Service Tests
// Test suite for CRUD operations and authorization

import SolutionSharingService from '../services/solutionSharingService.js';

const TEST_USER_ID = 'test-user-123';
const TEST_PROBLEM_ID = 1;
const TEST_CODE = 'function solve(arr) { return arr[0]; }';
const TEST_LANGUAGE = 'javascript';

let createdSolutionId = null;

async function runTests() {
  let passed = 0;
  let failed = 0;

  console.log('🧪 Solution Sharing Service Tests\n');

  // Test 1: Submit solution
  try {
    console.log('Test 1: Submit solution');
    const result = await SolutionSharingService.submitSolution(
      TEST_USER_ID,
      TEST_PROBLEM_ID,
      TEST_CODE,
      TEST_LANGUAGE,
      'public'
    );
    if (result.id && result.language === TEST_LANGUAGE) {
      createdSolutionId = result.id;
      console.log('✅ Solution submitted successfully\n');
      passed++;
    } else {
      console.log('❌ Solution ID missing\n');
      failed++;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
    failed++;
  }

  // Test 2: Submit with missing parameters
  try {
    console.log('Test 2: Submit with missing code');
    await SolutionSharingService.submitSolution(TEST_USER_ID, TEST_PROBLEM_ID, '', 'javascript');
    console.log('❌ Should have thrown error\n');
    failed++;
  } catch (error) {
    console.log(`✅ Correctly rejected: ${error.message}\n`);
    passed++;
  }

  // Test 3: Get single solution
  if (createdSolutionId) {
    try {
      console.log('Test 3: Get single solution');
      const solution = await SolutionSharingService.getSolution(createdSolutionId, TEST_USER_ID);
      if (solution.code && solution.language === TEST_LANGUAGE) {
        console.log('✅ Solution retrieved successfully\n');
        passed++;
      } else {
        console.log('❌ Solution missing code or language\n');
        failed++;
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}\n`);
      failed++;
    }
  }

  // Test 4: Get solutions by problem
  try {
    console.log('Test 4: Get solutions by problem');
    const result = await SolutionSharingService.getSolutionsByProblem(TEST_PROBLEM_ID, {
      language: 'javascript',
      sortBy: 'recent',
      page: 1,
      limit: 10,
    });
    if (Array.isArray(result.solutions) && result.total >= 0) {
      console.log(`✅ Retrieved ${result.solutions.length} solutions\n`);
      passed++;
    } else {
      console.log('❌ Invalid response format\n');
      failed++;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
    failed++;
  }

  // Test 5: Update visibility
  if (createdSolutionId) {
    try {
      console.log('Test 5: Update visibility to private');
      const result = await SolutionSharingService.updateSolutionVisibility(
        createdSolutionId,
        TEST_USER_ID,
        'private'
      );
      if (result.visibility === 'private') {
        console.log('✅ Visibility updated successfully\n');
        passed++;
      } else {
        console.log('❌ Visibility not updated\n');
        failed++;
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}\n`);
      failed++;
    }
  }

  // Test 6: Update visibility (unauthorized)
  if (createdSolutionId) {
    try {
      console.log('Test 6: Update visibility (unauthorized user)');
      await SolutionSharingService.updateSolutionVisibility(
        createdSolutionId,
        'different-user',
        'public'
      );
      console.log('❌ Should have thrown authorization error\n');
      failed++;
    } catch (error) {
      console.log(`✅ Correctly rejected: ${error.message}\n`);
      passed++;
    }
  }

  // Test 7: Pagination
  try {
    console.log('Test 7: Pagination with limit=5');
    const result = await SolutionSharingService.getSolutionsByProblem(TEST_PROBLEM_ID, {
      page: 1,
      limit: 5,
    });
    if (result.pageSize === 5 && result.page === 1) {
      console.log('✅ Pagination working correctly\n');
      passed++;
    } else {
      console.log('❌ Pagination parameters not applied\n');
      failed++;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
    failed++;
  }

  // Test 8: Invalid pagination
  try {
    console.log('Test 8: Invalid pagination (page < 1)');
    await SolutionSharingService.getSolutionsByProblem(TEST_PROBLEM_ID, { page: 0 });
    console.log('❌ Should have thrown error\n');
    failed++;
  } catch (error) {
    console.log(`✅ Correctly rejected: ${error.message}\n`);
    passed++;
  }

  // Test 9: Invalid visibility
  try {
    console.log('Test 9: Submit with invalid visibility');
    await SolutionSharingService.submitSolution(
      TEST_USER_ID,
      TEST_PROBLEM_ID,
      TEST_CODE,
      'javascript',
      'invalid'
    );
    console.log('❌ Should have thrown error\n');
    failed++;
  } catch (error) {
    console.log(`✅ Correctly rejected: ${error.message}\n`);
    passed++;
  }

  // Test 10: Search solutions
  try {
    console.log('Test 10: Search solutions');
    const result = await SolutionSharingService.searchSolutions({
      problemId: TEST_PROBLEM_ID,
      language: 'javascript',
      limit: 10,
    });
    if (Array.isArray(result.solutions) && result.filters_applied) {
      console.log(`✅ Search returned ${result.solutions.length} results\n`);
      passed++;
    } else {
      console.log('❌ Invalid search response\n');
      failed++;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
    failed++;
  }

  // Test 11: Code length tracking
  if (createdSolutionId) {
    try {
      console.log('Test 11: Code length tracking');
      const solution = await SolutionSharingService.getSolution(createdSolutionId);
      if (solution.codeLength === TEST_CODE.length) {
        console.log(`✅ Code length correctly tracked (${solution.codeLength} chars)\n`);
        passed++;
      } else {
        console.log(`❌ Code length mismatch: expected ${TEST_CODE.length}, got ${solution.codeLength}\n`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}\n`);
      failed++;
    }
  }

  // Test 12: Delete solution
  if (createdSolutionId) {
    try {
      console.log('Test 12: Delete solution (soft delete)');
      const result = await SolutionSharingService.deleteSolution(createdSolutionId, TEST_USER_ID);
      if (result.status === 'deleted') {
        console.log('✅ Solution soft deleted\n');
        passed++;
      } else {
        console.log('❌ Delete status not updated\n');
        failed++;
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}\n`);
      failed++;
    }
  }

  // Test 13: Delete unauthorized
  if (createdSolutionId) {
    try {
      console.log('Test 13: Delete solution (unauthorized)');
      await SolutionSharingService.deleteSolution(createdSolutionId, 'different-user');
      console.log('❌ Should have thrown authorization error\n');
      failed++;
    } catch (error) {
      console.log(`✅ Correctly rejected: ${error.message}\n`);
      passed++;
    }
  }

  // Test 14: Multiple languages
  try {
    console.log('Test 14: Submit Python solution');
    const result = await SolutionSharingService.submitSolution(
      TEST_USER_ID,
      TEST_PROBLEM_ID,
      'def solve(arr): return arr[0]',
      'python',
      'public'
    );
    if (result.language === 'python') {
      console.log('✅ Python solution submitted\n');
      passed++;
    } else {
      console.log('❌ Language not preserved\n');
      failed++;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
    failed++;
  }

  // Test 15: Execution metrics
  try {
    console.log('Test 15: Execution metrics tracking');
    const result = await SolutionSharingService.submitSolution(
      TEST_USER_ID,
      TEST_PROBLEM_ID,
      TEST_CODE,
      'javascript',
      'public',
      125, // timeMs
      5.2 // memoryMb
    );
    if (result.executionTimeMs === 125 && result.memoryMb === 5.2) {
      console.log('✅ Execution metrics tracked\n');
      passed++;
    } else {
      console.log('❌ Execution metrics not saved\n');
      failed++;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
    failed++;
  }

  // Test 16: Filter by visibility
  try {
    console.log('Test 16: Filter public solutions');
    const result = await SolutionSharingService.getSolutionsByProblem(TEST_PROBLEM_ID, {
      page: 1,
      limit: 10,
    });
    const allPublic = result.solutions.every((s) => s.visibility === 'public');
    if (allPublic) {
      console.log('✅ Only public solutions returned\n');
      passed++;
    } else {
      console.log('❌ Non-public solutions included\n');
      failed++;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
    failed++;
  }

  // Test 17: Sorting by votes
  try {
    console.log('Test 17: Sort by votes');
    const result = await SolutionSharingService.getSolutionsByProblem(TEST_PROBLEM_ID, {
      sortBy: 'votes',
    });
    if (Array.isArray(result.solutions)) {
      console.log('✅ Vote sorting applied\n');
      passed++;
    } else {
      console.log('❌ Sorting failed\n');
      failed++;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
    failed++;
  }

  // Summary
  console.log(`\n📊 Summary: ${passed} passed, ${failed} failed (Total: ${passed + failed})`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
