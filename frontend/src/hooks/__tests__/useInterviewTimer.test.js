import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInterviewTimer } from '../useInterviewTimer';

describe('useInterviewTimer', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it('should initialise with zeroed state', () => {
        const { result } = renderHook(() => useInterviewTimer({ phase: 'lobby' }));
        expect(result.current.elapsed).toBe(0);
        expect(result.current.questionElapsed).toBe(0);
        expect(result.current.isPaused).toBe(false);
        expect(result.current.totalPauseTime).toBe(0);
    });

    it('should not tick when phase is lobby', () => {
        const { result } = renderHook(() => useInterviewTimer({ phase: 'lobby' }));
        act(() => vi.advanceTimersByTime(3000));
        expect(result.current.elapsed).toBe(0);
    });

    it('should tick elapsed when phase is interview', () => {
        const { result } = renderHook(() => useInterviewTimer({ phase: 'interview' }));
        act(() => vi.advanceTimersByTime(5000));
        expect(result.current.elapsed).toBe(5);
        expect(result.current.questionElapsed).toBe(5);
    });

    it('should stop ticking when paused', () => {
        const { result } = renderHook(() => useInterviewTimer({ phase: 'interview' }));
        act(() => vi.advanceTimersByTime(3000));
        expect(result.current.elapsed).toBe(3);

        act(() => result.current.pause());
        act(() => vi.advanceTimersByTime(5000));
        expect(result.current.elapsed).toBe(3); // should not advance
    });

    it('should resume ticking after resume()', () => {
        const { result } = renderHook(() => useInterviewTimer({ phase: 'interview' }));
        act(() => vi.advanceTimersByTime(2000));

        act(() => result.current.pause());
        act(() => vi.advanceTimersByTime(3000));

        act(() => result.current.resume());
        act(() => vi.advanceTimersByTime(2000));
        // Should be 2 (before pause) + 2 (after resume) = 4
        expect(result.current.elapsed).toBe(4);
    });

    it('should toggle pause correctly', () => {
        const { result } = renderHook(() => useInterviewTimer({ phase: 'interview' }));
        expect(result.current.isPaused).toBe(false);

        act(() => result.current.togglePause());
        expect(result.current.isPaused).toBe(true);

        act(() => result.current.togglePause());
        expect(result.current.isPaused).toBe(false);
    });

    it('should reset question timer independently', () => {
        const { result } = renderHook(() => useInterviewTimer({ phase: 'interview' }));
        act(() => vi.advanceTimersByTime(4000));
        expect(result.current.questionElapsed).toBe(4);
        expect(result.current.elapsed).toBe(4);

        act(() => result.current.resetQuestionTimer());
        expect(result.current.questionElapsed).toBe(0);
        expect(result.current.elapsed).toBe(4); // global stays
    });

    it('should reset everything with resetAll()', () => {
        const { result } = renderHook(() => useInterviewTimer({ phase: 'interview' }));
        act(() => vi.advanceTimersByTime(5000));
        act(() => result.current.pause());

        act(() => result.current.resetAll());
        expect(result.current.elapsed).toBe(0);
        expect(result.current.questionElapsed).toBe(0);
        expect(result.current.isPaused).toBe(false);
        expect(result.current.totalPauseTime).toBe(0);
    });

    it('should track total pause time as a positive value after resume', () => {
        const { result } = renderHook(() => useInterviewTimer({ phase: 'interview' }));
        act(() => vi.advanceTimersByTime(2000));

        act(() => result.current.pause());
        act(() => vi.advanceTimersByTime(3000));

        act(() => result.current.resume());
        // Should have recorded some positive pause duration
        expect(result.current.totalPauseTime).toBeGreaterThan(0);
    });

    it('should stop all intervals with stopAll()', () => {
        const { result } = renderHook(() => useInterviewTimer({ phase: 'interview' }));
        act(() => vi.advanceTimersByTime(3000));
        expect(result.current.elapsed).toBe(3);

        act(() => result.current.stopAll());
        act(() => vi.advanceTimersByTime(5000));
        expect(result.current.elapsed).toBe(3); // frozen
    });
});
