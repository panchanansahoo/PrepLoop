import apiClient from "./apiClient";

export function normalizePost(post) {
    if (!post || typeof post !== "object") return post;
    const replyCount =
        post.reply_count ??
        post.replies_count ??
        post.comments_count ??
        post.community_replies?.[0]?.count ??
        (typeof post.replies === "number" ? post.replies : 0);

    return {
        ...post,
        author_name: post.author_name || post.profiles?.full_name || post.author || "Anonymous",
        likes: post.likes ?? post.upvotes ?? post.votes ?? 0,
        reply_count: replyCount,
    };
}

export function normalizeReply(reply) {
    if (!reply || typeof reply !== "object") return reply;
    return {
        ...reply,
        author_name: reply.author_name || reply.profiles?.full_name || reply.author || "User",
    };
}

export const communityApi = {
    /** GET /api/community/posts — discussion threads */
    async getDiscussions(params = {}) {
        const res = await apiClient.get("/api/community/posts", { params });
        const data = res.data;
        if (Array.isArray(data)) {
            return data.map(normalizePost);
        }
        if (Array.isArray(data?.posts)) {
            return { ...data, posts: data.posts.map(normalizePost) };
        }
        return data;
    },

    async getDiscussion(id) {
        if (id === undefined || id === null || String(id).trim() === "") {
            throw new Error("Discussion ID is required");
        }
        const path = `/api/community/posts/${encodeURIComponent(id)}`;
        const [post, replies] = await Promise.all([
            apiClient.get(path),
            apiClient.get(`${path}/replies`),
        ]);
        const postData = post.data?.post || (post.data?.id ? post.data : null);
        if (!postData) {
            throw new Error("Discussion not found");
        }
        const replyList = Array.isArray(replies.data?.replies)
            ? replies.data.replies
            : Array.isArray(replies.data)
            ? replies.data
            : [];
        return {
            ...normalizePost(postData),
            comments: replyList.map(normalizeReply),
        };
    },

    /** POST /api/community/posts — create discussion */
    async createDiscussion(data) {
        const res = await apiClient.post("/api/community/posts", data);
        if (res.data?.post) {
            return { ...res.data, post: normalizePost(res.data.post) };
        }
        return res.data;
    },

    /** POST /api/community/posts/:id/reply — add comment */
    async addComment(id, content) {
        const res = await apiClient.post(`/api/community/posts/${encodeURIComponent(id)}/reply`, {
            content,
        });
        if (res.data?.reply) {
            return { ...res.data, reply: normalizeReply(res.data.reply) };
        }
        return res.data;
    },

    /** POST /api/community/posts/:id/like — upvote/like */
    async vote(id) {
        const res = await apiClient.post(`/api/community/posts/${encodeURIComponent(id)}/like`);
        return res.data;
    },
};
