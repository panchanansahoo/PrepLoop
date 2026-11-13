import apiClient from "./apiClient";

export const communityApi = {
    /** GET /api/community/posts — discussion threads */
    async getDiscussions(params = {}) {
        const res = await apiClient.get("/api/community/posts", { params });
        return res.data;
    },

    /** GET /api/community/posts/:id/replies — single thread with post details and replies */
    async getDiscussion(id) {
        try {
            const [postsRes, repliesRes] = await Promise.allSettled([
                apiClient.get("/api/community/posts"),
                apiClient.get(`/api/community/posts/${id}/replies`),
            ]);

            let post = null;
            if (postsRes.status === "fulfilled") {
                const list = Array.isArray(postsRes.value.data)
                    ? postsRes.value.data
                    : postsRes.value.data?.posts || postsRes.value.data?.data || [];
                post = list.find((p) => String(p.id) === String(id));
            }

            const comments =
                repliesRes.status === "fulfilled"
                    ? repliesRes.value.data?.replies || repliesRes.value.data || []
                    : [];

            return {
                id,
                title: post?.title || "",
                content: post?.content || "",
                author: post?.author || post?.author_name || "Anonymous",
                created_at: post?.created_at || new Date().toISOString(),
                comments,
            };
        } catch {
            return { id, comments: [] };
        }
    },

    /** POST /api/community/posts — create discussion */
    async createDiscussion(data) {
        const res = await apiClient.post("/api/community/posts", data);
        return res.data;
    },

    /** POST /api/community/posts/:id/reply — add comment */
    async addComment(id, content) {
        const res = await apiClient.post(`/api/community/posts/${id}/reply`, {
            content,
        });
        return res.data;
    },

    /** POST /api/community/posts/:id/like — upvote/like */
    async vote(id) {
        const res = await apiClient.post(`/api/community/posts/${id}/like`);
        return res.data;
    },
};
