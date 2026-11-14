import { describe, it, expect, vi, beforeEach } from 'vitest';
import AudioProctoringDetector, {
  AUDIO_BANDS,
  calculateRms,
  calculateSpectralCentroid,
  calculateBandEnergy,
  findPitchPeaks,
  detectWhisperSignature,
  detectSecondaryVoiceSignature,
  createAudioProctoringDetector,
} from './audioProctoringDetector.js';

describe('audioProctoringDetector (Pillar 3 Audio Integrity & Proctoring)', () => {
  const sampleRate = 44100;
  const fftSize = 2048;
  const binWidth = sampleRate / fftSize; // ~21.53 Hz per bin

  describe('RMS and Frequency Band Calculations', () => {
    it('computes RMS for Uint8Array silence and active signals', () => {
      const silence = new Uint8Array(1024).fill(128); // 128 is 0 in unsigned 8-bit PCM
      expect(calculateRms(silence)).toBe(0);

      const active = new Uint8Array(1024);
      for (let i = 0; i < 1024; i++) {
        active[i] = i % 2 === 0 ? 192 : 64; // +/- 0.5 amplitude
      }
      expect(calculateRms(active)).toBeCloseTo(0.5, 1);
    });

    it('computes spectral centroid correctly: higher for high-frequency noise/whispers', () => {
      const lowSpectrum = new Uint8Array(1024);
      // Put energy only in low bins (bins 5 to 10 -> ~100Hz - 215Hz)
      for (let i = 5; i <= 10; i++) lowSpectrum[i] = 100;
      const lowCentroid = calculateSpectralCentroid(lowSpectrum, sampleRate, fftSize);

      const highSpectrum = new Uint8Array(1024);
      // Put energy only in high bins (bins 140 to 180 -> ~3000Hz - 3800Hz)
      for (let i = 140; i <= 180; i++) highSpectrum[i] = 100;
      const highCentroid = calculateSpectralCentroid(highSpectrum, sampleRate, fftSize);

      expect(lowCentroid).toBeLessThan(300);
      expect(highCentroid).toBeGreaterThan(2500);
      expect(highCentroid).toBeGreaterThan(lowCentroid);
    });

    it('calculates band energy for specified frequency intervals', () => {
      const spectrum = new Uint8Array(1024).fill(0);
      const bin100 = Math.round(100 / binWidth);
      spectrum[bin100] = 80;

      const result = calculateBandEnergy(spectrum, 85, 300, sampleRate, fftSize);
      expect(result.totalEnergy).toBeGreaterThanOrEqual(80);
      expect(result.binCount).toBeGreaterThan(0);
      expect(result.averageEnergy).toBeGreaterThan(0);
    });

    it('identifies pitch fundamental peaks', () => {
      const spectrum = new Uint8Array(1024).fill(5);
      const bin150 = Math.round(150 / binWidth);
      spectrum[bin150] = 95;
      spectrum[bin150 - 1] = 40;
      spectrum[bin150 + 1] = 40;

      const peaks = findPitchPeaks(spectrum, sampleRate, fftSize, 10);
      expect(peaks.length).toBeGreaterThan(0);
      expect(peaks[0].frequency).toBeCloseTo(150, -1);
    });
  });

  describe('detectWhisperSignature', () => {
    it('returns false for quiet ambient noise', () => {
      const ambient = new Uint8Array(1024).fill(8);
      const res = detectWhisperSignature(ambient, { sampleRate, fftSize, ambientFloor: 8 });
      expect(res.isWhisper).toBe(false);
      expect(res.confidence).toBeLessThan(0.5);
    });

    it('detects whisper when spectral centroid is high and energy is in whisper band with low F0', () => {
      const whisperSpectrum = new Uint8Array(1024).fill(6);
      // Elevate whisper band (1800 - 5000 Hz, corresponding to bins ~85 to ~230)
      for (let i = 90; i <= 220; i++) {
        whisperSpectrum[i] = 45;
      }
      // Keep F0 (85-300Hz, bins 4 to 14) near ambient
      for (let i = 4; i <= 14; i++) {
        whisperSpectrum[i] = 7;
      }

      const res = detectWhisperSignature(whisperSpectrum, {
        sampleRate,
        fftSize,
        ambientFloor: 8,
        sensitivity: 0.8,
      });

      expect(res.isWhisper).toBe(true);
      expect(res.confidence).toBeGreaterThanOrEqual(0.6);
      expect(res.centroid).toBeGreaterThan(2000);
      expect(res.ratio).toBeGreaterThan(1.5);
    });
  });

  describe('detectSecondaryVoiceSignature', () => {
    it('flags voice activity during candidate think-time', () => {
      const thinkTimeSpectrum = new Uint8Array(1024).fill(8);
      // Candidate is supposed to be silent, but speech is detected in voice formants
      for (let i = 6; i <= 100; i++) {
        thinkTimeSpectrum[i] = 45;
      }

      const res = detectSecondaryVoiceSignature(thinkTimeSpectrum, {
        sampleRate,
        fftSize,
        ambientFloor: 8,
        isThinkTime: true,
        sensitivity: 0.8,
      });

      expect(res.detected).toBe(true);
      expect(res.type).toBe('think_time_voice');
      expect(res.confidence).toBeGreaterThanOrEqual(0.6);
    });

    it('detects dual distinct speakers with different pitch fundamentals', () => {
      const dualSpectrum = new Uint8Array(1024).fill(10);
      const binMale120 = Math.round(120 / binWidth);
      const binFemale230 = Math.round(230 / binWidth);

      // Male pitch peak
      dualSpectrum[binMale120] = 85;
      dualSpectrum[binMale120 - 1] = 40;
      dualSpectrum[binMale120 + 1] = 40;

      // Female pitch peak
      dualSpectrum[binFemale230] = 75;
      dualSpectrum[binFemale230 - 1] = 35;
      dualSpectrum[binFemale230 + 1] = 35;

      const res = detectSecondaryVoiceSignature(dualSpectrum, {
        sampleRate,
        fftSize,
        ambientFloor: 10,
        isThinkTime: false,
      });

      expect(res.detected).toBe(true);
      expect(res.type).toBe('dual_speaker');
      expect(res.details.primaryPitch).toBeDefined();
      expect(res.details.secondaryPitch).toBeDefined();
    });
  });

  describe('AudioProctoringDetector Controller & Telemetry', () => {
    it('initializes and manages think-time states', () => {
      const detector = createAudioProctoringDetector({ thinkTime: false });
      expect(detector.isThinkTime).toBe(false);

      detector.startThinkTime();
      expect(detector.isThinkTime).toBe(true);

      detector.stopThinkTime();
      expect(detector.isThinkTime).toBe(false);

      detector.destroy();
    });

    it('triggers callbacks and builds telemetry upon detecting secondary voice during think-time', () => {
      const onViolation = vi.fn();
      const onSecondaryVoice = vi.fn();
      const detector = new AudioProctoringDetector({
        cooldownMs: 0,
        ambientFloor: 10,
        onViolation,
        onSecondaryVoice,
      });

      detector.startThinkTime();

      const voiceFreq = new Uint8Array(1024).fill(8);
      for (let i = 5; i <= 80; i++) voiceFreq[i] = 50;

      const timeDomain = new Uint8Array(2048).fill(160);

      detector.processCurrentFrame(voiceFreq, timeDomain);

      expect(detector.secondVoiceCount).toBe(1);
      expect(onViolation).toHaveBeenCalledTimes(1);
      expect(onSecondaryVoice).toHaveBeenCalledTimes(1);

      const telemetry = detector.getTelemetry();
      expect(telemetry.secondaryVoiceDetected).toBe(true);
      expect(telemetry.secondaryVoiceCount).toBe(1);
      expect(telemetry.isThinkTime).toBe(true);
      expect(telemetry.violations).toHaveLength(1);
      expect(telemetry.violations[0].type).toBe('secondary_voice');

      detector.destroy();
    });

    it('triggers whisper callback when whisper audio pattern is supplied', () => {
      const onWhisper = vi.fn();
      const detector = new AudioProctoringDetector({
        cooldownMs: 0,
        ambientFloor: 8,
        whisperSensitivity: 0.85,
        onWhisper,
      });

      const whisperFreq = new Uint8Array(1024).fill(5);
      for (let i = 90; i <= 210; i++) whisperFreq[i] = 55;

      detector.processCurrentFrame(whisperFreq);

      expect(detector.whisperCount).toBe(1);
      expect(onWhisper).toHaveBeenCalledTimes(1);

      const telemetry = detector.getTelemetry();
      expect(telemetry.whisperDetected).toBe(true);
      expect(telemetry.whisperCount).toBe(1);

      detector.destroy();
    });
  });
});
