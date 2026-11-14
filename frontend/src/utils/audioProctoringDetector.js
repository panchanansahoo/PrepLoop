/**
 * AudioProctoringDetector — Web Audio API frequency analysis for real-time
 * acoustic integrity monitoring during interviews.
 *
 * Detects:
 * 1. Background whispering (unvoiced high spectral centroid turbulence: 1.8kHz - 5kHz)
 * 2. Secondary voice / background prompter during candidate think-time
 * 3. Multi-speaker harmonic interference (dual vocal pitch peaks)
 */

export const AUDIO_BANDS = {
  SUB_BASS: { min: 20, max: 80 },
  VOCAL_F0: { min: 85, max: 300 },       // Pitch fundamental for human voice
  VOCAL_FORMNTS: { min: 300, max: 3000 }, // Vowel formant envelope
  WHISPER: { min: 1800, max: 5500 },     // Unvoiced turbulence / sibilance
  HIGH_NOISE: { min: 6000, max: 12000 },
};

/**
 * Calculates Root Mean Square (RMS) amplitude from time-domain audio data.
 * @param {Uint8Array|Float32Array} timeDomainData
 * @returns {number} Normalized RMS value between 0.0 and 1.0
 */
export function calculateRms(timeDomainData) {
  if (!timeDomainData || timeDomainData.length === 0) return 0;
  let sumSquares = 0;
  const len = timeDomainData.length;

  if (timeDomainData instanceof Uint8Array) {
    for (let i = 0; i < len; i++) {
      const normalized = (timeDomainData[i] - 128) / 128;
      sumSquares += normalized * normalized;
    }
  } else {
    for (let i = 0; i < len; i++) {
      const val = timeDomainData[i];
      sumSquares += val * val;
    }
  }

  return Math.sqrt(sumSquares / len);
}

/**
 * Calculates spectral centroid (spectral brightness / center of mass of frequency spectrum).
 * Higher centroid indicates whispering or sibilance; lower centroid indicates resonant voiced vowels.
 * @param {Uint8Array|Float32Array|Array<number>} frequencyData
 * @param {number} sampleRate
 * @param {number} fftSize
 * @returns {number} Spectral centroid frequency in Hz
 */
export function calculateSpectralCentroid(frequencyData, sampleRate = 44100, fftSize = 2048) {
  if (!frequencyData || frequencyData.length === 0) return 0;

  const binWidth = sampleRate / fftSize;
  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < frequencyData.length; i++) {
    const magnitude = Number(frequencyData[i]);
    const freq = i * binWidth;
    numerator += freq * magnitude;
    denominator += magnitude;
  }

  if (denominator === 0) return 0;
  return Math.round(numerator / denominator);
}

/**
 * Calculates average energy in a specific frequency band.
 * @param {Uint8Array|Float32Array|Array<number>} frequencyData
 * @param {number} minFreq
 * @param {number} maxFreq
 * @param {number} sampleRate
 * @param {number} fftSize
 * @returns {{ totalEnergy: number, averageEnergy: number, binCount: number }}
 */
export function calculateBandEnergy(frequencyData, minFreq, maxFreq, sampleRate = 44100, fftSize = 2048) {
  if (!frequencyData || frequencyData.length === 0) {
    return { totalEnergy: 0, averageEnergy: 0, binCount: 0 };
  }

  const binWidth = sampleRate / fftSize;
  const startBin = Math.max(0, Math.floor(minFreq / binWidth));
  const endBin = Math.min(frequencyData.length - 1, Math.ceil(maxFreq / binWidth));

  let totalEnergy = 0;
  let count = 0;

  for (let i = startBin; i <= endBin; i++) {
    totalEnergy += Number(frequencyData[i]);
    count++;
  }

  const averageEnergy = count > 0 ? totalEnergy / count : 0;
  return {
    totalEnergy,
    averageEnergy,
    binCount: count,
  };
}

/**
 * Identifies prominent harmonic peaks within the vocal fundamental band (85 - 350 Hz).
 * Used to detect secondary voices and multi-speaker overlapping.
 */
export function findPitchPeaks(frequencyData, sampleRate = 44100, fftSize = 2048, threshold = 15) {
  if (!frequencyData || frequencyData.length === 0) return [];
  const binWidth = sampleRate / fftSize;
  const startBin = Math.max(1, Math.floor(85 / binWidth));
  const endBin = Math.min(frequencyData.length - 2, Math.ceil(350 / binWidth));

  const peaks = [];
  for (let i = startBin; i <= endBin; i++) {
    const val = Number(frequencyData[i]);
    const prev = Number(frequencyData[i - 1]);
    const next = Number(frequencyData[i + 1]);

    if (val > threshold && val > prev && val > next) {
      peaks.push({
        bin: i,
        frequency: Math.round(i * binWidth),
        magnitude: val,
      });
    }
  }

  // Sort descending by magnitude
  peaks.sort((a, b) => b.magnitude - a.magnitude);
  return peaks;
}

/**
 * Detects whispering signature based on spectral tilt, high centroid, and unvoiced turbulence.
 * Whispering lacks the vocal fold periodic vibration (low F0), but has prominent mid-high formants.
 *
 * @param {Uint8Array|Float32Array|Array<number>} frequencyData
 * @param {Object} options
 * @returns {{ isWhisper: boolean, confidence: number, centroid: number, whisperBandEnergy: number, f0Energy: number, ratio: number }}
 */
export function detectWhisperSignature(frequencyData, options = {}) {
  const {
    sampleRate = 44100,
    fftSize = 2048,
    ambientFloor = 10,
    sensitivity = 0.7,
  } = options;

  if (!frequencyData || frequencyData.length === 0) {
    return { isWhisper: false, confidence: 0, centroid: 0, whisperBandEnergy: 0, f0Energy: 0, ratio: 0 };
  }

  const centroid = calculateSpectralCentroid(frequencyData, sampleRate, fftSize);
  const f0 = calculateBandEnergy(frequencyData, AUDIO_BANDS.VOCAL_F0.min, AUDIO_BANDS.VOCAL_F0.max, sampleRate, fftSize);
  const whisper = calculateBandEnergy(frequencyData, AUDIO_BANDS.WHISPER.min, AUDIO_BANDS.WHISPER.max, sampleRate, fftSize);

  const f0Energy = f0.averageEnergy;
  const whisperBandEnergy = whisper.averageEnergy;

  // In unvoiced whisper, whisper band energy is significantly higher than F0 fundamental energy
  const ratio = whisperBandEnergy / (f0Energy + 1.0);
  const whisperElevation = whisperBandEnergy - ambientFloor;

  // Criteria for whisper:
  // 1. Whisper band has noticeable energy above ambient floor
  // 2. Spectral centroid is elevated (> 2200 Hz) due to lack of voiced low frequencies
  // 3. Ratio of whisper band to F0 is high (> 1.25)
  const isElevated = whisperElevation > (6 * (1.1 - sensitivity));
  const hasHighCentroid = centroid >= (2100 - (sensitivity * 300));
  const hasWhisperRatio = ratio >= (1.15 - (sensitivity * 0.2));

  let confidence = 0;
  if (isElevated && hasHighCentroid && hasWhisperRatio) {
    const centroidBonus = Math.min(0.3, Math.max(0, (centroid - 2200) / 4000));
    const ratioBonus = Math.min(0.4, Math.max(0, (ratio - 1.2) / 3));
    const energyBonus = Math.min(0.3, Math.max(0, whisperElevation / 50));
    confidence = Math.min(0.99, Number((0.4 + centroidBonus + ratioBonus + energyBonus).toFixed(2)));
  }

  return {
    isWhisper: confidence >= 0.55,
    confidence,
    centroid,
    whisperBandEnergy: Math.round(whisperBandEnergy * 10) / 10,
    f0Energy: Math.round(f0Energy * 10) / 10,
    ratio: Number(ratio.toFixed(2)),
  };
}

/**
 * Detects secondary voice presence or unauthorized speech.
 * During candidate think-time, ANY voice presence is flagged.
 * Additionally checks for dual harmonic peaks (two distinct speakers).
 *
 * @param {Uint8Array|Float32Array|Array<number>} frequencyData
 * @param {Object} options
 * @returns {{ detected: boolean, confidence: number, type: 'think_time_voice'|'dual_speaker'|'none', details: Object }}
 */
export function detectSecondaryVoiceSignature(frequencyData, options = {}) {
  const {
    sampleRate = 44100,
    fftSize = 2048,
    ambientFloor = 10,
    isThinkTime = false,
    sensitivity = 0.7,
  } = options;

  if (!frequencyData || frequencyData.length === 0) {
    return { detected: false, confidence: 0, type: 'none', details: {} };
  }

  const f0 = calculateBandEnergy(frequencyData, AUDIO_BANDS.VOCAL_F0.min, AUDIO_BANDS.VOCAL_F0.max, sampleRate, fftSize);
  const formants = calculateBandEnergy(frequencyData, AUDIO_BANDS.VOCAL_FORMNTS.min, AUDIO_BANDS.VOCAL_FORMNTS.max, sampleRate, fftSize);
  const centroid = calculateSpectralCentroid(frequencyData, sampleRate, fftSize);
  const peaks = findPitchPeaks(frequencyData, sampleRate, fftSize, ambientFloor * 1.4);

  const voiceEnergy = (f0.averageEnergy * 0.4) + (formants.averageEnergy * 0.6);
  const voiceElevation = voiceEnergy - ambientFloor;
  const isVoiceBandActive = voiceElevation > (6 * (1.1 - sensitivity)) && voiceEnergy >= (ambientFloor * 1.2);

  // Case 1: Speech detected during candidate think-time (Candidate is supposed to be reading/thinking silently)
  if (isThinkTime && isVoiceBandActive) {
    const conf = Math.min(0.98, Number((0.55 + Math.min(0.4, voiceElevation / 50)).toFixed(2)));
    return {
      detected: true,
      confidence: conf,
      type: 'think_time_voice',
      details: {
        voiceEnergy: Math.round(voiceEnergy * 10) / 10,
        voiceElevation: Math.round(voiceElevation * 10) / 10,
        centroid,
        peaksCount: peaks.length,
      },
    };
  }

  // Case 2: Dual harmonic speakers (two distinct pitches in 85-350 Hz, e.g. male 120Hz + female 220Hz or two overlapping speakers)
  if (peaks.length >= 2) {
    const primary = peaks[0];
    // Find a second distinct peak separated by at least 35 Hz that isn't a simple harmonic octave (f2 != 2 * f1 +/- 5Hz)
    const secondary = peaks.find((p) => {
      const diff = Math.abs(p.frequency - primary.frequency);
      const isHarmonic = Math.abs(p.frequency - (primary.frequency * 2)) < 8 || Math.abs((p.frequency * 2) - primary.frequency) < 8;
      return diff >= 35 && !isHarmonic && p.magnitude >= (primary.magnitude * 0.4);
    });

    if (secondary) {
      const conf = Math.min(0.95, Number((0.6 + Math.min(0.35, (primary.magnitude + secondary.magnitude) / 120)).toFixed(2)));
      return {
        detected: true,
        confidence: conf,
        type: 'dual_speaker',
        details: {
          primaryPitch: primary.frequency,
          secondaryPitch: secondary.frequency,
          primaryMagnitude: primary.magnitude,
          secondaryMagnitude: secondary.magnitude,
        },
      };
    }
  }

  return { detected: false, confidence: 0, type: 'none', details: {} };
}

/**
 * Main Web Audio API Proctoring Detector Controller
 */
export class AudioProctoringDetector {
  constructor(options = {}) {
    this.options = {
      fftSize: 2048,
      sampleRate: 44100,
      smoothingTimeConstant: 0.8,
      minDecibels: -90,
      maxDecibels: -10,
      whisperSensitivity: 0.75,
      voiceSensitivity: 0.75,
      cooldownMs: 2000,
      ...options,
    };

    this.audioContext = options.audioContext || null;
    this.mediaStream = null;
    this.sourceNode = null;
    this.analyserNode = null;

    this.isActive = false;
    this.isThinkTime = Boolean(options.thinkTime);
    this.ambientFloor = options.ambientFloor || 12;
    this.calibrationSamples = [];

    this.secondVoiceCount = 0;
    this.whisperCount = 0;
    this.violations = [];
    this.lastViolationTime = 0;
    this.lastRms = 0;
    this.lastConfidence = 0;

    this.animationFrameId = null;
    this.timerId = null;

    // Callbacks
    this.onViolation = options.onViolation || null;
    this.onSecondaryVoice = options.onSecondaryVoice || null;
    this.onWhisper = options.onWhisper || null;
    this.onAudioLevel = options.onAudioLevel || null;
  }

  /**
   * Initialize audio graph with a MediaStream or custom audio source.
   */
  async initialize(mediaStream) {
    this.mediaStream = mediaStream || null;

    if (!this.audioContext && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx({ sampleRate: this.options.sampleRate });
      }
    }

    if (!this.audioContext) {
      return false;
    }

    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (_e) {
        // Handled silently
      }
    }

    this.analyserNode = this.audioContext.createAnalyser();
    this.analyserNode.fftSize = this.options.fftSize;
    this.analyserNode.smoothingTimeConstant = this.options.smoothingTimeConstant;
    this.analyserNode.minDecibels = this.options.minDecibels;
    this.analyserNode.maxDecibels = this.options.maxDecibels;

    if (this.mediaStream && typeof this.audioContext.createMediaStreamSource === 'function') {
      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.sourceNode.connect(this.analyserNode);
    }

    return true;
  }

  /**
   * Toggles candidate think-time mode.
   * During think-time, candidates are supposed to be silent while reading/planning.
   */
  setThinkTime(isThinking) {
    this.isThinkTime = Boolean(isThinking);
  }

  startThinkTime() {
    this.setThinkTime(true);
  }

  stopThinkTime() {
    this.setThinkTime(false);
  }

  /**
   * Calibrate ambient background noise floor during quiet interval.
   */
  calibrateAmbient(frames = 30) {
    if (!this.analyserNode) return this.ambientFloor;
    const buffer = new Uint8Array(this.analyserNode.frequencyBinCount);
    let total = 0;
    for (let i = 0; i < frames; i++) {
      this.analyserNode.getByteFrequencyData(buffer);
      const avg = buffer.reduce((a, b) => a + b, 0) / buffer.length;
      total += avg;
    }
    this.ambientFloor = Math.max(5, Math.round(total / frames));
    return this.ambientFloor;
  }

  /**
   * Starts monitoring loop.
   */
  start() {
    if (this.isActive) return;
    this.isActive = true;

    const tick = () => {
      if (!this.isActive) return;
      this.processCurrentFrame();

      if (typeof requestAnimationFrame !== 'undefined') {
        this.animationFrameId = requestAnimationFrame(tick);
      } else {
        this.timerId = setTimeout(tick, 100);
      }
    };

    tick();
  }

  /**
   * Stops monitoring loop.
   */
  stop() {
    this.isActive = false;
    if (this.animationFrameId && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  /**
   * Analyzes the current frame from AnalyserNode or custom frequency/time arrays.
   */
  processCurrentFrame(customFreq = null, customTime = null) {
    let freqData = customFreq;
    let timeData = customTime;

    if (!freqData && this.analyserNode) {
      freqData = new Uint8Array(this.analyserNode.frequencyBinCount);
      this.analyserNode.getByteFrequencyData(freqData);
    }

    if (!timeData && this.analyserNode) {
      timeData = new Uint8Array(this.analyserNode.fftSize);
      this.analyserNode.getByteTimeDomainData(timeData);
    }

    if (!freqData) return null;

    const sampleRate = this.audioContext?.sampleRate || this.options.sampleRate;
    const fftSize = this.options.fftSize;

    // RMS calculation
    if (timeData) {
      this.lastRms = calculateRms(timeData);
      this.onAudioLevel?.(this.lastRms);
    }

    // 1. Whisper Analysis
    const whisperResult = detectWhisperSignature(freqData, {
      sampleRate,
      fftSize,
      ambientFloor: this.ambientFloor,
      sensitivity: this.options.whisperSensitivity,
    });

    // 2. Secondary Voice Analysis (especially during think-time)
    const voiceResult = detectSecondaryVoiceSignature(freqData, {
      sampleRate,
      fftSize,
      ambientFloor: this.ambientFloor,
      isThinkTime: this.isThinkTime,
      sensitivity: this.options.voiceSensitivity,
    });

    const now = Date.now();
    const canEmit = (now - this.lastViolationTime) >= this.options.cooldownMs;

    // Trigger secondary voice violation
    if (voiceResult.detected && canEmit) {
      this.secondVoiceCount++;
      this.lastViolationTime = now;
      this.lastConfidence = voiceResult.confidence;

      const violation = {
        id: `v_sec_${now}`,
        type: 'secondary_voice',
        subType: voiceResult.type,
        message: voiceResult.type === 'think_time_voice'
          ? 'Secondary speech / whispering detected during candidate think-time'
          : 'Multiple distinct voice pitch registers detected simultaneously',
        confidence: voiceResult.confidence,
        timestamp: new Date().toISOString(),
        details: voiceResult.details,
      };

      this.violations.push(violation);
      this.onSecondaryVoice?.(violation);
      this.onViolation?.(violation);
    }

    // Trigger whisper violation
    if (whisperResult.isWhisper && canEmit) {
      this.whisperCount++;
      this.lastViolationTime = now;
      this.lastConfidence = whisperResult.confidence;

      const violation = {
        id: `v_whisp_${now}`,
        type: 'whispering',
        message: 'Acoustic whispering signature detected in background',
        confidence: whisperResult.confidence,
        timestamp: new Date().toISOString(),
        details: whisperResult,
      };

      this.violations.push(violation);
      this.onWhisper?.(violation);
      this.onViolation?.(violation);
    }

    return {
      whisperResult,
      voiceResult,
      rms: this.lastRms,
    };
  }

  /**
   * Returns current audio proctoring telemetry snapshot.
   */
  getTelemetry() {
    return {
      isActive: this.isActive,
      isThinkTime: this.isThinkTime,
      ambientFloor: this.ambientFloor,
      currentRms: Number(this.lastRms.toFixed(4)),
      secondaryVoiceDetected: this.secondVoiceCount > 0,
      secondaryVoiceCount: this.secondVoiceCount,
      whisperDetected: this.whisperCount > 0,
      whisperCount: this.whisperCount,
      violations: [...this.violations],
      lastConfidence: this.lastConfidence,
      recentAlert: this.violations.length > 0 ? this.violations[this.violations.length - 1] : null,
    };
  }

  /**
   * Full teardown of Web Audio resources.
   */
  destroy() {
    this.stop();
    if (this.sourceNode) {
      try { this.sourceNode.disconnect(); } catch (_e) {}
      this.sourceNode = null;
    }
    if (this.analyserNode) {
      try { this.analyserNode.disconnect(); } catch (_e) {}
      this.analyserNode = null;
    }
    if (this.audioContext && typeof this.audioContext.close === 'function') {
      try { this.audioContext.close(); } catch (_e) {}
      this.audioContext = null;
    }
    this.violations = [];
  }
}

export function createAudioProctoringDetector(options = {}) {
  return new AudioProctoringDetector(options);
}

export default AudioProctoringDetector;
