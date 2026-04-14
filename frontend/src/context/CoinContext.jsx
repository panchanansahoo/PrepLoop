import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { buildAuthHeaders } from '../utils/authHeaders';

const API_URL = import.meta.env.VITE_API_URL || '';

const CoinContext = createContext();

export function CoinProvider({ children }) {
  const { user } = useAuth();
  const [coins, setCoins] = useState(0);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [redeemOptions, setRedeemOptions] = useState([]);

  // Fix #9: memoize getHeaders so useCallback deps are stable
  const getHeaders = useCallback(() => {
    return buildAuthHeaders(user);
  }, [user]);

  const refreshBalance = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/api/coins/balance`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setCoins(data.coins || 0);
      }
    } catch (err) {
      console.error('Failed to fetch coin balance:', err);
    }
  }, [user]);

  const earnCoins = useCallback(async (amount = 5, description = 'Problem solved') => {
    if (!user) return null;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/coins/earn`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ amount, description }),
      });
      if (res.ok) {
        const data = await res.json();
        setCoins(data.coins);
        return data;
      }
      return null;
    } catch (err) {
      console.error('Failed to earn coins:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const spendCoins = useCallback(async (amount = 5, description = 'AI assistant query') => {
    if (!user) return null;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/coins/spend`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ amount, description }),
      });
      const data = await res.json();
      if (res.ok) {
        setCoins(data.coins);
        return { success: true, ...data };
      }
      return { success: false, ...data };
    } catch (err) {
      console.error('Failed to spend coins:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchCoinHistory = useCallback(async ({ page = 1, limit = 20, type = '', search = '' } = {}) => {
    if (!user) return { items: [] };

    setHistoryLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        detailed: '1',
      });

      if (type) params.set('type', type);
      if (search) params.set('q', search);

      const res = await fetch(`${API_URL}/api/coins/history?${params.toString()}`, {
        headers: getHeaders(),
      });

      const data = await res.json();
      if (!res.ok) {
        return { items: [], error: data?.error || 'Failed to load coin history' };
      }

      const payload = Array.isArray(data)
        ? { items: data, page: 1, limit: data.length, total: data.length, hasMore: false }
        : data;

      setHistory(payload.items || []);
      return payload;
    } catch (err) {
      console.error('Failed to fetch coin history:', err);
      return { items: [], error: err.message || 'Failed to load coin history' };
    } finally {
      setHistoryLoading(false);
    }
  }, [user]);

  const fetchRedeemOptions = useCallback(async () => {
    if (!user) return [];

    try {
      const res = await fetch(`${API_URL}/api/coins/redeem-options`, {
        headers: getHeaders(),
      });

      const data = await res.json();
      if (!res.ok) return [];

      const options = data?.options || [];
      setRedeemOptions(options);
      return options;
    } catch (err) {
      console.error('Failed to fetch redeem options:', err);
      return [];
    }
  }, [user]);

  const redeemCoins = useCallback(async ({ optionId, quantity = 1, description = '' }) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/coins/redeem`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ optionId, quantity, description }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, ...data };
      }

      setCoins(data.coins);
      return { success: true, ...data };
    } catch (err) {
      console.error('Failed to redeem coins:', err);
      return { success: false, error: err.message || 'Failed to redeem coins' };
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch balance on mount and user change
  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  useEffect(() => {
    if (!user) {
      setHistory([]);
      setRedeemOptions([]);
      return;
    }

    fetchRedeemOptions();
  }, [user, fetchRedeemOptions]);

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
