import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInterviewSilence } from '../useInterviewSilence';

describe('useInterviewSilence', () => {
    let sendAnswerRef;
    let isListeningRef;
    let stateRefs;
    let speakInterviewerText;
    let getSilencePrompt;

    beforeEach(() => {
        vi.useFakeTimers();
        sendAnswerRef = { current: vi.fn() };
        isListeningRef = { current: true };
        stateRefs = { current: { transcript: '', userInput: '' } };
        speakInterviewerText = vi.fn().mockResolvedValue(undefined);
        getSilencePrompt = vi.fn((type, idx) => `Take your time (${type})`);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    const defaultProps = () => ({
        phase: 'interview',
        interviewType: 'technical',
        speakInterviewerText,
        sendAnswerRef,
        stateRefs,
        isListeningRef,
        getSilencePrompt,
    });

    it('should initialise with stage 0 and empty status', () => {
        const { result } = renderHook(() => useInterviewSilence(defaultProps()));
        expect(result.current.silenceStage).toBe(0);
        expect(result.current.interviewerStatus).toBe('');
    });

    it('should not start silence handling when phase is not interview', () => {
        const props = { ...defaultProps(), phase: 'lobby' };
        const { result } = renderHook(() => useInterviewSilence(props));

        act(() => result.current.startSilenceHandling(0));
        act(() => vi.advanceTimersByTime(6000));

        expect(result.current.silenceStage).toBe(0);
    });

    it('should progress to stage 1 after 5s of silence', () => {
        const { result } = renderHook(() => useInterviewSilence(defaultProps()));

        act(() => result.current.startSilenceHandling(0));
        act(() => vi.advanceTimersByTime(5000));

        expect(result.current.silenceStage).toBe(1);
        expect(getSilencePrompt).toHaveBeenCalledWith('technical', 0);
        expect(result.current.interviewerStatus).toBe('Take your time (technical)');
    });

    it('should NOT progress to stage 1 if transcript has content', () => {
        stateRefs.current.transcript = 'I think the answer is...';
        const { result } = renderHook(() => useInterviewSilence(defaultProps()));

        act(() => result.current.startSilenceHandling(0));
        act(() => vi.advanceTimersByTime(6000));

        expect(result.current.silenceStage).toBe(0);
    });

    it('should NOT progress to stage 1 if not listening', () => {
        isListeningRef.current = false;
        const { result } = renderHook(() => useInterviewSilence(defaultProps()));

        act(() => result.current.startSilenceHandling(0));
        act(() => vi.advanceTimersByTime(6000));

        expect(result.current.silenceStage).toBe(0);
    });

    it('should progress to stage 2 after 10s total (rephrase offer)', async () => {
        const { result } = renderHook(() => useInterviewSilence(defaultProps()));

        act(() => result.current.startSilenceHandling(0));
        act(() => vi.advanceTimersByTime(5000));  // stage 1
        act(() => vi.advanceTimersByTime(5000));  // stage 2

        expect(result.current.silenceStage).toBe(2);
        expect(result.current.interviewerStatus).toBe('Would you like me to rephrase the question?');
        expect(speakInterviewerText).toHaveBeenCalledWith('Would you like me to rephrase the question?');
    });

    it('should auto-skip (stage 3) after rephrase speech + 5s', async () => {
        const { result } = renderHook(() => useInterviewSilence(defaultProps()));

        act(() => result.current.startSilenceHandling(0));
        act(() => vi.advanceTimersByTime(10000));  // stage 1 + 2

        // Let the speak promise resolve
        await act(async () => {
            await Promise.resolve();
        });

        act(() => vi.advanceTimersByTime(5000));  // stage 3

        expect(result.current.silenceStage).toBe(3);
        expect(sendAnswerRef.current).toHaveBeenCalledWith(true);
    });

    it('should NOT auto-skip if transcript was provided before stage 3', async () => {
        const { result } = renderHook(() => useInterviewSilence(defaultProps()));

        act(() => result.current.startSilenceHandling(0));
        act(() => vi.advanceTimersByTime(10000));

        await act(async () => {
            await Promise.resolve();
        });

        // User starts talking before the 5s auto-skip
        stateRefs.current.transcript = 'Actually, let me think...';
        act(() => vi.advanceTimersByTime(5000));

        expect(sendAnswerRef.current).not.toHaveBeenCalled();
    });

    it('should NOT auto-skip if question changed (stale timer guard)', async () => {
        const { result } = renderHook(() => useInterviewSilence(defaultProps()));

        act(() => result.current.startSilenceHandling(0));
        act(() => vi.advanceTimersByTime(10000));

        await act(async () => {
            await Promise.resolve();
        });

        // Simulate question change — activeQuestionNumberRef gets updated
        result.current.activeQuestionNumberRef.current = 1;
        act(() => vi.advanceTimersByTime(5000));

        expect(sendAnswerRef.current).not.toHaveBeenCalled();
    });

    it('should reset everything on stopSilenceHandling', () => {
        const { result } = renderHook(() => useInterviewSilence(defaultProps()));

        act(() => result.current.startSilenceHandling(0));
        act(() => vi.advanceTimersByTime(5000));  // get to stage 1
        expect(result.current.silenceStage).toBe(1);

        act(() => result.current.stopSilenceHandling());
        expect(result.current.silenceStage).toBe(0);
        expect(result.current.interviewerStatus).toBe('');
    });

    it('should clear prior timers when startSilenceHandling is called again', () => {
        const { result } = renderHook(() => useInterviewSilence(defaultProps()));

        act(() => result.current.startSilenceHandling(0));
        act(() => vi.advanceTimersByTime(3000));  // halfway to stage 1

        // Restart — should cancel old timer and start fresh
        act(() => result.current.startSilenceHandling(1));
        act(() => vi.advanceTimersByTime(3000));  // only 3s into new timer, not 6s total
        expect(result.current.silenceStage).toBe(0);

        act(() => vi.advanceTimersByTime(2000));  // 5s into new timer
        expect(result.current.silenceStage).toBe(1);
    });
});
