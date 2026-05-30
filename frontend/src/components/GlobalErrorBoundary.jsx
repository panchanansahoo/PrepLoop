import { Component } from 'react';

/**
 * Global Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 */
class GlobalErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error('GlobalErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div style={{
          padding: '40px 20px',
          margin: '20px',
          border: '2px solid #fee',
          borderRadius: '12px',
          backgroundColor: '#fff5f5',
          color: '#c53030',
          maxWidth: '800px',
          marginLeft: 'auto',
          marginRight: 'auto',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
          <h1 style={{ margin: '0 0 15px 0', fontSize: '24px', fontWeight: '600' }}>
            Oops! Something went wrong
          </h1>
          <p style={{ margin: '0 0 20px 0', fontSize: '16px', lineHeight: '1.6' }}>
            We're sorry for the inconvenience. The application encountered an unexpected error.
          </p>
          
          {import.meta.env.MODE === 'development' && this.state.error && (
            <details style={{ 
              marginBottom: '20px', 
              textAlign: 'left',
              backgroundColor: '#fed7d7',
              padding: '15px',
              borderRadius: '8px'
            }}>
              <summary style={{ 
                cursor: 'pointer', 
                fontSize: '14px', 
                fontWeight: '600',
                marginBottom: '10px'
              }}>
                Error Details (Development Mode)
              </summary>
              <pre style={{
                fontSize: '12px',
                padding: '10px',
                backgroundColor: '#fff',
                borderRadius: '4px',
                overflow: 'auto',
                maxHeight: '300px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {this.state.error.toString()}
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}

          <div style={{ 
            display: 'flex', 
            gap: '15px', 
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                backgroundColor: '#c53030',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#9b2c2c'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#c53030'}
            >
              🔄 Reload Page
            </button>
            <button
              onClick={() => window.location.href = '/'}
              style={{
                padding: '12px 24px',
                backgroundColor: '#4a5568',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#2d3748'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#4a5568'}
            >
              🏠 Go to Home
            </button>
          </div>

          <p style={{ 
            marginTop: '30px', 
            fontSize: '13px', 
            color: '#742a2a',
            fontStyle: 'italic'
          }}>
            If this problem persists, please contact support or try again later.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
