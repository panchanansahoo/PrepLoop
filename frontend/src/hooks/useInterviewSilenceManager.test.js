import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useInterviewSilenceManager } from "./useInterviewSilenceManager";

describe("useInterviewSilenceManager", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("initializes with stage 0 and no active prompts", () => {
    const { result } = renderHook(() =>
      useInterviewSilenceManager({
        phase: "interview",
        isListening: true,
        aiSpeaking: false,
      })
    );

    expect(result.current.silenceStage).toBe(0);
    expect(result.current.checkInActive).toBe(false);
    expect(result.current.activeSilencePrompt).toBe("");
    expect(result.current.needAMomentCount).toBe(0);
  });

  it("cascades from Stage 0 to Nudge (Stage 1), Check-in (Stage 2), and Auto-advance (Stage 3) on prolonged silence", () => {
    const onNudge = vi.fn();
    const onCheckIn = vi.fn();
    const onAutoAdvance = vi.fn();

    const { result } = renderHook(() =>
      useInterviewSilenceManager({
        phase: "interview",
        isListening: true,
        aiSpeaking: false,
        awaitingAnswer: false,
        loading: false,
        isPaused: false,
        pacingMode: "realistic",
        interviewType: "technical",
        onNudge,
        onCheckIn,
        onAutoAdvance,
      })
    );

    expect(result.current.silenceStage).toBe(0);

    // Fast-forward past nudge threshold (>= 25s for technical)
    act(() => {
      vi.advanceTimersByTime(26000);
    });

    expect(result.current.silenceStage).toBe(1);
    expect(onNudge).toHaveBeenCalled();

    // Fast-forward past check-in threshold
    act(() => {
      vi.advanceTimersByTime(15000);
    });

    expect(result.current.silenceStage).toBe(2);
    expect(result.current.checkInActive).toBe(true);
    expect(onCheckIn).toHaveBeenCalled();

    // Fast-forward past auto-advance threshold (>= 55s total)
    act(() => {
      vi.advanceTimersByTime(20000);
    });

    expect(result.current.silenceStage).toBe(3);
    expect(onAutoAdvance).toHaveBeenCalled();
  });

  it("instantly cancels pre-speech silence timers when candidate starts speaking", () => {
    const onSpeechStarted = vi.fn();
    const onAutoAdvance = vi.fn();

    const { result, rerender } = renderHook(
      ({ inputLevel, transcript }) =>
        useInterviewSilenceManager({
          phase: "interview",
          isListening: true,
          aiSpeaking: false,
          inputLevel,
          transcript,
          onSpeechStarted,
          onAutoAdvance,
        }),
      {
        initialProps: { inputLevel: 0, transcript: "" },
      }
    );

    // 15 seconds pass while thinking
    act(() => {
      vi.advanceTimersByTime(15000);
    });

    // Candidate starts speaking: inputLevel spikes and transcript arrives
    rerender({ inputLevel: 0.15, transcript: "I think" });

    expect(onSpeechStarted).toHaveBeenCalled();
    expect(result.current.silenceStage).toBe(0);

    // Fast-forward another 60s — auto-advance should NEVER fire because candidate is speaking!
    act(() => {
      vi.advanceTimersByTime(60000);
    });

    expect(onAutoAdvance).not.toHaveBeenCalled();
  });

  it("needAMoment grants extra 30s buffer and resets checkInActive", () => {
    const onAutoAdvance = vi.fn();

    const { result } = renderHook(() =>
      useInterviewSilenceManager({
        phase: "interview",
        isListening: true,
        aiSpeaking: false,
        pacingMode: "realistic",
        onAutoAdvance,
      })
    );

    // Fast-forward until nudge
    act(() => {
      vi.advanceTimersByTime(26000);
    });
    expect(result.current.silenceStage).toBe(1);

    // Candidate requests a moment
    let success = false;
    act(() => {
      success = result.current.needAMoment();
    });

    expect(success).toBe(true);
    expect(result.current.needAMomentCount).toBe(1);
    expect(result.current.silenceStage).toBe(0);
    expect(result.current.checkInActive).toBe(false);

    // 25s later: still not auto-advanced due to the +30s extension
    act(() => {
      vi.advanceTimersByTime(25000);
    });
    expect(onAutoAdvance).not.toHaveBeenCalled();

    // After extension window finishes: auto-advance fires
    act(() => {
      vi.advanceTimersByTime(20000);
    });
    expect(onAutoAdvance).toHaveBeenCalled();
  });

  it("does not auto-advance during coding round when candidate has recent keystrokes", () => {
    const onAutoAdvance = vi.fn();

    const { result } = renderHook(() =>
      useInterviewSilenceManager({
        phase: "interview",
        isListening: true,
        aiSpeaking: false,
        isCodingRound: true,
        hasRecentKeystroke: true,
        onAutoAdvance,
      })
    );

    // Fast-forward 90s — should never auto-advance because candidate is actively writing code
    act(() => {
      vi.advanceTimersByTime(90000);
    });

    expect(result.current.silenceStage).toBe(0);
    expect(onAutoAdvance).not.toHaveBeenCalled();
  });

  it("resets all state when questionIndex advances", () => {
    const { result, rerender } = renderHook(
      ({ questionIndex }) =>
        useInterviewSilenceManager({
          phase: "interview",
          isListening: true,
          aiSpeaking: false,
          questionIndex,
        }),
      { initialProps: { questionIndex: 1 } }
    );

    // Take a moment on Q1
    act(() => {
      result.current.needAMoment();
    });
    expect(result.current.needAMomentCount).toBe(1);

    // Advance to Q2
    rerender({ questionIndex: 2 });

    expect(result.current.silenceStage).toBe(0);
    expect(result.current.needAMomentCount).toBe(0);
    expect(result.current.checkInActive).toBe(false);
  });
});
