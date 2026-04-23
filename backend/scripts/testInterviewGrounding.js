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
      title: 'Product-minded full stack engineer',
      coreSkills: ['distributed systems', 'javascript'],
      projectHighlights: 'built a realtime interview app | reduced latency by 35%',
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
  assert.equal(context.query.resumeHeadline, 'Product-minded full stack engineer', 'resume headline should be available in query metadata');
  assert.ok(Array.isArray(context.query.resumeSkills), 'resume skills should be normalized into query metadata');
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

  // ── Type-aware grounding tests ──────────────────────────────────────

  // Behavioral interview should get behavioral-stage fallbacks, not 'Technical'
  const behavGrounding = await groundingService.fetchContext({
    company: 'unknown-behavioral-co',
    role: 'SDE',
    difficulty: 'medium',
    stage: 'technical',
    interviewType: 'behavioral',
    missingAreas: ['STAR structure'],
    limit: 3,
  });
  assert.ok(Array.isArray(behavGrounding.retrievedQuestions), 'behavioral grounding should return questions');
  const behavFallbacks = behavGrounding.retrievedQuestions.filter(q => q.tags?.includes('fallback'));
  if (behavFallbacks.length > 0) {
    assert.equal(behavFallbacks[0].stage, 'Behavioral', `Behavioral fallback stage should be 'Behavioral', got ${behavFallbacks[0].stage}`);
    assert.equal(behavFallbacks[0].role, 'General', `Behavioral fallback role should be 'General', got ${behavFallbacks[0].role}`);
  }

  // HR interview fallbacks should use 'HR' stage and 'General' role
  const hrGrounding = await groundingService.fetchContext({
    company: 'unknown-hr-co',
    role: 'SDE',
    stage: 'intake',
    interviewType: 'hr',
    missingAreas: ['career motivation'],
    limit: 3,
  });
  const hrFallbacks = hrGrounding.retrievedQuestions.filter(q => q.tags?.includes('fallback'));
  if (hrFallbacks.length > 0) {
    assert.equal(hrFallbacks[0].stage, 'HR', `HR fallback stage should be 'HR', got ${hrFallbacks[0].stage}`);
    assert.equal(hrFallbacks[0].role, 'General', `HR fallback role should be 'General', got ${hrFallbacks[0].role}`);
  }

  // Behavioral missing area hints should resolve (STAR structure, quantified impact)
  assert.ok(
    behavGrounding.hintPatterns.some(h => /STAR|Situation/i.test(h)),
    `Behavioral hints should include STAR guidance, got: ${behavGrounding.hintPatterns.join(' | ')}`
  );

  console.log('Interview grounding tests passed');
}

run().catch((error) => {
  console.error('Interview grounding tests failed:', error.message);
  process.exit(1);
});
