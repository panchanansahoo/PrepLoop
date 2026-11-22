import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  CONSECUTIVE_SILENT_THRESHOLD,
  isConsecutiveSilenceLimitReached,
  getSemanticSilenceThreshold,
} from "../pages/aiInterviewTiming";
import { useInterviewSilenceManager } from "./useInterviewSilenceManager";
import { renderHook, act } from "@testing-library/react";

describe("Smooth Interview Flow Behaviors", () => {
  it("consecutive silence threshold is 3 and triggers limit check", () => {
    expect(CONSECUTIVE_SILENT_THRESHOLD).toBe(3);
    expect(isConsecutiveSilenceLimitReached(0)).toBe(false);
    expect(isConsecutiveSilenceLimitReached(1)).toBe(false);
    expect(isConsecutiveSilenceLimitReached(2)).toBe(false);
    expect(isConsecutiveSilenceLimitReached(3)).toBe(true);
    expect(isConsecutiveSilenceLimitReached(4)).toBe(true);
  });

  describe("Silence detection restart when user takes time then starts speaking", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it("resets pre-speech silence cascade when candidate starts speaking after long think time", () => {
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
        { initialProps: { inputLevel: 0, transcript: "" } }
      );

      // User pauses for 20s to think
      act(() => {
        vi.advanceTimersByTime(20000);
      });

      // User starts speaking
      rerender({ inputLevel: 0.12, transcript: "Let me explain my approach" });

      expect(onSpeechStarted).toHaveBeenCalled();
      expect(result.current.silenceStage).toBe(0);
      expect(result.current.hasSpokenThisTurn).toBe(true);

      // Fast-forward past normal auto-advance: should not advance because user is speaking
      act(() => {
        vi.advanceTimersByTime(50000);
      });
      expect(onAutoAdvance).not.toHaveBeenCalled();
    });
  });

  describe("Adaptive Semantic Silence & Pause Tolerance", () => {
    it("provides extra pause tolerance for mid-thought pauses with hanging words", () => {
      const finishedThreshold = getSemanticSilenceThreshold({
        stage: "Technical",
        wordCount: 30,
        text: "The time complexity is O(N) and space complexity is O(1).",
      });

      const midThoughtThreshold = getSemanticSilenceThreshold({
        stage: "Technical",
        wordCount: 30,
        text: "The time complexity is O(N) and space complexity is O(1) because",
      });

      // Mid-thought sentence ending in 'because' gets additional thinking buffer
      expect(midThoughtThreshold).toBeGreaterThan(finishedThreshold);
    });

    it("grants low-confidence speech extra buffer before auto-submitting", () => {
      const normalThreshold = getSemanticSilenceThreshold({
        stage: "Technical",
        wordCount: 4,
        text: "I used hash table",
        confidence: 0.95,
      });

      const lowConfidenceThreshold = getSemanticSilenceThreshold({
        stage: "Technical",
        wordCount: 4,
        text: "I used hash table",
        confidence: 0.60,
      });

      expect(lowConfidenceThreshold).toBeGreaterThan(normalThreshold);
    });
  });
});
