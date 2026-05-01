import React, { Component } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class EnhancedErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      lastErrorTime: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    const now = Date.now();
    const { lastErrorTime, errorCount } = this.state;

    // Track error frequency
    const newErrorCount = lastErrorTime && now - lastErrorTime < 5000 
      ? errorCount + 1 
      : 1;

    this.setState({
      errorInfo,
      errorCount: newErrorCount,
      lastErrorTime: now,
    });

    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('Error Boundary caught:', error, errorInfo);
    }

    // Auto-reload if too many errors in short time
    if (newErrorCount >= 3) {
      console.error('Multiple errors detected, forcing reload...');
      setTimeout(() => window.location.reload(), 2000);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    });
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, errorCount } = this.state;
      const isDevelopment = import.meta.env.DEV;

      return (
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '40px',
            maxWidth: '600px',
            width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <AlertTriangle 
                size={64} 
                color="#ef4444" 
                style={{ marginBottom: '20px' }}
              />
              <h1 style={{ 
                fontSize: '28px', 
                fontWeight: 'bold', 
                color: '#1f2937',
                marginBottom: '10px'
              }}>
                Oops! Something went wrong
              </h1>
              <p style={{ 
                fontSize: '16px', 
                color: '#6b7280',
                marginBottom: '20px'
              }}>
                {errorCount > 1 
                  ? `We've detected ${errorCount} errors. The page will reload automatically.`
                  : 'We encountered an unexpected error. Don\'t worry, your data is safe.'
                }
              </p>
            </div>

            {isDevelopment && error && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '20px',
                maxHeight: '200px',
                overflow: 'auto',
              }}>
                <h3 style={{ 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: '#991b1b',
                  marginBottom: '8px'
                }}>
                  Error Details (Development Only):
                </h3>
                <pre style={{
                  fontSize: '12px',
                  color: '#7f1d1d',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  margin: 0,
                }}>
                  {error.toString()}
                  {errorInfo && `\n\n${errorInfo.componentStack}`}
                </pre>
              </div>
            )}

            <div style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}>
              <button
                onClick={this.handleReload}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => e.target.style.background = '#5568d3'}
                onMouseOut={(e) => e.target.style.background = '#667eea'}
              >
                <RefreshCw size={20} />
                Reload Page
              </button>

              <button
                onClick={this.handleGoHome}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => e.target.style.background = '#e5e7eb'}
                onMouseOut={(e) => e.target.style.background = '#f3f4f6'}
              >
                <Home size={20} />
                Go Home
              </button>

              {isDevelopment && (
                <button
                  onClick={this.handleReset}
                  style={{
                    padding: '12px 24px',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => e.target.style.background = '#059669'}
                  onMouseOut={(e) => e.target.style.background = '#10b981'}
                >
                  Try Again
                </button>
              )}
            </div>

            <p style={{
              marginTop: '30px',
              fontSize: '14px',
              color: '#9ca3af',
              textAlign: 'center',
            }}>
              If this problem persists, please contact support at{' '}
              <a 
                href="mailto:support@preploop.com"
                style={{ color: '#667eea', textDecoration: 'none' }}
              >
                support@preploop.com
              </a>
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default EnhancedErrorBoundary;
