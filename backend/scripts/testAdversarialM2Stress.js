import assert from 'node:assert/strict';
import {
  InterviewStateMachineService,
  normalizeScoreByDifficulty,
  areDifficultiesComparable,
  isTurnExcludedFromStreaks,
  isAdaptivePacingEnabled,
} from '../services/interviewStateMachine.js';

console.log('--- Starting Empirical Adversarial Stress Test Suite ---');

// Set feature flag
process.env.FEATURE_FLAG_ADAPTIVE_STATE_MACHINE = 'true';

// ── Test 1: 5 Consecutive 100s on Easy Questions ─────────────────────────────
console.log('Test 1: 5 consecutive 100 scores on easy questions...');
{
  let state = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 13);
  for (let turn = 1; turn <= 5; turn++) {
    state = InterviewStateMachineService.advanceState(
      { ...state, turns: turn },
      { score: 100, difficultyTier: 'easy' }
    );
    assert.equal(state.consecutiveHighScores, 0, `Turn ${turn}: Easy question MUST NOT increment high streak`);
    assert.notEqual(state.stage, 'challenge', `Turn ${turn}: Easy question MUST NOT trigger challenge stage`);
    assert.notEqual(state.transitionReason, 'sustained_high_scores_early_challenge', `Turn ${turn}: MUST NOT trigger early challenge reason`);
  }
  assert.equal(state.stage, 'technical', 'At turn 5 of 13, stage must be technical, not challenge');
  console.log('  -> PASS: 5 consecutive 100s on easy questions did NOT trigger challenge');
}

// ── Test 2: Alternating Easy (100) and Medium (90) ───────────────────────────
console.log('Test 2: Alternating easy (100) and medium (90)...');
{
  let state = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 13);

  // Turn 1: Medium (90) -> streak = 1
  state = InterviewStateMachineService.advanceState({ ...state, turns: 1 }, { score: 90, difficultyTier: 'medium' });
  assert.equal(state.consecutiveHighScores, 1, 'Medium 90 should set streak to 1');

  // Turn 2: Easy (100) -> streak MUST NOT increment
  state = InterviewStateMachineService.advanceState({ ...state, turns: 2 }, { score: 100, difficultyTier: 'easy' });
  assert.equal(state.consecutiveHighScores, 1, 'Easy 100 MUST NOT increment high streak');

  // Turn 3: Medium (90) -> streak = 2
  state = InterviewStateMachineService.advanceState({ ...state, turns: 3 }, { score: 90, difficultyTier: 'medium' });
  assert.equal(state.consecutiveHighScores, 2, 'Medium 90 should set streak to 2');

  // Turn 4: Easy (100) -> streak MUST NOT increment
  state = InterviewStateMachineService.advanceState({ ...state, turns: 4 }, { score: 100, difficultyTier: 'easy' });
  assert.equal(state.consecutiveHighScores, 2, 'Easy 100 MUST NOT increment high streak');

  // Turn 5: Easy (100) -> streak MUST NOT increment
  state = InterviewStateMachineService.advanceState({ ...state, turns: 5 }, { score: 100, difficultyTier: 'easy' });
  assert.equal(state.consecutiveHighScores, 2, 'Second consecutive easy 100 MUST NOT increment high streak');
  assert.notEqual(state.stage, 'challenge', 'MUST NOT advance to challenge');
  console.log('  -> PASS: Easy questions never incremented high score streak');
}

// ── Test 3: Non-Comparable Difficulty Low Scores (<40) ───────────────────────
console.log('Test 3: Non-comparable difficulty low scores (easy then staff_architectural)...');
{
  let state = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 13);

  // Turn 1: Easy (score 30) -> low streak = 1
  state = InterviewStateMachineService.advanceState({ ...state, turns: 1 }, { score: 30, difficultyTier: 'easy' });
  assert.equal(state.consecutiveLowScores, 1, 'Turn 1 easy low score should set low streak to 1');
  assert.equal(state.scaffoldingActive, false, 'No scaffolding at streak 1');
  assert.equal(state.skipChallenge, false, 'No skipChallenge at streak 1');

  // Turn 2: Staff Architectural (score 30) -> non-comparable (|0 - 3| = 3 > 1)
  state = InterviewStateMachineService.advanceState({ ...state, turns: 2 }, { score: 30, difficultyTier: 'staff_architectural' });
  assert.equal(state.consecutiveLowScores, 1, 'Low streak MUST reset to 1 due to non-comparable difficulty');
  assert.equal(state.scaffoldingActive, false, 'MUST NOT activate scaffolding for non-comparable difficulty');
  assert.equal(state.scaffoldingAction, 'NONE', 'scaffoldingAction must be NONE');
  assert.equal(state.shouldExtendTechnical, false, 'shouldExtendTechnical must be false');
  assert.equal(state.skipChallenge, false, 'skipChallenge must be false');
  console.log('  -> PASS: Non-comparable low scores did NOT trigger extension or scaffolding');
}

// ── Test 4: Turn Hygiene Injection (Clarifications and Skips) ────────────────
console.log('Test 4: Turn hygiene adversarial injection...');
{
  let state = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 13);

  // Establish streak of 2
  state = InterviewStateMachineService.advanceState({ ...state, turns: 1 }, { score: 35, difficultyTier: 'medium' });
  state = InterviewStateMachineService.advanceState({ ...state, turns: 2 }, { score: 30, difficultyTier: 'medium' });
  assert.equal(state.consecutiveLowScores, 2);
  assert.equal(state.scaffoldingActive, true);
  assert.equal(state.scaffoldingAction, 'BREAKDOWN_QUESTION');

  // 3 clarification turns
  state = InterviewStateMachineService.advanceState({ ...state, turns: 3 }, { answerType: 'clarification' });
  assert.equal(state.consecutiveLowScores, 2);
  state = InterviewStateMachineService.advanceState({ ...state, turns: 4 }, { isClarification: true });
  assert.equal(state.consecutiveLowScores, 2);
  state = InterviewStateMachineService.advanceState({ ...state, turns: 5 }, { turnType: 'clarification' });
  assert.equal(state.consecutiveLowScores, 2);

  // 2 skipped turns
  state = InterviewStateMachineService.advanceState({ ...state, turns: 6 }, { isSkipped: true });
  assert.equal(state.consecutiveLowScores, 2);
  state = InterviewStateMachineService.advanceState({ ...state, turns: 7 }, { answerType: 'skipped' });
  assert.equal(state.consecutiveLowScores, 2);

  // Verify scaffolding and skipChallenge remain intact
  assert.equal(state.scaffoldingActive, true, 'Scaffolding must remain active');
  assert.equal(state.scaffoldingAction, 'BREAKDOWN_QUESTION', 'Scaffolding action must remain BREAKDOWN_QUESTION');
  assert.equal(state.skipChallenge, true, 'skipChallenge must remain true');
  console.log('  -> PASS: Turn hygiene preserved streak of 2 across 3 clarifications and 2 skips');
}

// ── Test 5: Hard Budget Inviolability ─────────────────────────────────────────
console.log('Test 5: Hard budget ceiling inviolability under low-score pressure...');
{
  let state = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 6);
  for (let turn = 1; turn <= 6; turn++) {
    state = InterviewStateMachineService.advanceState(
      { ...state, turns: turn },
      { score: 10, difficultyTier: 'medium' }
    );
  }
  assert.equal(state.stage, 'feedback', 'At turns >= totalQuestions, stage must be feedback');
  assert.equal(state.isTerminated, true, 'isTerminated must be true');
  assert.equal(state.transitionReason, 'hard_turn_budget_ceiling_reached');
  assert.equal(state.scaffoldingActive, false, 'Scaffolding must be deactivated at termination');
  assert.equal(state.scaffoldingAction, 'NONE');
  console.log('  -> PASS: Hard budget ceiling terminated session at turn 6 of 6');
}

// ── Test 6: Frozen State Immutability ────────────────────────────────────────
console.log('Test 6: Object.freeze immutability...');
{
  const initialState = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 13);
  const frozenState = Object.freeze({
    ...initialState,
    stageHistory: Object.freeze([...initialState.stageHistory]),
  });

  const nextState = InterviewStateMachineService.advanceState(frozenState, { score: 90, difficultyTier: 'medium' });
  assert.equal(nextState.consecutiveHighScores, 1);
  assert.equal(frozenState.consecutiveHighScores, 0);
  console.log('  -> PASS: Frozen state was not mutated');
}

// ── Test 7: Score 0 Handling ────────────────────────────────────────────────
console.log('Test 7: Score 0 handling (falsy number)...');
{
  let state = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 13);
  state = InterviewStateMachineService.advanceState({ ...state, turns: 1 }, { score: 0, difficultyTier: 'medium' });
  assert.equal(state.consecutiveLowScores, 1, 'Score 0 must count as a low score (<40)');
  state = InterviewStateMachineService.advanceState({ ...state, turns: 2 }, { score: 0, difficultyTier: 'medium' });
  assert.equal(state.consecutiveLowScores, 2, 'Score 0 must increment low streak to 2');
  assert.equal(state.scaffoldingActive, true);
  console.log('  -> PASS: Score 0 correctly treated as valid low score');
}

// ── Test 8: Dynamic Feature Flag Off ─────────────────────────────────────────
console.log('Test 8: Dynamic feature flag toggle to OFF...');
{
  process.env.FEATURE_FLAG_ADAPTIVE_STATE_MACHINE = 'false';
  let state = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 13);
  state = InterviewStateMachineService.advanceState({ ...state, turns: 1 }, { score: 20, difficultyTier: 'medium' });
  state = InterviewStateMachineService.advanceState({ ...state, turns: 2 }, { score: 20, difficultyTier: 'medium' });
  assert.equal(state.scaffoldingActive, false, 'When flag is OFF, scaffolding must not activate');
  assert.equal(state.skipChallenge, false, 'When flag is OFF, skipChallenge must not activate');
  console.log('  -> PASS: Feature flag OFF restores baseline proportional behavior');
}

console.log('--- All Empirical Adversarial Tests Passed Successfully! ---');
