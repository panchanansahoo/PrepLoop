/**
 * BehaviorAlert.jsx
 * Real-time behavior detection alerts
 * Types: hedge-words, speaking-fast, long-pause, low-confidence
 * Only shows medium/high severity to avoid overload
 */

import React, { useState, useEffect } from 'react';
import { useRealtimeFeedback } from './RealtimeFeedbackProvider';
import '../styles/BehaviorAlert.css';

export default function BehaviorAlert() {
  const { alerts } = useRealtimeFeedback();
  const [visibleAlerts, setVisibleAlerts] = useState([]);
  const [dismissedAlertIds, setDismissedAlertIds] = useState(new Set());

  // Filter and display only medium/high severity alerts
  useEffect(() => {
    if (alerts.length > 0) {
      const latestAlert = alerts[alerts.length - 1];

      // Only show medium or high severity
      if (
        !dismissedAlertIds.has(latestAlert.id) &&
        (latestAlert.severity === 'medium' || latestAlert.severity === 'high')
      ) {
        setVisibleAlerts((prev) => [
          ...prev.filter((a) => a.id !== latestAlert.id),
          latestAlert,
        ]);

        // Auto-dismiss after 6 seconds for medium, 8 seconds for high
        const duration = latestAlert.severity === 'high' ? 8000 : 6000;
        const timer = setTimeout(() => {
          dismissAlert(latestAlert.id);
        }, duration);

        return () => clearTimeout(timer);
      }
    }
  }, [alerts, dismissedAlertIds]);

  const dismissAlert = (alertId) => {
    setVisibleAlerts((prev) => prev.filter((a) => a.id !== alertId));
    setDismissedAlertIds((prev) => new Set([...prev, alertId]));
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'hedge-words':
        return '💭';
      case 'speaking-fast':
        return '⚡';
      case 'long-pause':
        return '⏸️';
      case 'low-confidence':
        return '😟';
      case 'repetition':
        return '🔄';
      case 'rambling':
        return '🌊';
      default:
        return '⚠️';
    }
  };

  const getAlertTitle = (type) => {
    switch (type) {
      case 'hedge-words':
        return 'Using filler words';
      case 'speaking-fast':
        return 'Speaking too fast';
      case 'long-pause':
        return 'Long pause detected';
      case 'low-confidence':
        return 'Confidence drop';
      case 'repetition':
        return 'Repetitive content';
      case 'rambling':
        return 'Going off track';
      default:
        return 'Behavior detected';
    }
  };

  const getAlertColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'high';
      case 'medium':
        return 'medium';
      case 'low':
        return 'low';
      default:
        return 'medium';
    }
  };

  // Only show up to 2 alerts at a time
  const displayAlerts = visibleAlerts.slice(-2);

  if (displayAlerts.length === 0) {
    return null;
  }

  return (
    <div className="behavior-alert-container">
      {displayAlerts.map((alert) => (
        <div
          key={alert.id}
          className={`alert-card alert-${getAlertColor(alert.severity)}`}
          role="alert"
          aria-live="assertive"
        >
          <div className="alert-header">
            <div className="alert-title-section">
              <span className="alert-icon">
                {getAlertIcon(alert.type)}
              </span>
              <span className="alert-title">
                {getAlertTitle(alert.type)}
              </span>
              <span className={`alert-severity alert-severity-${alert.severity}`}>
                {alert.severity.toUpperCase()}
              </span>
            </div>
            <button
              className="alert-close"
              onClick={() => dismissAlert(alert.id)}
              aria-label="Dismiss alert"
              title="Dismiss"
            >
              ✕
            </button>
          </div>

          {alert.message && (
            <p className="alert-message">{alert.message}</p>
          )}

          {alert.suggestion && (
            <div className="alert-suggestion">
              <strong>💡 Suggestion:</strong> {alert.suggestion}
            </div>
          )}

          {/* Progress bar for auto-dismiss */}
          <div
            className="alert-progress-bar"
            style={{
              animationDuration: alert.severity === 'high' ? '8s' : '6s',
            }}
          />
        </div>
      ))}

      {/* Alert Count Indicator */}
      {visibleAlerts.length > 0 && (
        <div className="alert-indicator">
          <span className="alert-count">{visibleAlerts.length} alert(s)</span>
        </div>
      )}
    </div>
  );
}
