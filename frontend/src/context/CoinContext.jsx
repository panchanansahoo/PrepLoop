import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { buildAuthHeaders } from '../utils/authHeaders';
import { authFetch } from '../utils/authFetch';
import { API_URL } from '../config/api.js';

const CoinContext = createContext();

export function CoinProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id || null;
  const [coins, setCoins] = useState(0);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [redeemOptions, setRedeemOptions] = useState([]);

  const isMountedRef = useRef(true);
  const activeControllersRef = useRef(new Set());

  const createManagedSignal = useCallback((externalSignal) => {
    const controller = new AbortController();
    activeControllersRef.current.add(controller);

    if (externalSignal) {
      if (externalSignal.aborted) {
        controller.abort();
      } else {
        externalSignal.addEventListener('abort', () => controller.abort(), { once: true });
      }
    }

    return controller;
  }, []);

  const releaseController = useCallback((controller) => {
    if (controller) {
      activeControllersRef.current.delete(controller);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // M9: Abort all in-flight requests across all call sites on unmount to prevent setting state after unmount
      for (const ctrl of activeControllersRef.current) {
        try {
          ctrl.abort();
        } catch {}
      }
      activeControllersRef.current.clear();
    };
  }, []);

  // Memoize getHeaders with user so callback references remain stable and up-to-date
  const getHeaders = useCallback(() => {
    return buildAuthHeaders(user);
  }, [user]);

  const refreshBalance = useCallback(async (signal) => {
    if (!userId) return;
    const ctrl = createManagedSignal(signal);
    try {
      const res = await authFetch(`${API_URL}/api/coins/balance`, {
        headers: getHeaders(),
        signal: ctrl.signal,
      });
      if (res.ok) {
        const data = await res.json();
        if (isMountedRef.current) {
          setCoins(data.coins || 0);
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Failed to fetch coin balance:', err);
    } finally {
      releaseController(ctrl);
    }
  }, [userId, getHeaders, createManagedSignal, releaseController]);

  const earnCoins = useCallback(async (amount = 5, description = 'Problem solved', signal) => {
    if (!userId) return null;
    if (isMountedRef.current) setLoading(true);
    const ctrl = createManagedSignal(signal);
    try {
      const res = await authFetch(`${API_URL}/api/coins/earn`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ amount, description }),
        signal: ctrl.signal,
      });
      if (res.ok) {
        const data = await res.json();
        if (isMountedRef.current) {
          setCoins(data.coins);
        }
        return data;
      }
      return null;
    } catch (err) {
      if (err.name === 'AbortError') return null;
      console.error('Failed to earn coins:', err);
      return null;
    } finally {
      releaseController(ctrl);
      if (isMountedRef.current) setLoading(false);
    }
  }, [userId, getHeaders, createManagedSignal, releaseController]);

  const spendCoins = useCallback(async (amount = 5, description = 'AI assistant query', signal) => {
    if (!userId) return null;
    if (isMountedRef.current) setLoading(true);
    const ctrl = createManagedSignal(signal);
    try {
      const res = await authFetch(`${API_URL}/api/coins/spend`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ amount, description }),
        signal: ctrl.signal,
      });
      const data = await res.json();
      if (res.ok) {
        if (isMountedRef.current) {
          setCoins(data.coins);
        }
        return { success: true, ...data };
      }
      return { success: false, ...data };
    } catch (err) {
      if (err.name === 'AbortError') return { success: false, aborted: true };
      console.error('Failed to spend coins:', err);
      return { success: false, error: err.message };
    } finally {
      releaseController(ctrl);
      if (isMountedRef.current) setLoading(false);
    }
  }, [userId, getHeaders, createManagedSignal, releaseController]);

  const fetchCoinHistory = useCallback(async ({ page = 1, limit = 20, type = '', search = '', signal } = {}) => {
    if (!userId) return { items: [] };

    if (isMountedRef.current) setHistoryLoading(true);
    const ctrl = createManagedSignal(signal);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        detailed: '1',
      });

      if (type) params.set('type', type);
      if (search) params.set('q', search);

      const res = await authFetch(`${API_URL}/api/coins/history?${params.toString()}`, {
        headers: getHeaders(),
        signal: ctrl.signal,
      });

      const data = await res.json();
      if (!res.ok) {
        return { items: [], error: data?.error || 'Failed to load coin history' };
      }

      const payload = Array.isArray(data)
        ? { items: data, page: 1, limit: data.length, total: data.length, hasMore: false }
        : data;

      if (isMountedRef.current) {
        setHistory(payload.items || []);
      }
      return payload;
    } catch (err) {
      if (err.name === 'AbortError') return { items: [], aborted: true };
      console.error('Failed to fetch coin history:', err);
      return { items: [], error: err.message || 'Failed to load coin history' };
    } finally {
      releaseController(ctrl);
      if (isMountedRef.current) setHistoryLoading(false);
    }
  }, [userId, getHeaders, createManagedSignal, releaseController]);

  const fetchRedeemOptions = useCallback(async (signal) => {
    if (!userId) return [];

    const ctrl = createManagedSignal(signal);
    try {
      const res = await authFetch(`${API_URL}/api/coins/redeem-options`, {
        headers: getHeaders(),
        signal: ctrl.signal,
      });

      const data = await res.json();
      if (!res.ok) return [];

      const options = data?.options || [];
      if (isMountedRef.current) {
        setRedeemOptions(options);
      }
      return options;
    } catch (err) {
      if (err.name === 'AbortError') return [];
      console.error('Failed to fetch redeem options:', err);
      return [];
    } finally {
      releaseController(ctrl);
    }
  }, [userId, getHeaders, createManagedSignal, releaseController]);

  const redeemCoins = useCallback(async ({ optionId, quantity = 1, description = '', signal } = {}) => {
    if (!userId) return { success: false, error: 'Not authenticated' };

    if (isMountedRef.current) setLoading(true);
    const ctrl = createManagedSignal(signal);
    try {
      const res = await authFetch(`${API_URL}/api/coins/redeem`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ optionId, quantity, description }),
        signal: ctrl.signal,
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, ...data };
      }

      if (isMountedRef.current) {
        setCoins(data.coins);
      }
      return { success: true, ...data };
    } catch (err) {
      if (err.name === 'AbortError') return { success: false, aborted: true };
      console.error('Failed to redeem coins:', err);
      return { success: false, error: err.message || 'Failed to redeem coins' };
    } finally {
      releaseController(ctrl);
      if (isMountedRef.current) setLoading(false);
    }
  }, [userId, getHeaders, createManagedSignal, releaseController]);

  // Fetch balance and redeem options on mount and user change with AbortController and debouncing
  useEffect(() => {
    if (!userId) {
      setCoins(0);
      setHistory([]);
      setRedeemOptions([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      refreshBalance(controller.signal);
      fetchRedeemOptions(controller.signal);
    }, 50);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [userId, refreshBalance, fetchRedeemOptions]);

  return (
    <CoinContext.Provider value={{
      coins,
      loading,
      historyLoading,
      history,
      redeemOptions,
      earnCoins,
      spendCoins,
      redeemCoins,
      refreshBalance,
      fetchBalance: refreshBalance,
      fetchCoinHistory,
      fetchRedeemOptions,
    }}>
      {children}
    </CoinContext.Provider>
  );
}

export function useCoins() {
  const context = useContext(CoinContext);
  if (!context) {
    throw new Error('useCoins must be used within a CoinProvider');
  }
  return context;
}
