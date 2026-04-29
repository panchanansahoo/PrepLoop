import { useEffect, useRef, useState, useCallback } from 'react';
import { createLogger } from '../utils/logger';

const logger = createLogger('interview-ws');

/**
 * useInterviewWebSocket — Connects to the backend WebSocket for live
 * interview observability. Broadcasts typing events, transcript updates,
 * and interview state changes to any observers in the same room.
 *
 * @param {Object} options
 * @param {string|null} options.sessionId - Interview session/room ID
 * @param {string|null} options.token     - Supabase auth token
 * @param {boolean}     options.enabled   - Whether to connect
 */
export function useInterviewWebSocket({ sessionId, token, enabled = false }) {
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [roomUsers, setRoomUsers] = useState([]);
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT = 5;
  const RECONNECT_INTERVAL = 3000;

  // Build the WebSocket URL dynamically
  const getWsUrl = useCallback(() => {
    if (!token) return null;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws?token=${encodeURIComponent(token)}`;
  }, [token]);

  const connect = useCallback(() => {
    const url = getWsUrl();
    if (!url || !enabled || !sessionId) return;

    // Don't open duplicate connections
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        logger.info('Interview WS connected');
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;

        // Auto-join the interview room
        ws.send(JSON.stringify({
          type: 'join_room',
          payload: { roomId: sessionId },
        }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          switch (msg.type) {
            case 'user_joined':
              setRoomUsers(prev => {
                const userId = msg.payload?.userId;
                if (!userId || prev.includes(userId)) return prev;
                return [...prev, userId];
              });
              break;
            case 'user_left':
              setRoomUsers(prev => prev.filter(id => id !== msg.payload?.userId));
              break;
            // Other message types can be handled by consumers via onMessage
            default:
              break;
          }
        } catch {
          // Ignore unparseable messages
        }
      };

      ws.onclose = () => {
        logger.info('Interview WS disconnected');
        setIsConnected(false);
        wsRef.current = null;

        // Auto-reconnect
        if (enabled && reconnectAttemptsRef.current < MAX_RECONNECT) {
          reconnectAttemptsRef.current++;
          reconnectTimerRef.current = setTimeout(connect, RECONNECT_INTERVAL);
        }
      };

      ws.onerror = () => {
        logger.warn('Interview WS error');
      };

      wsRef.current = ws;
    } catch (err) {
      logger.error('WS connection failed', { error: err.message });
    }
  }, [getWsUrl, enabled, sessionId]);

  // Connect / disconnect based on enabled flag
  useEffect(() => {
    if (enabled && sessionId && token) {
      connect();
    }

    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setIsConnected(false);
      setRoomUsers([]);
    };
  }, [enabled, sessionId, token, connect]);

  /**
   * Broadcast a typing event (code editor changes) to observers.
   */
  const broadcastTyping = useCallback((isTyping) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN || !sessionId) return;
    wsRef.current.send(JSON.stringify({
      type: 'typing',
      payload: { roomId: sessionId, isTyping },
    }));
  }, [sessionId]);

  /**
   * Broadcast an interview state update (transcript, question change, etc.)
   */
  const broadcastUpdate = useCallback((payload) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN || !sessionId) return;
    wsRef.current.send(JSON.stringify({
      type: 'interview_update',
      payload: { sessionId, ...payload },
    }));
  }, [sessionId]);

  /**
   * Send a raw message to the WebSocket.
   */
  const send = useCallback((data) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return false;
    wsRef.current.send(JSON.stringify(data));
    return true;
  }, []);

  return {
    isConnected,
    roomUsers,
    broadcastTyping,
    broadcastUpdate,
    send,
  };
}
