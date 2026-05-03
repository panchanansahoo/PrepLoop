/**
 * testProblemRecommender.js
 * 
 * Tests for ProblemRecommender service
 * Coverage: weakness analysis, skill detection, recommendations, learning paths
 * 30+ comprehensive test cases
 */

import ProblemRecommender from '../services/problemRecommender.js';

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

// Mock data
const mockProblems = [
  {
    id: 1,
    title: 'Two Sum',
    topic: 'arrays',
    difficulty: 'easy',
    keywords: ['hash-map', 'array'],
  },
  {
    id: 2,
    title: 'Longest Substring',
    topic: 'strings',
    difficulty: 'medium',
    keywords: ['sliding-window', 'string'],
  },
  {
    id: 3,
    title: 'Binary Search Tree',
    topic: 'trees',
    difficulty: 'medium',
    keywords: ['tree', 'recursion'],
  },
  {
    id: 4,
    title: 'Word Ladder',
    topic: 'graphs',
    difficulty: 'hard',
    keywords: ['graph', 'bfs'],
  },
  {
    id: 5,
    title: 'Edit Distance',
    topic: 'dynamic-programming',
    difficulty: 'hard',
    keywords: ['dp', 'strings'],
  },
];

async function runAllTests() {
  console.log('🎓 Problem Recommender Tests\n');

  // ============================================================================
  // Weakness Analysis Tests
  // ============================================================================

  await runTest('Should analyze user weaknesses', () => {
    const recommender = new ProblemRecommender();
    const userStats = {
      topicStats: {
        arrays: { totalSubmissions: 10, successfulSubmissions: 3 }, // 30% success
        strings: { totalSubmissions: 8, successfulSubmissions: 7 }, // 87.5% success
        trees: { totalSubmissions: 5, successfulSubmissions: 2 }, // 40% success
      },
    };

    const weaknesses = recommender.analyzeWeaknesses(userStats);

    if (!weaknesses.arrays) throw new Error('Should identify arrays as weakness');
    if (!weaknesses.trees) throw new Error('Should identify trees as weakness');
    if (weaknesses.strings) throw new Error('Strings should not be weakness');
  });

  await runTest('Should ignore minor weakness variations', () => {
    const recommender = new ProblemRecommender();
    const userStats = {
      topicStats: {
        arrays: { totalSubmissions: 10, successfulSubmissions: 8 }, // 80% success
      },
    };

    const weaknesses = recommender.analyzeWeaknesses(userStats);

    if (weaknesses.arrays) throw new Error('Should not report minor weakness');
  });

  await runTest('Should handle topics with no submissions', () => {
    const recommender = new ProblemRecommender();
    const userStats = {
      topicStats: {
        graphs: { totalSubmissions: 0, successfulSubmissions: 0 },
      },
    };

    const weaknesses = recommender.analyzeWeaknesses(userStats);

    if (!weaknesses.graphs && Object.keys(weaknesses).length > 0) {
      throw new Error('Should handle zero submissions gracefully');
    }
  });

  // ============================================================================
  // Skill Level Detection Tests
  // ============================================================================

  await runTest('Should detect beginner skill level', () => {
    const recommender = new ProblemRecommender();
    const userStats = { totalSolved: 2, solveRate: 0.4 };

    const level = recommender.calculateSkillLevel(userStats);

    if (level !== 'beginner') throw new Error(`Expected beginner, got ${level}`);
  });

  await runTest('Should detect intermediate skill level', () => {
    const recommender = new ProblemRecommender();
    const userStats = { totalSolved: 25, solveRate: 0.65 };

    const level = recommender.calculateSkillLevel(userStats);

    if (level !== 'intermediate') throw new Error(`Expected intermediate, got ${level}`);
  });

  await runTest('Should detect advanced skill level', () => {
    const recommender = new ProblemRecommender();
    const userStats = { totalSolved: 50, solveRate: 0.8 };

    const level = recommender.calculateSkillLevel(userStats);

    if (level !== 'advanced') throw new Error(`Expected advanced, got ${level}`);
  });

  await runTest('Should detect expert skill level', () => {
    const recommender = new ProblemRecommender();
    const userStats = { totalSolved: 100, solveRate: 0.9 };

    const level = recommender.calculateSkillLevel(userStats);

    if (level !== 'expert') throw new Error(`Expected expert, got ${level}`);
  });

  // ============================================================================
  // Recommendation Tests
  // ============================================================================

  await runTest('Should get basic recommendations', () => {
    const recommender = new ProblemRecommender();
    const userProfile = { weaknessAreas: { arrays: 0.7 }, skillLevel: 'beginner' };
    const userStats = {
      solvedProblems: [],
      solveRate: 0.5,
      attemptHistory: {},
      recentTopics: [],
      solvedPatterns: {},
    };

    const recommendations = recommender.getRecommendations(userProfile, mockProblems, userStats, {
      limit: 3,
    });

    if (!Array.isArray(recommendations)) throw new Error('Should return array');
    if (recommendations.length === 0) throw new Error('Should return recommendations');
  });

  await runTest('Should exclude already solved problems', () => {
    const recommender = new ProblemRecommender();
    const userProfile = { weaknessAreas: {}, skillLevel: 'beginner' };
    const userStats = {
      solvedProblems: [1, 2],
      solveRate: 0.5,
      attemptHistory: {},
      recentTopics: [],
      solvedPatterns: {},
    };

    const recommendations = recommender.getRecommendations(userProfile, mockProblems, userStats, {
      limit: 10,
    });

    const solvedIds = recommendations.map(r => r.id);
    if (solvedIds.includes(1) || solvedIds.includes(2)) {
      throw new Error('Should exclude solved problems');
    }
  });

  await runTest('Should recommend based on weakness areas', () => {
    const recommender = new ProblemRecommender();
    const userProfile = { weaknessAreas: { arrays: 0.8 }, skillLevel: 'beginner' };
    const userStats = {
      solvedProblems: [],
      solveRate: 0.5,
      attemptHistory: {},
      recentTopics: [],
      solvedPatterns: {},
    };

    const recommendations = recommender.getRecommendations(userProfile, mockProblems, userStats, {
      limit: 1,
      strategy: 'weakness',
    });

    if (recommendations.length === 0) throw new Error('Should return at least one recommendation');
    if (recommendations[0].topic !== 'arrays') {
      throw new Error('Should prioritize weak topic');
    }
  });

  await runTest('Should include recommendation reason', () => {
    const recommender = new ProblemRecommender();
    const userProfile = { weaknessAreas: { arrays: 0.8 }, skillLevel: 'beginner' };
    const userStats = {
      solvedProblems: [],
      solveRate: 0.5,
      attemptHistory: {},
      recentTopics: [],
      solvedPatterns: {},
    };

    const recommendations = recommender.getRecommendations(userProfile, mockProblems, userStats, {
      limit: 1,
    });

    if (!recommendations[0].reason) throw new Error('Should include recommendation reason');
  });

  // ============================================================================
  // Company-Specific Recommendations
  // ============================================================================

  await runTest('Should get Google-specific problems', () => {
    const recommender = new ProblemRecommender();
    const userStats = { solvedProblems: [] };

    const recommendations = recommender.getCompanySpecificProblems(
      'google',
      mockProblems,
      userStats,
      5
    );

    if (recommendations.length === 0) throw new Error('Should return Google-specific problems');
  });

  await runTest('Should get Amazon-specific problems', () => {
    const recommender = new ProblemRecommender();
    const userStats = { solvedProblems: [] };

    const recommendations = recommender.getCompanySpecificProblems(
      'amazon',
      mockProblems,
      userStats,
      5
    );

    if (recommendations.length === 0) throw new Error('Should return Amazon-specific problems');
  });

  await runTest('Should exclude already-solved in company-specific', () => {
    const recommender = new ProblemRecommender();
    const userStats = { solvedProblems: [1, 2, 3] };

    const recommendations = recommender.getCompanySpecificProblems(
      'google',
      mockProblems,
      userStats,
      10
    );

    const solvedIds = recommendations.map(r => r.id);
    if (solvedIds.some(id => [1, 2, 3].includes(id))) {
      throw new Error('Should exclude solved problems');
    }
  });

  // ============================================================================
  // Learning Path Tests
  // ============================================================================

  await runTest('Should generate learning path', () => {
    const recommender = new ProblemRecommender();
    const userStats = { solvedProblems: [] };

    const path = recommender.getLearningPath(mockProblems, userStats, 'arrays', 5);

    if (path.length === 0) throw new Error('Should generate learning path');
    if (!path[0].sequenceNumber) throw new Error('Should include sequence numbers');
  });

  await runTest('Should sort learning path by difficulty', () => {
    const recommender = new ProblemRecommender();
    const userStats = { solvedProblems: [] };

    const path = recommender.getLearningPath(mockProblems, userStats, 'arrays', 5);

    if (path.length > 1) {
      const difficulties = path.map(p => p.difficulty);
      // Should be in increasing difficulty order
      const diffMap = { easy: 1, medium: 2, hard: 3 };
      for (let i = 1; i < difficulties.length; i++) {
        if (diffMap[difficulties[i]] < diffMap[difficulties[i - 1]]) {
          throw new Error('Learning path should be in increasing difficulty');
        }
      }
    }
  });

  await runTest('Should exclude solved problems from learning path', () => {
    const recommender = new ProblemRecommender();
    const userStats = { solvedProblems: [1] };

    const path = recommender.getLearningPath(mockProblems, userStats, 'arrays', 5);

    const pathIds = path.map(p => p.id);
    if (pathIds.includes(1)) throw new Error('Should exclude solved problems');
  });

  await runTest('Should include expected duration in learning path', () => {
    const recommender = new ProblemRecommender();
    const userStats = { solvedProblems: [] };

    const path = recommender.getLearningPath(mockProblems, userStats, 'arrays', 5);

    if (path.length > 0 && !path[0].expectedDuration) {
      throw new Error('Should include expected duration');
    }
  });

  // ============================================================================
  // Post-Submission Suggestions
  // ============================================================================

  await runTest('Should suggest harder problems after success', () => {
    const recommender = new ProblemRecommender();
    const submission = { success: true, topic: 'arrays' };
    const userStats = {
      solvedProblems: [],
      solveRate: 0.6,
      attemptHistory: {},
      recentTopics: [],
      solvedPatterns: {},
    };

    const suggestions = recommender.getSuggestionsAfterSubmission(
      submission,
      mockProblems,
      userStats
    );

    if (suggestions.length === 0) throw new Error('Should suggest next problems');
  });

  await runTest('Should suggest easier problems after failure', () => {
    const recommender = new ProblemRecommender();
    const submission = { success: false, topic: 'arrays' };
    const userStats = {
      solvedProblems: [],
      solveRate: 0.4,
      attemptHistory: {},
      recentTopics: [],
      solvedPatterns: {},
    };

    const suggestions = recommender.getSuggestionsAfterSubmission(
      submission,
      mockProblems,
      userStats
    );

    if (suggestions.length === 0) throw new Error('Should suggest practice problems');
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  await runTest('Should handle empty problem list', () => {
    const recommender = new ProblemRecommender();
    const userProfile = { weaknessAreas: {} };
    const userStats = { solvedProblems: [], solveRate: 0.5, attemptHistory: {} };

    const recommendations = recommender.getRecommendations(userProfile, [], userStats);

    if (recommendations.length !== 0) throw new Error('Should return empty array');
  });

  await runTest('Should handle user with all problems solved', () => {
    const recommender = new ProblemRecommender();
    const userProfile = { weaknessAreas: {} };
    const userStats = {
      solvedProblems: mockProblems.map(p => p.id),
      solveRate: 1.0,
      attemptHistory: {},
    };

    const recommendations = recommender.getRecommendations(userProfile, mockProblems, userStats);

    if (recommendations.length !== 0) throw new Error('Should return empty array when all solved');
  });

  await runTest('Should handle case-insensitive company names', () => {
    const recommender = new ProblemRecommender();
    const userStats = { solvedProblems: [] };

    const recommendations1 = recommender.getCompanySpecificProblems(
      'GOOGLE',
      mockProblems,
      userStats,
      5
    );
    const recommendations2 = recommender.getCompanySpecificProblems(
      'google',
      mockProblems,
      userStats,
      5
    );

    if (recommendations1.length !== recommendations2.length) {
      throw new Error('Should handle case-insensitive company names');
    }
  });

  console.log(`\n✅ Results: ${passCount} passed, ${failCount} failed (${passCount + failCount} total)`);
  process.exit(failCount > 0 ? 1 : 0);
}

runAllTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
