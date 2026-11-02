import React from 'react';

export function StatCard({
    label,
    value,
    subtitle,
    iconEmoji,
    accentColor = 'var(--accent-primary, #6366f1)',
    className = '',
}) {
    return (
        <div
            className={`stat-card ${className}`}
            style={{
                background: 'var(--bg-card, #0f0f14)',
                border: '1px solid var(--border, rgba(255,255,255,0.08))',
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                transition: 'transform 0.2s ease, border-color 0.2s ease',
            }}
        >
            {iconEmoji && (
                <div
                    style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'rgba(99, 102, 241, 0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        marginBottom: '10px',
                    }}
                >
                    {iconEmoji}
                </div>
            )}
            <div
                style={{
                    color: accentColor,
                    fontSize: '26px',
                    fontWeight: 700,
                    lineHeight: 1.2,
                    marginBottom: '4px',
                }}
            >
                {value ?? '—'}
            </div>
            <div
                style={{
                    color: 'var(--text-secondary, #a1a1aa)',
                    fontSize: '13px',
                    fontWeight: 500,
                }}
            >
                {label}
            </div>
            {subtitle && (
                <div
                    style={{
                        color: 'var(--text-muted, #71717a)',
                        fontSize: '11px',
                        marginTop: '4px',
                    }}
                >
                    {subtitle}
                </div>
            )}
        </div>
    );
}

export default StatCard;

