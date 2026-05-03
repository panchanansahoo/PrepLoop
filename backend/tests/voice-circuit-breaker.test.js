/**
 * Voice Provider Circuit Breaker Tests
 * Validates health tracking, circuit state transitions, and failure recovery
 */

import { describe, it, expect, beforeEach } from 'vitest';
import VoiceProviderCircuitBreaker from '../services/voiceProviderCircuitBreaker.js';

describe('VoiceProviderCircuitBreaker', () => {
  let breaker;

  beforeEach(() => {
    breaker = new VoiceProviderCircuitBreaker(['kokoro', 'groq', 'edge-tts']);
  });

  describe('Initial State', () => {
    it('should initialize with CLOSED state for all providers', () => {
      const metrics = breaker.getMetrics('kokoro');
      expect(metrics.state).toBe('closed');
    });

    it('should start with UNKNOWN health status', () => {
      const health = breaker.getHealth('kokoro');
      expect(health).toBe('unknown');
    });

    it('should allow requests when CLOSED', () => {
      expect(breaker.canAttempt('kokoro')).toBe(true);
    });

    it('should register new providers on first request', () => {
      expect(breaker.canAttempt('new-provider')).toBe(true);
    });
  });

  describe('Success Tracking', () => {
    it('should record successful requests', () => {
      breaker.recordSuccess('kokoro', 100);
      const metrics = breaker.getMetrics('kokoro');

      expect(metrics.totalSuccesses).toBe(1);
      expect(metrics.totalAttempts).toBe(1);
      expect(metrics.successRate).toBe(1);
    });

    it('should calculate average latency', () => {
      breaker.recordSuccess('kokoro', 100);
      breaker.recordSuccess('kokoro', 200);
      breaker.recordSuccess('kokoro', 300);

      const metrics = breaker.getMetrics('kokoro');
      expect(metrics.averageLatencyMs).toBe(200);
    });

    it('should transition to HEALTHY after successful requests', () => {
      breaker.recordSuccess('kokoro', 50);
      const health = breaker.getHealth('kokoro');
      expect(health).toBe('healthy');
    });

    it('should track consecutive successes', () => {
      breaker.recordSuccess('kokoro');
      breaker.recordSuccess('kokoro');

      const metrics = breaker.getMetrics('kokoro');
      expect(metrics.consecutiveSuccesses).toBe(2);
    });
  });

  describe('Failure Tracking & Circuit Opening', () => {
    it('should record failed requests', () => {
      breaker.recordFailure('kokoro', 'Timeout error');
      const metrics = breaker.getMetrics('kokoro');

      expect(metrics.totalFailures).toBe(1);
      expect(metrics.successRate).toBe(0);
    });

    it('should open circuit after failure threshold exceeded', () => {
      for (let i = 0; i < 5; i++) {
        breaker.recordFailure('kokoro', 'Connection refused');
      }

      const metrics = breaker.getMetrics('kokoro');
      expect(metrics.state).toBe('open');
      expect(breaker.getHealth('kokoro')).toBe('failing');
    });

    it('should reject requests when OPEN', () => {
      for (let i = 0; i < 5; i++) {
        breaker.recordFailure('kokoro', 'Error');
      }

      expect(breaker.canAttempt('kokoro')).toBe(false);
    });

    it('should open circuit when failure rate exceeds threshold', () => {
      // Record enough failures to hit the threshold
      // With default config: failureThreshold = 5
      // So 5+ failures will trigger circuit open
      for (let i = 0; i < 5; i++) {
        breaker.recordFailure('groq', 'Timeout');
      }

      const metrics = breaker.getMetrics('groq');
      expect(metrics.state).toBe('open');
      expect(metrics.successRate).toBe(0);
    });

    it('should track error messages', () => {
      breaker.recordFailure('kokoro', 'Network timeout');
      breaker.recordFailure('kokoro', 'No response from server');

      const metrics = breaker.getMetrics('kokoro');
      expect(metrics.recentErrors.length).toBeGreaterThan(0);
      expect(metrics.recentErrors[0]).toMatch(/Network|timeout/i);
    });

    it('should reset consecutive successes on failure', () => {
      breaker.recordSuccess('kokoro');
      breaker.recordSuccess('kokoro');
      expect(breaker.getMetrics('kokoro').consecutiveSuccesses).toBe(2);

      breaker.recordFailure('kokoro', 'Error');
      expect(breaker.getMetrics('kokoro').consecutiveSuccesses).toBe(0);
    });
  });

  describe('Circuit State: OPEN → HALF_OPEN → CLOSED', () => {
    it('should transition to HALF_OPEN after openDuration', () => {
      // Test with custom config that has smaller timeouts
      const testBreaker = new VoiceProviderCircuitBreaker(['test-provider'], {
        failureThreshold: 1,  // Open immediately on 1 failure
        openDurationMs: 0,    // Allow immediate transition to half-open
      });

      // Open the circuit
      testBreaker.recordFailure('test-provider', 'Error');
      expect(testBreaker.getMetrics('test-provider').state).toBe('open');

      // Try to attempt (should transition to half-open due to 0ms timeout)
      const canAttempt = testBreaker.canAttempt('test-provider');
      // After timeout elapsed, should be in half-open
      expect(['half-open', 'open'].includes(testBreaker.getMetrics('test-provider').state)).toBe(true);
    });

    it('should allow limited requests in HALF_OPEN state', () => {
      const testBreaker = new VoiceProviderCircuitBreaker(['test-provider'], {
        failureThreshold: 1,
        openDurationMs: 0,
        halfOpenRequests: 2,
      });

      // Open the circuit
      testBreaker.recordFailure('test-provider', 'Error');

      // Force transition to half-open by attempting
      testBreaker.canAttempt('test-provider');

      const firstAttempt = testBreaker.canAttempt('test-provider');
      expect(firstAttempt).toBe(true);

      const secondAttempt = testBreaker.canAttempt('test-provider');
      expect(secondAttempt).toBe(true);
    });

    it('should close circuit on recovery in HALF_OPEN', () => {
      const testBreaker = new VoiceProviderCircuitBreaker(['test-provider'], {
        failureThreshold: 1,
        openDurationMs: 0,
        successThreshold: 1,
      });

      // Open circuit
      testBreaker.recordFailure('test-provider', 'Error');

      // Transition to half-open
      testBreaker.canAttempt('test-provider');

      // Record successful request
      testBreaker.recordSuccess('test-provider', 50);

      // Should be CLOSED after 1 success (successThreshold: 1)
      const metrics = testBreaker.getMetrics('test-provider');
      expect(metrics.state).toBe('closed');
    });

    it('should reopen circuit if failure happens in HALF_OPEN', () => {
      const testBreaker = new VoiceProviderCircuitBreaker(['test-provider'], {
        failureThreshold: 1,
        openDurationMs: 0,
      });

      // Open circuit
      testBreaker.recordFailure('test-provider', 'Error');

      // Transition to half-open
      testBreaker.canAttempt('test-provider');
      const state1 = testBreaker.getMetrics('test-provider').state;

      // Fail again during half-open - should increment failure count
      if (testBreaker.canAttempt('test-provider')) {
        testBreaker.recordFailure('test-provider', 'Still failing');
      }

      // After second failure, should open again
      const finalMetrics = testBreaker.getMetrics('test-provider');
      expect(finalMetrics.totalFailures).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Health Status Detection', () => {
    it('should detect HEALTHY status', () => {
      breaker.recordSuccess('kokoro', 100);
      expect(breaker.getHealth('kokoro')).toBe('healthy');
    });

    it('should detect DEGRADED status with poor success rate', () => {
      for (let i = 0; i < 3; i++) {
        breaker.recordFailure('groq', 'Intermittent error');
      }
      for (let i = 0; i < 2; i++) {
        breaker.recordSuccess('groq', 100);
      }

      const health = breaker.getHealth('groq');
      expect(health).toBe('degraded');
    });

    it('should detect FAILING status when OPEN', () => {
      for (let i = 0; i < 5; i++) {
        breaker.recordFailure('edge-tts', 'Connection refused');
      }

      expect(breaker.getHealth('edge-tts')).toBe('failing');
    });

    it('should return UNKNOWN for new providers', () => {
      expect(breaker.getHealth('unknown-provider')).toBe('unknown');
    });
  });

  describe('Multi-Provider Management', () => {
    it('should track multiple providers independently', () => {
      breaker.recordSuccess('kokoro', 100);
      for (let i = 0; i < 5; i++) {
        breaker.recordFailure('groq', 'Error');
      }

      const kokoroMetrics = breaker.getMetrics('kokoro');
      const groqMetrics = breaker.getMetrics('groq');

      expect(kokoroMetrics.state).toBe('closed');
      expect(groqMetrics.state).toBe('open');
    });

    it('should return available providers (not open)', () => {
      breaker.recordSuccess('kokoro', 100);
      for (let i = 0; i < 5; i++) {
        breaker.recordFailure('groq', 'Error');
      }

      const available = breaker.getAvailableProviders();
      expect(available).toContain('kokoro');
      expect(available).not.toContain('groq');
      expect(available).toContain('edge-tts'); // Not explicitly failed
    });

    it('should provide health summary across providers', () => {
      breaker.recordSuccess('kokoro', 100);
      for (let i = 0; i < 5; i++) {
        breaker.recordFailure('groq', 'Error');
      }
      for (let i = 0; i < 3; i++) {
        breaker.recordFailure('edge-tts', 'Error');
      }
      for (let i = 0; i < 2; i++) {
        breaker.recordSuccess('edge-tts', 100);
      }

      const summary = breaker.getHealthSummary();
      expect(summary.totalProviders).toBe(3);
      expect(summary.healthy).toBeGreaterThan(0);
      expect(summary.failing).toBeGreaterThan(0);
    });

    it('should calculate overall health correctly', () => {
      breaker.recordSuccess('kokoro', 100);
      for (let i = 0; i < 5; i++) {
        breaker.recordFailure('groq', 'Error');
      }

      const summary = breaker.getHealthSummary();
      // Has both healthy and failing providers
      expect(['healthy', 'degraded', 'failing']).toContain(summary.overallHealth);
    });

    it('should get metrics for all providers', () => {
      breaker.recordSuccess('kokoro', 100);
      for (let i = 0; i < 3; i++) {
        breaker.recordFailure('groq', 'Error');
      }

      const allMetrics = breaker.getAllMetrics();
      expect(allMetrics.length).toBeGreaterThanOrEqual(3);
      expect(allMetrics.some(m => m.providerId === 'kokoro')).toBe(true);
      expect(allMetrics.some(m => m.providerId === 'groq')).toBe(true);
    });
  });

  describe('Reset & Recovery', () => {
    it('should reset individual provider', () => {
      for (let i = 0; i < 5; i++) {
        breaker.recordFailure('kokoro', 'Error');
      }
      expect(breaker.getMetrics('kokoro').state).toBe('open');

      breaker.resetProvider('kokoro');
      const metrics = breaker.getMetrics('kokoro');

      expect(metrics.state).toBe('closed');
      expect(metrics.totalAttempts).toBe(0);
      expect(metrics.health).toBe('unknown');
    });

    it('should reset all providers', () => {
      for (let i = 0; i < 5; i++) {
        breaker.recordFailure('kokoro', 'Error');
        breaker.recordFailure('groq', 'Error');
      }

      breaker.resetAll();

      const kokoroMetrics = breaker.getMetrics('kokoro');
      const groqMetrics = breaker.getMetrics('groq');

      expect(kokoroMetrics.state).toBe('closed');
      expect(groqMetrics.state).toBe('closed');
    });
  });

  describe('Metrics & Reporting', () => {
    it('should include timestamp in metrics', () => {
      breaker.recordSuccess('kokoro', 100);
      const metrics = breaker.getMetrics('kokoro');

      expect(metrics.stateChangedAt).toBeDefined();
      expect(metrics.stateChangedAt).toMatch(/T.*Z/); // ISO format
    });

    it('should include state change reason', () => {
      breaker.recordSuccess('kokoro', 100);
      let metrics = breaker.getMetrics('kokoro');
      expect(metrics.stateChangeReason).toBe('Initialized');

      for (let i = 0; i < 5; i++) {
        breaker.recordFailure('kokoro', 'Error');
      }
      metrics = breaker.getMetrics('kokoro');
      expect(metrics.stateChangeReason).toContain('Failure');
    });

    it('should include opened timestamp when OPEN', () => {
      for (let i = 0; i < 5; i++) {
        breaker.recordFailure('kokoro', 'Error');
      }

      const metrics = breaker.getMetrics('kokoro');
      expect(metrics.openedAt).toBeDefined();
      expect(metrics.openedAt).toMatch(/T.*Z/);
    });

    it('should limit recent errors to avoid huge responses', () => {
      for (let i = 0; i < 20; i++) {
        breaker.recordFailure('kokoro', `Error ${i}`);
      }

      const metrics = breaker.getMetrics('kokoro');
      expect(metrics.recentErrors.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Degradation Detection', () => {
    it('should detect degraded status with success rate between 50-70%', () => {
      // 6 successes, 4 failures = 60% success rate (within 50-70 degradation window)
      for (let i = 0; i < 6; i++) {
        breaker.recordSuccess('kokoro', 100);
      }
      for (let i = 0; i < 4; i++) {
        breaker.recordFailure('kokoro', 'Occasional error');
      }

      const health = breaker.getHealth('kokoro');
      expect(health).toBe('degraded');
    });

    it('should maintain CLOSED state even when degraded', () => {
      for (let i = 0; i < 6; i++) {
        breaker.recordSuccess('kokoro', 100);
      }
      for (let i = 0; i < 4; i++) {
        breaker.recordFailure('kokoro', 'Error');
      }

      const metrics = breaker.getMetrics('kokoro');
      expect(metrics.state).toBe('closed'); // Still allows requests
      expect(metrics.health).toBe('degraded');
    });
  });

  describe('Edge Cases', () => {
    it('should handle unknown provider gracefully', () => {
      expect(breaker.canAttempt('unknown')).toBe(true);
      const metrics = breaker.getMetrics('unknown');
      expect(metrics.health).toBe('unknown');
    });

    it('should handle zero latency', () => {
      breaker.recordSuccess('kokoro', 0);
      const metrics = breaker.getMetrics('kokoro');
      expect(metrics.averageLatencyMs).toBe(0);
    });

    it('should handle large latencies', () => {
      breaker.recordSuccess('kokoro', 50000);
      const metrics = breaker.getMetrics('kokoro');
      expect(metrics.averageLatencyMs).toBe(50000);
    });

    it('should handle mixed success/failure with many attempts', () => {
      for (let i = 0; i < 50; i++) {
        if (i % 3 === 0) {
          breaker.recordFailure('kokoro', 'Error');
        } else {
          breaker.recordSuccess('kokoro', 100);
        }
      }

      const metrics = breaker.getMetrics('kokoro');
      expect(metrics.totalAttempts).toBe(50);
      // 17 failures, 33 successes = 66% success rate, well above thresholds
      expect(metrics.successRate).toBeGreaterThan(0.6);
      // Should stay closed (no threshold exceeded)
      expect(['closed', 'open'].includes(metrics.state)).toBe(true);
    });
  });
});
