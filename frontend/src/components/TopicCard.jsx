import React from 'react';
import { Clock, ChevronRight } from 'lucide-react';
import '../styles/TopicCard.css';

/**
 * TopicCard Component
 *
 * Reusable component for displaying a learning topic/path with:
 * - Progress visualization
 * - Mastery badge
 * - 4-step methodology indicators
 * - Consistent styling across all learning paths
 */

function ProgressRing({ percent, size = 52, strokeWidth = 4, color = '#818cf8' }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;

  return (
    <svg width={size} height={size} className="topic-progress-ring" style={{ transform: 'rotate(-90deg)' }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#fff"
        fontSize={size * 0.22}
        fontWeight="700"
        style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}
      >
        {percent}%
      </text>
    </svg>
  );
}

export default function TopicCard({
  topic,
  progress,
  badge,
  onClick,
  steps = [],
  icon = '📖',
  color = '#818cf8',
  estimatedTime = '4-6 weeks',
}) {
  return (
    <div className="topic-card" onClick={onClick}>
      {/* Header: Icon, Title, Progress Ring */}
      <div className="topic-card__header">
        <div className="topic-card__content">
          <div className="topic-card__icon">{icon}</div>
          <div className="topic-card__title-group">
            <h3 className="topic-card__title">{topic.title}</h3>
            <p className="topic-card__description">{topic.description}</p>
          </div>
        </div>
        <div className="topic-card__progress">
          <ProgressRing percent={progress.masteryPercent || 0} color={color} size={56} strokeWidth={4} />
        </div>
      </div>

      {/* Steps: 4-stage methodology progress */}
      <div className="topic-card__steps">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className={`topic-card__step ${step.done ? 'topic-card__step--done' : ''}`}
            style={
              step.done
                ? {
                    backgroundColor: `${color}12`,
                    borderColor: `${color}25`,
                  }
                : {}
            }
          >
            <div className="topic-card__step-icon">{step.done ? '✅' : '○'}</div>
            <div className="topic-card__step-label" style={step.done ? { color } : {}}>
              {step.label}
            </div>
          </div>
        ))}
      </div>

      {/* Footer: Badge and Meta Info */}
      <div className="topic-card__footer">
        <div
          className="topic-card__badge"
          style={{
            color: badge?.color || '#525252',
            backgroundColor: `${badge?.color || '#525252'}12`,
            borderColor: `${badge?.color || '#525252'}25`,
          }}
        >
          <span className="topic-card__badge-emoji">{badge?.emoji || '🔒'}</span>
          <span className="topic-card__badge-text">{badge?.label || 'Not Started'}</span>
        </div>
        <div className="topic-card__meta">
          <Clock size={12} className="topic-card__meta-icon" />
          <span className="topic-card__meta-time">{estimatedTime}</span>
          <ChevronRight size={14} className="topic-card__meta-arrow" />
        </div>
      </div>
    </div>
  );
}
