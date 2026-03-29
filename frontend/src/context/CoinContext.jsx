import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';

const API_URL = import.meta.env.VITE_API_URL || '';

const CoinContext = createContext();

export function CoinProvider({ children }) {
  const { user } = useAuth();
  const [coins, setCoins] = useState(0);
  const [loading, setLoading] = useState(false);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

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

  const earnCoins = useCallback(async (amount = 10, description = 'Problem solved') => {
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

  // Fetch balance on mount and user change
  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  return (
    <CoinContext.Provider value={{ coins, loading, earnCoins, spendCoins, refreshBalance }}>
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
