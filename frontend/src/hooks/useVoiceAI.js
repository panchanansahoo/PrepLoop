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
import { useState, useRef, useCallback, useEffect } from 'react';
import useAudioVisualizer from './useAudioVisualizer';
import { mergeAuthHeaders } from '../utils/authHeaders';
import { buildApiUrl } from '../utils/safeApiUrl';

// ——— Configuration ———
const MIN_ANSWER_LENGTH   = 8;        // chars before silence timer starts
const MAX_ANSWER_WAIT_MS  = 60_000;   // safety: force-submit after 60s
const BACKCHANNEL_MIN_MS  = 8_000;    // min speech duration before backchannel
const BACKCHANNEL_GAP_MS  = 12_000;   // min gap between backchannel clips

// NEW: Silence timeout thresholds
const SILENCE_AUTO_SUBMIT_MS = 5_000;   // Auto-submit after 5s silence (when user has spoken)
const SILENCE_AUTO_SUBMIT_SHORT_MS = 4_000;  // First response timeout (if just starting)
const SILENCE_AUTO_SKIP_MS = 10_000;    // Auto-skip to next question if NO speech for 10s

const SILENCE_SHORT  = 2000;
const SILENCE_MEDIUM = 1500;
const SILENCE_LONG   = 1200;
const MAX_TRANSCRIPT_LENGTH = 10_000;

// TTS retry
const TTS_RETRY_DELAYS_MS = [500, 1000, 2000]; // Exponential backoff for TTS retries
const TTS_PLAYBACK_GUARD_MS = 30000;

// Interrupt detection
const INTERRUPT_LEVEL     = 0.12;
const INTERRUPT_DURATION  = 400;

// Endpoints
const RAW_API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function buildVoiceApiUrl(path, rawBaseUrl = RAW_API_BASE_URL) {
    return buildApiUrl(path, { rawBaseUrl, apiPrefix: '/api' });
}

const TTS_ENDPOINT         = buildVoiceApiUrl('/voice/tts-stream');
const TTS_OPTIMIZED_ENDPOINT = buildVoiceApiUrl('/voice/tts-optimized'); // Phase 1 optimization
const ANALYZE_ENDPOINT     = buildVoiceApiUrl('/voice/analyze-answer');
const BACKCHANNEL_ENDPOINT = buildVoiceApiUrl('/voice/backchannel-clips');

// ——— TTS Hash-Based Caching (Phase 1 Optimization) ———
// OPTIMIZATION: Cache TTS responses by content hash instead of storing raw strings
// Benefit: Reuse cached audio across interview sessions within 24 hours
// Implementation: Stores in IndexedDB with TTL-based cleanup

const TTS_CACHE_DB_NAME = 'PrepLoop_TTS_Cache';
const TTS_CACHE_STORE_NAME = 'tts_responses';
const TTS_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Simple FNV-1a hash for TTS parameters (fast, deterministic)
function hashTtsParams(text, persona, language, gender) {
    let hash = 2166136261; // FNV offset basis
    const fnvPrime = 16777619;
    
    const data = `${text}|${persona}|${language}|${gender}`;
    for (let i = 0; i < data.length; i++) {
        hash = (hash ^ data.charCodeAt(i)) * fnvPrime;
        hash = hash >>> 0; // Keep as 32-bit unsigned
    }
    
    return `tts_${hash.toString(16)}`;
}

// Initialize IndexedDB for TTS caching (one-time setup)
let _ttsDbReady = false;
let _ttsCacheDb = null;

async function initTtsCache() {
    if (_ttsDbReady || !('indexedDB' in window)) return null;
    
    try {
        return new Promise((resolve, reject) => {
            const req = window.indexedDB.open(TTS_CACHE_DB_NAME, 1);
            
            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(TTS_CACHE_STORE_NAME)) {
                    const store = db.createObjectStore(TTS_CACHE_STORE_NAME, { keyPath: 'cacheKey' });
                    store.createIndex('expireTime', 'expireTime', { unique: false });
                }
            };
            
            req.onsuccess = () => {
                _ttsCacheDb = req.result;
                _ttsDbReady = true;
                resolve(_ttsCacheDb);
            };
            
            req.onerror = () => {
                console.warn('[TTS-Cache] IndexedDB init failed, continuing without cache');
                resolve(null);
            };
        });
    } catch (err) {
        console.warn('[TTS-Cache] IndexedDB not available:', err.message);
        return null;
    }
}

async function getTtsCached(text, persona, language, gender) {
    if (!_ttsDbReady) return null;
    
    const cacheKey = hashTtsParams(text, persona, language, gender);
    
    try {
        return new Promise((resolve) => {
            if (!_ttsCacheDb) {
                resolve(null);
                return;
            }
            
            const tx = _ttsCacheDb.transaction([TTS_CACHE_STORE_NAME], 'readonly');
            const store = tx.objectStore(TTS_CACHE_STORE_NAME);
            const req = store.get(cacheKey);
            
            req.onsuccess = () => {
                const cached = req.result;
                if (cached && cached.expireTime > Date.now()) {
                    logVoiceDebug('TTS cache hit', { cacheKey, age: Date.now() - cached.cacheTime });
                    resolve(cached.audioData);
                } else if (cached) {
                    // Expired — delete it
                    const delReq = store.delete(cacheKey);
                    delReq.onsuccess = () => resolve(null);
                    delReq.onerror = () => resolve(null);
                } else {
                    resolve(null);
                }
            };
            
            req.onerror = () => resolve(null);
        });
    } catch (err) {
        console.warn('[TTS-Cache] Get failed:', err.message);
        return null;
    }
}

async function setTtsCached(text, persona, language, gender, audioData) {
    if (!_ttsDbReady) return;
    
    const cacheKey = hashTtsParams(text, persona, language, gender);
    
    try {
        if (!_ttsCacheDb) return;
        
        const tx = _ttsCacheDb.transaction([TTS_CACHE_STORE_NAME], 'readwrite');
        const store = tx.objectStore(TTS_CACHE_STORE_NAME);
        
        store.put({
            cacheKey,
            audioData,
            cacheTime: Date.now(),
            expireTime: Date.now() + TTS_CACHE_TTL_MS,
        });
    } catch (err) {
        console.warn('[TTS-Cache] Set failed:', err.message);
    }
}

export function appendTranscriptCapped(existing = '', chunk = '', maxLength = MAX_TRANSCRIPT_LENGTH) {
    const appended = `${existing} ${chunk}`.trim();
    if (appended.length <= maxLength) return appended;
    return appended.slice(-maxLength);
}

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
    // NEW: Use fixed 4s silence threshold for better UX
    return SILENCE_AUTO_SUBMIT_MS;
}

export function getPostSpeechAutoSubmitMs(textLength) {
    // NEW: Always use 4s silence threshold
    return SILENCE_AUTO_SUBMIT_MS;
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

export function isAudioContentType(contentType = '') {
    return /^audio\//i.test(String(contentType).trim());
}

function playBrowserSpeechFallback(text, { voice, gender, controller, guardMs }) {
    if (!('speechSynthesis' in window)) return Promise.resolve();
    return new Promise((resolve) => {
        let guardTimer = null;
        let settled = false;
        const settle = () => {
            if (settled) return;
            settled = true;
            if (guardTimer) clearTimeout(guardTimer);
            resolve();
        };
        
        // CRITICAL FIX: Chrome has a known bug where speechSynthesis.speak()
        // fails silently if called immediately after cancel(). The workaround
        // is to cancel any pending utterances, wait a tick, then resume the
        // engine before queuing the new utterance.
        window.speechSynthesis.cancel();
        
        // Use a small delay to let Chrome's speech engine fully reset
        setTimeout(() => {
            if (controller?.signal?.aborted) { settle(); return; }
            
            // Ensure the engine is not in a paused state
            if (window.speechSynthesis.paused) {
                window.speechSynthesis.resume();
            }
            
            const utter = new SpeechSynthesisUtterance(text);
            if (voice) utter.voice = voice;
            utter.rate = 1.0;
            utter.pitch = gender === 'male' ? 0.9 : 1.0;
            utter.onend = settle;
            utter.onerror = (e) => {
                console.warn('[useVoiceAI] Browser speech error:', e?.error || e);
                settle();
            };
            if (controller?.signal) {
                controller.signal.addEventListener('abort', () => {
                    window.speechSynthesis.cancel();
                    settle();
                }, { once: true });
            }
            guardTimer = setTimeout(() => {
                window.speechSynthesis.cancel();
                settle();
            }, guardMs || 30000);
            
            console.log('[useVoiceAI] Browser speech fallback speaking:', text.substring(0, 50) + '...');
            window.speechSynthesis.speak(utter);
        }, 100);  // 100ms delay is sufficient for Chrome to reset after cancel()
    });
}

export function shouldTreatTtsResponseAsFallback({ contentType = '', blobSize = 0 } = {}) {
    return !isAudioContentType(contentType) || Number(blobSize) < 100;
}

export function useVoiceAI({
    onAnswer,
    onTranscriptUpdate,
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
    const [connectionMode, setConnectionMode] = useState('browser'); // Always browser for STT
    const [silenceCountdown, setSilenceCountdown] = useState(0);
    const [connectionHealth, setConnectionHealth] = useState('good'); // 'good' | 'degraded' | 'fallback'

    const transcriptListener = onTranscriptUpdate || onTranscript;
    const inputLevelRef = useRef(0);

    const audioRef         = useRef(null);
    const streamRef        = useRef(null);
    
    const silenceTimerRef  = useRef(null);
    const maxWaitRef       = useRef(null);
    const totalSilenceTimerRef = useRef(null); 
    const afterSpeechSilenceRef = useRef(null); 
    
    const finalTextRef     = useRef('');
    const interimRef       = useRef('');
    const activeRef        = useRef(false);
    const stateRef         = useRef('idle');
    
    const ttsAbortRef      = useRef(null);
    const ttsCacheRef      = useRef(new Map());
    
    const backchannelRef   = useRef(null);
    const backchannelLoadedRef = useRef(false);
    const lastBackchannelRef   = useRef(0);
    const listenStartRef       = useRef(0);
    const backchannelTimerRef  = useRef(null);
    
    const interruptTimerRef = useRef(null);
    
    const analyticsRef = useRef({
        ttsFallbacks: 0,
        ttsRetries: 0,
        sessionStart: Date.now(),
    });
    
    const questionRef      = useRef(question);
    useEffect(() => { questionRef.current = question; }, [question]);
    useEffect(() => { stateRef.current = state; }, [state]);

    const resolveAuthHeaders = useCallback((headersInput = {}) => {
        const callerHeaders = typeof getAuthHeaders === 'function' ? getAuthHeaders() : {};
        return mergeAuthHeaders({ ...headersInput, ...callerHeaders });
    }, [getAuthHeaders]);

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
                    audio.volume = 0.3;
                    clips[key] = audio;
                }
                backchannelRef.current = clips;
            })
            .catch(() => {});
    }, [personaGender]);

    // I10: Pre-warm TTS on mount so first question audio is instant
    // Only pre-warm if getAuthHeaders is available to ensure authenticated requests
    useEffect(() => {
        if (!getAuthHeaders) return;
        
        const controller = new AbortController();
        fetch(TTS_ENDPOINT, {
            method: 'POST',
            headers: resolveAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ text: ' ', persona: 'friendly', gender: personaGender }),
            signal: controller.signal,
        }).catch(() => {});
        return () => controller.abort();
    }, [getAuthHeaders, personaGender, resolveAuthHeaders]);

    const clearSilenceTimer = () => {
        if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
    };
    const clearMaxWait = () => {
        if (maxWaitRef.current) { clearTimeout(maxWaitRef.current); maxWaitRef.current = null; }
    };
    const clearBackchannelTimer = () => {
        if (backchannelTimerRef.current) { clearTimeout(backchannelTimerRef.current); backchannelTimerRef.current = null; }
    };
    const clearTotalSilenceTimer = () => {
        if (totalSilenceTimerRef.current) { clearTimeout(totalSilenceTimerRef.current); totalSilenceTimerRef.current = null; }
    };
    const clearAfterSpeechSilence = () => {
        if (afterSpeechSilenceRef.current) { clearTimeout(afterSpeechSilenceRef.current); afterSpeechSilenceRef.current = null; }
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
            if (!activeRef.current || stateRef.current !== 'listening') return;
            playBackchannel();
            backchannelTimerRef.current = setTimeout(check, BACKCHANNEL_GAP_MS + Math.random() * 4000);
        };
        backchannelTimerRef.current = setTimeout(check, BACKCHANNEL_MIN_MS);
    }, [playBackchannel]);

    const submitAnswer = useCallback(async () => {
        // FIX: Final safety net - finalize any remaining interim text
        if (interimRef.current && interimRef.current.trim()) {
            finalTextRef.current = (finalTextRef.current + ' ' + interimRef.current).trim();
            interimRef.current = '';
            console.log('[useVoiceAI] Final finalization: moved interim to final in submitAnswer');
        }
        
        const answer = finalTextRef.current.trim();
        clearSilenceTimer();
        clearMaxWait();
        clearBackchannelTimer();
        clearTotalSilenceTimer();
        clearAfterSpeechSilence();

        if (!answer || answer.length < MIN_ANSWER_LENGTH) {
            if (activeRef.current) setState('listening');
            return;
        }

        setState('processing');
        setFinalTranscript(answer);

        fetch(ANALYZE_ENDPOINT, {
            method:  'POST',
            headers: resolveAuthHeaders({ 'Content-Type': 'application/json' }),
            body:    JSON.stringify({
                question:      questionRef.current,
                answer,
                interviewType,
            }),
        }).catch(() => {});

        try { onAnswer?.(answer, {}); } catch { /* no-op */ }

        finalTextRef.current = '';
        interimRef.current   = '';
        setTranscript('');
        setInterimText('');
    }, [onAnswer, interviewType, resolveAuthHeaders]);

    const browserRecognitionRef = useRef(null);

    const start = useCallback(async () => {
        if (activeRef.current) return;

        setErrorMessage(null);
        setState('listening');
        finalTextRef.current = '';
        interimRef.current   = '';
        setTranscript('');
        setInterimText('');
        setFinalTranscript('');
        setInterruptDetected(false);
        setSilenceCountdown(0);

        if (ttsAbortRef.current) { ttsAbortRef.current.abort(); ttsAbortRef.current = null; }
        if (audioRef.current)    { audioRef.current.pause(); audioRef.current.src = ''; }

        console.log('[useVoiceAI] Starting voice recording...');

        try {
            let stream = streamRef.current;
            const streamAlive = stream && stream.getTracks().some(t => t.readyState === 'live');
            if (!streamAlive) {
                console.log('[useVoiceAI] Requesting microphone access...');
                stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        channelCount:     1,
                        sampleRate:       16000,
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl:  true,
                    },
                });
                streamRef.current = stream;
                console.log('[useVoiceAI] ✓ Microphone access granted');
            } else {
                console.log('[useVoiceAI] ✓ Reusing existing microphone stream');
            }
            setInputStreamState(stream);
            activeRef.current = true;
            listenStartRef.current = Date.now();

            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                console.log('[useVoiceAI] Using browser SpeechRecognition');
                setConnectionMode('browser');
                const recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = 'en-US';

                recognition.onresult = (event) => {
                    if (!activeRef.current) return;
                    let interim = '';
                    let finalText = '';
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        const result = event.results[i];
                        if (result.isFinal) {
                            finalText += result[0].transcript;
                        } else if ((result[0]?.confidence || 0) >= 0.3) {
                            interim += result[0].transcript;
                        }
                    }
                    if (finalText) {
                        finalTextRef.current = appendTranscriptCapped(
                            finalTextRef.current,
                            finalText,
                            MAX_TRANSCRIPT_LENGTH
                        );
                        interimRef.current = '';
                        setTranscript(finalTextRef.current);
                        setInterimText('');
                        transcriptListener?.(finalTextRef.current);
                        clearTotalSilenceTimer();
                        clearAfterSpeechSilence();
                        
                        const postMs = getPostSpeechAutoSubmitMs(finalTextRef.current.trim().length);
                        
                        // NEW: Show silence countdown for better UX
                        let countdownMs = postMs;
                        const countdownInterval = setInterval(() => {
                            countdownMs -= 100;
                            setSilenceCountdown(Math.max(0, Math.ceil(countdownMs / 1000)));
                            if (countdownMs <= 0) {
                                clearInterval(countdownInterval);
                            }
                        }, 100);
                        
                        afterSpeechSilenceRef.current = setTimeout(() => {
                            clearInterval(countdownInterval);
                            
                            // FIX: Finalize any remaining interim text before submitting
                            // This prevents answer cut-off issues
                            if (interimRef.current && interimRef.current.trim()) {
                                finalTextRef.current += ' ' + interimRef.current;
                                setTranscript(finalTextRef.current);
                                interimRef.current = '';
                                setInterimText('');
                                console.log('[useVoiceAI] Finalized interim text into final answer');
                            }
                            
                            setSilenceCountdown(0);
                            if (finalTextRef.current.trim().length >= MIN_ANSWER_LENGTH) {
                                console.log('[useVoiceAI] 5s silence reached, auto-submitting answer (with interim finalized)');
                                submitAnswer();
                            }
                        }, postMs);
                    }
                    if (interim) {
                        interimRef.current = interim;
                        setInterimText(interim);
                        const combined = (finalTextRef.current + ' ' + interim).trim();
                        transcriptListener?.(combined);
                        clearTotalSilenceTimer();
                        // CRITICAL FIX: Do NOT clear afterSpeechSilence timeout when interim arrives!
                        // Clearing it was causing the countdown to reset, breaking the 8s silence detection.
                        // User is still speaking (interim text = ongoing speech), so we keep the timer running.
                    }
                };

                recognition.onerror = (event) => {
                    if (event.error !== 'no-speech') {
                        console.warn('[useVoiceAI] Browser STT error:', event.error);
                    }
                };

                recognition.onend = () => {
                    if (activeRef.current && stateRef.current === 'listening') {
                        try { recognition.start(); } catch { /* already started */ }
                    }
                };

                try {
                    recognition.start();
                    browserRecognitionRef.current = recognition;
                    console.log('[useVoiceAI] ✓ Browser SpeechRecognition started');
                } catch (e) {
                    console.warn('[useVoiceAI] Browser STT start failed:', e);
                }
            } else {
                console.warn('[useVoiceAI] No STT available (no browser SpeechRecognition)');
                setErrorMessage('Speech recognition is not available in this browser. Please use Chrome or Edge.');
            }

            maxWaitRef.current = setTimeout(submitAnswer, MAX_ANSWER_WAIT_MS);

     // NEW: Show countdown for 10s no-answer timeout
            let noAnswerCountdownMs = SILENCE_AUTO_SKIP_MS;
            const noAnswerInterval = setInterval(() => {
                noAnswerCountdownMs -= 100;
                if (noAnswerCountdownMs <= 0) {
                    clearInterval(noAnswerInterval);
                }
            }, 100);

     totalSilenceTimerRef.current = setTimeout(() => {
                clearInterval(noAnswerInterval);
                console.log('[useVoiceAI] 10 seconds of total silence (no speech detected), auto-skipping question');
                
                // Skip to next question without submitting empty answer
                // Call onAnswer with empty string to signal "no response, move to next"
                
                // Clean up all timers and state before calling onAnswer
                clearSilenceTimer();
                clearMaxWait();
                clearBackchannelTimer();
                clearAfterSpeechSilence();
                
                setState('processing');
                setFinalTranscript('');
                
                finalTextRef.current = '';
                interimRef.current = '';
                setTranscript('');
                setInterimText('');
                setSilenceCountdown(0);
                
                try {
                    onAnswer?.('', { noAnswer: true });
                } catch { /* no-op */ }
            }, SILENCE_AUTO_SKIP_MS);

            startBackchannelSchedule();

        } catch (err) {
            console.error('[useVoiceAI] Start error:', err);
            const errorMsg = err.name === 'NotAllowedError' 
                ? 'Microphone access denied. Please allow microphone access and try again.'
                : err.name === 'NotFoundError'
                ? 'No microphone found. Please connect a microphone and try again.'
                : `Microphone error: ${err.message}`;
            setErrorMessage(errorMsg);
            setState('error');
            activeRef.current = false;
        }
    }, [submitAnswer, startBackchannelSchedule]);

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
            try { browserRecognitionRef.current.stop(); } catch { /* no-op */ }
            browserRecognitionRef.current = null;
        }

        setState('idle');
    }, []);

    const releaseStream = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
    }, []);

    const interrupt = useCallback(() => {
        if (ttsAbortRef.current) { ttsAbortRef.current.abort(); ttsAbortRef.current = null; }
        if (audioRef.current) {
            try {
                audioRef.current.pause();
                audioRef.current.removeAttribute('src');
                audioRef.current.onended = null;
                audioRef.current.onerror = null;
            } catch (e) {}
        }
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        setOutputAudioEl(null);
        setInterruptDetected(false);
        if (interruptTimerRef.current) { clearTimeout(interruptTimerRef.current); interruptTimerRef.current = null; }
        setState('idle');
    }, []);

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

    const pickBrowserVoice = useCallback((gender) => {
        if (!('speechSynthesis' in window)) return null;
        const voices = window.speechSynthesis.getVoices();
        if (!voices.length) return null;
        const g = (gender || personaGender || 'female').toLowerCase();
        const maleNames   = ['Daniel', 'Alex', 'David', 'Google UK English Male', 'Microsoft David', 'Microsoft Mark'];
        const femaleNames = ['Samantha', 'Karen', 'Google UK English Female', 'Microsoft Zira', 'Microsoft Jenny', 'Moira', 'Fiona'];
        const preferred = g === 'male' ? maleNames : femaleNames;
        for (const name of preferred) {
            const v = voices.find(v => v.name.includes(name));
            if (v) return v;
        }
        const kw = g === 'male' ? /male|man|david|alex|daniel|mark/i : /female|woman|samantha|jenny|karen|zira/i;
        const gendered = voices.find(v => v.lang.startsWith('en') && kw.test(v.name));
        if (gendered) return gendered;
        return voices.find(v => v.lang.startsWith('en')) || voices[0] || null;
    }, [personaGender]);

    const speak = useCallback(async (text, { onStart, onEnd, addTransition = false } = {}) => {
        if (!text || !text.trim()) { onEnd?.(); return; }
        if (ttsAbortRef.current) ttsAbortRef.current.abort();

        const controller = new AbortController();
        ttsAbortRef.current = controller;
        setState('speaking');
        onStart?.();

        const spokenText = addTransition ? `${pickTransition()} ${text}` : text;

        let ttsRequestId = null;
        try {
            let blob;
            let cachedContentType = '';
            let isFallback = false;
            const cacheKey = text.trim().slice(0, 200);

            // OPTIMIZATION (Phase 1): Check hash-based IndexedDB cache first
            if (!_ttsDbReady) {
                await initTtsCache();
            }
            
            const hashCached = await getTtsCached(spokenText, 'friendly', 'en', personaGender);
            if (hashCached) {
                blob = hashCached;
                cachedContentType = blob?.type || 'audio/mpeg';
                logVoiceDebug('tts hash cache hit', { text: spokenText.substring(0, 30) });
                if (shouldTreatTtsResponseAsFallback({ contentType: cachedContentType, blobSize: blob?.size })) {
                    isFallback = true;
                }
            } 
            // Fallback to legacy memory cache for backwards compatibility
            else if (ttsCacheRef.current.has(cacheKey)) {
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
                console.log('[useVoiceAI] Sending TTS request for text:', spokenText.substring(0, 50) + '...');
                
                const TTS_TIMEOUT_MS = 15000; 
                
                const fetchTts = async (timeoutMs = TTS_TIMEOUT_MS) => {
                    const timeoutPromise = new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('TTS timeout')), timeoutMs)
                    );
                    
                    const fetchPromise = fetch(TTS_ENDPOINT, {
                        method:  'POST',
                        headers: ttsRequest.headers,
                        body:    JSON.stringify({ text: spokenText, persona: 'friendly', gender: personaGender }),
                        signal:  controller.signal,
                    });
                    
                    const res = await Promise.race([fetchPromise, timeoutPromise]);
                    logVoiceDebug('tts response', {
                        endpoint: TTS_ENDPOINT,
                        status: res.status,
                        ok: res.ok,
                        requestId: res.headers.get('x-request-id') || ttsRequest.requestId,
                    });
                    if (!res.ok) throw new Error(`TTS HTTP ${res.status}`);
                    return res;
                };

                let res;
                try {
                    res = await fetchTts(TTS_TIMEOUT_MS);
                } catch (firstErr) {
                    if (controller.signal.aborted) throw firstErr;
                    
                    if (firstErr.message !== 'TTS timeout' && !firstErr.message.includes('timeout')) {
                        // Exponential backoff: retry up to TTS_RETRY_DELAYS_MS.length times
                        let retrySuccess = false;
                        for (let i = 0; i < TTS_RETRY_DELAYS_MS.length; i++) {
                            analyticsRef.current.ttsRetries++;
                            setConnectionHealth('degraded');
                            logVoiceDebug(`tts retry ${i + 1}/${TTS_RETRY_DELAYS_MS.length}`, { error: firstErr.message, delayMs: TTS_RETRY_DELAYS_MS[i] });
                            await new Promise(r => setTimeout(r, TTS_RETRY_DELAYS_MS[i]));
                            if (controller.signal.aborted) throw new DOMException('Aborted', 'AbortError');
                            try {
                                res = await fetchTts(4000);
                                setConnectionHealth('good');
                                retrySuccess = true;
                                break;
                            } catch (retryErr) {
                                console.warn(`[useVoiceAI] TTS retry ${i + 1} failed:`, retryErr.message);
                            }
                        }
                        if (!retrySuccess) {
                            console.warn('[useVoiceAI] TTS failed all retries, falling back to browser speech');
                            analyticsRef.current.ttsFallbacks++;
                            setConnectionHealth('fallback');
                            isFallback = true;
                            blob = null;
                        }
                    } else {
                        console.warn('[useVoiceAI] TTS timeout, falling back to browser speech');
                        analyticsRef.current.ttsFallbacks++;
                        setConnectionHealth('fallback');
                        isFallback = true;
                        blob = null;
                    }
                }

                let responseCt = '';
                if (res && !isFallback) {
                    responseCt = (res.headers.get('content-type') || '').toLowerCase();
                    console.log('[useVoiceAI] TTS response content-type:', responseCt);
                    blob = await res.blob();
                    console.log('[useVoiceAI] TTS response blob size:', blob.size, 'bytes');
                    
                    // Check if response is JSON (indicates API-level fallback or error)
                    if (responseCt.includes('application/json')) {
                        const jsonData = JSON.parse(await blob.text());
                        if (jsonData.fallback) {
                            console.warn('[useVoiceAI] Backend returned fallback JSON');
                            isFallback = true;
                            blob = null;
                        } else {
                            console.warn('[useVoiceAI] Unexpected JSON response:', jsonData);
                            isFallback = true;
                            blob = null;
                        }
                    } else if (shouldTreatTtsResponseAsFallback({ contentType: responseCt, blobSize: blob?.size })) {
                        console.warn('[useVoiceAI] TTS response treated as fallback (invalid audio)');
                        isFallback = true;
                    } else {
                        // OPTIMIZATION (Phase 1): Store in hash-based cache for future sessions
                        setTtsCached(spokenText, 'friendly', 'en', personaGender, blob).catch(err => {
                            console.warn('[useVoiceAI] Failed to cache TTS response:', err.message);
                        });
                    }
                }
            }

            if (controller.signal.aborted) return;

            if (isFallback || !blob) {
                if (!isFallback) analyticsRef.current.ttsFallbacks++;
                setConnectionHealth('fallback');
                console.info('[useVoiceAI] TTS fallback → browser speechSynthesis');
                await playBrowserSpeechFallback(spokenText, {
                    voice: pickBrowserVoice(personaGender),
                    gender: personaGender,
                    controller,
                    guardMs: TTS_PLAYBACK_GUARD_MS,
                });
            } else {
                const effectiveType = cachedContentType || blob.type || 'audio/wav';
                const playbackBlob = new Blob([blob], { type: effectiveType });
                const url = URL.createObjectURL(playbackBlob);

                console.log('[useVoiceAI] Playing audio blob:', playbackBlob.size, 'bytes, type:', playbackBlob.type);

                if (audioRef.current) {
                    try {
                        audioRef.current.pause();
                        audioRef.current.removeAttribute('src');
                        audioRef.current.onended = null;
                        audioRef.current.onerror = null;
                    } catch (e) {}
                }
                
                audioRef.current = new Audio(url);
                setOutputAudioEl(audioRef.current);

                await new Promise(async (resolve) => {
                    let guardTimer = null;
                    let settled = false;
                    const settle = () => {
                        if (settled) return;
                        settled = true;
                        if (guardTimer) clearTimeout(guardTimer);
                        resolve();
                    };

                    audioRef.current.onended  = settle;
                    audioRef.current.onerror  = settle;
                    controller.signal.addEventListener('abort', settle, { once: true });

                    try {
                        console.log('[useVoiceAI] Starting audio playback...');
                        await audioRef.current.play();
                        console.log('[useVoiceAI] ✓ Audio playback started');
                        
                        guardTimer = setTimeout(() => {
                            try { audioRef.current?.pause(); } catch { }
                            settle();
                        }, TTS_PLAYBACK_GUARD_MS);
                    } catch (playError) {
                        console.error('[useVoiceAI] Audio playback failed:', playError);
                        URL.revokeObjectURL(url);
                        if ('speechSynthesis' in window) {
                            analyticsRef.current.ttsFallbacks++;
                            console.info('[useVoiceAI] Audio playback failed, using speechSynthesis fallback');
                            playBrowserSpeechFallback(spokenText, {
                                voice: pickBrowserVoice(personaGender),
                                gender: personaGender,
                                controller,
                                guardMs: TTS_PLAYBACK_GUARD_MS,
                            }).then(settle);
                            setOutputAudioEl(null);
                        } else {
                            settle();
                        }
                    }
                });

                URL.revokeObjectURL(url);
                setOutputAudioEl(null);     
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
                console.warn('[useVoiceAI] speak error:', err.message);
            }
            if (audioRef.current) {
                try {
                    audioRef.current.pause();
                    if (audioRef.current.src && audioRef.current.src.startsWith('blob:')) {
                        URL.revokeObjectURL(audioRef.current.src);
                    }
                    audioRef.current.src = '';
                } catch { }
            }
        } finally {
            setOutputAudioEl(null);
            if (!controller.signal.aborted) {
                setState('idle');
                onEnd?.();
            }
        }
    }, [personaGender, pickBrowserVoice, resolveAuthHeaders]);

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
            console.warn('[useVoiceAI] prefetch error:', err.message);
            ttsCacheRef.current.delete(cacheKey);
            return null;
        });

        ttsCacheRef.current.set(cacheKey, promise);
        setTimeout(() => ttsCacheRef.current.delete(cacheKey), 60_000);
    }, [personaGender, resolveAuthHeaders]);

    const cleanup = useCallback(() => {
        stop();
        interrupt();
        releaseStream();
    }, [stop, interrupt, releaseStream]);

    useEffect(() => () => {
        cleanup();
    }, [cleanup]);

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
        inputActive:  inputLevel  > 0.08,
        outputActive: outputLevel > 0.05,
        getAnalytics: () => ({
            ...analyticsRef.current,
            sessionDurationMs: Date.now() - analyticsRef.current.sessionStart,
        }),
    };
}

export default useVoiceAI;
