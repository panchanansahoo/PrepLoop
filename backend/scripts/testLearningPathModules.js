#!/usr/bin/env node

/**
 * testLearningPathModules.js
 * 
 * Tests for refactored learning path modules:
 * - learningTheoryFramework
 * - learningPathManagerService
 * - learningProgressTrackerService
 * - learningPathRecommenderService
 * - learningPathValidationSchemas
 */

import pathManager from '../services/learningPathManagerService.js';
import progressTracker from '../services/learningProgressTrackerService.js';
import recommender from '../services/learningPathRecommenderService.js';
import {
  LEARNING_STAGES,
  MASTERY_LEVELS,
  calculateMasteryLevel,
  getStageFromProgress,
  generatePathObjectives,
} from '../services/learningTheoryFramework.js';
import {
  validateUserProfile,
  validatePathProgress,
  validateMilestoneUpdate,
} from '../services/learningPathValidationSchemas.js';

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✓ ${message}`);
    testsPassed++;
  } else {
    console.error(`✗ ${message}`);
    testsFailed++;
  }
}

function test(name, fn) {
  try {
    fn();
    console.log(`\n✅ ${name}`);
  } catch (error) {
    console.error(`\n❌ ${name}`);
    console.error(`   Error: ${error.message}`);
    testsFailed++;
  }
}

// ============ LEARNING THEORY FRAMEWORK TESTS ============
test('Learning Theory Framework - LEARNING_STAGES structure', () => {
  assert(LEARNING_STAGES.THEORY, 'THEORY stage exists');
  assert(LEARNING_STAGES.QUICK_METHODS, 'QUICK_METHODS stage exists');
  assert(LEARNING_STAGES.SHORTCUTS, 'SHORTCUTS stage exists');
  assert(LEARNING_STAGES.PRACTICE, 'PRACTICE stage exists');
  
  const totalDuration = Object.values(LEARNING_STAGES).reduce(
    (sum, stage) => sum + stage.estimatedDuration,
    0
  );
  assert(totalDuration === 1.0, 'Total duration equals 100%');
});

test('Learning Theory Framework - Mastery Levels', () => {
  assert(MASTERY_LEVELS.NOT_STARTED.level === 0, 'NOT_STARTED level is 0');
  assert(MASTERY_LEVELS.MASTERED.level === 4, 'MASTERED level is 4');
  assert(MASTERY_LEVELS.MASTERED.emoji === '✅', 'MASTERED emoji is ✅');
});

test('Learning Theory Framework - calculateMasteryLevel', () => {
  assert(
    calculateMasteryLevel(0).name === 'Not Started',
    'Returns NOT_STARTED for 0%'
  );
  assert(
    calculateMasteryLevel(20).name === 'Learning',
    'Returns LEARNING for 20%'
  );
  assert(
    calculateMasteryLevel(50).name === 'In Progress',
    'Returns IN_PROGRESS for 50%'
  );
  assert(
    calculateMasteryLevel(75).name === 'Proficient',
    'Returns PROFICIENT for 75%'
  );
  assert(
    calculateMasteryLevel(100).name === 'Mastered',
    'Returns MASTERED for 100%'
  );
});

test('Learning Theory Framework - getStageFromProgress', () => {
  const stage1 = getStageFromProgress(0, 4);
  assert(stage1 && stage1.name === 'Theory & Foundations', 'Returns theory stage for start');
  
  const stage_end = getStageFromProgress(3, 4);
  assert(stage_end && stage_end.name, 'Returns valid stage for end progress');
});

test('Learning Theory Framework - generatePathObjectives', () => {
  const path = pathManager.getPath('arrays-foundations');
  const objectives = generatePathObjectives(path);
  
  assert(Array.isArray(objectives), 'Returns array of objectives');
  assert(objectives.length === 4, 'Returns 4 stage objectives');
  assert(
    objectives[0].stage === 'theory',
    'First objective is theory stage'
  );
});

// ============ PATH MANAGER SERVICE TESTS ============
test('Path Manager - getAllPaths', () => {
  const paths = pathManager.getAllPaths();
  assert(Array.isArray(paths), 'Returns array');
  assert(paths.length > 0, 'Returns non-empty array');
  assert(paths.some((p) => p.id === 'arrays-foundations'), 'Contains arrays-foundations');
});

test('Path Manager - getPath', () => {
  const path = pathManager.getPath('arrays-foundations');
  assert(path !== null, 'Path exists');
  assert(path.title === 'Array Fundamentals', 'Path has correct title');
  assert(path.difficulty === 'easy', 'Path has correct difficulty');
});

test('Path Manager - getPathsByCategory', () => {
  const paths = pathManager.getPathsByCategory('data-structures');
  assert(Array.isArray(paths), 'Returns array');
  assert(paths.length > 0, 'Returns non-empty array');
  assert(paths.some((p) => p.id === 'arrays-foundations'), 'Contains expected path');
});

test('Path Manager - getPathsByDifficulty', () => {
  const easyPaths = pathManager.getPathsByDifficulty('easy');
  assert(Array.isArray(easyPaths), 'Returns array');
  assert(easyPaths.some((p) => p.id === 'arrays-foundations'), 'Contains easy paths');
});

test('Path Manager - checkPrerequisites', () => {
  const canTakeTrees = pathManager.checkPrerequisites('trees-basics', ['arrays-foundations']);
  assert(canTakeTrees === true, 'Allows path when prerequisites met');
  
  const cannotTakeTrees = pathManager.checkPrerequisites('trees-basics', []);
  assert(cannotTakeTrees === false, 'Blocks path when prerequisites not met');
});

test('Path Manager - getPrerequisitePaths', () => {
  const prereqs = pathManager.getPrerequisitePaths('trees-basics');
  assert(Array.isArray(prereqs), 'Returns array');
  assert(prereqs.some((p) => p.id === 'arrays-foundations'), 'Returns correct prerequisite');
});

test('Path Manager - getDependentPaths', () => {
  const dependents = pathManager.getDependentPaths('arrays-foundations');
  assert(Array.isArray(dependents), 'Returns array');
  assert(dependents.length > 0, 'Has dependent paths');
  assert(dependents.some((p) => p.id === 'trees-basics'), 'Contains trees-basics');
});

// ============ PROGRESS TRACKER SERVICE TESTS ============
test('Progress Tracker - createPathProgress', () => {
  const path = pathManager.getPath('arrays-foundations');
  const progress = progressTracker.createPathProgress('user123', path);
  
  assert(progress.userId === 'user123', 'Sets user ID');
  assert(progress.pathId === 'arrays-foundations', 'Sets path ID');
  assert(progress.completionPercentage === 0, 'Starts at 0%');
  assert(progress.milestoneProgress.length > 0, 'Has milestones');
});

test('Progress Tracker - updateMilestoneProgress', () => {
  const path = pathManager.getPath('arrays-foundations');
  let progress = progressTracker.createPathProgress('user123', path);
  
  const result = progressTracker.updateMilestoneProgress(progress, 0, 3);
  progress = result.pathProgress || result;
  
  assert(progress.milestoneProgress[0].completed === 3, 'Updates completed count');
  assert(progress.milestoneProgress[0].status === 'in_progress', 'Sets status to in_progress');
  assert(progress.completionPercentage > 0, 'Increases completion percentage');
  assert(progress.masteryLevel === 'Learning', 'Updates mastery level');
});

test('Progress Tracker - completeMilestone', () => {
  const path = pathManager.getPath('arrays-foundations');
  let progress = progressTracker.createPathProgress('user123', path);
  
  const result = progressTracker.completeMilestone(progress, 0);
  progress = result.pathProgress || result;
  
  assert(
    progress.milestoneProgress[0].status === 'completed',
    'Marks milestone as completed'
  );
  assert(
    progress.milestoneProgress[0].completed === progress.milestoneProgress[0].problemCount,
    'Completes all problems'
  );
});

test('Progress Tracker - getNextIncompleteMilestone', () => {
  const path = pathManager.getPath('arrays-foundations');
  let progress = progressTracker.createPathProgress('user123', path);
  
  let next = progressTracker.getNextIncompleteMilestone(progress);
  assert(next !== null, 'Returns milestone');
  assert(next.status === 'not_started', 'First milestone not started');
  
  const result = progressTracker.completeMilestone(progress, 0);
  progress = result.pathProgress || result;
  next = progressTracker.getNextIncompleteMilestone(progress);
  assert(next !== null, 'Returns next milestone after first completed');
});

test('Progress Tracker - getPathStats', () => {
  const path = pathManager.getPath('arrays-foundations');
  const progress = progressTracker.createPathProgress('user123', path);
  const stats = progressTracker.getPathStats(progress);
  
  assert(stats.completionPercentage === 0, 'Reports 0% completion');
  assert(stats.totalMilestones > 0, 'Reports milestone count');
  assert(stats.estimatedHours > 0, 'Reports estimated hours');
  assert(stats.currentStage, 'Reports current stage');
});

test('Progress Tracker - estimateTimeToCompletion', () => {
  const path = pathManager.getPath('arrays-foundations');
  let progress = progressTracker.createPathProgress('user123', path);
  
  let estimated = progressTracker.estimateTimeToCompletion(progress);
  assert(estimated === path.estimatedHours, 'Estimates full hours when no progress');
  
  const result = progressTracker.updateMilestoneProgress(progress, 0, 2);
  progress = result.pathProgress || result;
  estimated = progressTracker.estimateTimeToCompletion(progress);
  assert(estimated >= 0, 'Returns valid estimate with partial progress');
});

test('Progress Tracker - getProgressByStage', () => {
  const path = pathManager.getPath('dynamic-programming-intro');
  let progress = progressTracker.createPathProgress('user123', path);
  
  const result1 = progressTracker.updateMilestoneProgress(progress, 0, 4);
  progress = result1.pathProgress || result1;
  const result2 = progressTracker.updateMilestoneProgress(progress, 1, 3);
  progress = result2.pathProgress || result2;
  
  const stageProgress = progressTracker.getProgressByStage(progress);
  assert(Object.keys(stageProgress).length > 0, 'Returns stages');
  assert(stageProgress.THEORY, 'Contains THEORY stage');
});

// ============ RECOMMENDER SERVICE TESTS ============
test('Recommender - recommendPaths for beginner', () => {
  const result = recommender.recommendPaths({ skillLevel: 'beginner' });
  
  assert(Array.isArray(result.recommendations), 'Returns recommendations array');
  assert(result.recommendations.length > 0, 'Returns recommendations');
  assert(
    result.recommendations[0].path.difficulty === 'easy',
    'Recommends easy paths for beginners'
  );
});

test('Recommender - recommendPaths with weakness areas', () => {
  const result = recommender.recommendPaths({
    skillLevel: 'intermediate',
    weaknessAreas: { 'arrays': 0.8 },
  });
  
  const arrayPaths = result.recommendations.filter((r) =>
    r.path.topics.includes('arrays')
  );
  
  assert(arrayPaths.length > 0, 'Prioritizes weak area paths');
  assert(
    arrayPaths[0].priority === 'high',
    'Weakness paths have high priority'
  );
});

test('Recommender - recommendPaths with completed paths', () => {
  const result = recommender.recommendPaths({
    skillLevel: 'intermediate',
    completedPaths: ['arrays-foundations'],
  });
  
  const recommends = result.recommendations.find((r) => r.pathId === 'arrays-foundations');
  assert(!recommends, 'Does not recommend completed paths');
});

test('Recommender - recommendNextPath', () => {
  const next = recommender.recommendNextPath('arrays-foundations', ['arrays-foundations']);
  
  assert(next.recommended === true, 'Recommends next path');
  assert(next.type === 'progression', 'Type is progression');
  assert(next.nextPathId === 'trees-basics', 'Recommends natural progression');
});

test('Recommender - recommendPathsByRole', () => {
  const paths = recommender.recommendPathsByRole('junior-developer');
  
  assert(Array.isArray(paths), 'Returns array');
  assert(paths.length > 0, 'Returns paths');
});

test('Recommender - analyzePerfomanceGaps', () => {
  const gaps = recommender.analyzePerfomanceGaps({
    'arrays': 30,
    'trees': 60,
    'graphs': 20,
  });
  
  assert(Array.isArray(gaps), 'Returns array');
  assert(gaps[0].score === 20, 'Sorts by score ascending');
  assert(gaps[0].severity === 'critical', 'Marks low scores as critical');
});

// ============ VALIDATION TESTS ============
test('Validation Schemas - validateUserProfile', () => {
  const valid = validateUserProfile({
    userId: 'user123',
    skillLevel: 'intermediate',
    weaknessAreas: { 'arrays': 0.8 },
  });
  
  assert(valid.error === undefined, 'Validates correct profile');
});

test('Validation Schemas - validateMilestoneUpdate', () => {
  const valid = validateMilestoneUpdate({
    milestoneIndex: 0,
    problemsSolved: 5,
  });
  
  assert(valid.error === undefined, 'Validates milestone update');
  
  const invalid = validateMilestoneUpdate({
    milestoneIndex: -1,
    problemsSolved: 5,
  });
  
  assert(invalid.error !== undefined, 'Rejects invalid milestone index');
});

// ============ INTEGRATION TESTS ============
test('Integration - Complete learning path flow', () => {
  const path = pathManager.getPath('arrays-foundations');
  let progress = progressTracker.createPathProgress('user123', path);
  
  // Update all milestones
  let current = progress;
  for (let i = 0; i < path.milestones.length; i++) {
    const result = progressTracker.completeMilestone(current, i);
    current = result.pathProgress || result;
  }
  
  assert(current.completionPercentage === 100, 'Reaches 100% completion');
  assert(current.completedAt !== null, 'Sets completion timestamp');
  assert(current.masteryLevel === 'Mastered', 'Achieves mastery level');
  
  // Get next recommendation
  const next = recommender.recommendNextPath('arrays-foundations', ['arrays-foundations']);
  assert(next.recommended === true, 'Recommends progression');
  assert(next.nextPathId === 'trees-basics', 'Recommends trees-basics');
});

test('Integration - Stage progression tracking', () => {
  const path = pathManager.getPath('dynamic-programming-intro');
  let progress = progressTracker.createPathProgress('user123', path);
  
  // Complete first milestone (Theory)
  let result = progressTracker.completeMilestone(progress, 0);
  progress = result.pathProgress || result;
  const stats1 = progressTracker.getPathStats(progress);
  assert(stats1.currentStage, 'Has current stage after first milestone');
  
  // Complete more milestones
  result = progressTracker.completeMilestone(progress, 1);
  progress = result.pathProgress || result;
  const stats2 = progressTracker.getPathStats(progress);
  assert(stats2.currentStage && stats2.milestonesCompleted > 1, 'Advances stage with more progress');
});

// ============ SUMMARY ============
console.log('\n' + '='.repeat(60));
console.log(`✅ Tests Passed: ${testsPassed}`);
console.log(`❌ Tests Failed: ${testsFailed}`);
console.log('='.repeat(60));

if (testsFailed > 0) {
  console.error(`\n❌ Learning path module tests failed`);
  process.exit(1);
} else {
  console.log(`\n✅ Learning path module tests passed`);
  process.exit(0);
}
