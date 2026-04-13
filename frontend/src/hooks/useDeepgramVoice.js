/**
 * useDeepgramVoice — Real-feel voice pipeline hook (WebSocket Streaming STT)
 *
 * Flow:
 *   getUserMedia → MediaRecorder (250ms chunks) → WebSocket wss://api.deepgram.com
 *   → interim + final transcripts in real-time → UtteranceEnd → onAnswer()
 *   → caller invokes speak(text) → POST /api/voice/tts-stream → AI audio plays
 *   → Backchannel clips play during long user speech
 *   → User can interrupt AI speech by speaking
 *
 * States: idle | listening | processing | speaking | error
 *
 * Improvements over REST-chunk STT:
 *   ✓ Real-time streaming with Deepgram WebSocket (full context, no fragmented words)
 *   ✓ Interim transcripts displayed live (word-by-word as user speaks)
 *   ✓ Deepgram UtteranceEnd as primary "done speaking" signal (server-side VAD)
 *   ✓ Adaptive silence threshold based on answer length
 *   ✓ Backchannel clips ("mm-hmm", "I see") during long user speech
 *   ✓ Interrupt detection — user can speak during AI speech to interrupt
 *   ✓ Falls back to REST POST if WebSocket fails
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import useAudioVisualizer from './useAudioVisualizer';
import { mergeAuthHeaders } from '../utils/authHeaders';

// ─── Configuration ───
const CHUNK_INTERVAL_MS   = 250;      // MediaRecorder chunk interval
const MIN_ANSWER_LENGTH   = 8;        // chars before silence timer starts
const MAX_ANSWER_WAIT_MS  = 60_000;   // safety: force-submit after 60s
const BACKCHANNEL_MIN_MS  = 8_000;    // min speech duration before backchannel
const BACKCHANNEL_GAP_MS  = 12_000;   // min gap between backchannel clips

// Adaptive silence thresholds (ms after UtteranceEnd before auto-submit)
const SILENCE_SHORT  = 2500;  // short answers (<50 chars) — user might continue
const SILENCE_MEDIUM = 1800;  // medium answers (50-200 chars)
const SILENCE_LONG   = 1200;  // long answers (>200 chars) — user is likely done

// Interrupt detection
const INTERRUPT_LEVEL     = 0.12;     // RMS above this = user speaking
const INTERRUPT_DURATION  = 400;      // ms of speech before interrupt triggers

// Endpoints
const TOKEN_ENDPOINT   = '/api/voice/deepgram-token';
const STT_ENDPOINT     = '/api/voice/stt-chunk';
const TTS_ENDPOINT     = '/api/voice/tts-stream';
const ANALYZE_ENDPOINT = '/api/voice/analyze-answer';
const BACKCHANNEL_ENDPOINT = '/api/voice/backchannel-clips';

function isVoiceDebugEnabled() {
    if (!import.meta.env.DEV) return false;
    try {
        return window.localStorage?.getItem('voiceDebug') !== 'false';
    } catch {
        return true;
    }
}

function logVoiceDebug(message, context = {}) {
    if (!isVoiceDebugEnabled()) return;
    console.info('[voice-debug]', message, context);
}

function createVoiceRequestId(prefix = 'voice') {
    if (typeof globalThis.crypto?.randomUUID === 'function') {
        return `${prefix}-${globalThis.crypto.randomUUID()}`;
    }
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function withVoiceRequestId(headersInput = {}, prefix = 'voice') {
    const requestId = createVoiceRequestId(prefix);
    return {
        requestId,
        headers: {
            ...headersInput,
            'X-Request-ID': requestId,
        },
    };
}

// Deepgram WebSocket URL template
const DEEPGRAM_WS_PARAMS = [
    'model=nova-2',
    'smart_format=true',
    'punctuate=true',
    'language=en',
    'interim_results=true',
    'utterance_end_ms=1200',
    'vad_events=true',
    'filler_words=true',
    'endpointing=300',
    'encoding=linear16',
    'sample_rate=16000',
    'channels=1',
].join('&');

export function buildDeepgramStreamingUrl() {
    return `wss://api.deepgram.com/v1/listen?${DEEPGRAM_WS_PARAMS}`;
}

// Transitional phrases the AI uses before the next question
const TRANSITION_PHRASES = [
    "That's interesting.",
    "Good point.",
    "I appreciate you sharing that.",
    "Thank you for that answer.",
    "Alright, let's move on.",
    "Great, noted.",
];

function pickTransition() {
    return TRANSITION_PHRASES[Math.floor(Math.random() * TRANSITION_PHRASES.length)];
}

export function getAdaptiveSilenceMs(textLength) {
    if (textLength < 50)  return SILENCE_SHORT;
    if (textLength < 200) return SILENCE_MEDIUM;
    return SILENCE_LONG;
}

export function shouldAutoSubmitAnswer({ transcriptLength = 0, inputLevel = 0, utteranceEnded = false } = {}) {
    return Boolean(utteranceEnded) && transcriptLength >= MIN_ANSWER_LENGTH && inputLevel < 0.05;
}

export function isAudioContentType(contentType = '') {
    return /^audio\//i.test(String(contentType).trim());
}

export function shouldTreatTtsResponseAsFallback({ contentType = '', blobSize = 0 } = {}) {
    return !isAudioContentType(contentType) || Number(blobSize) < 100;
}

// Pre-warm the endpoint
let _warmedUp = false;
const warmUp = () => {
    if (_warmedUp) return;
    _warmedUp = true;
    fetch(TOKEN_ENDPOINT, { method: 'HEAD', headers: mergeAuthHeaders({}) }).catch(() => {});
};

export function useDeepgramVoice({
    onAnswer,           // (answerText, analysis) => void
    onTranscriptUpdate, // (partialText) => void
    onTranscript = null,
    interviewType   = 'technical',
    personaGender   = 'female',
    question        = '',
    enableInterrupt = true,
    getAuthHeaders = null,
} = {}) {
    const [state,           setState]           = useState('idle');
    const [transcript,      setTranscript]      = useState('');
    const [interimText,     setInterimText]     = useState('');
    const [finalTranscript, setFinalTranscript] = useState('');
    const [errorMessage,    setErrorMessage]    = useState(null);
    const [interruptDetected, setInterruptDetected] = useState(false);

    const transcriptListener = onTranscriptUpdate || onTranscript;
    const inputLevelRef = useRef(0);

    // Audio element for AI TTS playback
    const audioRef         = useRef(null);
    // MediaRecorder + stream
    const recorderRef      = useRef(null);
    const streamRef        = useRef(null);
    // WebSocket
    const wsRef            = useRef(null);
    const wsReadyRef       = useRef(false);
    // Timers
    const silenceTimerRef  = useRef(null);
    const maxWaitRef       = useRef(null);
    // Accumulated transcripts
    const finalTextRef     = useRef('');
    const interimRef       = useRef('');
    // Control flags
    const activeRef        = useRef(false);
    const stateRef         = useRef('idle');
    // TTS
    const ttsAbortRef      = useRef(null);
    const ttsCacheRef      = useRef(new Map());
    // Backchannel
    const backchannelRef   = useRef(null);  // cached clips: { mmhmm: Audio, ... }
    const backchannelLoadedRef = useRef(false);
    const lastBackchannelRef   = useRef(0);
    const listenStartRef       = useRef(0);
    const backchannelTimerRef  = useRef(null);
    // Interrupt detection
    const interruptTimerRef = useRef(null);
    // Question ref for callbacks
    const questionRef      = useRef(question);
    useEffect(() => { questionRef.current = question; }, [question]);
    // Keep stateRef in sync
    useEffect(() => { stateRef.current = state; }, [state]);

    const resolveAuthHeaders = useCallback((headersInput = {}) => {
        const callerHeaders = typeof getAuthHeaders === 'function' ? getAuthHeaders() : {};
        return mergeAuthHeaders({ ...headersInput, ...callerHeaders });
    }, [getAuthHeaders]);

    // ── Visualizer ──
    const [inputStream,        setInputStreamState] = useState(null);
    const [outputAudioElement, setOutputAudioEl]    = useState(null);
    const { inputBars, outputBars, inputLevel, outputLevel } = useAudioVisualizer({
        inputStream,
        outputAudioElement,
        barCount: 8,
    });

    useEffect(() => {
        inputLevelRef.current = inputLevel;
    }, [inputLevel]);

    // ── Load backchannel clips once ──
    useEffect(() => {
        if (backchannelLoadedRef.current) return;
        backchannelLoadedRef.current = true;

        fetch(`${BACKCHANNEL_ENDPOINT}?persona=friendly&gender=${personaGender}`)
            .then(r => r.json())
            .then(data => {
                if (!data.available || !data.clips) return;
                const clips = {};
                for (const [key, dataUri] of Object.entries(data.clips)) {
                    const audio = new Audio(dataUri);
                    audio.volume = 0.3; // subtle volume
                    clips[key] = audio;
                }
                backchannelRef.current = clips;
            })
            .catch(() => {}); // non-fatal
    }, [personaGender]);

    // ── Timer helpers ──
    const clearSilenceTimer = () => {
        if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
    };
    const clearMaxWait = () => {
        if (maxWaitRef.current) { clearTimeout(maxWaitRef.current); maxWaitRef.current = null; }
    };
    const clearBackchannelTimer = () => {
        if (backchannelTimerRef.current) { clearTimeout(backchannelTimerRef.current); backchannelTimerRef.current = null; }
    };

    // ── Play a random backchannel clip ──
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

    // Schedule recurring backchannel checks during listening
    const startBackchannelSchedule = useCallback(() => {
        clearBackchannelTimer();
        const check = () => {
            if (!activeRef.current || stateRef.current !== 'listening') return;
            playBackchannel();
            backchannelTimerRef.current = setTimeout(check, BACKCHANNEL_GAP_MS + Math.random() * 4000);
        };
        // First check after BACKCHANNEL_MIN_MS
        backchannelTimerRef.current = setTimeout(check, BACKCHANNEL_MIN_MS);
    }, [playBackchannel]);

    // ── Submit accumulated transcript to caller ──
    const submitAnswer = useCallback(async () => {
        const answer = finalTextRef.current.trim();
        clearSilenceTimer();
        clearMaxWait();
        clearBackchannelTimer();

        if (!answer || answer.length < MIN_ANSWER_LENGTH) {
            if (activeRef.current) setState('listening');
            return;
        }

        setState('processing');
        setFinalTranscript(answer);

        // Fire-and-forget answer analysis
        let analysis = {};
        fetch(ANALYZE_ENDPOINT, {
            method:  'POST',
            headers: resolveAuthHeaders({ 'Content-Type': 'application/json' }),
            body:    JSON.stringify({
                question:      questionRef.current,
                answer,
                interviewType,
            }),
        })
            .then(r => r.json())
            .then(a => { analysis = a; })
            .catch(() => {})
            .finally(() => {
                try { onAnswer?.(answer, analysis); } catch { /* no-op */ }
            });

        // Reset for next question
        finalTextRef.current = '';
        interimRef.current   = '';
        setTranscript('');
        setInterimText('');
    }, [onAnswer, interviewType, resolveAuthHeaders]);

    const scheduleAutoSubmit = useCallback((utteranceEnded = false) => {
        const answer = finalTextRef.current.trim();
        if (!shouldAutoSubmitAnswer({ transcriptLength: answer.length, inputLevel: inputLevelRef.current, utteranceEnded })) {
            return;
        }

        clearSilenceTimer();
        silenceTimerRef.current = setTimeout(() => {
            if (shouldAutoSubmitAnswer({ transcriptLength: finalTextRef.current.trim().length, inputLevel: inputLevelRef.current, utteranceEnded: true })) {
                submitAnswer();
            }
        }, getAdaptiveSilenceMs(answer.length));
    }, [submitAnswer]);

    // ── Connect WebSocket to Deepgram ──
    const connectWebSocket = useCallback(async () => {
        let tokenRequestId = null;
        try {
            // Fetch auth token
            const tokenRequest = withVoiceRequestId(resolveAuthHeaders({}), 'voice-token');
            tokenRequestId = tokenRequest.requestId;
            logVoiceDebug('deepgram-token request', {
                endpoint: TOKEN_ENDPOINT,
                requestId: tokenRequest.requestId,
            });
            const tokenRes = await fetch(TOKEN_ENDPOINT, { headers: tokenRequest.headers });
            logVoiceDebug('deepgram-token response', {
                endpoint: TOKEN_ENDPOINT,
                status: tokenRes.status,
                ok: tokenRes.ok,
                requestId: tokenRes.headers.get('x-request-id') || tokenRequest.requestId,
            });
            const tokenData = await tokenRes.json();
            if (!tokenData.available || !tokenData.token) {
                logVoiceDebug('deepgram-token unavailable payload', tokenData);
                console.warn('[useDeepgramVoice] Deepgram token not available, falling back to REST');
                return false;
            }

            const ws = new WebSocket(buildDeepgramStreamingUrl(), ['token', tokenData.token]);
            wsRef.current = ws;

            return new Promise((resolve) => {
                ws.onopen = () => {
                    console.log('[useDeepgramVoice] ✓ Deepgram WebSocket connected');
                    wsReadyRef.current = true;
                    resolve(true);
                };

                ws.onmessage = (event) => {
                    if (!activeRef.current) return;
                    try {
                        const msg = JSON.parse(event.data);

                        // Speech started event
                        if (msg.type === 'SpeechStarted') {
                            clearSilenceTimer();
                            return;
                        }

                        // UtteranceEnd — primary "done speaking" signal from Deepgram VAD
                        if (msg.type === 'UtteranceEnd') {
                            scheduleAutoSubmit(true);
                            return;
                        }

                        // Transcript results
                        if (msg.type === 'Results' && msg.channel) {
                            const alt = msg.channel.alternatives?.[0];
                            if (!alt || !alt.transcript) return;

                            const text = alt.transcript.trim();
                            if (!text) return;

                            if (msg.is_final) {
                                // Final transcript: accumulate
                                finalTextRef.current = (finalTextRef.current + ' ' + text).trim();
                                interimRef.current = '';
                                setTranscript(finalTextRef.current);
                                setInterimText('');
                                transcriptListener?.(finalTextRef.current);

                                // Reset silence timer on new final speech
                                clearSilenceTimer();
                                scheduleAutoSubmit(false);
                            } else {
                                // Interim transcript: show live preview
                                interimRef.current = text;
                                const combined = (finalTextRef.current + ' ' + text).trim();
                                setInterimText(text);
                                transcriptListener?.(combined);
                            }
                        }
                    } catch (err) {
                        console.warn('[useDeepgramVoice] WS message parse error:', err.message);
                    }
                };

                ws.onerror = (err) => {
                    console.warn('[useDeepgramVoice] WebSocket error:', err);
                    wsReadyRef.current = false;
                };

                ws.onclose = (event) => {
                    console.log('[useDeepgramVoice] WebSocket closed:', event.code, event.reason);
                    wsReadyRef.current = false;
                    wsRef.current = null;
                };

                // Timeout after 5s
                setTimeout(() => {
                    if (!wsReadyRef.current) {
                        ws.close();
                        resolve(false);
                    }
                }, 5000);
            });
        } catch (err) {
            logVoiceDebug('deepgram-token request error', {
                endpoint: TOKEN_ENDPOINT,
                requestId: tokenRequestId,
                error: err?.message || String(err),
            });
            console.warn('[useDeepgramVoice] WebSocket connect failed:', err.message);
            return false;
        }
    }, [scheduleAutoSubmit, transcriptListener, resolveAuthHeaders]);

    // ── REST fallback for STT (when WebSocket is unavailable) ──
    const processChunkREST = useCallback(async (blob) => {
        if (!activeRef.current || !blob || blob.size < 100) return;

        try {
            const form = new FormData();
            form.append('audio', blob, 'chunk.webm');
            form.append('mimeType', blob.type || 'audio/webm');

            const res = await fetch(STT_ENDPOINT, {
                method: 'POST',
                headers: resolveAuthHeaders({}),
                body: form,
            });
            if (!res.ok) return;

            const data = await res.json();
            if (!data.transcript) return;

            const newText = (finalTextRef.current + ' ' + data.transcript).trim();
            finalTextRef.current = newText;
            setTranscript(newText);
            transcriptListener?.(newText);

            clearSilenceTimer();
            scheduleAutoSubmit(false);
        } catch (err) {
            console.warn('[useDeepgramVoice] REST chunk error:', err.message);
        }
    }, [scheduleAutoSubmit, transcriptListener, resolveAuthHeaders]);

    // ── Start listening ──
    const start = useCallback(async () => {
        if (activeRef.current) return;
        warmUp();

        setErrorMessage(null);
        setState('listening');
        finalTextRef.current = '';
        interimRef.current   = '';
        setTranscript('');
        setInterimText('');
        setFinalTranscript('');
        setInterruptDetected(false);

        // Stop any in-progress AI speech
        if (ttsAbortRef.current) { ttsAbortRef.current.abort(); ttsAbortRef.current = null; }
        if (audioRef.current)    { audioRef.current.pause(); audioRef.current.src = ''; }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount:     1,
                    sampleRate:       16000,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl:  true,
                },
            });

            streamRef.current = stream;
            setInputStreamState(stream);
            activeRef.current = true;
            listenStartRef.current = Date.now();

            // Try WebSocket first, fall back to REST
            const wsConnected = await connectWebSocket();

            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : MediaRecorder.isTypeSupported('audio/webm')
                    ? 'audio/webm'
                    : '';

            const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
            recorderRef.current = recorder;

            recorder.ondataavailable = (e) => {
                if (!e.data || e.data.size < 100) return;

                if (wsConnected && wsRef.current?.readyState === WebSocket.OPEN) {
                    // Stream directly to Deepgram WebSocket
                    e.data.arrayBuffer().then(buffer => {
                        if (wsRef.current?.readyState === WebSocket.OPEN) {
                            wsRef.current.send(buffer);
                        }
                    });
                } else {
                    // REST fallback
                    processChunkREST(e.data);
                }
            };

            recorder.start(CHUNK_INTERVAL_MS);

            // Safety valve: force submit after MAX_ANSWER_WAIT_MS
            maxWaitRef.current = setTimeout(submitAnswer, MAX_ANSWER_WAIT_MS);

            // Start backchannel schedule
            startBackchannelSchedule();

        } catch (err) {
            setErrorMessage('Microphone access denied. Please allow microphone access and try again.');
            setState('error');
            activeRef.current = false;
        }
    }, [connectWebSocket, processChunkREST, submitAnswer, startBackchannelSchedule]);

    // ── Stop listening ──
    const stop = useCallback(() => {
        activeRef.current = false;
        clearSilenceTimer();
        clearMaxWait();
        clearBackchannelTimer();
        setInputStreamState(null);

        // Close WebSocket
        if (wsRef.current) {
            try {
                // Send close message to Deepgram
                if (wsRef.current.readyState === WebSocket.OPEN) {
                    wsRef.current.send(JSON.stringify({ type: 'CloseStream' }));
                }
                wsRef.current.close();
            } catch { /* no-op */ }
            wsRef.current = null;
            wsReadyRef.current = false;
        }

        if (recorderRef.current && recorderRef.current.state !== 'inactive') {
            recorderRef.current.stop();
        }
        recorderRef.current = null;

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }

        setState('idle');
    }, []);

    // ── Interrupt AI speech mid-sentence ──
    const interrupt = useCallback(() => {
        if (ttsAbortRef.current) { ttsAbortRef.current.abort(); ttsAbortRef.current = null; }
        if (audioRef.current)   { audioRef.current.pause(); audioRef.current.src = ''; }
        setOutputAudioEl(null);
        setInterruptDetected(false);
        if (interruptTimerRef.current) { clearTimeout(interruptTimerRef.current); interruptTimerRef.current = null; }
        setState('idle');
    }, []);

    // ── Interrupt detection: monitor inputLevel during AI speaking ──
    useEffect(() => {
        if (!enableInterrupt) {
            if (interruptTimerRef.current) {
                clearTimeout(interruptTimerRef.current);
                interruptTimerRef.current = null;
            }
            return;
        }

        if (state !== 'speaking') {
            if (interruptTimerRef.current) { clearTimeout(interruptTimerRef.current); interruptTimerRef.current = null; }
            setInterruptDetected(false);
            return;
        }

        // When AI is speaking, check for user voice
        if (inputLevel > INTERRUPT_LEVEL) {
            if (!interruptTimerRef.current) {
                interruptTimerRef.current = setTimeout(() => {
                    // User has been speaking for INTERRUPT_DURATION ms — interrupt AI
                    setInterruptDetected(true);
                    interrupt();
                    // Immediately start listening
                    setTimeout(() => start(), 100);
                }, INTERRUPT_DURATION);
            }
        } else {
            // User stopped — cancel pending interrupt
            if (interruptTimerRef.current) {
                clearTimeout(interruptTimerRef.current);
                interruptTimerRef.current = null;
            }
        }
    }, [enableInterrupt, state, inputLevel, interrupt, start]);

    // ── Speak — AI TTS playback ──
    const speak = useCallback(async (text, { onStart, onEnd, addTransition = false } = {}) => {
        if (!text || !text.trim()) { onEnd?.(); return; }
        if (ttsAbortRef.current) ttsAbortRef.current.abort();

        const controller = new AbortController();
        ttsAbortRef.current = controller;
        setState('speaking');
        onStart?.();

        // Optionally prepend a transitional phrase for natural feel
        const spokenText = addTransition ? `${pickTransition()} ${text}` : text;

        let ttsRequestId = null;
        try {
            let blob;
            let cachedContentType = '';
            let isFallback = false;
            const cacheKey = text.trim().slice(0, 200);

            // Check pre-fetch cache first
            if (ttsCacheRef.current.has(cacheKey)) {
                const cached = await ttsCacheRef.current.get(cacheKey);
                if (cached) {
                    blob = cached.blob;
                    cachedContentType = cached.contentType || blob?.type || '';
                    if (shouldTreatTtsResponseAsFallback({ contentType: cachedContentType, blobSize: blob?.size })) {
                        isFallback = true;
                    }
                } else {
                    isFallback = true;
                }
                ttsCacheRef.current.delete(cacheKey);
            } else {
                const ttsRequest = withVoiceRequestId(
                    resolveAuthHeaders({ 'Content-Type': 'application/json' }),
                    'voice-tts'
                );
                ttsRequestId = ttsRequest.requestId;
                logVoiceDebug('tts request', {
                    endpoint: TTS_ENDPOINT,
                    requestId: ttsRequest.requestId,
                });
                const res = await fetch(TTS_ENDPOINT, {
                    method:  'POST',
                    headers: ttsRequest.headers,
                    body:    JSON.stringify({ text: spokenText, persona: 'friendly', gender: personaGender }),
                    signal:  controller.signal,
                });

                logVoiceDebug('tts response', {
                    endpoint: TTS_ENDPOINT,
                    status: res.status,
                    ok: res.ok,
                    requestId: res.headers.get('x-request-id') || ttsRequest.requestId,
                });

                if (!res.ok) throw new Error(`TTS HTTP ${res.status}`);

                const ct = (res.headers.get('content-type') || '').toLowerCase();
                blob = await res.blob();
                if (shouldTreatTtsResponseAsFallback({ contentType: ct, blobSize: blob?.size })) isFallback = true;
            }

            if (controller.signal.aborted) return;

            // ── Browser speechSynthesis fallback ──
            if (isFallback || !blob) {
                if ('speechSynthesis' in window) {
                    console.info('[useDeepgramVoice] TTS fallback → browser speechSynthesis');
                    await new Promise((resolve) => {
                        const utter = new SpeechSynthesisUtterance(spokenText);
                        utter.rate = 1.0;
                        utter.pitch = 1.0;
                        utter.onend = resolve;
                        utter.onerror = resolve;
                        controller.signal.addEventListener('abort', () => {
                            window.speechSynthesis.cancel();
                            resolve();
                        }, { once: true });
                        window.speechSynthesis.speak(utter);
                    });
                }
            } else {
                // ── Normal audio playback ──
                const playbackBlob = cachedContentType ? new Blob([blob], { type: cachedContentType }) : blob;
                const url = URL.createObjectURL(playbackBlob);

                if (!audioRef.current) audioRef.current = new Audio();
                audioRef.current.src = url;
                setOutputAudioEl(audioRef.current);

                try {
                    await audioRef.current.play();
                } catch (playError) {
                    URL.revokeObjectURL(url);
                    if ('speechSynthesis' in window) {
                        console.info('[useDeepgramVoice] Audio playback failed, using speechSynthesis fallback');
                        await new Promise((resolve) => {
                            const utter = new SpeechSynthesisUtterance(spokenText);
                            utter.rate = 1.0;
                            utter.pitch = 1.0;
                            utter.onend = resolve;
                            utter.onerror = resolve;
                            controller.signal.addEventListener('abort', () => {
                                window.speechSynthesis.cancel();
                                resolve();
                            }, { once: true });
                            window.speechSynthesis.speak(utter);
                        });
                        return;
                    }
                    throw playError;
                }

                await new Promise((resolve) => {
                    audioRef.current.onended  = resolve;
                    audioRef.current.onerror  = resolve;
                    controller.signal.addEventListener('abort', resolve, { once: true });
                });

                URL.revokeObjectURL(url);
            }
        } catch (err) {
            if (err.name === 'AbortError') {
                logVoiceDebug('tts request aborted', {
                    endpoint: TTS_ENDPOINT,
                    requestId: ttsRequestId,
                });
            } else {
                logVoiceDebug('tts request error', {
                    endpoint: TTS_ENDPOINT,
                    requestId: ttsRequestId,
                    error: err?.message || String(err),
                });
                console.warn('[useDeepgramVoice] speak error:', err.message);
            }
        } finally {
            if (!controller.signal.aborted) {
                setState('idle');
                onEnd?.();
            }
        }
    }, [personaGender, resolveAuthHeaders]);

    // ── Prefetch TTS for a text (speculative, non-blocking) ──
    const prefetch = useCallback((text) => {
        if (!text || !text.trim()) return;
        const cacheKey = text.trim().slice(0, 200);
        if (ttsCacheRef.current.has(cacheKey)) return;

        const prefetchRequest = withVoiceRequestId(
            resolveAuthHeaders({ 'Content-Type': 'application/json' }),
            'voice-prefetch'
        );
        logVoiceDebug('tts prefetch request', {
            endpoint: TTS_ENDPOINT,
            requestId: prefetchRequest.requestId,
        });

        const promise = fetch(TTS_ENDPOINT, {
            method:  'POST',
            headers: prefetchRequest.headers,
            body:    JSON.stringify({ text, persona: 'friendly', gender: personaGender }),
        })
        .then(async (res) => {
            logVoiceDebug('tts prefetch response', {
                endpoint: TTS_ENDPOINT,
                status: res.status,
                ok: res.ok,
                requestId: res.headers.get('x-request-id') || prefetchRequest.requestId,
            });
            if (!res.ok) throw new Error(`prefetch TTS HTTP ${res.status}`);
            const contentType = (res.headers.get('content-type') || '').toLowerCase();
            const blob = await res.blob();
            if (shouldTreatTtsResponseAsFallback({ contentType, blobSize: blob?.size })) return null;
            return { blob, contentType };
        })
        .catch(err => {
            console.warn('[useDeepgramVoice] prefetch error:', err.message);
            ttsCacheRef.current.delete(cacheKey);
            return null;
        });

        ttsCacheRef.current.set(cacheKey, promise);

        // Auto-evict after 60s
        setTimeout(() => ttsCacheRef.current.delete(cacheKey), 60_000);
    }, [personaGender, resolveAuthHeaders]);

    // Cleanup on unmount
    useEffect(() => () => {
        stop();
        interrupt();
    }, [stop, interrupt]);

    return {
        // State machine
        state,
        transcript,
        interimText,        // NEW: live interim text from Deepgram
        finalTranscript,
        errorMessage,
        interruptDetected,  // NEW: true when user interrupted AI

        // Controls
        start,
        stop,
        interrupt,
        speak,
        prefetch,

        // Audio element ref
        audioRef,
        streamRef,

        // Visualizer data
        inputBars,
        outputBars,
        inputLevel,
        outputLevel,
        inputActive:  inputLevel  > 0.08,
        outputActive: outputLevel > 0.05,
    };
}

export default useDeepgramVoice;
