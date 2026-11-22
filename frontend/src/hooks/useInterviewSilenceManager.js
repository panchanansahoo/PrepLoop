/**
 * useInterviewSilenceManager.js
 *
 * Dedicated orchestration hook for interview silence detection, turn-taking,
 * and conversational pacing:
 * 1. Pre-speech silence cascade: Nudge -> Check-in -> Auto-advance
 * 2. Instant timer reset when candidate begins speaking after thinking
 * 3. 30s "Need a moment" think-time extension
 * 4. Coding round / active typing protection (never interrupt candidate while typing)
 * 5. Long-pause timeout to advance to next question smoothly
 */
import { useState, useRef, useCallback, useEffect } from "react";
import {
  getModeConfig,
  getStageSilenceThreshold,
  getSilencePrompt,
  SILENCE_PROMPT_COOLDOWN_MS,
  logInterviewTelemetry,
} from "../pages/aiInterviewTiming";

export const CONSECUTIVE_SILENT_THRESHOLD = 3;

export function useInterviewSilenceManager({
  phase = "interview",
  isListening = false,
  aiSpeaking = false,
  awaitingAnswer = false,
  loading = false,
  isPaused = false,
  pacingMode = "realistic",
  interviewType = "technical",
  stageLabel = "",
  questionIndex = 1,
  transcript = "",
  interimText = "",
  inputLevel = 0,
  isCodingRound = false,
  hasRecentKeystroke = false,
  onNudge = null,
  onCheckIn = null,
  onAutoAdvance = null,
  onSpeechStarted = null,
} = {}) {
  const [silenceStage, setSilenceStage] = useState(0); // 0 = idle/listening, 1 = nudge, 2 = check-in, 3 = auto-advancing
  const [checkInActive, setCheckInActive] = useState(false);
  const [activeSilencePrompt, setActiveSilencePrompt] = useState("");
  const [needAMomentCount, setNeedAMomentCount] = useState(0);
  const [hasSpokenThisTurn, setHasSpokenThisTurn] = useState(false);

  const silenceNudgeTimerRef = useRef(null);
  const silenceCheckInTimerRef = useRef(null);
  const silenceAutoAdvanceTimerRef = useRef(null);
  const lastSilencePromptTimeRef = useRef(0);
  const hasSpokenThisTurnRef = useRef(false);
  const questionIndexRef = useRef(questionIndex);
  questionIndexRef.current = questionIndex;

  // Clear all pending pre-speech timers
  const clearAllTimers = useCallback(() => {
    if (silenceNudgeTimerRef.current) {
      clearTimeout(silenceNudgeTimerRef.current);
      silenceNudgeTimerRef.current = null;
    }
    if (silenceCheckInTimerRef.current) {
      clearTimeout(silenceCheckInTimerRef.current);
      silenceCheckInTimerRef.current = null;
    }
    if (silenceAutoAdvanceTimerRef.current) {
      clearTimeout(silenceAutoAdvanceTimerRef.current);
      silenceAutoAdvanceTimerRef.current = null;
    }
  }, []);

  // Reset silence manager state when question index changes or turn ends
  useEffect(() => {
    clearAllTimers();
    setSilenceStage(0);
    setCheckInActive(false);
    setActiveSilencePrompt("");
    hasSpokenThisTurnRef.current = false;
    setHasSpokenThisTurn(false);
    setNeedAMomentCount(0);
  }, [questionIndex, clearAllTimers]);

  // Candidate activity check: voice activity, existing transcript, or active typing
  const hasSpoken = Boolean(
    (transcript && transcript.trim().length > 0) ||
    (interimText && interimText.trim().length > 0) ||
    inputLevel > 0.05
  );

  // If candidate starts speaking after taking time to think, instantly reset pre-speech silence timers
  useEffect(() => {
    if (hasSpoken && isListening && !aiSpeaking) {
      if (!hasSpokenThisTurnRef.current) {
        hasSpokenThisTurnRef.current = true;
        setHasSpokenThisTurn(true);
        logInterviewTelemetry("speech_started_after_pause", {
          questionIndex: questionIndexRef.current,
          stage: stageLabel || interviewType,
        });
        onSpeechStarted?.();
      }
      // Cancel pre-speech timers as candidate is actively vocalizing
      clearAllTimers();
      setSilenceStage(0);
      setCheckInActive(false);
    }
  }, [hasSpoken, isListening, aiSpeaking, clearAllTimers, onSpeechStarted, stageLabel, interviewType]);

  // Main silence cascade: runs only when candidate has NOT spoken yet
  useEffect(() => {
    // If not in interview, or AI is speaking, or candidate has already spoken, or paused: no pre-speech timers
    if (
      phase !== "interview" ||
      !isListening ||
      aiSpeaking ||
      awaitingAnswer ||
      loading ||
      isPaused ||
      hasSpokenThisTurnRef.current ||
      hasSpoken
    ) {
      clearAllTimers();
      return;
    }

    // Do not auto-advance if candidate is actively typing/coding in coding round
    if (isCodingRound && hasRecentKeystroke) {
      clearAllTimers();
      return;
    }

    clearAllTimers();

    const modeConfig = getModeConfig(pacingMode);
    const isTechnical = /tech|dsa|coding|system[-_\s]?design/i.test(interviewType || stageLabel || "");
    const baseSilenceThreshold = getStageSilenceThreshold(stageLabel, interviewType, pacingMode);

    const nudgeMs = isTechnical
      ? Math.max(25000, baseSilenceThreshold)
      : Math.max(12000, modeConfig.nudgeMs);

    const autoAdvanceMs = isTechnical
      ? Math.max(55000, nudgeMs + 25000)
      : Math.max(35000, modeConfig.autoAdvanceMs);

    const checkInMs = Math.min(nudgeMs + 12000, autoAdvanceMs - 8000);

    // 1. Nudge Timer: provide a gentle, contextual prompt without advancing
    silenceNudgeTimerRef.current = setTimeout(() => {
      if (hasSpokenThisTurnRef.current || hasRecentKeystroke) return;
      setSilenceStage(1);
      const now = Date.now();
      const cooldown = typeof SILENCE_PROMPT_COOLDOWN_MS === "number" ? SILENCE_PROMPT_COOLDOWN_MS : 15000;
      if (now - lastSilencePromptTimeRef.current >= cooldown) {
        lastSilencePromptTimeRef.current = now;
        const prompt = getSilencePrompt(interviewType, questionIndexRef.current);
        setActiveSilencePrompt(prompt);
        onNudge?.(prompt);
      }
      logInterviewTelemetry("silence_nudge_triggered", {
        questionIndex: questionIndexRef.current,
        pacingMode,
        isTechnical,
      });
    }, nudgeMs);

    // 2. Interactive Check-in Timer: offer a hint or extra time
    silenceCheckInTimerRef.current = setTimeout(() => {
      if (hasSpokenThisTurnRef.current || hasRecentKeystroke) return;
      setSilenceStage(2);
      setCheckInActive(true);
      onCheckIn?.();
      logInterviewTelemetry("silence_checkin_triggered", {
        questionIndex: questionIndexRef.current,
        pacingMode,
      });
    }, checkInMs);

    // 3. Auto-Advance Timer: if user takes a prolonged silence without any response, advance smoothly
    silenceAutoAdvanceTimerRef.current = setTimeout(() => {
      if (hasSpokenThisTurnRef.current || hasRecentKeystroke) return;
      setSilenceStage(3);
      logInterviewTelemetry("silence_auto_advance_triggered", {
        questionIndex: questionIndexRef.current,
        pacingMode,
      });
      onAutoAdvance?.();
    }, autoAdvanceMs);

    return () => {
      clearAllTimers();
    };
  }, [
    phase,
    isListening,
    aiSpeaking,
    awaitingAnswer,
    loading,
    isPaused,
    hasSpoken,
    isCodingRound,
    hasRecentKeystroke,
    pacingMode,
    interviewType,
    stageLabel,
    clearAllTimers,
    onNudge,
    onCheckIn,
    onAutoAdvance,
  ]);

  // Need a moment (+30s extension) action
  const needAMoment = useCallback(() => {
    const modeConfig = getModeConfig(pacingMode);
    if (needAMomentCount >= modeConfig.maxNeedAMoment) return false;

    setNeedAMomentCount((prev) => prev + 1);
    setCheckInActive(false);
    setSilenceStage(0);
    clearAllTimers();

    const extensionMs = modeConfig.needAMomentMs || 30000;
    logInterviewTelemetry("silence_need_a_moment", {
      questionIndex: questionIndexRef.current,
      extensionMs,
      usedCount: needAMomentCount + 1,
    });

    // Schedule extended auto-advance with the added 30s buffer
    silenceAutoAdvanceTimerRef.current = setTimeout(() => {
      if (hasSpokenThisTurnRef.current) return;
      setSilenceStage(3);
      onAutoAdvance?.();
    }, extensionMs + 10000);

    return true;
  }, [needAMomentCount, pacingMode, clearAllTimers, onAutoAdvance]);

  return {
    silenceStage,
    checkInActive,
    activeSilencePrompt,
    needAMomentCount,
    hasSpokenThisTurn,
    needAMoment,
    clearAllTimers,
  };
}
