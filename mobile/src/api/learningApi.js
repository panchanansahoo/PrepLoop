import apiClient from "./apiClient";

export const learningApi = {
    /** GET /api/user/learning-path/dsa — DSA learning path topics */
    async getDSAPath() {
        const res = await apiClient.get("/api/user/learning-path/dsa");
        return res.data;
    },

    /** GET /api/user/learning-paths — all available learning paths */
    async getAllLearningPaths() {
        const res = await apiClient.get("/api/user/learning-paths");
        return res.data;
    },

    /** GET /api/user/learning-path/dsa/module/:topicId — single DSA topic content */
    async getDSATopic(topicId) {
        const res = await apiClient.get(
            `/api/user/learning-path/dsa/module/${topicId}`,
        );
        return res.data;
    },

    /** GET /api/user/learning-paths/:topicId — topic progress */
    async getTopicProgress(topicId) {
        const res = await apiClient.get(
            `/api/user/learning-paths/${topicId}`,
        );
        return res.data;
    },

    /** POST /api/user/learning-paths/:topicId/complete — mark complete */
    async markTopicComplete(topicId) {
        const res = await apiClient.post(
            `/api/user/learning-paths/${topicId}/complete`,
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
