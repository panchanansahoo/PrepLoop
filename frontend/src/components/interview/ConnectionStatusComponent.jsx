import React from 'react';
import './ConnectionStatusComponent.css';

/**
 * ConnectionStatusComponent
 * Displays connection status and auto-reconnect countdown
 */
export default function ConnectionStatusComponent({ 
  connectionLost,
  autoReconnectCountdown,
  onRetry,
  retryCount,
  maxRetries = 5
}) {
  if (!connectionLost) {
    return null;
  }

  const isMaxRetriesExceeded = retryCount >= maxRetries;
  const showCountdown = autoReconnectCountdown > 0 && !isMaxRetriesExceeded;

  return (
    <div className="connection-status-banner">
      <div className="connection-status-content">
        <div className="status-icon">
          <span className="icon-warning">⚠️</span>
        </div>

        <div className="status-message">
          <h3 className="status-title">Connection Lost</h3>
          <p className="status-description">
            {isMaxRetriesExceeded
              ? 'Unable to reconnect. Please check your internet connection and try again.'
              : 'Attempting to reconnect to the server...'}
          </p>
        </div>

        <div className="status-actions">
          {showCountdown && (
            <div className="countdown-badge">
              Reconnect in {autoReconnectCountdown}s
            </div>
          )}

          {isMaxRetriesExceeded && (
            <button
              className="retry-btn"
              onClick={onRetry}
              data-testid="retry-connection-btn"
            >
              Retry Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
