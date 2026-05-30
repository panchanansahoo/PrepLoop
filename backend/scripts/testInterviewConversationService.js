import assert from 'node:assert/strict';
import { InterviewPromptService } from '../services/interviewPromptService.js';
import { InterviewConversationService } from '../services/interviewConversationService.js';

function run() {
  const prompt = InterviewPromptService.buildFollowUpPrompt({
    problemStatement: 'Design an LRU cache.',
    transcript: [
      { role: 'interviewer', text: 'How would you design it?' },
      { role: 'candidate', text: 'I will use a hashmap.' },
    ],
    candidateResponse: 'I would use hashmap + doubly linked list.',
    interviewType: 'dsa',
    interviewContext: {
      turns: 2,
      stage: 'technical',
      missingAreas: ['edge cases'],
    },
    interviewMode: 'full_realtime',
    ragContext: {
      retrievedQuestions: [{ question: 'How do you evict least recently used key?' }],
      hintPatterns: ['Call out edge cases clearly.'],
    },
  });

  assert.ok(typeof prompt === 'string' && prompt.length > 0, 'Prompt should be non-empty string');
  assert.ok(prompt.includes('Current stage: technical'), 'Prompt should include stage context');

  const fallback = InterviewConversationService.buildFallbackFollowUp('full_realtime');
  assert.ok(typeof fallback.message === 'string' && fallback.message.length > 0, 'Fallback should include message');
  assert.ok(fallback.message.split(/\s+/).length <= 24, 'Realtime fallback should be concise');

  // ── Type-specific fallbacks ────────────────────────────────────────
  const behavioralFallback = InterviewConversationService.buildFallbackFollowUp('full_realtime', 'behavioral');
  assert.ok(behavioralFallback.message.includes('outcome'), 'Behavioral fallback should mention outcome');
  assert.ok(!behavioralFallback.message.includes('complexity'), 'Behavioral fallback should NOT mention complexity');

  const hrFallback = InterviewConversationService.buildFallbackFollowUp('full_realtime', 'hr');
  assert.ok(hrFallback.message.includes('direction'), 'HR fallback should explore candidate direction');

  const sysDesignFallback = InterviewConversationService.buildFallbackFollowUp('full_realtime', 'system-design');
  assert.ok(sysDesignFallback.message.includes('scale'), 'System design fallback should probe scaling');

  const dsaFallback = InterviewConversationService.buildFallbackFollowUp('full_realtime', 'dsa');
  assert.ok(dsaFallback.message.includes('complexity'), 'DSA fallback should probe complexity');

  // Unknown type defaults to DSA
  const unknownFallback = InterviewConversationService.buildFallbackFollowUp('full_realtime', 'unknown_type');
  assert.equal(unknownFallback.message, dsaFallback.message, 'Unknown type should default to DSA fallback');

  const parsed = InterviewConversationService.parseFollowUpContent('prefix {"message":"test","isFollowUp":true,"clarifications":[],"hints":[],"encouragement":"ok","continueInterview":true} suffix');
  assert.equal(parsed.message, 'test', 'Parser should extract JSON payload from mixed content');

  // ── Follow-up intelligence signals in prompt ───────────────────────
  const volatilePrompt = InterviewPromptService.buildFollowUpPrompt({
    problemStatement: 'Implement a linked list.',
    transcript: [
      { role: 'interviewer', text: 'Can you implement a linked list?' },
      { role: 'candidate', text: 'I will use a class with next pointers.' },
    ],
    candidateResponse: 'I can add and remove nodes.',
    interviewType: 'dsa',
    interviewContext: {
      turns: 5,
      stage: 'technical',
      missingAreas: [],
      adaptiveFollowUp: {
        nextAction: 'volatility_scaffold',
        improvementArc: 'stable',
        scoreTrend: { mean: 62, stdDev: 25, trend: 'stable', volatility: 'volatile', delta: -3 },
      },
    },
    interviewMode: 'full_realtime',
  });
  assert.ok(volatilePrompt.includes('ACTION:'), 'Volatile prompt should include ACTION directive');
  assert.ok(volatilePrompt.includes('sub-problems'), 'Volatile prompt should include scaffolding instruction');
  assert.ok(volatilePrompt.includes('Score volatility: HIGH'), 'Volatile prompt should include score volatility data');

  const improvingPrompt = InterviewPromptService.buildFollowUpPrompt({
    problemStatement: 'Explain REST vs GraphQL.',
    transcript: [
      { role: 'interviewer', text: 'Compare REST and GraphQL.' },
      { role: 'candidate', text: 'REST uses endpoints, GraphQL uses queries.' },
    ],
    candidateResponse: 'GraphQL has a single endpoint with flexible queries.',
    interviewType: 'system-design',
    interviewContext: {
      turns: 4,
      stage: 'technical',
      missingAreas: [],
      adaptiveFollowUp: {
        nextAction: 'deepen',
        improvementArc: 'improving',
        scoreTrend: { mean: 72, stdDev: 6, trend: 'improving', volatility: 'stable', delta: 15 },
      },
    },
    interviewMode: 'full_realtime',
  });
  assert.ok(improvingPrompt.includes('Score trend: IMPROVING'), 'Improving prompt should include trend signal');
  assert.ok(improvingPrompt.includes('Candidate trend: improving'), 'Improving prompt should show improvement arc');

  console.log('Interview conversation service tests passed');
}

run().catch((error) => {
  console.error('Interview conversation service tests failed:', error.message);
  process.exit(1);
});
