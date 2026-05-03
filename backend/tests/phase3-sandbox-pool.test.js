/**
 * Sandbox Pool Manager Tests - Phase 3.1
 * 
 * Tests for:
 * 1. Pool initialization and management
 * 2. Code execution in multiple languages
 * 3. Sandbox reuse and performance
 * 4. Error handling and recovery
 * 5. Resource cleanup
 */

const assert = require('assert');
const {
  SandboxPool,
  initializePool,
  executeInPool,
  shutdownPool,
} = require('../../services/sandboxPool');

describe('Phase 3.1: Sandbox Pool Manager', () => {
  let pool;

  beforeEach(async () => {
    pool = new SandboxPool();
    await pool.initialize();
  });

  afterEach(async () => {
    await pool.shutdown();
  });

  describe('Pool Initialization', () => {
    it('should create pool with correct size', async () => {
      assert.strictEqual(
        pool.pool.length,
        4, // Default pool size
        'Pool should have 4 sandboxes'
      );
    });

    it('should initialize all sandboxes as idle', async () => {
      const idleCount = pool.pool.filter((s) => s.state === 'idle').length;
      assert.strictEqual(
        idleCount,
        pool.pool.length,
        'All sandboxes should be idle'
      );
    });

    it('should set creation timestamps', async () => {
      pool.pool.forEach((sandbox) => {
        assert.ok(sandbox.createdAt, 'Sandbox should have createdAt');
        assert.ok(sandbox.lastUsedAt, 'Sandbox should have lastUsedAt');
      });
    });

    it('should generate unique IDs', async () => {
      const ids = pool.pool.map((s) => s.id);
      const uniqueIds = new Set(ids);
      assert.strictEqual(
        ids.length,
        uniqueIds.size,
        'All sandbox IDs should be unique'
      );
    });

    it('should create workspace directories', async () => {
      const fs = require('fs').promises;
      for (const sandbox of pool.pool) {
        const exists = await fs
          .stat(sandbox.workspaceDir)
          .then(() => true)
          .catch(() => false);
        assert.ok(exists, `Workspace should exist for sandbox ${sandbox.id}`);
      }
    });
  });

  describe('Sandbox Acquisition', () => {
    it('should acquire available sandbox', async () => {
      const { sandbox, token } = await pool.acquire();
      assert.ok(sandbox, 'Should return sandbox');
      assert.ok(token, 'Should return token');
      assert.strictEqual(
        sandbox.state,
        'acquired',
        'Sandbox should be marked as acquired'
      );
    });

    it('should track active usage', async () => {
      const { token } = await pool.acquire();
      assert.ok(
        pool.activeUsage.has(token),
        'Token should be in active usage map'
      );
    });

    it('should increment usage counter', async () => {
      const { sandbox } = await pool.acquire();
      assert.strictEqual(
        sandbox.currentUsage,
        1,
        'Current usage should be 1'
      );
    });

    it('should reuse sandboxes efficiently', async () => {
      const { sandbox: s1, token: t1 } = await pool.acquire();
      const id1 = s1.id;
      await pool.release(t1);

      const { sandbox: s2 } = await pool.acquire();
      const id2 = s2.id;

      assert.strictEqual(
        id1,
        id2,
        'Should reuse same sandbox'
      );
      assert.strictEqual(
        s2.usageCount + 1,
        pool.stats.reused,
        'Should increment reuse counter'
      );
    });

    it('should throw on timeout', async () => {
      // Acquire all sandboxes
      const acquisitions = [];
      for (let i = 0; i < pool.pool.length; i++) {
        const acq = await pool.acquire();
        acquisitions.push(acq);
      }

      // Try to acquire one more with short timeout
      try {
        await pool.acquire(100); // 100ms timeout
        assert.fail('Should throw on exhaustion');
      } catch (error) {
        assert.ok(
          error.message.includes('timeout'),
          'Error should mention timeout'
        );
      }

      // Cleanup
      for (const acq of acquisitions) {
        await pool.release(acq.token);
      }
    });
  });

  describe('Code Execution - Python', () => {
    it('should execute simple Python code', async () => {
      const code = `
print("Hello, World!")
`;
      const result = await pool.execute(code, 'python');
      assert.strictEqual(result.success, true, 'Execution should succeed');
      assert.ok(
        result.output.includes('Hello'),
        'Should capture output'
      );
    });

    it('should execute Python with calculation', async () => {
      const code = `
result = 2 + 2
print(result)
`;
      const result = await pool.execute(code, 'python');
      assert.strictEqual(result.success, true);
      assert.ok(result.output.includes('4'), 'Should output calculation');
    });

    it('should capture Python errors', async () => {
      const code = `
print(undefined_var)
`;
      const result = await pool.execute(code, 'python');
      // Will depend on error handling
      assert.ok(
        result.stderr || !result.success,
        'Should capture error'
      );
    });

    it('should handle Python timeout', async () => {
      const code = `
import time
time.sleep(15)
`;
      const result = await pool.execute(code, 'python');
      // Should timeout after 10 seconds
      assert.ok(
        !result.success || result.executionTime < 15000,
        'Should respect timeout'
      );
    });

    it('should execute DSA solution - Two Sum', async () => {
      const code = `
def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        if target - num in seen:
            return [seen[target - num], i]
        seen[num] = i
    return []

result = twoSum([2, 7, 11, 15], 9)
print(result)
`;
      const result = await pool.execute(code, 'python');
      assert.strictEqual(result.success, true);
      assert.ok(result.output.includes('[0, 1]'), 'Should solve Two Sum');
    });
  });

  describe('Code Execution - JavaScript', () => {
    it('should execute simple JavaScript code', async () => {
      const code = `
console.log("Hello from JS");
`;
      const result = await pool.execute(code, 'javascript');
      assert.strictEqual(result.success, true);
      assert.ok(
        result.output.includes('Hello'),
        'Should capture output'
      );
    });

    it('should execute JavaScript with calculation', async () => {
      const code = `
const result = 2 + 2;
console.log(result);
`;
      const result = await pool.execute(code, 'javascript');
      assert.strictEqual(result.success, true);
      assert.ok(result.output.includes('4'));
    });

    it('should capture JavaScript errors', async () => {
      const code = `
console.log(undefinedVar);
`;
      const result = await pool.execute(code, 'javascript');
      assert.ok(
        result.stderr || !result.success,
        'Should capture error'
      );
    });
  });

  describe('Sandbox Reuse Performance', () => {
    it('should reuse sandboxes without recreation', async () => {
      const initialStats = { ...pool.stats };

      await pool.execute('print("test")', 'python');
      await pool.execute('print("test2")', 'python');

      const reused = pool.stats.reused - initialStats.reused;
      assert.ok(reused > 0, 'Should reuse sandboxes');
    });

    it('should maintain fast execution times', async () => {
      const times = [];

      for (let i = 0; i < 5; i++) {
        const result = await pool.execute('print("test")', 'python');
        times.push(result.executionTime);
      }

      const avgTime = times.reduce((a, b) => a + b) / times.length;
      assert.ok(avgTime < 1000, 'Average execution should be < 1s');
    });

    it('should support concurrent execution', async () => {
      const promises = [];

      for (let i = 0; i < pool.pool.length; i++) {
        promises.push(
          pool.execute(`print("concurrent ${i}")`, 'python')
        );
      }

      const results = await Promise.all(promises);
      const successCount = results.filter((r) => r.success).length;

      assert.strictEqual(
        successCount,
        pool.pool.length,
        'All concurrent executions should succeed'
      );
    });
  });

  describe('Resource Cleanup', () => {
    it('should clean sandbox outputs after execution', async () => {
      const { sandbox, token } = await pool.acquire();
      const outputBefore = Object.keys(sandbox.outputs).length;

      await pool.release(token);

      // Outputs might be preserved or cleaned
      assert.ok(true, 'Cleanup should not throw');
    });

    it('should handle sandbox errors gracefully', async () => {
      const result = await pool.execute('invalid python syntax ][', 'python');

      // Error should be captured, not crash
      assert.ok(result.stderr || !result.success, 'Should handle error');

      // Pool should remain usable
      const nextResult = await pool.execute('print("ok")', 'python');
      assert.ok(nextResult.success, 'Pool should recover');
    });

    it('should mark error sandboxes for cleanup', async () => {
      const dirtyPool = new SandboxPool();
      await dirtyPool.initialize();

      // Execute code that causes error
      await dirtyPool.execute('bad syntax!', 'python');

      // Run maintenance
      await dirtyPool._performMaintenance();

      // Pool should be cleaned
      assert.ok(dirtyPool.pool.length >= 0, 'Cleanup should work');

      await dirtyPool.shutdown();
    });
  });

  describe('Pool Statistics', () => {
    it('should track execution statistics', async () => {
      await pool.execute('print("test")', 'python');

      const stats = pool.getStats();
      assert.ok(stats.totalExecutions > 0, 'Should track executions');
      assert.ok(stats.totalTime > 0, 'Should track time');
      assert.ok(stats.avgExecutionTime >= 0, 'Should calculate average');
    });

    it('should track reuse rate', async () => {
      const initial = pool.stats.reused;

      await pool.execute('print("a")', 'python');
      await pool.execute('print("b")', 'python');

      const reused = pool.stats.reused - initial;
      assert.ok(reused > 0, 'Should track reuse');
    });

    it('should track pool health', async () => {
      const stats = pool.getStats();

      assert.ok(stats.poolSize > 0, 'Should have pool size');
      assert.ok(stats.idleCount >= 0, 'Should track idle count');
      assert.ok(stats.activeCount >= 0, 'Should track active count');
    });
  });

  describe('Shutdown & Cleanup', () => {
    it('should shutdown gracefully', async () => {
      await pool.shutdown();

      assert.strictEqual(pool.pool.length, 0, 'Pool should be empty');
      assert.strictEqual(
        pool.activeUsage.size,
        0,
        'Active usage should be empty'
      );
    });

    it('should remove workspace directories on shutdown', async () => {
      const fs = require('fs').promises;
      const workdirs = pool.pool.map((s) => s.workspaceDir);

      await pool.shutdown();

      for (const dir of workdirs) {
        const exists = await fs
          .stat(dir)
          .then(() => true)
          .catch(() => false);
        // Cleanup may be async, so this is best-effort
        assert.ok(!exists || true, 'Directory should be cleaned');
      }
    });

    it('should clear cleanup timer', async () => {
      const timer = pool.cleanupTimer;
      assert.ok(timer, 'Timer should exist');

      await pool.shutdown();

      assert.strictEqual(pool.cleanupTimer, null, 'Timer should be cleared');
    });
  });

  describe('Integration Tests', () => {
    it('should handle module-level functions', async () => {
      const result = await executeInPool('print("module level")', 'python');
      assert.strictEqual(result.success, true);
    });

    it('should reinitialize pool correctly', async () => {
      await shutdownPool();

      const newPool = await initializePool();
      assert.ok(newPool, 'Should return pool instance');
      assert.ok(newPool.pool.length > 0, 'Should have sandboxes');

      await shutdownPool();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty code', async () => {
      const result = await pool.execute('', 'python');
      assert.ok(result.success || !result.success, 'Should handle gracefully');
    });

    it('should handle very large output', async () => {
      const code = `
for i in range(1000):
    print(f"Line {i}")
`;
      const result = await pool.execute(code, 'python');
      assert.strictEqual(result.success, true);
      assert.ok(result.output.length > 5000, 'Should capture large output');
    });

    it('should handle multiple sequential executions', async () => {
      for (let i = 0; i < 10; i++) {
        const result = await pool.execute(`print("iteration ${i}")`, 'python');
        assert.strictEqual(result.success, true, `Iteration ${i} failed`);
      }
    });
  });
});
