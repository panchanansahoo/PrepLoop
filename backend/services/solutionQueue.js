/**
 * Solution Queue Manager - Phase 3.3
 * 
 * Moves blocking Groq API calls to background queue.
 * Returns hint immediately; streams solution when ready.
 * 
 * Architecture:
 * - Queue: persists pending generation requests
 * - Worker: processes queue items asynchronously
 * - Streaming: WebSocket/Server-Sent Events for progress
 * - Storage: saves completed solutions in database
 */

const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');

const QUEUE_CONFIG = {
  workerCount: 2, // Parallel workers
  processTimeout: 30 * 1000, // 30 seconds per item
  retryAttempts: 3,
  retryDelayMs: 1000,
};

/**
 * Solution request item in queue
 */
class QueueItem {
  constructor(problemId, userId, type, context = {}) {
    this.id = uuidv4();
    this.problemId = problemId;
    this.userId = userId;
    this.type = type; // 'solution', 'explanation', 'optimized_solution'
    this.context = context;
    this.status = 'pending'; // pending, processing, completed, failed
    this.result = null;
    this.error = null;
    this.createdAt = Date.now();
    this.startedAt = null;
    this.completedAt = null;
    this.attempts = 0;
  }

  toJSON() {
    return {
      id: this.id,
      problemId: this.problemId,
      userId: this.userId,
      type: this.type,
      status: this.status,
      result: this.result,
      error: this.error,
      progress: this.progress || 0,
      createdAt: this.createdAt,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
    };
  }
}

class SolutionQueue extends EventEmitter {
  constructor(generateFn, options = {}) {
    super();

    this.generateFn = generateFn; // Groq API call function
    this.queue = [];
    this.processing = new Map();
    this.completed = new Map();
    this.workers = [];
    this.isRunning = false;
    this.options = { ...QUEUE_CONFIG, ...options };

    this.stats = {
      totalQueued: 0,
      totalProcessed: 0,
      totalFailed: 0,
      totalRetried: 0,
      avgProcessTime: 0,
      totalProcessTime: 0,
    };
  }

  /**
   * Start queue processor with worker pool
   */
  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log(`🚀 Solution queue started with ${this.options.workerCount} workers`);

    // Start worker processes
    for (let i = 0; i < this.options.workerCount; i++) {
      this._startWorker(i);
    }
  }

  /**
   * Stop queue processor
   */
  async stop() {
    this.isRunning = false;
    console.log('🛑 Solution queue stopping...');

    // Wait for all workers to finish current items
    await Promise.all(this.workers.map((w) => w.done));
    this.workers = [];
  }

  /**
   * Enqueue a generation request
   */
  enqueue(problemId, userId, type, context = {}) {
    const item = new QueueItem(problemId, userId, type, context);
    this.queue.push(item);
    this.stats.totalQueued++;

    console.log(`📬 Queued: ${type} for problem ${problemId} (${item.id})`);

    this.emit('enqueued', item);
    return item;
  }

  /**
   * Get status of queued item
   */
  getStatus(itemId) {
    if (this.processing.has(itemId)) {
      return this.processing.get(itemId);
    }
    if (this.completed.has(itemId)) {
      return this.completed.get(itemId);
    }
    return this.queue.find((item) => item.id === itemId);
  }

  /**
   * Get completed result
   */
  getResult(itemId) {
    const item = this.completed.get(itemId);
    if (item && item.status === 'completed') {
      return item.result;
    }
    return null;
  }

  /**
   * Start a worker process
   */
  _startWorker(workerId) {
    const worker = {
      id: workerId,
      processing: null,
      done: Promise.resolve(),
    };

    const processLoop = async () => {
      while (this.isRunning) {
        // Get next item from queue
        const item = this.queue.shift();

        if (!item) {
          // Queue empty, wait before checking again
          await new Promise((resolve) => setTimeout(resolve, 100));
          continue;
        }

        worker.processing = item;
        await this._processItem(item);
        worker.processing = null;
      }
    };

    worker.done = processLoop();
    this.workers.push(worker);
  }

  /**
   * Process a single queue item
   */
  async _processItem(item) {
    item.startedAt = Date.now();
    item.status = 'processing';
    this.processing.set(item.id, item);

    console.log(`⚙️  Processing: ${item.type} (attempt ${item.attempts + 1})`);

    try {
      // Call generation function with timeout
      const result = await Promise.race([
        this.generateFn(item.problemId, item.type, item.context),
        this._timeout(this.options.processTimeout),
      ]);

      // Success
      item.result = result;
      item.status = 'completed';
      item.completedAt = Date.now();

      this.stats.totalProcessed++;
      this.stats.totalProcessTime += item.completedAt - item.startedAt;
      this.stats.avgProcessTime = this.stats.totalProcessTime / this.stats.totalProcessed;

      console.log(`✅ Completed: ${item.type} (${item.completedAt - item.startedAt}ms)`);

      this.emit('completed', item);
    } catch (error) {
      item.attempts++;
      item.error = error.message;

      if (item.attempts < this.options.retryAttempts) {
        // Retry
        item.status = 'pending';
        this.queue.push(item); // Re-queue
        this.stats.totalRetried++;

        console.warn(
          `⚠️  Retry: ${item.type} (attempt ${item.attempts}/${this.options.retryAttempts})`
        );

        this.emit('retried', item);

        // Delay before retry
        await new Promise((resolve) =>
          setTimeout(resolve, this.options.retryDelayMs * item.attempts)
        );
      } else {
        // Failed
        item.status = 'failed';
        item.completedAt = Date.now();
        this.stats.totalFailed++;

        console.error(`❌ Failed: ${item.type} after ${item.attempts} attempts`);

        this.emit('failed', item);
      }
    } finally {
      this.processing.delete(item.id);

      // Move to completed cache if finished
      if (item.status === 'completed' || item.status === 'failed') {
        this.completed.set(item.id, item);
      }
    }
  }

  /**
   * Timeout helper
   */
  _timeout(ms) {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Processing timeout after ${ms}ms`)), ms)
    );
  }

  /**
   * Get queue statistics
   */
  getStats() {
    return {
      queuedCount: this.queue.length,
      processingCount: this.processing.size,
      completedCount: this.completed.size,
      ...this.stats,
      workerCount: this.options.workerCount,
    };
  }

  /**
   * Clear completed items (cache cleanup)
   */
  clearCompleted() {
    const cleared = this.completed.size;
    this.completed.clear();
    return cleared;
  }

  /**
   * Pause all workers
   */
  pause() {
    this.isRunning = false;
    console.log('⏸️  Queue paused');
  }

  /**
   * Resume workers
   */
  resume() {
    if (!this.isRunning) {
      this.start();
    }
  }
}

/**
 * Create HTTP middleware for queue status polling
 */
function createQueueStatusEndpoint(queue) {
  return {
    // GET /api/queue/:itemId - Get status
    getStatus: (req, res) => {
      const { itemId } = req.params;
      const item = queue.getStatus(itemId);

      if (!item) {
        return res.status(404).json({ error: 'Not found' });
      }

      res.json(item.toJSON());
    },

    // POST /api/queue - Enqueue generation
    enqueue: (req, res) => {
      const { problemId, userId, type, context } = req.body;

      if (!problemId || !userId || !type) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const item = queue.enqueue(problemId, userId, type, context);
      res.status(202).json(item.toJSON());
    },

    // GET /api/queue/stats - Queue statistics
    getStats: (req, res) => {
      res.json(queue.getStats());
    },
  };
}

/**
 * Create Server-Sent Events endpoint for streaming updates
 */
function createQueueSSEEndpoint(queue) {
  return (req, res) => {
    const { itemId } = req.params;

    // Setup SSE response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Send initial status
    const item = queue.getStatus(itemId);
    if (!item) {
      res.write('event: error\ndata: {"error": "Not found"}\n\n');
      res.end();
      return;
    }

    res.write(`event: status\ndata: ${JSON.stringify(item.toJSON())}\n\n`);

    // Listen for updates
    const handleCompleted = (completedItem) => {
      if (completedItem.id === itemId) {
        res.write(`event: completed\ndata: ${JSON.stringify(completedItem.toJSON())}\n\n`);
        cleanup();
      }
    };

    const handleFailed = (failedItem) => {
      if (failedItem.id === itemId) {
        res.write(`event: failed\ndata: ${JSON.stringify(failedItem.toJSON())}\n\n`);
        cleanup();
      }
    };

    const cleanup = () => {
      queue.removeListener('completed', handleCompleted);
      queue.removeListener('failed', handleFailed);
      res.end();
    };

    queue.on('completed', handleCompleted);
    queue.on('failed', handleFailed);

    // Cleanup on client disconnect
    req.on('close', cleanup);
  };
}

module.exports = {
  SolutionQueue,
  QueueItem,
  createQueueStatusEndpoint,
  createQueueSSEEndpoint,
};
