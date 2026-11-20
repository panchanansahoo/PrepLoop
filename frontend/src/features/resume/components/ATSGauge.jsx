import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

export function ATSGauge({ score = 0, size = 180 }) {
  const numericScore = typeof score === 'number' && !isNaN(score) ? score : 0;
  const [animatedScore, setAnimatedScore] = useState(0);
  const radius = Math.max((size - 20) / 2, 0);
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    let frame;
    const duration = 1500;
    const start = performance.now();
    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(eased * numericScore));
      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    };
    frame = requestAnimationFrame(animate);
    return () => {
      if (frame) cancelAnimationFrame(frame);
    };
  }, [numericScore]);

  const getColor = (s) => {
    if (s >= 80) return 'var(--success-main, #6ee7b7)';
    if (s >= 60) return 'var(--warning-main, #fbbf24)';
    if (s >= 40) return 'var(--warning-dark, #fb923c)';
    return 'var(--error-main, #f87171)';
  };

  const getStatusLabel = (s) => {
    if (s >= 80) return 'Excellent';
    if (s >= 60) return 'Good';
    if (s >= 40) return 'Fair';
    return 'Needs Work';
  };

  const color = getColor(numericScore);
  const offset = circumference - (animatedScore / 100) * circumference;

  return (
    <div
      className="ats-gauge"
      style={{ position: 'relative', width: size, height: size }}
      role="progressbar"
      aria-valuenow={animatedScore}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="ATS Score Gauge"
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <filter id="ats-gauge-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border-light, #334155)"
          strokeWidth="10"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transform: 'rotate(-90deg)',
            transformOrigin: 'center',
            transition: 'stroke-dashoffset 0.3s ease',
          }}
          filter="url(#ats-gauge-glow)"
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ fontSize: 42, fontWeight: 800, color, lineHeight: 1 }}>
          {animatedScore}
        </div>
        <div
          style={{
            fontSize: 13,
            color: 'var(--text-muted, #94a3b8)',
            marginTop: 4,
            fontWeight: 600,
          }}
        >
          ATS Score
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            marginTop: 6,
            padding: '3px 10px',
            borderRadius: 20,
            background: `${color}15`,
            color,
            letterSpacing: 0.3,
          }}
        >
          {getStatusLabel(numericScore)}
        </div>
      </div>
    </div>
  );
}

ATSGauge.propTypes = {
  score: PropTypes.number,
  size: PropTypes.number,
};

export default ATSGauge;
