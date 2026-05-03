/**
 * RealtimeFeedbackProvider.jsx
 * Context provider for managing real-time feedback during interviews
 * Handles WebSocket connections and distributes feedback events
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const RealtimeFeedbackContext = createContext();

export function RealtimeFeedbackProvider({ children, sessionId, userId }) {
  const [feedback, setFeedback] = useState(null);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    clarity: 0,
    structure: 0,
    engagement: 0,
    confidence: 0,
    technicalDepth: 0,
    overall: 0,
  });
  const [hints, setHints] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const wsRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttemptsRef = useRef(5);

  // Connect to WebSocket
  useEffect(() => {
    if (!sessionId || !userId) return;

    const connectWebSocket = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('Real-time feedback WebSocket connected');
          reconnectAttemptsRef.current = 0;

          // Join session room
          ws.send(JSON.stringify({
            type: 'join',
            room: sessionId,
            userId,
          }));
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            handleFeedbackMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

        ws.onclose = () => {
          console.log('WebSocket disconnected');
          attemptReconnect();
        };

        wsRef.current = ws;
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        attemptReconnect();
      }
    };

    const attemptReconnect = () => {
      if (reconnectAttemptsRef.current < maxReconnectAttemptsRef.current) {
        reconnectAttemptsRef.current += 1;
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
        setTimeout(connectWebSocket, delay);
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [sessionId, userId]);

  // Handle incoming feedback messages
  const handleFeedbackMessage = useCallback((message) => {
    const { type, data } = message;

    switch (type) {
      case 'score-feedback':
        setFeedback({
          type: 'score',
          score: data.score,
          performanceLevel: data.performanceLevel,
          feedback: data.feedback,
          questionNumber: data.questionNumber,
          timestamp: data.timestamp,
        });
        break;

      case 'performance-update':
        setPerformanceMetrics(data.metrics);
        break;

      case 'hint-suggestion':
        setHints((prev) => [
          ...prev.slice(-4), // Keep last 5 hints
          {
            id: `hint-${Date.now()}`,
            level: data.hintLevel,
            message: data.message,
            category: data.category,
            timestamp: data.timestamp,
          },
        ]);
        break;

      case 'behavior-alert':
        setAlerts((prev) => [
          ...prev.slice(-4),
          {
            id: `alert-${Date.now()}`,
            type: data.type,
            severity: data.severity,
            message: data.message,
            suggestion: data.suggestion,
            timestamp: data.timestamp,
          },
        ]);
        break;

      case 'confidence-indicator':
        setPerformanceMetrics((prev) => ({
          ...prev,
          confidenceLevel: data.level,
          confidenceColor: data.color,
        }));
        break;

      default:
        console.log('Unknown feedback message type:', type);
    }
  }, []);

  // Emit score feedback to backend
  const broadcastScore = useCallback((scoreData) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'score-feedback',
        room: sessionId,
        data: scoreData,
      }));
    }
  }, [sessionId]);

  // Emit performance metrics
  const broadcastMetrics = useCallback((metrics) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'performance-update',
        room: sessionId,
        data: metrics,
      }));
    }
  }, [sessionId]);

  // Emit hint request
  const requestHint = useCallback((hintData) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'request-hint',
        room: sessionId,
        data: hintData,
      }));
    }
  }, [sessionId]);

  const value = {
    feedback,
    performanceMetrics,
    hints,
    alerts,
    broadcastScore,
    broadcastMetrics,
    requestHint,
  };

  return (
    <RealtimeFeedbackContext.Provider value={value}>
      {children}
    </RealtimeFeedbackContext.Provider>
  );
}

export function useRealtimeFeedback() {
  const context = useContext(RealtimeFeedbackContext);
  if (!context) {
    throw new Error('useRealtimeFeedback must be used within RealtimeFeedbackProvider');
  }
  return context;
}
