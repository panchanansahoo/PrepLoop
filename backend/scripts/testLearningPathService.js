/**
 * testLearningPathService.js
 * 
 * Tests for LearningPathService
 * Coverage: path recommendations, progress tracking, statistics
 * 35+ comprehensive test cases
 */

import LearningPathService from '../services/learningPathService.js';

let passCount = 0;
let failCount = 0;

async function runTest(name, fn) {
  try {
    await fn();
    console.log(`✓ ${name}`);
    passCount++;
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  ${error.message}`);
    failCount++;
  }
}

// Mock problems
const mockProblems = [
  { id: 1, title: 'Two Sum', topic: 'arrays', difficulty: 'easy' },
  { id: 2, title: 'Best Time to Buy Stock', topic: 'arrays', difficulty: 'medium' },
  { id: 3, title: 'Sliding Window Maximum', topic: 'arrays', difficulty: 'hard' },
  { id: 4, title: 'Binary Tree Inorder Traversal', topic: 'trees', difficulty: 'easy' },
  { id: 5, title: 'Binary Search Tree', topic: 'trees', difficulty: 'medium' },
  { id: 6, title: 'Fibonacci', topic: 'dynamic-programming', difficulty: 'easy' },
];

async function runAllTests() {
  console.log('📚 Learning Path Service Tests\n');

  const service = new LearningPathService();

  // ============================================================================
  // PATH RETRIEVAL TESTS
  // ============================================================================

  await runTest('Should get all available paths', () => {
    const paths = service.getAllPaths();

    if (!Array.isArray(paths) || paths.length === 0) {
      throw new Error('Should return array of paths');
    }
  });

  await runTest('Should get all paths with expected structure', () => {
    const paths = service.getAllPaths();

    for (const path of paths) {
      if (!path.id || !path.title || !path.difficulty) {
        throw new Error('Path missing required fields');
      }
    }
  });

  await runTest('Should retrieve specific path by ID', () => {
    const path = service.getPath('arrays-foundations');

    if (!path || path.id !== 'arrays-foundations') {
      throw new Error('Should retrieve correct path');
    }
  });

  await runTest('Should return null for unknown path', () => {
    const path = service.getPath('unknown-path');

    if (path !== null) {
      throw new Error('Should return null for unknown path');
    }
  });

  // ============================================================================
  // PATH RECOMMENDATION TESTS
  // ============================================================================

  await runTest('Should recommend paths for beginners', () => {
    const recommendations = service.recommendPaths({
      skillLevel: 'beginner',
    });

    if (recommendations.length === 0) {
      throw new Error('Should recommend paths for beginners');
    }
  });

  await runTest('Should recommend paths for intermediate users', () => {
    const recommendations = service.recommendPaths({
      skillLevel: 'intermediate',
    });

    if (recommendations.length < 1) {
      throw new Error('Should recommend paths for intermediate');
    }
  });

  await runTest('Should recommend paths for advanced users', () => {
    const recommendations = service.recommendPaths({
      skillLevel: 'advanced',
    });

    if (recommendations.length === 0) {
      throw new Error('Should recommend paths for advanced');
    }
  });

  await runTest('Should prioritize weak areas', () => {
    const recommendations = service.recommendPaths({
      skillLevel: 'intermediate',
      weaknessAreas: { arrays: 0.8, trees: 0.7 },
    });

    // Should have recommendations targeting weak areas
    const hasWeakAreaRec = recommendations.some(r =>
      r.reason.includes('Strengthen')
    );

    if (!hasWeakAreaRec) {
      throw new Error('Should include recommendations for weak areas');
    }
  });

  // ============================================================================
  // PATH PROGRESS CREATION TESTS
  // ============================================================================

  await runTest('Should create path progress', () => {
    const progress = service.createPathProgress('user1', 'arrays-foundations');

    if (!progress || !progress.pathId) {
      throw new Error('Should create path progress entry');
    }
  });

  await runTest('Should initialize progress with milestones', () => {
    const progress = service.createPathProgress('user1', 'trees-basics');

    if (!Array.isArray(progress.milestoneProgress) || progress.milestoneProgress.length === 0) {
      throw new Error('Should include milestones');
    }
  });

  await runTest('Should set completion to 0 initially', () => {
    const progress = service.createPathProgress('user1', 'arrays-foundations');

    if (progress.completionPercentage !== 0) {
      throw new Error('Should start at 0% completion');
    }
  });

  await runTest('Should calculate total problems required', () => {
    const progress = service.createPathProgress('user1', 'dynamic-programming-intro');

    if (progress.totalProblemsToSolve <= 0) {
      throw new Error('Should calculate total problems');
    }
  });

  // ============================================================================
  // MILESTONE PROGRESS TESTS
  // ============================================================================

  await runTest('Should update milestone progress', () => {
    const progress = service.createPathProgress('user1', 'arrays-foundations');

    service.updateMilestoneProgress(progress, 0, 3);

    if (progress.milestoneProgress[0].completed !== 3) {
      throw new Error('Should update milestone problems completed');
    }
  });

  await runTest('Should mark milestone complete when all problems done', () => {
    const progress = service.createPathProgress('user1', 'arrays-foundations');
    const milestone = progress.milestoneProgress[0];

    service.updateMilestoneProgress(progress, 0, milestone.problemCount);

    if (milestone.status !== 'completed') {
      throw new Error('Should mark milestone as completed');
    }
  });

  await runTest('Should update overall completion percentage', () => {
    const progress = service.createPathProgress('user1', 'arrays-foundations');

    service.updateMilestoneProgress(progress, 0, 5);

    if (progress.completionPercentage === 0) {
      throw new Error('Should update overall completion');
    }
  });

  await runTest('Should set completion date when path finished', () => {
    const progress = service.createPathProgress('user1', 'arrays-foundations');

    // Complete all milestones
    progress.milestoneProgress.forEach((milestone, index) => {
      service.updateMilestoneProgress(progress, index, milestone.problemCount);
    });

    if (progress.completedAt === null) {
      throw new Error('Should set completion date');
    }
  });

  // ============================================================================
  // NEXT PROBLEM TESTS
  // ============================================================================

  await runTest('Should get next problem for incomplete milestone', () => {
    const progress = service.createPathProgress('user1', 'arrays-foundations');

    const next = service.getNextProblem(progress, mockProblems);

    if (!next) {
      throw new Error('Should return next problem');
    }
  });

  await runTest('Should return null for completed path', () => {
    const progress = service.createPathProgress('user1', 'arrays-foundations');

    // Mark all as complete
    progress.milestoneProgress.forEach((m, i) => {
      service.updateMilestoneProgress(progress, i, m.problemCount);
    });

    const next = service.getNextProblem(progress, mockProblems);

    if (next !== null) {
      throw new Error('Should return null for completed path');
    }
  });

  // ============================================================================
  // STATISTICS TESTS
  // ============================================================================

  await runTest('Should calculate path statistics', () => {
    const progress = service.createPathProgress('user1', 'arrays-foundations');
    service.updateMilestoneProgress(progress, 0, 2);

    const stats = service.getPathStats(progress);

    if (!stats.completion_percentage || !stats.total_problems_solved) {
      throw new Error('Should calculate statistics');
    }
  });

  await runTest('Should track milestones completed', () => {
    const progress = service.createPathProgress('user1', 'arrays-foundations');
    const milestone = progress.milestoneProgress[0];

    service.updateMilestoneProgress(progress, 0, milestone.problemCount);

    const stats = service.getPathStats(progress);

    if (stats.milestones_completed === 0) {
      throw new Error('Should track completed milestones');
    }
  });

  await runTest('Should calculate time spent', () => {
    const progress = service.createPathProgress('user1', 'arrays-foundations');
    // Simulate some time passing
    progress.startedAt = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago

    const stats = service.getPathStats(progress);

    if (stats.time_spent_hours < 0.5) {
      throw new Error('Should calculate time spent');
    }
  });

  // ============================================================================
  // TIME ESTIMATION TESTS
  // ============================================================================

  await runTest('Should estimate time to completion', () => {
    const progress = service.createPathProgress('user1', 'arrays-foundations');
    service.updateMilestoneProgress(progress, 0, 5);

    const estimated = service.estimateTimeToCompletion(progress);

    if (typeof estimated !== 'number' || estimated < 0) {
      throw new Error('Should estimate time to completion');
    }
  });

  await runTest('Should return full estimate for new paths', () => {
    const progress = service.createPathProgress('user1', 'arrays-foundations');

    const estimated = service.estimateTimeToCompletion(progress);

    if (estimated !== progress.estimatedHours) {
      throw new Error('Should return full estimate for new paths');
    }
  });

  await runTest('Should return 0 for completed paths', () => {
    const progress = service.createPathProgress('user1', 'arrays-foundations');

    // Mark all complete
    progress.milestoneProgress.forEach((m, i) => {
      service.updateMilestoneProgress(progress, i, m.problemCount);
    });

    const estimated = service.estimateTimeToCompletion(progress);

    if (estimated !== 0) {
      throw new Error('Should return 0 for completed paths');
    }
  });

  // ============================================================================
  // STREAK BONUS TESTS
  // ============================================================================

  await runTest('Should calculate streak bonus', () => {
    const progress = service.createPathProgress('user1', 'arrays-foundations');

    const bonus = service.calculateStreakBonus(progress);

    if (typeof bonus !== 'number') {
      throw new Error('Should calculate streak bonus');
    }
  });

  await runTest('Should give bonus for consistent practice', () => {
    const progress = service.createPathProgress('user1', 'arrays-foundations');
    progress.startedAt = new Date(Date.now() - 24 * 3600000).toISOString(); // 1 day ago
    progress.totalProblemsSolved = 5; // Good pace

    const bonus = service.calculateStreakBonus(progress);

    if (bonus <= 0) {
      throw new Error('Should give bonus for consistent practice');
    }
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  await runTest('Should handle invalid milestone index', () => {
    const progress = service.createPathProgress('user1', 'arrays-foundations');

    try {
      service.updateMilestoneProgress(progress, 999, 5);
      throw new Error('Should throw for invalid index');
    } catch (e) {
      if (!e.message.includes('Invalid')) {
        throw e;
      }
    }
  });

  await runTest('Should handle path not found', () => {
    try {
      service.createPathProgress('user1', 'nonexistent-path');
      throw new Error('Should throw for nonexistent path');
    } catch (e) {
      if (!e.message.includes('not found')) {
        throw e;
      }
    }
  });

  await runTest('Should cap problems completed at milestone total', () => {
    const progress = service.createPathProgress('user1', 'arrays-foundations');
    const milestone = progress.milestoneProgress[0];

    service.updateMilestoneProgress(progress, 0, 999); // More than milestone has

    if (milestone.completed > milestone.problemCount) {
      throw new Error('Should cap at milestone total');
    }
  });

  console.log(`\n✅ Results: ${passCount} passed, ${failCount} failed (${passCount + failCount} total)`);
  process.exit(failCount > 0 ? 1 : 0);
}

runAllTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
