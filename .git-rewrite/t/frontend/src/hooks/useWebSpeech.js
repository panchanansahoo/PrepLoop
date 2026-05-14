import { useState, useRef, useCallback, useEffect } from 'react';

const SILENCE_THRESHOLD_MS = 3000; // Auto-submit after 3 seconds of silence
const CHUNK_INTERVAL_MS = 1000;
const MIN_CONFIDENCE = 0.3; // Drop interim results below this confidence
const MAX_RESTART_ATTEMPTS = 5;
const FILLER_WORDS = ['um', 'uh', 'like', 'you know', 'basically', 'sort of', 'literally', 'right', 'actually'];

/**
 * Check if the browser supports the Web Speech API.
 * Best support: Chrome, Edge. Partial: Safari. Poor: Firefox.
 */
export function isWebSpeechSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

/**
 * Detect filler words in a transcript string.
 * Returns { count, words } for the intelligence layer.
 */
function detectFillerWords(text) {
    const lower = text.toLowerCase();
    const found = [];
    for (const filler of FILLER_WORDS) {
        const regex = new RegExp(`\\b${filler}\\b`, 'gi');
        const matches = lower.match(regex);
        if (matches) {
            found.push(...matches.map(() => filler));
        }
    }
    return { count: found.length, words: found };
}

export function useWebSpeech({
    onAnswer,
    onTranscriptUpdate,
    interviewType = 'technical',
    personaGender = 'female',
    question = '',
    enableInterrupt = true,
} = {}) {
    const [state, setState] = useState('idle'); // idle | listening | processing | error
    const [transcript, setTranscript] = useState('');
    const [interimText, setInterimText] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [interruptDetected, setInterruptDetected] = useState(false);
    const [fillerStats, setFillerStats] = useState({ count: 0, words: [] });

    const recognitionRef = useRef(null);
    const accumulatedTranscriptRef = useRef('');
    const silenceTimerRef = useRef(null);
    const isListeningRef = useRef(false);
    const restartAttemptsRef = useRef(0);
    const [inputLevel, setInputLevel] = useState(0);

    // Initialize SpeechRecognition
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setErrorMessage('Browser does not support SpeechRecognition');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setState('listening');
            isListeningRef.current = true;
            restartAttemptsRef.current = 0; // Reset on successful start
        };

        recognition.onresult = (event) => {
            let interim = '';
            let final = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const result = event.results[i];
                const confidence = result[0]?.confidence || 0;

                if (result.isFinal) {
                    final += result[0].transcript;
                } else if (confidence >= MIN_CONFIDENCE) {
                    // Only include interim results with sufficient confidence
                    interim += result[0].transcript;
                }
            }

            if (final) {
                accumulatedTranscriptRef.current += (accumulatedTranscriptRef.current ? ' ' : '') + final;
                setTranscript(accumulatedTranscriptRef.current);

                // Track filler words for interview intelligence
                const fillers = detectFillerWords(accumulatedTranscriptRef.current);
                setFillerStats(fillers);
            }

            setInterimText(interim);
            if (onTranscriptUpdate) {
                onTranscriptUpdate(accumulatedTranscriptRef.current + (interim ? ' ' + interim : ''));
            }

            // Interrupt AI if user starts speaking
            if ((interim || final) && enableInterrupt) {
                setInterruptDetected(true);
                window.speechSynthesis.cancel();
            }

            // Simulate mic level based on text length for visual feedback
            const level = Math.min((interim.length + final.length) * 5, 100);
            setInputLevel(level);

            // Reset silence timer
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = setTimeout(() => {
                if (isListeningRef.current && accumulatedTranscriptRef.current) {
                    handleAutoSubmit();
                }
            }, SILENCE_THRESHOLD_MS);
        };

        recognition.onerror = (event) => {
            console.error('[useWebSpeech] Error:', event.error);
            if (event.error !== 'no-speech') {
                setErrorMessage(event.error);
                setState('error');
            }
        };

        recognition.onend = () => {
            if (isListeningRef.current) {
                // Restart with exponential backoff if it stopped unexpectedly
                restartAttemptsRef.current++;
                if (restartAttemptsRef.current <= MAX_RESTART_ATTEMPTS) {
                    const delay = Math.min(100 * Math.pow(2, restartAttemptsRef.current - 1), 3000);
                    setTimeout(() => {
                        try {
                            recognition.start();
                        } catch (e) {
                            console.error('[useWebSpeech] Failed to restart recognition:', e);
                            setState('error');
                            setErrorMessage('Speech recognition stopped unexpectedly. Click the mic to try again.');
                        }
                    }, delay);
                } else {
                    setState('error');
                    setErrorMessage('Speech recognition failed to restart. Please refresh the page.');
                    isListeningRef.current = false;
                }
            } else {
                setState('idle');
            }
        };

        recognitionRef.current = recognition;

        return () => {
            clearTimeout(silenceTimerRef.current);
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [onAnswer, onTranscriptUpdate, enableInterrupt]);

    const handleAutoSubmit = useCallback(() => {
        if (!accumulatedTranscriptRef.current.trim()) return;
        const finalAnswer = accumulatedTranscriptRef.current.trim();
        setState('processing');
        if (onAnswer) {
            onAnswer(finalAnswer);
        }
        accumulatedTranscriptRef.current = '';
        setTranscript('');
        setInterimText('');
        setState('idle');
    }, [onAnswer]);

    const start = useCallback(() => {
        if (!recognitionRef.current) return;
        setErrorMessage('');
        setInterruptDetected(false);
        accumulatedTranscriptRef.current = '';
        setTranscript('');
        setInterimText('');
        isListeningRef.current = true;
        try {
            recognitionRef.current.start();
        } catch (e) {
            console.warn('[useWebSpeech] Start error (already started?):', e);
        }
    }, []);

    const stop = useCallback(() => {
        isListeningRef.current = false;
        clearTimeout(silenceTimerRef.current);
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setState('idle');
    }, []);

    const speak = useCallback((text, { onStart, onEnd } = {}) => {
        return new Promise((resolve) => {
            if (!('speechSynthesis' in window)) {
                console.warn('Speech synthesis not supported');
                resolve();
                return;
            }

            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            
            // Try to find a good voice
            const voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
                const englishVoices = voices.filter(v => v.lang.startsWith('en'));
                const preferred = personaGender === 'male' 
                    ? englishVoices.find(v => v.name.includes('Male') || v.name.includes('David'))
                    : englishVoices.find(v => v.name.includes('Female') || v.name.includes('Zira') || v.name.includes('Samantha'));
                
                if (preferred) {
                    utterance.voice = preferred;
                } else if (englishVoices.length > 0) {
                    utterance.voice = englishVoices[0];
                }
            }

            utterance.onstart = () => {
                setInterruptDetected(false);
                if (onStart) onStart();
            };

            utterance.onend = () => {
                if (onEnd) onEnd();
                resolve();
            };

            utterance.onerror = (e) => {
                console.error('[useWebSpeech] TTS error:', e);
                if (onEnd) onEnd();
                resolve();
            };

            window.speechSynthesis.speak(utterance);
        });
    }, [personaGender]);

    const cleanup = useCallback(() => {
        stop();
        window.speechSynthesis.cancel();
    }, [stop]);

    return {
        state,
        transcript,
        interimText,
        errorMessage,
        interruptDetected,
        inputLevel,
        fillerStats,
        isSupported: isWebSpeechSupported(),
        start,
        stop,
        speak,
        cleanup
    };
}
