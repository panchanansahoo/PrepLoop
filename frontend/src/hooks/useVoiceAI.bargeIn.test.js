/* @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useVoiceAI } from "./useVoiceAI";

class MockSpeechRecognition {
  constructor() {
    this.continuous = false;
    this.interimResults = false;
    this.lang = "en-US";
    this.onstart = null;
    this.onresult = null;
    this.onerror = null;
    this.onend = null;
  }
  start() {
    setTimeout(() => {
      this.onstart?.();
    }, 0);
  }
  stop() {
    setTimeout(() => {
      this.onend?.();
    }, 0);
  }
  abort() {
    this.stop();
  }
}

class MockAudio {
  constructor(src = "") {
    this.src = src;
    this.volume = 1.0;
    this.currentTime = 0;
    this.paused = false;
    this.play = vi.fn().mockResolvedValue(undefined);
    this.pause = vi.fn().mockImplementation(() => {
      this.paused = true;
    });
    this.addEventListener = vi.fn();
    this.removeEventListener = vi.fn();
  }
}

const makeStream = () => ({
  getAudioTracks: () => [{ readyState: "live", stop: vi.fn() }],
  getTracks: () => [{ readyState: "live", stop: vi.fn() }],
});

describe("useVoiceAI — Conversational Full-Duplex 'Barge-In' Interruption", () => {
  let originalAudio;
  let originalSpeechSynthesis;
  let originalSpeechRecognition;
  let cancelSpeechSpy;

  beforeEach(() => {
    originalAudio = globalThis.Audio;
    globalThis.Audio = MockAudio;

    originalSpeechRecognition = globalThis.SpeechRecognition;
    globalThis.SpeechRecognition = MockSpeechRecognition;
    globalThis.webkitSpeechRecognition = MockSpeechRecognition;

    cancelSpeechSpy = vi.fn();
    originalSpeechSynthesis = globalThis.speechSynthesis;
    globalThis.speechSynthesis = {
      cancel: cancelSpeechSpy,
      speak: vi.fn(),
      getVoices: vi.fn().mockReturnValue([]),
    };

    if (!navigator.mediaDevices) {
      navigator.mediaDevices = {};
    }
    navigator.mediaDevices.getUserMedia = vi.fn().mockResolvedValue(makeStream());
  });

  afterEach(() => {
    globalThis.Audio = originalAudio;
    if (originalSpeechSynthesis) {
      globalThis.speechSynthesis = originalSpeechSynthesis;
    }
    if (originalSpeechRecognition) {
      globalThis.SpeechRecognition = originalSpeechRecognition;
      globalThis.webkitSpeechRecognition = originalSpeechRecognition;
    } else {
      delete globalThis.SpeechRecognition;
      delete globalThis.webkitSpeechRecognition;
    }
    vi.restoreAllMocks();
  });

  it("exposes bargeIn method and initial interrupt state", () => {
    const { result } = renderHook(() => useVoiceAI());
    expect(typeof result.current.bargeIn).toBe("function");
    expect(typeof result.current.interrupt).toBe("function");
    expect(result.current.interruptDetected).toBe(false);
  });

  it("immediately cancels audio playback and switches smoothly to listening mode on barge-in", async () => {
    const onBargeIn = vi.fn();
    const onInterrupt = vi.fn();

    const { result } = renderHook(() =>
      useVoiceAI({
        onBargeIn,
        onInterrupt,
        enableInterrupt: true,
      })
    );

    // Simulate AI speaking state
    act(() => {
      result.current.audioRef.current = new MockAudio("blob:http://localhost/test-audio");
    });

    // Invoke bargeIn
    let bargeInResult;
    act(() => {
      // Mock stateRef to speaking
      bargeInResult = result.current.bargeIn();
    });

    // Should return true or handle speaking transition
    expect(result.current.interruptDetected).toBe(true);
    expect(onBargeIn).toHaveBeenCalledTimes(1);
    expect(onInterrupt).toHaveBeenCalledTimes(1);
    expect(cancelSpeechSpy).toHaveBeenCalled();
    expect(result.current.state).toBe("listening");
  });

  it("safely cleans up and mutes audio elements during barge-in to prevent speaker pops", () => {
    const mockAudioInstance = new MockAudio("blob:http://localhost/tts-segment");
    const { result } = renderHook(() => useVoiceAI());

    act(() => {
      result.current.audioRef.current = mockAudioInstance;
      result.current.bargeIn();
    });

    expect(mockAudioInstance.pause).toHaveBeenCalled();
    expect(mockAudioInstance.currentTime).toBe(0);
    expect(mockAudioInstance.src).toBe("");
    expect(result.current.state).toBe("listening");
  });
});
