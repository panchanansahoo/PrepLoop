import apiClient from "./apiClient";

// Map mobile UI interview type IDs to backend valid types
const TYPE_MAP = {
    technical: "technical",
    hr: "behavioral",
    system_design: "system-design",
    dsa: "dsa",
    behavioral: "behavioral",
    mixed: "mixed",
    coding: "coding",
};

export const interviewApi = {
    /**
     * Start a new interview session.
     * Returns { questions: string[], firstQuestion: string }
     * Backend is stateless — no sessionId returned.
     */
    async startSession({ type = "technical", difficulty = "medium" } = {}) {
        const backendType = TYPE_MAP[type] || type;
        const res = await apiClient.post("/api/ai/interview/start", {
            type: backendType,
            difficulty,
        });
        return res.data; // { questions, firstQuestion, question }
    },

    /**
     * Get the next question given previous responses.
     * @param {string} type - interview type (mobile id)
     * @param {string} difficulty - 'easy'|'medium'|'hard'
     * @param {Array<{question: string, answer: string}>} previousResponses
     */
    async getNextQuestion(type, difficulty = "medium", previousResponses = []) {
        const backendType = TYPE_MAP[type] || type;
        const res = await apiClient.post("/api/ai/interview/next-question", {
            type: backendType,
            difficulty,
            previousResponses,
        });
        // Backend returns the next question as a string or object
        return res.data; // question string or { question }
    },

    /**
     * Complete the interview and get scores.
     * @param {string} type - mobile type id
     * @param {string} difficulty
     * @param {number} durationSeconds
     * @param {Array<{question: string, answer: string}>} responses
     * Returns { interviewId, scores: { overall, communication, technical, problemSolving } }
     */
    async completeInterview(
        type,
        difficulty = "medium",
        durationSeconds = 0,
        responses = [],
    ) {
        const backendType = TYPE_MAP[type] || type;
        const res = await apiClient.post("/api/ai/interview/complete", {
            type: backendType,
            difficulty,
            duration: durationSeconds,
            responses,
        });
        return res.data; // { interviewId, scores }
    },

    /**
     * Get interview history.
     * Returns array of interview records.
     */
    async getHistory() {
        const res = await apiClient.get("/api/ai/interview/history");
        // Backend returns { interviews: [...] }
        const data = res.data;
        return Array.isArray(data)
            ? data
            : data.interviews || data.sessions || data.data || [];
    },

    /**
     * Get a specific interview by id.
     */
    async getInterviewById(id) {
        const res = await apiClient.get(`/api/ai/interview/${id}`);
        return res.data;
    },

    /**
     * Get feedback for a completed interview.
     */
    async getFeedbackForInterview(id) {
        const res = await apiClient.get(`/api/ai/interview/${id}/feedback`);
        return res.data;
    },

    /**
     * Submit feedback for a single question answer.
     */
    async submitQuestionFeedback(interviewId, questionIndex, answerText) {
        const res = await apiClient.post(
            `/api/ai/interview/${interviewId}/feedback`,
            {
                questionIndex,
                answerText,
            },
        );
        return res.data;
    },

    /**
     * Get interview analytics.
     */
    async getAnalytics() {
        const res = await apiClient.get("/api/analytics/overview");
        return res.data;
    },

    /**
     * Get company list for company-specific interviews.
     */
    async getCompanies() {
        try {
            const res = await apiClient.get("/api/company-interview/companies");
            return res.data;
        } catch {
            return [];
        }
    },
};
