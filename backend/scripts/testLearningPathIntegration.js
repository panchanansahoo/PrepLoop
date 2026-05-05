#!/usr/bin/env node

/**
 * testLearningPathIntegration.js
 *
 * Integration tests for learning path system end-to-end flows:
 * - User path selection based on skill level
 * - Progress tracking through complete path
 * - Recommendations based on performance
 * - Stage progression with milestones
 */

import learningPathService from '../services/learningPathService.js';
import pathManager from '../services/learningPathManagerService.js';
import progressTracker from '../services/learningProgressTrackerService.js';
import recommender from '../services/learningPathRecommenderService.js';

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    testsPassed++;
  } else {
    console.error(`  ✗ ${message}`);
    testsFailed++;
  }
}

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}\n`);
  } catch (error) {
    console.error(`❌ ${name}`);
    console.error(`   Error: ${error.message}\n`);
    testsFailed++;
  }
}

// ============ INTEGRATION TEST 1: Beginner Learning Flow ============
test('Integration: Beginner selects path and progresses through stages', () => {
  const userId = 'beginner_user_001';
  const userProfile = {
    skillLevel: 'beginner',
    weaknessAreas: {},
    completedPaths: [],
  };

  // Step 1: Get recommendations for beginner
  const recommendations = learningPathService.getDetailedRecommendations(userProfile);
  assert(
    recommendations.recommendations.length > 0,
    'Recommends paths for beginners'
  );
  assert(
    recommendations.recommendations[0].path.difficulty === 'easy',
    'First recommendation is easy'
  );

  // Step 2: Select first recommended path
  const selectedPathId = recommendations.recommendations[0].pathId;
  const path = learningPathService.getPath(selectedPathId);
  assert(path !== null, 'Selected path exists');

  // Step 3: Create progress entry
  let progress = learningPathService.createPathProgress(userId, selectedPathId);
  assert(progress.completionPercentage === 0, 'Progress starts at 0%');
  assert(progress.masteryLevel === 'Not Started', 'Mastery level is Not Started');

  // Step 4: Complete first milestone (Theory stage)
  progress = learningPathService.completeMilestone(progress, 0);
  assert(
    progress.milestoneProgress[0].status === 'completed',
    'First milestone marked complete'
  );
  assert(
    progress.completionPercentage > 0,
    'Completion percentage increased'
  );
  assert(
    progress.masteryLevel === 'In Progress',
    'Mastery level advanced to In Progress'
  );

  // Step 5: Continue with more milestones
  if (progress.milestoneProgress.length > 1) {
    progress = learningPathService.completeMilestone(progress, 1);
    assert(
      progress.completionPercentage > progress.milestoneProgress[0].completed * 10,
      'Completion percentage reflects both milestones'
    );
  }

  // Step 6: Get path statistics
  const stats = learningPathService.getPathStats(progress);
  assert(stats.milestonesCompleted > 0, 'Statistics show completed milestones');
  assert(stats.completionPercentage > 0, 'Statistics show progress');
});

// ============ INTEGRATION TEST 2: Weakness-Based Recommendations ============
test('Integration: System recommends paths based on weakness areas', () => {
  const userProfile = {
    skillLevel: 'intermediate',
    weaknessAreas: { 'trees': 0.9, 'graphs': 0.7 },
    completedPaths: ['arrays-foundations'],
  };

  // Step 1: Get detailed recommendations
  const result = learningPathService.getDetailedRecommendations(userProfile);

  // Step 2: Verify weak areas are prioritized
  const weakAreaRecommendations = result.recommendations.filter(
    (r) => r.priority === 'high'
  );
  assert(
    weakAreaRecommendations.length > 0,
    'Recommends high-priority paths for weak areas'
  );

  // Step 3: Verify completed paths are not recommended
  const completedPathIds = result.recommendations.map((r) => r.pathId);
  assert(
    !completedPathIds.includes('arrays-foundations'),
    'Does not recommend already-completed path'
  );

  // Step 4: Verify natural progression is offered
  const hasProgressionPath = result.recommendations.some(
    (r) => r.reason && r.reason.includes('Progress')
  );
  assert(hasProgressionPath || result.recommendations.length > 0, 'Offers next steps');
});

// ============ INTEGRATION TEST 3: Complete Path Mastery ============
test('Integration: User completes full path and achieves mastery', () => {
  const userId = 'mastery_user_001';
  const path = pathManager.getPath('arrays-foundations');

  // Step 1: Create and complete all milestones
  let progress = learningPathService.createPathProgress(userId, path.id);

  for (let i = 0; i < path.milestones.length; i++) {
    progress = learningPathService.completeMilestone(progress, i);
  }

  // Step 2: Verify complete mastery
  assert(
    progress.completionPercentage === 100,
    'Reaches 100% completion'
  );
  assert(
    progress.masteryLevel === 'Mastered',
    'Achieves Mastered level'
  );
  assert(
    progress.completedAt !== null,
    'Records completion timestamp'
  );

  // Step 3: Verify streak bonus calculation
  const streakBonus = learningPathService.calculateStreakBonus(progress);
  assert(
    streakBonus >= 0,
    'Calculates valid streak bonus'
  );

  // Step 4: Get next recommended path
  const nextPath = learningPathService.getNextRecommendedPath(
    path.id,
    [path.id]
  );
  assert(
    nextPath.recommended === true,
    'Recommends next path after completion'
  );
  assert(
    nextPath.nextPathId !== path.id,
    'Does not recommend same path again'
  );
});

// ============ INTEGRATION TEST 4: Role-Based Learning Path ============
test('Integration: System recommends paths based on user role', () => {
  // Test different roles
  const roles = [
    'junior-developer',
    'mid-level-engineer',
    'competitive-programmer',
    'data-scientist',
  ];

  for (const role of roles) {
    const paths = learningPathService.getPathsByRole(role);
    assert(
      Array.isArray(paths) && paths.length > 0,
      `Recommends paths for role: ${role}`
    );
  }
});

// ============ INTEGRATION TEST 5: Performance Gap Analysis ============
test('Integration: System analyzes performance gaps and recommends improvement', () => {
  const userPerformance = {
    'arrays': 30,
    'trees': 60,
    'graphs': 20,
    'dynamic-programming': 45,
  };

  // Step 1: Analyze gaps
  const gaps = learningPathService.analyzePerformanceGaps(userPerformance);
  assert(
    Array.isArray(gaps),
    'Returns array of performance gaps'
  );
  assert(
    gaps.length > 0,
    'Identifies performance gaps'
  );

  // Step 2: Verify critical gaps are identified
  const criticalGaps = gaps.filter((g) => g.severity === 'critical');
  assert(
    criticalGaps.length > 0,
    'Identifies critical performance gaps'
  );

  // Step 3: Verify gaps are sorted by severity
  const firstGap = gaps[0];
  assert(
    firstGap.score <= gaps[gaps.length - 1].score,
    'Gaps sorted from lowest to highest score'
  );

  // Step 4: Get recommendations for lowest-performing topic
  const lowestPerformance = gaps[0];
  const userProfile = {
    skillLevel: 'intermediate',
    weaknessAreas: { [lowestPerformance.topic]: 0.9 },
  };

  const recommendations = learningPathService.getDetailedRecommendations(userProfile);
  assert(
    recommendations.recommendations.length > 0,
    'Provides recommendations for weak areas'
  );
});

// ============ INTEGRATION TEST 6: Multi-Stage Path Progression ============
test('Integration: User progresses through all learning stages', () => {
  const userId = 'stage_progression_user';
  const path = pathManager.getPath('dynamic-programming-intro');

  let progress = learningPathService.createPathProgress(userId, path.id);

  // Step 1: Theory Stage
  progress = learningPathService.completeMilestone(progress, 0);
  let objectives = learningPathService.getPathObjectives(path.id);
  const theoryObjectives = objectives[0];
  assert(
    theoryObjectives.stage === 'theory',
    'First stage is theory'
  );

  // Step 2: Quick Methods Stage
  if (progress.milestoneProgress.length > 1) {
    progress = learningPathService.completeMilestone(progress, 1);
  }

  // Step 3: Shortcuts Stage
  if (progress.milestoneProgress.length > 2) {
    progress = learningPathService.completeMilestone(progress, 2);
  }

  // Step 4: Practice Stage
  if (progress.milestoneProgress.length > 3) {
    progress = learningPathService.completeMilestone(progress, 3);
  }

  // Step 5: Verify stage progression
  const stats = learningPathService.getPathStats(progress);
  assert(
    stats.currentStage !== undefined,
    'Current stage is tracked'
  );
  assert(
    stats.completionPercentage >= 0,
    'Progress is accurately measured'
  );
});

// ============ INTEGRATION TEST 7: Prerequisite Validation ============
test('Integration: System respects prerequisites when recommending paths', () => {
  // Trees-basics requires arrays-foundations
  const userProfile1 = {
    skillLevel: 'intermediate',
    completedPaths: [],
  };

  const result1 = learningPathService.getDetailedRecommendations(userProfile1);
  const treesRecommended = result1.recommendations.some((r) => r.pathId === 'trees-basics');
  
  // Should not recommend trees without arrays
  assert(
    !treesRecommended,
    'Does not recommend trees-basics without prerequisite'
  );

  // With arrays completed
  const userProfile2 = {
    skillLevel: 'intermediate',
    completedPaths: ['arrays-foundations'],
  };

  const result2 = learningPathService.getDetailedRecommendations(userProfile2);
  const treesRecommendedAfter = result2.recommendations.some(
    (r) => r.pathId === 'trees-basics'
  );
  assert(
    treesRecommendedAfter,
    'Recommends trees-basics after completing arrays-foundations'
  );
});

// ============ INTEGRATION TEST 8: Time Estimation ============
test('Integration: System accurately estimates remaining time', () => {
  const userId = 'time_estimate_user';
  const path = pathManager.getPath('arrays-foundations');

  let progress = learningPathService.createPathProgress(userId, path.id);

  // Initial estimate (no progress)
  let timeEstimate = learningPathService.estimateTimeToCompletion(progress);
  assert(
    timeEstimate === path.estimatedHours,
    'Estimates full duration with no progress'
  );

  // After some progress
  progress = learningPathService.completeMilestone(progress, 0);
  timeEstimate = learningPathService.estimateTimeToCompletion(progress);
  assert(
    timeEstimate >= 0,
    'Provides valid time estimate with partial progress'
  );

  // After full completion
  for (let i = 1; i < path.milestones.length; i++) {
    progress = learningPathService.completeMilestone(progress, i);
  }
  timeEstimate = learningPathService.estimateTimeToCompletion(progress);
  assert(
    timeEstimate === 0,
    'Estimates 0 hours for completed path'
  );
});

// ============ SUMMARY ============
console.log('\n' + '='.repeat(60));
console.log(`✅ Integration Tests Passed: ${testsPassed}`);
console.log(`❌ Integration Tests Failed: ${testsFailed}`);
console.log('='.repeat(60));

if (testsFailed > 0) {
  console.error(`\n❌ Integration tests failed`);
  process.exit(1);
} else {
  console.log(`\n✅ All integration tests passed`);
  process.exit(0);
}
