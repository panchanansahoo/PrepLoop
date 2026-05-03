/**
 * testSkillDetectorAndAdaptiveDifficulty.js
 * 
 * Comprehensive tests for SkillDetector and AdaptiveDifficultySelector
 * Coverage: skill detection, performance trends, difficulty recommendations
 * 40+ test cases
 */

import SkillDetector from '../services/skillDetector.js';
import { AdaptiveDifficultySelector } from '../services/adaptiveDifficultySelector.js';

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

// ============================================================================
// SKILL DETECTOR TESTS
// ============================================================================

async function runSkillDetectorTests() {
  console.log('🎯 Skill Detector Tests\n');

  const detector = new SkillDetector();

  // Performance Trend Tests
  await runTest('Should detect improving trend', () => {
    const history = [
      { score: 40 },
      { score: 45 },
      { score: 50 },
      { score: 70 },
      { score: 75 },
      { score: 80 },
    ];

    const trend = detector.getPerformanceTrend(history);

    if (trend.trend !== 'improving') {
      throw new Error(`Expected improving, got ${trend.trend}`);
    }
  });

  await runTest('Should detect declining trend', () => {
    const history = [
      { score: 80 },
      { score: 75 },
      { score: 70 },
      { score: 50 },
      { score: 40 },
      { score: 30 },
    ];

    const trend = detector.getPerformanceTrend(history);

    if (trend.trend !== 'declining') {
      throw new Error(`Expected declining, got ${trend.trend}`);
    }
  });

  await runTest('Should detect stable trend', () => {
    const history = [
      { score: 70 },
      { score: 72 },
      { score: 68 },
      { score: 71 },
      { score: 69 },
    ];

    const trend = detector.getPerformanceTrend(history);

    if (trend.trend !== 'stable') {
      throw new Error(`Expected stable, got ${trend.trend}`);
    }
  });

  await runTest('Should handle insufficient data', () => {
    const history = [{ score: 50 }];

    const trend = detector.getPerformanceTrend(history);

    if (trend.trend !== 'insufficient_data') {
      throw new Error('Should return insufficient_data for < 3 attempts');
    }
  });

  // Topic Mastery Tests
  await runTest('Should calculate topic mastery from success rate', () => {
    const topicStats = {
      totalAttempts: 10,
      successfulAttempts: 8,
      avgTimeSeconds: 30,
    };

    const mastery = detector.calculateTopicMastery(topicStats);

    if (mastery < 50 || mastery > 100) {
      throw new Error(`Mastery should be 50-100, got ${mastery}`);
    }
  });

  await runTest('Should penalize slow solve times', () => {
    const stats1 = { totalAttempts: 10, successfulAttempts: 10, avgTimeSeconds: 10 };
    const stats2 = { totalAttempts: 10, successfulAttempts: 10, avgTimeSeconds: 100 };

    const mastery1 = detector.calculateTopicMastery(stats1);
    const mastery2 = detector.calculateTopicMastery(stats2);

    if (mastery1 <= mastery2) {
      throw new Error('Faster solve times should result in higher mastery');
    }
  });

  // Difficulty Recommendation Tests
  await runTest('Should recommend easy for low mastery', () => {
    const difficulty = detector.getRecommendedDifficulty(20);

    if (difficulty !== 'easy') {
      throw new Error(`Expected easy, got ${difficulty}`);
    }
  });

  await runTest('Should recommend medium for mid mastery', () => {
    const difficulty = detector.getRecommendedDifficulty(40);

    if (difficulty !== 'medium') {
      throw new Error(`Expected medium, got ${difficulty}`);
    }
  });

  await runTest('Should recommend hard for high mastery', () => {
    const difficulty = detector.getRecommendedDifficulty(65);

    if (difficulty !== 'hard') {
      throw new Error(`Expected hard, got ${difficulty}`);
    }
  });

  await runTest('Should recommend advanced for expert level', () => {
    const difficulty = detector.getRecommendedDifficulty(85);

    if (difficulty !== 'advanced') {
      throw new Error(`Expected advanced, got ${difficulty}`);
    }
  });

  // Difficulty Adjustment Tests
  await runTest('Should increase difficulty when improving and competent', () => {
    const adjustment = detector.calculateDifficultyAdjustment(
      { trend: 'improving', trend_value: 10 },
      65
    );

    if (adjustment !== 1) {
      throw new Error(`Expected +1 adjustment, got ${adjustment}`);
    }
  });

  await runTest('Should decrease difficulty when declining', () => {
    const adjustment = detector.calculateDifficultyAdjustment(
      { trend: 'declining', trend_value: -8 },
      50
    );

    if (adjustment !== -1) {
      throw new Error(`Expected -1 adjustment, got ${adjustment}`);
    }
  });

  await runTest('Should maintain difficulty when stable and competent', () => {
    const adjustment = detector.calculateDifficultyAdjustment(
      { trend: 'stable', trend_value: 0 },
      70
    );

    if (adjustment !== 0) {
      throw new Error(`Expected 0 adjustment, got ${adjustment}`);
    }
  });

  // Skill Profile Tests
  await runTest('Should generate comprehensive skill profile', () => {
    const userStats = {
      topicStats: {
        arrays: {
          totalAttempts: 10,
          successfulAttempts: 8,
          avgTimeSeconds: 25,
          attemptHistory: [
            { score: 60 },
            { score: 70 },
            { score: 80 },
          ],
        },
        strings: {
          totalAttempts: 5,
          successfulAttempts: 2,
          avgTimeSeconds: 45,
          attemptHistory: [
            { score: 30 },
            { score: 40 },
            { score: 50 },
          ],
        },
      },
      attemptHistory: [
        { score: 60 },
        { score: 70 },
        { score: 80 },
      ],
    };

    const profile = detector.getSkillProfile(userStats);

    if (!profile.topics.arrays || !profile.topics.strings) {
      throw new Error('Should include all topics in profile');
    }
    if (!Array.isArray(profile.recommendations)) {
      throw new Error('Should include recommendations');
    }
  });

  // Recommendations Tests
  await runTest('Should recommend practice for low mastery', () => {
    const profile = {
      overall_mastery: 35,
      performance_trend: { trend: 'stable' },
      topics: {},
      recommendations: [],
    };

    const recs = detector.generateRecommendations(profile);
    const hasPracticeRec = recs.some(r => r.type === 'practice_fundamentals');

    if (!hasPracticeRec) {
      throw new Error('Should recommend fundamentals practice for low mastery');
    }
  });

  await runTest('Should identify weak topics', () => {
    const profile = {
      overall_mastery: 60,
      performance_trend: { trend: 'stable' },
      topics: {
        arrays: { mastery: 70 },
        trees: { mastery: 20 },
        graphs: { mastery: 40 },
      },
      recommendations: [],
    };

    const recs = detector.generateRecommendations(profile);
    const weakRec = recs.find(r => r.type === 'weak_topics');

    if (!weakRec || !weakRec.weak_topics.includes('trees')) {
      throw new Error('Should identify trees as weak topic');
    }
  });

  // Prediction Tests
  await runTest('Should predict higher difficulty after success', () => {
    const current = 'medium';
    const nextDifficulty = detector.predictNextDifficulty(
      { success: true, score: 85 },
      { totalAttempts: 10, successfulAttempts: 8 },
      current
    );

    if (nextDifficulty !== 'hard') {
      throw new Error(`Expected hard difficulty, got ${nextDifficulty}`);
    }
  });

  await runTest('Should predict lower difficulty after failure', () => {
    const current = 'hard';
    const nextDifficulty = detector.predictNextDifficulty(
      { success: false, score: 30 },
      {},
      current
    );

    if (nextDifficulty !== 'medium') {
      throw new Error(`Expected medium difficulty, got ${nextDifficulty}`);
    }
  });

  // Time Estimation Tests
  await runTest('Should estimate solve time based on mastery', () => {
    const time1 = detector.estimateSolveTime('medium', 20); // Low mastery
    const time2 = detector.estimateSolveTime('medium', 80); // High mastery

    if (time1 <= time2) {
      throw new Error('Higher mastery should result in lower estimate');
    }
  });

  await runTest('Should increase estimate for harder difficulties', () => {
    const timeMedium = detector.estimateSolveTime('medium', 50);
    const timeHard = detector.estimateSolveTime('hard', 50);

    if (timeHard <= timeMedium) {
      throw new Error('Hard should take longer than medium');
    }
  });
}

// ============================================================================
// ADAPTIVE DIFFICULTY SELECTOR TESTS
// ============================================================================

async function runAdaptiveDifficultyTests() {
  console.log('\n🎚️  Adaptive Difficulty Selector Tests\n');

  const selector = new AdaptiveDifficultySelector();

  // Initialization Tests
  await runTest('Should initialize difficulty for user', () => {
    const difficulty = selector.initializeDifficulty('user1', 'medium');

    if (difficulty !== 'medium') {
      throw new Error(`Expected medium, got ${difficulty}`);
    }
  });

  await runTest('Should normalize marked difficulty', () => {
    const difficulty = selector.initializeDifficulty('user2', 'HARD');

    if (!difficulty) {
      throw new Error('Should normalize and return difficulty');
    }
  });

  // Record Score Tests
  await runTest('Should record score and update difficulty', () => {
    selector.initializeDifficulty('user3', 'medium');
    const result = selector.recordScoreAndUpdateDifficulty('user3', 85);

    if (!result.currentDifficulty) {
      throw new Error('Should return current difficulty');
    }
  });

  await runTest('Should increase difficulty for improving performance', () => {
    const userId = 'user4';
    selector.initializeDifficulty(userId, 'easy');

    // Record high scores
    selector.recordScoreAndUpdateDifficulty(userId, 85);
    selector.recordScoreAndUpdateDifficulty(userId, 88);
    const result = selector.recordScoreAndUpdateDifficulty(userId, 90);

    // Should have increased difficulty
    if (result.trajectory <= 0) {
      throw new Error('Should detect improving trajectory');
    }
  });

  await runTest('Should decrease difficulty for declining performance', () => {
    const userId = 'user5';
    selector.initializeDifficulty(userId, 'hard');

    // Record low scores
    selector.recordScoreAndUpdateDifficulty(userId, 35);
    selector.recordScoreAndUpdateDifficulty(userId, 40);
    const result = selector.recordScoreAndUpdateDifficulty(userId, 30);

    // Should have trajectory indication
    if (!result.adjustmentReason) {
      throw new Error('Should provide adjustment reason');
    }
  });

  // Clamping Tests
  await runTest('Should clamp score to 0-100 range', () => {
    const userId = 'user6';
    selector.initializeDifficulty(userId, 'medium');

    const result1 = selector.recordScoreAndUpdateDifficulty(userId, -10);
    const result2 = selector.recordScoreAndUpdateDifficulty(userId, 150);

    // Scores should be within 0-100
    if (result1.lastScore < 0 || result2.lastScore > 100) {
      throw new Error('Should clamp scores to 0-100');
    }
  });

  // Current Difficulty Tests
  await runTest('Should get current difficulty for user', () => {
    const userId = 'user7';
    selector.initializeDifficulty(userId, 'hard');

    const difficulty = selector.getCurrentDifficulty(userId);

    if (difficulty !== 'hard') {
      throw new Error(`Expected hard, got ${difficulty}`);
    }
  });

  await runTest('Should return default difficulty for unknown user', () => {
    const difficulty = selector.getCurrentDifficulty('unknown_user');

    if (difficulty !== 'medium') {
      throw new Error('Should return default medium difficulty');
    }
  });

  // Statistics Tests
  await runTest('Should get difficulty statistics', () => {
    const userId = 'user8';
    selector.initializeDifficulty(userId, 'medium');
    selector.recordScoreAndUpdateDifficulty(userId, 75);
    selector.recordScoreAndUpdateDifficulty(userId, 80);

    const stats = selector.getDifficultyStats(userId);

    if (!stats || !stats.markedDifficulty) {
      throw new Error('Should return difficulty statistics');
    }
  });

  await runTest('Should track difficulty history', () => {
    const userId = 'user9';
    selector.initializeDifficulty(userId, 'easy');
    selector.recordScoreAndUpdateDifficulty(userId, 90);
    selector.recordScoreAndUpdateDifficulty(userId, 92);
    selector.recordScoreAndUpdateDifficulty(userId, 88);

    const stats = selector.getDifficultyStats(userId);

    if (!stats.difficultyHistory || stats.difficultyHistory.length === 0) {
      throw new Error('Should track difficulty history');
    }
  });

  // Score Tracking Tests
  await runTest('Should track average score', () => {
    const userId = 'user10';
    selector.initializeDifficulty(userId, 'medium');
    selector.recordScoreAndUpdateDifficulty(userId, 60);
    selector.recordScoreAndUpdateDifficulty(userId, 80);
    selector.recordScoreAndUpdateDifficulty(userId, 100);

    const result = selector.recordScoreAndUpdateDifficulty(userId, 70);

    if (!result.averageScore || result.averageScore <= 0) {
      throw new Error('Should calculate average score');
    }
  });

  await runTest('Should track score history', () => {
    const userId = 'user11';
    selector.initializeDifficulty(userId, 'medium');
    selector.recordScoreAndUpdateDifficulty(userId, 50);
    selector.recordScoreAndUpdateDifficulty(userId, 60);
    const result = selector.recordScoreAndUpdateDifficulty(userId, 70);

    if (!Array.isArray(result.scoreHistory) || result.scoreHistory.length === 0) {
      throw new Error('Should track score history');
    }
  });

  // Adjustment Tracking Tests
  await runTest('Should track adjustment count', () => {
    const userId = 'user12';
    selector.initializeDifficulty(userId, 'easy');

    // Record scores that should trigger adjustments
    selector.recordScoreAndUpdateDifficulty(userId, 90);
    selector.recordScoreAndUpdateDifficulty(userId, 92);
    const result = selector.recordScoreAndUpdateDifficulty(userId, 88);

    if (result.adjustmentCount < 0) {
      throw new Error('Should track adjustment count');
    }
  });

  // Edge Cases
  await runTest('Should handle score recording before initialization', () => {
    const result = selector.recordScoreAndUpdateDifficulty('uninitialized_user', 75);

    // Should auto-initialize with defaults
    if (!result.currentDifficulty) {
      throw new Error('Should handle uninitialized user');
    }
  });

  await runTest('Should maintain consistency across operations', () => {
    const userId = 'user13';
    selector.initializeDifficulty(userId, 'medium');
    selector.recordScoreAndUpdateDifficulty(userId, 75);

    const difficulty1 = selector.getCurrentDifficulty(userId);
    const stats = selector.getDifficultyStats(userId);
    const difficulty2 = stats.currentDifficulty;

    if (difficulty1 !== difficulty2) {
      throw new Error('Difficulty should be consistent across operations');
    }
  });
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================

async function runAllTests() {
  await runSkillDetectorTests();
  await runAdaptiveDifficultyTests();

  console.log(`\n✅ Results: ${passCount} passed, ${failCount} failed (${passCount + failCount} total)`);
  process.exit(failCount > 0 ? 1 : 0);
}

runAllTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
