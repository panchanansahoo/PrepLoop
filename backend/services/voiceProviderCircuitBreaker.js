/**
 * Voice Provider Circuit Breaker
 * Smart health tracking and failure recovery for TTS/STT providers.
 * 
 * Implements the Circuit Breaker pattern to prevent cascading failures:
 * - CLOSED: Provider working normally, requests pass through
 * - OPEN: Provider failing, requests fail fast without attempting
 * - HALF_OPEN: Testing if provider has recovered
 */

// ─── Circuit Breaker State Machine ──────────────────────────────────────

const CircuitState = {
  CLOSED: 'closed',      // Normal operation
  OPEN: 'open',          // Provider failing, reject requests
  HALF_OPEN: 'half-open', // Testing recovery
};

const HealthStatus = {
  HEALTHY: 'healthy',
  DEGRADED: 'degraded',
  FAILING: 'failing',
  UNKNOWN: 'unknown',
};

// ─── Configuration ──────────────────────────────────────────────────────

const DEFAULT_CONFIG = {
  // Failure thresholds
  failureThreshold: 5,           // Number of failures to open circuit
  failureRateThreshold: 0.5,     // 50% failure rate opens circuit
  
  // Recovery settings
  successThreshold: 2,            // Consecutive successes to close circuit
  halfOpenRequests: 3,            // Requests to allow in half-open state
  
  // Timeouts
  openDurationMs: 30000,          // 30 seconds in open state before half-open
  requestTimeoutMs: 5000,         // Individual request timeout
  
  // Health tracking
  windowSizeMs: 60000,            // 60-second rolling window
  degradationThreshold: 0.7,      // 70% success = degraded
};

// ─── Provider Health Tracker ─────────────────────────────────────────

class ProviderHealthTracker {
  constructor(providerId, config = {}) {
    this.providerId = providerId;
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    this.state = CircuitState.CLOSED;
    this.lastStateChangeTime = Date.now();
    this.stateChangeReason = 'Initialized';
    
    // Metrics tracking
    this.successCount = 0;
    this.failureCount = 0;
    this.recentAttempts = []; // [{ timestamp, success, latencyMs, error }, ...]
    
    // Recovery tracking
    this.consecutiveSuccesses = 0;
    this.openTime = null;
    this.halfOpenAttempts = 0;
  }

  /**
   * Record a successful request
   */
  recordSuccess(latencyMs = 0) {
    const now = Date.now();
    this.recentAttempts.push({
      timestamp: now,
      success: true,
      latencyMs,
      error: null,
    });
    
    this.successCount++;
    this.consecutiveSuccesses++;
    
    // Prune old attempts outside window
    this._pruneOldAttempts(now);

    // Try to recover from open/half-open states
    if (this.state === CircuitState.OPEN) {
      // Don't transition on single success; wait for half-open
      return;
    }

    if (this.state === CircuitState.HALF_OPEN) {
      this.halfOpenAttempts++;
      if (this.consecutiveSuccesses >= this.config.successThreshold) {
        this._transitionTo(CircuitState.CLOSED, 'Provider recovered');
      }
      return;
    }

    // In CLOSED state, check if we should degrade
    if (this._isHealthDegraded()) {
      // Still working but with reduced quality; stay CLOSED but track
    }
  }

  /**
   * Record a failed request
   */
  recordFailure(error, latencyMs = 0) {
    const now = Date.now();
    this.recentAttempts.push({
      timestamp: now,
      success: false,
      latencyMs,
      error: String(error),
    });
    
    this.failureCount++;
    this.consecutiveSuccesses = 0;
    
    // Prune old attempts
    this._pruneOldAttempts(now);

    // Check if we should open the circuit
    if (this._shouldOpenCircuit()) {
      this._transitionTo(CircuitState.OPEN, `Failure threshold reached: ${this.failureCount} failures`);
    }
  }

  /**
   * Check if a request should be allowed given current state
   */
  canAttemptRequest() {
    const now = Date.now();

    if (this.state === CircuitState.CLOSED) {
      return true;
    }

    if (this.state === CircuitState.OPEN) {
      // Check if enough time has passed to try recovery
      const timeSinceOpen = now - this.openTime;
      if (timeSinceOpen >= this.config.openDurationMs) {
        this._transitionTo(CircuitState.HALF_OPEN, 'Testing recovery');
        this.halfOpenAttempts = 0;
        return true;
      }
      return false;
    }

    if (this.state === CircuitState.HALF_OPEN) {
      // Allow limited requests in half-open
      return this.halfOpenAttempts < this.config.halfOpenRequests;
    }

    return false;
  }

  /**
   * Get current health status
   */
  getHealth() {
    if (this.state === CircuitState.OPEN) {
      return HealthStatus.FAILING;
    }

    if (this.state === CircuitState.HALF_OPEN) {
      return HealthStatus.DEGRADED;
    }

    if (this._isHealthDegraded()) {
      return HealthStatus.DEGRADED;
    }

    return this.recentAttempts.length === 0 ? HealthStatus.UNKNOWN : HealthStatus.HEALTHY;
  }

  /**
   * Get detailed metrics
   */
  getMetrics() {
    const successRate = this._getSuccessRate();
    const avgLatency = this._getAverageLatency();
    const recentErrors = this.recentAttempts
      .filter(a => !a.success && a.error)
      .map(a => a.error)
      .slice(-5); // Last 5 errors

    return {
      providerId: this.providerId,
      state: this.state,
      health: this.getHealth(),
      totalSuccesses: this.successCount,
      totalFailures: this.failureCount,
      totalAttempts: this.successCount + this.failureCount,
      successRate: Math.round(successRate * 100) / 100,
      averageLatencyMs: Math.round(avgLatency),
      recentAttempts: this.recentAttempts.length,
      consecutiveSuccesses: this.consecutiveSuccesses,
      openedAt: this.openTime ? new Date(this.openTime).toISOString() : null,
      stateChangedAt: new Date(this.lastStateChangeTime).toISOString(),
      stateChangeReason: this.stateChangeReason,
      recentErrors: recentErrors,
    };
  }

  // ─── Private Helpers ────────────────────────────────────────────────

  _shouldOpenCircuit() {
    const failureRate = this._getFailureRate();
    const failureCount = this.failureCount;

    // Open if failure count exceeds threshold
    if (failureCount >= this.config.failureThreshold) {
      return true;
    }

    // Open if failure rate exceeds threshold (with minimum attempts)
    if (this.recentAttempts.length >= 5 && failureRate >= this.config.failureRateThreshold) {
      return true;
    }

    return false;
  }

  _isHealthDegraded() {
    const successRate = this._getSuccessRate();
    return successRate < this.config.degradationThreshold && successRate > 0;
  }

  _transitionTo(newState, reason) {
    this.state = newState;
    this.lastStateChangeTime = Date.now();
    this.stateChangeReason = reason;
    this.consecutiveSuccesses = 0;

    if (newState === CircuitState.OPEN) {
      this.openTime = Date.now();
    }
  }

  _getSuccessRate() {
    const total = this.successCount + this.failureCount;
    if (total === 0) return 0;
    return this.successCount / total;
  }

  _getFailureRate() {
    const total = this.successCount + this.failureCount;
    if (total === 0) return 0;
    return this.failureCount / total;
  }

  _getAverageLatency() {
    if (this.recentAttempts.length === 0) return 0;
    const sum = this.recentAttempts.reduce((acc, a) => acc + a.latencyMs, 0);
    return sum / this.recentAttempts.length;
  }

  _pruneOldAttempts(now) {
    const cutoff = now - this.config.windowSizeMs;
    this.recentAttempts = this.recentAttempts.filter(a => a.timestamp > cutoff);
  }
}

// ─── Multi-Provider Circuit Breaker Manager ──────────────────────────

export class VoiceProviderCircuitBreaker {
  constructor(providerIds = [], config = {}) {
    this.providers = new Map();
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Initialize trackers for known providers
    for (const providerId of providerIds) {
      this.providers.set(providerId, new ProviderHealthTracker(providerId, this.config));
    }

    this.lastRecoveryAttempt = {};
  }

  /**
   * Register a new provider
   */
  registerProvider(providerId, config = {}) {
    if (!this.providers.has(providerId)) {
      this.providers.set(providerId, new ProviderHealthTracker(providerId, { ...this.config, ...config }));
    }
  }

  /**
   * Check if provider is available for a request
   */
  canAttempt(providerId) {
    const tracker = this.providers.get(providerId);
    if (!tracker) {
      // Unknown provider is allowed (will be registered on use)
      return true;
    }

    return tracker.canAttemptRequest();
  }

  /**
   * Record successful request
   */
  recordSuccess(providerId, latencyMs = 0) {
    if (!this.providers.has(providerId)) {
      this.registerProvider(providerId);
    }
    
    this.providers.get(providerId).recordSuccess(latencyMs);
  }

  /**
   * Record failed request
   */
  recordFailure(providerId, error, latencyMs = 0) {
    if (!this.providers.has(providerId)) {
      this.registerProvider(providerId);
    }
    
    this.providers.get(providerId).recordFailure(error, latencyMs);
  }

  /**
   * Get health status of provider
   */
  getHealth(providerId) {
    if (!this.providers.has(providerId)) {
      return HealthStatus.UNKNOWN;
    }
    
    return this.providers.get(providerId).getHealth();
  }

  /**
   * Get detailed metrics for a provider
   */
  getMetrics(providerId) {
    if (!this.providers.has(providerId)) {
      return {
        providerId,
        state: 'unknown',
        health: HealthStatus.UNKNOWN,
        totalAttempts: 0,
      };
    }

    return this.providers.get(providerId).getMetrics();
  }

  /**
   * Get metrics for all providers
   */
  getAllMetrics() {
    const metrics = [];
    for (const [providerId] of this.providers) {
      metrics.push(this.getMetrics(providerId));
    }
    return metrics;
  }

  /**
   * Get health summary across all providers
   */
  getHealthSummary() {
    const metrics = this.getAllMetrics();
    
    const summary = {
      totalProviders: metrics.length,
      healthy: 0,
      degraded: 0,
      failing: 0,
      unknown: 0,
      overallHealth: HealthStatus.UNKNOWN,
    };

    for (const m of metrics) {
      if (m.health === HealthStatus.HEALTHY) summary.healthy++;
      else if (m.health === HealthStatus.DEGRADED) summary.degraded++;
      else if (m.health === HealthStatus.FAILING) summary.failing++;
      else summary.unknown++;
    }

    // Determine overall health
    if (summary.failing === 0 && summary.healthy > 0) {
      summary.overallHealth = HealthStatus.HEALTHY;
    } else if (summary.failing === 0 && (summary.healthy > 0 || summary.degraded > 0)) {
      summary.overallHealth = HealthStatus.DEGRADED;
    } else if (summary.failing > 0) {
      summary.overallHealth = HealthStatus.FAILING;
    }

    return summary;
  }

  /**
   * Get list of available providers (not open)
   */
  getAvailableProviders() {
    return Array.from(this.providers.keys()).filter(id => this.canAttempt(id));
  }

  /**
   * Reset a provider (useful for manual recovery testing)
   */
  resetProvider(providerId) {
    if (this.providers.has(providerId)) {
      const config = this.providers.get(providerId).config;
      this.providers.set(providerId, new ProviderHealthTracker(providerId, config));
    }
  }

  /**
   * Reset all providers
   */
  resetAll() {
    for (const [providerId, tracker] of this.providers) {
      this.providers.set(providerId, new ProviderHealthTracker(providerId, tracker.config));
    }
  }
}

export default VoiceProviderCircuitBreaker;
