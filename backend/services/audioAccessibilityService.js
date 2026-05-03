/**
 * Audio Accessibility & Quality Service
 * Validates audio output, provides fallback transcripts, and manages accessibility controls.
 *
 * Features:
 * - Audio device availability detection
 * - Audio quality validation (silence detection, corruption checks)
 * - Fallback transcript generation
 * - Playback speed/volume controls
 */

export class AudioAccessibilityService {
  constructor(config = {}) {
    this.config = {
      silenceDurationThresholdMs: 500,
      minAudioDurationMs: 300,
      maxAudioDurationMs: 120000,
      silenceThresholdDb: -50,
      audioTestTimeoutMs: 3000,
      ...config,
    };

    this.userPreferences = new Map(); // userId -> { speed, volume, useTranscript }
    this.audioQualityMetrics = new Map(); // providerId -> { corrupted, silent, quality }
  }

  /**
   * Check if audio playback is available on user's device
   *
   * @param {string} deviceType - 'browser' | 'mobile' | 'speaker'
   * @returns {Promise<object>} { available, reason, fallbackToTranscript }
   */
  async checkAudioAvailability(deviceType = 'browser') {
    try {
      // Attempt to detect audio context and speaker output
      let audioContextAvailable = false;
      let speakersAvailable = false;

      if (typeof window !== 'undefined' && window.AudioContext) {
        try {
          const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          audioContextAvailable = true;

          // Check if audio output device is accessible
          if (audioCtx.getOutputTimestamp) {
            const output = audioCtx.getOutputTimestamp();
            speakersAvailable = output !== null;
          } else {
            // Assume speakers available on browser if AudioContext works
            speakersAvailable = true;
          }

          audioCtx.close();
        } catch (err) {
          // AudioContext creation failed
          audioContextAvailable = false;
        }
      }

      if (audioContextAvailable && speakersAvailable) {
        return {
          available: true,
          reason: 'Audio output device detected',
          fallbackToTranscript: false,
        };
      } else if (audioContextAvailable) {
        return {
          available: true,
          reason: 'AudioContext available (speakers status unknown)',
          fallbackToTranscript: false,
        };
      } else {
        return {
          available: false,
          reason: 'AudioContext not available on this device',
          fallbackToTranscript: true,
        };
      }
    } catch (error) {
      return {
        available: false,
        reason: `Audio check failed: ${error.message}`,
        fallbackToTranscript: true,
      };
    }
  }

  /**
   * Validate audio output quality
   *
   * @param {ArrayBuffer|Uint8Array} audioBuffer - Audio data
   * @param {string} providerId - Voice provider that generated audio
   * @returns {object} { valid, issues: [], quality: 'excellent'|'good'|'poor' }
   */
  validateAudioQuality(audioBuffer, providerId = 'unknown') {
    const issues = [];
    let quality = 'excellent';

    // Check for null/undefined
    if (!audioBuffer || !audioBuffer.byteLength) {
      issues.push('Empty or invalid audio buffer');
      quality = 'poor';
    } else if (audioBuffer.byteLength === 0) {
      issues.push('Empty audio buffer');
      quality = 'poor';
    }

    // Check for silence (naive check: most samples near zero)
    if (audioBuffer && audioBuffer.byteLength > 0) {
      const silentSamples = this._detectSilentSamples(audioBuffer);
      if (silentSamples > 0.8) {
        issues.push(`Mostly silent audio (${(silentSamples * 100).toFixed(1)}%)`);
        quality = 'poor';
      } else if (silentSamples > 0.5) {
        issues.push(`High silence ratio (${(silentSamples * 100).toFixed(1)}%)`);
        if (quality !== 'poor') quality = 'good';
      }
    }

    // Check for corruption patterns (repeated bytes, all same values)
    if (audioBuffer && audioBuffer.byteLength > 100) {
      const corrupted = this._detectCorruption(audioBuffer);
      if (corrupted) {
        issues.push('Potential audio corruption detected');
        quality = 'poor';
      }
    }

    // Estimate duration
    let estimatedDurationMs = 0;
    if (audioBuffer && audioBuffer.byteLength > 0) {
      estimatedDurationMs = this._estimateDuration(audioBuffer);
      if (estimatedDurationMs < this.config.minAudioDurationMs) {
        issues.push(`Audio too short (${estimatedDurationMs}ms)`);
        quality = 'poor';
      } else if (estimatedDurationMs > this.config.maxAudioDurationMs) {
        issues.push(`Audio too long (${estimatedDurationMs}ms)`);
        quality = 'poor';
      }
    }

    // Store metrics
    this.audioQualityMetrics.set(providerId, {
      corrupted: issues.some(i => i.includes('corruption')),
      silent: issues.some(i => i.includes('silent')),
      quality,
      timestamp: Date.now(),
    });

    return {
      valid: issues.length === 0 && quality !== 'poor',
      issues,
      quality,
      estimatedDurationMs,
    };
  }

  /**
   * Generate fallback transcript for inaccessible audio
   *
   * @param {string} interviewContent - Original interview content/question
   * @param {object} context - { stage, difficulty, interviewType }
   * @returns {string} Formatted transcript
   */
  generateFallbackTranscript(interviewContent, context = {}) {
    const { stage = 'unknown', difficulty = 'medium', interviewType = 'general' } = context;

    const transcript = [
      `[Audio unavailable - showing transcript]`,
      `[Stage: ${stage} | Difficulty: ${difficulty} | Type: ${interviewType}]`,
      ``,
      interviewContent,
      ``,
      `[To enable audio, check your device settings or try a different browser]`,
    ].join('\n');

    return transcript;
  }

  /**
   * Set user accessibility preferences
   *
   * @param {string} userId - User ID
   * @param {object} prefs - { speed: 0.5-2.0, volume: 0-100, useTranscript: boolean }
   */
  setUserPreferences(userId, prefs = {}) {
    const defaults = {
      speed: 1.0,
      volume: 80,
      useTranscript: false,
      ...prefs,
    };

    // Validate ranges
    defaults.speed = Math.max(0.5, Math.min(2.0, defaults.speed));
    defaults.volume = Math.max(0, Math.min(100, defaults.volume));

    this.userPreferences.set(userId, defaults);
    return defaults;
  }

  /**
   * Get user's accessibility preferences
   *
   * @param {string} userId
   * @returns {object} User preferences with defaults
   */
  getUserPreferences(userId) {
    return (
      this.userPreferences.get(userId) || {
        speed: 1.0,
        volume: 80,
        useTranscript: false,
      }
    );
  }

  /**
   * Get audio quality summary across providers
   *
   * @returns {object} { providers: {}, overallQuality, recommendActions: [] }
   */
  getQualitySummary() {
    const providerStats = {};
    let totalTests = 0;
    let failedTests = 0;

    for (const [providerId, metrics] of this.audioQualityMetrics.entries()) {
      providerStats[providerId] = metrics;
      totalTests++;
      if (!metrics.quality || metrics.quality === 'poor') failedTests++;
    }

    const overallQuality =
      totalTests === 0
        ? 'unknown'
        : failedTests === 0
          ? 'excellent'
          : failedTests < totalTests * 0.3
            ? 'good'
            : 'poor';

    const recommendActions = [];
    if (overallQuality === 'poor') {
      recommendActions.push('Enable transcript fallback for users');
      recommendActions.push('Check provider API quotas');
    }
    if (
      providerStats.kokoro?.quality === 'poor' &&
      providerStats.groq?.quality === 'good'
    ) {
      recommendActions.push('Prioritize Groq for high-quality audio');
    }

    return {
      providerStats,
      overallQuality,
      recommendActions,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Reset quality metrics (for testing/debugging)
   */
  resetMetrics() {
    this.audioQualityMetrics.clear();
  }

  // ─── Private Helpers ────────────────────────────────────────────

  _detectSilentSamples(audioBuffer) {
    const view = new Uint8Array(audioBuffer);
    let zeroCount = 0;

    // Sample every 10th byte to reduce computation
    const sampleRate = Math.max(10, Math.floor(view.length / 1000));
    for (let i = 0; i < view.length; i += sampleRate) {
      // Silence: byte value near 128 (center for unsigned 8-bit audio)
      if (Math.abs(view[i] - 128) < 3) {
        zeroCount++;
      }
    }

    const samplesChecked = Math.ceil(view.length / sampleRate);
    return samplesChecked > 0 ? zeroCount / samplesChecked : 0;
  }

  _detectCorruption(audioBuffer) {
    const view = new Uint8Array(audioBuffer);
    let repeatCount = 0;

    // Check for long runs of identical bytes (corruption sign)
    for (let i = 1; i < Math.min(view.length, 1000); i++) {
      if (view[i] === view[i - 1]) {
        repeatCount++;
      }
    }

    // If >50% of first 1000 bytes are repeats, likely corrupted
    const checkSize = Math.min(view.length, 1000);
    return repeatCount > checkSize * 0.5;
  }

  _estimateDuration(audioBuffer) {
    // Estimate based on buffer size (assuming 16kHz mono audio)
    // 1 second of 16kHz = 32000 bytes (16-bit samples)
    const estimatedSamples = audioBuffer.byteLength / 2;
    const sampleRate = 16000;
    return (estimatedSamples / sampleRate) * 1000;
  }
}

export default AudioAccessibilityService;
