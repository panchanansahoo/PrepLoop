import { useEffect, useRef, useState, useCallback } from 'react';
import { createLogger } from '../utils/logger';

const logger = createLogger('websocket');

export const useWebSocket = (url, options = {}) => {
  const {
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    reconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const wsRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        logger.info('WebSocket connected');
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
        onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
          onMessage?.(data);
        } catch (err) {
          logger.error('Failed to parse message', { error: err.message });
        }
      };

      ws.onclose = () => {
        logger.info('WebSocket disconnected');
        setIsConnected(false);
        wsRef.current = null;
        onDisconnect?.();

        if (reconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          logger.info('Reconnecting...', { attempt: reconnectAttemptsRef.current });
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      ws.onerror = (error) => {
        logger.error('WebSocket error', { error });
        onError?.(error);
      };

      wsRef.current = ws;
    } catch (err) {
      logger.error('WebSocket connection failed', { error: err.message });
      onError?.(err);
    }
  }, [url, onMessage, onConnect, onDisconnect, onError, reconnect, reconnectInterval, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
  }, []);

  const send = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
      return true;
    }
    logger.warn('Cannot send message, WebSocket not connected');
    return false;
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    isConnected,
    lastMessage,
    send,
    disconnect,
    reconnect: connect
  };
};

export const useWebSocketRoom = (url, roomId, token) => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState(new Set());

  const handleMessage = useCallback((data) => {
    switch (data.type) {
      case 'room_message':
        setMessages(prev => [...prev, data.payload]);
        break;
      
      case 'user_joined':
        setUsers(prev => new Set([...prev, data.payload.userId]));
        break;
      
      case 'user_left':
        setUsers(prev => {
          const next = new Set(prev);
          next.delete(data.payload.userId);
          return next;
        });
        break;
    }
  }, []);

  const wsUrl = `${url}?token=${token}`;
  const { isConnected, send } = useWebSocket(wsUrl, {
    onMessage: handleMessage,
    onConnect: () => {
      send({ type: 'join_room', payload: { roomId } });
    }
  });

  const sendMessage = useCallback((message) => {
    return send({
      type: 'room_message',
      payload: { roomId, message }
    });
  }, [send, roomId]);

  const sendTyping = useCallback((isTyping) => {
    return send({
      type: 'typing',
      payload: { roomId, isTyping }
    });
  }, [send, roomId]);

  return {
    isConnected,
    messages,
    users: Array.from(users),
    sendMessage,
    sendTyping
  };
};
