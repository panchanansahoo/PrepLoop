import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AudioWorkletManager } from './audioWorkletManager';

describe('AudioWorkletManager', () => {
  let originalAudioContext;

  beforeEach(() => {
    originalAudioContext = window.AudioContext;
  });

  afterEach(() => {
    window.AudioContext = originalAudioContext;
    vi.restoreAllMocks();
  });

  it('detects AudioWorklet support correctly', () => {
    class MockAudioContext {
      constructor() {
        this.audioWorklet = { addModule: vi.fn() };
      }
    }
    MockAudioContext.prototype.audioWorklet = {};
    window.AudioContext = MockAudioContext;

    expect(AudioWorkletManager.isSupported()).toBe(true);

    delete MockAudioContext.prototype.audioWorklet;
    expect(AudioWorkletManager.isSupported()).toBe(false);
  });

  it('initializes with default and custom options', () => {
    const mgr = new AudioWorkletManager({
      targetSampleRate: 24000,
      vadThreshold: 0.02,
      bufferSize: 4096,
      workletUrl: '/custom-worklet.js',
    });

    expect(mgr.targetSampleRate).toBe(24000);
    expect(mgr.vadThreshold).toBe(0.02);
    expect(mgr.bufferSize).toBe(4096);
    expect(mgr.workletUrl).toBe('/custom-worklet.js');
    expect(mgr.isActive).toBe(false);
  });

  it('connects audio graph and dispatches VAD and PCM messages', async () => {
    const onVadChange = vi.fn();
    const onAudioChunk = vi.fn();

    const mockPort = { onmessage: null };
    const mockWorkletNode = {
      connect: vi.fn(),
      disconnect: vi.fn(),
      port: mockPort,
    };
    const mockSourceNode = {
      connect: vi.fn(),
      disconnect: vi.fn(),
    };

    class MockAudioContext {
      constructor() {
        this.state = 'running';
        this.audioWorklet = { addModule: vi.fn().mockResolvedValue() };
      }
      createMediaStreamSource() {
        return mockSourceNode;
      }
      close() {
        return Promise.resolve();
      }
    }
    MockAudioContext.prototype.audioWorklet = {};
    window.AudioContext = MockAudioContext;
    window.AudioWorkletNode = class {
      constructor() {
        return mockWorkletNode;
      }
    };

    const mgr = new AudioWorkletManager({ onVadChange, onAudioChunk });
    const mockStream = { getTracks: vi.fn() };

    await mgr.start(mockStream);
    expect(mgr.isActive).toBe(true);
    expect(mockSourceNode.connect).toHaveBeenCalledWith(mockWorkletNode);

    // Simulate VAD message
    mockPort.onmessage({
      data: { type: 'VAD_STATE', speaking: true, rms: 0.045 },
    });
    expect(onVadChange).toHaveBeenCalledWith({ speaking: true, rms: 0.045 });

    // Simulate PCM Chunk message
    const mockBuffer = new ArrayBuffer(512);
    mockPort.onmessage({
      data: {
        type: 'AUDIO_CHUNK',
        sampleRate: 48000,
        targetSampleRate: 16000,
        pcmData: mockBuffer,
      },
    });
    expect(onAudioChunk).toHaveBeenCalledWith({
      pcmData: mockBuffer,
      sampleRate: 48000,
      targetSampleRate: 16000,
    });

    // Cleanup
    mgr.stop();
    expect(mgr.isActive).toBe(false);
    expect(mockWorkletNode.disconnect).toHaveBeenCalled();
  });

  it('throws error when started with missing MediaStream', async () => {
    class MockAudioContext {}
    MockAudioContext.prototype.audioWorklet = {};
    window.AudioContext = MockAudioContext;

    const mgr = new AudioWorkletManager();
    await expect(mgr.start(null)).rejects.toThrow('A valid MediaStream is required');
  });
});
