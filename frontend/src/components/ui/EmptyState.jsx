import React from 'react';
import { Button } from './button';

export function EmptyState({
    emoji = '📭',
    title,
    message,
    actionLabel,
    onAction,
    className = '',
}) {
    return (
        <div
            className={`empty-state ${className}`}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '48px 24px',
                textAlign: 'center',
            }}
        >
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.8 }}>
                {emoji}
            </div>
            {title && (
                <h3
                    style={{
                        color: 'var(--text-primary, #f8fafc)',
                        fontSize: '20px',
                        fontWeight: 700,
                        margin: '0 0 8px 0',
                    }}
                >
                    {title}
                </h3>
            )}
            {message && (
                <p
                    style={{
                        color: 'var(--text-secondary, #a1a1aa)',
                        fontSize: '14px',
                        maxWidth: '420px',
                        margin: '0 0 20px 0',
                        lineHeight: 1.5,
                    }}
                >
                    {message}
                </p>
            )}
            {actionLabel && onAction && (
                <Button variant="default" size="sm" onClick={onAction}>
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}

export default EmptyState;

