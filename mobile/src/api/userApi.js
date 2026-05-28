import apiClient from "./apiClient";

export const userApi = {
    /**
     * GET /api/user/profile
     * Returns { user: { id, email, full_name, subscription_tier, experience_level, role, coins, ... } }
     */
    async getProfile() {
        const res = await apiClient.get("/api/user/profile");
        return res.data.user || res.data;
    },

    /**
     * PUT /api/user/profile
     * Accepts camelCase fields — normalizeProfileUpdatePayload handles the mapping.
     * { fullName, experienceLevel, bio, skills, ... }
     */
    async updateProfile(data) {
        const res = await apiClient.put("/api/user/profile", data);
        return res.data.user || res.data;
    },

    /**
     * GET /api/activity/weekly
     * Returns array of { date, seconds_active } for the last 7 days.
     */
    async getActivity() {
        const res = await apiClient.get("/api/activity/weekly");
        return res.data;
    },

    /**
     * Build dashboard stats from multiple real endpoints.
     * - totalInterviews from /api/ai/interview/history
     * - currentStreak from /api/activity/weekly (counts active days)
     * - problemsSolved from /api/dsa/progress → stats.total_solved
     *
     * All fields degrade to null if their endpoint fails (Promise.allSettled).
     */
    async getDashboardStats() {
        const results = await Promise.allSettled([
            apiClient.get("/api/ai/interview/history"),
            apiClient.get("/api/activity/weekly"),
            apiClient.get("/api/dsa/progress"),
        ]);

        const [historyRes, activityRes, progressRes] = results;

        // Interview count
        let totalInterviews = null;
        if (historyRes.status === "fulfilled") {
            const d = historyRes.value.data;
            const list = Array.isArray(d) ? d : d.interviews || d.data || [];
            totalInterviews = list.length;
        }

        // Streak: count days with any activity this week
        let currentStreak = null;
        if (activityRes.status === "fulfilled") {
            const d = activityRes.value.data;
            if (Array.isArray(d)) {
                currentStreak = d.filter(
                    (day) => (day.seconds_active || 0) > 0,
                ).length;
            } else {
                currentStreak = d?.streak ?? d?.currentStreak ?? null;
            }
        }

        // Problems solved from /api/dsa/progress → { stats: { total_solved } }
        let problemsSolved = null;
        if (progressRes.status === "fulfilled") {
            const d = progressRes.value.data;
            // Backend returns { stats: { total_solved, problems_solved, ... }, recentActivity }
            problemsSolved =
                d?.stats?.total_solved ??
                d?.stats?.problems_solved ??
                d?.total_solved ??
                null;
        }

        return { totalInterviews, currentStreak, problemsSolved };
    },

    /**
     * GET /api/activity/weekly
     */
    async getStreak() {
        const res = await apiClient.get("/api/activity/weekly");
        return res.data;
    },
};
