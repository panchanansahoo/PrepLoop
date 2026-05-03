import { useState, useEffect, useCallback, useRef } from 'react';
import { AI_INTERVIEW_SESSION_KEY, BOILERPLATE } from '../pages/aiInterviewConfig';

export function useInterviewRecovery({
    phase,
    conversation,
    questionIndex,
    currentQuestion,
    elapsed,
    totalQuestions,
    interviewType,
    interviewerGender,
    code,
    language,
    notes,
    setConversation,
    setQuestionIndex,
    setCurrentQuestion,
    setElapsed,
    setTotalQuestions,
    setInterviewType,
    setInterviewerGender,
    setCode,
    setLanguage,
    setNotes,
    setPhase
}) {
    const [savedSession, setSavedSession] = useState(null);

    // Check for saved session on mount
    useEffect(() => {
        try {
            const raw = window.localStorage.getItem(AI_INTERVIEW_SESSION_KEY);
            if (raw) {
                const session = JSON.parse(raw);
                // BUG #12 FIX: Check if session is marked as completed
                if (session.isCompleted) {
                    // Interview was already completed — don't offer recovery
                    window.localStorage.removeItem(AI_INTERVIEW_SESSION_KEY);
                    return;
                }
                // Only offer recovery if session is less than 2 hours old
                if (session.timestamp && Date.now() - session.timestamp < 2 * 60 * 60 * 1000) {
                    setSavedSession(session);
                } else {
                    window.localStorage.removeItem(AI_INTERVIEW_SESSION_KEY);
                }
            }
        } catch {
            // Corrupted data — clean up
            try { window.localStorage.removeItem(AI_INTERVIEW_SESSION_KEY); } catch {}
        }
    }, []);

    // Use a ref to hold latest state to avoid re-triggering the interval
    const stateRef = useRef({});
    const saveCurrentSession = useCallback(() => {
        const state = stateRef.current;
        if (!state.conversation || state.conversation.length === 0) return;

        try {
            const sessionData = {
                ...state,
                timestamp: Date.now(),
            };
            window.localStorage.setItem(AI_INTERVIEW_SESSION_KEY, JSON.stringify(sessionData));
        } catch {
            // Storage full or unavailable
        }
    }, []);

    useEffect(() => {
        stateRef.current = {
            conversation,
            questionIndex,
            currentQuestion,
            elapsed,
            totalQuestions,
            interviewType,
            interviewerGender,
            code,
            language,
            notes,
            isCompleted: phase === 'summary',
        };
    }, [conversation, questionIndex, currentQuestion, elapsed, totalQuestions, interviewType, interviewerGender, code, language, notes, phase]);

    // Interval-based auto-save
    useEffect(() => {
        if (phase !== 'interview') return;

        saveCurrentSession();
        const intervalId = setInterval(saveCurrentSession, 15000); // Save every 15 seconds

        return () => clearInterval(intervalId);
    }, [phase, saveCurrentSession]);

    const clearSavedSession = useCallback(() => {
        setSavedSession(null);
        try { window.localStorage.removeItem(AI_INTERVIEW_SESSION_KEY); } catch {}
    }, []);

    const restoreSession = useCallback((session) => {
        if (!session) return;
        setConversation(session.conversation || []);
        setQuestionIndex(session.questionIndex || 1);
        setCurrentQuestion(session.currentQuestion || '');
        setElapsed(session.elapsed || 0);
        setTotalQuestions(session.totalQuestions || 6);
        setInterviewType(session.interviewType || 'technical');
        setInterviewerGender(session.interviewerGender || 'male');
        setCode(session.code || BOILERPLATE?.python || '');
        setLanguage(session.language || 'python');
        setNotes(session.notes || '');
        setSavedSession(null);
        setPhase('interview');
    }, [setConversation, setQuestionIndex, setCurrentQuestion, setElapsed, setTotalQuestions, setInterviewType, setInterviewerGender, setCode, setLanguage, setNotes, setPhase]);

    return {
        savedSession,
        clearSavedSession,
        restoreSession
    };
}
