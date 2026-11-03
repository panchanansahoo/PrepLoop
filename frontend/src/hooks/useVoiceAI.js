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
const TOTAL_SILENCE_AUTO_SUBMIT_MS = 15_000;

// Silence thresholds: LONGER answers get MORE pause time (user is mid-thought)
const SILENCE_SHORT = 7000;
const SILENCE_MEDIUM = 6000;
const SILENCE_LONG = 5000;
const MAX_TRANSCRIPT_LENGTH = 10_000;

// TTS retry
const TTS_RETRY_DELAYS_MS = [500, 1000, 2000]; // Exponential backoff for TTS retries
const TTS_PLAYBACK_GUARD_MS = 30000;

// Interrupt detection
const INTERRUPT_LEVEL = 0.12;
const INTERRUPT_DURATION = 400;
const INTERRUPT_GRACE_PERIOD_MS = 1200; // Ignore interrupts during the first 1.2s of playback to prevent mic/speaker feedback false-positives

// Endpoints
const RAW_API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

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
  "That's interesting.",
  "Good point.",
  "I appreciate you sharing that.",
  "Thank you for that answer.",
  "Alright, let's move on.",
  "Great, noted.",
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
    if (/[.!?]$/.test(trimmed) || /(?:that's all|that is all|i'm done|i am done|that's it|my approach|concludes my answer)$/i.test(trimmed)) {
      return 4000;
    }
    // If ending with a connector word (mid-thought pause), allow candidate more time
    if (/\b(?:and|so|because|like|which|but|or|then|also)\s*$/i.test(trimmed)) {
      return 7000;
    }
    // Substantial answer without trailing connector: quick wrap-up
    if (textLength >= 120) {
      return 2800;
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
  question = "",
  enableInterrupt = true,
  getAuthHeaders = null,
  isPaused = false,
  pacingMode = "realistic",
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
  const deadMicDurationRef = useRef(0);
  const pacingModeRef = useRef(pacingMode);
  useEffect(() => {
    pacingModeRef.current = pacingMode;
  }, [pacingMode]);

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
  }, [inputLevel]);

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
          audio.volume = 0.3;
          clips[key] = audio;
        }
        backchannelRef.current = clips;
      })
      .catch(() => {});
  }, [personaGender]);

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
  };

  const playBackchannel = useCallback(() => {
    // Disabled filler backchanneling
  }, []);

  const startBackchannelSchedule = useCallback(() => {
    // Disabled filler backchanneling
  }, []);

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

    setState("processing");
    stateRef.current = "processing";
    setFinalTranscript(savedAnswer);

    // Clear refs BEFORE calling onAnswer so the hook state is clean
    finalTextRef.current = "";
    interimRef.current = "";

    try {
      onAnswer?.(savedAnswer, meta);
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
      const tick = () => {
        const remainingMs = Math.max(0, delayMs - (Date.now() - startedAt));
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
      const stream = existingStream || await navigator.mediaDevices.getUserMedia({ audio: true });
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
              console.log(
                "[useVoiceAI] 15 seconds of total silence (no speech detected), auto-submitting",
              );
              submitAnswer();
            }, TOTAL_SILENCE_AUTO_SUBMIT_MS);
          };

          recognition.onaudiostart = () => {
            if (recognitionEpochRef.current !== epoch) return;
            console.log("[useVoiceAI] ✓ Audio capture started (epoch", epoch, ")");
          };

          recognition.onspeechstart = () => {
            if (recognitionEpochRef.current !== epoch) return;
            noSpeechCountRef.current = 0;
            console.log("[useVoiceAI] ✓ Speech detected by browser (epoch", epoch, ")");
          };

          recognition.onresult = (event) => {
            if (!activeRef.current || recognitionEpochRef.current !== epoch) return;
            let interim = "";
            let finalText = "";
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              const result = event.results[i];
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
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
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
    const isLoud = level > 0.04 || inputBars.some((b) => b > 0.12);
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
        const cacheKey = text.trim().slice(0, 200);

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
                persona: "friendly",
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
          await playBrowserSpeechFallback(spokenText, {
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
    [personaGender, pickBrowserVoice, resolveAuthHeaders],
  );

  const prefetch = useCallback(
    (text) => {
      if (!text || !text.trim()) return null;
      const cacheKey = text.trim().slice(0, 200);
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
          persona: "friendly",
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
    [personaGender, resolveAuthHeaders],
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
