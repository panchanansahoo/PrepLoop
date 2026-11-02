import React from 'react';

export function LoadingSpinner({ size = 'md', message, className = '' }) {
    const sizeMap = {
        sm: '20px',
        md: '32px',
        lg: '48px',
    };
    const spinnerSize = sizeMap[size] || sizeMap.md;

    return (
        <div
            className={`loading-spinner-wrapper ${className}`}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
            }}
        >
            <div
                style={{
                    width: spinnerSize,
                    height: spinnerSize,
                    border: '3px solid rgba(255, 255, 255, 0.1)',
                    borderTop: '3px solid var(--accent-primary, #6366f1)',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                }}
            />
            {message && (
                <div
                    style={{
                        marginTop: '12px',
                        color: 'var(--text-secondary, #a1a1aa)',
                        fontSize: '13px',
                    }}
                >
                    {message}
                </div>
            )}
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

export default LoadingSpinner;

