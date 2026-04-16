import assert from 'node:assert/strict';
import { InterviewGroundingServiceV2 } from '../services/interviewGroundingService.js';

async function run() {
  const service = new InterviewGroundingServiceV2();
  const context = await service.fetchContext({
    company: 'google',
    role: 'SDE',
    difficulty: 'medium',
    stage: 'technical',
    interviewType: 'dsa',
    missingAreas: ['complexity analysis'],
    resumeContext: {
      headline: 'Backend Engineer focused on systems design',
      skills: 'distributed systems,graphql',
    },
    limit: 4,
  });

  assert.ok(Array.isArray(context.retrievedQuestions), 'retrievedQuestions should be array');
  assert.ok(Array.isArray(context.retrievedExamples), 'retrievedExamples should be array');
  assert.ok(Array.isArray(context.hintPatterns), 'hintPatterns should be array');
  assert.ok(typeof context.provider === 'string', 'provider should be present');
  assert.ok(typeof context.retrievalLatencyMs === 'number', 'retrievalLatencyMs should be numeric');
  assert.equal(context.query.resumeHeadline, 'Backend Engineer focused on systems design', 'resume headline should be normalized into query metadata');
  assert.deepEqual(context.query.resumeSkills, ['distributed systems', 'graphql'], 'resume skills should be normalized into query metadata');

  const fallback = await service.fetchContext({
    company: 'unknown-company',
    role: 'SDE',
    stage: 'technical',
    interviewType: 'dsa',
    limit: 3,
  });

  assert.ok(Array.isArray(fallback.retrievedQuestions), 'fallback retrievedQuestions should be array');
  assert.ok(fallback.retrievedQuestions.length > 0, 'fallback should return non-empty question set');

  console.log('Interview grounding service tests passed');
}

run().catch((error) => {
  console.error('Interview grounding service tests failed:', error.message);
  process.exit(1);
});
