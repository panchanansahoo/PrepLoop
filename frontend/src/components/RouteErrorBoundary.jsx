import React, { Component } from 'react';

/**
 * Route Error Boundary Component
 * Catches errors in route components and displays a fallback UI
 */
export default class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`Error caught in route ${this.props.routeName || 'page'}:`, error, errorInfo);
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (this.state.hasError) {
      const { error } = this.state;
      return (
        <div style={{
          padding: '20px',
          margin: '20px',
          border: '1px solid #fee',
          borderRadius: '8px',
          backgroundColor: '#fff5f5',
          color: '#c53030'
        }}>
          <h2 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>Something went wrong</h2>
          <p style={{ margin: '0 0 15px 0', fontSize: '14px' }}>
            The page encountered an error. Please try refreshing or go back to the home page.
          </p>
          {import.meta.env.MODE === 'development' && error && (
            <details style={{ marginBottom: '15px' }}>
              <summary style={{ cursor: 'pointer', fontSize: '12px', marginBottom: '5px' }}>
                Error Details
              </summary>
              <pre style={{
                fontSize: '11px',
                padding: '10px',
                backgroundColor: '#fed7d7',
                borderRadius: '4px',
                overflow: 'auto',
                maxHeight: '200px'
              }}>
                {error.toString()}
              </pre>
            </details>
          )}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={this.resetErrorBoundary}
              style={{
                padding: '8px 16px',
                backgroundColor: '#c53030',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.href = '/'}
              style={{
                padding: '8px 16px',
                backgroundColor: '#4a5568',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Go to Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
