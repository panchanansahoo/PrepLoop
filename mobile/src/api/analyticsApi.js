import apiClient from "./apiClient";

export const analyticsApi = {
    /** GET /api/analytics/overview — interview performance trends */
    async getOverview() {
        const res = await apiClient.get("/api/analytics/overview");
        return res.data;
    },

    /** GET /api/recommendations — AI-powered improvement suggestions */
    async getRecommendations() {
        const res = await apiClient.get("/api/recommendations");
        return res.data;
    },

    /** GET /api/career/analytics — career readiness metrics */
    async getCareerAnalytics() {
        const res = await apiClient.get("/api/career/analytics");
        return res.data;
    },

    /** GET /api/improvement-plan/latest — user's latest improvement plan */
    async getImprovementPlan() {
        const res = await apiClient.get("/api/improvement-plan/latest");
        const row =
            res.data?.data !== undefined
                ? res.data.data
                : (res.data?.plan ?? res.data);
        if (!row) return null;
        return row?.plan_data || row;
    },
};
