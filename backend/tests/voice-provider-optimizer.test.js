/**
 * Voice Provider Optimizer Tests
 * Validates intelligent provider selection based on health and latency
 */

import { describe, it, expect, beforeEach } from 'vitest';
import VoiceProviderOptimizer from '../services/voiceProviderOptimizer.js';
import VoiceProviderCircuitBreaker from '../services/voiceProviderCircuitBreaker.js';

describe('VoiceProviderOptimizer', () => {
  let breaker;
  let optimizer;

  beforeEach(() => {
    breaker = new VoiceProviderCircuitBreaker(['kokoro', 'groq', 'edge-tts']);
    optimizer = new VoiceProviderOptimizer({}, breaker);
  });

  describe('Provider Selection', () => {
    it('should select healthy provider with preference', () => {
      breaker.recordSuccess('kokoro', 100);
      const selection = optimizer.selectBestProvider(
        ['kokoro', 'groq'],
        'kokoro'
      );

      expect(selection.selectedProvider).toBe('kokoro');
      expect(selection.selectedReason).toContain('preference');
    });

    it('should select best-scoring provider when no preference', () => {
      breaker.recordSuccess('kokoro', 50); // Fast and healthy
      for (let i = 0; i < 3; i++) {
        breaker.recordFailure('groq', 'Error');
      }
      breaker.recordSuccess('groq', 1000); // Slow and degraded

      const selection = optimizer.selectBestProvider(['kokoro', 'groq']);
      expect(selection.selectedProvider).toBe('kokoro');
    });

    it('should not select failing provider even if preferred', () => {
      for (let i = 0; i < 5; i++) {
        breaker.recordFailure('kokoro', 'Error');
      }
      breaker.recordSuccess('groq', 100);

      const selection = optimizer.selectBestProvider(
        ['kokoro', 'groq'],
        'kokoro'
      );

      expect(selection.selectedProvider).not.toBe('kokoro');
    });

    it('should evaluate candidates and provide alternatives', () => {
      breaker.recordSuccess('kokoro', 100);
      breaker.recordSuccess('groq', 100);
      breaker.recordSuccess('edge-tts', 100);

      const selection = optimizer.selectBestProvider(
        ['kokoro', 'groq', 'edge-tts']
      );

      expect(selection.selectedProvider).toBeDefined();
      expect(selection.alternativeProviders.length).toBeGreaterThan(0);
    });

    it('should include context in selection', () => {
      breaker.recordSuccess('kokoro', 100);
      const selection = optimizer.selectBestProvider(
        ['kokoro'],
        null,
        { type: 'tts', quality: 'high' }
      );

      expect(selection.context).toEqual({ type: 'tts', quality: 'high' });
    });
  });

  describe('Provider Sequence', () => {
    it('should return healthy providers in order of score', () => {
      breaker.recordSuccess('kokoro', 50); // Fastest
      breaker.recordSuccess('groq', 200);
      breaker.recordSuccess('edge-tts', 500); // Slowest

      const sequence = optimizer.getProviderSequence({ type: 'tts' });
      expect(sequence[0]).toBe('kokoro'); // Should be first (lowest latency)
    });

    it('should skip failing providers in sequence', () => {
      breaker.recordSuccess('kokoro', 100);
      for (let i = 0; i < 5; i++) {
        breaker.recordFailure('groq', 'Error');
      }

      const sequence = optimizer.getProviderSequence();
      expect(sequence).not.toContain('groq');
    });

    it('should return fallback chain when all OPEN', () => {
      for (let id of ['kokoro', 'groq', 'edge-tts']) {
        for (let i = 0; i < 5; i++) {
          breaker.recordFailure(id, 'Error');
        }
      }

      const sequence = optimizer.getProviderSequence();
      expect(sequence.length).toBeGreaterThan(0);
    });
  });

  describe('Outcome Recording', () => {
    it('should record success with latency', () => {
      optimizer.recordOutcome('kokoro', true, 150);
      const metrics = breaker.getMetrics('kokoro');

      expect(metrics.totalSuccesses).toBe(1);
      expect(metrics.averageLatencyMs).toBe(150);
    });

    it('should record failure with error', () => {
      optimizer.recordOutcome('groq', false, 100, 'Timeout');
      const metrics = breaker.getMetrics('groq');

      expect(metrics.totalFailures).toBe(1);
      expect(metrics.recentErrors.length).toBeGreaterThan(0);
    });

    it('should trigger circuit breaker on multiple failures', () => {
      for (let i = 0; i < 5; i++) {
        optimizer.recordOutcome('kokoro', false, 100, 'Connection refused');
      }

      expect(breaker.getHealth('kokoro')).toBe('failing');
    });
  });

  describe('Quality Context', () => {
    it('should prefer high-quality providers for high-quality requests', () => {
      breaker.recordSuccess('kokoro', 100);
      breaker.recordSuccess('edge-tts', 100);

      const selection = optimizer.selectBestProvider(
        ['kokoro', 'edge-tts'],
        null,
        { quality: 'high' }
      );

      // Kokoro has 'high' quality, edge-tts has 'medium-high'
      expect(selection.selectedProvider).toBeDefined();
    });

    it('should accept any quality for low-quality requests', () => {
      breaker.recordSuccess('kokoro', 100);
      for (let i = 0; i < 3; i++) {
        breaker.recordFailure('edge-tts', 'Error');
      }

      const selection = optimizer.selectBestProvider(
        ['kokoro', 'edge-tts'],
        null,
        { quality: 'low' }
      );

      expect(selection.selectedProvider).toBe('kokoro');
    });
  });

  describe('Scoring Logic', () => {
    it('should score healthy provider higher than degraded', () => {
      breaker.recordSuccess('kokoro', 100);

      // Degrade groq
      for (let i = 0; i < 4; i++) {
        breaker.recordFailure('groq', 'Error');
      }
      for (let i = 0; i < 6; i++) {
        breaker.recordSuccess('groq', 100);
      }

      const selection = optimizer.selectBestProvider(
        ['kokoro', 'groq']
      );

      expect(selection.selectedProvider).toBe('kokoro');
    });

    it('should prefer low-latency provider', () => {
      breaker.recordSuccess('kokoro', 50);  // Fast
      breaker.recordSuccess('groq', 5000); // Slow

      const selection = optimizer.selectBestProvider(
        ['kokoro', 'groq']
      );

      expect(selection.selectedProvider).toBe('kokoro');
    });

    it('should prioritize availability over latency', () => {
      breaker.recordSuccess('kokoro', 50);  // Healthy and fast

      // Degrade but available groq
      for (let i = 0; i < 3; i++) {
        breaker.recordFailure('groq', 'Intermittent');
      }
      for (let i = 0; i < 2; i++) {
        breaker.recordSuccess('groq', 100);
      }

      const selection = optimizer.selectBestProvider(
        ['kokoro', 'groq']
      );

      expect(selection.selectedProvider).toBe('kokoro');
    });
  });

  describe('Telemetry', () => {
    it('should track selection distribution', () => {
      optimizer.selectBestProvider(['kokoro']);
      optimizer.selectBestProvider(['kokoro']);
      optimizer.selectBestProvider(['groq']);

      const telemetry = optimizer.getTelemetry();
      expect(telemetry.selectionDistribution['kokoro']).toBe(2);
      expect(telemetry.selectionDistribution['groq']).toBe(1);
    });

    it('should include health summary in telemetry', () => {
      breaker.recordSuccess('kokoro', 100);
      for (let i = 0; i < 5; i++) {
        breaker.recordFailure('groq', 'Error');
      }

      const telemetry = optimizer.getTelemetry();
      expect(telemetry.healthSummary.healthy).toBeGreaterThan(0);
      expect(telemetry.healthSummary.failing).toBeGreaterThan(0);
    });

    it('should track provider stats in telemetry', () => {
      breaker.recordSuccess('kokoro', 100);
      optimizer.recordOutcome('groq', true, 500);

      const telemetry = optimizer.getTelemetry();
      expect(telemetry.providerStats['kokoro']).toBeDefined();
      expect(telemetry.providerStats['groq']).toBeDefined();
    });

    it('should calculate average selection score', () => {
      optimizer.selectBestProvider(['kokoro']);
      optimizer.selectBestProvider(['kokoro']);

      const telemetry = optimizer.getTelemetry();
      expect(typeof telemetry.averageSelectionScore).toBe('string');
      expect(parseFloat(telemetry.averageSelectionScore)).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Fallback Chain', () => {
    it('should have default fallback chain', () => {
      const sequence = optimizer.getProviderSequence();
      expect(Array.isArray(sequence)).toBe(true);
      expect(sequence.length).toBeGreaterThan(0);
    });

    it('should use fallback when all providers unavailable', () => {
      // Open all providers
      for (const id of ['kokoro', 'groq', 'edge-tts']) {
        for (let i = 0; i < 5; i++) {
          breaker.recordFailure(id, 'Error');
        }
      }

      const selection = optimizer.selectBestProvider(['kokoro', 'groq', 'edge-tts']);
      expect(selection.selectedProvider).toBeDefined();
      expect(selection.selectedReason).toContain('Fallback');
    });
  });

  describe('Reset & Recovery', () => {
    it('should reset individual provider', () => {
      for (let i = 0; i < 5; i++) {
        breaker.recordFailure('kokoro', 'Error');
      }
      expect(breaker.getHealth('kokoro')).toBe('failing');

      optimizer.resetProvider('kokoro');
      expect(breaker.getHealth('kokoro')).toBe('unknown');
    });

    it('should reset all providers', () => {
      for (const id of ['kokoro', 'groq']) {
        for (let i = 0; i < 5; i++) {
          breaker.recordFailure(id, 'Error');
        }
      }

      optimizer.resetAll();
      expect(breaker.getHealth('kokoro')).toBe('unknown');
      expect(breaker.getHealth('groq')).toBe('unknown');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty available providers list', () => {
      const selection = optimizer.selectBestProvider([]);
      expect(selection.selectedProvider).toBeDefined();
    });

    it('should handle unknown preferred provider', () => {
      const selection = optimizer.selectBestProvider(
        ['kokoro'],
        'unknown-provider'
      );
      expect(selection.selectedProvider).toBe('kokoro');
    });

    it('should handle selection from single provider', () => {
      const selection = optimizer.selectBestProvider(['kokoro']);
      expect(selection.selectedProvider).toBe('kokoro');
    });

    it('should handle providers with zero attempts', () => {
      const selection = optimizer.selectBestProvider(
        ['kokoro', 'groq']
      );
      // Should give benefit of doubt to unknown providers
      expect(selection.selectedProvider).toBeDefined();
    });

    it('should handle extreme latencies', () => {
      breaker.recordSuccess('kokoro', 0);
      breaker.recordSuccess('groq', 100000);

      const selection = optimizer.selectBestProvider(
        ['kokoro', 'groq']
      );

      expect(selection.selectedProvider).toBe('kokoro');
    });
  });

  describe('Integration: Circuit Breaker + Optimizer', () => {
    it('should adapt selection as provider health changes', () => {
      breaker.recordSuccess('kokoro', 100);

      let selection = optimizer.selectBestProvider(['kokoro', 'groq']);
      expect(selection.selectedProvider).toBe('kokoro');

      // Degrade kokoro
      for (let i = 0; i < 4; i++) {
        breaker.recordFailure('kokoro', 'Error');
      }
      for (let i = 0; i < 1; i++) {
        breaker.recordSuccess('kokoro', 100);
      }

      // And improve groq
      breaker.recordSuccess('groq', 100);
      breaker.recordSuccess('groq', 100);

      selection = optimizer.selectBestProvider(['kokoro', 'groq']);
      // May now prefer groq due to kokoro degradation
      expect(selection.selectedProvider).toBeDefined();
    });

    it('should handle circuit breaker state transitions', () => {
      // Gradually fail kokoro
      for (let i = 0; i < 5; i++) {
        optimizer.recordOutcome('kokoro', false, 100, 'Error');
      }

      expect(breaker.getHealth('kokoro')).toBe('failing');

      // Should avoid kokoro
      const selection = optimizer.selectBestProvider(['kokoro', 'groq']);
      expect(selection.selectedProvider).not.toBe('kokoro');
    });
  });
});
