/**
 * HintSuggestion.jsx
 * Displays contextual hints when candidate appears stuck or needs guidance
 * 3 hint levels: gentle, medium, explicit
 */

import React, { useState, useEffect } from 'react';
import { useRealtimeFeedback } from './RealtimeFeedbackProvider';
import '../../styles/HintSuggestion.css';

export default function HintSuggestion() {
  const { hints, requestHint } = useRealtimeFeedback();
  const [visibleHints, setVisibleHints] = useState([]);
  const [dismissedHintIds, setDismissedHintIds] = useState(new Set());

  // Add new hints with auto-dismiss after duration
  useEffect(() => {
    if (hints.length > 0) {
      const latestHint = hints[hints.length - 1];

      // Only show if not already dismissed
      if (!dismissedHintIds.has(latestHint.id)) {
        setVisibleHints((prev) => [
          ...prev.filter((h) => h.id !== latestHint.id),
          latestHint,
        ]);

        // Auto-dismiss after 8 seconds (can be manually dismissed)
        const timer = setTimeout(() => {
          dismissHint(latestHint.id);
        }, 8000);

        return () => clearTimeout(timer);
      }
    }
  }, [hints, dismissedHintIds]);

  const dismissHint = (hintId) => {
    setVisibleHints((prev) => prev.filter((h) => h.id !== hintId));
    setDismissedHintIds((prev) => new Set([...prev, hintId]));
  };

  const getHintIcon = (category) => {
    switch (category) {
      case 'clarification':
        return '❓';
      case 'depth':
        return '🔍';
      case 'example':
        return '💡';
      case 'alternative-approach':
        return '🔄';
      default:
        return '💬';
    }
  };

  const getHintColor = (level) => {
    switch (level) {
      case 'gentle':
        return 'gentle';
      case 'medium':
        return 'medium';
      case 'explicit':
        return 'explicit';
      default:
        return 'gentle';
    }
  };

  const getHintLabel = (level) => {
    switch (level) {
      case 'gentle':
        return 'Gentle Hint';
      case 'medium':
        return 'Medium Hint';
      case 'explicit':
        return 'Direct Suggestion';
      default:
        return 'Hint';
    }
  };

  const handleRequestMoreHints = (category) => {
    requestHint({
      category,
      currentLevel: visibleHints[0]?.level || 'gentle',
      timestamp: new Date().toISOString(),
    });
  };

  // Only show up to 2 hints at a time
  const displayHints = visibleHints.slice(-2);

  return (
    <div className="hint-suggestion-container">
      {displayHints.map((hint) => (
        <div
          key={hint.id}
          className={`hint-card hint-${getHintColor(hint.level)}`}
        >
          <div className="hint-header">
            <div className="hint-title-section">
              <span className="hint-icon">
                {getHintIcon(hint.category)}
              </span>
              <span className="hint-label">
                {getHintLabel(hint.level)}
              </span>
            </div>
            <button
              className="hint-close"
              onClick={() => dismissHint(hint.id)}
              aria-label="Dismiss hint"
              title="Dismiss"
            >
              ✕
            </button>
          </div>

          <div className="hint-content">
            <p className="hint-message">{hint.message}</p>

            <div className="hint-metadata">
              <span className="hint-category">
                {hint.category.replace('-', ' ')}
              </span>
              <span className="hint-time">
                {formatTime(hint.timestamp)}
              </span>
            </div>
          </div>

          {/* Show request button for lower hint levels */}
          {hint.level !== 'explicit' && (
            <button
              className="hint-next-button"
              onClick={() => handleRequestMoreHints(hint.category)}
              aria-label={`Get a more explicit hint about ${hint.category}`}
            >
              Need more help? →
            </button>
          )}

          {/* Progress bar for auto-dismiss */}
          <div className="hint-progress-bar" />
        </div>
      ))}

      {/* Hint Count Indicator */}
      {visibleHints.length > 0 && (
        <div className="hint-indicator">
          <span className="hint-count">{visibleHints.length} active</span>
        </div>
      )}
    </div>
  );
}

/**
 * Format timestamp to relative time (e.g., "just now", "2s ago")
 */
function formatTime(timestamp) {
  if (!timestamp) return 'just now';

  const now = new Date();
  const then = new Date(timestamp);
  const diff = now - then;
  const seconds = Math.floor(diff / 1000);

  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}
