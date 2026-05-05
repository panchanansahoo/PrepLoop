/**
 * usePlaygroundStream Hook
 * Manages Server-Sent Events (SSE) connection for streaming AI responses
 * 
 * Usage:
 *   const { stream, isStreaming, response, error, stats } = usePlaygroundStream();
 *   await stream('/api/ai/playground-assist-stream', mode, language, code, context);
 */

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * SSE event types (must match backend)
 */
const SSE_EVENTS = {
  CHUNK: 'chunk',
  COMPLETE: 'complete',
  ERROR: 'error',
  CACHE_HIT: 'cache_hit',
  METADATA: 'metadata',
};

export function usePlaygroundStream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [response, setResponse] = useState('');
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [cacheHit, setCacheHit] = useState(false);
  const [metadata, setMetadata] = useState(null);

  const eventSourceRef = useRef(null);
  const responseAccumulatorRef = useRef('');

  /**
   * Close existing SSE connection
   */
  const closeStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  /**
   * Start streaming from endpoint
   * @param {string} endpoint - API endpoint (e.g., /api/ai/playground-assist-stream)
   * @param {string} mode - AI mode (explain, review, debug, etc)
   * @param {string} language - Programming language
   * @param {string} code - Code to analyze
   * @param {Object} context - Optional context (messages, question, etc)
   */
  const stream = useCallback(async (endpoint, mode, language, code, context = {}) => {
    try {
      // Reset state
      setIsStreaming(true);
      setError(null);
      setCacheHit(false);
      setResponse('');
      responseAccumulatorRef.current = '';
      setStats(null);
      setMetadata(null);

      // Close any existing connection
      closeStream();

      // Build query string
      const params = new URLSearchParams({
        mode,
        language,
        code,
      });

      // Add context if present
      if (context.question) {
        params.append('question', context.question);
      }
      if (context.messages) {
        params.append('messages', JSON.stringify(context.messages));
      }

      // Create EventSource for SSE
      const url = `${endpoint}?${params.toString()}`;
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      // Handle metadata event
      eventSource.addEventListener(SSE_EVENTS.METADATA, (event) => {
        const data = JSON.parse(event.data);
        setMetadata(data);
      });

      // Handle cache hit event
      eventSource.addEventListener(SSE_EVENTS.CACHE_HIT, (event) => {
        const data = JSON.parse(event.data);
        setCacheHit(true);
      });

      // Handle token chunks (main streaming data)
      eventSource.addEventListener(SSE_EVENTS.CHUNK, (event) => {
        const data = JSON.parse(event.data);
        responseAccumulatorRef.current += data.content;
        setResponse(responseAccumulatorRef.current);
      });

      // Handle completion
      eventSource.addEventListener(SSE_EVENTS.COMPLETE, (event) => {
        const data = JSON.parse(event.data);
        setStats(data);
        setIsStreaming(false);
        closeStream();
      });

      // Handle errors
      eventSource.addEventListener(SSE_EVENTS.ERROR, (event) => {
        const data = JSON.parse(event.data);
        setError(data.message || 'Streaming error');
        setIsStreaming(false);
        closeStream();
      });

      // Handle connection errors
      eventSource.onerror = (err) => {
        setError('Connection lost or server error');
        setIsStreaming(false);
        closeStream();
      };
    } catch (err) {
      setError(err.message || 'Failed to start stream');
      setIsStreaming(false);
      closeStream();
    }
  }, [closeStream]);

  /**
   * Stop streaming
   */
  const stop = useCallback(() => {
    closeStream();
    setIsStreaming(false);
  }, [closeStream]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      closeStream();
    };
  }, [closeStream]);

  return {
    stream,
    stop,
    isStreaming,
    response,
    error,
    stats,
    cacheHit,
    metadata,
  };
}

/**
 * Hook for displaying streaming response with real-time updates
 */
export function useStreamingDisplay() {
  const [displayText, setDisplayText] = useState('');
  const [displayedChars, setDisplayedChars] = useState(0);

  /**
   * Update display with new content
   * Adds visual feedback for streaming progress
   */
  const updateDisplay = useCallback((content) => {
    setDisplayText(content);
    setDisplayedChars(content.length);
  }, []);

  /**
   * Reset display
   */
  const reset = useCallback(() => {
    setDisplayText('');
    setDisplayedChars(0);
  }, []);

  /**
   * Get display stats
   */
  const getStats = useCallback(() => {
    return {
      total_chars: displayedChars,
      completion_percent: displayedChars > 0 ? Math.round((displayedChars / 10000) * 100) : 0,
    };
  }, [displayedChars]);

  return {
    displayText,
    displayedChars,
    updateDisplay,
    reset,
    getStats,
  };
}

/**
 * Hook for managing streaming latency metrics
 */
export function useStreamingMetrics() {
  const [metrics, setMetrics] = useState({
    ttfb: null,        // Time to first byte
    total_time: null,  // Total time to completion
    tokens: null,      // Tokens used
    mode: null,        // AI mode used
  });

  /**
   * Update metrics from SSE stats event
   */
  const updateMetrics = useCallback((stats) => {
    setMetrics({
      ttfb: stats.ttfb || null,
      total_time: stats.elapsed_ms || null,
      tokens: stats.tokens_used || null,
      mode: stats.mode || null,
    });
  }, []);

  /**
   * Calculate performance gain vs non-streaming
   * Non-streaming typically 2-5s for full response
   * Streaming should be 3-5x faster perceived
   */
  const getPerformanceGain = useCallback(() => {
    if (!metrics.total_time) return null;

    const estimatedNonStreaming = 3000; // 3 seconds typical
    const gain = ((estimatedNonStreaming - metrics.total_time) / estimatedNonStreaming) * 100;

    return {
      streaming_time_ms: metrics.total_time,
      estimated_non_streaming_ms: estimatedNonStreaming,
      improvement_percent: Math.round(Math.max(0, gain)),
      perceived_speedup: metrics.ttfb ? (estimatedNonStreaming / metrics.ttfb).toFixed(1) : null,
    };
  }, [metrics]);

  /**
   * Reset metrics
   */
  const reset = useCallback(() => {
    setMetrics({
      ttfb: null,
      total_time: null,
      tokens: null,
      mode: null,
    });
  }, []);

  return {
    metrics,
    updateMetrics,
    getPerformanceGain,
    reset,
  };
}
