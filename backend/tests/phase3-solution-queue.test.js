/**
 * Solution Queue Manager Tests - Phase 3.3
 * 
 * Tests for:
 * 1. Queue management and processing
 * 2. Worker pool coordination
 * 3. Retry logic and error handling
 * 4. Async generation without blocking
 * 5. Event streaming and status updates
 */

const assert = require('assert');
const { SolutionQueue, QueueItem, createQueueStatusEndpoint } = require('../../services/solutionQueue');

describe('Phase 3.3: Solution Queue Manager', () => {
  let queue;
  let mockGenerateFn;

  beforeEach(() => {
    mockGenerateFn = async (problemId, type, context) => {
      // Simulate API call with delay
      await new Promise((resolve) => setTimeout(resolve, 50));
      return { solution: `Generated ${type} for ${problemId}` };
    };

    queue = new SolutionQueue(mockGenerateFn);
  });

  afterEach(async () => {
    await queue.stop();
  });

  describe('Queue Item', () => {
    it('should create queue item with unique ID', () => {
      const item = new QueueItem('prob-1', 'user-1', 'solution');

      assert.ok(item.id, 'Should have ID');
      assert.strictEqual(item.status, 'pending', 'Initial status should be pending');
      assert.strictEqual(item.problemId, 'prob-1');
      assert.strictEqual(item.userId, 'user-1');
    });

    it('should convert to JSON', () => {
      const item = new QueueItem('prob-1', 'user-1', 'solution', { code: 'test' });
      const json = item.toJSON();

      assert.ok(json.id, 'JSON should have ID');
      assert.strictEqual(json.status, 'pending');
      assert.strictEqual(json.type, 'solution');
    });

    it('should track processing timestamps', () => {
      const item = new QueueItem('prob-1', 'user-1', 'solution');

      assert.ok(item.createdAt, 'Should have createdAt');
      assert.strictEqual(item.startedAt, null, 'startedAt should be null initially');
      assert.strictEqual(item.completedAt, null, 'completedAt should be null initially');
    });
  });

  describe('Queue Management', () => {
    it('should enqueue items', () => {
      const item = queue.enqueue('prob-1', 'user-1', 'solution');

      assert.ok(item, 'Should return item');
      assert.strictEqual(queue.queue.length, 1, 'Queue should have 1 item');
    });

    it('should track queued items', () => {
      queue.enqueue('prob-1', 'user-1', 'solution');
      queue.enqueue('prob-2', 'user-1', 'explanation');

      assert.strictEqual(queue.queue.length, 2);
      assert.strictEqual(queue.stats.totalQueued, 2);
    });

    it('should get item status', () => {
      const item = queue.enqueue('prob-1', 'user-1', 'solution');
      const status = queue.getStatus(item.id);

      assert.ok(status, 'Should return status');
      assert.strictEqual(status.id, item.id);
    });

    it('should return null for non-existent items', () => {
      const status = queue.getStatus('non-existent');
      assert.strictEqual(status, null);
    });

    it('should clear completed items', async () => {
      queue.start();

      const item = queue.enqueue('prob-1', 'user-1', 'solution');
      await new Promise((resolve) => setTimeout(resolve, 200));

      const cleared = queue.clearCompleted();
      assert.ok(cleared > 0, 'Should clear completed items');
    });
  });

  describe('Worker Processing', () => {
    it('should process queued items', async () => {
      queue.start();

      const item = queue.enqueue('prob-1', 'user-1', 'solution');

      // Wait for processing
      await new Promise((resolve) => {
        queue.on('completed', (completedItem) => {
          if (completedItem.id === item.id) {
            resolve();
          }
        });
      });

      const processed = queue.getStatus(item.id);
      assert.strictEqual(processed.status, 'completed');
      assert.ok(processed.result, 'Should have result');
    });

    it('should handle multiple concurrent items', async () => {
      queue.start();

      const items = [
        queue.enqueue('prob-1', 'user-1', 'solution'),
        queue.enqueue('prob-2', 'user-1', 'explanation'),
        queue.enqueue('prob-3', 'user-1', 'optimized_solution'),
      ];

      // Wait for all to complete
      await new Promise((resolve) => {
        let completed = 0;
        queue.on('completed', () => {
          completed++;
          if (completed === items.length) {
            resolve();
          }
        });
      });

      items.forEach((item) => {
        const processed = queue.getStatus(item.id);
        assert.strictEqual(processed.status, 'completed');
      });
    });

    it('should track processing time', async () => {
      queue.start();

      const item = queue.enqueue('prob-1', 'user-1', 'solution');

      await new Promise((resolve) => {
        queue.on('completed', (completedItem) => {
          if (completedItem.id === item.id) {
            resolve();
          }
        });
      });

      const processed = queue.getStatus(item.id);
      const processingTime = processed.completedAt - processed.startedAt;

      assert.ok(processingTime > 0, 'Should track processing time');
    });
  });

  describe('Error Handling & Retry', () => {
    it('should handle generation errors', async () => {
      const errorQueue = new SolutionQueue(async () => {
        throw new Error('Generation failed');
      });

      errorQueue.start();
      const item = errorQueue.enqueue('prob-1', 'user-1', 'solution');

      // Wait for failure
      await new Promise((resolve) => {
        errorQueue.on('failed', (failedItem) => {
          if (failedItem.id === item.id) {
            resolve();
          }
        });
      });

      const processed = errorQueue.getStatus(item.id);
      assert.strictEqual(processed.status, 'failed');
      assert.ok(processed.error, 'Should have error message');

      await errorQueue.stop();
    });

    it('should retry failed items', async () => {
      let attemptCount = 0;

      const retryQueue = new SolutionQueue(async () => {
        attemptCount++;
        if (attemptCount < 2) {
          throw new Error('Temporary failure');
        }
        return { solution: 'Success' };
      });

      retryQueue.start();
      const item = retryQueue.enqueue('prob-1', 'user-1', 'solution');

      // Wait for completion (via retry)
      await new Promise((resolve) => {
        retryQueue.on('completed', (completedItem) => {
          if (completedItem.id === item.id) {
            resolve();
          }
        });
      });

      const processed = retryQueue.getStatus(item.id);
      assert.strictEqual(processed.status, 'completed');
      assert.strictEqual(attemptCount, 2, 'Should have retried once');

      await retryQueue.stop();
    });

    it('should fail after max retries', async () => {
      const maxRetryQueue = new SolutionQueue(
        async () => {
          throw new Error('Always fails');
        },
        { retryAttempts: 2 }
      );

      maxRetryQueue.start();
      const item = maxRetryQueue.enqueue('prob-1', 'user-1', 'solution');

      // Wait for final failure
      await new Promise((resolve) => {
        maxRetryQueue.on('failed', (failedItem) => {
          if (failedItem.id === item.id) {
            resolve();
          }
        });
      });

      const processed = maxRetryQueue.getStatus(item.id);
      assert.strictEqual(processed.status, 'failed');
      assert.strictEqual(processed.attempts, 2, 'Should have retried');

      await maxRetryQueue.stop();
    });

    it('should handle processing timeout', async () => {
      const timeoutQueue = new SolutionQueue(
        async () => {
          // Never resolves
          return new Promise(() => {});
        },
        { processTimeout: 100 }
      );

      timeoutQueue.start();
      const item = timeoutQueue.enqueue('prob-1', 'user-1', 'solution');

      // Wait for timeout and retry failure
      await new Promise((resolve) => {
        timeoutQueue.on('failed', (failedItem) => {
          if (failedItem.id === item.id) {
            resolve();
          }
        });
      });

      const processed = timeoutQueue.getStatus(item.id);
      assert.ok(processed.status !== 'processing', 'Should timeout');

      await timeoutQueue.stop();
    });
  });

  describe('Worker Pool', () => {
    it('should start with configured worker count', async () => {
      queue = new SolutionQueue(mockGenerateFn, { workerCount: 3 });
      queue.start();

      assert.strictEqual(queue.workers.length, 3, 'Should have 3 workers');

      await queue.stop();
    });

    it('should distribute work across workers', async () => {
      queue = new SolutionQueue(mockGenerateFn, { workerCount: 2 });
      queue.start();

      // Enqueue several items
      for (let i = 0; i < 4; i++) {
        queue.enqueue(`prob-${i}`, 'user-1', 'solution');
      }

      // Wait for all to complete
      await new Promise((resolve) => {
        let completed = 0;
        queue.on('completed', () => {
          completed++;
          if (completed === 4) {
            resolve();
          }
        });
      });

      assert.strictEqual(queue.stats.totalProcessed, 4);
    });
  });

  describe('Statistics', () => {
    it('should track queue statistics', async () => {
      queue.start();

      queue.enqueue('prob-1', 'user-1', 'solution');
      queue.enqueue('prob-2', 'user-1', 'explanation');

      await new Promise((resolve) => setTimeout(resolve, 200));

      const stats = queue.getStats();

      assert.strictEqual(stats.totalQueued, 2);
      assert.ok(stats.avgProcessTime >= 0, 'Should track average time');
    });

    it('should calculate average processing time', async () => {
      queue.start();

      for (let i = 0; i < 3; i++) {
        queue.enqueue(`prob-${i}`, 'user-1', 'solution');
      }

      await new Promise((resolve) => {
        let completed = 0;
        queue.on('completed', () => {
          completed++;
          if (completed === 3) {
            resolve();
          }
        });
      });

      const stats = queue.getStats();
      assert.ok(stats.avgProcessTime > 0, 'Should have average time');
      assert.strictEqual(stats.totalProcessed, 3);
    });

    it('should track failed items', async () => {
      const failQueue = new SolutionQueue(async () => {
        throw new Error('Always fails');
      }, { retryAttempts: 1 });

      failQueue.start();
      failQueue.enqueue('prob-1', 'user-1', 'solution');

      await new Promise((resolve) => {
        failQueue.on('failed', () => {
          resolve();
        });
      });

      const stats = failQueue.getStats();
      assert.strictEqual(stats.totalFailed, 1);

      await failQueue.stop();
    });
  });

  describe('Pause & Resume', () => {
    it('should pause processing', async () => {
      queue.start();

      const item = queue.enqueue('prob-1', 'user-1', 'solution');
      queue.pause();

      // Item should not be processed immediately
      assert.ok(queue.queue.includes(item) || queue.processing.has(item.id));

      await queue.stop();
    });

    it('should resume processing', async () => {
      queue.start();
      queue.pause();

      const item = queue.enqueue('prob-1', 'user-1', 'solution');
      queue.resume();

      await new Promise((resolve) => {
        queue.on('completed', (completedItem) => {
          if (completedItem.id === item.id) {
            resolve();
          }
        });
      });

      const processed = queue.getStatus(item.id);
      assert.strictEqual(processed.status, 'completed');

      await queue.stop();
    });
  });

  describe('Events', () => {
    it('should emit enqueued event', (done) => {
      queue.on('enqueued', (item) => {
        assert.ok(item.id);
        done();
      });

      queue.enqueue('prob-1', 'user-1', 'solution');
    });

    it('should emit completed event', async () => {
      queue.start();

      const item = queue.enqueue('prob-1', 'user-1', 'solution');

      await new Promise((resolve) => {
        queue.on('completed', (completedItem) => {
          if (completedItem.id === item.id) {
            assert.strictEqual(completedItem.status, 'completed');
            resolve();
          }
        });
      });

      await queue.stop();
    });

    it('should emit failed event', async () => {
      const failQueue = new SolutionQueue(async () => {
        throw new Error('Failed');
      }, { retryAttempts: 1 });

      failQueue.start();

      const item = failQueue.enqueue('prob-1', 'user-1', 'solution');

      await new Promise((resolve) => {
        failQueue.on('failed', (failedItem) => {
          if (failedItem.id === item.id) {
            assert.strictEqual(failedItem.status, 'failed');
            resolve();
          }
        });
      });

      await failQueue.stop();
    });

    it('should emit retried event', async () => {
      let retried = false;

      const retryQueue = new SolutionQueue(async () => {
        throw new Error('Fail');
      });

      retryQueue.on('retried', () => {
        retried = true;
      });

      retryQueue.start();
      const item = retryQueue.enqueue('prob-1', 'user-1', 'solution');

      await new Promise((resolve) => {
        const checkRetry = setInterval(() => {
          if (retried) {
            clearInterval(checkRetry);
            resolve();
          }
        }, 50);
      });

      await retryQueue.stop();
    });
  });

  describe('Integration', () => {
    it('should handle rapid enqueueing', async () => {
      queue.start();

      const items = [];
      for (let i = 0; i < 10; i++) {
        items.push(queue.enqueue(`prob-${i}`, 'user-1', 'solution'));
      }

      // Wait for all processing
      await new Promise((resolve) => {
        let completed = 0;
        queue.on('completed', () => {
          completed++;
          if (completed === items.length) {
            resolve();
          }
        });
      });

      const stats = queue.getStats();
      assert.strictEqual(stats.totalProcessed, items.length);

      await queue.stop();
    });

    it('should handle context passing', async () => {
      const contextQueue = new SolutionQueue(async (problemId, type, context) => {
        assert.ok(context.userId, 'Should pass context');
        return { solution: 'ok' };
      });

      contextQueue.start();

      const context = { userId: 'user-123', code: 'test' };
      const item = contextQueue.enqueue('prob-1', 'user-1', 'solution', context);

      await new Promise((resolve) => {
        contextQueue.on('completed', () => {
          resolve();
        });
      });

      await contextQueue.stop();
    });
  });
});
