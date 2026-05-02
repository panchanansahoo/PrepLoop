import React from 'react';
import { AlertCircle, RefreshCw, WifiOff } from 'lucide-react';

/**
 * FetchError — A reusable inline error state for failed data fetches.
 *
 * Features:
 *   ✅ Clean, themed error message
 *   ✅ One-click retry button
 *   ✅ Network-aware icon (offline vs generic error)
 *   ✅ Optional compact mode for smaller containers
 *
 * Usage:
 *   <FetchError
 *     message="Failed to load interview data"
 *     onRetry={() => fetchData()}
 *   />
 */
export default function FetchError({
  message = 'Something went wrong',
  onRetry,
  compact = false,
  className = '',
}) {
  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
  const Icon = isOffline ? WifiOff : AlertCircle;
  const displayMessage = isOffline
    ? 'You appear to be offline. Check your connection and try again.'
    : message;

  if (compact) {
    return (
      <div className={`fetch-error fetch-error--compact ${className}`}>
        <Icon size={14} />
        <span>{displayMessage}</span>
        {onRetry && (
          <button className="fetch-error__retry fetch-error__retry--compact" onClick={onRetry}>
            <RefreshCw size={12} /> Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`fetch-error ${className}`}>
      <div className="fetch-error__icon-ring">
        <Icon size={28} />
      </div>
      <h3 className="fetch-error__title">
        {isOffline ? 'No connection' : 'Failed to load'}
      </h3>
      <p className="fetch-error__message">{displayMessage}</p>
      {onRetry && (
        <button className="fetch-error__retry" onClick={onRetry}>
          <RefreshCw size={14} />
          Try again
        </button>
      )}

      <style>{`
        .fetch-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 48px 24px;
          text-align: center;
          color: var(--text-secondary, #9ca3af);
          border: 1px dashed rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.02);
          min-height: 200px;
        }
        .fetch-error--compact {
          flex-direction: row;
          min-height: unset;
          padding: 12px 16px;
          gap: 10px;
          border-radius: 12px;
          font-size: 13px;
        }
        .fetch-error--compact span {
          flex: 1;
          text-align: left;
        }
        .fetch-error__icon-ring {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          background: rgba(239, 68, 68, 0.1);
          color: #f87171;
          margin-bottom: 4px;
        }
        .fetch-error__title {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary, #fff);
          letter-spacing: -0.02em;
        }
        .fetch-error__message {
          margin: 0;
          font-size: 14px;
          line-height: 1.6;
          max-width: 36ch;
          color: var(--text-secondary, #9ca3af);
        }
        .fetch-error__retry {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 12px;
          border: 1px solid rgba(99, 102, 241, 0.3);
          background: rgba(99, 102, 241, 0.1);
          color: #818cf8;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-top: 4px;
        }
        .fetch-error__retry:hover {
          background: rgba(99, 102, 241, 0.18);
          border-color: rgba(99, 102, 241, 0.5);
          transform: translateY(-1px);
        }
        .fetch-error__retry:active {
          transform: translateY(0);
        }
        .fetch-error__retry--compact {
          padding: 6px 12px;
          margin-top: 0;
          font-size: 12px;
          border-radius: 8px;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}
