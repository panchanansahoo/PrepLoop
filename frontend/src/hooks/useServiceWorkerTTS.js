/**
 * useServiceWorkerTTS Hook
 * 
 * Registers and manages the TTS service worker.
 * Provides methods to:
 * - Register/unregister service worker
 * - Query cache statistics
 * - Clear cache
 * 
 * Usage:
 *   const { stats, clearCache, loading, error } = useServiceWorkerTTS();
 *   useEffect(() => {
 *     if (stats?.entries) {
 *       console.log('TTS Cache ready:', stats.entries);
 *     }
 *   }, [stats]);
 */

import { useEffect, useState, useCallback } from 'react';

const SW_PATH = '/tts-sw.js';

export const useServiceWorkerTTS = () => {
  const [registration, setRegistration] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Register service worker
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      setError('Service Workers not supported');
      setLoading(false);
      return;
    }

    const registerSW = async () => {
      try {
        const reg = await navigator.serviceWorker.register(SW_PATH, {
          scope: '/',
        });
        setRegistration(reg);
        console.log('[TTS] Service worker registered:', reg);

        // Query initial cache stats
        await getCacheStats(reg);

        // Listen for updates
        reg.addEventListener('updatefound', () => {
          console.log('[TTS] Service worker update found');
        });

        setLoading(false);
      } catch (err) {
        console.error('[TTS] Service worker registration failed:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    registerSW();
  }, []);

  // Get cache statistics
  const getCacheStats = useCallback(async (reg = registration) => {
    if (!reg) return;

    try {
      const controller = reg.controller || reg.active;
      if (!controller) return;

      // Post message to service worker
      const channel = new MessageChannel();
      controller.postMessage(
        { action: 'GET_CACHE_STATS' },
        [channel.port2]
      );

      // Wait for response
      return new Promise((resolve, reject) => {
        channel.port1.onmessage = (e) => {
          if (e.data.success) {
            setStats(e.data.stats);
            resolve(e.data.stats);
          } else {
            reject(new Error('Failed to get cache stats'));
          }
        };
        setTimeout(() => reject(new Error('Timeout')), 5000);
      });
    } catch (err) {
      console.warn('[TTS] Failed to get cache stats:', err);
    }
  }, [registration]);

  // Clear entire cache
  const clearCache = useCallback(async () => {
    if (!registration) return;

    try {
      const controller = registration.controller || registration.active;
      if (!controller) return;

      const channel = new MessageChannel();
      controller.postMessage(
        { action: 'CLEAR_CACHE' },
        [channel.port2]
      );

      return new Promise((resolve, reject) => {
        channel.port1.onmessage = (e) => {
          if (e.data.success) {
            setStats(null);
            resolve(e.data.message);
            console.log('[TTS] Cache cleared');
          } else {
            reject(new Error('Failed to clear cache'));
          }
        };
        setTimeout(() => reject(new Error('Timeout')), 5000);
      });
    } catch (err) {
      console.error('[TTS] Failed to clear cache:', err);
    }
  }, [registration]);

  // Clear single cache entry
  const clearCacheEntry = useCallback(async (url) => {
    if (!registration) return;

    try {
      const controller = registration.controller || registration.active;
      if (!controller) return;

      const channel = new MessageChannel();
      controller.postMessage(
        { action: 'CLEAR_ENTRY', url },
        [channel.port2]
      );

      return new Promise((resolve, reject) => {
        channel.port1.onmessage = (e) => {
          if (e.data.success) {
            resolve(e.data.deleted);
            console.log(`[TTS] Cache entry cleared: ${url}`);
          } else {
            reject(new Error('Failed to clear cache entry'));
          }
        };
        setTimeout(() => reject(new Error('Timeout')), 5000);
      });
    } catch (err) {
      console.error('[TTS] Failed to clear cache entry:', err);
    }
  }, [registration]);

  // Refresh cache stats
  const refresh = useCallback(async () => {
    await getCacheStats();
  }, [getCacheStats]);

  return {
    registration,
    stats,
    loading,
    error,
    clearCache,
    clearCacheEntry,
    refresh,
  };
};

export default useServiceWorkerTTS;
