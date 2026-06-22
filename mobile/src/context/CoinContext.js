/**
 * PrepLoop Mobile — Coin Context
 *
 * Mirrors the web's CoinProvider/CoinContext.
 * Provides global coin balance state with auto-refresh on navigation focus.
 */

import React, { createContext, useContext, useState, useCallback } from "react";
import { coinsApi } from "../api/coinsApi";
import { cache, CACHE_KEYS, CACHE_TTL } from "../utils/cache";

const CoinContext = createContext(null);

export function CoinProvider({ children }) {
    const [balance, setBalance] = useState(null);
    const [loading, setLoading] = useState(false);
    const [transactions, setTransactions] = useState([]);

    /**
     * Refresh balance from API (with cache).
     * Can be called from any screen via useFocusEffect.
     */
    const refreshBalance = useCallback(async () => {
        setLoading(true);
        try {
            const data = await cache.fetchWithCache(
                CACHE_KEYS.COIN_BALANCE,
                () => coinsApi.getBalance(),
                CACHE_TTL.SHORT,
                (fresh) => setBalance(fresh?.balance ?? fresh?.coins ?? 0),
            );
            setBalance(data?.balance ?? data?.coins ?? 0);
        } catch {
            // Silently fail — show cached or null
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Fetch transaction history (paginated).
     */
    const refreshTransactions = useCallback(async (page = 1) => {
        try {
            const data = await coinsApi.getTransactions(page);
            setTransactions(data?.transactions || []);
            return data;
        } catch {
            return { transactions: [] };
        }
    }, []);

    /**
     * Spend coins (optimistic UI update + API call).
     * @param {number} amount - Coins to spend
     * @param {string} reason - Spend reason (for logging)
     * @returns {boolean} true if successful
     */
    const spendCoins = useCallback(
        async (amount, reason) => {
            if (balance !== null && balance < amount) {
                return false; // Insufficient balance
            }

            // Optimistic update
            setBalance((prev) => (prev !== null ? prev - amount : prev));

            try {
                await coinsApi.spendCoins(amount, reason);
                // Invalidate cache so next refresh gets fresh data
                cache.invalidate(CACHE_KEYS.COIN_BALANCE);
                return true;
            } catch {
                // Revert optimistic update
                setBalance((prev) => (prev !== null ? prev + amount : prev));
                return false;
            }
        },
        [balance],
    );

    return (
        <CoinContext.Provider
            value={{
                balance,
                loading,
                transactions,
                refreshBalance,
                refreshTransactions,
                spendCoins,
            }}
        >
            {children}
        </CoinContext.Provider>
    );
}

/**
 * Hook: access global coin state.
 * Must be used within <CoinProvider>.
 */
export function useCoins() {
    const context = useContext(CoinContext);
    if (!context) {
        throw new Error("useCoins must be used within CoinProvider");
    }
    return context;
}
