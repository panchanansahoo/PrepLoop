/**
 * executionTracer.js
 * 
 * Captures execution traces for debugging and visualization.
 * Records execution state and provides timeline analysis.
 * 
 * Note: Full step-by-step tracing requires AST-based instrumentation (e.g., @babel/parser).
 * This implementation captures execution result and provides trace analysis utilities.
 */

import vm from 'vm';

/**
 * Execution trace entry (single step)
 * @typedef {Object} TraceEntry
 * @property {number} stepNumber - Sequential step index
 * @property {string} type - 'assignment' | 'function_call' | 'final_state' | 'log'
 * @property {Object} variables - Variable snapshot at this step
 * @property {number} timestamp - Milliseconds since trace start
 */

/**
 * Execution trace result
 * @typedef {Object} ExecutionTrace
 * @property {boolean} success - Whether execution completed without errors
 * @property {string} error - Error message if failed
 * @property {Array<TraceEntry>} trace - Array of execution steps
 * @property {number} totalSteps - Total number of steps captured
 * @property {number} executionTime - Total execution time in ms
 * @property {*} finalResult - Value returned by code
 * @property {Array} warnings - Collection warnings (large arrays, deep recursion, etc.)
 */

class ExecutionTracer {
  constructor(options = {}) {
    this.maxSteps = options.maxSteps || 10000;
    this.maxArraySize = options.maxArraySize || 1000;
    this.maxObjectDepth = options.maxObjectDepth || 5;
    this.timeout = options.timeout || 30000;
  }

  /**
   * Trace execution of code with input
   * @param {string} code - Code to execute
   * @param {Object} input - Input variables
   * @param {Object} options - {language: 'javascript'|'python', functionName?: string}
   * @returns {Promise<ExecutionTrace>}
   */
  async trace(code, input = {}, options = {}) {
    const { language = 'javascript' } = options;

    if (language === 'javascript') {
      return this._traceJavaScript(code, input);
    } else if (language === 'python') {
      return this._tracePython(code, input);
    } else {
      throw new Error(`Unsupported language for tracing: ${language}`);
    }
  }

  /**
   * Trace JavaScript execution
   * @private
   */
  async _traceJavaScript(code, input) {
    const warnings = [];
    const startTime = Date.now();

    try {
      // Create sandbox with input variables
      const sandbox = {
        ...input,
      };

      // Execute code
      const context = vm.createContext(sandbox);
      const script = new vm.Script(code, { timeout: this.timeout });
      const result = script.runInContext(context);

      // Capture final state
      const finalState = this._sanitizeVariables(sandbox, warnings);
      const trace = [
        {
          stepNumber: 0,
          type: 'final_state',
          timestamp: Date.now() - startTime,
          variables: finalState,
        },
      ];

      return {
        success: true,
        error: null,
        trace,
        totalSteps: 1,
        executionTime: Date.now() - startTime,
        finalResult: result,
        warnings,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        trace: [],
        totalSteps: 0,
        executionTime: Date.now() - startTime,
        finalResult: null,
        warnings,
      };
    }
  }

  /**
   * Trace Python execution (via transformation)
   * @private
   */
  async _tracePython(code, input, functionName) {
    const warnings = [];
    const startTime = Date.now();
    
    // Python tracing requires external instrumentation
    warnings.push('Python tracing requires server-side Python runtime with instrumentation');
    
    return {
      success: false,
      error: 'Python tracing not yet implemented - use Python pdb integration',
      trace: [],
      totalSteps: 0,
      executionTime: Date.now() - startTime,
      finalResult: null,
      warnings,
    };
  }

  /**
   * Sanitize variables for safe storage
   * @private
   */
  _sanitizeVariables(variables, warnings, depth = 0) {
    if (depth > this.maxObjectDepth) {
      return '[max depth reached]';
    }

    const sanitized = {};

    for (const [key, value] of Object.entries(variables)) {
      // Skip functions, symbols, undefined
      if (typeof value === 'function' || typeof value === 'symbol' || value === undefined) {
        continue;
      }

      if (Array.isArray(value)) {
        if (value.length > this.maxArraySize) {
          warnings.push(`Array '${key}' truncated from ${value.length} to ${this.maxArraySize} elements`);
          sanitized[key] = {
            __type: 'array',
            length: value.length,
            elements: value.slice(0, this.maxArraySize),
            truncated: true,
          };
        } else {
          sanitized[key] = value;
        }
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this._sanitizeVariables(value, warnings, depth + 1);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Extract trace timeline: filter trace to show only interesting events
   * Useful for visualization UI to show progress without noise
   * @param {ExecutionTrace} traceResult - Full trace result
   * @param {Object} options - {types?: Array, maxEvents?: number}
   * @returns {Array<TraceEntry>} Filtered trace
   */
  getTimeline(traceResult, options = {}) {
    const { types = ['assignment', 'function_call', 'log'], maxEvents = 100 } = options;

    let filtered = traceResult.trace.filter((entry) => types.includes(entry.type));

    if (filtered.length > maxEvents) {
      // Sample: show first, middle, and last events
      const step = Math.floor(filtered.length / maxEvents);
      filtered = filtered.filter((_, idx) => idx % step === 0 || idx === filtered.length - 1);
    }

    return filtered;
  }

  /**
   * Get variable state at a specific step
   * @param {ExecutionTrace} traceResult - Full trace result
   * @param {number} stepNumber - Step to get state for
   * @returns {Object} Variable state at that step
   */
  getStateAtStep(traceResult, stepNumber) {
    const entry = traceResult.trace[stepNumber];
    if (!entry) {
      return {};
    }
    return entry.variables || {};
  }

  /**
   * Highlight mutations between consecutive steps
   * Useful for visualization to show what changed
   * @param {ExecutionTrace} traceResult - Full trace result
   * @param {number} fromStep - Starting step
   * @param {number} toStep - Ending step
   * @returns {Object} Diff of variable changes
   */
  getMutationsBetweenSteps(traceResult, fromStep, toStep) {
    const fromState = this.getStateAtStep(traceResult, fromStep);
    const toState = this.getStateAtStep(traceResult, toStep);

    const mutations = {
      added: {},
      removed: {},
      changed: {},
    };

    // Find added and changed
    for (const [key, value] of Object.entries(toState)) {
      if (!(key in fromState)) {
        mutations.added[key] = value;
      } else if (JSON.stringify(fromState[key]) !== JSON.stringify(value)) {
        mutations.changed[key] = { from: fromState[key], to: value };
      }
    }

    // Find removed
    for (const key of Object.keys(fromState)) {
      if (!(key in toState)) {
        mutations.removed[key] = fromState[key];
      }
    }

    return mutations;
  }

  /**
   * Get summary statistics for trace
   * @param {ExecutionTrace} traceResult - Full trace result
   * @returns {Object} Statistics
   */
  getStatistics(traceResult) {
    const trace = traceResult.trace || [];
    const typeCounts = {};
    let avgTimeBetweenSteps = 0;

    trace.forEach((entry) => {
      typeCounts[entry.type] = (typeCounts[entry.type] || 0) + 1;
    });

    if (trace.length > 1) {
      const times = [];
      for (let i = 1; i < trace.length; i++) {
        times.push(trace[i].timestamp - trace[i - 1].timestamp);
      }
      avgTimeBetweenSteps = times.reduce((a, b) => a + b, 0) / times.length;
    }

    return {
      totalSteps: trace.length,
      eventTypes: typeCounts,
      avgTimeBetweenSteps: avgTimeBetweenSteps.toFixed(3),
      totalExecutionTime: traceResult.executionTime,
      success: traceResult.success,
    };
  }
}

export default ExecutionTracer;
