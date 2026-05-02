import React, { useState, useEffect } from 'react';
import './SessionRecoveryComponent.css';

/**
 * SessionRecoveryComponent
 * Displays recovery options if a saved interview session is found
 */
export default function SessionRecoveryComponent({ 
  onRecover, 
  onDiscard,
  recoveryInfo 
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (recoveryInfo) {
      setIsVisible(true);
    }
  }, [recoveryInfo]);

  if (!isVisible || !recoveryInfo) {
    return null;
  }

  const handleRecover = () => {
    setIsVisible(false);
    onRecover?.(recoveryInfo);
  };

  const handleDiscard = () => {
    setIsVisible(false);
    onDiscard?.(recoveryInfo);
  };

  return (
    <div className="session-recovery-modal">
      <div className="session-recovery-overlay" onClick={handleDiscard} />
      
      <div className="session-recovery-card">
        <div className="recovery-header">
          <h2>Resume Interview?</h2>
          <button 
            className="close-btn" 
            onClick={handleDiscard}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="recovery-body">
          <div className="recovery-info">
            <p className="recovery-intro">
              We found a saved interview session. Would you like to continue where you left off?
            </p>

            <div className="recovery-details">
              <div className="detail-item">
                <span className="detail-label">Interview Type:</span>
                <span className="detail-value">{recoveryInfo.interviewType}</span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Difficulty:</span>
                <span className="detail-value">{recoveryInfo.difficulty}</span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Questions Answered:</span>
                <span className="detail-value">{recoveryInfo.responseCount}</span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Last Saved:</span>
                <span className="detail-value">
                  {recoveryInfo.lastSavedAgo < 1 
                    ? 'Just now' 
                    : `${recoveryInfo.lastSavedAgo} minute${recoveryInfo.lastSavedAgo > 1 ? 's' : ''} ago`}
                </span>
              </div>
            </div>

            <div className="recovery-note">
              <p className="note-icon">ℹ️</p>
              <p className="note-text">
                Your progress has been automatically saved. You can recover it within 24 hours.
              </p>
            </div>
          </div>
        </div>

        <div className="recovery-actions">
          <button 
            className="action-btn btn-recover"
            onClick={handleRecover}
            data-testid="recovery-resume-btn"
          >
            Resume Interview
          </button>

          <button 
            className="action-btn btn-discard"
            onClick={handleDiscard}
            data-testid="recovery-discard-btn"
          >
            Start Fresh
          </button>
        </div>
      </div>
    </div>
  );
}
