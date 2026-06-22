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
};
