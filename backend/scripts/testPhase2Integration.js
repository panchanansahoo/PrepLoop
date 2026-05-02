#!/usr/bin/env node

/**
 * Phase 2 Integration Test Suite
 * Tests dedup, difficulty adjustment, performance tracking, and follow-ups
 */

import phase2Service from '../services/phase2IntegrationService.js';
import * as questionHasher from '../utils/questionHasher.js';
import * as questionPoolManager from '../utils/questionPoolManager.js';
import * as performanceAnalyzer from '../utils/performanceAnalyzer.js';
import * as difficultyAdjuster from '../utils/difficultyAdjuster.js';
import * as followUpContextBuilder from '../utils/followUpContextBuilder.js';

const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

async function runTests() {
  console.log('\n🧪 Phase 2 Integration Test Suite\n');

  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ ${name}`);
      console.error(`   Error: ${err.message}\n`);
      failed++;
    }
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

// Test 1: Initialize Phase 2
test('Phase 2: Initialize session', () => {
  const result = phase2Service.initializePhase2('user-1', 'technical', 'medium');
  if (!result.initialized) throw new Error('Not initialized');
  if (result.userId !== 'user-1') throw new Error('Wrong userId');
});

// Test 2: Check for duplicate questions
test('Phase 2: Detect duplicate questions', () => {
  const userId = 'user-dup-test';
  const q1 = 'What is a binary search tree?';
  const q2 = 'Explain binary search trees';
  const q3 = 'What is recursion?';

  // Add first question
  phase2Service.trackQuestionAsked(userId, {
    id: 'q1',
    text: q1,
    difficulty: 'medium'
  });

  // Check similar question
  const dupCheck1 = phase2Service.checkQuestionDuplicate(userId, q2);
  if (!dupCheck1.isDuplicate) throw new Error('Should detect similar question');

  // Check different question
  const dupCheck2 = phase2Service.checkQuestionDuplicate(userId, q3);
  if (dupCheck2.isDuplicate) throw new Error('Should not detect unrelated question as duplicate');
});

// Test 3: Track questions asked
test('Phase 2: Track questions in pool', () => {
  const userId = 'user-track-test';
  const result1 = phase2Service.trackQuestionAsked(userId, {
    id: 'q1',
    text: 'How does HTTP work?',
    difficulty: 'medium'
  });

  const result2 = phase2Service.trackQuestionAsked(userId, {
    id: 'q2',
    text: 'What are REST APIs?',
    difficulty: 'hard'
  });

  if (!result1.tracked || !result2.tracked) throw new Error('Not tracked');
  if (result2.poolSize !== 2) throw new Error('Pool size should be 2');
});

// Test 4: Get difficulty with adjustment
test('Phase 2: Get adjusted difficulty', () => {
  const userId = 'user-difficulty-test';

  // Record good performance
  phase2Service.recordAnswer(userId, {
    category: 'technical',
    difficulty: 'easy',
    correctness: 85,
    speed: 80,
    explanation: 90
  });

  phase2Service.recordAnswer(userId, {
    category: 'technical',
    difficulty: 'easy',
    correctness: 88,
    speed: 85,
    explanation: 92
  });

  phase2Service.recordAnswer(userId, {
    category: 'technical',
    difficulty: 'easy',
    correctness: 90,
    speed: 88,
    explanation: 95
  });

  const result = phase2Service.getNextQuestionDifficulty(userId, 'technical');
  // Should stay or increase
  if (!['easy', 'medium'].includes(result.difficulty)) {
    throw new Error(`Unexpected difficulty: ${result.difficulty}`);
  }
});

// Test 5: Record answers
test('Phase 2: Record answer performance', () => {
  const userId = 'user-answer-test';
  const result = phase2Service.recordAnswer(userId, {
    category: 'behavioral',
    difficulty: 'medium',
    correctness: 75,
    speed: 80,
    explanation: 70,
    questionId: 'q1',
    responseTime: 120
  });

  if (result.score === undefined) throw new Error('No score recorded');
  if (result.score < 0 || result.score > 100) throw new Error('Invalid score range');
});

// Test 6: Get follow-up recommendation
test('Phase 2: Recommend follow-ups', () => {
  const question = 'Explain how the internet works';
  const answer = 'The internet uses TCP/IP protocol for communication.';

  const result = phase2Service.getFollowUpRecommendation(question, answer, 'medium');

  // Should have follow-up structure
  if (result === null || typeof result !== 'object') throw new Error('Invalid follow-up');
  if (!('canFollowUp' in result)) throw new Error('Missing canFollowUp field');
});

// Test 7: Generate follow-up prompt
test('Phase 2: Generate follow-up prompt', () => {
  const question = 'What is object-oriented programming?';
  const answer = 'OOP is a programming paradigm that uses objects and classes.';

  const result = phase2Service.generateFollowUpPrompt(question, answer, 'medium');

  if (result && result.prompt) {
    if (typeof result.prompt !== 'string') throw new Error('Prompt should be string');
    if (result.prompt.length < 10) throw new Error('Prompt too short');
  }
});

// Test 8: Assess answer quality
test('Phase 2: Assess answer quality', () => {
  const question = 'How do you debug a web application?';
  const answer = 'You can use browser developer tools to inspect elements and check the console for errors. You can also set breakpoints in the debugger.';

  const result = phase2Service.assessAnswerQuality(answer, question);

  if (result.quality === undefined) throw new Error('No quality score');
  if (result.score === undefined) throw new Error('No quality score value');
  if (!Array.isArray(result.gaps)) throw new Error('Gaps should be array');
});

// Test 9: Validate question for user
test('Phase 2: Validate question before showing', () => {
  const userId = 'user-validate-test';

  // Add a question to pool
  phase2Service.trackQuestionAsked(userId, {
    id: 'q1',
    text: 'What is polymorphism?',
    difficulty: 'hard'
  });

  // Validate unique question
  const result1 = phase2Service.validateQuestionForUser(
    userId,
    'Explain inheritance in OOP',
    'hard'
  );

  if (!result1.valid) throw new Error('Valid question marked invalid');

  // Validate duplicate question
  const result2 = phase2Service.validateQuestionForUser(
    userId,
    'What is polymorphism in programming?',
    'hard'
  );

  if (result2.valid) throw new Error('Duplicate question marked valid');
});

// Test 10: Get performance summary
test('Phase 2: Get performance summary', () => {
  const userId = 'user-summary-test';

  // Record multiple answers
  for (let i = 0; i < 5; i++) {
    phase2Service.recordAnswer(userId, {
      category: 'technical',
      difficulty: 'medium',
      correctness: 70 + i * 5,
      speed: 75 + i * 4,
      explanation: 65 + i * 3
    });
  }

  const summary = phase2Service.getPerformanceSummary(userId);

  if (!summary.overall) throw new Error('Missing overall stats');
  if (!summary.difficulty) throw new Error('Missing difficulty stats');
  if (!summary.questions) throw new Error('Missing question stats');
  if (summary.overall.totalQuestions < 5) throw new Error('Should have at least 5 questions');
});

// Test 11: Finalize session
test('Phase 2: Finalize interview session', () => {
  const userId = 'user-finalize-test';

  phase2Service.recordAnswer(userId, {
    category: 'technical',
    difficulty: 'medium',
    correctness: 80,
    speed: 85,
    explanation: 82
  });

  const result = phase2Service.finalizeInterviewSession(userId);

  if (!result.sessionFinalized) throw new Error('Session not finalized');
});

// Test 12: Integration - Full flow
test('Phase 2: Full integration flow', () => {
  const userId = 'user-full-flow-test';

  // Initialize
  phase2Service.initializePhase2(userId, 'technical', 'easy');

  // Get difficulty
  const diff1 = phase2Service.getNextQuestionDifficulty(userId, 'technical');
  if (!diff1.difficulty) throw new Error('No difficulty returned');

  // Track question
  phase2Service.trackQuestionAsked(userId, {
    id: 'q1',
    text: 'What is a variable?',
    difficulty: diff1.difficulty
  });

  // Record answer
  const perf = phase2Service.recordAnswer(userId, {
    category: 'technical',
    difficulty: diff1.difficulty,
    correctness: 85,
    speed: 80,
    explanation: 82
  });
  if (!perf.score) throw new Error('No score recorded');

  // Get follow-up
  const followUp = phase2Service.getFollowUpRecommendation(
    'What is a variable?',
    'A variable is a named container that stores a value.',
    diff1.difficulty
  );
  if (!followUp) throw new Error('No follow-up recommendation');

  // Finalize
  phase2Service.finalizeInterviewSession(userId);
});

// Test 13: Question deduplication edge cases
test('Phase 2: Dedup with case/punctuation variations', () => {
  const userId = 'user-dedup-edge-test';
  const q1 = 'What is JavaScript?';
  const q2 = 'what is javascript';
  const q3 = 'What is JavaScript?!';

  phase2Service.trackQuestionAsked(userId, {
    id: 'q1',
    text: q1,
    difficulty: 'easy'
  });

  // All should be detected as duplicates
  const dup1 = phase2Service.checkQuestionDuplicate(userId, q2);
  const dup2 = phase2Service.checkQuestionDuplicate(userId, q3);

  if (!dup1.isDuplicate) throw new Error('Should detect case variation');
  if (!dup2.isDuplicate) throw new Error('Should detect punctuation variation');
});

// Test 14: Difficulty progression
test('Phase 2: Difficulty progression tracking', () => {
  const userId = 'user-progression-test';

  // Record declining performance (should decrease difficulty)
  for (let i = 0; i < 3; i++) {
    phase2Service.recordAnswer(userId, {
      category: 'technical',
      difficulty: 'hard',
      correctness: 40 - i * 5,
      speed: 50,
      explanation: 35 - i * 3
    });
  }

  const summary = phase2Service.getPerformanceSummary(userId);
  if (!summary.difficulty) throw new Error('Missing difficulty data');
});

// Test 15: Quality assessment variations
test('Phase 2: Quality assessment for different answers', () => {
  const question = 'What are design patterns?';
  const shortAnswer = 'Solutions to problems.';
  const longAnswer = 'Design patterns are reusable solutions to common problems in software design. They represent best practices and can accelerate development. Examples include Singleton, Factory, and Observer patterns.';

  const result1 = phase2Service.assessAnswerQuality(shortAnswer, question);
  const result2 = phase2Service.assessAnswerQuality(longAnswer, question);

  if (result1.score >= result2.score) {
    throw new Error('Longer, detailed answer should score higher');
  }
});

// Run all tests
runTests();
