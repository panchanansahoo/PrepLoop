/* @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useVoiceAI } from "./useVoiceAI";

/**
 * Reproduces the Groq-Whisper fallback submit lock leak.
 *
 * submitAnswer() sets isSubmittingRef.current = true, then (when a MediaRecorder
 * is capturing) stops the recorder and returns. The lock is only released on the
 * browser-STT paths — mediaRecorder.onstop never clears it. So after ONE
 * whisper-mode submission every later submitAnswer() bails out at the guard and
 * the candidate's voice answer is silently dropped.
 */

class FakeMediaRecorder {
  static instances = [];
  static isTypeSupported() {
    return true;
  }

  constructor(stream, options = {}) {
    this.stream = stream;
    this.mimeType = options.mimeType || "audio/webm";
    this.state = "inactive";
    this.ondataavailable = null;
    this.onstop = null;
    FakeMediaRecorder.instances.push(this);
  }

  start() {
    this.state = "recording";
  }

  stop() {
    if (this.state === "inactive") return;
    this.state = "inactive";
    // Real MediaRecorder fires these asynchronously.
    setTimeout(() => {
      this.ondataavailable?.({ data: new Blob([new Uint8Array(2048)]) });
      this.onstop?.();
    }, 0);
  }

  abort() {
    this.stop();
  }
}

const makeStream = () => ({
  getAudioTracks: () => [{ readyState: "live", stop: vi.fn() }],
  getTracks: () => [{ readyState: "live", stop: vi.fn() }],
});

const flush = async (ms = 20) => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
};

describe("useVoiceAI — Whisper fallback submit lock", () => {
  let onAnswer;

  beforeEach(() => {
    FakeMediaRecorder.instances = [];
    onAnswer = vi.fn();

    window.MediaRecorder = FakeMediaRecorder;
    delete window.SpeechRecognition;
    delete window.webkitSpeechRecognition;

    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: vi.fn(async () => makeStream()) },
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(async (url) => {
        const isCsrf = String(url).includes("/api/csrf-token");
        return {
          ok: true,
          status: 200,
          json: async () =>
            isCsrf
              ? { csrfToken: "test-csrf" }
              : { transcript: "Hello there" },
        };
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete window.MediaRecorder;
  });

  it("keeps accepting voice answers after the first whisper submission", async () => {
    const { result, unmount } = renderHook(() => useVoiceAI({ onAnswer }));

    // Question 1 — start capture in Whisper mode.
    await act(async () => {
      await result.current.start();
    });
    await flush();

    expect(FakeMediaRecorder.instances.length).toBe(1);
    expect(result.current.state).toBe("listening");

    // Candidate answers question 1.
    await act(async () => {
      await result.current.submitAnswer(true, { submissionType: "user_done" });
    });
    await flush();

    expect(onAnswer).toHaveBeenCalledTimes(1);
    expect(onAnswer).toHaveBeenLastCalledWith("Hello there", expect.anything());

    // Question 2 — capture restarts for the next answer.
    await act(async () => {
      await result.current.start();
    });
    await flush();

    expect(FakeMediaRecorder.instances.length).toBe(2);
    expect(result.current.state).toBe("listening");

    // Candidate answers question 2 — this must still be submitted.
    await act(async () => {
      await result.current.submitAnswer(true, { submissionType: "user_done" });
    });
    await flush();

    expect(onAnswer).toHaveBeenCalledTimes(2);

    unmount();
  });
});
