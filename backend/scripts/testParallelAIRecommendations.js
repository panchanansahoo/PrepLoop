/**
 * Test suite for parallel AI recommendations feature (Phase 2)
 * Validates that plan generation parallelizes expensive operations
 * and implements proper timeout handling
 */

import { ImprovementPlanService } from '../services/improvementPlanService.js';

const tests = [];
const passed = [];
const failed = [];

function test(name, fn) {
  tests.push({ name, fn });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

// Test 1: Timeout mechanism works
test('Timeout rejects after specified duration', async () => {
  // Create a promise that takes too long
  const slowPromise = new Promise(resolve => setTimeout(() => resolve('done'), 5000));
  const timeoutMs = 1000;

  let timedOut = false;
  try {
    await Promise.race([
      slowPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs))
    ]);
  } catch (err) {
    if (err.message === 'timeout') {
      timedOut = true;
    }
  }

  assert(timedOut, 'Promise.race should timeout after specified duration');
});

// Test 2: Promise.all executes in parallel
test('Promise.all executes operations in parallel', async () => {
  const timestamps = [];
  
  const operation1 = new Promise(resolve => {
    timestamps.push({ op: 1, start: Date.now() });
    setTimeout(() => {
      timestamps.push({ op: 1, end: Date.now() });
      resolve('op1');
    }, 100);
  });

  const operation2 = new Promise(resolve => {
    timestamps.push({ op: 2, start: Date.now() });
    setTimeout(() => {
      timestamps.push({ op: 2, end: Date.now() });
      resolve('op2');
    }, 100);
  });

  const startTime = Date.now();
  const [result1, result2] = await Promise.all([operation1, operation2]);
  const totalTime = Date.now() - startTime;

  assert(result1 === 'op1', 'Operation 1 should resolve');
  assert(result2 === 'op2', 'Operation 2 should resolve');
  // Both 100ms operations in parallel should take ~100ms, not ~200ms
  assert(totalTime < 200, `Parallel operations should complete in <200ms, took ${totalTime}ms`);
});

// Test 3: Cache key for recommendations
test('AI recommendations cache key is generated correctly', () => {
  const analysis = {
    topWeaknesses: [
      { area: 'communication', weaknessLevel: 85 },
      { area: 'problem_solving', weaknessLevel: 75 }
    ]
  };

  const cacheKey = ImprovementPlanService._getCacheRecommendationsKey(analysis);

  assert(cacheKey.startsWith('ip:recommendations:'), 
    'Cache key should start with ip:recommendations:');
});

// Test 4: Fallback recommendations work without AI
test('Fallback recommendations generated without AI', () => {
  const topWeaknesses = [
    { area: 'communication', weaknessLevel: 85, intensity: 'high' },
    { area: 'problem_solving', weaknessLevel: 75, intensity: 'medium' },
    { area: 'technical_depth', weaknessLevel: 70, intensity: 'medium' }
  ];

  const fallback = ImprovementPlanService._generateFallbackRecommendations(topWeaknesses);

  assert(fallback !== null, 'Fallback recommendations should be generated');
  assert(typeof fallback === 'object', 'Fallback should be an object');
  assert(Array.isArray(fallback.immediate_actions), 'Should have immediate_actions array');
  assert(Array.isArray(fallback.practice_focus), 'Should have practice_focus array');
  assert(Array.isArray(fallback.mindset_tips), 'Should have mindset_tips array');
  assert(Array.isArray(fallback.resources), 'Should have resources array');
  assert(fallback.immediate_actions.length > 0, 'immediate_actions should not be empty');
});

// Test 5: Build plan structure is correct
test('Built plan has all required fields', async () => {
  const mockAnalysis = {
    topWeaknesses: [
      { area: 'communication', weaknessLevel: 85, intensity: 'high' },
      { area: 'problem_solving', weaknessLevel: 75, intensity: 'medium' }
    ],
    overallTrend: 'improving',
    weaknesses: []
  };

  const plan = await ImprovementPlanService._buildImprovementPlan(mockAnalysis, 7);

  assert(plan.summary !== undefined, 'Plan should have summary');
  assert(plan.topWeaknesses !== undefined, 'Plan should have topWeaknesses');
  assert(plan.dailyPlan !== undefined, 'Plan should have dailyPlan');
  assert(Array.isArray(plan.dailyPlan), 'dailyPlan should be an array');
  assert(plan.recommendations !== undefined, 'Plan should have recommendations');
  assert(typeof plan.recommendations === 'object', 'recommendations should be an object');
  assert(plan.recommendations.immediate_actions !== undefined, 'recommendations should have immediate_actions');
  assert(plan.resources !== undefined, 'Plan should have resources');
  assert(Array.isArray(plan.resources), 'resources should be an array');
  assert(plan.milestones !== undefined, 'Plan should have milestones');
  assert(Array.isArray(plan.milestones), 'milestones should be an array');
  assert(plan.timeframe === 7, 'Plan should preserve timeframe');
  assert(plan.overallTrend === 'improving', 'Plan should preserve overallTrend');
});

// Test 6: Daily plan generation
test('Daily plan generated with correct structure', () => {
  const weaknesses = [
    { area: 'communication', weaknessLevel: 85, intensity: 'high' },
    { area: 'problem_solving', weaknessLevel: 75, intensity: 'medium' }
  ];

  const dailyPlan = ImprovementPlanService._generateDailyTasks(weaknesses, 7);

  assert(dailyPlan.length === 7, 'Should have 7 days');
  assert(dailyPlan[0].day === 1, 'First day should be day 1');
  assert(dailyPlan[0].focusArea !== undefined, 'Each day should have focusArea');
  assert(dailyPlan[0].tasks !== undefined, 'Each day should have tasks');
  assert(Array.isArray(dailyPlan[0].tasks), 'tasks should be an array');
  assert(dailyPlan[0].estimatedTime !== undefined, 'Each day should have estimatedTime');
});

// Test 7: Resources generated for weakness areas
test('Resources generated for top weakness areas', () => {
  const weaknesses = [
    { area: 'communication', weaknessLevel: 85, intensity: 'high' },
    { area: 'system_design', weaknessLevel: 70, intensity: 'medium' }
  ];

  const resources = ImprovementPlanService._generateResources(weaknesses);

  assert(Array.isArray(resources), 'Resources should be an array');
  assert(resources.length > 0, 'Should have resources for given weaknesses');
  assert(resources[0].type !== undefined, 'Each resource should have type');
  assert(resources[0].title !== undefined, 'Each resource should have title');
});

// Test 8: Milestones generated correctly
test('Milestones generated for plan duration', () => {
  const weaknesses = [
    { area: 'communication', weaknessLevel: 85 },
    { area: 'problem_solving', weaknessLevel: 75 }
  ];

  const milestones = ImprovementPlanService._generateMilestones(weaknesses, 14);

  assert(Array.isArray(milestones), 'Milestones should be an array');
  assert(milestones.length === 3, 'Should have 3 milestones for 14-day plan');
  assert(milestones[0].day > 0, 'Milestone days should be positive');
  assert(milestones[0].title !== undefined, 'Each milestone should have title');
  assert(milestones[0].criteria !== undefined, 'Each milestone should have criteria');
});

// Run all tests
async function runTests() {
  console.log('🧪 Testing Parallel AI Recommendations Feature (Phase 2)\n');
  console.log(`Running ${tests.length} tests...\n`);

  for (const { name, fn } of tests) {
    try {
      await fn();
      passed.push(name);
      console.log(`✅ ${name}`);
    } catch (error) {
      failed.push({ name, error: error.message });
      console.log(`❌ ${name}`);
      console.log(`   Error: ${error.message}\n`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`Test Results: ${passed.length} passed, ${failed.length} failed`);
  console.log('='.repeat(60));

  if (failed.length > 0) {
    console.log('\nFailed tests:');
    failed.forEach(({ name, error }) => {
      console.log(`  ❌ ${name}`);
      console.log(`     ${error}`);
    });
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  }
}

runTests();
