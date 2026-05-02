#!/usr/bin/env node

/**
 * Phase 3.1-3.2: Smart Follow-ups & Behavioral Analysis Test
 * Tests answer gap detection, follow-up generation, and behavioral scoring
 */

import interviewProber from '../utils/interviewProber.js';
import behaviorAnalyzer from '../utils/behaviorAnalyzer.js';

const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

async function runTests() {
  console.log('\n🧠 Phase 3: Advanced Interview Features Test Suite\n');

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
// INTERVIEW PROBER TESTS
// ─────────────────────────────────────────────────────────────────────

test('Prober: Detect missing impact metrics', () => {
  const question = 'Tell me about a project you built';
  const answer = 'I built a web application using React and Node.js. It had a database backend.';

  const result = interviewProber.analyzeAnswerGaps(question, answer);

  if (!result.gaps.some(g => g.type === 'impact')) {
    throw new Error('Should detect missing impact metrics');
  }
  if (result.needsFollowUp !== true) {
    throw new Error('Should need follow-up');
  }
});

test('Prober: Detect missing technical depth', () => {
  const question = 'How would you design a cache invalidation system?';
  const answer = 'I would use caching to make things faster.';

  const result = interviewProber.analyzeAnswerGaps(question, answer);

  if (!result.gaps.some(g => g.type === 'technical_depth')) {
    throw new Error('Should detect shallow technical answer');
  }
});

test('Prober: Recognize good answers (no gaps)', () => {
  const question = 'Tell me about a technical achievement';
  const answer = 'I built a real-time analytics dashboard that processed 10K events/sec. ' +
    'The challenge was handling high-frequency data ingestion without latency spikes. ' +
    'I used Redis for caching and PostgreSQL for persistence, which are proven technologies for this. ' +
    'This reduced latency by 60% and improved user engagement by 45%. ' +
    'I led a team of 3 engineers on this 4-month project. ' +
    'Key learning: in-memory caching is critical for real-time systems.';

  const result = interviewProber.analyzeAnswerGaps(question, answer);

  if (result.needsFollowUp === true && result.gaps.length > 1) {
    throw new Error('Good answer should have minimal gaps');
  }
});

test('Prober: Generate follow-up questions', () => {
  const question = 'Describe a challenging project';
  const answer = 'I worked on an API.';

  const gaps = interviewProber.analyzeAnswerGaps(question, answer).gaps;
  const result = interviewProber.generateFollowUpQuestions(question, answer, gaps);

  if (result.followUps.length === 0) {
    throw new Error('Should generate follow-up questions');
  }
  if (!result.followUps[0].strategy) {
    throw new Error('Follow-ups should have strategy');
  }
});

test('Prober: Limit follow-ups to 3', () => {
  const question = 'Tell me everything';
  const answer = 'Something brief.';

  const gaps = interviewProber.analyzeAnswerGaps(question, answer).gaps;
  const result = interviewProber.generateFollowUpQuestions(question, answer, gaps);

  if (result.count > 3) {
    throw new Error('Should limit follow-ups to max 3');
  }
});

test('Prober: Detect STAR method in behavioral answer', () => {
  const behavioralQ = 'Tell me about a time you overcame a conflict';
  const goodAnswer = 'At my last job (Situation), I had a disagreement with a colleague (Challenge). ' +
    'I decided to listen first and understand their perspective (Action). ' +
    'We found common ground and shipped the feature 2 weeks earlier (Result).';

  const result = interviewProber.analyzeAnswerGaps(behavioralQ, goodAnswer);
  const gaps = result.gaps;

  // Good STAR answer shouldn't have challenge/solution gaps
  if (gaps.some(g => g.type === 'challenge' || g.type === 'solution')) {
    throw new Error('STAR answer should not have challenge/solution gaps');
  }
});

// ─────────────────────────────────────────────────────────────────────
// BEHAVIOR ANALYZER TESTS
// ─────────────────────────────────────────────────────────────────────

test('Behavior: Analyze clarity score', () => {
  const answer = 'I built a system. It was good. I used React. It worked well.';
  const result = behaviorAnalyzer.analyzeBehavior('', answer);

  if (typeof result.clarity !== 'number') {
    throw new Error('Clarity should be number');
  }
  if (result.clarity < 0 || result.clarity > 30) {
    throw new Error('Clarity should be 0-30');
  }
});

test('Behavior: Score structured answer higher', () => {
  const question = 'Tell me about a challenge';
  const poorAnswer = 'Did stuff.';
  const goodAnswer = 'I faced a performance issue. The system was slow. ' +
    'I implemented caching. Response times dropped 80%.';

  const poorScore = behaviorAnalyzer.calculateOverallBehaviorScore(poorAnswer, 1000, question);
  const goodScore = behaviorAnalyzer.calculateOverallBehaviorScore(goodAnswer, 3000, question);

  if (goodScore <= poorScore) {
    throw new Error('Structured answer should score higher');
  }
});

test('Behavior: Detect engagement level', () => {
  const shortAnswer = 'Done.';
  const engagingAnswer = 'I built a dashboard that reduced support tickets by 40%. ' +
    'For example, one customer that typically had 5 issues/week dropped to 1. ' +
    'We used React, Redux, and WebSockets for real-time updates.';

  const result1 = behaviorAnalyzer.analyzeBehavior('', shortAnswer);
  const result2 = behaviorAnalyzer.analyzeBehavior('', engagingAnswer);

  if (result2.engagement <= result1.engagement) {
    throw new Error('Engaging answer should score higher on engagement');
  }
});

test('Behavior: Calculate confidence level', () => {
  const confidentAnswer = 'I definitely implemented this using React and Redis caching strategy.';
  const hesitantAnswer = 'Um, I think maybe I used something like React? Not sure though.';

  const result1 = behaviorAnalyzer.analyzeConfidenceLevel(confidentAnswer, 3000, 0);
  const result2 = behaviorAnalyzer.analyzeConfidenceLevel(hesitantAnswer, 8000, 2);

  if (result1.score <= result2.score) {
    throw new Error('Confident answer should have higher confidence score');
  }
});

test('Behavior: Identify strengths', () => {
  const answer = 'I built a system with 10K users using React and Node.js. ' +
    'We used best practices like microservices and caching.';

  const strengths = behaviorAnalyzer.identifyStrengths(answer);

  if (strengths.length === 0) {
    throw new Error('Should identify at least one strength');
  }
  if (typeof strengths[0] !== 'string') {
    throw new Error('Strengths should be strings');
  }
});

test('Behavior: Identify improvement areas', () => {
  const answer = 'It was good.';
  const question = 'Tell me about a project';

  const areas = behaviorAnalyzer.identifyImprovementAreas(answer, question);

  if (areas.length === 0) {
    throw new Error('Should identify improvement areas');
  }
});

test('Behavior: Technical depth scoring', () => {
  const lightAnswer = 'I used computers to build things.';
  const technicalAnswer = 'I designed a microservices architecture with O(log n) ' +
    'complexity using PostgreSQL with Redis caching and Kubernetes orchestration.';

  const behavior1 = behaviorAnalyzer.analyzeBehavior('', lightAnswer);
  const behavior2 = behaviorAnalyzer.analyzeBehavior('', technicalAnswer);

  if (behavior2.technicalDepth <= behavior1.technicalDepth) {
    throw new Error('Technical answer should have higher depth score');
  }
});

test('Behavior: Overall score in valid range', () => {
  const question = 'Tell me about yourself';
  const answer = 'I\'m a software engineer with 5 years of experience. ' +
    'I specialize in full-stack development with React and Node.js. ' +
    'My biggest achievement was leading a team that built a payment system handling $1M/day.';

  const score = behaviorAnalyzer.calculateOverallBehaviorScore(answer, 2500, question);

  if (typeof score !== 'number') {
    throw new Error('Score should be number');
  }
  if (score < 0 || score > 100) {
    throw new Error('Score should be 0-100');
  }
  if (score < 50) {
    throw new Error('Good answer should score above 50');
  }
});

test('Behavior: Confidence indicators', () => {
  const result = behaviorAnalyzer.analyzeConfidenceLevel(
    'I clearly understand the system architecture',
    3000,
    0
  );

  if (!result.indicators || result.indicators.length === 0) {
    throw new Error('Should provide confidence indicators');
  }
});

test('Behavior: Conciseness scoring', () => {
  const rambling = 'Um, so like, I did this thing, well actually several things, ' +
    'and basically what happened was I did stuff, and then more stuff, and also stuff...';
  const concise = 'I led the API design and deployment. Result: 50% latency reduction.';

  const behavior1 = behaviorAnalyzer.analyzeBehavior('', rambling);
  const behavior2 = behaviorAnalyzer.analyzeBehavior('', concise);

  if (behavior2.conciseness <= behavior1.conciseness) {
    throw new Error('Concise answer should score higher');
  }
});

// ─────────────────────────────────────────────────────────────────────
// INTEGRATION TESTS
// ─────────────────────────────────────────────────────────────────────

test('Integration: Prober + Behavior together', () => {
  const question = 'What\'s your biggest achievement?';
  const answer = 'I made a lot of code.';

  // Analyze gaps
  const gaps = interviewProber.analyzeAnswerGaps(question, answer).gaps;
  
  // Analyze behavior
  const behavior = behaviorAnalyzer.analyzeBehavior(question, answer);

  // Should have both gaps and behavioral feedback
  if (gaps.length === 0) {
    throw new Error('Should detect gaps');
  }
  if (behavior.overallBehaviorScore === undefined) {
    throw new Error('Should calculate behavior score');
  }
});

test('Integration: Complete assessment flow', () => {
  const question = 'Tell me about your most challenging project';
  const answer = 'I built a real-time notification system. We had to handle millions of messages. ' +
    'I used Apache Kafka for streaming, PostgreSQL for storage, and Redis for caching. ' +
    'The result was 99.9% uptime with <100ms latency. ' +
    'This reduced customer complaints by 70%.';

  // Step 1: Analyze gaps
  const gapAnalysis = interviewProber.analyzeAnswerGaps(question, answer);
  
  // Step 2: Generate follow-ups if needed
  const followUps = interviewProber.generateFollowUpQuestions(
    question,
    answer,
    gapAnalysis.gaps
  );

  // Step 3: Analyze behavior
  const behavior = behaviorAnalyzer.analyzeBehavior(question, answer, { responseTime: 2500 });

  // Step 4: Get overall score
  const overallScore = behaviorAnalyzer.calculateOverallBehaviorScore(answer, 2500, question);

  // Verify flow
  if (!gapAnalysis || !behavior || !overallScore) {
    throw new Error('Full assessment should complete');
  }
  if (overallScore < 70) {
    throw new Error('Strong answer should score well');
  }
});

// Run all tests
runTests();
