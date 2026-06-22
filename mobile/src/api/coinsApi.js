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
};
