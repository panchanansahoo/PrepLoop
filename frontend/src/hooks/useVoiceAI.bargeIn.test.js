/* @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useVoiceAI } from "./useVoiceAI";

const levels = vi.hoisted(() => ({ inputLevel: 0, outputLevel: 0, inputBars: [], outputBars: [] }));
vi.mock("./useAudioVisualizer", () => ({ default: () => levels }));

class MockSpeechRecognition {
  static current = null;

  constructor() {
    MockSpeechRecognition.current = this;
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
    levels.inputLevel = 0;
    MockSpeechRecognition.current = null;
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
    vi.unstubAllGlobals();
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
    const { result } = renderHook(() => useVoiceAI({ enableInterrupt: true }));

    act(() => {
      result.current.audioRef.current = mockAudioInstance;
      result.current.bargeIn();
    });

    expect(mockAudioInstance.pause).toHaveBeenCalled();
    expect(mockAudioInstance.currentTime).toBe(0);
    expect(mockAudioInstance.src).toBe("");
    expect(result.current.state).toBe("listening");
  });

  it("disables candidate barge-in by default so AI speaking cannot be interrupted", () => {
    const onBargeIn = vi.fn();
    const { result } = renderHook(() => useVoiceAI({ onBargeIn }));

    act(() => {
      result.current.audioRef.current = new MockAudio("blob:http://localhost/test-audio");
    });

    let bargeInResult;
    act(() => {
      bargeInResult = result.current.bargeIn();
    });

    expect(bargeInResult).toBe(false);
    expect(result.current.interruptDetected).toBe(false);
    expect(onBargeIn).not.toHaveBeenCalled();
    expect(cancelSpeechSpy).not.toHaveBeenCalled();
  });

  it("continues the submitted answer exactly once when speech resumes before playback", async () => {
    const onAnswer = vi.fn();
    const onResumeSpeech = vi.fn();
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ csrfToken: "test-token" })));
    const { result, rerender } = renderHook(() => useVoiceAI({ onAnswer, onResumeSpeech }));

    await act(() => result.current.start({ initialTranscript: "I chose Redis." }));
    await act(() => result.current.submitAnswer());
    act(() => {
      levels.inputLevel = 0.2;
      rerender();
    });
    expect(onResumeSpeech).toHaveBeenCalledOnce();
    expect(result.current.transcript).toBe("I chose Redis.");
    await waitFor(() => expect(MockSpeechRecognition.current?.onresult).toBeTypeOf("function"));

    const words = [{ transcript: " The cache uses expiry.", confidence: 0.99 }];
    words.isFinal = true;
    act(() => {
      MockSpeechRecognition.current.onresult({ resultIndex: 0, results: [words] });
    });
    await act(() => result.current.submitAnswer());
    expect(onAnswer).toHaveBeenCalledTimes(2);
    expect(onAnswer).toHaveBeenLastCalledWith("I chose Redis. The cache uses expiry.", expect.any(Object));
  });

  it.each(["cloud audio", "browser speech"])("ignores resumed speech once %s starts", async (provider) => {
    const onAnswer = vi.fn();
    const onResumeSpeech = vi.fn();
    const onStart = vi.fn();
    const useBrowserSpeech = provider === "browser speech";
    vi.stubGlobal("SpeechSynthesisUtterance", class {});
    window.speechSynthesis.speak.mockImplementation((utterance) => utterance.onstart());
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:http://localhost/voice-test");
    vi.stubGlobal("fetch", vi.fn(async (url) => {
      if (!String(url).includes("tts-stream")) return Response.json({ csrfToken: "test-token" });
      if (useBrowserSpeech) return Response.json({ fallback: true });
      return new Response(new Uint8Array(2048), { headers: { "Content-Type": "audio/wav" } });
    }));

    const { result, rerender } = renderHook(() => useVoiceAI({ onAnswer, onResumeSpeech }));
    await act(() => result.current.start({ initialTranscript: "I chose Redis." }));
    await act(() => result.current.submitAnswer());
    let playback;
    act(() => {
      playback = result.current.speakGaplessSequence(["What was the trade-off?"], { onStart });
    });
    await waitFor(() => expect(onStart).toHaveBeenCalledOnce());

    act(() => {
      levels.inputLevel = 0.25;
      rerender();
    });
    expect(result.current.state).toBe("speaking");
    expect(onResumeSpeech).not.toHaveBeenCalled();
    expect(onAnswer).toHaveBeenCalledOnce();

    await act(async () => {
      result.current.interrupt();
      await playback;
    });
  });
});
