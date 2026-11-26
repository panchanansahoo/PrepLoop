import apiClient from "./apiClient";

export const blogApi = {
    /** GET /api/blog — get all blog posts */
    async getPosts(params = {}) {
        const res = await apiClient.get("/api/blog", { params });
        return res.data;
    },

    /** GET /api/blog/:slug — get a single blog post by slug */
    async getPostBySlug(slug, source) {
        const params = { format: "mobile" };
        if (source) params.source = source;
        const res = await apiClient.get(`/api/blog/${encodeURIComponent(slug)}`, { params });
        return res.data;
    },
};
