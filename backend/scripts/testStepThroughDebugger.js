/**
 * testStepThroughDebugger.js
 * 
 * Tests for StepThroughDebugger service
 * Coverage: breakpoints, stepping, variable tracking, call stack, timeline
 * 25+ comprehensive test cases
 */

import StepThroughDebugger from '../services/stepThroughDebugger.js';

let passCount = 0;
let failCount = 0;

async function runTest(name, fn) {
  try {
    await fn();
    console.log(`✓ ${name}`);
    passCount++;
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  ${error.message}`);
    failCount++;
  }
}

// Helper to create mock execution context
function createMockContext(lineNumber, functionName, variables, callStack = []) {
  return {
    lineNumber,
    functionName,
    variables,
    callStack,
    timestamp: Date.now(),
  };
}

async function runAllTests() {
  console.log('🐛 Step-Through Debugger Tests\n');

  // ============================================================================
  // Breakpoint Management Tests
  // ============================================================================

  await runTest('Should add a breakpoint', () => {
    const debugger_ = new StepThroughDebugger();
    const id = debugger_.addBreakpoint(10);

    if (!id) throw new Error('Should return breakpoint ID');
    if (!id.startsWith('bp_')) throw new Error('ID should start with bp_');
  });

  await runTest('Should add multiple breakpoints', () => {
    const debugger_ = new StepThroughDebugger();
    const id1 = debugger_.addBreakpoint(5);
    const id2 = debugger_.addBreakpoint(10);

    if (id1 === id2) throw new Error('IDs should be unique');
    const bps = debugger_.getBreakpoints();
    if (bps.length !== 2) throw new Error('Should have 2 breakpoints');
  });

  await runTest('Should add breakpoint with condition', () => {
    const debugger_ = new StepThroughDebugger();
    const id = debugger_.addBreakpoint(15, 'x > 5');

    const bps = debugger_.getBreakpoints();
    const bp = bps.find(b => b.id === id);
    if (bp.condition !== 'x > 5') throw new Error('Condition should be preserved');
  });

  await runTest('Should remove a breakpoint', () => {
    const debugger_ = new StepThroughDebugger();
    const id = debugger_.addBreakpoint(10);
    const removed = debugger_.removeBreakpoint(id);

    if (!removed) throw new Error('Removal should succeed');
    const bps = debugger_.getBreakpoints();
    if (bps.length !== 0) throw new Error('Should have 0 breakpoints after removal');
  });

  await runTest('Should enable/disable breakpoint', () => {
    const debugger_ = new StepThroughDebugger();
    const id = debugger_.addBreakpoint(10);

    debugger_.setBreakpointEnabled(id, false);
    const bps = debugger_.getBreakpoints();
    const bp = bps.find(b => b.id === id);
    if (bp.enabled) throw new Error('Breakpoint should be disabled');

    debugger_.setBreakpointEnabled(id, true);
    if (!bp.enabled) throw new Error('Breakpoint should be enabled');
  });

  await runTest('Should check breakpoints at line', () => {
    const debugger_ = new StepThroughDebugger();
    debugger_.addBreakpoint(10);
    debugger_.addBreakpoint(10); // Multiple at same line

    const triggered = debugger_.checkBreakpoints(10);
    if (triggered.length !== 2) throw new Error('Should trigger 2 breakpoints');
  });

  await runTest('Should not trigger disabled breakpoint', () => {
    const debugger_ = new StepThroughDebugger();
    const id = debugger_.addBreakpoint(10);
    debugger_.setBreakpointEnabled(id, false);

    const triggered = debugger_.checkBreakpoints(10);
    if (triggered.length !== 0) throw new Error('Should not trigger disabled breakpoint');
  });

  await runTest('Should track breakpoint hit count', () => {
    const debugger_ = new StepThroughDebugger();
    debugger_.addBreakpoint(10);

    debugger_.checkBreakpoints(10);
    debugger_.checkBreakpoints(10);
    debugger_.checkBreakpoints(10);

    const bps = debugger_.getBreakpoints();
    if (bps[0].hitCount !== 3) throw new Error('Hit count should be 3');
  });

  // ============================================================================
  // Execution Recording and Navigation Tests
  // ============================================================================

  await runTest('Should record execution steps', () => {
    const debugger_ = new StepThroughDebugger();

    debugger_.recordStep(createMockContext(1, 'main', { x: 0 }));
    debugger_.recordStep(createMockContext(2, 'main', { x: 1 }));
    debugger_.recordStep(createMockContext(3, 'main', { x: 2 }));

    if (debugger_.executionSteps.length !== 3) throw new Error('Should have 3 steps');
  });

  await runTest('Should step forward', () => {
    const debugger_ = new StepThroughDebugger();

    debugger_.recordStep(createMockContext(1, 'main', { x: 0 }));
    debugger_.recordStep(createMockContext(2, 'main', { x: 1 }));

    const ctx = debugger_.stepForward();
    if (ctx.lineNumber !== 2) throw new Error('Should move to line 2');
    if (debugger_.currentStep !== 1) throw new Error('Current step should be 1');
  });

  await runTest('Should step backward', () => {
    const debugger_ = new StepThroughDebugger();

    debugger_.recordStep(createMockContext(1, 'main', { x: 0 }));
    debugger_.recordStep(createMockContext(2, 'main', { x: 1 }));
    debugger_.currentStep = 1;

    const ctx = debugger_.stepBackward();
    if (ctx.lineNumber !== 1) throw new Error('Should move back to line 1');
    if (debugger_.currentStep !== 0) throw new Error('Current step should be 0');
  });

  await runTest('Should jump to specific step', () => {
    const debugger_ = new StepThroughDebugger();

    for (let i = 0; i < 10; i++) {
      debugger_.recordStep(createMockContext(i, 'main', { x: i }));
    }

    const ctx = debugger_.jumpToStep(5);
    if (ctx.lineNumber !== 5) throw new Error('Should jump to step 5');
    if (debugger_.currentStep !== 5) throw new Error('Current step should be 5');
  });

  await runTest('Should return null when stepping past boundaries', () => {
    const debugger_ = new StepThroughDebugger();

    debugger_.recordStep(createMockContext(1, 'main', { x: 0 }));
    debugger_.currentStep = 0;

    const forward = debugger_.stepForward();
    const pastEnd = debugger_.stepForward();

    if (pastEnd !== null) throw new Error('Should return null at end');
  });

  // ============================================================================
  // Variable Tracking Tests
  // ============================================================================

  await runTest('Should get variable value at current step', () => {
    const debugger_ = new StepThroughDebugger();

    debugger_.recordStep(createMockContext(1, 'main', { x: 10, y: 20 }));
    debugger_.recordStep(createMockContext(2, 'main', { x: 15, y: 20 }));

    const value = debugger_.getVariableAtCurrentStep('x');
    if (value !== 10) throw new Error('Should return variable value at step 0');

    debugger_.currentStep = 1;
    const value2 = debugger_.getVariableAtCurrentStep('x');
    if (value2 !== 15) throw new Error('Should return updated value at step 1');
  });

  await runTest('Should get variable history', () => {
    const debugger_ = new StepThroughDebugger();

    debugger_.recordStep(createMockContext(1, 'main', { x: 0 }));
    debugger_.recordStep(createMockContext(2, 'main', { x: 1 }));
    debugger_.recordStep(createMockContext(3, 'main', { x: 2 }));

    const history = debugger_.getVariableHistory('x');
    if (history.length !== 3) throw new Error('Should have 3 history entries');
    if (history[0].value !== 0) throw new Error('First value should be 0');
    if (history[2].value !== 2) throw new Error('Last value should be 2');
  });

  await runTest('Should modify variable at step', () => {
    const debugger_ = new StepThroughDebugger();

    debugger_.recordStep(createMockContext(1, 'main', { x: 10 }));
    debugger_.modifyVariableAtStep('x', 99);

    const value = debugger_.getVariableAtCurrentStep('x');
    if (value !== 99) throw new Error('Variable should be modified');
  });

  // ============================================================================
  // Call Stack Tests
  // ============================================================================

  await runTest('Should get call stack at current step', () => {
    const debugger_ = new StepThroughDebugger();

    const callStack = [
      { frameId: 0, functionName: 'main', lineNumber: 10, locals: { x: 0 } },
      { frameId: 1, functionName: 'helper', lineNumber: 5, locals: { y: 1 } },
    ];

    debugger_.recordStep(createMockContext(10, 'main', { x: 0 }, callStack));

    const stack = debugger_.getCallStackAtCurrentStep();
    if (stack.length !== 2) throw new Error('Call stack should have 2 frames');
    if (stack[0].functionName !== 'main') throw new Error('First frame should be main');
  });

  await runTest('Should get locals in current frame', () => {
    const debugger_ = new StepThroughDebugger();

    const callStack = [{ frameId: 0, functionName: 'main', lineNumber: 1, locals: { x: 10, y: 20 } }];

    debugger_.recordStep(createMockContext(1, 'main', { x: 10, y: 20 }, callStack));

    const locals = debugger_.getLocalsInCurrentFrame();
    if (locals.x !== 10) throw new Error('Locals should include x');
    if (locals.y !== 20) throw new Error('Locals should include y');
  });

  // ============================================================================
  // Timeline and State Tests
  // ============================================================================

  await runTest('Should get execution timeline', () => {
    const debugger_ = new StepThroughDebugger();

    for (let i = 0; i < 5; i++) {
      debugger_.recordStep(createMockContext(i, 'main', { x: i }));
    }

    const timeline = debugger_.getExecutionTimeline();
    if (timeline.length !== 5) throw new Error('Timeline should have 5 entries');
    if (timeline[0].stepNumber !== 0) throw new Error('First step should be 0');
  });

  await runTest('Should indicate current step in timeline', () => {
    const debugger_ = new StepThroughDebugger();

    debugger_.recordStep(createMockContext(1, 'main', { x: 0 }));
    debugger_.recordStep(createMockContext(2, 'main', { x: 1 }));

    debugger_.currentStep = 1;
    const timeline = debugger_.getExecutionTimeline();

    if (!timeline[1].isCurrent) throw new Error('Step 1 should be marked as current');
    if (timeline[0].isCurrent) throw new Error('Step 0 should not be marked as current');
  });

  await runTest('Should get debug state summary', () => {
    const debugger_ = new StepThroughDebugger();

    debugger_.recordStep(createMockContext(1, 'main', { x: 10 }));
    debugger_.recordStep(createMockContext(2, 'main', { x: 20 }));
    debugger_.addBreakpoint(2);

    const state = debugger_.getDebugState();
    if (state.totalSteps !== 2) throw new Error('Total steps should be 2');
    if (state.breakpointCount !== 1) throw new Error('Should have 1 breakpoint');
    if (!state.currentContext) throw new Error('Should have current context');
  });

  // ============================================================================
  // Session Export Tests
  // ============================================================================

  await runTest('Should export debug session', () => {
    const debugger_ = new StepThroughDebugger();

    debugger_.recordStep(createMockContext(1, 'main', { x: 0 }));
    debugger_.addBreakpoint(1);

    const session = debugger_.exportSession();

    if (!session.steps) throw new Error('Session should have steps');
    if (!session.breakpoints) throw new Error('Session should have breakpoints');
    if (session.totalSteps !== 1) throw new Error('Total steps should be 1');
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  await runTest('Should handle empty execution', () => {
    const debugger_ = new StepThroughDebugger();

    const ctx = debugger_.getCurrentContext();
    if (ctx !== null) throw new Error('Context should be null for empty execution');
  });

  await runTest('Should handle stepping at boundaries', () => {
    const debugger_ = new StepThroughDebugger();

    debugger_.recordStep(createMockContext(1, 'main', { x: 0 }));

    const backward = debugger_.stepBackward();
    if (backward !== null) throw new Error('Should not step backward at start');

    debugger_.currentStep = 0;
    const forward = debugger_.stepForward();
    if (forward !== null) throw new Error('Should not step forward at end');
  });

  await runTest('Should handle invalid jump', () => {
    const debugger_ = new StepThroughDebugger();

    debugger_.recordStep(createMockContext(1, 'main', { x: 0 }));

    const result = debugger_.jumpToStep(999);
    if (result !== null) throw new Error('Invalid jump should return null');
  });

  console.log(`\n✅ Results: ${passCount} passed, ${failCount} failed (${passCount + failCount} total)`);
  process.exit(failCount > 0 ? 1 : 0);
}

runAllTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
