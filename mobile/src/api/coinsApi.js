import apiClient from "./apiClient";

export const coinsApi = {
    /**
     * Get current coin balance.
     * Returns { balance: N, totalEarned: null, totalSpent: null }
     * (normalized from backend's { coins: N } shape)
     */
    async getBalance() {
        const res = await apiClient.get("/api/coins/balance");
        // Backend returns { coins: N }
        const data = res.data;
        if (!data || typeof data !== "object" || data.degraded) {
            throw new Error("Coin balance unavailable");
        }
        return {
            balance: data?.coins ?? data?.balance ?? 0,
            totalEarned: data?.totalEarned ?? null,
            totalSpent: data?.totalSpent ?? null,
        };
    },

    /**
     * Get transaction history.
     * Returns array of transaction objects.
     */
    async getTransactions(page = 1, limit = 30) {
        const res = await apiClient.get("/api/coins/history", {
            params: { page, limit },
        });
        // Backend returns array directly (not detailed mode)
        const data = res.data;
        return Array.isArray(data)
            ? data
            : data.items || data.transactions || data.data || [];
    },

    async getWalletHistory(page = 1, limit = 30) {
        const { data } = await apiClient.get("/api/coins/history", {
            params: { detailed: 1, page, limit },
        });
        if (!Array.isArray(data?.items) || !data.summary || typeof data.summary !== "object") {
            throw new Error("Invalid wallet history");
        }
        return data;
    },

    /**
     * Spend coins.
     * POST /api/coins/spend — requires { amount, description }
     */
    async spendCoins(amount, description = "AI assistant query") {
        const res = await apiClient.post("/api/coins/spend", {
            amount,
            description,
        });
        return res.data;
    },
};
