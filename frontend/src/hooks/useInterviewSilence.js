import { useState, useRef, useCallback } from 'react';

/**
 * useInterviewSilence — Encapsulates the 3-stage silence detection pipeline
 * that prompts the user, offers rephrasing, and auto-skips after extended silence.
 *
 * Extracted from AIInterviewPage.jsx to reduce complexity and improve testability.
 *
 * Stage 1: After 5s of silence → "Take your time"
 * Stage 2: After 10s total → "Would you like me to rephrase?"
 * Stage 3: After rephrase speech + 5s → Auto-skip
 *
 * @param {Object} options
 * @param {string}   options.phase - Current interview phase
 * @param {string}   options.interviewType - Current interview type (for context-aware prompts)
 * @param {Function} options.speakInterviewerText - TTS function
 * @param {Function} options.sendAnswerRef - Ref to sendAnswer (avoids stale closures)
 * @param {Object}   options.stateRefs - Ref to current transcript/userInput values
 * @param {Object}   options.isListeningRef - Ref to current isListening state
 * @param {Function} options.getSilencePrompt - Prompt generator for silence stage
 * @returns {Object} Silence handling state and controls
 */
export function useInterviewSilence({
    phase,
    interviewType,
    speakInterviewerText,
    sendAnswerRef,
    stateRefs,
    isListeningRef,
    getSilencePrompt: getSilencePromptFn,
} = {}) {
    const [silenceStage, setSilenceStage] = useState(0);
    const [interviewerStatus, setInterviewerStatus] = useState('');
    const silenceStageTimerRef = useRef(null);
    const activeQuestionNumberRef = useRef(0);

    const stopSilenceHandling = useCallback(() => {
        if (silenceStageTimerRef.current) clearTimeout(silenceStageTimerRef.current);
        setSilenceStage(0);
        setInterviewerStatus('');
    }, []);

    const startSilenceHandling = useCallback((questionIndex) => {
        stopSilenceHandling();
        if (phase !== 'interview') return;

        activeQuestionNumberRef.current = questionIndex;

        // Stage 1: After 5s of silence → "Take your time"
        silenceStageTimerRef.current = setTimeout(() => {
            if (!isListeningRef.current || stateRefs.current.transcript.trim()) return;
            setSilenceStage(1);
            if (getSilencePromptFn) {
                setInterviewerStatus(getSilencePromptFn(interviewType, 0));
            }

            // Stage 2: After 10s total → Ask to rephrase
            silenceStageTimerRef.current = setTimeout(() => {
                if (!isListeningRef.current || stateRefs.current.transcript.trim()) return;
                setSilenceStage(2);
                const rephraseText = "Would you like me to rephrase the question?";
                setInterviewerStatus(rephraseText);

                // Wait for rephrase speech to finish before starting auto-skip timer
                if (speakInterviewerText) {
                    speakInterviewerText(rephraseText).then(() => {
                        // Stage 3: After rephrase finishes + 5s silence → Auto-skip
                        silenceStageTimerRef.current = setTimeout(() => {
                            if (stateRefs.current.transcript.trim()) return;
                            // Ensure we're still on the same question
                            if (activeQuestionNumberRef.current !== questionIndex) return;
                            setSilenceStage(3);
                            setInterviewerStatus('');
                            if (sendAnswerRef.current) sendAnswerRef.current(true);
                        }, 5000);
                    });
                }
            }, 5000);
        }, 5000);
    }, [phase, speakInterviewerText, stopSilenceHandling, interviewType, getSilencePromptFn, isListeningRef, stateRefs, sendAnswerRef]);

    return {
        silenceStage,
        interviewerStatus,
        setInterviewerStatus,
        silenceStageTimerRef,
        activeQuestionNumberRef,
        startSilenceHandling,
        stopSilenceHandling,
    };
}
