import { describe, it, expect } from 'vitest';
import {
  executeCode,
  execFileAsync,
  SANDBOX_MAX_BUFFER,
  DEFAULT_EXEC_TIMEOUT_MS,
  DEFAULT_COMPILE_TIMEOUT_MS,
  MAX_EXEC_TIMEOUT_MS,
  clampMaxBuffer,
  clampTimeout,
} from '../../utils/executeCode.js';

describe('Track B: Asynchronous Sandboxed Code Execution Suite', () => {
  describe('1. Bounded Buffers & Safe Timeouts Clamping', () => {
    it('clamps invalid or negative maxBuffer to SANDBOX_MAX_BUFFER', () => {
      expect(clampMaxBuffer(null)).toBe(SANDBOX_MAX_BUFFER);
      expect(clampMaxBuffer(-100)).toBe(SANDBOX_MAX_BUFFER);
      expect(clampMaxBuffer('invalid')).toBe(SANDBOX_MAX_BUFFER);
      expect(clampMaxBuffer(10 * 1024 * 1024)).toBe(SANDBOX_MAX_BUFFER); // bounded to 5MB max
      expect(clampMaxBuffer(1024)).toBe(1024);
    });

    it('clamps invalid or excessive timeouts to safe bounds', () => {
      expect(clampTimeout(null)).toBe(DEFAULT_EXEC_TIMEOUT_MS);
      expect(clampTimeout(-50)).toBe(DEFAULT_EXEC_TIMEOUT_MS);
      expect(clampTimeout('abc')).toBe(DEFAULT_EXEC_TIMEOUT_MS);
      expect(clampTimeout(999999)).toBe(MAX_EXEC_TIMEOUT_MS); // clamped to 30000ms max
      expect(clampTimeout(2000)).toBe(2000);
    });
  });

  describe('2. Non-blocking Asynchronous Execution & Concurrency', () => {
    it('executes multiple sandbox tasks concurrently without blocking event loop', async () => {
      const start = Date.now();
      const code1 = 'setTimeout(() => console.log("Task1"), 100);';
      const code2 = 'setTimeout(() => console.log("Task2"), 100);';
      const code3 = 'setTimeout(() => console.log("Task3"), 100);';

      // Run all 3 concurrently
      const results = await Promise.all([
        executeCode(code1, 'javascript'),
        executeCode(code2, 'javascript'),
        executeCode(code3, 'javascript'),
      ]);

      const elapsed = Date.now() - start;
      expect(results.every((r) => r.success)).toBe(true);
      expect(results[0].output).toBe('Task1');
      expect(results[1].output).toBe('Task2');
      expect(results[2].output).toBe('Task3');

      // If synchronous/blocking, 3 sequential 100ms + process overhead would take significantly longer.
      // With asynchronous child processes, all 3 run in parallel.
      expect(elapsed).toBeLessThan(3500);
    });
  });

  describe('3. AbortController Cancellation', () => {
    it('aborts an in-flight JavaScript execution via AbortController signal', async () => {
      const controller = new AbortController();
      const infiniteLoop = 'let i = 0; while(true) { i++; }';

      const execPromise = executeCode(infiniteLoop, 'javascript', '', {
        signal: controller.signal,
        timeout: 10000,
      });

      // Abort after 300ms
      setTimeout(() => {
        controller.abort(new Error('User cancelled execution'));
      }, 300);

      const start = Date.now();
      const result = await execPromise;
      const duration = Date.now() - start;

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/abort|cancel/i);
      expect(duration).toBeLessThan(2000); // Exits promptly on abort without waiting for 10s timeout
    });

    it('rejects immediately when an already-aborted signal is provided', async () => {
      const controller = new AbortController();
      controller.abort(new Error('Pre-aborted test'));

      const result = await executeCode('console.log("Never runs");', 'javascript', '', {
        signal: controller.signal,
      });

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/aborted|cancelled/i);
      expect(result.executionTime).toBe(0);
    });

    it('supports AbortController directly in execFileAsync', async () => {
      const controller = new AbortController();
      const promise = execFileAsync('node', ['-e', 'setInterval(() => {}, 1000)'], {
        signal: controller.signal,
        timeout: 5000,
      });

      setTimeout(() => {
        controller.abort();
      }, 200);

      await expect(promise).rejects.toThrow();
    });
  });

  describe('4. Bounded Output & Error Handling', () => {
    it('enforces bounded maxBuffer on excessive output', async () => {
      // Small maxBuffer of 1024 bytes
      const result = await executeCode(
        'console.log("X".repeat(5000));',
        'javascript',
        '',
        { maxBuffer: 1024 }
      );

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/maxBuffer|buffer/i);
    });

    it('captures syntax errors safely without crashing', async () => {
      const result = await executeCode('const x = ;', 'javascript');
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/SyntaxError|Unexpected token/i);
    });

    it('enforces execution timeout when code loops infinitely without external abort', async () => {
      const start = Date.now();
      const result = await executeCode('while(true) {}', 'javascript', '', {
        timeout: 1000,
      });
      const duration = Date.now() - start;

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/timed out|timeout/i);
      expect(duration).toBeGreaterThanOrEqual(900);
      expect(duration).toBeLessThan(4000);
    });
  });
});
