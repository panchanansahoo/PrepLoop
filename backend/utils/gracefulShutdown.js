/**
 * Graceful Shutdown Handler
 * 
 * Implements timeout-based graceful shutdown following concurrently v9 patterns:
 * 1. SIGTERM/SIGINT triggers shutdown sequence
 * 2. Provides AbortSignal for in-flight operations to respect shutdown
 * 3. Waits for in-flight requests to complete (configurable timeout)
 * 4. Closes database pools and resource handles
 * 5. Force-exit if graceful shutdown times out
 * 
 * Usage:
 *   import { setupGracefulShutdown } from './utils/gracefulShutdown.js';
 *   const abortController = setupGracefulShutdown(server, db);
 *   // In long-running operations, check abortController.signal.aborted
 */

import { createLogger } from './structuredLogger.js';

const logger = createLogger('graceful-shutdown');

class GracefulShutdownManager {
  constructor(server, options = {}) {
    this.server = server;
    this.shutdownTimeout = options.shutdownTimeout || 30000; // 30 seconds default
    this.forceExitTimeout = options.forceExitTimeout || 5000; // 5 seconds after graceful timeout
    this.abortController = new AbortController();
    this.isShuttingDown = false;
    this.inflightRequests = new Set();
    this.shutdownStartTime = null;

    // Track in-flight requests
    this.setupRequestTracking();
    
    // Register signal handlers
    this.setupSignalHandlers();
  }

  /**
   * Track in-flight HTTP requests
   * Allows us to wait for them to complete during shutdown
   */
  setupRequestTracking() {
    this.server.on('request', (req, res) => {
      const requestId = `${req.method} ${req.url}`;
      this.inflightRequests.add(requestId);

      res.on('finish', () => {
        this.inflightRequests.delete(requestId);
      });

      res.on('close', () => {
        this.inflightRequests.delete(requestId);
      });
    });
  }

  /**
   * Register SIGTERM/SIGINT handlers
   */
  setupSignalHandlers() {
    const handleShutdownSignal = (signal) => {
      if (this.isShuttingDown) {
        logger.warn(`Received ${signal} while already shutting down, force exiting`);
        process.exit(1);
      }

      logger.info(`Received ${signal}, initiating graceful shutdown`);
      this.shutdown();
    };

    process.on('SIGTERM', () => handleShutdownSignal('SIGTERM'));
    process.on('SIGINT', () => handleShutdownSignal('SIGINT'));
  }

  /**
   * Execute graceful shutdown sequence
   */
  async shutdown() {
    if (this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;
    this.shutdownStartTime = Date.now();

    logger.info('Starting graceful shutdown sequence', {
      inflightRequests: this.inflightRequests.size,
      shutdownTimeoutMs: this.shutdownTimeout,
    });

    try {
      // 1. Signal all operations to stop accepting new work
      this.abortController.abort();

      // 2. Stop accepting new connections
      await this.stopAcceptingConnections();

      // 3. Wait for in-flight requests to complete (with timeout)
      await this.waitForInflightRequests();

      // 4. Close database pools and other resources
      await this.closeResources();

      logger.info('Graceful shutdown completed', {
        durationMs: Date.now() - this.shutdownStartTime,
      });

      process.exit(0);
    } catch (err) {
      logger.error('Error during graceful shutdown', {
        error: err.message,
        stack: err.stack,
        durationMs: Date.now() - this.shutdownStartTime,
      });

      // Force exit after timeout
      this.scheduleForceExit();
    }
  }

  /**
   * Stop accepting new HTTP connections
   */
  stopAcceptingConnections() {
    return new Promise((resolve) => {
      logger.info('Stopping HTTP server from accepting new connections');
      this.server.close(() => {
        logger.info('HTTP server closed');
        resolve();
      });
    });
  }

  /**
   * Wait for all in-flight requests to complete
   * Force exit after timeout
   */
  async waitForInflightRequests() {
    const startTime = Date.now();

    while (this.inflightRequests.size > 0) {
      const elapsedMs = Date.now() - startTime;

      if (elapsedMs > this.shutdownTimeout) {
        logger.warn('Graceful shutdown timeout exceeded', {
          remainingRequests: this.inflightRequests.size,
          timeoutMs: this.shutdownTimeout,
          requests: Array.from(this.inflightRequests),
        });
        break;
      }

      logger.debug('Waiting for in-flight requests', {
        count: this.inflightRequests.size,
        elapsedMs,
        requests: Array.from(this.inflightRequests).slice(0, 5), // Log first 5
      });

      // Wait 1 second before checking again
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    logger.info('All in-flight requests completed', {
      remainingRequests: this.inflightRequests.size,
      durationMs: Date.now() - startTime,
    });
  }

  /**
   * Close database pools and other resources
   * @param {object} resources - Optional resource handles to close
   */
  async closeResources(resources = {}) {
    logger.info('Closing database pools and resources');

    try {
      // Close Supabase connection if available
      if (resources.supabaseClient) {
        logger.debug('Closing Supabase client');
        // Supabase JS client doesn't have explicit close, but we clear references
        resources.supabaseClient = null;
      }

      // Close Redis cache if available
      if (resources.redisClient?.quit) {
        logger.debug('Closing Redis client');
        await resources.redisClient.quit();
      }

      logger.info('All resources closed successfully');
    } catch (err) {
      logger.warn('Error closing resources', {
        error: err.message,
      });
      throw err;
    }
  }

  /**
   * Schedule force exit if graceful shutdown doesn't complete
   */
  scheduleForceExit() {
    logger.warn('Scheduling force exit due to shutdown errors', {
      forceExitMs: this.forceExitTimeout,
    });

    setTimeout(() => {
      logger.error('Forcing process exit after graceful shutdown timeout');
      process.exit(1);
    }, this.forceExitTimeout);
  }

  /**
   * Get the AbortSignal for use in long-running operations
   * Operations should check signal.aborted and stop work
   */
  getAbortSignal() {
    return this.abortController.signal;
  }

  /**
   * Get shutdown status info
   */
  getShutdownStatus() {
    return {
      isShuttingDown: this.isShuttingDown,
      inflightRequests: this.inflightRequests.size,
      elapsedMs: this.isShuttingDown ? Date.now() - this.shutdownStartTime : 0,
    };
  }
}

/**
 * Setup and return graceful shutdown manager
 * @param {object} server - Express server instance
 * @param {object} options - Configuration options
 * @returns {GracefulShutdownManager} Manager with abort signal
 */
export function setupGracefulShutdown(server, options = {}) {
  const manager = new GracefulShutdownManager(server, options);
  return manager;
}

export default GracefulShutdownManager;
