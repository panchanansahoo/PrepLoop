/**
 * Audio Accessibility Service Tests
 * Validates audio quality checks, device detection, and fallback transcripts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import AudioAccessibilityService from '../services/audioAccessibilityService.js';

describe('AudioAccessibilityService', () => {
  let service;

  beforeEach(() => {
    service = new AudioAccessibilityService();
  });

  describe('Audio Availability Detection', () => {
    it('should check audio availability', async () => {
      const result = await service.checkAudioAvailability('browser');

      expect(result).toHaveProperty('available');
      expect(result).toHaveProperty('reason');
      expect(result).toHaveProperty('fallbackToTranscript');
    });

    it('should indicate fallback when audio unavailable', async () => {
      const result = await service.checkAudioAvailability();

      if (!result.available) {
        expect(result.fallbackToTranscript).toBe(true);
      }
    });

    it('should handle audio check errors gracefully', async () => {
      const result = await service.checkAudioAvailability('unknown');

      expect(result.available).toBeDefined();
      expect(typeof result.reason).toBe('string');
    });
  });

  describe('Audio Quality Validation', () => {
    it('should reject empty audio buffer', () => {
      const emptyBuffer = new ArrayBuffer(0);
      const result = service.validateAudioQuality(emptyBuffer);

      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.quality).toBe('poor');
    });

    it('should detect silent audio', () => {
      // Create buffer with mostly silence (bytes near 128)
      const buffer = new ArrayBuffer(1000);
      const view = new Uint8Array(buffer);
      for (let i = 0; i < view.length; i++) {
        view[i] = 128; // Silent sample
      }

      const result = service.validateAudioQuality(buffer);
      expect(result.issues.some(i => i.includes('silent'))).toBe(true);
    });

    it('should accept normal audio', () => {
      // Create buffer with varied samples (normal audio)
      const buffer = new ArrayBuffer(64000); // ~2 seconds at 16kHz
      const view = new Uint8Array(buffer);
      for (let i = 0; i < view.length; i++) {
        // Create varied pattern, not centered at 128 (silence)
        view[i] = 80 + (Math.sin(i / 50) * 40); // Varied samples
      }

      const result = service.validateAudioQuality(buffer);
      expect(result.valid).toBe(true);
      expect(result.quality).not.toBe('poor');
    });

    it('should detect audio duration', () => {
      const buffer = new ArrayBuffer(32000); // ~1 second at 16kHz
      const result = service.validateAudioQuality(buffer);

      expect(result.estimatedDurationMs).toBeGreaterThan(0);
      expect(result.estimatedDurationMs).toBeLessThan(5000);
    });

    it('should reject audio that is too short', () => {
      const tinyBuffer = new ArrayBuffer(100); // Too short
      const result = service.validateAudioQuality(tinyBuffer);

      expect(result.valid).toBe(false);
      expect(result.issues.some(i => i.includes('too short'))).toBe(true);
    });

    it('should detect potential corruption', () => {
      // Create buffer with many repeated bytes (corruption sign)
      const buffer = new ArrayBuffer(2000);
      const view = new Uint8Array(buffer);
      for (let i = 0; i < view.length; i++) {
        view[i] = 100; // All same value
      }

      const result = service.validateAudioQuality(buffer);
      expect(result.issues.some(i => i.includes('corruption'))).toBe(true);
    });

    it('should store metrics per provider', () => {
      const buffer = new ArrayBuffer(32000);
      service.validateAudioQuality(buffer, 'kokoro');
      service.validateAudioQuality(buffer, 'groq');

      const summary = service.getQualitySummary();
      expect(summary.providerStats['kokoro']).toBeDefined();
      expect(summary.providerStats['groq']).toBeDefined();
    });
  });

  describe('Fallback Transcript Generation', () => {
    it('should generate fallback transcript', () => {
      const content = 'Tell me about your experience with distributed systems.';
      const transcript = service.generateFallbackTranscript(content, {
        stage: 'technical',
        difficulty: 'hard',
        interviewType: 'system-design',
      });

      expect(transcript).toContain('[Audio unavailable');
      expect(transcript).toContain('technical');
      expect(transcript).toContain('hard');
      expect(transcript).toContain('system-design');
      expect(transcript).toContain(content);
    });

    it('should include enabling instructions', () => {
      const transcript = service.generateFallbackTranscript('Test', {});

      expect(transcript).toContain('device settings');
      expect(transcript).toContain('browser');
    });

    it('should handle missing context gracefully', () => {
      const transcript = service.generateFallbackTranscript('Question');

      expect(transcript.length).toBeGreaterThan(0);
      expect(transcript).toContain('Question');
    });
  });

  describe('User Accessibility Preferences', () => {
    it('should set and retrieve user preferences', () => {
      service.setUserPreferences('user123', {
        speed: 1.5,
        volume: 90,
        useTranscript: true,
      });

      const prefs = service.getUserPreferences('user123');
      expect(prefs.speed).toBe(1.5);
      expect(prefs.volume).toBe(90);
      expect(prefs.useTranscript).toBe(true);
    });

    it('should validate speed range (0.5-2.0)', () => {
      service.setUserPreferences('user1', { speed: 0.1 }); // Too low
      const prefs = service.getUserPreferences('user1');
      expect(prefs.speed).toBe(0.5); // Clamped to min

      service.setUserPreferences('user2', { speed: 3.0 }); // Too high
      const prefs2 = service.getUserPreferences('user2');
      expect(prefs2.speed).toBe(2.0); // Clamped to max
    });

    it('should validate volume range (0-100)', () => {
      service.setUserPreferences('user1', { volume: -10 });
      const prefs = service.getUserPreferences('user1');
      expect(prefs.volume).toBe(0); // Clamped to min

      service.setUserPreferences('user2', { volume: 150 });
      const prefs2 = service.getUserPreferences('user2');
      expect(prefs2.volume).toBe(100); // Clamped to max
    });

    it('should return defaults for new user', () => {
      const prefs = service.getUserPreferences('unknown-user');

      expect(prefs.speed).toBe(1.0);
      expect(prefs.volume).toBe(80);
      expect(prefs.useTranscript).toBe(false);
    });

    it('should persist preferences across calls', () => {
      service.setUserPreferences('user123', { speed: 1.2, volume: 75 });
      const prefs1 = service.getUserPreferences('user123');
      const prefs2 = service.getUserPreferences('user123');

      expect(prefs1).toEqual(prefs2);
    });
  });

  describe('Quality Summary & Recommendations', () => {
    it('should generate quality summary', () => {
      const buffer = new ArrayBuffer(32000);
      service.validateAudioQuality(buffer, 'kokoro');
      service.validateAudioQuality(buffer, 'groq');

      const summary = service.getQualitySummary();
      expect(summary.providerStats).toBeDefined();
      expect(summary.overallQuality).toBeDefined();
      expect(summary.recommendActions).toBeDefined();
    });

    it('should rate excellent when all providers pass', () => {
      const goodBuffer = new ArrayBuffer(64000); // ~2 seconds
      const view = new Uint8Array(goodBuffer);
      for (let i = 0; i < view.length; i++) {
        view[i] = 80 + (Math.sin(i / 50) * 40); // Varied, not silent
      }

      service.validateAudioQuality(goodBuffer, 'kokoro');
      service.validateAudioQuality(goodBuffer, 'groq');

      const summary = service.getQualitySummary();
      expect(summary.overallQuality).toBe('excellent');
    });

    it('should rate poor when providers fail', () => {
      service.validateAudioQuality(new ArrayBuffer(0), 'kokoro');
      service.validateAudioQuality(new ArrayBuffer(0), 'groq');

      const summary = service.getQualitySummary();
      expect(summary.overallQuality).toBe('poor');
    });

    it('should recommend transcript fallback for poor quality', () => {
      service.validateAudioQuality(new ArrayBuffer(0), 'kokoro');

      const summary = service.getQualitySummary();
      expect(summary.recommendActions.length).toBeGreaterThan(0);
      expect(
        summary.recommendActions.some(a => a.includes('transcript'))
      ).toBe(true);
    });

    it('should return unknown quality when no tests', () => {
      const summary = service.getQualitySummary();
      expect(summary.overallQuality).toBe('unknown');
    });
  });

  describe('Metrics & Reset', () => {
    it('should reset metrics', () => {
      const buffer = new ArrayBuffer(32000);
      service.validateAudioQuality(buffer, 'kokoro');

      let summary = service.getQualitySummary();
      expect(Object.keys(summary.providerStats).length).toBeGreaterThan(0);

      service.resetMetrics();
      summary = service.getQualitySummary();
      expect(Object.keys(summary.providerStats).length).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null audio buffer', () => {
      const result = service.validateAudioQuality(null);

      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should handle very large audio buffer', () => {
      const largeBuffer = new ArrayBuffer(100000); // 100KB (more reasonable)
      const view = new Uint8Array(largeBuffer);
      for (let i = 0; i < Math.min(1000, view.length); i++) {
        view[i] = 80 + (Math.sin(i / 50) * 40);
      }

      const result = service.validateAudioQuality(largeBuffer);

      // Should handle gracefully
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('quality');
    });

    it('should handle special characters in transcript', () => {
      const content = `What's your experience with "async/await" & error handling?`;
      const transcript = service.generateFallbackTranscript(content);

      expect(transcript).toContain(content);
    });

    it('should handle high-frequency audio detection', () => {
      const buffer = new ArrayBuffer(64000);
      const view = new Uint8Array(buffer);
      // High-frequency pattern
      for (let i = 0; i < view.length; i++) {
        view[i] = 128 + (i % 2 === 0 ? 20 : -20);
      }

      const result = service.validateAudioQuality(buffer);

      expect(result).toHaveProperty('quality');
      expect(result.issues.length).toBeLessThan(5);
    });

    it('should ignore unknown device types', async () => {
      const result = await service.checkAudioAvailability('unknown-device');

      expect(result).toHaveProperty('available');
      expect(typeof result.reason).toBe('string');
    });
  });

  describe('Integration: Full Accessibility Flow', () => {
    it('should handle complete accessibility workflow', async () => {
      // 1. Check audio availability
      const available = await service.checkAudioAvailability();

      // 2. Set user preferences
      service.setUserPreferences('user1', {
        speed: 1.25,
        useTranscript: !available.available,
      });

      // 3. Validate audio quality
      const buffer = new ArrayBuffer(32000);
      const quality = service.validateAudioQuality(buffer, 'kokoro');

      // 4. Generate fallback if needed
      let content = 'What are your weaknesses?';
      if (!quality.valid) {
        content = service.generateFallbackTranscript(content, {
          interviewType: 'behavioral',
        });
      }

      // 5. Get summary
      const summary = service.getQualitySummary();

      expect(summary.overallQuality).toBeDefined();
      expect(content.length).toBeGreaterThan(0);
    });

    it('should recommend transcript when audio fails', async () => {
      // Simulate audio device failure
      service.validateAudioQuality(new ArrayBuffer(0), 'kokoro');
      service.validateAudioQuality(new ArrayBuffer(0), 'groq');

      const summary = service.getQualitySummary();
      const shouldUseTranscript =
        summary.overallQuality === 'poor' ||
        summary.recommendActions.some(a => a.includes('transcript'));

      expect(shouldUseTranscript).toBe(true);
    });
  });
});
