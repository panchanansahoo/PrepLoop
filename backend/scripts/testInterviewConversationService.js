import assert from 'node:assert/strict';
import { InterviewPromptService } from '../services/interviewPromptService.js';
import { InterviewConversationService } from '../services/interviewConversationService.js';

async function run() {
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

  const parsed = InterviewConversationService.parseFollowUpContent('prefix {"message":"test","isFollowUp":true,"clarifications":[],"hints":[],"encouragement":"ok","continueInterview":true} suffix');
  assert.equal(parsed.message, 'test', 'Parser should extract JSON payload from mixed content');

  console.log('Interview conversation service tests passed');
}

run().catch((error) => {
  console.error('Interview conversation service tests failed:', error.message);
  process.exit(1);
});
