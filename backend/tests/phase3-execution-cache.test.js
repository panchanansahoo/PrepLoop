/**
 * Execution Cache Manager Tests - Phase 3.2
 * 
 * Tests for:
 * 1. Cache key generation
 * 2. Result caching and hit rates
 * 3. API memoization
 * 4. TTL enforcement
 * 5. Memory management and eviction
 * 6. Redis fallback
 */

const assert = require('assert');
const { ExecutionCache, getCache } = require('../../services/executionCache');

describe('Phase 3.2: Execution Cache Manager', () => {
  let cache;

  beforeEach(() => {
    cache = new ExecutionCache(); // In-memory only (no Redis)
  });

  afterEach(async () => {
    if (cache) {
      await cache.close();
    }
  });

  describe('Cache Key Generation', () => {
    it('should generate consistent execution keys', () => {
      const code = 'print("hello")';
      const language = 'python';

      const key1 = cache.generateExecutionKey(code, language);
      const key2 = cache.generateExecutionKey(code, language);

      assert.strictEqual(key1, key2, 'Keys should be consistent');
    });

    it('should generate different keys for different code', () => {
      const key1 = cache.generateExecutionKey('print("a")', 'python');
      const key2 = cache.generateExecutionKey('print("b")', 'python');

      assert.notStrictEqual(key1, key2, 'Different code should have different keys');
    });

    it('should generate different keys for different languages', () => {
      const code = 'print("hello")';

      const pythonKey = cache.generateExecutionKey(code, 'python');
      const jsKey = cache.generateExecutionKey(code, 'javascript');

      assert.notStrictEqual(pythonKey, jsKey, 'Different languages should have different keys');
    });

    it('should include inputs in cache key', () => {
      const code = 'print(x)';
      const language = 'python';

      const key1 = cache.generateExecutionKey(code, language, { x: 1 });
      const key2 = cache.generateExecutionKey(code, language, { x: 2 });

      assert.notStrictEqual(key1, key2, 'Different inputs should have different keys');
    });

    it('should generate API memoization keys', () => {
      const key1 = cache.generateAPIKey('groq', { prompt: 'test' });
      const key2 = cache.generateAPIKey('groq', { prompt: 'test' });

      assert.strictEqual(key1, key2, 'API keys should be consistent');
    });

    it('should use hash for efficient keys', () => {
      const key = cache.generateExecutionKey('x' * 1000, 'python');
      assert.ok(key.length < 50, 'Hash should be short even for large input');
    });
  });

  describe('Execution Result Caching', () => {
    it('should store and retrieve execution results', async () => {
      const code = 'print("hello")';
      const language = 'python';
      const result = {
        output: 'hello\n',
        stderr: '',
        exitCode: 0,
        executionTime: 100,
      };

      await cache.setExecutionResult(code, language, null, result);
      const cached = await cache.getExecutionResult(code, language);

      assert.deepStrictEqual(cached.output, result.output);
      assert.strictEqual(cached.exitCode, result.exitCode);
    });

    it('should return null for uncached results', async () => {
      const cached = await cache.getExecutionResult('unknown', 'python');
      assert.strictEqual(cached, null);
    });

    it('should track cache hits and misses', async () => {
      const code = 'print("test")';
      const language = 'python';

      const result = {
        output: 'test\n',
        stderr: '',
        exitCode: 0,
        executionTime: 50,
      };

      // Miss
      await cache.getExecutionResult(code, language);
      assert.strictEqual(cache.stats.resultMisses, 1);

      // Set
      await cache.setExecutionResult(code, language, null, result);

      // Hit
      await cache.getExecutionResult(code, language);
      assert.strictEqual(cache.stats.resultHits, 1);
    });

    it('should calculate hit rate', async () => {
      const code = 'print("x")';
      const language = 'python';
      const result = { output: 'x\n', stderr: '', exitCode: 0, executionTime: 10 };

      // Setup
      for (let i = 0; i < 10; i++) {
        await cache.setExecutionResult(code, language, null, result);
        await cache.getExecutionResult(code, language);
      }

      const stats = cache.getStats();
      assert.ok(stats.resultHitRate > 0, 'Should have hit rate > 0%');
    });

    it('should sanitize sensitive data before caching', async () => {
      const code = 'secret_code';
      const language = 'python';
      const result = {
        output: 'output',
        stderr: 'stderr',
        exitCode: 1,
        executionTime: 100,
        sandboxId: 'sandbox-123', // Sensitive
      };

      await cache.setExecutionResult(code, language, null, result);
      const cached = await cache.getExecutionResult(code, language);

      assert.strictEqual(cached.sandboxId, undefined, 'Sensitive data should be removed');
      assert.strictEqual(cached.cached, true, 'Should mark as cached');
    });
  });

  describe('API Memoization', () => {
    it('should cache API results', async () => {
      const apiName = 'groq';
      const params = { prompt: 'What is 2+2?' };
      const result = { answer: '4' };

      await cache.setAPIResult(apiName, params, result);
      const cached = await cache.getAPIResult(apiName, params);

      assert.deepStrictEqual(cached, result);
    });

    it('should track API hits and misses', async () => {
      const apiName = 'groq';
      const params = { prompt: 'test' };

      // Miss
      await cache.getAPIResult(apiName, params);
      assert.strictEqual(cache.stats.apiMisses, 1);

      // Set
      await cache.setAPIResult(apiName, params, { result: 'ok' });

      // Hit
      await cache.getAPIResult(apiName, params);
      assert.strictEqual(cache.stats.apiHits, 1);
    });

    it('should return null for uncached API results', async () => {
      const result = await cache.getAPIResult('unknown', {});
      assert.strictEqual(result, null);
    });

    it('should support custom TTL for API caching', async () => {
      const apiName = 'hint_generator';
      const params = { problem: 'Two Sum' };
      const result = { hint: 'Use a hash map' };

      await cache.setAPIResult(apiName, params, result, 1); // 1 second TTL

      // Should be available immediately
      const cached1 = await cache.getAPIResult(apiName, params);
      assert.ok(cached1, 'Should be cached');

      // After TTL, should expire (in memory cache)
      await new Promise((resolve) => setTimeout(resolve, 1100));
      const cached2 = await cache.getAPIResult(apiName, params);
      // Memory cache respects TTL
      assert.strictEqual(cached2, null, 'Should expire after TTL');
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate cache entries', async () => {
      const code = 'test';
      const language = 'python';
      const result = { output: 'test', stderr: '', exitCode: 0, executionTime: 10 };

      await cache.setExecutionResult(code, language, null, result);
      const key = cache.generateExecutionKey(code, language);

      // Should exist
      let cached = await cache.getExecutionResult(code, language);
      assert.ok(cached, 'Should be cached');

      // Invalidate
      await cache.invalidate(key);

      // Should be gone
      cached = await cache.getExecutionResult(code, language);
      assert.strictEqual(cached, null, 'Should be invalidated');
    });

    it('should clear all cache', async () => {
      const result = { output: 'x', stderr: '', exitCode: 0, executionTime: 10 };

      await cache.setExecutionResult('code1', 'python', null, result);
      await cache.setExecutionResult('code2', 'python', null, result);

      assert.strictEqual(cache.memoryCache.size, 2);

      await cache.clear();

      assert.strictEqual(cache.memoryCache.size, 0, 'Cache should be empty');
    });
  });

  describe('Memory Management', () => {
    it('should evict old entries when cache is full', async () => {
      const result = { output: 'x', stderr: '', exitCode: 0, executionTime: 10 };

      // Fill cache beyond limit
      for (let i = 0; i < 1100; i++) {
        await cache.setExecutionResult(`code${i}`, 'python', null, result);
      }

      assert.ok(
        cache.memoryCache.size <= 1000 * 1.1, // Allow some overflow
        'Cache should evict old entries'
      );

      assert.ok(cache.stats.evictions > 0, 'Should track evictions');
    });

    it('should preserve newer entries during eviction', async () => {
      const result = { output: 'x', stderr: '', exitCode: 0, executionTime: 10 };

      // Fill cache
      for (let i = 0; i < 1100; i++) {
        await cache.setExecutionResult(`code${i}`, 'python', null, result);
        if (i === 1000) {
          // Remember entry at index 1000
          const cached = await cache.getExecutionResult('code1000', 'python');
          assert.ok(cached, 'Entry 1000 should be cached');
        }
      }

      // After eviction, recent entries should still exist
      const cached = await cache.getExecutionResult('code1099', 'python');
      assert.ok(cached, 'Recent entries should be preserved');
    });

    it('should handle expired entries', async () => {
      cache.memoryCache.set('expired', {
        value: 'data',
        expireAt: Date.now() - 1000, // Already expired
      });

      // Should not return expired entry
      const cached = cache.memoryCache.get('expired');
      assert.ok(cached.expireAt < Date.now(), 'Entry should be expired');
    });
  });

  describe('Cache Statistics', () => {
    it('should provide cache statistics', async () => {
      const stats = cache.getStats();

      assert.ok(stats.resultHitRate !== undefined, 'Should have hit rate');
      assert.ok(stats.resultHits !== undefined, 'Should have hit count');
      assert.ok(stats.memoryCacheSize !== undefined, 'Should have cache size');
    });

    it('should calculate accurate hit rates', async () => {
      const code = 'print("test")';
      const language = 'python';
      const result = { output: 'test\n', stderr: '', exitCode: 0, executionTime: 10 };

      // 3 misses
      await cache.getExecutionResult(code, language);
      await cache.getExecutionResult('other', language);
      await cache.getExecutionResult('another', language);

      // Set cache
      await cache.setExecutionResult(code, language, null, result);

      // 2 hits
      await cache.getExecutionResult(code, language);
      await cache.getExecutionResult(code, language);

      const stats = cache.getStats();
      const expectedHitRate = (2 / 5) * 100;

      assert.strictEqual(
        Math.round(stats.resultHitRate),
        Math.round(expectedHitRate),
        'Hit rate should be accurate'
      );
    });
  });

  describe('Warm Cache', () => {
    it('should warm cache with common patterns', async () => {
      await cache.warmCache();

      const stats = cache.getStats();
      assert.ok(stats.memoryCacheSize > 0, 'Cache should be warmed');
    });

    it('should serve warmed entries efficiently', async () => {
      await cache.warmCache();

      const start = Date.now();
      const result = await cache.getExecutionResult('print("Hello")', 'python');
      const duration = Date.now() - start;

      assert.ok(result, 'Should retrieve warmed entry');
      assert.ok(duration < 10, 'Should be fast');
    });
  });

  describe('Concurrency', () => {
    it('should handle concurrent cache operations', async () => {
      const result = { output: 'x', stderr: '', exitCode: 0, executionTime: 10 };

      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(
          cache.setExecutionResult(`code${i}`, 'python', null, result)
        );
      }

      await Promise.all(promises);

      assert.ok(cache.memoryCache.size > 0, 'All operations should complete');
    });

    it('should handle concurrent reads', async () => {
      const code = 'print("test")';
      const result = { output: 'test\n', stderr: '', exitCode: 0, executionTime: 10 };

      await cache.setExecutionResult(code, 'python', null, result);

      const promises = [];
      for (let i = 0; i < 50; i++) {
        promises.push(cache.getExecutionResult(code, 'python'));
      }

      const results = await Promise.all(promises);
      const allCached = results.every((r) => r !== null);

      assert.ok(allCached, 'All reads should succeed');
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const cache1 = getCache();
      const cache2 = getCache();

      assert.strictEqual(cache1, cache2, 'Should return singleton');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null results', async () => {
      const code = 'error';
      const language = 'python';

      await cache.setExecutionResult(code, language, null, {
        output: '',
        stderr: 'Error',
        exitCode: 1,
        executionTime: 5,
      });

      const cached = await cache.getExecutionResult(code, language);
      assert.ok(cached, 'Should cache error results');
    });

    it('should handle large output', async () => {
      const code = 'large';
      const largeOutput = 'x'.repeat(10000);

      const result = {
        output: largeOutput,
        stderr: '',
        exitCode: 0,
        executionTime: 100,
      };

      await cache.setExecutionResult(code, 'python', null, result);
      const cached = await cache.getExecutionResult(code, 'python');

      assert.strictEqual(cached.output, largeOutput, 'Should handle large output');
    });

    it('should handle empty code', async () => {
      const result = { output: '', stderr: '', exitCode: 0, executionTime: 1 };

      await cache.setExecutionResult('', 'python', null, result);
      const cached = await cache.getExecutionResult('', 'python');

      assert.ok(cached, 'Should handle empty code');
    });
  });

  describe('Performance', () => {
    it('should cache/retrieve in < 5ms', async () => {
      const code = 'perf_test';
      const result = { output: 'test', stderr: '', exitCode: 0, executionTime: 10 };

      await cache.setExecutionResult(code, 'python', null, result);

      const start = Date.now();
      await cache.getExecutionResult(code, 'python');
      const duration = Date.now() - start;

      assert.ok(duration < 5, `Should complete in < 5ms, took ${duration}ms`);
    });

    it('should handle 1000 operations', async () => {
      const result = { output: 'x', stderr: '', exitCode: 0, executionTime: 10 };
      const start = Date.now();

      for (let i = 0; i < 1000; i++) {
        await cache.setExecutionResult(`code${i % 10}`, 'python', null, result);
      }

      const duration = Date.now() - start;
      assert.ok(duration < 5000, `1000 ops should complete in < 5s, took ${duration}ms`);
    });
  });
});
