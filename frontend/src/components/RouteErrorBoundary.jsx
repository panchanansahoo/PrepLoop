/**
 * Route-Level Error Boundary
 */
import React from 'react';

class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, retryCount: 0, isRetrying: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    const isChunkError = error?.name === 'ChunkLoadError' ||
      error?.message?.includes('Loading chunk') ||
      error?.message?.includes('Failed to fetch');

    if (isChunkError && this.state.retryCount < 1) {
      this.setState({ isRetrying: true, retryCount: this.state.retryCount + 1 });
      setTimeout(() => {
        this.setState({ hasError: false, error: null, isRetrying: false });
      }, 1000);
      return;
    }

    // Report error to backend (fire-and-forget)
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error?.message,
        stack: error?.stack?.slice(0, 2000),
        url: window.location.href,
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {});
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, retryCount: this.state.retryCount + 1 });
  };

  render() {
    if (this.state.isRetrying) {
      return (
        <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'50vh',color:'#e2e8f0' }}>
          <p>Reloading content...</p>
        </div>
      );
    }

    if (this.state.hasError) {
      const { routeName = 'this page' } = this.props;
      return (
        <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'50vh',padding:'40px 24px',textAlign:'center',color:'#e2e8f0' }} role="alert">
          <h2 style={{ fontSize:24,fontWeight:600,marginBottom:12,color:'#f8fafc' }}>Something went wrong</h2>
          <p style={{ fontSize:16,color:'#94a3b8',marginBottom:24,maxWidth:500 }}>
            The {routeName} feature encountered an error.
          </p>
          <div style={{ display:'flex',gap:12 }}>
            <button onClick={this.handleRetry} style={{ padding:'10px 24px',background:'linear-gradient(135deg,#6366f1,#818cf8)',color:'#fff',border:'none',borderRadius:8,cursor:'pointer' }}>
              Try Again
            </button>
            <button onClick={() => window.location.href = '/dashboard'} style={{ padding:'10px 24px',background:'rgba(255,255,255,0.06)',color:'#e2e8f0',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,cursor:'pointer' }}>
              Go to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default RouteErrorBoundary;
