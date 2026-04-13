import assert from 'assert';
import { InterviewGroundingServiceV2 } from '../services/interviewGroundingService.js';

const groundingService = new InterviewGroundingServiceV2();

async function run() {
  const context = await groundingService.fetchContext({
    company: 'google',
    role: 'SDE',
    difficulty: 'medium',
    stage: 'technical',
    interviewType: 'dsa',
    missingAreas: ['complexity analysis', 'edge cases'],
    resumeContext: {
      coreSkills: ['distributed systems', 'javascript'],
    },
    limit: 4,
  });

  assert.ok(Array.isArray(context.retrievedQuestions), 'retrievedQuestions should be an array');
  assert.ok(Array.isArray(context.retrievedExamples), 'retrievedExamples should be an array');
  assert.ok(Array.isArray(context.hintPatterns), 'hintPatterns should be an array');
  assert.ok(context.retrievedQuestions.length > 0, 'retrievedQuestions should not be empty for known company');
  assert.ok(typeof context.retrievalLatencyMs === 'number', 'retrievalLatencyMs should be numeric');
  assert.ok(typeof context.count === 'number', 'count should be numeric for client telemetry');
  assert.ok(typeof context.provider === 'string', 'provider should be included for observability');
  assert.ok(
    context.retrievedQuestions.every((item) => typeof item?.question === 'string' && item.question.length > 0),
    'Each retrieved question should include non-empty question text',
  );

  const emptySafe = await groundingService.fetchContext({
    company: 'unknown-company',
    role: 'SDE',
    stage: 'technical',
    limit: 3,
  });

  assert.ok(Array.isArray(emptySafe.retrievedQuestions), 'fallback retrievedQuestions should be an array');
  assert.ok(Array.isArray(emptySafe.retrievedExamples), 'fallback retrievedExamples should be an array');
  assert.ok(Array.isArray(emptySafe.hintPatterns), 'fallback hintPatterns should be an array');
  assert.ok(typeof emptySafe.retrievalLatencyMs === 'number', 'fallback retrievalLatencyMs should be numeric');
  assert.ok(typeof emptySafe.count === 'number', 'fallback count should be numeric');

  console.log('Interview grounding tests passed');
}

run().catch((error) => {
  console.error('Interview grounding tests failed:', error.message);
  process.exit(1);
});
