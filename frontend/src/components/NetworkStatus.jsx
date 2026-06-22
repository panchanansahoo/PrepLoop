import { useState, useEffect, useRef } from 'react';
import { useGlobalToast } from '../context/ToastContext';

function NetworkStatus() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const wasOfflineRef = useRef(false);
  const { showToast } = useGlobalToast();

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      wasOfflineRef.current = true;
    };

    const handleOnline = () => {
      setIsOffline(false);
      if (wasOfflineRef.current) {
        showToast({
          type: 'success',
          title: 'Back Online',
          description: 'Your connection has been restored.',
          duration: 3000,
        });
        wasOfflineRef.current = false;
      }
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [showToast]);

  if (!isOffline) return null;

  return (
    <div
      role="alert"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100000,
        background: 'linear-gradient(90deg, #ef4444, #dc2626)',
        color: 'white',
        textAlign: 'center',
        padding: '10px 16px',
        fontSize: '14px',
        fontWeight: 600,
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        animation: 'slideDown 0.3s ease-out',
      }}
    >
      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-100%); }
          to { transform: translateY(0); }
        }
      `}</style>
      <span style={{ fontSize: '16px' }}>⚡</span>
      You're offline — some features may be unavailable
    </div>
  );
}

export default NetworkStatus;
