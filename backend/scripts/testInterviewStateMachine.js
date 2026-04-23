import assert from 'node:assert/strict';
import { InterviewStateMachineService } from '../services/interviewStateMachine.js';

function run() {
  // ── Stage Plan Tests ────────────────────────────────────────────────
  const dsaPlan = InterviewStateMachineService.buildStagePlan('dsa');
  assert.ok(Array.isArray(dsaPlan), 'DSA plan should be an array');
  assert.equal(dsaPlan[0].key, 'intake');

  const behavioralPlan = InterviewStateMachineService.buildStagePlan('behavioral');
  assert.equal(behavioralPlan[2].label, 'Story Deep-Dive', 'Behavioral should have Story Deep-Dive');

  // NEW: HR and System Design plans should exist
  const hrPlan = InterviewStateMachineService.buildStagePlan('hr');
  assert.ok(Array.isArray(hrPlan), 'HR plan should be an array');
  assert.ok(hrPlan.length >= 5, 'HR plan should have at least 5 stages');
  assert.ok(
    hrPlan.some(s => s.key === 'technical'),
    'HR plan should have a technical stage (mapped to Culture Fit)',
  );

  const sdPlan = InterviewStateMachineService.buildStagePlan('system_design');
  assert.ok(Array.isArray(sdPlan), 'System Design plan should be an array');
  assert.ok(
    sdPlan.some(s => s.label.toLowerCase().includes('architecture') || s.label.toLowerCase().includes('design')),
    'System Design plan should have architecture/design stage',
  );

  // ── Proportional Stage Transitions ──────────────────────────────────
  // 13-question interview: proportional thresholds
  const stateFor13 = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 13);
  assert.equal(stateFor13.stage, 'intake', 'Initial state should be intake');
  assert.equal(stateFor13.totalQuestions, 13, 'totalQuestions should be stored in state');

  // Turn 1 → warmup (8% of 13 ≈ 1)
  const warmup13 = InterviewStateMachineService.advanceState({ ...stateFor13, turns: 1 });
  assert.equal(warmup13.stage, 'warmup', '13Q: turn 1 → warmup');

  // Turn 3 → technical (23% of 13 ≈ 3)
  const tech13 = InterviewStateMachineService.advanceState({ ...warmup13, turns: 3 });
  assert.equal(tech13.stage, 'technical', '13Q: turn 3 → technical');

  // Turn 7 → followup (54% of 13 ≈ 7)
  const followup13 = InterviewStateMachineService.advanceState({ ...tech13, turns: 7 });
  assert.equal(followup13.stage, 'followup', '13Q: turn 7 → followup');

  // Turn 10 → challenge (77% of 13 ≈ 10)
  const challenge13 = InterviewStateMachineService.advanceState({ ...followup13, turns: 10 });
  assert.equal(challenge13.stage, 'challenge', '13Q: turn 10 → challenge');

  // Turn 12 → feedback (92% of 13 ≈ 12)
  const feedback13 = InterviewStateMachineService.advanceState({ ...challenge13, turns: 12 });
  assert.equal(feedback13.stage, 'feedback', '13Q: turn 12 → feedback');

  // ── 5-question interview: proportional thresholds compress stages ─────
  // In a 5Q interview, stages compress naturally:
  // Turn 0 (0%) → intake, Turn 1 (20%) → technical, Turn 3 (60%) → followup
  // Turn 4 (80%) → challenge, Turn 5 (100%) → feedback
  const stateFor5 = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 5);
  assert.equal(stateFor5.totalQuestions, 5, '5Q: totalQuestions stored');

  const tech5 = InterviewStateMachineService.advanceState({ ...stateFor5, turns: 1 });
  assert.equal(tech5.stage, 'technical', '5Q: turn 1 (20%) → technical (warmup compressed out)');

  const followup5 = InterviewStateMachineService.advanceState({ ...tech5, turns: 3 });
  assert.equal(followup5.stage, 'followup', '5Q: turn 3 (60%) → followup');

  const challenge5 = InterviewStateMachineService.advanceState({ ...followup5, turns: 4 });
  assert.equal(challenge5.stage, 'challenge', '5Q: turn 4 (80%) → challenge');

  const feedback5 = InterviewStateMachineService.advanceState({ ...challenge5, turns: 5 });
  assert.equal(feedback5.stage, 'feedback', '5Q: turn 5 (100%) → feedback');

  // ── Backward compatibility: no totalQuestions uses legacy thresholds ─
  const legacyState = InterviewStateMachineService.createInitialState('dsa', 'medium');
  const legacyTech = InterviewStateMachineService.advanceState({ ...legacyState, turns: 3 });
  assert.equal(legacyTech.stage, 'technical', 'Legacy: turn 3 → technical');

  const legacyFeedback = InterviewStateMachineService.advanceState({ ...legacyTech, turns: 12 });
  assert.equal(legacyFeedback.stage, 'feedback', 'Legacy: turn 12 → feedback');

  // ── Stage directives for new types ──────────────────────────────────
  const hrDirective = InterviewStateMachineService.buildStageDirective('technical', 'hr');
  assert.ok(typeof hrDirective === 'string' && hrDirective.length > 10, 'HR technical directive should exist');

  const sdDirective = InterviewStateMachineService.buildStageDirective('technical', 'system_design');
  assert.ok(typeof sdDirective === 'string', 'System Design technical directive should exist');

  console.log('✅ Interview state machine tests passed');
}

run();
