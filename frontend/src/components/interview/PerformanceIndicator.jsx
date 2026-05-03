/**
 * PerformanceIndicator.jsx
 * Displays live performance metrics during interview
 * Shows clarity, structure, engagement, confidence, technical depth, overall
 */

import React, { useEffect, useState } from 'react';
import { useRealtimeFeedback } from './RealtimeFeedbackProvider';
import '../../styles/PerformanceIndicator.css';

export default function PerformanceIndicator() {
  const { performanceMetrics } = useRealtimeFeedback();
  const [displayMetrics, setDisplayMetrics] = useState(performanceMetrics);

  // Smooth metric transitions
  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayMetrics((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((key) => {
          if (performanceMetrics[key] !== undefined) {
            const diff = performanceMetrics[key] - prev[key];
            updated[key] = prev[key] + diff * 0.2; // Smooth 20% transition per frame
          }
        });
        return updated;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [performanceMetrics]);

  const getIndicatorColor = (value) => {
    if (value >= 80) return '#10b981'; // green
    if (value >= 60) return '#3b82f6'; // blue
    if (value >= 40) return '#f59e0b'; // orange
    return '#ef4444'; // red
  };

  const MetricBar = ({ label, value, max = 100 }) => {
    const percentage = (value / max) * 100;
    const color = getIndicatorColor(value);

    return (
      <div className="metric-bar-container">
        <div className="metric-label">
          <span>{label}</span>
          <span className="metric-value">{Math.round(value)}</span>
        </div>
        <div className="metric-bar">
          <div
            className="metric-bar-fill"
            style={{
              width: `${percentage}%`,
              backgroundColor: color,
              transition: 'width 0.3s ease, background-color 0.3s ease',
            }}
          />
        </div>
      </div>
    );
  };

  const RadialIndicator = ({ label, value, max = 100 }) => {
    const percentage = (value / max) * 100;
    const color = getIndicatorColor(value);
    const circumference = 2 * Math.PI * 45; // r = 45
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="radial-indicator">
        <svg width="120" height="120" viewBox="0 0 120 120">
          {/* Background circle */}
          <circle cx="60" cy="60" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />

          {/* Progress circle */}
          <circle
            cx="60"
            cy="60"
            r="45"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.3s ease, stroke 0.3s ease',
              transform: 'rotate(-90deg)',
              transformOrigin: '60px 60px',
            }}
          />

          {/* Center text */}
          <text x="60" y="55" textAnchor="middle" fontSize="24" fontWeight="bold" fill={color}>
            {Math.round(value)}
          </text>
          <text x="60" y="72" textAnchor="middle" fontSize="12" fill="#6b7280">
            %
          </text>
        </svg>
        <div className="radial-label">{label}</div>
      </div>
    );
  };

  return (
    <div className="performance-indicator-container">
      <div className="performance-header">
        <h3>Live Performance Metrics</h3>
        <div className="update-indicator" />
      </div>

      {/* Overall Score - Prominent Display */}
      <div className="overall-score-section">
        <RadialIndicator
          label="Overall"
          value={displayMetrics.overall}
          max={100}
        />
      </div>

      {/* Detailed Metrics - Bar Chart Style */}
      <div className="detailed-metrics-section">
        <MetricBar
          label="Clarity"
          value={displayMetrics.clarity}
          max={100}
        />
        <MetricBar
          label="Structure"
          value={displayMetrics.structure}
          max={100}
        />
        <MetricBar
          label="Engagement"
          value={displayMetrics.engagement}
          max={100}
        />
        <MetricBar
          label="Confidence"
          value={displayMetrics.confidence}
          max={100}
        />
        <MetricBar
          label="Technical Depth"
          value={displayMetrics.technicalDepth}
          max={100}
        />
      </div>

      {/* Score Interpretation */}
      <div className="score-interpretation">
        {displayMetrics.overall >= 80 && (
          <div className="interpretation excellent">
            ✨ Excellent performance! Keep it up!
          </div>
        )}
        {displayMetrics.overall >= 60 && displayMetrics.overall < 80 && (
          <div className="interpretation good">
            👍 Good progress! Focus on areas below 70.
          </div>
        )}
        {displayMetrics.overall >= 40 && displayMetrics.overall < 60 && (
          <div className="interpretation average">
            ⚠️ Average. Take deep breaths and elaborate more.
          </div>
        )}
        {displayMetrics.overall < 40 && (
          <div className="interpretation needs-improvement">
            💡 This can be better. Ask for hints if needed.
          </div>
        )}
      </div>

      {/* Real-time Tips */}
      <div className="realtime-tips">
        {displayMetrics.clarity < 60 && (
          <div className="tip clarity">💬 Tip: Simplify your explanations, use shorter sentences.</div>
        )}
        {displayMetrics.structure < 60 && (
          <div className="tip structure">📋 Tip: Use STAR method: Situation → Task → Action → Result.</div>
        )}
        {displayMetrics.engagement < 60 && (
          <div className="tip engagement">✨ Tip: Add examples and use specific numbers/metrics.</div>
        )}
        {displayMetrics.confidence < 60 && (
          <div className="tip confidence">💪 Tip: Speak with conviction, avoid filler words (um, uh, like).</div>
        )}
        {displayMetrics.technicalDepth < 60 && (
          <div className="tip technical">🔧 Tip: Dive deeper into technologies, tools, and approaches used.</div>
        )}
      </div>
    </div>
  );
}
