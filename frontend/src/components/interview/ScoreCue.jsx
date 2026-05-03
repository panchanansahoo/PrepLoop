/**
 * ScoreCue.jsx
 * Toast-style score notification that appears briefly during interviews
 * Shows immediate feedback after each answer
 */

import React, { useState, useEffect } from 'react';
import { Check, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import '../styles/ScoreCue.css';

function ScoreCue({ visible = false, score = 0, performanceLevel = 'average', feedback = '', duration = 3000 }) {
  const [isVisible, setIsVisible] = useState(visible);

  useEffect(() => {
    if (!visible) {
      setIsVisible(false);
      return;
    }

    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [visible, duration]);

  if (!isVisible) return null;

  // Determine color and icon based on performance level
  const levelConfig = {
    excellent: {
      bgColor: '#22c55e',
      textColor: '#fff',
      icon: <Check size={24} />,
      label: 'Excellent!',
      trend: 'up',
    },
    good: {
      bgColor: '#3b82f6',
      textColor: '#fff',
      icon: <TrendingUp size={24} />,
      label: 'Good',
      trend: 'up',
    },
    average: {
      bgColor: '#f59e0b',
      textColor: '#fff',
      icon: <AlertCircle size={24} />,
      label: 'Average',
      trend: 'stable',
    },
    'needs-improvement': {
      bgColor: '#ef4444',
      textColor: '#fff',
      icon: <TrendingDown size={24} />,
      label: 'Needs Work',
      trend: 'down',
    },
  };

  const config = levelConfig[performanceLevel] || levelConfig.average;

  return (
    <div className={`score-cue-toast score-cue-toast--visible`}>
      <div
        className="score-cue-content"
        style={{
          backgroundColor: config.bgColor,
          color: config.textColor,
        }}
      >
        <div className="score-cue-icon">{config.icon}</div>

        <div className="score-cue-details">
          <div className="score-cue-label">{config.label}</div>
          <div className="score-cue-score">{Math.round(score)}/100</div>
          {feedback && <div className="score-cue-feedback">{feedback}</div>}
        </div>

        {/* Progress indicator */}
        <div className="score-cue-progress">
          <div
            className="score-cue-progress-bar"
            style={{
              width: `${score}%`,
              backgroundColor: config.textColor,
              opacity: 0.7,
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default ScoreCue;
