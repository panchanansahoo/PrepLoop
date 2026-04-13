import assert from 'node:assert/strict';
import { InterviewScoringService } from '../services/interviewScoringService.js';
import { InterviewFollowUpRulesService } from '../services/interviewFollowUpRules.js';

function run() {
  const analysis = {
    metrics: { communication: 78, problemDecomposition: 72, efficiency: 70 },
    score: 76,
    candidateStuck: false,
    nextFocus: ['edge cases'],
  };

  const transcript = [
    { role: 'candidate', text: 'I would use hashmap and linked list.' },
    { role: 'interviewer', text: 'What are trade-offs?' },
    { role: 'candidate', text: 'Time O(1), space O(n).' },
  ];

  const rolling = InterviewScoringService.calculateRollingScores(analysis, transcript, 'dsa');
  assert.ok(typeof rolling.overall === 'number', 'Rolling overall score should be numeric');
  assert.ok(rolling.overall >= 0 && rolling.overall <= 10, 'Rolling overall score should be 0-10');

  const adaptive = InterviewScoringService.deriveAdaptiveDifficulty('medium', rolling.overall, 4);
  assert.ok(typeof adaptive.newDifficulty === 'string', 'Adaptive difficulty result should include newDifficulty');

  const branch = InterviewFollowUpRulesService.decideBranch({
    analysis,
    interviewContext: {
      turns: 4,
      stage: 'technical',
      missingAreas: ['edge cases'],
    },
    candidateResponse: 'I think this works, but I am not fully sure about edge cases.',
  });

  assert.ok(typeof branch.branchReason === 'string', 'Branch result should include branchReason');
  assert.ok(typeof branch.nextAction === 'string', 'Branch result should include nextAction');
  assert.ok(Array.isArray(branch.missedConcepts), 'Branch result should include missedConcepts array');

  console.log('Interview scoring and follow-up rule tests passed');
}

run();
