import apiClient from "./apiClient";

export const learningApi = {
    /** GET /api/dsa/learning-path — DSA learning path topics */
    async getDSAPath() {
        const res = await apiClient.get("/api/dsa/learning-path");
        return res.data;
    },

    /** GET /api/dsa/learning-path/:topicId — single DSA topic content */
    async getDSATopic(topicId) {
        const res = await apiClient.get(`/api/dsa/learning-path/${topicId}`);
        return res.data;
    },

    /** GET /api/dsa/learning-path/:topicId/progress — topic progress */
    async getTopicProgress(topicId) {
        const res = await apiClient.get(
            `/api/dsa/learning-path/${topicId}/progress`,
        );
        return res.data;
    },

    /** POST /api/dsa/learning-path/:topicId/complete — mark complete */
    async markTopicComplete(topicId) {
        const res = await apiClient.post(
            `/api/dsa/learning-path/${topicId}/complete`,
        );
        return res.data;
    },

    /** GET /api/system-design — system design topics */
    async getSystemDesignPath() {
        const res = await apiClient.get("/api/system-design");
        return res.data;
    },

    /** GET /api/system-design/:topicId — single system design topic */
    async getSystemDesignTopic(topicId) {
        const res = await apiClient.get(`/api/system-design/${topicId}`);
        return res.data;
    },
};
