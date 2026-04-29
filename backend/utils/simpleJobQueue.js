/**
 * Simple In-Process Job Queue
 *
 * Lightweight job queue for async task processing without external Redis TCP.
 * Suitable for current scale (single-instance deployment on Koyeb/Azure).
 *
 * Features:
 *   - Priority-based execution
 *   - Configurable concurrency
 *   - Retry with exponential backoff
 *   - Dead letter queue (failed jobs stored in database)
 *   - Job deduplication via idempotency keys
 *
 * Usage:
 *   import jobQueue from '../utils/simpleJobQueue.js';
 *
 *   jobQueue.add('send-email', { to: 'user@example.com', subject: 'Welcome' });
 *   jobQueue.add('generate-report', { userId: '123' }, { priority: 'high', retries: 3 });
 *
 *   jobQueue.register('send-email', async (data) => { ... });
 */

import { createLogger } from './structuredLogger.js';

const logger = createLogger('job-queue');

const PRIORITY = {
  high: 0,
  normal: 1,
  low: 2,
};

class SimpleJobQueue {
  constructor(options = {}) {
    this.concurrency = options.concurrency || 3;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000; // Base delay in ms
    this.handlers = new Map();
    this.queue = []; // Sorted by priority
    this.activeJobs = 0;
    this.processedCount = 0;
    this.failedCount = 0;
    this.deadLetterQueue = []; // Failed jobs after max retries
    this.idempotencyKeys = new Set();
    this._processing = false;
  }

  /**
   * Register a handler for a job type.
   *
   * @param {string} type - Job type name
   * @param {Function} handler - Async function to process the job
   */
  register(type, handler) {
    this.handlers.set(type, handler);
    logger.debug(`Registered handler for job type: ${type}`);
  }

  /**
   * Add a job to the queue.
   *
   * @param {string} type - Job type name
   * @param {Object} data - Job payload
   * @param {Object} [options]
   * @param {string} [options.priority='normal'] - 'high', 'normal', 'low'
   * @param {number} [options.retries] - Max retry attempts
   * @param {number} [options.delay=0] - Delay before processing (ms)
   * @param {string} [options.idempotencyKey] - Prevent duplicate processing
   * @returns {string} Job ID
   */
  add(type, data, options = {}) {
    const {
      priority = 'normal',
      retries = this.maxRetries,
      delay = 0,
      idempotencyKey = null,
    } = options;

    // Idempotency check
    if (idempotencyKey && this.idempotencyKeys.has(idempotencyKey)) {
      logger.debug('Duplicate job skipped', { type, idempotencyKey });
      return null;
    }

    const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const job = {
      id: jobId,
      type,
      data,
      priority: PRIORITY[priority] ?? PRIORITY.normal,
      maxRetries: retries,
      attempts: 0,
      delay,
      idempotencyKey,
      createdAt: Date.now(),
      scheduledAt: Date.now() + delay,
    };

    if (idempotencyKey) {
      this.idempotencyKeys.add(idempotencyKey);
      // Auto-clear idempotency key after 1 hour
      setTimeout(() => this.idempotencyKeys.delete(idempotencyKey), 3600000);
    }

    // Insert in priority order
    const insertIdx = this.queue.findIndex((j) => j.priority > job.priority);
    if (insertIdx === -1) {
      this.queue.push(job);
    } else {
      this.queue.splice(insertIdx, 0, job);
    }

    logger.debug('Job added', { id: jobId, type, priority });

    // Trigger processing
    this._processNext();

    return jobId;
  }

  async _processNext() {
    if (this._processing) return;
    this._processing = true;

    try {
      while (this.queue.length > 0 && this.activeJobs < this.concurrency) {
        const now = Date.now();
        // Find next job that's ready to run
        const jobIndex = this.queue.findIndex((j) => j.scheduledAt <= now);
        if (jobIndex === -1) {
          // All pending jobs have delays — schedule next check
          const nextScheduled = Math.min(...this.queue.map((j) => j.scheduledAt));
          setTimeout(() => this._processNext(), nextScheduled - now + 10);
          break;
        }

        const job = this.queue.splice(jobIndex, 1)[0];
        this.activeJobs++;

        // Process asynchronously
        this._executeJob(job).finally(() => {
          this.activeJobs--;
          this._processNext();
        });
      }
    } finally {
      this._processing = false;
    }
  }

  async _executeJob(job) {
    const handler = this.handlers.get(job.type);
    if (!handler) {
      logger.error('No handler registered for job type', { type: job.type, id: job.id });
      this._moveToDeadLetter(job, new Error(`No handler for type: ${job.type}`));
      return;
    }

    job.attempts++;

    try {
      const startTime = Date.now();
      await handler(job.data, { jobId: job.id, attempt: job.attempts });
      const duration = Date.now() - startTime;

      this.processedCount++;
      logger.debug('Job completed', { id: job.id, type: job.type, duration, attempt: job.attempts });
    } catch (error) {
      logger.warn('Job failed', {
        id: job.id,
        type: job.type,
        attempt: job.attempts,
        maxRetries: job.maxRetries,
        error: error.message,
      });

      if (job.attempts < job.maxRetries) {
        // Retry with exponential backoff
        const backoffDelay = this.retryDelay * Math.pow(2, job.attempts - 1);
        job.scheduledAt = Date.now() + backoffDelay;

        logger.debug('Job scheduled for retry', {
          id: job.id,
          nextAttempt: job.attempts + 1,
          delay: backoffDelay,
        });

        this.queue.push(job);
      } else {
        this._moveToDeadLetter(job, error);
      }
    }
  }

  _moveToDeadLetter(job, error) {
    this.failedCount++;
    this.deadLetterQueue.push({
      ...job,
      error: error.message,
      failedAt: Date.now(),
    });

    // Keep DLQ bounded
    if (this.deadLetterQueue.length > 100) {
      this.deadLetterQueue.shift();
    }

    logger.error('Job moved to dead letter queue', {
      id: job.id,
      type: job.type,
      attempts: job.attempts,
      error: error.message,
    });
  }

  /**
   * Get queue statistics.
   */
  getStats() {
    return {
      pending: this.queue.length,
      active: this.activeJobs,
      processed: this.processedCount,
      failed: this.failedCount,
      deadLetter: this.deadLetterQueue.length,
      registeredHandlers: Array.from(this.handlers.keys()),
    };
  }

  /**
   * Get dead letter queue entries.
   */
  getDeadLetterQueue() {
    return [...this.deadLetterQueue];
  }

  /**
   * Retry all jobs in the dead letter queue.
   */
  retryDeadLetterQueue() {
    const jobs = this.deadLetterQueue.splice(0);
    for (const job of jobs) {
      job.attempts = 0;
      job.scheduledAt = Date.now();
      this.queue.push(job);
    }
    this._processNext();
    return jobs.length;
  }
}

// Singleton instance
const jobQueue = new SimpleJobQueue();

export default jobQueue;
export { SimpleJobQueue };
