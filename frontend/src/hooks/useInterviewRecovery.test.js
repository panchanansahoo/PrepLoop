import { renderHook, act } from '@testing-library/react';
import { useInterviewRecovery } from './useInterviewRecovery';
import { AI_INTERVIEW_SESSION_KEY, BOILERPLATE } from '../pages/aiInterviewConfig';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';

describe('useInterviewRecovery', () => {
    let mockSetters;

    beforeEach(() => {
        window.localStorage.clear();
        mockSetters = {
            setConversation: vi.fn(),
            setQuestionIndex: vi.fn(),
            setCurrentQuestion: vi.fn(),
            setElapsed: vi.fn(),
            setTotalQuestions: vi.fn(),
            setInterviewType: vi.fn(),
            setInterviewerGender: vi.fn(),
            setCode: vi.fn(),
            setLanguage: vi.fn(),
            setNotes: vi.fn(),
            setPhase: vi.fn(),
        };
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    test('should not load old sessions (> 2 hours)', () => {
        const oldSession = {
            timestamp: Date.now() - (3 * 60 * 60 * 1000), // 3 hours old
            conversation: [{ role: 'system', content: 'test' }]
        };
        window.localStorage.setItem(AI_INTERVIEW_SESSION_KEY, JSON.stringify(oldSession));

        const { result } = renderHook(() => useInterviewRecovery({ ...mockSetters, phase: 'lobby' }));

        expect(result.current.savedSession).toBeNull();
        expect(window.localStorage.getItem(AI_INTERVIEW_SESSION_KEY)).toBeNull();
    });

    test('should load valid recent session', () => {
        const recentSession = {
            timestamp: Date.now() - (1000 * 60 * 30), // 30 minutes old
            conversation: [{ role: 'system', content: 'test' }],
            questionIndex: 2
        };
        window.localStorage.setItem(AI_INTERVIEW_SESSION_KEY, JSON.stringify(recentSession));

        const { result } = renderHook(() => useInterviewRecovery({ ...mockSetters, phase: 'lobby' }));

        expect(result.current.savedSession).toEqual(recentSession);
    });

    test('should auto-save session when in interview phase with conversation', () => {
        const { rerender } = renderHook(
            (props) => useInterviewRecovery({ ...mockSetters, ...props }),
            { initialProps: { phase: 'lobby', conversation: [] } }
        );

        // Transition to interview phase with new conversation
        rerender({
            phase: 'interview',
            conversation: [{ role: 'assistant', content: 'hello' }],
            questionIndex: 1,
            currentQuestion: 'Tell me about yourself',
            elapsed: 10,
            totalQuestions: 5,
            interviewType: 'behavioral',
            interviewerGender: 'female',
            code: '',
            language: 'python',
            notes: 'Test note'
        });

        const savedData = JSON.parse(window.localStorage.getItem(AI_INTERVIEW_SESSION_KEY));
        expect(savedData).toBeTruthy();
        expect(savedData.phase).toBeUndefined(); // internal props shouldn't be saved
        expect(savedData.conversation).toHaveLength(1);
        expect(savedData.notes).toBe('Test note');
        expect(savedData.timestamp).toBeGreaterThan(Date.now() - 1000);
    });

    test('clearSavedSession should remove session from state and localStorage', () => {
        window.localStorage.setItem(AI_INTERVIEW_SESSION_KEY, JSON.stringify({ timestamp: Date.now() }));
        const { result } = renderHook(() => useInterviewRecovery({ ...mockSetters, phase: 'lobby' }));

        act(() => {
            result.current.clearSavedSession();
        });

        expect(result.current.savedSession).toBeNull();
        expect(window.localStorage.getItem(AI_INTERVIEW_SESSION_KEY)).toBeNull();
    });

    test('restoreSession should call all setters with session values', () => {
        const session = {
            conversation: [{ role: 'assistant', text: 'hi' }],
            questionIndex: 3,
            currentQuestion: 'Q3',
            elapsed: 120,
            totalQuestions: 6,
            interviewType: 'technical',
            interviewerGender: 'male',
            code: 'print("hi")',
            language: 'python',
            notes: 'notes'
        };

        const { result } = renderHook(() => useInterviewRecovery({ ...mockSetters, phase: 'lobby' }));

        act(() => {
            result.current.restoreSession(session);
        });

        expect(mockSetters.setConversation).toHaveBeenCalledWith(session.conversation);
        expect(mockSetters.setQuestionIndex).toHaveBeenCalledWith(3);
        expect(mockSetters.setCurrentQuestion).toHaveBeenCalledWith('Q3');
        expect(mockSetters.setElapsed).toHaveBeenCalledWith(120);
        expect(mockSetters.setPhase).toHaveBeenCalledWith('interview');
    });

    test('restoreSession should use fallback defaults when session properties are missing', () => {
        const emptySession = {};

        const { result } = renderHook(() => useInterviewRecovery({ ...mockSetters, phase: 'lobby' }));

        act(() => {
            result.current.restoreSession(emptySession);
        });

        expect(mockSetters.setConversation).toHaveBeenCalledWith([]);
        expect(mockSetters.setQuestionIndex).toHaveBeenCalledWith(1);
        expect(mockSetters.setInterviewType).toHaveBeenCalledWith('technical');
        expect(mockSetters.setCode).toHaveBeenCalledWith(BOILERPLATE.python);
    });
});
