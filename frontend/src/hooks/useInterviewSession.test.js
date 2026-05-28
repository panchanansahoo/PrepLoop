/* @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuth } from "../context/AuthContext";
import useInterviewSession from "./useInterviewSession";

const memoryStorage = (() => {
  let store = {};
  return {
    clear: () => {
      store = {};
    },
    getItem: (key) => store[key] ?? null,
    removeItem: (key) => {
      delete store[key];
    },
    setItem: (key, value) => {
      store[key] = String(value);
    },
  };
})();

Object.defineProperty(globalThis, "localStorage", {
  value: memoryStorage,
  configurable: true,
});

vi.mock("../context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("./useVoiceAI", () => ({
  useVoiceAI: vi.fn(() => ({
    state: "idle",
    start: vi.fn(),
    stop: vi.fn(),
    speak: vi.fn(),
    interrupt: vi.fn(),
    prefetch: vi.fn(),
    cleanup: vi.fn(),
    getAnalytics: vi.fn(() => ({})),
    inputBars: [0, 0, 0, 0, 0, 0, 0, 0],
    outputBars: [0, 0, 0, 0, 0, 0, 0, 0],
    inputLevel: 0,
    outputLevel: 0,
    inputActive: false,
    outputActive: false,
    errorMessage: null,
    interruptDetected: false,
    connectionMode: "browser",
    connectionHealth: "good",
    interimText: "",
    finalTranscript: "",
    silenceCountdown: 0,
    audioRef: { current: null },
    streamRef: { current: null },
  })),
}));

vi.mock("./useInterviewIntelligence", () => ({
  default: vi.fn(() => ({
    ingestTranscript: vi.fn(),
    ingestAudioConfidence: vi.fn(),
    analyzeAnswer: vi.fn(),
    totalFillers: 0,
    confidenceScore: 75,
  })),
}));

vi.mock("../pages/aiInterviewTiming", () => ({
  getThinkingDelayMs: vi.fn(() => 0),
  getInterviewerReaction: vi.fn(() => ({ emoji: "", text: "" })),
  getSilencePrompt: vi.fn(() => ""),
  communicationScore: vi.fn(() => 70),
  technicalScore: vi.fn(() => 70),
  problemSolvingScore: vi.fn(() => 70),
  codeQualityScore: vi.fn(() => 70),
  getQuestionTimeLimit: vi.fn(() => 120),
}));

vi.mock("../pages/aiInterviewConfig", () => ({
  BOILERPLATE: { python: "# Python", javascript: "// JS" },
  AI_INTERVIEW_GENDER_STORAGE_KEY: "ai_interview_gender",
  AI_INTERVIEW_SESSION_KEY: "ai_interview_session",
  readStoredInterviewerGender: vi.fn(() => "female"),
  STAGE_MAP: { technical: "Technical", coding: "DSA / Coding", hr: "HR" },
  formatTime: vi.fn((s) => `${s}s`),
}));

vi.mock("../pages/aiInterviewRuntime", () => ({
  CODE_DELIMITER_MARKER: "---CODE_MARKER_test---",
}));

describe("useInterviewSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      user: { id: "test-user" },
      getAuthHeaders: vi.fn(() => ({})),
    });
    localStorage.clear();
  });

  it("starts in lobby phase with default settings", () => {
    const { result } = renderHook(() => useInterviewSession());
    expect(result.current.state.phase).toBe("lobby");
    expect(result.current.state.interviewType).toBe("technical");
    expect(result.current.state.experienceLevel).toBe("fresher");
    expect(result.current.state.totalQuestions).toBe(13);
  });

  it("sets total questions to 13 for fresher", () => {
    const { result } = renderHook(() => useInterviewSession());
    expect(result.current.state.totalQuestions).toBe(13);
  });

  it("exposes all required action functions", () => {
    const { result } = renderHook(() => useInterviewSession());
    const { actions } = result.current;
    expect(typeof actions.startInterview).toBe("function");
    expect(typeof actions.sendAnswer).toBe("function");
    expect(typeof actions.endInterview).toBe("function");
    expect(typeof actions.togglePause).toBe("function");
    expect(typeof actions.toggleMic).toBe("function");
    expect(typeof actions.toggleCamera).toBe("function");
    expect(typeof actions.setPhase).toBe("function");
    expect(typeof actions.setInterviewType).toBe("function");
    expect(typeof actions.restoreSession).toBe("function");
    expect(typeof actions.clearSavedSession).toBe("function");
  });

  it("exposes voiceAI and intelligence hooks", () => {
    const { result } = renderHook(() => useInterviewSession());
    expect(result.current.voiceAI).toBeDefined();
    expect(result.current.intelligence).toBeDefined();
    expect(result.current.isListening).toBe(false);
  });

  it("initializes with default code as python boilerplate", () => {
    const { result } = renderHook(() => useInterviewSession());
    expect(result.current.state.language).toBe("python");
    expect(result.current.state.code).toBe("# Python");
  });

  it("handles language change and updates code", () => {
    const { result } = renderHook(() => useInterviewSession());
    act(() => {
      result.current.actions.handleLanguageChange("javascript");
    });
    expect(result.current.state.language).toBe("javascript");
    expect(result.current.state.code).toBe("// JS");
  });

  it("clears saved session from localStorage", () => {
    localStorage.setItem(
      "ai_interview_session",
      JSON.stringify({ conversation: [], timestamp: Date.now() }),
    );
    const { result } = renderHook(() => useInterviewSession());
    act(() => {
      result.current.actions.clearSavedSession();
    });
    expect(localStorage.getItem("ai_interview_session")).toBeNull();
  });

  it("toggles camera state", () => {
    const { result } = renderHook(() => useInterviewSession());
    expect(result.current.state.cameraOn).toBe(true);
    act(() => {
      result.current.actions.toggleCamera();
    });
    expect(result.current.state.cameraOn).toBe(false);
  });

  it("tracks elapsed time during interview phase", async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useInterviewSession());
    expect(result.current.state.elapsed).toBe(0);

    act(() => {
      result.current.actions.setPhase("interview");
    });
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.state.elapsed).toBe(3);

    vi.useRealTimers();
  });

  it("stores refs for voice and timer coordination", () => {
    const { result } = renderHook(() => useInterviewSession());
    expect(typeof result.current.refs.sendAnswerRef.current).toBe("function");
    expect(result.current.refs.isListeningRef.current).toBe(false);
    expect(typeof result.current.refs.questionIndexRef.current).toBe("number");
  });
});
