/**
 * phase2-execution-tracer.test.js
 * 
 * Comprehensive tests for ExecutionTracer service
 * Tests: variable capture, timeline extraction, mutation detection, statistics
 * Coverage: 30+ test cases
 */

import { describe, it, expect, beforeEach } from 'vitest';
import ExecutionTracer from '../services/executionTracer.js';

describe('ExecutionTracer - Phase 2.1', () => {
  let tracer;

  beforeEach(() => {
    tracer = new ExecutionTracer({
      maxSteps: 1000,
      maxArraySize: 100,
      maxObjectDepth: 5,
      timeout: 5000,
    });
  });

  // ============================================================================
  // Basic Tracing Tests
  // ============================================================================

  describe('Basic JavaScript Execution Tracing', () => {
    it('should trace simple variable assignments', async () => {
      const code = `
        let x = 5;
        let y = x + 10;
        y;
      `;
      const result = await tracer.trace(code, {}, { language: 'javascript' });

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      expect(result.totalSteps).toBeGreaterThan(0);
      expect(result.executionTime).toBeGreaterThan(0);
    });

    it('should capture array mutations', async () => {
      const code = `
        let arr = [1, 2, 3];
        arr.push(4);
        arr[0] = 10;
        arr;
      `;
      const result = await tracer.trace(code, {}, { language: 'javascript' });

      expect(result.success).toBe(true);
      expect(result.trace.length).toBeGreaterThan(0);
    });

    it('should handle input variables', async () => {
      const code = `
        let sum = arr.reduce((a, b) => a + b, 0);
        sum;
      `;
      const input = { arr: [1, 2, 3, 4, 5] };
      const result = await tracer.trace(code, input, { language: 'javascript' });

      expect(result.success).toBe(true);
      // Input should be available in initial scope
      expect(result.trace[0]?.variables || {}).toBeDefined();
    });

    it('should return final result', async () => {
      const code = `
        let result = 2 + 3;
        result;
      `;
      const result = await tracer.trace(code, {}, { language: 'javascript' });

      expect(result.finalResult).toBeDefined();
    });

    it('should capture execution errors', async () => {
      const code = `
        let x = undefined.foo;
      `;
      const result = await tracer.trace(code, {}, { language: 'javascript' });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // Function Tracing Tests
  // ============================================================================

  describe('Function Tracing', () => {
    it('should trace function execution', async () => {
      const code = `
        function fibonacci(n) {
          if (n <= 1) return n;
          return fibonacci(n - 1) + fibonacci(n - 2);
        }
        fibonacci(5);
      `;
      const result = await tracer.trace(code, {}, { language: 'javascript', functionName: 'fibonacci' });

      expect(result.success).toBe(true);
      expect(result.finalResult).toBeDefined();
      expect(result.totalSteps).toBeGreaterThan(0);
    });

    it('should handle function with array parameter', async () => {
      const code = `
        function sum(arr) {
          let total = 0;
          for (let i = 0; i < arr.length; i++) {
            total += arr[i];
          }
          return total;
        }
        sum([1, 2, 3, 4, 5]);
      `;
      const result = await tracer.trace(code, {}, { language: 'javascript', functionName: 'sum' });

      expect(result.success).toBe(true);
      expect(result.finalResult).toBe(15);
    });

    it('should track variable scope in nested functions', async () => {
      const code = `
        function outer(x) {
          function inner(y) {
            return x + y;
          }
          return inner(10);
        }
        outer(5);
      `;
      const result = await tracer.trace(code, {}, { language: 'javascript', functionName: 'outer' });

      expect(result.success).toBe(true);
      expect(result.finalResult).toBe(15);
    });
  });

  // ============================================================================
  // Timeout and Error Handling
  // ============================================================================

  describe('Timeout and Error Handling', () => {
    it('should handle infinite loops with timeout', async () => {
      const code = `
        while (true) {
          // infinite loop
        }
      `;
      const result = await tracer.trace(code, {}, { language: 'javascript' });

      // Should timeout
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should enforce max steps limit', async () => {
      const limiterTracer = new ExecutionTracer({ maxSteps: 10 });
      const code = `
        let count = 0;
        for (let i = 0; i < 100; i++) {
          count++;
        }
        count;
      `;
      const result = await limiterTracer.trace(code, {}, { language: 'javascript' });

      expect(result.totalSteps).toBeLessThanOrEqual(10);
    });

    it('should report syntax errors', async () => {
      const code = `
        let x = [
      `;
      const result = await tracer.trace(code, {}, { language: 'javascript' });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  // ============================================================================
  // Variable Sanitization Tests
  // ============================================================================

  describe('Variable Sanitization', () => {
    it('should sanitize large arrays', async () => {
      const largeArray = new Array(500).fill(0).map((_, i) => i);
      const code = `
        let arr = input;
        arr;
      `;
      const result = await tracer.trace(code, { input: largeArray }, { language: 'javascript' });

      expect(result.success).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('truncated'))).toBe(true);
    });

    it('should skip functions in variable capture', async () => {
      const code = `
        let fn = function() { return 42; };
        let x = 5;
        x;
      `;
      const result = await tracer.trace(code, {}, { language: 'javascript' });

      expect(result.success).toBe(true);
      // Function should be skipped during sanitization
      expect(typeof result.trace[0]?.variables?.fn).not.toBe('function');
    });

    it('should handle nested objects', async () => {
      const code = `
        let obj = {a: {b: {c: {d: {e: 42}}}}};
        obj;
      `;
      const result = await tracer.trace(code, {}, { language: 'javascript' });

      expect(result.success).toBe(true);
      expect(result.trace.length).toBeGreaterThan(0);
    });

    it('should handle null and undefined values', async () => {
      const code = `
        let x = null;
        let y = undefined;
        let z = 5;
        z;
      `;
      const result = await tracer.trace(code, {}, { language: 'javascript' });

      expect(result.success).toBe(true);
    });
  });

  // ============================================================================
  // Timeline Extraction Tests
  // ============================================================================

  describe('Timeline Extraction', () => {
    it('should filter trace by event type', async () => {
      const code = `
        let x = 5;
        let y = x + 10;
        console.log(y);
        let z = y * 2;
      `;
      const result = await tracer.trace(code, {}, { language: 'javascript' });

      const timeline = tracer.getTimeline(result, { types: ['assignment', 'log'] });
      expect(timeline).toBeDefined();
      expect(Array.isArray(timeline)).toBe(true);
    });

    it('should limit timeline events', async () => {
      const code = `
        let sum = 0;
        for (let i = 0; i < 100; i++) {
          sum += i;
        }
        sum;
      `;
      const result = await tracer.trace(code, {}, { language: 'javascript' });

      const timeline = tracer.getTimeline(result, { maxEvents: 5 });
      expect(timeline.length).toBeLessThanOrEqual(5);
    });

    it('should preserve trace order in timeline', async () => {
      const code = `
        let a = 1;
        let b = 2;
        let c = 3;
      `;
      const result = await tracer.trace(code, {}, { language: 'javascript' });

      const timeline = tracer.getTimeline(result, { maxEvents: 100 });
      
      // Timeline should be in chronological order
      for (let i = 1; i < timeline.length; i++) {
        expect(timeline[i].timestamp).toBeGreaterThanOrEqual(timeline[i - 1].timestamp);
      }
    });
  });

  // ============================================================================
  // State at Step Tests
  // ============================================================================

  describe('State Retrieval at Steps', () => {
    it('should return variable state at specific step', async () => {
      const code = `
        let x = 5;
        let y = x + 10;
        let z = y * 2;
      `;
      const result = await tracer.trace(code, {}, { language: 'javascript' });

      const state = tracer.getStateAtStep(result, 0);
      expect(state).toBeDefined();
      expect(typeof state).toBe('object');
    });

    it('should handle out-of-bounds step request', async () => {
      const code = `let x = 5;`;
      const result = await tracer.trace(code, {}, { language: 'javascript' });

      const state = tracer.getStateAtStep(result, 9999);
      expect(state).toEqual({});
    });

    it('should show progression of variable values across steps', async () => {
      const code = `
        let x = 0;
        x = 1;
        x = 2;
        x = 3;
      `;
      const result = await tracer.trace(code, {}, { language: 'javascript' });

      const states = [];
      for (let i = 0; i < Math.min(4, result.trace.length); i++) {
        states.push(tracer.getStateAtStep(result, i));
      }

      expect(states.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // Mutation Detection Tests
  // ============================================================================

  describe('Mutation Detection Between Steps', () => {
    it('should detect added variables', async () => {
      const code = `
        let a = 1;
        let b = 2;
      `;
      const result = await tracer.trace(code, {}, { language: 'javascript' });

      if (result.trace.length >= 2) {
        const mutations = tracer.getMutationsBetweenSteps(result, 0, 1);
        expect(mutations).toBeDefined();
        expect(mutations.added || mutations.changed).toBeDefined();
      }
    });

    it('should detect changed variables', async () => {
      const code = `
        let x = 5;
        x = 10;
      `;
      const result = await tracer.trace(code, {}, { language: 'javascript' });

      if (result.trace.length >= 2) {
        const mutations = tracer.getMutationsBetweenSteps(result, 0, 1);
        expect(mutations.changed || mutations.added).toBeDefined();
      }
    });

    it('should detect array element mutations', async () => {
      const code = `
        let arr = [1, 2, 3];
        arr[0] = 10;
      `;
      const result = await tracer.trace(code, {}, { language: 'javascript' });

      if (result.trace.length >= 2) {
        const mutations = tracer.getMutationsBetweenSteps(result, 0, 1);
        expect(mutations).toBeDefined();
      }
    });

    it('should structure mutations with from/to values', async () => {
      const code = `
        let count = 0;
        count = count + 1;
      `;
      const result = await tracer.trace(code, {}, { language: 'javascript' });

      if (result.trace.length >= 2) {
        const mutations = tracer.getMutationsBetweenSteps(result, 0, 1);
        expect(mutations).toHaveProperty('added');
        expect(mutations).toHaveProperty('removed');
        expect(mutations).toHaveProperty('changed');
      }
    });
  });

  // ============================================================================
  // Statistics Tests
  // ============================================================================

  describe('Trace Statistics', () => {
    it('should compute execution statistics', async () => {
      const code = `
        let x = 5;
        let y = x + 10;
        let z = y * 2;
      `;
      const result = await tracer.trace(code, {}, { language: 'javascript' });

      const stats = tracer.getStatistics(result);
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('totalSteps');
      expect(stats).toHaveProperty('eventTypes');
      expect(stats).toHaveProperty('avgTimeBetweenSteps');
      expect(stats).toHaveProperty('totalExecutionTime');
      expect(stats).toHaveProperty('success');
    });

    it('should count event types correctly', async () => {
      const code = `
        let a = 1;
        let b = 2;
        let c = a + b;
      `;
      const result = await tracer.trace(code, {}, { language: 'javascript' });

      const stats = tracer.getStatistics(result);
      expect(typeof stats.eventTypes).toBe('object');
    });

    it('should calculate average time between steps', async () => {
      const code = `
        let x = 0;
        x = 1;
        x = 2;
      `;
      const result = await tracer.trace(code, {}, { language: 'javascript' });

      const stats = tracer.getStatistics(result);
      const avgTime = parseFloat(stats.avgTimeBetweenSteps);
      
      expect(avgTime).toBeGreaterThanOrEqual(0);
      expect(isNaN(avgTime)).toBe(false);
    });

    it('should reflect success status in statistics', async () => {
      const code = `let x = 5;`;
      const result = await tracer.trace(code, {}, { language: 'javascript' });

      const stats = tracer.getStatistics(result);
      expect(stats.success).toBe(result.success);
    });
  });

  // ============================================================================
  // Real-World Algorithm Tracing
  // ============================================================================

  describe('Real-World Algorithm Tracing', () => {
    it('should trace binary search execution', async () => {
      const code = `
        function binarySearch(arr, target) {
          let left = 0;
          let right = arr.length - 1;
          
          while (left <= right) {
            let mid = Math.floor((left + right) / 2);
            if (arr[mid] === target) {
              return mid;
            } else if (arr[mid] < target) {
              left = mid + 1;
            } else {
              right = mid - 1;
            }
          }
          return -1;
        }
        binarySearch([1, 3, 5, 7, 9, 11, 13], 7);
      `;
      const result = await tracer.trace(code, {}, { language: 'javascript', functionName: 'binarySearch' });

      expect(result.success).toBe(true);
      expect(result.finalResult).toBe(3); // Index of 7
      expect(result.totalSteps).toBeGreaterThan(0);
    });

    it('should trace bubble sort with mutations', async () => {
      const code = `
        function bubbleSort(arr) {
          for (let i = 0; i < arr.length; i++) {
            for (let j = 0; j < arr.length - i - 1; j++) {
              if (arr[j] > arr[j + 1]) {
                let temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
              }
            }
          }
          return arr;
        }
        bubbleSort([3, 1, 4, 1, 5, 9, 2, 6]);
      `;
      const result = await tracer.trace(code, {}, { language: 'javascript', functionName: 'bubbleSort' });

      expect(result.success).toBe(true);
      expect(result.finalResult).toBeDefined();
      expect(result.totalSteps).toBeGreaterThan(0);
    });

    it('should trace tree traversal', async () => {
      const code = `
        function inorderTraversal(node, result = []) {
          if (node === null) return result;
          
          inorderTraversal(node.left, result);
          result.push(node.val);
          inorderTraversal(node.right, result);
          
          return result;
        }
        
        let tree = {
          val: 1,
          left: {val: 2, left: null, right: null},
          right: {val: 3, left: null, right: null}
        };
        
        inorderTraversal(tree);
      `;
      const result = await tracer.trace(code, {}, { language: 'javascript', functionName: 'inorderTraversal' });

      expect(result.success).toBe(true);
      expect(Array.isArray(result.finalResult)).toBe(true);
    });
  });

  // ============================================================================
  // Python Tracing (Placeholder)
  // ============================================================================

  describe('Python Tracing', () => {
    it('should report Python tracing as not yet implemented', async () => {
      const code = `
        def factorial(n):
          if n <= 1:
            return 1
          return n * factorial(n - 1)
        
        factorial(5)
      `;
      const result = await tracer.trace(code, {}, { language: 'python' });

      expect(result.success).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle empty code', async () => {
      const result = await tracer.trace('', {}, { language: 'javascript' });
      expect(result).toBeDefined();
    });

    it('should handle comment-only code', async () => {
      const code = `
        // This is a comment
        /* Multi-line comment */
      `;
      const result = await tracer.trace(code, {}, { language: 'javascript' });
      expect(result.success).toBe(true);
    });

    it('should handle recursive functions with deep call stacks', async () => {
      const code = `
        function deepRecursion(n) {
          if (n <= 0) return 0;
          return deepRecursion(n - 1) + 1;
        }
        deepRecursion(10);
      `;
      const result = await tracer.trace(code, {}, { language: 'javascript' });

      expect(result.success).toBe(true);
      expect(result.finalResult).toBe(10);
    });

    it('should handle complex data structures', async () => {
      const code = `
        let data = {
          users: [
            {id: 1, name: 'Alice', scores: [90, 85, 92]},
            {id: 2, name: 'Bob', scores: [78, 88, 91]}
          ]
        };
        data;
      `;
      const result = await tracer.trace(code, {}, { language: 'javascript' });

      expect(result.success).toBe(true);
    });
  });
});
