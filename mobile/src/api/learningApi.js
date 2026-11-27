import apiClient from "./apiClient";

export function resolveLearningTrack(topicId, pathType) {
    if (pathType && ["dsa", "hr", "system-design", "technical"].includes(pathType)) {
        return pathType;
    }
    const id = String(topicId || "").toLowerCase();
    if (/^hr\d+/.test(id)) return "hr";
    if (/^sd\d+/.test(id)) return "system-design";
    if (/^tech\d+/.test(id)) return "technical";
    return "dsa";
}

export function normalizeLearningModules(payload) {
    const rawList = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.modules)
            ? payload.modules
            : [];

    return rawList.map((mod) => {
        const totalTopics =
            Number(
                mod.total_topics ??
                    mod.progress?.total ??
                    (Array.isArray(mod.topics) ? mod.topics.length : undefined) ??
                    mod.problemCount ??
                    0,
            ) || 0;
        const completedTopics =
            Number(
                mod.completed_topics ??
                    mod.progress?.solved ??
                    (mod.completed ? totalTopics : 0),
            ) || 0;

        return {
            ...mod,
            slug: mod.slug || (mod.id != null ? String(mod.id) : undefined),
            completed_topics: completedTopics,
            total_topics: totalTopics,
            completed: Boolean(
                mod.completed || (totalTopics > 0 && completedTopics >= totalTopics),
            ),
        };
    });
}

export const learningApi = {
    /** GET /api/user/learning-path/dsa — normalized DSA learning path modules */
    async getDSAPath() {
        const res = await apiClient.get("/api/user/learning-path/dsa");
        return normalizeLearningModules(res.data);
    },

    /** GET /api/user/learning-path/:track — HR, System Design, or Technical path modules */
    async getTrackPath(track) {
        const res = await apiClient.get(
            `/api/user/learning-path/${encodeURIComponent(track)}`,
        );
        return normalizeLearningModules(res.data);
    },

    async getHRPath() {
        return this.getTrackPath("hr");
    },

    async getSystemDesignLearningPath() {
        return this.getTrackPath("system-design");
    },

    async getTechnicalPath() {
        return this.getTrackPath("technical");
    },

    /** GET /api/user/learning-paths — all available learning paths */
    async getAllLearningPaths() {
        const res = await apiClient.get("/api/user/learning-paths");
        return res.data;
    },

    /** Fetch single topic/module content across DSA, HR, System Design, and Technical paths */
    async getTopic(topicId, pathType) {
        if (!topicId) {
            throw new Error("Topic ID is required");
        }
        const track = resolveLearningTrack(topicId, pathType);
        const encodedId = encodeURIComponent(String(topicId));
        const res = await apiClient.get(
            `/api/user/learning-path/${track}/module/${encodedId}`,
        );
        return res.data;
    },

    /** Backward-compatible topic lookup (routes by explicit or prefixed track) */
    async getDSATopic(topicId, pathType) {
        return this.getTopic(topicId, pathType);
    },

    /** GET /api/user/learning-paths/:topicId — topic progress */
    async getTopicProgress(topicId) {
        const res = await apiClient.get(
            `/api/user/learning-paths/${encodeURIComponent(String(topicId))}`,
        );
        return res.data;
    },

    /** POST /api/user/learning-paths/:topicId/complete — mark complete */
    async markTopicComplete(topicId) {
        const res = await apiClient.post(
            `/api/user/learning-paths/${encodeURIComponent(String(topicId))}/complete`,
        );
        return res.data;
    },

    /** GET /api/system-design/topics — system design topics */
    async getSystemDesignPath() {
        const res = await apiClient.get("/api/system-design/topics");
        return res.data;
    },

    /** GET /api/system-design/topics/:topicId — single system design topic */
    async getSystemDesignTopic(topicId) {
        const res = await apiClient.get(`/api/system-design/topics/${topicId}`);
        return res.data;
    },
};
