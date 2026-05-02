import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * InterviewErrorBoundary — Catches JS errors during interview and displays graceful fallback
 * Prevents full app crash when interview component encounters unexpected errors.
 *
 * Props:
 *  - children: React components to protect
 *  - onError?: (error, errorInfo) => void (optional callback for error logging)
 */
class InterviewErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            errorCount: 0,
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log error count to potentially trigger hard reset if too many errors
        const errorCount = (this.state?.errorCount || 0) + 1;
        this.setState(prev => ({
            ...prev,
            error,
            errorInfo,
            errorCount,
        }));

        // Call optional error callback for external logging (Sentry, etc.)
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }

        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.error('Interview Error Boundary caught:', error, errorInfo);
        }
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    handleGoHome = () => {
        // Clear localStorage session on exit
        try {
            window.localStorage.removeItem('ai-interview-session');
        } catch {}
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            const { error, errorInfo, errorCount } = this.state;
            const isRecurringError = errorCount > 3;

            return (
                <div className="ai-error-boundary-container">
                    <div className="ai-error-boundary-card">
                        <div className="ai-error-boundary-icon">
                            <AlertTriangle size={48} color="#ef4444" />
                        </div>

                        <h1 className="ai-error-boundary-title">
                            Interview Interrupted
                        </h1>

                        <p className="ai-error-boundary-message">
                            {isRecurringError
                                ? 'A persistent error occurred. Please return home and start a new interview.'
                                : 'An unexpected error occurred during your interview. You can try to resume or start fresh.'}
                        </p>

                        {process.env.NODE_ENV === 'development' && (
                            <details className="ai-error-boundary-details">
                                <summary className="ai-error-boundary-summary">
                                    Error Details (Development Only)
                                </summary>
                                <pre className="ai-error-boundary-error-text">
                                    {error && error.toString()}
                                    {'\n\n'}
                                    {errorInfo && errorInfo.componentStack}
                                </pre>
                            </details>
                        )}

                        <div className="ai-error-boundary-actions">
                            {!isRecurringError && (
                                <button
                                    onClick={this.handleReset}
                                    className="ai-error-boundary-retry-btn"
                                    title="Attempt to recover the interview"
                                >
                                    <RefreshCw size={18} />
                                    Try Again
                                </button>
                            )}

                            <button
                                onClick={this.handleGoHome}
                                className="ai-error-boundary-home-btn"
                                title="Return to home page"
                            >
                                <Home size={18} />
                                Go Home
                            </button>
                        </div>

                        <p className="ai-error-boundary-footer">
                            If the problem persists, please contact support.
                        </p>
                    </div>

                    <style>{`
                        .ai-error-boundary-container {
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            min-height: 100vh;
                            background: linear-gradient(135deg, rgba(17,24,39,0.95), rgba(31,41,55,0.95));
                            padding: 16px;
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        }

                        .ai-error-boundary-card {
                            background: rgba(255, 255, 255, 0.05);
                            border: 1px solid rgba(255, 255, 255, 0.1);
                            border-radius: 12px;
                            padding: 48px 32px;
                            max-width: 500px;
                            text-align: center;
                            backdrop-filter: blur(10px);
                            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                        }

                        .ai-error-boundary-icon {
                            display: flex;
                            justify-content: center;
                            margin-bottom: 24px;
                        }

                        .ai-error-boundary-title {
                            color: #fff;
                            font-size: 28px;
                            font-weight: 700;
                            margin: 0 0 16px 0;
                            letter-spacing: -0.5px;
                        }

                        .ai-error-boundary-message {
                            color: rgba(255, 255, 255, 0.7);
                            font-size: 16px;
                            line-height: 1.6;
                            margin: 0 0 24px 0;
                        }

                        .ai-error-boundary-details {
                            background: rgba(0, 0, 0, 0.3);
                            border: 1px solid rgba(239, 68, 68, 0.2);
                            border-radius: 8px;
                            padding: 12px;
                            margin: 24px 0;
                            text-align: left;
                        }

                        .ai-error-boundary-summary {
                            color: rgba(239, 68, 68, 0.8);
                            cursor: pointer;
                            font-size: 13px;
                            font-weight: 600;
                            padding: 8px;
                            user-select: none;
                        }

                        .ai-error-boundary-summary:hover {
                            color: #ef4444;
                        }

                        .ai-error-boundary-error-text {
                            background: rgba(0, 0, 0, 0.5);
                            color: rgba(255, 255, 255, 0.6);
                            border-radius: 4px;
                            padding: 12px;
                            font-size: 11px;
                            line-height: 1.4;
                            overflow-x: auto;
                            margin: 12px 0 0 0;
                            max-height: 200px;
                            overflow-y: auto;
                            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                            white-space: pre-wrap;
                            word-break: break-word;
                        }

                        .ai-error-boundary-actions {
                            display: flex;
                            gap: 12px;
                            justify-content: center;
                            margin: 32px 0 24px 0;
                            flex-wrap: wrap;
                        }

                        .ai-error-boundary-retry-btn,
                        .ai-error-boundary-home-btn {
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            padding: 12px 24px;
                            border: 1px solid rgba(255, 255, 255, 0.2);
                            border-radius: 8px;
                            font-size: 14px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.2s ease;
                            background: rgba(255, 255, 255, 0.05);
                            color: rgba(255, 255, 255, 0.8);
                        }

                        .ai-error-boundary-retry-btn:hover {
                            background: rgba(99, 102, 241, 0.2);
                            border-color: rgba(99, 102, 241, 0.4);
                            color: #c7d2fe;
                        }

                        .ai-error-boundary-home-btn:hover {
                            background: rgba(34, 211, 238, 0.2);
                            border-color: rgba(34, 211, 238, 0.4);
                            color: #a5f3fc;
                        }

                        .ai-error-boundary-retry-btn:active,
                        .ai-error-boundary-home-btn:active {
                            transform: scale(0.98);
                        }

                        .ai-error-boundary-footer {
                            color: rgba(255, 255, 255, 0.5);
                            font-size: 13px;
                            margin: 0;
                        }

                        @media (max-width: 640px) {
                            .ai-error-boundary-card {
                                padding: 32px 16px;
                            }

                            .ai-error-boundary-title {
                                font-size: 24px;
                            }

                            .ai-error-boundary-message {
                                font-size: 14px;
                            }

                            .ai-error-boundary-actions {
                                gap: 8px;
                            }

                            .ai-error-boundary-retry-btn,
                            .ai-error-boundary-home-btn {
                                padding: 10px 16px;
                                font-size: 13px;
                            }
                        }
                    `}</style>
                </div>
            );
        }

        return this.props.children;
    }
}

export default InterviewErrorBoundary;
