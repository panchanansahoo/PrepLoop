import assert from 'node:assert/strict';
import { InterviewSimulatorService } from '../services/aiService.js';
import { InterviewOrchestratorService } from '../services/interviewOrchestrator.js';
import { InterviewStateMachineService } from '../services/interviewStateMachine.js';

function run() {
  const stateMachinePlan = InterviewStateMachineService.buildStagePlan('dsa');
  assert.ok(Array.isArray(stateMachinePlan), 'State machine stage plan should be an array');
  assert.equal(stateMachinePlan[0].key, 'intake', 'State machine plan should start at intake');

  const initialState = InterviewStateMachineService.createInitialState('dsa', 'medium', 'Google');
  assert.equal(initialState.transitionReason, 'session_initialized', 'Initial state should carry initialization reason');
  assert.ok(Array.isArray(initialState.stageHistory), 'Initial state should include stage history');
  assert.equal(initialState.stageHistory.length, 1, 'Initial stage history should include intake entry');

  const orchestratorPlan = InterviewOrchestratorService.buildStagePlan('dsa');
  assert.ok(Array.isArray(orchestratorPlan), 'Orchestrator stage plan should be an array');
  assert.equal(orchestratorPlan[0].key, 'intake', 'Orchestrator plan should start at intake');
  assert.ok(
    orchestratorPlan.every((stage) => typeof stage?.key === 'string' && typeof stage?.label === 'string'),
    'Orchestrator stage plan should expose key/label objects',
  );

  const dsaPlan = InterviewSimulatorService._buildStagePlan('dsa');

  assert.ok(Array.isArray(dsaPlan), 'Stage plan should be an array');
  assert.ok(dsaPlan.length >= 5, 'Stage plan should contain realistic interview stages');
  assert.equal(dsaPlan[0].key, 'intake', 'First stage must be intake');
  assert.ok(
    dsaPlan.some((stage) => stage.key === 'followup') && dsaPlan.some((stage) => stage.key === 'challenge'),
    'Stage plan should include followup and challenge stages',
  );

  const intakeState = InterviewSimulatorService._buildInitialInterviewState('dsa', 'medium', 'Google');
  assert.equal(intakeState.stage, 'intake', 'Initial state should begin at intake stage');
  assert.equal(intakeState.stageIndex, 0, 'Initial stage index should be zero');

  const warmupState = InterviewSimulatorService._advanceInterviewStage({
    ...intakeState,
    turns: 1,
  });
  assert.equal(warmupState.stage, 'warmup', 'State should move to warmup after intro turn');
  assert.equal(warmupState.transitionReason, 'post_intake_transition', 'Warmup transition should include reason');

  const technicalState = InterviewSimulatorService._advanceInterviewStage({
    ...warmupState,
    turns: 3,
  });
  assert.equal(technicalState.stage, 'technical', 'State should move to technical stage');
  assert.equal(technicalState.transitionReason, 'turn_threshold_technical', 'Technical transition should include reason');

  const followupState = InterviewSimulatorService._advanceInterviewStage({
    ...technicalState,
    turns: 7,
  });
  assert.equal(followupState.stage, 'followup', 'State should move to followup stage');

  const challengeState = InterviewSimulatorService._advanceInterviewStage({
    ...followupState,
    turns: 10,
  });
  assert.equal(challengeState.stage, 'challenge', 'State should move to challenge stage');

  const feedbackState = InterviewSimulatorService._advanceInterviewStage({
    ...challengeState,
    turns: 12,
    stage: 'challenge',
    stageIndex: dsaPlan.findIndex((stage) => stage.key === 'challenge'),
  });

  assert.equal(feedbackState.stage, 'feedback', 'State should eventually move to feedback stage');
  assert.equal(feedbackState.transitionReason, 'final_turn_threshold', 'Feedback transition should include reason');
  assert.ok(typeof feedbackState.stageLabel === 'string', 'Feedback state should include stageLabel');
  assert.ok(Array.isArray(feedbackState.stagePlan), 'State should include full stagePlan for clients');
  assert.ok(Array.isArray(feedbackState.stageHistory), 'State should include stageHistory for transition tracking');
  assert.ok(feedbackState.stageHistory.length >= 5, 'stageHistory should track stage progression');

  console.log('Interview orchestration stage tests passed');
}

run();