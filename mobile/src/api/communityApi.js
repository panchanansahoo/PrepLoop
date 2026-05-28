import apiClient from "./apiClient";

export const communityApi = {
    /** GET /api/community — discussion threads */
    async getDiscussions(params = {}) {
        const res = await apiClient.get("/api/community", { params });
        return res.data;
    },

    /** GET /api/community/:id — single thread */
    async getDiscussion(id) {
        const res = await apiClient.get(`/api/community/${id}`);
        return res.data;
    },

    /** POST /api/community — create discussion */
    async createDiscussion(data) {
        const res = await apiClient.post("/api/community", data);
        return res.data;
    },

    /** POST /api/community/:id/comment — add comment */
    async addComment(id, content) {
        const res = await apiClient.post(`/api/community/${id}/comment`, {
            content,
        });
        return res.data;
    },

    /** POST /api/community/:id/vote — upvote/downvote */
    async vote(id, direction) {
        const res = await apiClient.post(`/api/community/${id}/vote`, {
            direction,
        });
        return res.data;
    },
};
