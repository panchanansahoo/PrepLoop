import { useEffect, useState, useCallback } from 'react';

/**
 * useNetworkRecovery Hook
 * Detects connection loss and triggers recovery actions
 * Includes auto-reconnect countdown and connection status monitoring
 */
export function useNetworkRecovery({ 
  onConnectionLost, 
  onConnectionRestored,
  checkIntervalMs = 5000,
  maxRetries = 5
}) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionLost, setConnectionLost] = useState(false);
  const [autoReconnectCountdown, setAutoReconnectCountdown] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  // Check connection by pinging health endpoint
  const checkConnection = useCallback(async () => {
    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }, []);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = async () => {
      console.log('[useNetworkRecovery] Network online event detected');
      
      // Verify connection actually works
      const isConnected = await checkConnection();
      if (isConnected) {
        setIsOnline(true);
        setConnectionLost(false);
        setRetryCount(0);
        onConnectionRestored?.();
      }
    };

    const handleOffline = () => {
      console.log('[useNetworkRecovery] Network offline event detected');
      setIsOnline(false);
      setConnectionLost(true);
      onConnectionLost?.();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkConnection, onConnectionLost, onConnectionRestored]);

  // Periodically check connection status
  useEffect(() => {
    if (!connectionLost) return;

    const interval = setInterval(async () => {
      const isConnected = await checkConnection();
      
      if (isConnected) {
        console.log('[useNetworkRecovery] Connection restored after check');
        setIsOnline(true);
        setConnectionLost(false);
        setRetryCount(0);
        setAutoReconnectCountdown(0);
        onConnectionRestored?.();
      } else {
        setRetryCount(prev => prev + 1);
        
        // Exponential backoff countdown
        const nextRetry = Math.min(30, Math.pow(2, Math.min(retryCount, 4)));
        setAutoReconnectCountdown(nextRetry);
        
        // Stop trying after max retries
        if (retryCount >= maxRetries) {
          console.warn('[useNetworkRecovery] Max retries exceeded');
          setAutoReconnectCountdown(0);
        }
      }
    }, checkIntervalMs);

    return () => clearInterval(interval);
  }, [connectionLost, checkConnection, checkIntervalMs, maxRetries, retryCount, onConnectionRestored]);

  // Auto-reconnect countdown timer
  useEffect(() => {
    if (autoReconnectCountdown <= 0) return;

    const timer = setInterval(() => {
      setAutoReconnectCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoReconnectCountdown]);

  // Manual reconnect attempt
  const attemptReconnect = useCallback(async () => {
    console.log('[useNetworkRecovery] Manual reconnect attempt');
    setAutoReconnectCountdown(0);
    const isConnected = await checkConnection();
    
    if (isConnected) {
      setIsOnline(true);
      setConnectionLost(false);
      setRetryCount(0);
      onConnectionRestored?.();
      return true;
    }
    
    return false;
  }, [checkConnection, onConnectionRestored]);

  return {
    isOnline,
    connectionLost,
    autoReconnectCountdown,
    retryCount,
    attemptReconnect,
    checkConnection,
  };
}

export default useNetworkRecovery;
