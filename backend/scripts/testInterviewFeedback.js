import assert from 'node:assert/strict';
import { normalizeInterviewFeedback } from '../utils/interviewFeedback.js';

const technicalFeedback = normalizeInterviewFeedback(
  {
    feedback: 'Great response!',
    strengths: ['Clear communication'],
    improvements: ['Add more specifics'],
    hint: 'Try breaking the problem into smaller parts',
  },
  {
    stage: 'Technical',
    question: 'How would you optimize this service for scale?',
    answer: 'I would improve it.',
  }
);

assert.match(technicalFeedback.feedback, /technical interview|implementation detail|trade-off/i);
assert.deepEqual(technicalFeedback.strengths, ['Clear communication']);
assert.deepEqual(technicalFeedback.improvements, ['Add more specifics']);
assert.match(technicalFeedback.hint, /implementation detail|trade-off|concrete example/i);

const behavioralFeedback = normalizeInterviewFeedback(
  { feedback: 'Nice', strengths: [], improvements: [], hint: '' },
  {
    stage: 'Behavioral',
    question: 'Tell me about a time you handled conflict on a team.',
    answer: 'I helped the team finish the project by talking through the issues.',
  }
);

assert.match(behavioralFeedback.feedback, /STAR|result|impact/i);
assert.ok(behavioralFeedback.strengths.length >= 1);
assert.ok(behavioralFeedback.improvements.length >= 1);
assert.match(behavioralFeedback.hint, /STAR|result|outcome/i);

console.log('Interview feedback normalization checks passed.');
