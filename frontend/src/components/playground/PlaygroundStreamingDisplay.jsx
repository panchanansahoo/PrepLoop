/**
 * PlaygroundStreamingDisplay Component
 * Displays streaming AI responses with real-time updates and telemetry
 * 
 * Features:
 * - Real-time token streaming display
 * - Cache hit indicator
 * - Performance metrics (TTFB, tokens, elapsed time)
 * - Stop streaming button
 * - Error handling with retry
 */

import React, { useEffect, useState } from 'react';
import { usePlaygroundStream, useStreamingMetrics } from '../../hooks/usePlaygroundStream';

export function PlaygroundStreamingDisplay({
  mode = 'explain',
  language = 'javascript',
  code = '',
  onComplete = null,
  onError = null,
}) {
  const { stream, stop, isStreaming, response, error, stats, cacheHit, metadata } =
    usePlaygroundStream();
  const { metrics, updateMetrics, getPerformanceGain } = useStreamingMetrics();
  const [hasStarted, setHasStarted] = useState(false);

  /**
   * Start streaming response
   */
  const handleStream = async () => {
    setHasStarted(true);
    try {
      await stream('/api/ai/playground-assist-stream', mode, language, code);
    } catch (err) {
      if (onError) onError(err);
    }
  };

  /**
   * Update metrics when stats arrive
   */
  useEffect(() => {
    if (stats) {
      updateMetrics(stats);
      if (onComplete) onComplete({ response, stats });
    }
  }, [stats]);

  const performanceGain = getPerformanceGain();

  return (
    <div className="playground-streaming-display">
      {/* Control Bar */}
      <div className="streaming-controls">
        {!hasStarted ? (
          <button
            onClick={handleStream}
            disabled={!code}
            className="btn btn-primary"
            style={{
              backgroundColor: cacheHit ? '#4caf50' : '#2196F3',
            }}
          >
            {cacheHit ? '⚡ From Cache' : isStreaming ? '⏸ Stop' : '▶ Stream Response'}
          </button>
        ) : isStreaming ? (
          <div className="streaming-active">
            <span className="spinner"></span>
            <span>Streaming response...</span>
            <button onClick={stop} className="btn btn-small btn-danger">
              Stop
            </button>
          </div>
        ) : (
          <button onClick={handleStream} className="btn btn-default">
            Stream Again
          </button>
        )}
      </div>

      {/* Cache Hit Badge */}
      {cacheHit && (
        <div className="badge badge-success">
          ✓ Served from cache ({metadata?.cached_at})
        </div>
      )}

      {/* Metadata Display */}
      {metadata && !isStreaming && (
        <div className="streaming-metadata">
          <span className="badge badge-info">
            TTFB: {metadata.ttfb || '?'}ms
          </span>
          <span className="badge badge-info">
            Mode: {metadata.mode}
          </span>
        </div>
      )}

      {/* Response Display */}
      {(response || isStreaming) && (
        <div className="streaming-response">
          <div className="response-header">
            <h4>Response</h4>
            {isStreaming && <span className="spinner-small"></span>}
          </div>

          <div className="response-content">
            {response || <span className="placeholder">Waiting for response...</span>}
          </div>

          {/* Progress Indicator */}
          {isStreaming && (
            <div className="streaming-progress">
              <div className="progress-bar">
                <div className="animated-progress"></div>
              </div>
              <small>Streaming... {response.length} characters</small>
            </div>
          )}
        </div>
      )}

      {/* Stats Display */}
      {stats && !isStreaming && (
        <div className="streaming-stats">
          <div className="stat-row">
            <span className="stat-label">Total Time:</span>
            <span className="stat-value">{stats.elapsed_ms}ms</span>
          </div>

          <div className="stat-row">
            <span className="stat-label">Tokens Used:</span>
            <span className="stat-value">{stats.tokens_used}</span>
          </div>

          <div className="stat-row">
            <span className="stat-label">Source:</span>
            <span className="stat-value">
              {stats.source === 'cache' ? '📦 Cache' : '🚀 Groq API'}
            </span>
          </div>

          {performanceGain && (
            <div className="stat-row highlight">
              <span className="stat-label">Performance Gain:</span>
              <span className="stat-value">
                {performanceGain.improvement_percent}% faster
                {performanceGain.perceived_speedup && (
                  <span className="speedup">
                    ({performanceGain.perceived_speedup}x speedup)
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="alert alert-danger">
          <strong>Streaming Error:</strong> {error}
          <button
            onClick={handleStream}
            className="btn btn-small btn-link"
            style={{ marginTop: '8px', width: '100%' }}
          >
            Retry
          </button>
        </div>
      )}

      <style>{`
        .playground-streaming-display {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 16px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          background: #f9f9f9;
        }

        .streaming-controls {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-primary {
          background: #2196F3;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #1976D2;
        }

        .btn-danger {
          background: #f44336;
          color: white;
        }

        .btn-default {
          background: #f5f5f5;
          color: #333;
        }

        .btn-small {
          padding: 4px 12px;
          font-size: 12px;
        }

        .btn-link {
          background: none;
          color: #2196F3;
          text-decoration: underline;
        }

        .streaming-active {
          display: flex;
          gap: 12px;
          align-items: center;
          padding: 8px 12px;
          background: #e3f2fd;
          border-radius: 4px;
          font-size: 14px;
        }

        .spinner {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid #ccc;
          border-top-color: #2196F3;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        .spinner-small {
          display: inline-block;
          width: 12px;
          height: 12px;
          margin-left: 8px;
          border: 2px solid #ccc;
          border-top-color: #2196F3;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          margin-right: 8px;
          margin-bottom: 8px;
        }

        .badge-success {
          background: #c8e6c9;
          color: #2e7d32;
        }

        .badge-info {
          background: #bbdefb;
          color: #1565c0;
        }

        .streaming-metadata {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .streaming-response {
          border: 1px solid #ddd;
          border-radius: 6px;
          padding: 12px;
          background: white;
          max-height: 600px;
          overflow-y: auto;
        }

        .response-header {
          display: flex;
          gap: 8px;
          align-items: center;
          margin-bottom: 12px;
          font-weight: 600;
        }

        .response-header h4 {
          margin: 0;
          font-size: 14px;
        }

        .response-content {
          font-size: 14px;
          line-height: 1.5;
          color: #333;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .placeholder {
          color: #999;
          font-style: italic;
        }

        .streaming-progress {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #eee;
        }

        .progress-bar {
          height: 4px;
          background: #f0f0f0;
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 4px;
        }

        .animated-progress {
          height: 100%;
          background: linear-gradient(90deg, #2196F3, #00BCD4);
          animation: slide 1.5s infinite;
        }

        @keyframes slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .streaming-stats {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 12px;
          background: #f5f5f5;
          border-radius: 6px;
          font-size: 13px;
        }

        .stat-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .stat-row.highlight {
          background: #e8f5e9;
          padding: 8px;
          border-radius: 4px;
          color: #2e7d32;
          font-weight: 600;
        }

        .stat-label {
          color: #666;
          font-weight: 500;
        }

        .stat-value {
          color: #333;
          font-family: 'Courier New', monospace;
          font-weight: 600;
        }

        .speedup {
          font-size: 11px;
          margin-left: 4px;
          opacity: 0.8;
        }

        .alert {
          padding: 12px;
          border-radius: 4px;
          border-left: 4px solid;
        }

        .alert-danger {
          background: #ffebee;
          border-color: #f44336;
          color: #c62828;
        }

        .alert strong {
          display: block;
          margin-bottom: 8px;
        }
      `}</style>
    </div>
  );
}

export default PlaygroundStreamingDisplay;
