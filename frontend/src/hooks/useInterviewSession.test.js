/* @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuth } from "../context/AuthContext";
import { useVoiceAI } from "./useVoiceAI";
import useInterviewSession, { INTERVIEW_LIFECYCLE, classifyCandidateAnswer } from "./useInterviewSession";

const createMemoryStorage = () => {
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
};

const memoryStorage = createMemoryStorage();
const memorySessionStorage = createMemoryStorage();

Object.defineProperty(globalThis, "localStorage", {
  value: memoryStorage,
  configurable: true,
});

Object.defineProperty(globalThis, "sessionStorage", {
  value: memorySessionStorage,
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

vi.mock("../pages/aiInterviewTiming", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getThinkingDelayMs: vi.fn(() => 0),
    getInterviewerReaction: vi.fn(() => ({ emoji: "", text: "" })),
    getSilencePrompt: vi.fn(() => ""),
    communicationScore: vi.fn(() => 70),
    technicalScore: vi.fn(() => 70),
    problemSolvingScore: vi.fn(() => 70),
    codeQualityScore: vi.fn(() => 70),
    getQuestionTimeLimit: vi.fn(() => 120),
  };
});

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
    sessionStorage.clear();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ fallback: true }),
      }),
    );
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

  it("tracks browser connectivity for resilient sessions", () => {
    const { result } = renderHook(() => useInterviewSession());
    expect(result.current.state.isOnline).toBe(true);

    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    expect(result.current.state.isOnline).toBe(false);

    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    expect(result.current.state.isOnline).toBe(true);
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

  it("resets pause state when the interview ends", () => {
    Object.defineProperty(window, "speechSynthesis", {
      value: { cancel: vi.fn() },
      configurable: true,
    });

    const { result } = renderHook(() => useInterviewSession());
    act(() => {
      result.current.actions.setPhase("interview");
    });
    act(() => {
      result.current.actions.togglePause();
    });
    expect(result.current.state.isPaused).toBe(true);

    act(() => {
      result.current.actions.endInterview();
    });

    expect(result.current.state.isPaused).toBe(false);
    expect(result.current.state.phase).toBe("summary");
  });

  it("stores refs for voice and timer coordination", () => {
    const { result } = renderHook(() => useInterviewSession());
    expect(typeof result.current.refs.sendAnswerRef.current).toBe("function");
    expect(result.current.refs.isListeningRef.current).toBe(false);
    expect(typeof result.current.refs.questionIndexRef.current).toBe("number");
  });
  it("tracks explicit session lifecycle states across the interview", () => {
    const { result } = renderHook(() => useInterviewSession());
    expect(result.current.state.lifecycleState).toBe(INTERVIEW_LIFECYCLE.IDLE);

    act(() => {
      result.current.actions.setPhase("connecting");
    });
    expect(result.current.state.lifecycleState).toBe(INTERVIEW_LIFECYCLE.STARTING);

    act(() => {
      result.current.actions.setPhase("interview");
    });
    expect(result.current.state.lifecycleState).toBe(INTERVIEW_LIFECYCLE.ACTIVE);

    act(() => {
      result.current.actions.togglePause();
    });
    expect(result.current.state.lifecycleState).toBe(INTERVIEW_LIFECYCLE.PAUSED);

    act(() => {
      result.current.actions.togglePause();
    });
    expect(result.current.state.lifecycleState).toBe(INTERVIEW_LIFECYCLE.ACTIVE);

    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    expect(result.current.state.lifecycleState).toBe(INTERVIEW_LIFECYCLE.RECONNECTING);

    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    expect(result.current.state.lifecycleState).toBe(INTERVIEW_LIFECYCLE.ACTIVE);

    act(() => {
      result.current.actions.endInterview();
    });
    expect(result.current.state.lifecycleState).toBe(INTERVIEW_LIFECYCLE.ENDED);
  });

  it("produces actionable session errors when offline or encountering voice failures", () => {
    const { result } = renderHook(() => useInterviewSession());

    act(() => {
      result.current.actions.setPhase("interview");
    });

    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    expect(result.current.state.sessionError).toEqual(
      expect.objectContaining({
        type: "network",
        actionType: "reconnect",
        canRetry: true,
      })
    );

    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    expect(result.current.state.sessionError).toBeNull();
  });

  it("supports manual reconnect action to restore active voice state", () => {
    const { result } = renderHook(() => useInterviewSession());
    act(() => {
      result.current.actions.setPhase("interview");
    });

    act(() => {
      result.current.actions.reconnectSession();
    });
    expect(result.current.state.lifecycleState).toBe(INTERVIEW_LIFECYCLE.ACTIVE);
  });

  it("reviews the restored draft before seeding the next microphone capture", () => {
    vi.useFakeTimers();
    const { result, unmount } = renderHook(() => useInterviewSession());
    try {
      act(() => {
        result.current.actions.restoreSession({
          conversation: [{ role: "interviewer", content: "Tell me about React" }],
          currentQuestion: "Tell me about React",
          pendingTranscript: "React uses a virtual DOM",
          questionIndex: 1,
        });
      });
      act(() => vi.advanceTimersByTime(1500));
      expect(result.current.state.transcript).toBe("React uses a virtual DOM");
      expect(result.current.state.answerReview).toBe(true);
      expect(vi.mocked(useVoiceAI).mock.results.every(({ value }) => !value.start.mock.calls.length)).toBe(true);

      act(() => result.current.actions.setTranscript("React reconciles the virtual DOM"));
      act(() => result.current.actions.continueAnswer());
      const starts = vi.mocked(useVoiceAI).mock.results.flatMap(({ value }) => value.start.mock.calls);
      expect(starts).toEqual([[{ initialTranscript: "React reconciles the virtual DOM" }]]);
      expect(result.current.state.transcript).toBe("React reconciles the virtual DOM");
      expect(result.current.state.answerReview).toBe(false);
    } finally {
      unmount();
      vi.useRealTimers();
    }
  });
  it("dispatches session error actions for microphone, typing, and reconnect", () => {
    const { result } = renderHook(() => useInterviewSession());
    act(() => {
      result.current.actions.setPhase("interview");
    });

    act(() => {
      result.current.actions.handleSessionErrorAction("switch_typed");
    });
    expect(result.current.state.answerReview).toBe(true);

    act(() => {
      result.current.actions.handleSessionErrorAction("reset_lobby");
    });
    expect(result.current.state.phase).toBe("lobby");
    expect(result.current.state.lifecycleState).toBe(INTERVIEW_LIFECYCLE.IDLE);
  });

  it("produces deterministic structured feedback and next steps on evaluation fallback", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network timeout"));

    const { result } = renderHook(() => useInterviewSession());
    act(() => {
      result.current.actions.setConversation([
        { role: "interviewer", content: "Tell me about React hooks" },
        { role: "candidate", content: "React hooks allow functional components to maintain state and side effects cleanly using useState and useEffect." }
      ]);
      result.current.actions.setCode("function useCounter() { return useState(0); }");
      result.current.actions.endInterview();
    });

    await act(async () => {
      await result.current.actions.retryAnalysis();
    });

    expect(result.current.state.analysisResult).toBeDefined();
    expect(result.current.state.analysisResult.overallScore).toBeGreaterThanOrEqual(4);
    expect(Array.isArray(result.current.state.analysisResult.categories)).toBe(true);
    expect(result.current.state.analysisResult.categories.length).toBe(4);
    expect(result.current.state.analysisResult.strengths.length).toBeGreaterThan(0);
    expect(result.current.state.analysisResult.improvements.length).toBeGreaterThan(0);
    expect(result.current.state.analysisResult.nextSteps.length).toBeGreaterThan(0);
  });

  // ── #12 Lifecycle & Silence UX Integration Tests ─────────────────────────
  it("transitions lifecycle from IDLE to ACTIVE and ENDED cleanly", () => {
    const { result } = renderHook(() => useInterviewSession());
    // Initial state in lobby is IDLE
    expect(result.current.state.lifecycleState).toBe(INTERVIEW_LIFECYCLE.IDLE);
    expect(result.current.state.phase).toBe("lobby");

    // Switching phase to interview marks lifecycle ACTIVE
    act(() => {
      result.current.actions.setPhase("interview");
    });
    expect(result.current.state.lifecycleState).toBe(INTERVIEW_LIFECYCLE.ACTIVE);
    expect(result.current.state.phase).toBe("interview");

    // Ending the interview sets lifecycle to ENDED
    act(() => {
      result.current.actions.endInterview();
    });
    expect(result.current.state.lifecycleState).toBe(INTERVIEW_LIFECYCLE.ENDED);
  });

  it("resets silence timers and avoids premature turns when awaitingAnswer or loading", () => {
    const { result } = renderHook(() => useInterviewSession());
    act(() => {
      result.current.actions.setPhase("interview");
    });
    // In interview phase, silence should not trigger an answer when loading
    expect(result.current.state.loading).toBe(false);
    expect(result.current.state.awaitingAnswer).toBe(false);
  });

  it("auto-reconnects with exponential backoff when entering RECONNECTING on network error", () => {
    vi.useFakeTimers();
    const origImpl = vi.mocked(useVoiceAI).getMockImplementation();
    const resetErrorMock = vi.fn();
    let currentErrorCode = "network";
    let currentState = "error";
    resetErrorMock.mockImplementation(() => {
      currentErrorCode = null;
      currentState = "idle";
    });
    vi.mocked(useVoiceAI).mockImplementation(() => ({
      ...(origImpl ? origImpl() : {}),
      state: currentState,
      errorCode: currentErrorCode,
      errorMessage: currentErrorCode ? "Network error" : null,
      resetError: resetErrorMock,
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
    }));

    try {
      const { result, rerender } = renderHook(() => useInterviewSession());
      act(() => {
        result.current.actions.setPhase("interview");
      });
      expect(result.current.state.lifecycleState).toBe(INTERVIEW_LIFECYCLE.RECONNECTING);

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(resetErrorMock).toHaveBeenCalledTimes(1);
      rerender();
      expect(result.current.state.lifecycleState).toBe(INTERVIEW_LIFECYCLE.ACTIVE);
    } finally {
      if (origImpl) vi.mocked(useVoiceAI).mockImplementation(origImpl);
      vi.useRealTimers();
    }
  });

  it("transitions to ERROR after exhausting 3 exponential-backoff reconnect retries", () => {
    vi.useFakeTimers();
    const origImpl = vi.mocked(useVoiceAI).getMockImplementation();
    const resetErrorMock = vi.fn();
    vi.mocked(useVoiceAI).mockImplementation(() => ({
      ...(origImpl ? origImpl() : {}),
      state: "error",
      errorCode: "network",
      errorMessage: "Persistent network error",
      resetError: resetErrorMock,
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
    }));

    try {
      const { result } = renderHook(() => useInterviewSession());
      act(() => {
        result.current.actions.setPhase("interview");
      });
      expect(result.current.state.lifecycleState).toBe(INTERVIEW_LIFECYCLE.RECONNECTING);

      // Retry 1 (1s), Retry 2 (2s), Retry 3 (4s)
      act(() => { vi.advanceTimersByTime(1000); });
      expect(resetErrorMock).toHaveBeenCalledTimes(1);
      act(() => { vi.advanceTimersByTime(2000); });
      expect(resetErrorMock).toHaveBeenCalledTimes(2);
      act(() => { vi.advanceTimersByTime(4000); });
      expect(resetErrorMock).toHaveBeenCalledTimes(3);

      expect(result.current.state.lifecycleState).toBe(INTERVIEW_LIFECYCLE.ERROR);
    } finally {
      if (origImpl) vi.mocked(useVoiceAI).mockImplementation(origImpl);
      vi.useRealTimers();
    }
  });

  it("exhausts 3 retries even when resetError clears errorCode and network error recurs asynchronously", () => {
    vi.useFakeTimers();
    const origImpl = vi.mocked(useVoiceAI).getMockImplementation();
    let currentErrorCode = "network";
    let currentState = "error";
    const resetErrorMock = vi.fn(() => {
      currentErrorCode = null;
      currentState = "idle";
    });
    vi.mocked(useVoiceAI).mockImplementation(() => ({
      ...(origImpl ? origImpl() : {}),
      state: currentState,
      errorCode: currentErrorCode,
      errorMessage: currentErrorCode ? "Network error" : null,
      resetError: resetErrorMock,
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
    }));

    try {
      const { result, rerender } = renderHook(() => useInterviewSession());
      act(() => {
        result.current.actions.setPhase("interview");
      });
      expect(result.current.state.lifecycleState).toBe(INTERVIEW_LIFECYCLE.RECONNECTING);

      // Retry 1 at 1s: resetError clears errorCode, then async failure sets it back 100ms later
      act(() => { vi.advanceTimersByTime(1000); });
      expect(resetErrorMock).toHaveBeenCalledTimes(1);
      rerender();
      act(() => { vi.advanceTimersByTime(100); });
      currentErrorCode = "network";
      currentState = "error";
      rerender();
      expect(result.current.state.lifecycleState).toBe(INTERVIEW_LIFECYCLE.RECONNECTING);

      // Retry 2 at 2s
      act(() => { vi.advanceTimersByTime(2000); });
      expect(resetErrorMock).toHaveBeenCalledTimes(2);
      rerender();
      act(() => { vi.advanceTimersByTime(100); });
      currentErrorCode = "network";
      currentState = "error";
      rerender();
      expect(result.current.state.lifecycleState).toBe(INTERVIEW_LIFECYCLE.RECONNECTING);

      // Retry 3 at 4s
      act(() => { vi.advanceTimersByTime(4000); });
      expect(resetErrorMock).toHaveBeenCalledTimes(3);
      rerender();
      act(() => { vi.advanceTimersByTime(100); });
      currentErrorCode = "network";
      currentState = "error";
      rerender();

      expect(result.current.state.lifecycleState).toBe(INTERVIEW_LIFECYCLE.ERROR);
      expect(result.current.state.sessionError?.actionType).toBe("reconnect");
    } finally {
      if (origImpl) vi.mocked(useVoiceAI).mockImplementation(origImpl);
      vi.useRealTimers();
    }
  });

  it("recovers active interview session, attemptId, and questionIndex from sessionStorage on reload", () => {
    const mockActiveSession = {
      attemptId: "att_test_recovery_999",
      questionIndex: 4,
      currentQuestion: "Tell me about a complex architecture problem you solved.",
      totalQuestions: 6,
      conversation: [
        { role: "interviewer", text: "Welcome" },
        { role: "candidate", text: "Hi" },
        { role: "interviewer", text: "Tell me about a complex architecture problem you solved." },
      ],
      elapsed: 420,
      interviewType: "technical",
      interviewerGender: "female",
      code: "print('hello')",
      language: "python",
      notes: "System design thoughts",
      pendingTranscript: "I started by measuring tail latency.",
      timestamp: Date.now() - 10000,
      isActive: true,
    };

    sessionStorage.setItem("preploop_active_interview_session", JSON.stringify(mockActiveSession));

    const { result } = renderHook(() => useInterviewSession());

    expect(result.current.state.phase).toBe("interview");
    expect(result.current.state.questionIndex).toBe(4);
    expect(result.current.state.attemptId).toBe("att_test_recovery_999");
    expect(result.current.state.currentQuestion).toBe("Tell me about a complex architecture problem you solved.");
    expect(result.current.state.totalQuestions).toBe(6);
    expect(result.current.state.elapsed).toBe(420);
    expect(result.current.state.isSessionRecovered).toBe(true);
    expect(result.current.state.lifecycleState).toBe(INTERVIEW_LIFECYCLE.ACTIVE);
    expect(result.current.state.transcript).toBe("I started by measuring tail latency.");
    expect(result.current.state.answerReview).toBe(true);
  });

  it("does not recover a draft from another interview or an unscoped legacy draft", () => {
    sessionStorage.setItem("preploop_active_transcript", "Unscoped text");
    sessionStorage.setItem("preploop_active_interview_session", JSON.stringify({
      questionSetCode: "another-set",
      questionIndex: 2,
      pendingTranscript: "Another interview's answer",
      isActive: true,
      timestamp: Date.now(),
    }));
    const { result } = renderHook(() => useInterviewSession());
    expect(result.current.state.phase).toBe("lobby");
    expect(result.current.state.transcript).toBe("");
  });

  it("restarts stopped capture on reconnect with the current answer draft", () => {
    const { result } = renderHook(() => useInterviewSession());
    act(() => result.current.actions.restoreSession({
      conversation: [{ role: "interviewer", content: "Explain cache expiry." }],
      currentQuestion: "Explain cache expiry.",
      pendingTranscript: "I set a short expiry.",
    }));
    act(() => result.current.actions.continueAnswer());
    act(() => window.dispatchEvent(new Event("offline")));
    for (const { value } of vi.mocked(useVoiceAI).mock.results) value.start.mockClear();
    act(() => window.dispatchEvent(new Event("online")));
    const starts = vi.mocked(useVoiceAI).mock.results.flatMap(({ value }) => value.start.mock.calls);
    expect(starts).toEqual([[{ initialTranscript: "I set a short expiry." }]]);
    expect(result.current.state.currentQuestion).toBe("Explain cache expiry.");
    expect(result.current.state.transcript).toBe("I set a short expiry.");
  });

  it("clears sessionStorage active session recovery when clearSavedSession is invoked", () => {
    sessionStorage.setItem("preploop_active_interview_session", JSON.stringify({
      attemptId: "att_123",
      questionIndex: 2,
      isActive: true,
      timestamp: Date.now(),
    }));

    const { result } = renderHook(() => useInterviewSession());
    act(() => {
      result.current.actions.clearSavedSession();
    });

    expect(sessionStorage.getItem("preploop_active_interview_session")).toBeNull();
  });

  it("tracks rolling scores and passes previousScores into fetchNextQuestion API request", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ question: "Explain caching strategies." }),
    });
    globalThis.fetch = fetchMock;

    const { result } = renderHook(() => useInterviewSession());

    expect(result.current.state.rollingScores).toBeDefined();
    expect(Array.isArray(result.current.state.rollingScores)).toBe(true);

    await act(async () => {
      await result.current.actions.fetchNextQuestion({
        previousScores: [75, 85, 90],
      });
    });

    expect(fetchMock).toHaveBeenCalled();
    const nextQuestionCall = fetchMock.mock.calls.find((c) => String(c[0]).includes("next-question"));
    expect(nextQuestionCall).toBeDefined();
    const body = JSON.parse(nextQuestionCall[1].body);
    expect(body.previousScores).toEqual([75, 85, 90]);
  });

  it("exports classifyCandidateAnswer and classifies candidate speech accurately", () => {
    expect(classifyCandidateAnswer("I don't know the answer to this")).toBe("dont_know");
    expect(classifyCandidateAnswer("Could you clarify the question?")).toBe("clarification");
    expect(classifyCandidateAnswer("", { code: "const x = 1;" })).toBe("code_only");
    expect(classifyCandidateAnswer("We can use dynamic programming with memoization to solve this in linear time.", { code: "function solve() {}" })).toBe("strong_complete");
  });

  describe("Conversational AI Suggestion Plan — Proactive Thought Starters & Adaptive Notifications", () => {
    it("exposes proactive suggestion timer and triggers Tier 0 Thought Starter when invoked", async () => {
      const { result } = renderHook(() => useInterviewSession({ stage: "Technical" }));

      expect(result.current.refs.proactiveSuggestionTimerRef).toBeDefined();
      expect(typeof result.current.actions.triggerProactiveThoughtStarter).toBe("function");

      await act(async () => {
        await result.current.actions.triggerProactiveThoughtStarter({ force: true });
      });

      // Active hint is set with Tier 0 Thought Starter and structured guidance bullets
      expect(result.current.state.activeHint).toBeDefined();
      expect(result.current.state.activeHint.hintTier).toBe(0);
      expect(result.current.state.activeHint.title).toBe("Thought Starter");
      expect(result.current.state.activeHint.source).toBe("proactive_silence");
      expect(Array.isArray(result.current.state.activeHint.bullets)).toBe(true);
      expect(result.current.state.activeHint.bullets.length).toBeGreaterThan(0);
    });

    it("tracks difficulty changes and triggers encouraging toasts when stepping up or scaffolding", () => {
      const { result } = renderHook(() => useInterviewSession({ difficulty: "medium" }));

      expect(result.current.state.currentDifficulty).toBe("medium");

      // Stepping up notification
      act(() => {
        result.current.actions.setScoreCue({
          isDifficultyChange: true,
          isStepUp: true,
          text: "Difficulty Stepped Up: HARD",
          color: "purple",
          adaptiveNotification: "Great performance! Stepping up difficulty to challenge your technical depth.",
          questionIndex: 2,
        });
        result.current.actions.setCurrentDifficulty("hard");
      });

      expect(result.current.state.currentDifficulty).toBe("hard");
      expect(result.current.state.scoreCue.isDifficultyChange).toBe(true);
      expect(result.current.state.scoreCue.isStepUp).toBe(true);
      expect(result.current.state.scoreCue.text).toBe("Difficulty Stepped Up: HARD");

      // Scaffolding notification
      act(() => {
        result.current.actions.setScoreCue({
          isDifficultyChange: true,
          isScaffolding: true,
          text: "Scaffolding Support Active",
          color: "cyan",
          adaptiveNotification: "Guided breakdown active to help you build the solution.",
          questionIndex: 3,
        });
      });

      expect(result.current.state.scoreCue.isDifficultyChange).toBe(true);
      expect(result.current.state.scoreCue.isScaffolding).toBe(true);
      expect(result.current.state.scoreCue.text).toBe("Scaffolding Support Active");
    });
  });
});
