import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInterviewWebSocket } from '../useInterviewWebSocket';

// Mock WebSocket
class MockWebSocket {
    static OPEN = 1;
    static CLOSED = 3;

    constructor(url) {
        this.url = url;
        this.readyState = MockWebSocket.OPEN;
        this.sent = [];
        this.onopen = null;
        this.onclose = null;
        this.onerror = null;
        this.onmessage = null;
        MockWebSocket.instances.push(this);
        // Simulate async open
        setTimeout(() => {
            if (this.onopen) this.onopen();
        }, 0);
    }

    send(data) {
        this.sent.push(JSON.parse(data));
    }

    close() {
        this.readyState = MockWebSocket.CLOSED;
        if (this.onclose) this.onclose();
    }
}
MockWebSocket.instances = [];

describe('useInterviewWebSocket', () => {
    const originalWebSocket = globalThis.WebSocket;

    beforeEach(() => {
        vi.useFakeTimers();
        MockWebSocket.instances = [];
        globalThis.WebSocket = MockWebSocket;
    });

    afterEach(() => {
        vi.useRealTimers();
        globalThis.WebSocket = originalWebSocket;
    });

    it('should initialise with disconnected state', () => {
        const { result } = renderHook(() =>
            useInterviewWebSocket({ sessionId: null, token: null, enabled: false })
        );

        expect(result.current.isConnected).toBe(false);
        expect(result.current.roomUsers).toEqual([]);
    });

    it('should not connect when disabled', () => {
        renderHook(() =>
            useInterviewWebSocket({ sessionId: 'room-1', token: 'tk', enabled: false })
        );

        expect(MockWebSocket.instances).toHaveLength(0);
    });

    it('should not connect when missing sessionId', () => {
        renderHook(() =>
            useInterviewWebSocket({ sessionId: null, token: 'tk', enabled: true })
        );

        expect(MockWebSocket.instances).toHaveLength(0);
    });

    it('should not connect when missing token', () => {
        renderHook(() =>
            useInterviewWebSocket({ sessionId: 'room-1', token: null, enabled: true })
        );

        expect(MockWebSocket.instances).toHaveLength(0);
    });

    it('should connect and join room when enabled with valid params', () => {
        const { result } = renderHook(() =>
            useInterviewWebSocket({ sessionId: 'room-1', token: 'tk', enabled: true })
        );

        // Simulate connection open
        act(() => vi.advanceTimersByTime(10));

        expect(MockWebSocket.instances).toHaveLength(1);
        expect(result.current.isConnected).toBe(true);
        expect(MockWebSocket.instances[0].sent[0]).toEqual({
            type: 'join_room',
            payload: { roomId: 'room-1' },
        });
    });

    it('should clean up WebSocket on unmount', () => {
        const { unmount } = renderHook(() =>
            useInterviewWebSocket({ sessionId: 'room-1', token: 'tk', enabled: true })
        );

        act(() => vi.advanceTimersByTime(10));
        expect(MockWebSocket.instances).toHaveLength(1);

        unmount();
        expect(MockWebSocket.instances[0].readyState).toBe(MockWebSocket.CLOSED);
    });

    it('broadcastTyping should send typing event', () => {
        const { result } = renderHook(() =>
            useInterviewWebSocket({ sessionId: 'room-1', token: 'tk', enabled: true })
        );

        act(() => vi.advanceTimersByTime(10));
        act(() => result.current.broadcastTyping(true));

        const ws = MockWebSocket.instances[0];
        const typingMsg = ws.sent.find(m => m.type === 'typing');
        expect(typingMsg).toEqual({
            type: 'typing',
            payload: { roomId: 'room-1', isTyping: true },
        });
    });

    it('broadcastUpdate should send interview_update event', () => {
        const { result } = renderHook(() =>
            useInterviewWebSocket({ sessionId: 'room-1', token: 'tk', enabled: true })
        );

        act(() => vi.advanceTimersByTime(10));
        act(() => result.current.broadcastUpdate({ event: 'question_change', data: { q: 2 } }));

        const ws = MockWebSocket.instances[0];
        const updateMsg = ws.sent.find(m => m.type === 'interview_update');
        expect(updateMsg).toEqual({
            type: 'interview_update',
            payload: { sessionId: 'room-1', event: 'question_change', data: { q: 2 } },
        });
    });

    it('send should return false when not connected', () => {
        const { result } = renderHook(() =>
            useInterviewWebSocket({ sessionId: null, token: null, enabled: false })
        );

        const sent = result.current.send({ type: 'test' });
        expect(sent).toBe(false);
    });

    it('should track room users from messages', () => {
        const { result } = renderHook(() =>
            useInterviewWebSocket({ sessionId: 'room-1', token: 'tk', enabled: true })
        );

        act(() => vi.advanceTimersByTime(10));

        const ws = MockWebSocket.instances[0];
        act(() => {
            ws.onmessage({ data: JSON.stringify({ type: 'user_joined', payload: { userId: 'user-A' } }) });
        });

        expect(result.current.roomUsers).toEqual(['user-A']);

        // Duplicate join should not add
        act(() => {
            ws.onmessage({ data: JSON.stringify({ type: 'user_joined', payload: { userId: 'user-A' } }) });
        });
        expect(result.current.roomUsers).toEqual(['user-A']);

        // User leave
        act(() => {
            ws.onmessage({ data: JSON.stringify({ type: 'user_left', payload: { userId: 'user-A' } }) });
        });
        expect(result.current.roomUsers).toEqual([]);
    });
});
