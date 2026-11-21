/**
 * AudioWorkletManager — Real-Time Voice Streaming Client
 *
 * Manages Web Audio API AudioContext, registers voice-pcm-worklet, handles
 * 16kHz linear PCM streaming over WebSockets, and detects barge-in speech onset.
 */

export class AudioWorkletManager {
  constructor(options = {}) {
    this.targetSampleRate = options.targetSampleRate || 16000;
    this.vadThreshold = options.vadThreshold || 0.015;
    this.bufferSize = options.bufferSize || 2048;
    this.workletUrl = options.workletUrl || '/voice-pcm-worklet.js';

    this.audioContext = null;
    this.mediaStream = null;
    this.sourceNode = null;
    this.workletNode = null;
    this.isActive = false;

    this.onAudioChunk = options.onAudioChunk || (() => {});
    this.onVadChange = options.onVadChange || (() => {});
    this.onError = options.onError || (() => {});
  }

  /**
   * Check if the browser environment supports AudioWorklet
   */
  static isSupported() {
    if (typeof window === 'undefined') return false;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    return Boolean(AudioCtx && typeof AudioCtx.prototype.audioWorklet !== 'undefined');
  }

  /**
   * Initialize audio context and register the PCM worklet processor
   */
  async start(mediaStream) {
    if (!AudioWorkletManager.isSupported()) {
      throw new Error('AudioWorklet is not supported in this browser environment');
    }

    if (!mediaStream) {
      throw new Error('A valid MediaStream is required to start AudioWorkletManager');
    }

    this.mediaStream = mediaStream;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioCtx();

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      await this.audioContext.audioWorklet.addModule(this.workletUrl);

      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.workletNode = new AudioWorkletNode(this.audioContext, 'voice-pcm-worklet', {
        processorOptions: {
          targetSampleRate: this.targetSampleRate,
          bufferSize: this.bufferSize,
          vadThreshold: this.vadThreshold,
        },
      });

      this.workletNode.port.onmessage = (event) => {
        const { type, speaking, rms, pcmData, sampleRate, targetSampleRate } = event.data;
        if (type === 'VAD_STATE') {
          this.onVadChange({ speaking, rms });
        } else if (type === 'AUDIO_CHUNK') {
          this.onAudioChunk({ pcmData, sampleRate, targetSampleRate });
        }
      };

      // Connect graph: microphone source -> worklet node -> null sink
      this.sourceNode.connect(this.workletNode);

      this.isActive = true;
      return true;
    } catch (err) {
      this.stop();
      this.onError(err);
      throw err;
    }
  }

  /**
   * Stop worklet node, release audio resources and close AudioContext
   */
  stop() {
    this.isActive = false;

    if (this.workletNode) {
      try {
        this.workletNode.disconnect();
        this.workletNode.port.onmessage = null;
      } catch (_) {}
      this.workletNode = null;
    }

    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch (_) {}
      this.sourceNode = null;
    }

    if (this.audioContext) {
      try {
        if (this.audioContext.state !== 'closed') {
          this.audioContext.close();
        }
      } catch (_) {}
      this.audioContext = null;
    }

    this.mediaStream = null;
  }
}

export default AudioWorkletManager;
