#!/usr/bin/env node

/**
 * Phase 3.3-3.4: Natural Conversation Flow & Adaptive Routing Tests
 * Tests personality management, conversation pacing, and intelligent routing
 */

import interviewerPersonality from '../utils/interviewerPersonality.js';
import ConversationManager from '../utils/conversationManager.js';
import CategoryStrengthTracker, { categorizeQuestion, CATEGORIES } from '../utils/categoryStrengthTracker.js';
import InterviewRouter from '../utils/interviewRouter.js';

const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

async function runTests() {
  console.log('\n🎭 Phase 3.3-3.4: Natural Flow & Adaptive Routing Test Suite\n');

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

// ─────────────────────────────────────────────────────────────────────
// PERSONALITY TESTS
// ─────────────────────────────────────────────────────────────────────

test('Personality: Load all personas', () => {
  const personas = interviewerPersonality.getAllPersonas();
  if (personas.length !== 5) throw new Error(`Expected 5 personas, got ${personas.length}`);
  if (!personas.includes('professional')) throw new Error('Missing professional persona');
});

test('Personality: Select persona for behavioral question', () => {
  const question = 'Tell me about a time you handled conflict';
  const persona = interviewerPersonality.selectPersonaForQuestion(question);
  if (persona !== 'behavioral') throw new Error(`Expected behavioral persona, got ${persona}`);
});

test('Personality: Select persona for system design', () => {
  const question = 'Design a distributed database system';
  const persona = interviewerPersonality.selectPersonaForQuestion(question);
  if (persona !== 'academic') throw new Error(`Expected academic persona, got ${persona}`);
});

test('Personality: Get reaction based on quality score', () => {
  const goodReaction = interviewerPersonality.getReaction('professional', 85);
  const badReaction = interviewerPersonality.getReaction('professional', 30);
  
  if (!goodReaction || !badReaction) throw new Error('Reaction should not be empty');
  if (goodReaction === badReaction) throw new Error('Reactions should differ by quality');
});

test('Personality: Generate intro phrase', () => {
  const phrase = interviewerPersonality.getIntroPhrase('professional');
  if (!phrase || phrase.length === 0) throw new Error('Should generate intro phrase');
});

test('Personality: Calculate pace multiplier', () => {
  const intense = interviewerPersonality.calculatePaceMultiplier('intense', 1000);
  const friendly = interviewerPersonality.calculatePaceMultiplier('friendly', 1000);
  const professional = interviewerPersonality.calculatePaceMultiplier('professional', 1000);
  
  // Intense = fast (lower delay), Friendly = slow (higher delay)
  if (intense >= friendly) throw new Error('Intense should have shorter delay than friendly');
  if (intense >= professional) throw new Error('Intense should be faster than professional');
  if (friendly <= professional) throw new Error('Friendly should be slower than professional');
});

// ─────────────────────────────────────────────────────────────────────
// CONVERSATION MANAGER TESTS
// ─────────────────────────────────────────────────────────────────────

test('Conversation: Initialize with persona', () => {
  const manager = new ConversationManager('user123', 'friendly');
  if (manager.personaType !== 'friendly') throw new Error('Persona not set');
});

test('Conversation: Calculate pause length', () => {
  const manager = new ConversationManager('user123', 'professional');
  const pause = manager.calculatePauseLength({ answerLength: 300, answerQuality: 75 });
  
  if (pause < 300 || pause > 3000) throw new Error(`Pause out of range: ${pause}`);
});

test('Conversation: Calculate think time', () => {
  const manager = new ConversationManager('user123', 'intense');
  const thinkTime = manager.calculateThinkTime({ complexity: 'high' });
  
  if (thinkTime < 200 || thinkTime > 2000) throw new Error(`Think time out of range: ${thinkTime}`);
});

test('Conversation: Generate thinking phrase', () => {
  const manager = new ConversationManager('user123', 'academic');
  const phrase = manager.generateThinkingPhrase();
  
  if (!phrase || phrase.length === 0) throw new Error('Should generate thinking phrase');
});

test('Conversation: Generate reaction', () => {
  const manager = new ConversationManager('user123', 'professional');
  const reaction = manager.generateReaction(80, 0);
  
  if (!reaction.text || !reaction.delay || !reaction.type) {
    throw new Error('Reaction should have text, delay, and type');
  }
});

test('Conversation: Track conversation flow', () => {
  const manager = new ConversationManager('user123', 'professional');
  
  manager.recordTurn({
    question: 'Tell me about yourself',
    answer: 'I am a software engineer',
    answerQuality: 75,
    answerLength: 50,
    personaReaction: 'Good intro'
  });

  if (manager.turnsCount !== 1) throw new Error('Should record turn');
  if (manager.lastAnswerQuality !== 75) throw new Error('Should track quality');
});

test('Conversation: Update momentum on improving answers', () => {
  const manager = new ConversationManager('user123', 'professional');
  
  manager.recordTurn({
    question: 'Q1',
    answer: 'A1',
    answerQuality: 60,
    answerLength: 100
  });

  manager.recordTurn({
    question: 'Q2',
    answer: 'A2',
    answerQuality: 75,
    answerLength: 150
  });

  if (manager.momentumScore <= 0) throw new Error('Momentum should increase on improvement');
});

test('Conversation: Get conversation phase', () => {
  const manager = new ConversationManager('user123', 'professional');
  
  if (manager.getConversationPhase() !== 'opening') throw new Error('Should start at opening');
  
  for (let i = 0; i < 5; i++) {
    manager.recordTurn({ question: `Q${i}`, answer: `A${i}`, answerQuality: 70 });
  }
  
  if (manager.getConversationPhase() !== 'main') throw new Error('Should be in main phase');
});

// ─────────────────────────────────────────────────────────────────────
// CATEGORY STRENGTH TRACKER TESTS
// ─────────────────────────────────────────────────────────────────────

test('Category: Categorize behavioral question', () => {
  const category = categorizeQuestion('Tell me about a conflict you resolved');
  if (category !== CATEGORIES.BEHAVIORAL) throw new Error(`Expected behavioral, got ${category}`);
});

test('Category: Categorize system design question', () => {
  const category = categorizeQuestion('Design a scalable caching system');
  if (category !== CATEGORIES.SYSTEM_DESIGN) throw new Error(`Expected system_design, got ${category}`);
});

test('Category: Initialize tracker', () => {
  const tracker = new CategoryStrengthTracker('user123', 'session123');
  if (!tracker.categoryScores) throw new Error('Tracker should initialize scores');
});

test('Category: Record answer and calculate average', () => {
  const tracker = new CategoryStrengthTracker('user123', 'session123');
  
  tracker.recordAnswer(CATEGORIES.TECHNICAL, 75);
  tracker.recordAnswer(CATEGORIES.TECHNICAL, 85);
  
  const avg = tracker.getAverageScore(CATEGORIES.TECHNICAL);
  if (avg !== 80) throw new Error(`Expected average 80, got ${avg}`);
});

test('Category: Identify weakest categories', () => {
  const tracker = new CategoryStrengthTracker('user123', 'session123');
  
  tracker.recordAnswer(CATEGORIES.TECHNICAL, 90);
  tracker.recordAnswer(CATEGORIES.ALGORITHM, 40);
  tracker.recordAnswer(CATEGORIES.DATABASE, 55);
  
  const weakest = tracker.getWeakestCategories(1);
  if (weakest[0].category !== CATEGORIES.ALGORITHM) throw new Error('Should identify weakest category');
});

test('Category: Get next category for practice', () => {
  const tracker = new CategoryStrengthTracker('user123', 'session123');
  
  tracker.recordAnswer(CATEGORIES.TECHNICAL, 90);
  tracker.recordAnswer(CATEGORIES.ALGORITHM, 40);
  
  const nextCategory = tracker.getNextCategory('weakness-focused');
  if (nextCategory !== CATEGORIES.ALGORITHM) throw new Error('Should recommend weakest area');
});

test('Category: Get strength report', () => {
  const tracker = new CategoryStrengthTracker('user123', 'session123');
  
  tracker.recordAnswer(CATEGORIES.TECHNICAL, 75);
  tracker.recordAnswer(CATEGORIES.BEHAVIORAL, 85);
  
  const report = tracker.getStrengthReport();
  if (!report.summary || !report.byCategory) throw new Error('Report should have structure');
  if (report.summary.totalAttempts !== 2) throw new Error('Should count attempts');
});

// ─────────────────────────────────────────────────────────────────────
// INTERVIEW ROUTER TESTS
// ─────────────────────────────────────────────────────────────────────

test('Router: Initialize', () => {
  const router = new InterviewRouter('user123', 'session123');
  if (router.currentPhase !== 'opening') throw new Error('Should start at opening');
  if (router.difficulty !== 'medium') throw new Error('Should start at medium difficulty');
});

test('Router: Record question and update phase', () => {
  const router = new InterviewRouter('user123', 'session123');
  
  router.recordQuestion('Tell me about yourself', 70);
  if (router.questionsAsked.length !== 1) throw new Error('Should record question');
});

test('Router: Advance through interview phases', () => {
  const router = new InterviewRouter('user123', 'session123');
  
  for (let i = 0; i < 9; i++) {
    router.recordQuestion(`Question ${i}`, 70);
  }
  
  if (router.currentPhase !== 'deepening') throw new Error(`Should be in deepening phase, got ${router.currentPhase}`);
});

test('Router: Adjust difficulty based on performance', () => {
  const router = new InterviewRouter('user123', 'session123');
  
  for (let i = 0; i < 5; i++) {
    router.recordQuestion(`Q${i}`, 85);  // Strong performance
  }
  
  if (router.difficulty !== 'hard') throw new Error(`Should increase to hard difficulty, got ${router.difficulty}`);
});

test('Router: Select next category', () => {
  const router = new InterviewRouter('user123', 'session123');
  
  router.recordQuestion('Tell me about yourself', 70);
  
  const nextCategory = router.selectNextCategory();
  if (!nextCategory) throw new Error('Should select next category');
});

test('Router: Get routing recommendation', () => {
  const router = new InterviewRouter('user123', 'session123');
  
  router.recordQuestion('First question', 75);
  
  const recommendation = router.getRoutingRecommendation();
  if (!recommendation.category || !recommendation.difficulty || !recommendation.persona) {
    throw new Error('Recommendation should have category, difficulty, and persona');
  }
});

test('Router: Get analytics', () => {
  const router = new InterviewRouter('user123', 'session123');
  
  router.recordQuestion('Q1', 75);
  router.recordQuestion('Q2', 80);
  
  const analytics = router.getAnalytics();
  if (!analytics.strengthReport || !analytics.interviewProgress) {
    throw new Error('Analytics should have report and progress');
  }
  if (analytics.interviewProgress.questionsAsked !== 2) {
    throw new Error('Should track questions count');
  }
});

test('Router: Calculate recent trend', () => {
  const router = new InterviewRouter('user123', 'session123');
  
  router.recordQuestion('Q1', 60);
  router.recordQuestion('Q2', 65);
  router.recordQuestion('Q3', 72);
  
  const trend = router.getRecentTrend();
  if (trend !== 'improving') throw new Error(`Should show improving trend, got ${trend}`);
});

// Run all tests
runTests();
