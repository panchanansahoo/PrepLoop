/**
 * Circuit Breaker Pattern
 *
 * Wraps external API calls (Groq, Gemini, RapidAPI, etc.) to prevent
 * cascading failures when third-party services are down.
 *
 * States:
 *   CLOSED  → Normal operation. Failures are counted.
 *   OPEN    → Service considered down. All calls fail fast with fallback.
 *   HALF_OPEN → Testing recovery. One probe request is allowed through.
 *
 * Usage:
 *   import { CircuitBreaker } from '../utils/circuitBreaker.js';
 *
 *   const groqBreaker = new CircuitBreaker('groq', {
 *     failureThreshold: 5,
 *     resetTimeout: 30000,
 *     fallback: () => ({ error: 'AI service temporarily unavailable' }),
 *   });
 *
 *   const result = await groqBreaker.execute(() => groqClient.chat(...));
 */

import { createLogger } from './structuredLogger.js';

const logger = createLogger('circuit-breaker');

const STATE = {
  CLOSED: 'CLOSED',
  OPEN: 'OPEN',
  HALF_OPEN: 'HALF_OPEN',
};

export class CircuitBreaker {
  /**
   * @param {string} name - Identifier for this breaker (e.g., 'groq', 'gemini')
   * @param {Object} options
   * @param {number} [options.failureThreshold=5] - Failures before opening circuit
   * @param {number} [options.resetTimeout=30000] - Ms before trying half-open
   * @param {number} [options.halfOpenMax=1] - Max concurrent probes in half-open
   * @param {Function} [options.fallback] - Fallback function when circuit is open
   * @param {Function} [options.onStateChange] - Callback on state transitions
   */
  constructor(name, options = {}) {
    this.name = name;
    this.state = STATE.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.halfOpenAttempts = 0;

    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 30000;
    this.halfOpenMax = options.halfOpenMax || 1;
    this.fallback = options.fallback || null;
    this.onStateChange = options.onStateChange || null;
  }

  /**
   * Execute a function through the circuit breaker.
   *
   * @param {Function} fn - Async function to execute
   * @returns {Promise<any>} Result of fn or fallback
   */
  async execute(fn) {
    // Check if we should transition from OPEN → HALF_OPEN
    if (this.state === STATE.OPEN) {
      if (Date.now() - this.lastFailureTime >= this.resetTimeout) {
        this._transition(STATE.HALF_OPEN);
      } else {
        // Circuit is open — fail fast
        logger.warn(`Circuit ${this.name} is OPEN — failing fast`, {
          failureCount: this.failureCount,
          lastFailure: this.lastFailureTime,
          nextRetry: this.lastFailureTime + this.resetTimeout,
        });

        if (this.fallback) return this.fallback();
        throw new Error(`Service ${this.name} is temporarily unavailable (circuit open)`);
      }
    }

    // Check half-open concurrency limit
    if (this.state === STATE.HALF_OPEN && this.halfOpenAttempts >= this.halfOpenMax) {
      if (this.fallback) return this.fallback();
      throw new Error(`Service ${this.name} is recovering (circuit half-open)`);
    }

    try {
      if (this.state === STATE.HALF_OPEN) {
        this.halfOpenAttempts++;
      }

      const result = await fn();
      this._onSuccess();
      return result;
    } catch (error) {
      this._onFailure(error);
      throw error;
    }
  }

  _onSuccess() {
    this.failureCount = 0;
    this.halfOpenAttempts = 0;

    if (this.state !== STATE.CLOSED) {
      this._transition(STATE.CLOSED);
    }

    this.successCount++;
  }

  _onFailure(error) {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    this.halfOpenAttempts = 0;

    logger.warn(`Circuit ${this.name} failure #${this.failureCount}`, {
      error: error.message,
      threshold: this.failureThreshold,
      state: this.state,
    });

    if (this.failureCount >= this.failureThreshold && this.state === STATE.CLOSED) {
      this._transition(STATE.OPEN);
    }

    // If half-open probe fails, go back to OPEN
    if (this.state === STATE.HALF_OPEN) {
      this._transition(STATE.OPEN);
    }
  }

  _transition(newState) {
    const oldState = this.state;
    this.state = newState;

    logger.info(`Circuit ${this.name}: ${oldState} → ${newState}`, {
      failureCount: this.failureCount,
      successCount: this.successCount,
    });

    if (this.onStateChange) {
      this.onStateChange(this.name, oldState, newState);
    }
  }

  /**
   * Get current circuit breaker status.
   */
  getStatus() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      config: {
        failureThreshold: this.failureThreshold,
        resetTimeout: this.resetTimeout,
      },
    };
  }

  /**
   * Manually reset the circuit breaker to CLOSED state.
   */
  reset() {
    this.failureCount = 0;
    this.successCount = 0;
    this.halfOpenAttempts = 0;
    this.lastFailureTime = null;
    this._transition(STATE.CLOSED);
  }
}

// ============================================================
// Pre-configured circuit breakers for external services
// ============================================================

export const circuitBreakers = {
  groq: new CircuitBreaker('groq', {
    failureThreshold: 5,
    resetTimeout: 30000,
    fallback: () => ({ error: 'AI service temporarily unavailable', fallback: true }),
  }),

  gemini: new CircuitBreaker('gemini', {
    failureThreshold: 5,
    resetTimeout: 30000,
    fallback: () => ({ error: 'AI service temporarily unavailable', fallback: true }),
  }),

  rapidapi: new CircuitBreaker('rapidapi', {
    failureThreshold: 3,
    resetTimeout: 60000,
    fallback: () => ({ jobs: [], error: 'Job search temporarily unavailable', fallback: true }),
  }),

  adzuna: new CircuitBreaker('adzuna', {
    failureThreshold: 3,
    resetTimeout: 60000,
    fallback: () => ({ jobs: [], error: 'Job search temporarily unavailable', fallback: true }),
  }),

  elevenlabs: new CircuitBreaker('elevenlabs', {
    failureThreshold: 3,
    resetTimeout: 45000,
    fallback: null, // Will fall back to next TTS provider in chain
  }),
};

/**
 * Get status of all circuit breakers.
 */
export function getAllCircuitBreakerStatus() {
  return Object.values(circuitBreakers).map((cb) => cb.getStatus());
}

export default { CircuitBreaker, circuitBreakers, getAllCircuitBreakerStatus };
