import React from 'react';

export function TagBadge({
    text,
    variant = 'neutral',
    color,
    size = 'sm',
    className = '',
}) {
    const variantColors = {
        primary: { bg: 'rgba(99, 102, 241, 0.15)', text: '#818cf8', border: 'rgba(99, 102, 241, 0.3)' },
        success: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)' },
        warning: { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' },
        error: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' },
        neutral: { bg: 'rgba(255, 255, 255, 0.06)', text: 'var(--text-secondary, #a1a1aa)', border: 'rgba(255, 255, 255, 0.1)' },
    };

    const activeStyle = color
        ? { bg: `${color}18`, text: color, border: `${color}33` }
        : variantColors[variant] || variantColors.neutral;

    const sizeStyles = {
        xs: { padding: '2px 8px', fontSize: '11px', borderRadius: '999px' },
        sm: { padding: '4px 10px', fontSize: '12px', borderRadius: '999px' },
        md: { padding: '6px 14px', fontSize: '13px', borderRadius: '999px' },
    };

    return (
        <span
            className={`tag-badge ${className}`}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                fontWeight: 600,
                background: activeStyle.bg,
                color: activeStyle.text,
                border: `1px solid ${activeStyle.border}`,
                lineHeight: 1.2,
                ...sizeStyles[size],
            }}
        >
            {text}
        </span>
    );
}

export default TagBadge;

