/**
 * useOffline — Online/offline detection hook with offline banner.
 */
import { useState, useEffect, useCallback } from 'react';

export function useOffline() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
      // Use functional update to read latest wasOffline without adding it as a dep
      setWasOffline(prev => {
        if (prev) setTimeout(() => setWasOffline(false), 3000);
        return prev;
      });
    };
    const goOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []); // stable — no deps needed with functional state updates

  return { isOnline, wasOffline };
}

/**
 * OfflineBanner — Displays a banner when the user is offline.
 */
export function OfflineBanner() {
  const { isOnline, wasOffline } = useOffline();

  if (isOnline && !wasOffline) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10000,
        padding: '8px 16px',
        textAlign: 'center',
        fontSize: 14,
        fontWeight: 500,
        fontFamily: "'Inter', sans-serif",
        background: isOnline ? '#059669' : '#dc2626',
        color: '#fff',
        transition: 'all 0.3s ease',
      }}
    >
      {isOnline
        ? '✓ Back online — syncing changes...'
        : '⚠ You are offline — some features may be limited'}
    </div>
  );
}

export default useOffline;
