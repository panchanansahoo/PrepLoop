/**
 * stepThroughDebugger.js
 * 
 * Step-through debugging system for code execution.
 * Provides:
 * - Breakpoint management (line-based and conditional)
 * - Step-forward, step-backward, step-over, step-into
 * - Variable inspection at each breakpoint
 * - Call stack tracking
 * - Execution timeline navigation
 */

/**
 * Breakpoint
 * @typedef {Object} Breakpoint
 * @property {string} id - Unique breakpoint ID
 * @property {number} lineNumber - Line where breakpoint is set (1-indexed)
 * @property {string} condition - Optional condition expression (e.g., 'x > 5')
 * @property {boolean} enabled - Is breakpoint active
 * @property {number} hitCount - How many times breakpoint was hit
 */

/**
 * Debug Frame
 * @typedef {Object} DebugFrame
 * @property {number} frameId - Frame index in call stack
 * @property {string} functionName - Name of function
 * @property {number} lineNumber - Current line number
 * @property {Object} locals - Local variables in this frame
 * @property {Object} globals - Global variables accessible from this frame
 */

/**
 * Execution Context
 * @typedef {Object} ExecutionContext
 * @property {number} stepNumber - Current step in execution
 * @property {Array<DebugFrame>} callStack - Call stack
 * @property {Object} variables - All variables in scope
 * @property {string} lastStatement - Last executed statement
 */

class StepThroughDebugger {
  constructor(options = {}) {
    this.options = options;
    this.breakpoints = new Map(); // Map<lineNumber, Breakpoint[]>
    this.breakpointId = 0;
    this.executionSteps = [];
    this.currentStep = 0;
    this.callStack = [];
    this.variables = {};
  }

  /**
   * Add a breakpoint at a specific line
   * @param {number} lineNumber - Line number (1-indexed)
   * @param {string} condition - Optional condition
   * @returns {string} Breakpoint ID
   */
  addBreakpoint(lineNumber, condition = null) {
    const bp = {
      id: `bp_${this.breakpointId++}`,
      lineNumber,
      condition,
      enabled: true,
      hitCount: 0,
    };

    if (!this.breakpoints.has(lineNumber)) {
      this.breakpoints.set(lineNumber, []);
    }

    this.breakpoints.get(lineNumber).push(bp);
    return bp.id;
  }

  /**
   * Remove a breakpoint by ID
   * @param {string} breakpointId - Breakpoint ID
   * @returns {boolean} Whether removal was successful
   */
  removeBreakpoint(breakpointId) {
    for (const [lineNum, bps] of this.breakpoints.entries()) {
      const idx = bps.findIndex(bp => bp.id === breakpointId);
      if (idx !== -1) {
        bps.splice(idx, 1);
        if (bps.length === 0) {
          this.breakpoints.delete(lineNum);
        }
        return true;
      }
    }
    return false;
  }

  /**
   * Enable/disable a breakpoint
   * @param {string} breakpointId - Breakpoint ID
   * @param {boolean} enabled - Enable state
   */
  setBreakpointEnabled(breakpointId, enabled) {
    for (const bps of this.breakpoints.values()) {
      const bp = bps.find(b => b.id === breakpointId);
      if (bp) {
        bp.enabled = enabled;
        return;
      }
    }
  }

  /**
   * Get all breakpoints
   * @returns {Array<Breakpoint>}
   */
  getBreakpoints() {
    const all = [];
    for (const bps of this.breakpoints.values()) {
      all.push(...bps);
    }
    return all;
  }

  /**
   * Check if breakpoint should trigger at line
   * @param {number} lineNumber - Line to check
   * @param {Object} variables - Current variables
   * @returns {Array<Breakpoint>} Triggered breakpoints
   */
  checkBreakpoints(lineNumber, variables = {}) {
    const bps = this.breakpoints.get(lineNumber) || [];
    const triggered = [];

    for (const bp of bps) {
      if (!bp.enabled) continue;

      // Check condition if present
      if (bp.condition) {
        try {
          const condResult = this._evaluateCondition(bp.condition, variables);
          if (!condResult) continue;
        } catch (error) {
          // Condition error, skip
          continue;
        }
      }

      bp.hitCount++;
      triggered.push(bp);
    }

    return triggered;
  }

  /**
   * Evaluate a condition expression
   * @private
   */
  _evaluateCondition(condition, variables) {
    // Simple evaluation: create a function that checks the condition
    // In production, would use a proper expression parser
    try {
      const func = new Function(...Object.keys(variables), `return ${condition}`);
      return func(...Object.values(variables));
    } catch (error) {
      return false;
    }
  }

  /**
   * Record execution step
   * @param {Object} context - Execution context
   */
  recordStep(context) {
    this.executionSteps.push({
      stepNumber: this.executionSteps.length,
      ...context,
      timestamp: Date.now(),
    });
  }

  /**
   * Step forward to next breakpoint or step
   * @returns {Object} New execution context
   */
  stepForward() {
    if (this.currentStep < this.executionSteps.length - 1) {
      this.currentStep++;
      return this.getCurrentContext();
    }
    return null;
  }

  /**
   * Step backward to previous step
   * @returns {Object} Previous execution context
   */
  stepBackward() {
    if (this.currentStep > 0) {
      this.currentStep--;
      return this.getCurrentContext();
    }
    return null;
  }

  /**
   * Continue execution until breakpoint or end
   * @returns {Object} Execution context at breakpoint or end
   */
  continue() {
    // Move to next unbreakpoint step or end
    while (this.currentStep < this.executionSteps.length - 1) {
      this.currentStep++;
      const ctx = this.getCurrentContext();

      // Check if at a breakpoint
      if (this._isAtBreakpoint(ctx)) {
        return ctx;
      }
    }

    return this.getCurrentContext();
  }

  /**
   * Get current execution context
   * @returns {Object} Current context
   */
  getCurrentContext() {
    return this.executionSteps[this.currentStep] || null;
  }

  /**
   * Jump to specific step
   * @param {number} stepNumber - Step to jump to
   * @returns {Object} Context at that step
   */
  jumpToStep(stepNumber) {
    if (stepNumber >= 0 && stepNumber < this.executionSteps.length) {
      this.currentStep = stepNumber;
      return this.getCurrentContext();
    }
    return null;
  }

  /**
   * Get variable value at current step
   * @param {string} variableName - Variable name
   * @returns {*} Variable value
   */
  getVariableAtCurrentStep(variableName) {
    const ctx = this.getCurrentContext();
    if (ctx && ctx.variables) {
      return ctx.variables[variableName];
    }
    return undefined;
  }

  /**
   * Get call stack at current step
   * @returns {Array<DebugFrame>}
   */
  getCallStackAtCurrentStep() {
    const ctx = this.getCurrentContext();
    return ctx ? ctx.callStack || [] : [];
  }

  /**
   * Get all locals in top frame
   * @returns {Object}
   */
  getLocalsInCurrentFrame() {
    const callStack = this.getCallStackAtCurrentStep();
    return callStack.length > 0 ? callStack[0].locals : {};
  }

  /**
   * Get execution timeline for UI
   * @param {Object} options - {maxSteps?: number}
   * @returns {Array} Timeline entries with key info
   */
  getExecutionTimeline(options = {}) {
    const { maxSteps = 100 } = options;
    const steps = Math.min(this.executionSteps.length, maxSteps);

    const timeline = [];
    for (let i = 0; i < steps; i++) {
      const step = this.executionSteps[i];
      timeline.push({
        stepNumber: i,
        lineNumber: step.lineNumber,
        functionName: step.functionName,
        isBreakpoint: this._isBreakpointAtStep(step),
        isCurrent: i === this.currentStep,
        timestamp: step.timestamp,
      });
    }

    return timeline;
  }

  /**
   * Get variable history for specific variable
   * @param {string} variableName - Variable to track
   * @returns {Array} History of values {stepNumber, value, timestamp}
   */
  getVariableHistory(variableName) {
    const history = [];

    for (let i = 0; i < this.executionSteps.length; i++) {
      const step = this.executionSteps[i];
      if (step.variables && variableName in step.variables) {
        history.push({
          stepNumber: i,
          value: step.variables[variableName],
          timestamp: step.timestamp,
        });
      }
    }

    return history;
  }

  /**
   * Check if current position is at a breakpoint
   * @private
   */
  _isAtBreakpoint(context) {
    if (!context) return false;

    const bps = this.breakpoints.get(context.lineNumber) || [];
    return bps.some(bp => bp.enabled);
  }

  /**
   * Check if step is at a breakpoint
   * @private
   */
  _isBreakpointAtStep(step) {
    return this.breakpoints.has(step.lineNumber);
  }

  /**
   * Get debug state summary
   * @returns {Object} Summary of current debug state
   */
  getDebugState() {
    const ctx = this.getCurrentContext();
    return {
      currentStep: this.currentStep,
      totalSteps: this.executionSteps.length,
      currentContext: ctx,
      breakpointCount: this.getBreakpoints().length,
      callStackDepth: ctx ? ctx.callStack.length : 0,
      variables: ctx ? ctx.variables : {},
    };
  }

  /**
   * Set variable value at current step (for conditional modification)
   * @param {string} variableName - Variable to modify
   * @param {*} value - New value
   * @returns {boolean} Success
   */
  modifyVariableAtStep(variableName, value) {
    const ctx = this.getCurrentContext();
    if (ctx && ctx.variables) {
      ctx.variables[variableName] = value;
      return true;
    }
    return false;
  }

  /**
   * Export debug session for later analysis
   * @returns {Object} Complete debug session
   */
  exportSession() {
    return {
      steps: this.executionSteps,
      breakpoints: this.getBreakpoints(),
      currentStep: this.currentStep,
      totalSteps: this.executionSteps.length,
    };
  }
}

export default StepThroughDebugger;
