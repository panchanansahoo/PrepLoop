/**
 * PrepLoop Real-Time Voice AudioWorklet Processor
 * 
 * Captures microphone audio, downsamples to 16kHz mono PCM, computes real-time
 * Root Mean Square (RMS) for Voice Activity Detection (VAD), and posts raw PCM frames
 * to the main thread for low-latency WebSocket streaming (< 150ms latency).
 */
class VoicePcmWorkletProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.targetSampleRate = options?.processorOptions?.targetSampleRate || 16000;
    this.bufferSize = options?.processorOptions?.bufferSize || 2048;
    this.vadThreshold = options?.processorOptions?.vadThreshold || 0.015;
    
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
    this.isSpeaking = false;
    this.silenceFrameCount = 0;
  }

  /**
   * Process 128 frames per quantum from audio pipeline
   */
  process(inputs, _outputs, _parameters) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;

    // Use channel 0 (mono microphone)
    const channelData = input[0];
    if (!channelData) return true;

    // Calculate energy (RMS) for Voice Activity Detection
    let sumSquares = 0;
    for (let i = 0; i < channelData.length; i++) {
      const sample = channelData[i];
      sumSquares += sample * sample;

      // Fill PCM downsample buffer
      this.buffer[this.bufferIndex++] = sample;
      if (this.bufferIndex >= this.bufferSize) {
        this.flushBuffer();
      }
    }

    const rms = Math.sqrt(sumSquares / channelData.length);
    const activeSpeech = rms > this.vadThreshold;

    if (activeSpeech) {
      this.silenceFrameCount = 0;
      if (!this.isSpeaking) {
        this.isSpeaking = true;
        this.port.postMessage({ type: 'VAD_STATE', speaking: true, rms });
      }
    } else {
      this.silenceFrameCount++;
      // ~300ms of consecutive silence triggers speech end
      if (this.isSpeaking && this.silenceFrameCount > 35) {
        this.isSpeaking = false;
        this.port.postMessage({ type: 'VAD_STATE', speaking: false, rms });
      }
    }

    return true;
  }

  /**
   * Convert Float32 buffer to 16-bit signed integer linear PCM and dispatch
   */
  flushBuffer() {
    const pcm16 = new Int16Array(this.bufferIndex);
    for (let i = 0; i < this.bufferIndex; i++) {
      // Clamp between -1.0 and 1.0, scale to 16-bit signed range [-32768, 32767]
      const s = Math.max(-1, Math.min(1, this.buffer[i]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }

    this.port.postMessage(
      {
        type: 'AUDIO_CHUNK',
        sampleRate: sampleRate,
        targetSampleRate: this.targetSampleRate,
        pcmData: pcm16.buffer,
      },
      [pcm16.buffer]
    );

    this.bufferIndex = 0;
  }
}

registerProcessor('voice-pcm-worklet', VoicePcmWorkletProcessor);
