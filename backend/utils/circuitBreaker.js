/**
 * Simple circuit breaker for external API calls.
 * States: CLOSED (normal) → OPEN (failing) → HALF_OPEN (testing recovery)
 */

const STATES = { CLOSED: 'CLOSED', OPEN: 'OPEN', HALF_OPEN: 'HALF_OPEN' };

export class CircuitBreaker {
  constructor(name, options = {}) {
    this.name = name;
    this.state = STATES.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    
    // Configuration
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 30000; // 30s
    this.halfOpenMaxAttempts = options.halfOpenMaxAttempts || 2;
    this.halfOpenSuccesses = 0;
  }

  async execute(fn) {
    if (this.state === STATES.OPEN) {
      // Check if enough time has passed to try again
      if (Date.now() - this.lastFailureTime >= this.resetTimeout) {
        this.state = STATES.HALF_OPEN;
        this.halfOpenSuccesses = 0;
      } else {
        throw new CircuitBreakerOpenError(
          `Circuit breaker '${this.name}' is OPEN. Retry after ${Math.ceil((this.resetTimeout - (Date.now() - this.lastFailureTime)) / 1000)}s`
        );
      }
    }

    try {
      const result = await fn();
      this._onSuccess();
      return result;
    } catch (error) {
      this._onFailure();
      throw error;
    }
  }

  _onSuccess() {
    if (this.state === STATES.HALF_OPEN) {
      this.halfOpenSuccesses++;
      if (this.halfOpenSuccesses >= this.halfOpenMaxAttempts) {
        this.state = STATES.CLOSED;
        this.failureCount = 0;
      }
    } else {
      this.failureCount = 0;
    }
    this.successCount++;
  }

  _onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.failureThreshold) {
      this.state = STATES.OPEN;
    }
  }

  getStatus() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
    };
  }

  reset() {
    this.state = STATES.CLOSED;
    this.failureCount = 0;
    this.halfOpenSuccesses = 0;
  }
}

export class CircuitBreakerOpenError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CircuitBreakerOpenError';
    this.isCircuitBreakerError = true;
  }
}

// Pre-configured breakers for known external services
export const breakers = {
  gemini: new CircuitBreaker('gemini', { failureThreshold: 5, resetTimeout: 60000 }),
  groq: new CircuitBreaker('groq', { failureThreshold: 5, resetTimeout: 30000 }),
  elevenLabs: new CircuitBreaker('elevenLabs', { failureThreshold: 3, resetTimeout: 60000 }),
  razorpay: new CircuitBreaker('razorpay', { failureThreshold: 3, resetTimeout: 30000 }),
};

// Get all breaker statuses for health check
export function getAllBreakerStatuses() {
  return Object.fromEntries(
    Object.entries(breakers).map(([key, breaker]) => [key, breaker.getStatus()])
  );
}
