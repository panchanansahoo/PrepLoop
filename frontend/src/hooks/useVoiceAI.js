/**
 * useVoiceAI — Real-feel voice pipeline hook (Browser-native STT)
 *
 * Flow:
 *   getUserMedia → window.SpeechRecognition
 *   → interim + final transcripts in real-time → silence detection → onAnswer()
 *   → caller invokes speak(text) → POST /api/voice/tts-stream → AI audio plays
 *   → Backchannel clips play during long user speech
 *   → User can interrupt AI speech by speaking
 */
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import useAudioVisualizer from "./useAudioVisualizer";
import {
  getModeConfig,
  getSemanticSilenceThreshold,
  detectTerminalFiller,
  logInterviewTelemetry,
} from "../pages/aiInterviewTiming";
import { mergeAuthHeaders } from "../utils/authHeaders";
import { authFetch } from "../utils/authFetch";
import { buildApiUrl } from "../utils/safeApiUrl";

// ——— Configuration ———
const MIN_ANSWER_LENGTH = 2; // minimum characters before silence timer starts and answer can be submitted
const MAX_ANSWER_WAIT_MS = 300_000; // Long enough for a thoughtful response and pauses.
const BACKCHANNEL_MIN_MS = 8_000; // min speech duration before backchannel
const BACKCHANNEL_GAP_MS = 12_000; // min gap between backchannel clips

const SILENCE_AFTER_SPEECH_MAX_MS = 6_000;
const TOTAL_SILENCE_AUTO_SUBMIT_MS = 35_000;

// Silence thresholds: LONGER answers get MORE pause time (user is mid-thought)
const SILENCE_SHORT = 7000;
const SILENCE_MEDIUM = 6000;
const SILENCE_LONG = 5000;
const MAX_TRANSCRIPT_LENGTH = 10_000;

// TTS retry
const TTS_RETRY_DELAYS_MS = [500, 1000, 2000]; // Exponential backoff for TTS retries
const TTS_PLAYBACK_GUARD_MS = 30000;

// Interrupt detection (calibrated for natural conversational barge-in without echo false-positives)
const INTERRUPT_LEVEL = 0.08;
const INTERRUPT_DURATION = 250; // Sustained speech for 250ms triggers clean barge-in
const INTERRUPT_GRACE_PERIOD_MS = 1200; // Ignore interrupts during the first 1.2s of playback

// Endpoints
const RAW_API_BASE_URL = import.meta.env.VITE_API_URL || undefined;

export function buildVoiceApiUrl(path, rawBaseUrl = RAW_API_BASE_URL) {
  return buildApiUrl(path, { rawBaseUrl, apiPrefix: "/api" });
}

async function transcriptionHttpError(response) {
  const messages = {
    400: "The recording could not be uploaded. Please record again.",
    401: "Your session has expired. Sign in again, then retry the saved recording.",
    403: "Voice transcription is not available for this account.",
    413: "The recording is too large. Try a shorter answer.",
    429: "Voice transcription is temporarily rate limited. Wait a moment, then retry.",
    500: "The transcription service encountered an error. Retry the saved recording.",
    502: "The transcription service is temporarily unavailable. Retry the saved recording.",
    503: "The transcription service is temporarily unavailable. Retry the saved recording.",
    504: "Transcription took too long. Retry the saved recording.",
  };
  return new Error(messages[response.status] || `Transcription request failed (HTTP ${response.status}). Retry the saved recording.`);
}

function transcriptionNetworkError(error) {
  if (error?.name === "AbortError") return "Transcription timed out. Your recording is kept in this session; retry it or record your answer again.";
  if (typeof navigator !== "undefined" && !navigator.onLine) return "You're offline. Your recording is kept in this session; reconnect and retry transcription.";
  if (error instanceof TypeError) return "Couldn't reach the transcription service. Check your connection and that the server is running, then retry the saved recording.";
  return error?.message || "Transcription failed. Your recording is kept in this session; retry or record your answer again.";
}

function withSavedRecordingMessage(message) {
  return message.includes("recording is kept") ? message : `${message} Your recording is kept in this session.`;
}

const TTS_ENDPOINT = buildVoiceApiUrl("/voice/tts-stream");
const BACKCHANNEL_ENDPOINT = buildVoiceApiUrl("/voice/backchannel-clips");

function isVoiceDebugEnabled() {
  if (!import.meta.env.DEV) return false;
  try {
    return window.localStorage?.getItem("voiceDebug") !== "false";
  } catch {
    return true;
  }
}

function logVoiceDebug(message, context = {}) {
  if (!isVoiceDebugEnabled()) return;
  console.info("[voice-debug]", message, context);
}

function createVoiceRequestId(prefix = "voice") {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function withVoiceRequestId(headersInput = {}, prefix = "voice") {
  const requestId = createVoiceRequestId(prefix);
  return {
    requestId,
    headers: {
      ...headersInput,
      "X-Request-ID": requestId,
    },
  };
}

const TRANSITION_PHRASES = [
  "Mm-hmm, got it.",
  "Right, okay.",
  "I see, yeah.",
  "Alright.",
  "Okay, noted.",
  "Sure, makes sense.",
];

function pickTransition() {
  return TRANSITION_PHRASES[
    Math.floor(Math.random() * TRANSITION_PHRASES.length)
  ];
}

export function getAdaptiveSilenceMs(textLength, text = "") {
  const trimmed = typeof text === "string" ? text.trim() : "";
  if (trimmed) {
    // If ending with terminal punctuation or clear conclusive phrase: fast turn-around
    if (/[.!?]$/.test(trimmed) || /(?:that's all|that is all|i'm done|i am done|that's it|my approach|concludes my answer|done)$/i.test(trimmed)) {
      return 4000;
    }
    // If ending with a connector word (mid-thought pause), allow candidate more time
    if (/\b(?:and|so|because|like|which|but|or|then|also|specifically|for example|for instance)\s*$/i.test(trimmed)) {
      return 7000;
    }
    // Substantial answer without trailing connector: allow 5000ms pause (not 2800ms)
    if (textLength >= 120) {
      return 5000;
    }
  }

  // Base fallback thresholds (preserves exact behavior when text is omitted)
  if (textLength < 50) return SILENCE_SHORT;
  if (textLength < 200) return SILENCE_MEDIUM;
  return SILENCE_LONG;
}

export function getPostSpeechAutoSubmitMs(textLength, text = "") {
  return Math.min(
    getAdaptiveSilenceMs(textLength, text),
    SILENCE_AFTER_SPEECH_MAX_MS,
  );
}

export function shouldAutoSubmitAnswer({
  transcriptLength = 0,
  inputLevel = 0,
  utteranceEnded = false,
  minTranscriptLength = MIN_ANSWER_LENGTH,
  interruptLevel = INTERRUPT_LEVEL,
} = {}) {
  if (!utteranceEnded) return false;
  if (Number(transcriptLength) < Number(minTranscriptLength)) return false;
  return Number(inputLevel) < Number(interruptLevel);
}

export function isAudioContentType(contentType = "") {
  return /^audio\//i.test(String(contentType).trim());
}

function playBrowserSpeechFallback(
  text,
  { voice, gender, controller, guardMs, onStartCb },
) {
  if (!("speechSynthesis" in window)) return Promise.resolve();

  // Split text into sentences for more natural pacing with micro-pauses
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(Boolean);

  if (sentences.length === 0) return Promise.resolve();

  return new Promise((resolve) => {
    let guardTimer = null;
    let settled = false;
    let currentIdx = 0;
    let startFired = false;

    const settle = () => {
      if (settled) return;
      settled = true;
      if (guardTimer) clearTimeout(guardTimer);
      resolve();
    };

    if (controller?.signal) {
      controller.signal.addEventListener(
        "abort",
        () => {
          window.speechSynthesis.cancel();
          settle();
        },
        { once: true },
      );
    }

    guardTimer = setTimeout(() => {
      window.speechSynthesis.cancel();
      settle();
    }, guardMs || 30000);

    // --- Prosody variation for realistic, friendly voice ---
    // Base rates and pitches (warm and conversational)
    const baseRate = gender === "male" ? 0.93 : 0.94;
    const basePitch = gender === "male" ? 0.92 : 1.08;

    // Get per-sentence prosody variation — avoids monotone robotic cadence
    const getSentenceProsody = (sentence, idx) => {
      // Questions get slightly higher pitch, slower rate
      const isQuestion = sentence.trim().endsWith("?");
      // Exclamations get slightly more energy
      const isExclamation = sentence.trim().endsWith("!");
      // First sentence slightly slower (warm opening)
      const isFirst = idx === 0;

      // Rate variation: ±0.04 around base, questions slower
      let rate = baseRate + (Math.random() * 0.08 - 0.04);
      if (isQuestion) rate -= 0.03;
      if (isFirst) rate -= 0.02;
      rate = Math.max(0.82, Math.min(1.0, rate));

      // Pitch variation: ±0.04 around base, questions rise
      let pitch = basePitch + (Math.random() * 0.08 - 0.04);
      if (isQuestion) pitch += 0.06;
      if (isExclamation) pitch += 0.03;
      pitch = Math.max(0.75, Math.min(1.2, pitch));

      return { rate, pitch };
    };

    // Get pause duration based on sentence-ending punctuation
    const getInterSentencePause = (sentence) => {
      const trimmed = sentence.trim();
      if (trimmed.endsWith("?")) return 280 + Math.floor(Math.random() * 150);
      if (trimmed.endsWith("!")) return 200 + Math.floor(Math.random() * 120);
      if (trimmed.endsWith("...")) return 350 + Math.floor(Math.random() * 200);
      // Period — standard pause
      return 200 + Math.floor(Math.random() * 180);
    };

    const speakNext = () => {
      if (settled || currentIdx >= sentences.length) {
        settle();
        return;
      }

      const sentence = sentences[currentIdx];
      const utter = new SpeechSynthesisUtterance(sentence);
      if (voice) utter.voice = voice;

      // Apply per-sentence prosody variation for natural cadence
      const prosody = getSentenceProsody(sentence, currentIdx);
      utter.rate = prosody.rate;
      utter.pitch = prosody.pitch;
      utter.volume = 1.0;

      // Fire onStartCb when the first utterance actually starts playing
      utter.onstart = () => {
        if (!startFired) {
          startFired = true;
          onStartCb?.();
        }
      };

      utter.onend = () => {
        currentIdx++;
        if (currentIdx < sentences.length) {
          // Punctuation-aware inter-sentence pauses
          const pauseMs = getInterSentencePause(sentence);
          setTimeout(speakNext, pauseMs);
        } else {
          settle();
        }
      };
      utter.onerror = () => {
        currentIdx++;
        if (currentIdx < sentences.length) {
          speakNext();
        } else {
          settle();
        }
      };

      window.speechSynthesis.speak(utter);
    };

    speakNext();
  });
}

function playBlobAudio(blob, { onStart, signal } = {}) {
  if (!blob) return Promise.resolve();
  return new Promise((resolve) => {
    if (signal?.aborted) return resolve();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    let settled = false;

    const cleanup = () => {
      if (settled) return;
      settled = true;
      try {
        audio.pause();
      } catch {
        /* empty */
      }
      URL.revokeObjectURL(url);
      resolve();
    };

    audio.onended = cleanup;
    audio.onerror = cleanup;
    if (signal) {
      signal.addEventListener("abort", cleanup, { once: true });
    }

    const timer = setTimeout(cleanup, TTS_PLAYBACK_GUARD_MS);

    audio
      .play()
      .then(() => {
        onStart?.();
      })
      .catch(() => {
        clearTimeout(timer);
        cleanup();
      });
  });
}

export function shouldTreatTtsResponseAsFallback({
  contentType = "",
  blobSize = 0,
} = {}) {
  return !isAudioContentType(contentType) || Number(blobSize) < 100;
}

export function useVoiceAI({
  onAnswer,
  onTranscriptUpdate,
  onTranscript = null,
  interviewType = "technical",
  personaGender = "female",
  persona = null,
  question = "",
  enableInterrupt = true,
  getAuthHeaders = null,
  isPaused = false,
  pacingMode = "realistic",
  stage = "Technical",
  candidatePacingOffset = 0,
  onResumeSpeech = null,
  onSpeculativeCandidateAnswer = null,
  onAbortSpeculative = null,
} = {}) {
  const [state, setState] = useState("idle");
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [errorMessage, setErrorMessage] = useState(null);
  const [errorCode, setErrorCode] = useState(null); // 'not-allowed' | 'not-found' | 'audio-capture' | 'network' | 'not-supported' | 'no-audio' | 'general' | null
  const [interruptDetected, setInterruptDetected] = useState(false);
  const [connectionMode, setConnectionMode] = useState("browser"); // Always browser for STT
  const [silenceCountdown, setSilenceCountdown] = useState(0);
  const [connectionHealth, setConnectionHealth] = useState("good"); // 'good' | 'degraded' | 'fallback'
  const [voiceState, setVoiceState] = useState("idle"); // 'idle' | 'asking' | 'listening' | 'thinking' | 'countdown' | 'submitting' | 'done'
  const [micWarning, setMicWarning] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const isSubmittingRef = useRef(false);
  const stageRef = useRef(stage);
  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);
  const candidatePacingOffsetRef = useRef(candidatePacingOffset);
  useEffect(() => {
    candidatePacingOffsetRef.current = candidatePacingOffset;
  }, [candidatePacingOffset]);
  const lastSubmittedAnswerRef = useRef("");
  const lastSubmittedAtRef = useRef(0);
  const lastSpeechDetectedAtRef = useRef(0);
  const lastConfidenceRef = useRef(0.98);
  const hasPreWarmedThisTurnRef = useRef(false);
  const checkResumeWindowRef = useRef(null);
  const startRef = useRef(null);

  const deadMicDurationRef = useRef(0);
  const pacingModeRef = useRef(pacingMode);
  useEffect(() => {
    pacingModeRef.current = pacingMode;
  }, [pacingMode]);

  const onSpeculativeCandidateAnswerRef = useRef(onSpeculativeCandidateAnswer);
  const onAbortSpeculativeRef = useRef(onAbortSpeculative);
  useEffect(() => {
    onSpeculativeCandidateAnswerRef.current = onSpeculativeCandidateAnswer;
    onAbortSpeculativeRef.current = onAbortSpeculative;
  }, [onSpeculativeCandidateAnswer, onAbortSpeculative]);

  const transcriptListener = onTranscriptUpdate || onTranscript;
  const inputLevelRef = useRef(0);

  const audioRef = useRef(null);
  const streamRef = useRef(null);

  const silenceTimerRef = useRef(null);
  const maxWaitRef = useRef(null);
  const totalSilenceTimerRef = useRef(null);
  const afterSpeechSilenceRef = useRef(null);

  const finalTextRef = useRef("");
  const interimRef = useRef("");
  const activeRef = useRef(false);
  const stateRef = useRef("idle");
  const voiceSessionEpochRef = useRef(0);
  const mediaRecorderRef = useRef(null);
  const pendingWhisperBlobRef = useRef(null);
  const processRecorderOnStopRef = useRef(false);

  const ttsAbortRef = useRef(null);
  const audioCtxRef = useRef(null);
  const currentGainNodeRef = useRef(null);
  const currentSourceNodeRef = useRef(null);
  const pinnedTtsProviderRef = useRef(null); // 'neural' | 'browser-speech'
  const consecutiveCloudTtsFailuresRef = useRef(0);
  const hasAnnouncedVoiceFallbackRef = useRef(false);
  const currentBackchannelAudioRef = useRef(null);
  const isBackchannelPlayingRef = useRef(false);

  const getAudioContext = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  }, []);
  const ttsCacheRef = useRef(new Map());

  const backchannelRef = useRef(null);
  const backchannelLoadedRef = useRef(false);
  const lastBackchannelRef = useRef(0);
  const listenStartRef = useRef(0);
  const backchannelTimerRef = useRef(null);
  const noSpeechCountRef = useRef(0);
  const networkErrorCountRef = useRef(0);
  const isPausedRef = useRef(false);

  const interruptTimerRef = useRef(null);
  const speakingStartedAtRef = useRef(0);

  const analyticsRef = useRef({
    ttsFallbacks: 0,
    ttsRetries: 0,
    sessionStart: Date.now(),
  });

  const questionRef = useRef(question);
  const voicePersona = persona || (
    ["coding", "dsa", "system-design", "data-science", "ai-llm"].includes(
      String(interviewType || "").toLowerCase(),
    )
      ? "analytical"
      : String(interviewType || "").toLowerCase() === "hr"
        ? "formal"
        : "friendly"
  );
  useEffect(() => {
    questionRef.current = question;
  }, [question]);
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const resolveAuthHeaders = useCallback(
    (headersInput = {}) => {
      const callerHeaders =
        typeof getAuthHeaders === "function" ? getAuthHeaders() : {};
      return mergeAuthHeaders({ ...headersInput, ...callerHeaders });
    },
    [getAuthHeaders],
  );

  const [inputStream, setInputStreamState] = useState(null);
  const [outputAudioElement, setOutputAudioEl] = useState(null);
  const { inputBars, outputBars, inputLevel, outputLevel } = useAudioVisualizer(
    {
      inputStream,
      outputAudioElement,
      barCount: 8,
    },
  );

  useEffect(() => {
    inputLevelRef.current = inputLevel;
    // Acoustic speech detection threshold with dynamic barge-in guard:
    // If outputLevel > 0.04 (speaker audio playing), candidate must vocalize above speaker echo envelope
    const vadSpeechThreshold = outputLevel > 0.04
      ? Math.max(INTERRUPT_LEVEL, outputLevel * 0.70 + 0.05)
      : INTERRUPT_LEVEL; // 0.08

    if (stateRef.current === "listening" && inputLevel > vadSpeechThreshold) {
      lastSpeechDetectedAtRef.current = Date.now();
      if (!hasPreWarmedThisTurnRef.current) {
        hasPreWarmedThisTurnRef.current = true;
        authFetch("/api/voice/pre-warm", { method: "POST" }).catch(() => {});
      }
    }
    if (lastSubmittedAtRef.current && (Date.now() - lastSubmittedAtRef.current < 2000) && inputLevel > vadSpeechThreshold) {
      checkResumeWindowRef.current?.();
    }
  }, [inputLevel, outputLevel]);

  // Mic Problem Detection: 8s near-zero RMS while listening and no speech
  useEffect(() => {
    if (state !== "listening" || isPaused) {
      deadMicDurationRef.current = 0;
      if (micWarning) setMicWarning(false);
      return;
    }

    const interval = setInterval(() => {
      const currentLevel = inputLevelRef.current || 0;
      const hasSpeech = Boolean((finalTextRef.current || "").trim() || (interimRef.current || "").trim());

      if (currentLevel < 0.005 && !hasSpeech) {
        deadMicDurationRef.current += 500;
        if (deadMicDurationRef.current >= 8000) {
          if (!micWarning) {
            setMicWarning(true);
            logInterviewTelemetry("mic_dead_warning", { inputLevel: currentLevel });
          }
          if (totalSilenceTimerRef.current) {
            clearTimeout(totalSilenceTimerRef.current);
            totalSilenceTimerRef.current = null;
          }
        }
      } else {
        deadMicDurationRef.current = 0;
        if (micWarning) setMicWarning(false);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [state, isPaused, micWarning]);

  useEffect(() => {
    if (backchannelLoadedRef.current) return;
    backchannelLoadedRef.current = true;

    authFetch(`${BACKCHANNEL_ENDPOINT}?persona=friendly&gender=${personaGender}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.available || !data.clips) return;
        const clips = {};
        for (const [key, dataUri] of Object.entries(data.clips)) {
          const audio = new Audio(dataUri);
          audio.volume = 0.55; // Audible but doesn't overpower candidate
          clips[key] = audio;
        }
        backchannelRef.current = clips;
      })
      .catch(() => {});
  }, [personaGender]);

  const playImmediateBackchannel = useCallback((clipKey = 'mmhmm') => {
    const clips = backchannelRef.current;
    if (!clips || !clips[clipKey]) return;
    try {
      if (currentBackchannelAudioRef.current) {
        try { currentBackchannelAudioRef.current.pause(); } catch {}
      }
      const audio = new Audio(clips[clipKey]);
      audio.volume = 0.85;
      currentBackchannelAudioRef.current = audio;
      isBackchannelPlayingRef.current = true;
      const markDone = () => {
        if (currentBackchannelAudioRef.current === audio) {
          currentBackchannelAudioRef.current = null;
          isBackchannelPlayingRef.current = false;
        }
      };
      audio.addEventListener('ended', markDone, { once: true });
      audio.addEventListener('error', markDone, { once: true });
      audio.play().catch(markDone);
    } catch {
      isBackchannelPlayingRef.current = false;
      currentBackchannelAudioRef.current = null;
    }
  }, []);

  const stopImmediateBackchannel = useCallback(() => {
    if (currentBackchannelAudioRef.current) {
      try {
        currentBackchannelAudioRef.current.pause();
        currentBackchannelAudioRef.current.src = "";
      } catch {}
      currentBackchannelAudioRef.current = null;
    }
    isBackchannelPlayingRef.current = false;
  }, []);

  const waitForBackchannel = useCallback(async () => {
    if (!isBackchannelPlayingRef.current || !currentBackchannelAudioRef.current) return;
    await new Promise((resolve) => {
      const a = currentBackchannelAudioRef.current;
      if (!a || a.ended || a.paused) return resolve();
      const cleanup = () => {
        a.removeEventListener('ended', cleanup);
        a.removeEventListener('error', cleanup);
        resolve();
      };
      a.addEventListener('ended', cleanup, { once: true });
      a.addEventListener('error', cleanup, { once: true });
      setTimeout(cleanup, 900);
    });
  }, []);

  const resetVoicePinning = useCallback(() => {
    pinnedTtsProviderRef.current = null;
    consecutiveCloudTtsFailuresRef.current = 0;
  }, []);

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };
  const clearMaxWait = () => {
    if (maxWaitRef.current) {
      clearTimeout(maxWaitRef.current);
      maxWaitRef.current = null;
    }
  };
  const clearBackchannelTimer = () => {
    if (backchannelTimerRef.current) {
      clearTimeout(backchannelTimerRef.current);
      backchannelTimerRef.current = null;
    }
  };
  const clearTotalSilenceTimer = () => {
    if (totalSilenceTimerRef.current) {
      clearTimeout(totalSilenceTimerRef.current);
      totalSilenceTimerRef.current = null;
    }
  };
  const clearAfterSpeechSilence = () => {
    if (afterSpeechSilenceRef.current) {
      clearTimeout(afterSpeechSilenceRef.current);
      afterSpeechSilenceRef.current = null;
    }
    setSilenceCountdown(0);
    onAbortSpeculativeRef.current?.();
  };

  const playBackchannel = useCallback(() => {
    const clips = backchannelRef.current;
    if (!clips) return;
    const now = Date.now();
    if (now - lastBackchannelRef.current < BACKCHANNEL_GAP_MS) return;
    // Pick clip intelligently based on transcript length
    const text = (finalTextRef.current + ' ' + interimRef.current).trim();
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    let clipKey;
    if (wordCount < 10) {
      clipKey = ['goon', 'isee'][Math.floor(Math.random() * 2)];
    } else if (wordCount > 80) {
      clipKey = ['mmhmm', 'right', 'interesting'][Math.floor(Math.random() * 3)];
    } else {
      const keys = Object.keys(clips);
      clipKey = keys[Math.floor(Math.random() * keys.length)];
    }
    const audio = clips[clipKey];
    if (!audio) return;
    lastBackchannelRef.current = now;
    try {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } catch { /* no-op */ }
  }, []);

  const startBackchannelSchedule = useCallback(() => {
    clearBackchannelTimer();
    if (!backchannelRef.current) return;
    const scheduleNext = () => {
      const delayMs = BACKCHANNEL_MIN_MS + Math.random() * (BACKCHANNEL_GAP_MS - BACKCHANNEL_MIN_MS);
      backchannelTimerRef.current = setTimeout(() => {
        if (!activeRef.current || stateRef.current !== 'listening') return;
        const elapsed = Date.now() - listenStartRef.current;
        if (elapsed >= BACKCHANNEL_MIN_MS) playBackchannel();
        scheduleNext();
      }, delayMs);
    };
    scheduleNext();
  }, [playBackchannel]);

  const checkResumeWindow = useCallback((interimSpeech = "") => {
    const now = Date.now();
    if (lastSubmittedAtRef.current && (now - lastSubmittedAtRef.current) < 2000) {
      const prevAnswer = lastSubmittedAnswerRef.current;
      console.log("[useVoiceAI] Candidate resumed speech within 2s resume window! Aborting submit & stopping audio.");
      lastSubmittedAtRef.current = 0;
      lastSubmittedAnswerRef.current = "";
      lastSpeechDetectedAtRef.current = now;

      // 1. Immediately cancel & stop any AI TTS audio that may have started
      if (ttsAbortRef.current) {
        ttsAbortRef.current.abort();
        ttsAbortRef.current = null;
      }
      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        } catch { /* no-op */ }
        audioRef.current = null;
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }

      // 2. Restore candidate speech buffer
      finalTextRef.current = prevAnswer;
      const restored = (prevAnswer + (interimSpeech ? " " + interimSpeech : "")).trim();
      setTranscript(restored);
      setVoiceState("listening");
      setState("listening");
      stateRef.current = "listening";
      isSubmittingRef.current = false;

      // 3. Restart browser speech recognition if it was stopped
      if (!activeRef.current) {
        startRef.current?.();
      }

      // 4. Notify session hook to cancel follow-up call, stop speakSequence, and hold question counter
      onResumeSpeech?.(prevAnswer);
      return true;
    }
    return false;
  }, [onResumeSpeech]);
  checkResumeWindowRef.current = checkResumeWindow;

  const submitAnswer = useCallback(async (force = false, meta = {}) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setVoiceState("submitting");
    clearSilenceTimer();
    clearMaxWait();
    clearBackchannelTimer();
    clearTotalSilenceTimer();
    clearAfterSpeechSilence();
    setSilenceCountdown(0);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      try {
        processRecorderOnStopRef.current = true;
        setState("processing");
        stateRef.current = "processing";
        mediaRecorderRef.current.stop();
      } catch {
        // If the recorder refuses to stop, `onstop` never fires and would never
        // release the submit lock — release it here or every later submit is lost.
        processRecorderOnStopRef.current = false;
        isSubmittingRef.current = false;
      }
      return;
    }

    // Rescue any remaining interim text that the browser STT hasn't finalized yet.
    // This prevents words from being silently dropped during auto-submit.
    if (interimRef.current && interimRef.current.trim()) {
      const rescued = (finalTextRef.current + " " + interimRef.current).trim();
      finalTextRef.current =
        rescued.length > MAX_TRANSCRIPT_LENGTH
          ? rescued.slice(-MAX_TRANSCRIPT_LENGTH)
          : rescued;
      interimRef.current = "";
      setTranscript(finalTextRef.current);
      setInterimText("");
      console.log("[useVoiceAI] Rescued interim text before submit:", finalTextRef.current.slice(-60));
    }

    const answer = finalTextRef.current.trim();

    if ((!answer || answer.length < MIN_ANSWER_LENGTH) && !force) {
      isSubmittingRef.current = false;
      if (activeRef.current) {
        setState("listening");
        stateRef.current = "listening";
        setVoiceState("listening");
      }
      return;
    }

    // Cleanly stop speech recognition before processing so it doesn't keep running in background
    if (browserRecognitionRef.current) {
      browserRecognitionRef.current.onresult = null;
      browserRecognitionRef.current.onerror = null;
      browserRecognitionRef.current.onend = null;
      try {
        browserRecognitionRef.current.stop();
      } catch {
        /* no-op */
      }
      browserRecognitionRef.current = null;
    }
    activeRef.current = false;

    // Save the answer text BEFORE clearing any refs/state
    const savedAnswer = answer;
    lastSubmittedAnswerRef.current = savedAnswer;
    lastSubmittedAtRef.current = Date.now();

    setState("processing");
    stateRef.current = "processing";
    setFinalTranscript(savedAnswer);

    // Clear refs BEFORE calling onAnswer so the hook state is clean
    finalTextRef.current = "";
    interimRef.current = "";

    const lastSpeechAt = lastSpeechDetectedAtRef.current || Date.now();
    const enrichedMeta = {
      ...meta,
      lastSpeechAt,
      sttSource: connectionMode === "whisper" ? "groq-whisper" : "browser-stt",
      confidence: lastConfidenceRef.current || 0.98,
    };
    try {
      onAnswer?.(savedAnswer, enrichedMeta);
    } catch {
      /* no-op */
    } finally {
      isSubmittingRef.current = false;
    }

    setTranscript("");
    setInterimText("");
    activeRef.current = false;
    setState("idle");
    stateRef.current = "idle";
    setVoiceState("done");
  }, [onAnswer]);

  const scheduleAfterSpeechSilence = useCallback(
    (delayMs) => {
      clearAfterSpeechSilence();
      const startedAt = Date.now();
      let speculativeTriggered = false;
      const tick = () => {
        let remainingMs = Math.max(0, delayMs - (Date.now() - startedAt));

        // VAD-assisted semantic turn-taking:
        // Web Speech API rarely outputs punctuation (.!?).
        // If candidate has spoken a substantive response (>= 6 words),
        // does not end on a hanging conjunction/preposition,
        // and microphone acoustic energy is quiet (< 0.02) for >= 1600ms, trigger snappy submission!
        const currentText = (finalTextRef.current + " " + (interimRef.current || "")).trim();
        const wordCount = currentText ? currentText.split(/\s+/).filter(Boolean).length : 0;
        const endsWithHangingWord = /\b(?:and|so|because|like|which|but|or|then|also|specifically|for example|for instance|if|when|where|while|since|with|to|from|about)\s*$/i.test(currentText);
        const silenceElapsedMs = Date.now() - startedAt;

        // Speculative Fast-Reply: Trigger prefetch after 800-1000ms of quiet silence
        if (
          !speculativeTriggered &&
          silenceElapsedMs >= 800 &&
          wordCount >= 6 &&
          !endsWithHangingWord &&
          (inputLevelRef.current || 0) < 0.02
        ) {
          speculativeTriggered = true;
          onSpeculativeCandidateAnswerRef.current?.(currentText);
        }

        const requiredSilenceMs = getSemanticSilenceThreshold({
          stage: stageRef.current,
          wordCount,
          text: currentText,
          candidatePacingOffset: candidatePacingOffsetRef.current,
        });

        if (!endsWithHangingWord && silenceElapsedMs >= requiredSilenceMs && (inputLevelRef.current || 0) < 0.02) {
          remainingMs = 0;
        }

        setSilenceCountdown(Math.ceil(remainingMs / 1000));
        if (remainingMs <= 0) {
          afterSpeechSilenceRef.current = null;
          setSilenceCountdown(0);
          // Rescue any interim text directly into final text when silence window completes
          if (interimRef.current && interimRef.current.trim().length > 0) {
            const rescued = (finalTextRef.current + " " + interimRef.current).trim();
            finalTextRef.current =
              rescued.length > MAX_TRANSCRIPT_LENGTH
                ? rescued.slice(-MAX_TRANSCRIPT_LENGTH)
                : rescued;
            interimRef.current = "";
            setTranscript(finalTextRef.current);
            setInterimText("");
          }
          if (isPausedRef.current) {
            // Interview is paused — reschedule instead of auto-submitting
            afterSpeechSilenceRef.current = setTimeout(tick, 500);
            return;
          }
          if (inputLevelRef.current > 0.05) {
            // Candidate is actively speaking into mic; grant an extra second to avoid cut-off
            afterSpeechSilenceRef.current = setTimeout(tick, 1000);
            return;
          }
          if (finalTextRef.current.trim().length >= MIN_ANSWER_LENGTH) {
            submitAnswer();
          }
          return;
        }
        afterSpeechSilenceRef.current = setTimeout(
          tick,
          Math.min(250, remainingMs),
        );
      };
      tick();
    },
    [submitAnswer],
  );

  const browserRecognitionRef = useRef(null);
  // Epoch counter to prevent stale recognition instances from ghost-restarting.
  // Each call to start() increments this; onend handlers only restart if their
  // captured epoch matches the current one.
  const recognitionEpochRef = useRef(0);

  const startWhisperFallback = useCallback(async () => {
    const sessionEpoch = voiceSessionEpochRef.current;
    if (typeof window === "undefined" || !window.MediaRecorder) {
      setErrorMessage(
        "Speech recognition is not available in this browser. Please use Chrome or Edge.",
      );
      setErrorCode("not-supported");
      activeRef.current = false;
      setState("error");
      stateRef.current = "error";
      return;
    }

    console.log("[useVoiceAI] Browser SpeechRecognition unavailable/failed — activating Groq Whisper audio recorder fallback");
    // Invalidate any browser recognition instance before taking over audio capture.
    recognitionEpochRef.current += 1;
    if (browserRecognitionRef.current) {
      const recognition = browserRecognitionRef.current;
      recognition.onstart = null;
      recognition.onaudiostart = null;
      recognition.onspeechstart = null;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try {
        recognition.abort();
      } catch {
        /* no-op */
      }
      browserRecognitionRef.current = null;
    }
    setConnectionMode("whisper");
    setState("listening");
    stateRef.current = "listening";
    activeRef.current = true;

    try {
      const existingStream = streamRef.current;
      const stream = existingStream || await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      if (voiceSessionEpochRef.current !== sessionEpoch || !activeRef.current) {
        if (!existingStream) stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      setInputStreamState(stream);

      const chunks = [];
      const mimeType = window.MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : window.MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      // Silence auto-submit for Whisper fallback mode based on visualizer audio level
      let whisperHasSpoken = false;
      let whisperSilenceMs = 0;
      const whisperSilenceInterval = setInterval(() => {
        if (!activeRef.current || stateRef.current !== "listening" || processRecorderOnStopRef.current) {
          clearInterval(whisperSilenceInterval);
          return;
        }

        const level = inputLevelRef.current || 0;
        if (level > 0.04) {
          whisperHasSpoken = true;
          whisperSilenceMs = 0;
        } else if (whisperHasSpoken) {
          whisperSilenceMs += 300;
          const postSpeechMs = getModeConfig(pacingModeRef.current).postSpeechSubmitMs;
          if (whisperSilenceMs >= postSpeechMs) {
            clearInterval(whisperSilenceInterval);
            console.log("[useVoiceAI] Whisper auto-submitting after user speech pause");
            submitAnswer();
          }
        }
      }, 300);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      // submitAnswer() takes the submit lock and then hands off to this handler
      // by stopping the recorder and returning — it never releases the lock
      // itself. Wrap the whole handler so the lock is released on EVERY exit
      // path below; otherwise the first Whisper submission permanently wedges
      // submitAnswer() and all later voice answers are silently dropped.
      const handleRecorderStop = async () => {
        mediaRecorderRef.current = null;
        if (voiceSessionEpochRef.current !== sessionEpoch) return;
        if (!processRecorderOnStopRef.current) {
          activeRef.current = false;
          setState("idle");
          stateRef.current = "idle";
          return;
        }
        processRecorderOnStopRef.current = false;
        if (chunks.length === 0) {
          activeRef.current = false;
          setErrorMessage("No audio was captured. Check your microphone and try again.");
          setErrorCode("no-audio");
          setState("error");
          stateRef.current = "error";
          return;
        }
        const audioBlob = new Blob(chunks, { type: mimeType });
        if (audioBlob.size < 500) {
          activeRef.current = false;
          setErrorMessage("We couldn't hear a clear recording. Please try speaking again.");
          setErrorCode("no-audio");
          setState("error");
          stateRef.current = "error";
          return;
        }

        setState("processing");
        stateRef.current = "processing";
        pendingWhisperBlobRef.current = audioBlob;
        try {
          const formData = new FormData();
          const extension = mimeType.includes("mp4") ? "mp4" : "webm";
          formData.append("audio", audioBlob, `recording.${extension}`);
          const res = await authFetch(buildVoiceApiUrl("/voice/stt-chunk"), {
            method: "POST",
            body: formData,
          });
          if (!res.ok) throw await transcriptionHttpError(res);
          const data = await res.json();
          if (voiceSessionEpochRef.current !== sessionEpoch || !activeRef.current) return;
          const transcribed = (data.transcript || data.text || "").trim();
          if (transcribed && transcribed.length >= MIN_ANSWER_LENGTH) {
            pendingWhisperBlobRef.current = null;
            setFinalTranscript(transcribed);
            setTranscript(transcribed);
            setInterimText("");
            transcriptListener?.(transcribed);
            onAnswer?.(transcribed, {});
          } else {
            setErrorMessage(
              data.fallback
                ? "Speech transcription is temporarily unavailable. Your recording is kept in this session; retry transcription or record your answer again."
                : "We couldn't recognize that answer. Your recording is kept in this session; try speaking again.",
            );
            setState("error");
            stateRef.current = "error";
          }
        } catch (err) {
          if (voiceSessionEpochRef.current !== sessionEpoch || !activeRef.current) return;
          console.warn("[useVoiceAI] Whisper fallback STT failed:", err);
          setErrorMessage(withSavedRecordingMessage(transcriptionNetworkError(err)));
          setErrorCode("network");
          setState("error");
          stateRef.current = "error";
        } finally {
          if (voiceSessionEpochRef.current === sessionEpoch) {
            activeRef.current = false;
            if (stateRef.current !== "error") {
              setState("idle");
              stateRef.current = "idle";
            }
          }
        }
      };

      mediaRecorder.onstop = async () => {
        try {
          await handleRecorderStop();
        } finally {
          isSubmittingRef.current = false;
        }
      };

      mediaRecorder.start(1000);
      console.log("[useVoiceAI] ✓ Groq Whisper media recorder active");

      // Start silence timers for Whisper mode
      clearMaxWait();
      clearTotalSilenceTimer();
      maxWaitRef.current = setTimeout(submitAnswer, MAX_ANSWER_WAIT_MS);
      // Do not stop a buffered recording just because the candidate is thinking.
      // They can finish explicitly; speech-triggered silence timing is available
      // in browser recognition mode.
    } catch (mediaErr) {
      if (voiceSessionEpochRef.current !== sessionEpoch || !activeRef.current) return;
      console.error("[useVoiceAI] Failed to start MediaRecorder fallback:", mediaErr);
      setErrorMessage("Microphone access failed. Please check permissions.");
      setErrorCode(mediaErr?.name === "NotAllowedError" ? "not-allowed" : mediaErr?.name === "NotFoundError" ? "not-found" : "not-allowed");
      setState("error");
      stateRef.current = "error";
      activeRef.current = false;
    }
  }, [onAnswer, submitAnswer, transcriptListener]);

  const start = useCallback(async () => {
    // Only skip if already actively listening
    if (activeRef.current && stateRef.current === "listening") {
      return;
    }
    voiceSessionEpochRef.current += 1;
    // A new capture session must never inherit a submit lock from a previous
    // one — a stale lock makes every later submitAnswer() a silent no-op.
    isSubmittingRef.current = false;
    pendingWhisperBlobRef.current = null;
    activeRef.current = true;
    setState("listening");
    stateRef.current = "listening";

    setErrorMessage(null);
    setErrorCode(null);
    finalTextRef.current = "";
    interimRef.current = "";
    setTranscript("");
    setInterimText("");
    setFinalTranscript("");
    setInterruptDetected(false);
    setSilenceCountdown(0);

    if (ttsAbortRef.current) {
      ttsAbortRef.current.abort();
      ttsAbortRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    // Cancel any lingering browser speechSynthesis — on some browsers,
    // SpeechRecognition can't capture audio while speechSynthesis is still active
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    // Stop any previous recognition instance to prevent conflicts
    if (browserRecognitionRef.current) {
      // Detach handlers BEFORE stopping to prevent ghost-restarts
      browserRecognitionRef.current.onresult = null;
      browserRecognitionRef.current.onerror = null;
      browserRecognitionRef.current.onend = null;
      try {
        browserRecognitionRef.current.stop();
      } catch { /* no-op */ }
      browserRecognitionRef.current = null;
    }

    // Increment epoch so any lingering old instance's onend handler
    // knows it's stale and won't restart itself
    const epoch = ++recognitionEpochRef.current;

    console.log("[useVoiceAI] Starting voice recording... (epoch", epoch, ")");

    try {
      // Manage visualizer stream non-blockingly without destroying existing live tracks
      // and with standard audio processing so microphone volume is not muted on Windows.
      try {
        const isStreamActive =
          streamRef.current &&
          streamRef.current.getAudioTracks().some((t) => t.readyState === "live");
        if (!isStreamActive && navigator.mediaDevices?.getUserMedia) {
          navigator.mediaDevices
            .getUserMedia({
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              },
            })
            .then((stream) => {
              if (recognitionEpochRef.current === epoch && activeRef.current) {
                streamRef.current = stream;
                setInputStreamState(stream);
                console.log("[useVoiceAI] ✓ Visualizer microphone stream acquired");
              } else {
                stream.getTracks().forEach((t) => t.stop());
              }
            })
            .catch((streamErr) => {
              console.warn(
                "[useVoiceAI] Visualizer microphone stream unavailable:",
                streamErr,
              );
            });
        } else if (isStreamActive) {
          setInputStreamState(streamRef.current);
        }
      } catch (streamErr) {
        console.warn("[useVoiceAI] Visualizer setup exception:", streamErr);
      }

      activeRef.current = true;
      noSpeechCountRef.current = 0;
      listenStartRef.current = Date.now();

      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        console.log("[useVoiceAI] Using browser SpeechRecognition");
        setConnectionMode("browser");

        const getRecognitionLocale = () => {
          if (typeof navigator === "undefined") return "en-US";
          const lang =
            navigator.language ||
            (navigator.languages && navigator.languages[0]) ||
            "en-US";
          // If browser has an English regional tag (en-US, en-IN, en-GB, etc.), use it
          if (/^en[-_]/i.test(lang)) {
            return lang.replace("_", "-");
          }
          return "en-US";
        };

        const createAndStartRecognition = () => {
          if (!activeRef.current || recognitionEpochRef.current !== epoch) return;

          // Detach and abort old instance before creating a fresh one
          if (browserRecognitionRef.current) {
            try {
              browserRecognitionRef.current.onstart = null;
              browserRecognitionRef.current.onaudiostart = null;
              browserRecognitionRef.current.onspeechstart = null;
              browserRecognitionRef.current.onresult = null;
              browserRecognitionRef.current.onerror = null;
              browserRecognitionRef.current.onend = null;
              browserRecognitionRef.current.abort();
            } catch {
              /* no-op */
            }
            browserRecognitionRef.current = null;
          }

          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = getRecognitionLocale();
          recognition.maxAlternatives = 1;
          browserRecognitionRef.current = recognition;

          recognition.onstart = () => {
            if (recognitionEpochRef.current !== epoch) return;
            console.log("[useVoiceAI] ✓ SpeechRecognition onstart fired (epoch", epoch, ")");
            setState("listening");
            setVoiceState("listening");

            // Start silence/max-wait timers ONLY after recognition is confirmed active.
            clearMaxWait();
            clearTotalSilenceTimer();
            maxWaitRef.current = setTimeout(submitAnswer, MAX_ANSWER_WAIT_MS);
            totalSilenceTimerRef.current = setTimeout(() => {
              const currentTotal = (finalTextRef.current + " " + (interimRef.current || "")).trim();
              if (currentTotal.length >= MIN_ANSWER_LENGTH) {
                console.log(
                  "[useVoiceAI] Total silence timeout with speech detected, submitting answer",
                );
                submitAnswer();
              } else {
                console.log(
                  "[useVoiceAI] Candidate is still thinking (no speech yet), waiting...",
                );
              }
            }, TOTAL_SILENCE_AUTO_SUBMIT_MS);
          };

          recognition.onaudiostart = () => {
            if (recognitionEpochRef.current !== epoch) return;
            console.log("[useVoiceAI] ✓ Audio capture started (epoch", epoch, ")");
          };

          recognition.onspeechstart = () => {
            if (recognitionEpochRef.current !== epoch) return;
            noSpeechCountRef.current = 0;
            lastSpeechDetectedAtRef.current = Date.now();
            console.log("[useVoiceAI] ✓ Speech detected by browser (epoch", epoch, ")");
          };

          recognition.onresult = (event) => {
            if (!activeRef.current || recognitionEpochRef.current !== epoch) return;
            lastSpeechDetectedAtRef.current = Date.now();
            let interim = "";
            let finalText = "";
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              const result = event.results[i];
              if (result[0]?.confidence) {
                lastConfidenceRef.current = result[0].confidence;
              }
              if (result.isFinal) {
                finalText += result[0].transcript;
              } else if (result[0]?.transcript) {
                interim += result[0].transcript;
              }
            }
            if (interim || finalText) {
              networkErrorCountRef.current = 0;
              console.log("[useVoiceAI] Speech result:", { interim, finalText });
            }
            if (finalText) {
              const appended = (finalTextRef.current + " " + finalText).trim();
              finalTextRef.current =
                appended.length > MAX_TRANSCRIPT_LENGTH
                  ? appended.slice(-MAX_TRANSCRIPT_LENGTH)
                  : appended;
              interimRef.current = "";
              setTranscript(finalTextRef.current);
              setInterimText("");
              transcriptListener?.(finalTextRef.current);
            }
            if (interim) {
              interimRef.current = interim;
              setInterimText(interim);
              const combined = (finalTextRef.current + " " + interim).trim();
              transcriptListener?.(combined);
            }
            const currentTotal = (finalTextRef.current + " " + (interimRef.current || "")).trim();
            if (currentTotal.length >= MIN_ANSWER_LENGTH) {
              clearTotalSilenceTimer();
              clearAfterSpeechSilence();

              const modeConfig = getModeConfig(pacingModeRef.current);

              // Terminal filler phrase check: give think time extension
              if (detectTerminalFiller(currentTotal)) {
                setIsThinking(true);
                setVoiceState("thinking");
                logInterviewTelemetry("filler_detected", { transcript: currentTotal });
                scheduleAfterSpeechSilence(modeConfig.fillerExtensionMs);
                return;
              }

              setIsThinking(false);
              setVoiceState("countdown");
              const autoSubmitMs = Math.max(
                modeConfig.postSpeechSubmitMs,
                getAdaptiveSilenceMs(currentTotal.length, currentTotal)
              );
              scheduleAfterSpeechSilence(autoSubmitMs);
            }
          };

          recognition.onerror = (event) => {
            if (recognitionEpochRef.current !== epoch) return;

            // 'no-speech' is normal when candidate is thinking or waiting.
            // NEVER switch to Whisper on no-speech; onend will restart recognition automatically.
            if (event.error === "no-speech") {
              return;
            }

            if (event.error === "aborted") {
              return;
            }

            console.warn("[useVoiceAI] Browser STT error:", event.error);

            if (event.error === "not-allowed" || event.error === "service-not-allowed") {
              setErrorMessage(
                "Microphone access was denied. Please allow microphone access in your browser settings and try again.",
              );
              setErrorCode("not-allowed");
              activeRef.current = false;
              setState("error");
              return;
            }

            if (event.error === "audio-capture") {
              console.warn("[useVoiceAI] audio-capture error in SpeechRecognition, falling back to Groq Whisper");
              if (window.MediaRecorder) {
                startWhisperFallback();
                return;
              }
              setErrorMessage(
                "Could not capture audio. Please check that your microphone is not in use by another app.",
              );
              setErrorCode("audio-capture");
              activeRef.current = false;
              setState("error");
              return;
            }

            if (event.error === "network") {
              networkErrorCountRef.current = (networkErrorCountRef.current || 0) + 1;
              console.warn(`[useVoiceAI] SpeechRecognition network error (attempt ${networkErrorCountRef.current})`);
              // Retry browser SpeechRecognition first before falling back to Whisper
              if (networkErrorCountRef.current <= 2) {
                return; // onend will restart SpeechRecognition
              }
              if (window.MediaRecorder) {
                console.warn("[useVoiceAI] Persistent network error in SpeechRecognition, falling back to Groq Whisper");
                startWhisperFallback();
                return;
              }
            }
          };

          recognition.onend = () => {
            // CRITICAL: Check epoch to prevent ghost-restarts.
            if (recognitionEpochRef.current !== epoch) {
              console.log("[useVoiceAI] Stale recognition onend (epoch", epoch, "vs current", recognitionEpochRef.current, ") — not restarting");
              return;
            }
            if (activeRef.current && stateRef.current !== "error" && stateRef.current !== "processing") {
              // Rescue any pending interim text as final before restarting
              if (interimRef.current && interimRef.current.trim()) {
                const rescued = (finalTextRef.current + " " + interimRef.current).trim();
                finalTextRef.current =
                  rescued.length > MAX_TRANSCRIPT_LENGTH
                    ? rescued.slice(-MAX_TRANSCRIPT_LENGTH)
                    : rescued;
                interimRef.current = "";
                setTranscript(finalTextRef.current);
                setInterimText("");
                transcriptListener?.(finalTextRef.current);
                console.log("[useVoiceAI] Rescued interim text on recognition restart:", finalTextRef.current);
              }

              // Create a fresh instance on restart to continue listening.
              // Cancel any lingering speechSynthesis that could block mic capture.
              if ("speechSynthesis" in window) window.speechSynthesis.cancel();
              setTimeout(() => {
                if (activeRef.current && recognitionEpochRef.current === epoch && stateRef.current !== "error" && stateRef.current !== "processing") {
                  createAndStartRecognition();
                }
              }, 50);
            }
          };

          try {
            recognition.start();
            console.log("[useVoiceAI] ✓ Browser SpeechRecognition.start() called (epoch", epoch, ")");
          } catch (e) {
            console.warn("[useVoiceAI] Browser STT start failed:", e);
            if (activeRef.current && recognitionEpochRef.current === epoch && stateRef.current !== "error") {
              setTimeout(() => {
                if (activeRef.current && recognitionEpochRef.current === epoch && stateRef.current !== "error") {
                  createAndStartRecognition();
                }
              }, 400);
            }
          }
        };

        // Start recognition with small settling delay
        setTimeout(() => {
          if (activeRef.current && recognitionEpochRef.current === epoch) {
            createAndStartRecognition();
          }
        }, 120);
      } else if (typeof window !== "undefined" && window.MediaRecorder) {
        startWhisperFallback();
      } else {
        console.warn(
          "[useVoiceAI] No STT available (neither SpeechRecognition nor MediaRecorder)",
        );
        setErrorMessage(
          "Speech recognition is not available in this browser. Please use Chrome or Edge.",
        );
        setErrorCode("not-supported");
        activeRef.current = false;
        setState("error");
      }

      // Max-wait timer is set inside recognition.onstart (or Whisper's start)
      // so we do NOT duplicate it here — a second timer would race and could
      // fire before recognition even begins.

      startBackchannelSchedule();
    } catch (err) {
      console.error("[useVoiceAI] Start error:", err);
      const errorMsg =
        err.name === "NotAllowedError"
          ? "Microphone access denied. Please allow microphone access and try again."
          : err.name === "NotFoundError"
            ? "No microphone found. Please connect a microphone and try again."
            : `Microphone error: ${err.message}`;
      setErrorMessage(errorMsg);
      setErrorCode(err?.name === "NotAllowedError" ? "not-allowed" : err?.name === "NotFoundError" ? "not-found" : "general");
      setState("error");
      activeRef.current = false;
    }
  }, [submitAnswer, startBackchannelSchedule, scheduleAfterSpeechSilence, startWhisperFallback]);
  startRef.current = start;

  const stop = useCallback(() => {
    voiceSessionEpochRef.current += 1;
    recognitionEpochRef.current += 1;
    activeRef.current = false;
    clearSilenceTimer();
    clearMaxWait();
    clearBackchannelTimer();
    clearTotalSilenceTimer();
    clearAfterSpeechSilence();
    setSilenceCountdown(0);
    setInputStreamState(null);

    if (browserRecognitionRef.current) {
      // Detach ALL event handlers BEFORE stopping to prevent
      // the onend handler from ghost-restarting this instance
      browserRecognitionRef.current.onresult = null;
      browserRecognitionRef.current.onerror = null;
      browserRecognitionRef.current.onend = null;
      try {
        browserRecognitionRef.current.stop();
      } catch {
        /* no-op */
      }
      browserRecognitionRef.current = null;
    }

    if (mediaRecorderRef.current) {
      processRecorderOnStopRef.current = false;
      try {
        if (mediaRecorderRef.current.state !== "inactive") {
          mediaRecorderRef.current.stop();
        }
      } catch {
        /* no-op */
      }
      mediaRecorderRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setState("idle");
  }, []);

  const releaseStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const interrupt = useCallback(() => {
    if (ttsAbortRef.current) {
      ttsAbortRef.current.abort();
      ttsAbortRef.current = null;
    }

    // Smooth 80-100ms fade-out to prevent speaker pop / harsh cut
    if (currentGainNodeRef.current && audioCtxRef.current) {
      try {
        const ctx = audioCtxRef.current;
        const gain = currentGainNodeRef.current.gain;
        gain.cancelScheduledValues(ctx.currentTime);
        gain.setValueAtTime(gain.value, ctx.currentTime);
        gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
        setTimeout(() => {
          try { currentSourceNodeRef.current?.stop(); } catch {}
          currentSourceNodeRef.current = null;
          currentGainNodeRef.current = null;
        }, 85);
      } catch {}
    } else if (audioRef.current) {
      const a = audioRef.current;
      const initialVol = a.volume || 1.0;
      let step = 0;
      const fadeTimer = setInterval(() => {
        step++;
        a.volume = Math.max(0, initialVol * (1 - step / 6));
        if (step >= 6) {
          clearInterval(fadeTimer);
          try { a.pause(); a.src = ""; } catch {}
        }
      }, 15);
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setOutputAudioEl(null);
    setInterruptDetected(false);
    if (interruptTimerRef.current) {
      clearTimeout(interruptTimerRef.current);
      interruptTimerRef.current = null;
    }
    setState("idle");
  }, []);

  useEffect(() => {
    if (!enableInterrupt) {
      if (interruptTimerRef.current) {
        clearTimeout(interruptTimerRef.current);
        interruptTimerRef.current = null;
      }
      return;
    }

    if (state !== "speaking") {
      if (interruptTimerRef.current) {
        clearTimeout(interruptTimerRef.current);
        interruptTimerRef.current = null;
      }
      setInterruptDetected(false);
      return;
    }

    // Ignore interrupts during the initial playback grace window to prevent laptop speaker echo feedback
    const elapsedSpeaking = Date.now() - speakingStartedAtRef.current;
    if (elapsedSpeaking < INTERRUPT_GRACE_PERIOD_MS) {
      if (interruptTimerRef.current) {
        clearTimeout(interruptTimerRef.current);
        interruptTimerRef.current = null;
      }
      return;
    }

    const level = inputLevel;
    // Dynamic acoustic barge-in threshold:
    // If outputLevel > 0.04 (speaker playing audio into room), candidate must vocalize above speaker echo envelope
    const dynamicThreshold = outputLevel > 0.04
      ? Math.max(INTERRUPT_LEVEL, outputLevel * 0.70 + 0.05)
      : INTERRUPT_LEVEL;
    const isLoud = level > dynamicThreshold;
    if (isLoud) {
      if (!interruptTimerRef.current) {
        interruptTimerRef.current = setTimeout(() => {
          setInterruptDetected(true);
          interrupt();
          setTimeout(() => start(), 100);
        }, INTERRUPT_DURATION);
      }
    } else {
      if (interruptTimerRef.current) {
        clearTimeout(interruptTimerRef.current);
        interruptTimerRef.current = null;
      }
    }
  }, [enableInterrupt, state, inputLevel, inputBars, interrupt, start]);

  const pickBrowserVoice = useCallback(
    (gender) => {
      if (!("speechSynthesis" in window)) return null;
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return null;
      const g = (gender || personaGender || "female").toLowerCase();

      // Priority 1: Google's neural voices (Chrome) — these sound excellent
      const googlePremium = g === "male"
        ? ["Google US English Male", "Google UK English Male"]
        : ["Google US English Female", "Google UK English Female"];
      for (const name of googlePremium) {
        const v = voices.find((v) => v.name === name);
        if (v) return v;
      }

      // Priority 2: Microsoft neural voices (Edge, Windows 11)
      // Match the full voice name including "Online (Natural)" suffix
      const msPremium = g === "male"
        ? ["Microsoft Guy Online (Natural)", "Microsoft Ryan Online (Natural)", "Microsoft Mark Online (Natural)"]
        : ["Microsoft Jenny Online (Natural)", "Microsoft Aria Online (Natural)", "Microsoft Sara Online (Natural)"];
      for (const name of msPremium) {
        const v = voices.find((v) => v.name === name);
        if (v) return v;
      }
      // Fallback: match partial name if exact match not found
      const msPartial = g === "male"
        ? ["Guy", "Ryan", "Mark"]
        : ["Jenny", "Aria", "Sara"];
      for (const name of msPartial) {
        const v = voices.find((v) => v.name.includes(name) && v.name.includes("Natural"));
        if (v) return v;
      }

      // Priority 3: Apple neural voices (Safari, macOS)
      const applePremium = g === "male"
        ? ["Daniel", "Alex", "Tom"]
        : ["Samantha", "Karen", "Moira", "Fiona"];
      for (const name of applePremium) {
        const v = voices.find((v) => v.name.includes(name) && v.lang.startsWith("en"));
        if (v) return v;
      }

      // Priority 4: Any OS-level voices by name keyword
      const fallbackNames = g === "male"
        ? ["David", "Mark", "James", "George"]
        : ["Zira", "Jenny", "Hazel", "Susan"];
      for (const name of fallbackNames) {
        const v = voices.find((v) => v.name.includes(name));
        if (v) return v;
      }

      // Priority 5: Any English voice
      return voices.find((v) => v.lang.startsWith("en")) || voices[0] || null;
    },
    [personaGender],
  );

  const speakGaplessSequence = useCallback(
    async (segments, { onStart, onEnd } = {}) => {
      if (!segments || segments.length === 0) {
        onEnd?.();
        return;
      }
      const cleanSegments = segments.filter(s => s && String(s).trim().length > 0);
      if (cleanSegments.length === 0) {
        onEnd?.();
        return;
      }

      if (ttsAbortRef.current) ttsAbortRef.current.abort();
      const controller = new AbortController();
      ttsAbortRef.current = controller;

      // Pinned session voice: if locked into browser speech fallback after repeated cloud failures, stay on it
      if (pinnedTtsProviderRef.current === 'browser-speech') {
        setState("speaking");
        onStart?.();
        let isFirstSegment = true;
        for (const seg of cleanSegments) {
          if (controller.signal.aborted) break;
          let textToSpeak = seg;
          if (isFirstSegment && !hasAnnouncedVoiceFallbackRef.current) {
            hasAnnouncedVoiceFallbackRef.current = true;
            textToSpeak = `Quick note, I've switched to device audio for stability. ${seg}`;
          }
          isFirstSegment = false;
          await playBrowserSpeechFallback(textToSpeak, {
            voice: pickBrowserVoice(personaGender),
            gender: personaGender,
            controller,
            guardMs: TTS_PLAYBACK_GUARD_MS,
          });
        }
        setState("idle");
        onEnd?.();
        return;
      }

      setState("loading");
      const ctx = getAudioContext();
      if (ctx && ctx.state === "suspended") {
        try { await ctx.resume(); } catch {}
      }

      try {
        // Concurrently fetch audio blobs with 1-shot retry for transient 429/network errors
        const blobPromises = cleanSegments.map(async (text) => {
          const cacheKey = `${personaGender}:${voicePersona}:${text.trim().slice(0, 200)}`;
          if (ttsCacheRef.current.has(cacheKey)) {
            const cached = await ttsCacheRef.current.get(cacheKey);
            ttsCacheRef.current.delete(cacheKey);
            if (cached?.blob && !shouldTreatTtsResponseAsFallback({ contentType: cached.contentType, blobSize: cached.blob?.size })) {
              return cached.blob;
            }
          }
          const ttsRequest = withVoiceRequestId(
            resolveAuthHeaders({ "Content-Type": "application/json" }),
            "voice-tts"
          );
          let res = await authFetch(TTS_ENDPOINT, {
            method: "POST",
            headers: ttsRequest.headers,
            body: JSON.stringify({
              text,
              persona: voicePersona,
              gender: personaGender,
            }),
            signal: controller.signal,
          });

          // Retry once on transient 429 or 5xx
          if (!res.ok && (res.status === 429 || res.status >= 500)) {
            await new Promise((r) => setTimeout(r, 350));
            res = await authFetch(TTS_ENDPOINT, {
              method: "POST",
              headers: ttsRequest.headers,
              body: JSON.stringify({
                text,
                persona: voicePersona,
                gender: personaGender,
              }),
              signal: controller.signal,
            });
          }

          if (!res.ok) throw new Error(`TTS HTTP ${res.status}`);
          const b = await res.blob();
          if (shouldTreatTtsResponseAsFallback({ contentType: res.headers.get("content-type"), blobSize: b?.size })) {
            throw new Error("Invalid TTS audio blob");
          }
          return b;
        });

        const blobs = await Promise.all(blobPromises);
        if (controller.signal.aborted) return;

        // Reset failure counter on successful cloud audio retrieval
        consecutiveCloudTtsFailuresRef.current = 0;
        pinnedTtsProviderRef.current = 'neural';

        // Safari / Web Audio decoding with clean HTML Audio fallback
        let audioBuffers = null;
        if (ctx) {
          try {
            audioBuffers = await Promise.all(
              blobs.map(async (b) => {
                const ab = await b.arrayBuffer();
                return await ctx.decodeAudioData(ab);
              })
            );
          } catch (decodeErr) {
            console.warn("[useVoiceAI] Web Audio decode failed (Safari or unsupported codec), falling back to HTML Audio:", decodeErr.message);
            audioBuffers = null;
          }
        }

        // If Web Audio decoding is unavailable or failed, smoothly play through HTML Audio
        if (!audioBuffers) {
          setState("speaking");
          setVoiceState("asking");
          speakingStartedAtRef.current = Date.now();
          for (const b of blobs) {
            if (controller.signal.aborted) break;
            await playBlobAudio(b, { onStart, signal: controller.signal });
          }
          onEnd?.();
          return;
        }

        // Schedule gapless Web Audio graph with volume normalization & crossfades
        let schedTime = ctx.currentTime + 0.04;
        const gainNodes = [];
        const sourceNodes = [];
        let totalDuration = 0;

        for (let i = 0; i < audioBuffers.length; i++) {
          const buf = audioBuffers[i];
          const src = ctx.createBufferSource();
          src.buffer = buf;
          const gain = ctx.createGain();

          let peak = 0;
          for (let ch = 0; ch < buf.numberOfChannels; ch++) {
            const chanData = buf.getChannelData(ch);
            for (let s = 0; s < chanData.length; s += 20) {
              const a = Math.abs(chanData[s]);
              if (a > peak) peak = a;
            }
          }
          const normGain = Math.min(1.0, 0.95 / Math.max(0.1, peak));

          const fadeMs = 0.02;
          gain.gain.setValueAtTime(0.001, schedTime);
          gain.gain.linearRampToValueAtTime(normGain, schedTime + fadeMs);
          const segEnd = schedTime + buf.duration;
          gain.gain.setValueAtTime(normGain, segEnd - fadeMs);
          gain.gain.linearRampToValueAtTime(0.001, segEnd);

          src.connect(gain);
          gain.connect(ctx.destination);
          src.start(schedTime);

          gainNodes.push(gain);
          sourceNodes.push(src);

          schedTime = segEnd - fadeMs;
          totalDuration = schedTime - ctx.currentTime;
        }

        currentGainNodeRef.current = gainNodes[0];
        currentSourceNodeRef.current = sourceNodes[0];

        setState("speaking");
        setVoiceState("asking");
        speakingStartedAtRef.current = Date.now();
        onStart?.();

        await new Promise((resolve) => {
          const checkTimer = setTimeout(() => {
            resolve();
          }, Math.max(100, Math.ceil(totalDuration * 1000) + 50));
          controller.signal.addEventListener("abort", () => {
            clearTimeout(checkTimer);
            resolve();
          });
        }).finally(() => {
          // Release AudioBufferSourceNodes and GainNodes to prevent memory leaks across long sessions
          sourceNodes.forEach((src) => { try { src.disconnect(); } catch {} });
          gainNodes.forEach((gain) => { try { gain.disconnect(); } catch {} });
          sourceNodes.length = 0;
          gainNodes.length = 0;
          audioBuffers.length = 0;
        });
      } catch (err) {
        if (controller.signal.aborted) return;
        consecutiveCloudTtsFailuresRef.current++;
        console.warn(`[useVoiceAI] Cloud TTS error (attempt ${consecutiveCloudTtsFailuresRef.current}):`, err.message);
        // Only pin to browser speech after repeated failures (>= 2 consecutive)
        if (consecutiveCloudTtsFailuresRef.current >= 2) {
          pinnedTtsProviderRef.current = 'browser-speech';
        }
        analyticsRef.current.ttsFallbacks++;
        setConnectionHealth("fallback");
        setState("speaking");
        onStart?.();
        let isFirstSegment = true;
        for (const seg of cleanSegments) {
          if (controller.signal.aborted) break;
          let textToSpeak = seg;
          if (isFirstSegment && !hasAnnouncedVoiceFallbackRef.current) {
            hasAnnouncedVoiceFallbackRef.current = true;
            textToSpeak = `Quick note, I've switched to device audio for stability. ${seg}`;
          }
          isFirstSegment = false;
          await playBrowserSpeechFallback(textToSpeak, {
            voice: pickBrowserVoice(personaGender),
            gender: personaGender,
            controller,
            guardMs: TTS_PLAYBACK_GUARD_MS,
          });
        }
      } finally {
        setState("idle");
        currentGainNodeRef.current = null;
        currentSourceNodeRef.current = null;
        onEnd?.();
      }
    },
    [getAudioContext, personaGender, voicePersona, resolveAuthHeaders, pickBrowserVoice]
  );

  const speak = useCallback(
    async (text, { onStart, onEnd, addTransition = false } = {}) => {
      if (!text || !text.trim()) {
        onEnd?.();
        return;
      }
      if (ttsAbortRef.current) ttsAbortRef.current.abort();

      const controller = new AbortController();
      ttsAbortRef.current = controller;
      // Don't set "speaking" yet — wait until audio actually starts playing.
      // This prevents lip-sync from firing before any sound is heard.
      setState("loading");
      // onStart is deferred to when audio playback actually begins (see below).

      const spokenText = addTransition ? `${pickTransition()} ${text}` : text;

      let ttsRequestId = null;
      try {
        let blob;
        let cachedContentType = "";
        let isFallback = false;
        const cacheKey = `${personaGender}:${voicePersona}:${text.trim().slice(0, 200)}`;

        if (ttsCacheRef.current.has(cacheKey)) {
          console.log("[useVoiceAI] ✓ Using prefetched TTS audio");
          const cached = await ttsCacheRef.current.get(cacheKey);
          ttsCacheRef.current.delete(cacheKey);
          if (cached) {
            blob = cached.blob;
            cachedContentType = cached.contentType || blob?.type || "";
            if (
              shouldTreatTtsResponseAsFallback({
                contentType: cachedContentType,
                blobSize: blob?.size,
              })
            ) {
              console.warn("[useVoiceAI] Prefetched audio invalid, fetching fresh");
              blob = undefined;
            }
          }
          // If cached resolved to null (prefetch failed), blob stays undefined
          // and we proceed to the fresh TTS fetch below
        }

        // Fresh TTS fetch — only if we don't already have a valid blob from cache
        if (!blob && !isFallback) {
          const ttsRequest = withVoiceRequestId(
            resolveAuthHeaders({ "Content-Type": "application/json" }),
            "voice-tts",
          );
          ttsRequestId = ttsRequest.requestId;
          logVoiceDebug("tts request", {
            endpoint: TTS_ENDPOINT,
            requestId: ttsRequest.requestId,
          });
          console.log(
            "[useVoiceAI] Sending TTS request for text:",
            spokenText.substring(0, 50) + "...",
          );

          const TTS_TIMEOUT_MS = 15000;

          const fetchTts = async (timeoutMs = TTS_TIMEOUT_MS) => {
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error("TTS timeout")), timeoutMs),
            );

            const fetchPromise = authFetch(TTS_ENDPOINT, {
              method: "POST",
              headers: ttsRequest.headers,
              body: JSON.stringify({
                text: spokenText,
                persona: voicePersona,
                gender: personaGender,
              }),
              signal: controller.signal,
            });

            const res = await Promise.race([fetchPromise, timeoutPromise]);
            logVoiceDebug("tts response", {
              endpoint: TTS_ENDPOINT,
              status: res.status,
              ok: res.ok,
              requestId:
                res.headers.get("x-request-id") || ttsRequest.requestId,
            });
            if (!res.ok) throw new Error(`TTS HTTP ${res.status}`);
            return res;
          };

          let res;
          try {
            res = await fetchTts(TTS_TIMEOUT_MS);
          } catch (firstErr) {
            if (controller.signal.aborted) throw firstErr;

            if (
              firstErr.message !== "TTS timeout" &&
              !firstErr.message.includes("timeout")
            ) {
              // Exponential backoff: retry up to TTS_RETRY_DELAYS_MS.length times
              let retrySuccess = false;
              for (let i = 0; i < TTS_RETRY_DELAYS_MS.length; i++) {
                analyticsRef.current.ttsRetries++;
                setConnectionHealth("degraded");
                logVoiceDebug(
                  `tts retry ${i + 1}/${TTS_RETRY_DELAYS_MS.length}`,
                  { error: firstErr.message, delayMs: TTS_RETRY_DELAYS_MS[i] },
                );
                await new Promise((r) => setTimeout(r, TTS_RETRY_DELAYS_MS[i]));
                if (controller.signal.aborted)
                  throw new DOMException("Aborted", "AbortError");
                try {
                  res = await fetchTts(4000);
                  setConnectionHealth("good");
                  retrySuccess = true;
                  break;
                } catch (retryErr) {
                  console.warn(
                    `[useVoiceAI] TTS retry ${i + 1} failed:`,
                    retryErr.message,
                  );
                }
              }
              if (!retrySuccess) {
                console.warn(
                  "[useVoiceAI] TTS failed all retries, falling back to browser speech",
                );
                analyticsRef.current.ttsFallbacks++;
                setConnectionHealth("fallback");
                isFallback = true;
                blob = null;
              }
            } else {
              console.warn(
                "[useVoiceAI] TTS timeout, falling back to browser speech",
              );
              analyticsRef.current.ttsFallbacks++;
              setConnectionHealth("fallback");
              isFallback = true;
              blob = null;
            }
          }

          let responseCt = "";
          if (res && !isFallback) {
            responseCt = (res.headers.get("content-type") || "").toLowerCase();
            console.log("[useVoiceAI] TTS response content-type:", responseCt);
            blob = await res.blob();
            console.log(
              "[useVoiceAI] TTS response blob size:",
              blob.size,
              "bytes",
            );
            if (
              shouldTreatTtsResponseAsFallback({
                contentType: responseCt,
                blobSize: blob?.size,
              })
            ) {
              console.warn(
                "[useVoiceAI] TTS response treated as fallback (invalid audio)",
              );
              isFallback = true;
            }
          }
        }

        if (controller.signal.aborted) return;

        if (isFallback || !blob) {
          if (!isFallback) analyticsRef.current.ttsFallbacks++;
          setConnectionHealth("fallback");
          console.info("[useVoiceAI] TTS fallback → browser speechSynthesis");
          let textToSpeak = spokenText;
          if (!hasAnnouncedVoiceFallbackRef.current) {
            hasAnnouncedVoiceFallbackRef.current = true;
            textToSpeak = `Quick note, I've switched to device audio for stability. ${spokenText}`;
          }
          await playBrowserSpeechFallback(textToSpeak, {
            voice: pickBrowserVoice(personaGender),
            gender: personaGender,
            controller,
            guardMs: TTS_PLAYBACK_GUARD_MS,
            onStartCb: () => {
              // Browser speech actually started — now activate speaking state
              speakingStartedAtRef.current = Date.now();
              setState("speaking");
              onStart?.();
            },
          });
        } else {
          const effectiveType = cachedContentType || blob.type || "audio/wav";
          const playbackBlob = new Blob([blob], { type: effectiveType });
          const url = URL.createObjectURL(playbackBlob);

          console.log(
            "[useVoiceAI] Playing audio blob:",
            playbackBlob.size,
            "bytes, type:",
            playbackBlob.type,
          );

          if (!audioRef.current) audioRef.current = new Audio();
          audioRef.current.src = url;
          // Smooth volume ramp to eliminate speaker pop/click transients
          audioRef.current.volume = 0.2;
          setOutputAudioEl(audioRef.current);

          try {
            console.log("[useVoiceAI] Starting audio playback...");
            await audioRef.current.play();
            setTimeout(() => {
              if (audioRef.current) audioRef.current.volume = 1.0;
            }, 50);
            console.log("[useVoiceAI] ✓ Audio playback started");
            // Audio is actually playing now — activate speaking state + lip-sync
            speakingStartedAtRef.current = Date.now();
            setState("speaking");
            setVoiceState("asking");
            onStart?.();
          } catch (playError) {
            console.error("[useVoiceAI] Audio playback failed:", playError);
            URL.revokeObjectURL(url);
            if ("speechSynthesis" in window) {
              analyticsRef.current.ttsFallbacks++;
              console.info(
                "[useVoiceAI] Audio playback failed, using speechSynthesis fallback",
              );
              await playBrowserSpeechFallback(spokenText, {
                voice: pickBrowserVoice(personaGender),
                gender: personaGender,
                controller,
                guardMs: TTS_PLAYBACK_GUARD_MS,
                onStartCb: () => {
                  speakingStartedAtRef.current = Date.now();
                  setState("speaking");
                  onStart?.();
                },
              });
              setOutputAudioEl(null);
            } else {
              throw playError;
            }
            return;
          }

          await new Promise((resolve) => {
            let guardTimer = null;
            let settled = false;
            const settle = () => {
              if (settled) return;
              settled = true;
              if (guardTimer) clearTimeout(guardTimer);
              resolve();
            };

            audioRef.current.onended = settle;
            audioRef.current.onerror = settle;
            controller.signal.addEventListener("abort", settle, { once: true });
            guardTimer = setTimeout(() => {
              try {
                audioRef.current?.pause();
              } catch { /* empty */ }
              settle();
            }, TTS_PLAYBACK_GUARD_MS);
          });

          URL.revokeObjectURL(url);
          setOutputAudioEl(null);
        }
      } catch (err) {
        if (err.name === "AbortError") {
          logVoiceDebug("tts request aborted", {
            endpoint: TTS_ENDPOINT,
            requestId: ttsRequestId,
          });
        } else {
          logVoiceDebug("tts request error", {
            endpoint: TTS_ENDPOINT,
            requestId: ttsRequestId,
            error: err?.message || String(err),
          });
          console.warn("[useVoiceAI] speak error:", err.message);
        }
        if (audioRef.current) {
          try {
            audioRef.current.pause();
            if (
              audioRef.current.src &&
              audioRef.current.src.startsWith("blob:")
            ) {
              URL.revokeObjectURL(audioRef.current.src);
            }
            audioRef.current.src = "";
          } catch { /* empty */ }
        }
      } finally {
        setOutputAudioEl(null);
        // Ensure no lingering TTS output that could block the next mic capture
        if ("speechSynthesis" in window) window.speechSynthesis.cancel();
        if (!controller.signal.aborted) {
          setState("idle");
          onEnd?.();
        }
      }
    },
    [personaGender, pickBrowserVoice, resolveAuthHeaders, voicePersona],
  );

  const prefetch = useCallback(
    (text) => {
      if (!text || !text.trim()) return null;
      const cacheKey = `${personaGender}:${voicePersona}:${text.trim().slice(0, 200)}`;
      if (ttsCacheRef.current.has(cacheKey)) return ttsCacheRef.current.get(cacheKey);

      const prefetchRequest = withVoiceRequestId(
        resolveAuthHeaders({ "Content-Type": "application/json" }),
        "voice-prefetch",
      );
      logVoiceDebug("tts prefetch request", {
        endpoint: TTS_ENDPOINT,
        requestId: prefetchRequest.requestId,
      });

      const promise = authFetch(TTS_ENDPOINT, {
        method: "POST",
        headers: prefetchRequest.headers,
        body: JSON.stringify({
          text,
          persona: voicePersona,
          gender: personaGender,
        }),
      })
        .then(async (res) => {
          logVoiceDebug("tts prefetch response", {
            endpoint: TTS_ENDPOINT,
            status: res.status,
            ok: res.ok,
            requestId:
              res.headers.get("x-request-id") || prefetchRequest.requestId,
          });
          if (!res.ok) throw new Error(`prefetch TTS HTTP ${res.status}`);
          const contentType = (
            res.headers.get("content-type") || ""
          ).toLowerCase();
          const blob = await res.blob();
          if (
            shouldTreatTtsResponseAsFallback({
              contentType,
              blobSize: blob?.size,
            })
          )
            return null;
          return { blob, contentType };
        })
        .catch((err) => {
          console.warn("[useVoiceAI] prefetch error:", err.message);
          ttsCacheRef.current.delete(cacheKey);
          return null;
        });

      // Evict oldest entry if cache exceeds 10 items to prevent unbounded memory growth
      if (ttsCacheRef.current.size >= 10) {
        const firstKey = ttsCacheRef.current.keys().next().value;
        ttsCacheRef.current.delete(firstKey);
      }
      ttsCacheRef.current.set(cacheKey, promise);
      setTimeout(() => ttsCacheRef.current.delete(cacheKey), 60_000);
      return promise;
    },
    [personaGender, resolveAuthHeaders, voicePersona],
  );

  const retryTranscription = useCallback(async () => {
    const audioBlob = pendingWhisperBlobRef.current;
    if (!audioBlob || activeRef.current) return false;

    const sessionEpoch = ++voiceSessionEpochRef.current;
    activeRef.current = true;
    setErrorMessage(null);
    setState("processing");
    stateRef.current = "processing";

    try {
      const formData = new FormData();
      const extension = audioBlob.type.includes("mp4") ? "mp4" : "webm";
      formData.append("audio", audioBlob, `recording.${extension}`);
      const res = await authFetch(buildVoiceApiUrl("/voice/stt-chunk"), {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw await transcriptionHttpError(res);
      const data = await res.json();
      if (voiceSessionEpochRef.current !== sessionEpoch || !activeRef.current) return false;

      const transcribed = (data.transcript || data.text || "").trim();
      if (!transcribed || transcribed.length < MIN_ANSWER_LENGTH) {
        throw new Error(data.fallback
          ? "Speech transcription is temporarily unavailable. Your recording is kept in this session; retry transcription or record your answer again."
          : "We couldn't recognize that answer. Your recording is kept in this session; try speaking again.");
      }

      pendingWhisperBlobRef.current = null;
      setFinalTranscript(transcribed);
      setTranscript(transcribed);
      setInterimText("");
      transcriptListener?.(transcribed);
      onAnswer?.(transcribed, {});
      setState("idle");
      stateRef.current = "idle";
      activeRef.current = false;
      return true;
    } catch (error) {
      if (voiceSessionEpochRef.current !== sessionEpoch) return false;
      setErrorMessage(withSavedRecordingMessage(transcriptionNetworkError(error)));
      setErrorCode("network");
      setState("error");
      stateRef.current = "error";
      activeRef.current = false;
      return false;
    }
  }, [onAnswer, transcriptListener]);

  const resetError = useCallback(() => {
    setErrorMessage(null);
    setErrorCode(null);
    if (stateRef.current === "error") {
      setState("idle");
      stateRef.current = "idle";
    }
  }, []);

  const cleanup = useCallback(() => {
    stop();
    interrupt();
    releaseStream();
  }, [stop, interrupt, releaseStream]);

  useEffect(
    () => () => {
      cleanup();
    },
    [cleanup],
  );

  // Memoize so consumers' callbacks stay stable between unrelated renders
  // (e.g. the parent's 1s interview clock). A fresh object every render used to
  // restart silence timers and re-subscribe effects constantly.
  return useMemo(() => ({
    state,
    transcript,
    interimText,
    finalTranscript,
    errorMessage,
    errorCode,
    resetError,
    interruptDetected,
    connectionMode,
    connectionHealth,
    silenceCountdown,
    voiceState,
    micWarning,
    isThinking,
    isSubmitting: isSubmittingRef.current,
    start,
    stop,
    submitAnswer,
    retryTranscription,
    hasPendingTranscription: Boolean(pendingWhisperBlobRef.current),
    interrupt,
    speak,
    speakGaplessSequence,
    playImmediateBackchannel,
    stopImmediateBackchannel,
    waitForBackchannel,
    resetVoicePinning,
    prefetch,
    cleanup,
    audioRef,
    streamRef,
    inputBars,
    outputBars,
    inputLevel,
    outputLevel,
    inputActive: inputLevel > 0.04 || (inputBars && inputBars.some((b) => b > 0.08)),
    outputActive: outputLevel > 0.05,
    getAnalytics: () => ({
      ...analyticsRef.current,
      sessionDurationMs: Date.now() - analyticsRef.current.sessionStart,
    }),
  }), [
    state,
    transcript,
    interimText,
    finalTranscript,
    errorMessage,
    errorCode,
    resetError,
    interruptDetected,
    connectionMode,
    connectionHealth,
    silenceCountdown,
    start,
    stop,
    submitAnswer,
    retryTranscription,
    interrupt,
    speak,
    prefetch,
    cleanup,
    inputBars,
    outputBars,
    inputLevel,
    outputLevel,
    voiceState,
    micWarning,
    isThinking,
  ]);
}

export default useVoiceAI;
