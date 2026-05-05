import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * useInterviewTimer — Encapsulates global elapsed timer, per-question timer,
 * and pause/resume mechanics for the AI interview session.
 *
 * Extracted from AIInterviewPage.jsx to reduce its size and improve testability.
 *
 * @param {Object} options
 * @param {string}  options.phase - Current interview phase ('lobby' | 'connecting' | 'interview' | 'summary')
 * @param {boolean} options.isPausedExternal - Optional external pause override
 * @returns {Object} Timer state and control functions
 */
export function useInterviewTimer({ phase } = {}) {
    // ── Global elapsed timer ──
    const [elapsed, setElapsed] = useState(0);
    const timerRef = useRef(null);

    // ── Per-question elapsed timer ──
    const [questionElapsed, setQuestionElapsed] = useState(0);
    const questionTimerRef = useRef(null);

    // ── Pause / Resume ──
    const [isPaused, setIsPaused] = useState(false);
    const [totalPauseTime, setTotalPauseTime] = useState(0);
    const pauseStartRef = useRef(null);

    // Start the global timer when interview phase begins
    useEffect(() => {
        if (phase === 'interview' && !isPaused) {
            timerRef.current = setInterval(() => {
                setElapsed(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [phase, isPaused]);

    // Start the per-question timer when interview phase begins
    useEffect(() => {
        if (phase === 'interview' && !isPaused) {
            questionTimerRef.current = setInterval(() => {
                setQuestionElapsed(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(questionTimerRef.current);
        }
        return () => clearInterval(questionTimerRef.current);
    }, [phase, isPaused]);

    /**
     * Reset the per-question timer back to 0.
     * Called when the interview advances to the next question.
     */
    const resetQuestionTimer = useCallback(() => {
        setQuestionElapsed(0);
    }, []);

    /**
     * Pause the interview timers.
     * Records the pause start time for accurate total-pause-time tracking.
     */
    const pause = useCallback(() => {
        if (!isPaused) {
            pauseStartRef.current = Date.now();
            setIsPaused(true);
        }
    }, [isPaused]);

    /**
     * Resume the interview timers.
     * Accumulates total pause duration for analytics.
     */
    const resume = useCallback(() => {
        if (isPaused) {
            if (pauseStartRef.current) {
                setTotalPauseTime(prev => prev + (Date.now() - pauseStartRef.current));
                pauseStartRef.current = null;
            }
            setIsPaused(false);
        }
    }, [isPaused]);

    /**
     * Toggle between paused and resumed states.
     */
    const togglePause = useCallback(() => {
        if (isPaused) {
            resume();
        } else {
            pause();
        }
    }, [isPaused, pause, resume]);

    /**
     * Stop all timers. Called when the interview ends.
     */
    const stopAll = useCallback(() => {
        clearInterval(timerRef.current);
        clearInterval(questionTimerRef.current);
    }, []);

    /**
     * Reset all timer state. Called when starting a new interview.
     */
    const resetAll = useCallback(() => {
        stopAll();
        setElapsed(0);
        setQuestionElapsed(0);
        setIsPaused(false);
        setTotalPauseTime(0);
        pauseStartRef.current = null;
    }, [stopAll]);

    return {
        // State
        elapsed,
        questionElapsed,
        isPaused,
        totalPauseTime,

        // Setters (for session recovery)
        setElapsed,

        // Refs (for direct access in endInterview cleanup)
        timerRef,
        questionTimerRef,
        pauseStartRef,

        // Controls
        resetQuestionTimer,
        pause,
        resume,
        togglePause,
        stopAll,
        resetAll,
    };
}
