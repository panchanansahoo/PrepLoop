import React from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle } from 'lucide-react';

const BADGE_COLORS = {
  technical: {
    bg: 'rgba(139, 92, 246, 0.12)',
    color: 'var(--accent-primary, #c084fc)',
    border: 'rgba(139, 92, 246, 0.2)',
  },
  soft: {
    bg: 'rgba(59, 130, 246, 0.12)',
    color: 'var(--info-main, #60a5fa)',
    border: 'rgba(59, 130, 246, 0.2)',
  },
  missing: {
    bg: 'rgba(248, 113, 113, 0.12)',
    color: 'var(--error-main, #f87171)',
    border: 'rgba(248, 113, 113, 0.2)',
  },
};

export function KeywordTag({ label, type = 'technical', className = '', style = {} }) {
  const c = BADGE_COLORS[type] || BADGE_COLORS.technical;

  return (
    <span
      className={`keyword-tag keyword-tag-${type || 'technical'} ${className}`.trim()}
      data-testid="keyword-tag"
      data-type={type}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 10px',
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 600,
        background: c.bg,
        color: c.color,
        border: `1px solid ${c.border}`,
        ...style,
      }}
    >
      {type === 'missing' && (
        <AlertTriangle
          size={11}
          aria-hidden="true"
          data-testid="keyword-tag-missing-icon"
        />
      )}
      {label}
    </span>
  );
}

KeywordTag.propTypes = {
  label: PropTypes.node.isRequired,
  type: PropTypes.oneOf(['technical', 'soft', 'missing']),
  className: PropTypes.string,
  style: PropTypes.object,
};

export default KeywordTag;
