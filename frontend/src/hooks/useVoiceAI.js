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
import { useState, useRef, useCallback, useEffect } from "react";
import useAudioVisualizer from "./useAudioVisualizer";
import { mergeAuthHeaders } from "../utils/authHeaders";
import { authFetch } from "../utils/authFetch";
import { buildApiUrl } from "../utils/safeApiUrl";

// ——— Configuration ———
const MIN_ANSWER_LENGTH = 8; // chars before silence timer starts
const MAX_ANSWER_WAIT_MS = 60_000; // safety: force-submit after 60s
const BACKCHANNEL_MIN_MS = 8_000; // min speech duration before backchannel
const BACKCHANNEL_GAP_MS = 12_000; // min gap between backchannel clips

const SILENCE_AFTER_SPEECH_MAX_MS = 6_000;
const TOTAL_SILENCE_AUTO_SUBMIT_MS = 15_000;

// Silence thresholds: LONGER answers get MORE pause time (user is mid-thought)
const SILENCE_SHORT = 6000;  // < 50 chars: user just started, give time to continue
const SILENCE_MEDIUM = 5000; // 50-200 chars: mid-answer, natural pause
const SILENCE_LONG = 4000;   // > 200 chars: substantial answer, still need pause between thoughts
const MAX_TRANSCRIPT_LENGTH = 10_000;

// TTS retry
const TTS_RETRY_DELAYS_MS = [500, 1000, 2000]; // Exponential backoff for TTS retries
const TTS_PLAYBACK_GUARD_MS = 30000;

// Interrupt detection
const INTERRUPT_LEVEL = 0.12;
const INTERRUPT_DURATION = 400;

// Endpoints
const RAW_API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export function buildVoiceApiUrl(path, rawBaseUrl = RAW_API_BASE_URL) {
  return buildApiUrl(path, { rawBaseUrl, apiPrefix: "/api" });
}

const TTS_ENDPOINT = buildVoiceApiUrl("/voice/tts-stream");
const ANALYZE_ENDPOINT = buildVoiceApiUrl("/voice/analyze-answer");
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

export function getAdaptiveSilenceMs(textLength) {
  if (textLength < 50) return SILENCE_SHORT;
  if (textLength < 200) return SILENCE_MEDIUM;
  return SILENCE_LONG;
}

export function getPostSpeechAutoSubmitMs(textLength) {
  return Math.min(
    getAdaptiveSilenceMs(textLength),
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
  { voice, gender, controller, guardMs },
) {
  if (!("speechSynthesis" in window)) return Promise.resolve();
  return new Promise((resolve) => {
    let guardTimer = null;
    let settled = false;
    const settle = () => {
      if (settled) return;
      settled = true;
      if (guardTimer) clearTimeout(guardTimer);
      resolve();
    };
    const utter = new SpeechSynthesisUtterance(text);
    if (voice) utter.voice = voice;
    // Slightly slower rate sounds more natural and professional
    utter.rate = 0.95;
    utter.pitch = gender === "male" ? 0.95 : 1.0;
    utter.volume = 1.0;
    utter.onend = settle;
    utter.onerror = settle;
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
    window.speechSynthesis.speak(utter);
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
} = {}) {
  const [state, setState] = useState("idle");
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [errorMessage, setErrorMessage] = useState(null);
  const [interruptDetected, setInterruptDetected] = useState(false);
  const [connectionMode, setConnectionMode] = useState("browser"); // Always browser for STT
  const [silenceCountdown, setSilenceCountdown] = useState(0);
  const [connectionHealth, setConnectionHealth] = useState("good"); // 'good' | 'degraded' | 'fallback'

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

  const ttsAbortRef = useRef(null);
  const ttsCacheRef = useRef(new Map());

  const backchannelRef = useRef(null);
  const backchannelLoadedRef = useRef(false);
  const lastBackchannelRef = useRef(0);
  const listenStartRef = useRef(0);
  const backchannelTimerRef = useRef(null);

  const interruptTimerRef = useRef(null);

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
    const clips = backchannelRef.current;
    if (!clips) return;
    const now = Date.now();
    if (now - lastBackchannelRef.current < BACKCHANNEL_GAP_MS) return;
    if (now - listenStartRef.current < BACKCHANNEL_MIN_MS) return;

    const keys = Object.keys(clips);
    const clip = clips[keys[Math.floor(Math.random() * keys.length)]];
    if (clip) {
      clip.currentTime = 0;
      clip.play().catch(() => {});
      lastBackchannelRef.current = now;
    }
  }, []);

  const startBackchannelSchedule = useCallback(() => {
    clearBackchannelTimer();
    const check = () => {
      if (!activeRef.current || stateRef.current !== "listening") return;
      playBackchannel();
      backchannelTimerRef.current = setTimeout(
        check,
        BACKCHANNEL_GAP_MS + Math.random() * 4000,
      );
    };
    backchannelTimerRef.current = setTimeout(check, BACKCHANNEL_MIN_MS);
  }, [playBackchannel]);

  const submitAnswer = useCallback(async () => {
    const answer = finalTextRef.current.trim();
    clearSilenceTimer();
    clearMaxWait();
    clearBackchannelTimer();
    clearTotalSilenceTimer();
    clearAfterSpeechSilence();

    if (!answer || answer.length < MIN_ANSWER_LENGTH) {
      if (activeRef.current) setState("listening");
      return;
    }

    setState("processing");
    setFinalTranscript(answer);

    authFetch(ANALYZE_ENDPOINT, {
      method: "POST",
      headers: resolveAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        question: questionRef.current,
        answer,
        interviewType,
      }),
    }).catch(() => {});

    try {
      onAnswer?.(answer, {});
    } catch {
      /* no-op */
    }

    finalTextRef.current = "";
    interimRef.current = "";
    setTranscript("");
    setInterimText("");
  }, [onAnswer, interviewType, resolveAuthHeaders]);

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
          // Safety: if browser STT still has interim (partial) text,
          // the user is mid-sentence — do NOT submit yet, reschedule.
          if (interimRef.current && interimRef.current.trim().length > 0) {
            console.log("[useVoiceAI] Interim text detected, deferring auto-submit");
            scheduleAfterSpeechSilence(2000); // re-check in 2s
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

  const start = useCallback(async () => {
    if (activeRef.current) return;

    setErrorMessage(null);
    setState("listening");
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

    console.log("[useVoiceAI] Starting voice recording...");

    try {
      let stream = streamRef.current;
      const streamAlive =
        stream && stream.getTracks().some((t) => t.readyState === "live");
      if (!streamAlive) {
        console.log("[useVoiceAI] Requesting microphone access...");
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 16000,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        streamRef.current = stream;
        console.log("[useVoiceAI] ✓ Microphone access granted");
      } else {
        console.log("[useVoiceAI] ✓ Reusing existing microphone stream");
      }
      setInputStreamState(stream);
      activeRef.current = true;
      listenStartRef.current = Date.now();

      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        console.log("[useVoiceAI] Using browser SpeechRecognition");
        setConnectionMode("browser");
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event) => {
          if (!activeRef.current) return;
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
            clearTotalSilenceTimer();
            clearAfterSpeechSilence();

            const postMs = getPostSpeechAutoSubmitMs(
              finalTextRef.current.trim().length,
            );
            scheduleAfterSpeechSilence(postMs);
          }
          if (interim) {
            interimRef.current = interim;
            setInterimText(interim);
            const combined = (finalTextRef.current + " " + interim).trim();
            transcriptListener?.(combined);
            clearTotalSilenceTimer();
            clearAfterSpeechSilence();
          }
        };

        recognition.onerror = (event) => {
          if (event.error !== "no-speech") {
            console.warn("[useVoiceAI] Browser STT error:", event.error);
          }
        };

        recognition.onend = () => {
          if (activeRef.current && stateRef.current === "listening") {
            try {
              recognition.start();
            } catch {
              /* already started */
            }
          }
        };

        try {
          recognition.start();
          browserRecognitionRef.current = recognition;
          console.log("[useVoiceAI] ✓ Browser SpeechRecognition started");
        } catch (e) {
          console.warn("[useVoiceAI] Browser STT start failed:", e);
        }
      } else {
        console.warn(
          "[useVoiceAI] No STT available (no browser SpeechRecognition)",
        );
        setErrorMessage(
          "Speech recognition is not available in this browser. Please use Chrome or Edge.",
        );
      }

      maxWaitRef.current = setTimeout(submitAnswer, MAX_ANSWER_WAIT_MS);

      totalSilenceTimerRef.current = setTimeout(() => {
        console.log(
          "[useVoiceAI] 10 seconds of total silence (no speech detected), auto-submitting",
        );
        submitAnswer();
      }, TOTAL_SILENCE_AUTO_SUBMIT_MS);

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
      setState("error");
      activeRef.current = false;
    }
  }, [submitAnswer, startBackchannelSchedule, scheduleAfterSpeechSilence]);

  const stop = useCallback(() => {
    activeRef.current = false;
    clearSilenceTimer();
    clearMaxWait();
    clearBackchannelTimer();
    clearTotalSilenceTimer();
    clearAfterSpeechSilence();
    setSilenceCountdown(0);
    setInputStreamState(null);

    if (browserRecognitionRef.current) {
      try {
        browserRecognitionRef.current.stop();
      } catch {
        /* no-op */
      }
      browserRecognitionRef.current = null;
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

    if (inputLevel > INTERRUPT_LEVEL) {
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
  }, [enableInterrupt, state, inputLevel, interrupt, start]);

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
      const msPremium = g === "male"
        ? ["Microsoft Guy Online (Natural)", "Microsoft Ryan Online (Natural)", "Microsoft Mark Online (Natural)"]
        : ["Microsoft Jenny Online (Natural)", "Microsoft Aria Online (Natural)", "Microsoft Sara Online (Natural)"];
      for (const name of msPremium) {
        const v = voices.find((v) => v.name.includes(name.replace(" Online (Natural)", "")));
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
      setState("speaking");
      onStart?.();

      const spokenText = addTransition ? `${pickTransition()} ${text}` : text;

      let ttsRequestId = null;
      try {
        let blob;
        let cachedContentType = "";
        let isFallback = false;
        const cacheKey = text.trim().slice(0, 200);

        if (ttsCacheRef.current.has(cacheKey)) {
          const cached = await ttsCacheRef.current.get(cacheKey);
          if (cached) {
            blob = cached.blob;
            cachedContentType = cached.contentType || blob?.type || "";
            if (
              shouldTreatTtsResponseAsFallback({
                contentType: cachedContentType,
                blobSize: blob?.size,
              })
            ) {
              isFallback = true;
            }
          } else {
            isFallback = true;
          }
          ttsCacheRef.current.delete(cacheKey);
        } else {
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
          setOutputAudioEl(audioRef.current);

          try {
            console.log("[useVoiceAI] Starting audio playback...");
            await audioRef.current.play();
            console.log("[useVoiceAI] ✓ Audio playback started");
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
              } catch {}
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
          } catch {}
        }
      } finally {
        setOutputAudioEl(null);
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
      if (!text || !text.trim()) return;
      const cacheKey = text.trim().slice(0, 200);
      if (ttsCacheRef.current.has(cacheKey)) return;

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

      ttsCacheRef.current.set(cacheKey, promise);
      setTimeout(() => ttsCacheRef.current.delete(cacheKey), 60_000);
    },
    [personaGender, resolveAuthHeaders],
  );

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

  return {
    state,
    transcript,
    interimText,
    finalTranscript,
    errorMessage,
    interruptDetected,
    connectionMode,
    connectionHealth,
    silenceCountdown,
    start,
    stop,
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
    inputActive: inputLevel > 0.08,
    outputActive: outputLevel > 0.05,
    getAnalytics: () => ({
      ...analyticsRef.current,
      sessionDurationMs: Date.now() - analyticsRef.current.sessionStart,
    }),
  };
}

export default useVoiceAI;
