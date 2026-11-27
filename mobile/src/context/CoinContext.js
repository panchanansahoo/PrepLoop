/**
 * PrepLoop Mobile — Coin Context
 *
 * Mirrors the web's CoinProvider/CoinContext.
 * Provides global coin balance state with auto-refresh on navigation focus.
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { coinsApi } from "../api/coinsApi";
import { cache, CACHE_KEYS, CACHE_TTL, accountCacheKey } from "../utils/cache";

import { useAuth } from "./AuthContext";

const CoinContext = createContext(null);

export function CoinProvider({ children }) {
    const { user } = useAuth();
    return <AccountCoinProvider key={user?.id || "guest"} userId={user?.id}>{children}</AccountCoinProvider>;
}

function AccountCoinProvider({ userId, children }) {
    const balanceKey = accountCacheKey(userId, CACHE_KEYS.COIN_BALANCE);
    const active = useRef(false);
    useEffect(() => {
        active.current = true;
        return () => { active.current = false; };
    }, []);
    const [balance, setBalance] = useState(null);
    const [totalEarned, setTotalEarned] = useState(null);
    const [totalSpent, setTotalSpent] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [transactions, setTransactions] = useState([]);

    /**
     * Refresh balance from API (with cache).
     * Can be called from any screen via useFocusEffect.
     */
    const refreshBalance = useCallback(async (forceRefresh = false) => {
        if (!userId) return;
        setLoading(true);
        setError(null);
        try {
            const applyData = (payload) => {
                if (!active.current || !payload) return;
                setBalance(payload.balance);
                if (payload.totalEarned != null) setTotalEarned(payload.totalEarned);
                if (payload.totalSpent != null) setTotalSpent(payload.totalSpent);
            };
            const data = await cache.fetchWithCache(
                balanceKey,
                async () => {
                    const result = await coinsApi.getBalance();
                    if (!active.current) throw new Error("Account changed");
                    return result;
                },
                CACHE_TTL.SHORT,
                applyData,
                { forceRefresh },
            );
            applyData(data);
        } catch (err) {
            if (active.current) {
                setError(err?.message || "Failed to load coin balance");
            }
        } finally {
            if (active.current) setLoading(false);
        }
    }, [balanceKey, userId]);

    /**
     * Fetch transaction history (paginated).
     */
    const refreshTransactions = useCallback(async (page = 1) => {
        if (!userId) return [];
        try {
            const data = await coinsApi.getTransactions(page);
            if (active.current) setTransactions(data);
            return data;
        } catch {
            return [];
        }
    }, [userId]);

    /**
     * Spend coins (optimistic UI update + API call).
     * @param {number} amount - Coins to spend
     * @param {string} reason - Spend reason (for logging)
     * @returns {boolean} true if successful
     */
    const spendCoins = useCallback(
        async (amount, reason) => {
            if (!userId || (balance !== null && balance < amount)) {
                return false; // Insufficient balance
            }

            // Optimistic update
            setBalance((prev) => (prev !== null ? prev - amount : prev));

            try {
                await coinsApi.spendCoins(amount, reason);
                // Invalidate cache so next refresh gets fresh data
                await cache.invalidate(balanceKey);
                return true;
            } catch {
                // Revert optimistic update
                setBalance((prev) => (prev !== null ? prev + amount : prev));
                return false;
            }
        },
        [balance, balanceKey, userId],
    );

    return (
        <CoinContext.Provider
            value={{
                balance,
                totalEarned,
                totalSpent,
                loading,
                error,
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
