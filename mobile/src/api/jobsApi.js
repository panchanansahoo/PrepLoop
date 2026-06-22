import apiClient from "./apiClient";

export const jobsApi = {
    /**
     * GET /api/jobs
     * Query params: { query, location, category, type, search, page, limit, source }
     * Returns { jobs, total, page, totalPages, hasExternalApi, cached, rateLimit }
     */
    async getJobs(params = {}) {
        const res = await apiClient.get("/api/jobs", { params });
        return res.data;
    },

    /**
     * Search jobs using the main GET /api/jobs endpoint with a `search` query param.
     * (There is no dedicated /search route — search is via the main listing endpoint.)
     */
    async searchJobs(query, location = "") {
        const params = { search: query };
        if (location) params.location = location;
        const res = await apiClient.get("/api/jobs", { params });
        return res.data;
    },
};
