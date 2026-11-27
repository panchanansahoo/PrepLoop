import { notesApi } from "./notesApi";
import apiClient from "./apiClient";

export const dsaApi = {
    /**
     * Get all DSA patterns with problem counts.
     * Backend returns { patterns: [{ id, name, ..., problem_count }] }
     */
    async getPatterns() {
        const res = await apiClient.get("/api/dsa/patterns");
        const data = res.data;
        return Array.isArray(data) ? data : data.patterns || data.data || [];
    },

    /**
     * Get problems for a specific pattern.
     * Uses GET /api/dsa/patterns/:id which returns { pattern, problems }.
     */
    async getProblems(params = {}) {
        const { patternId } = params;

        if (patternId) {
            try {
                const res = await apiClient.get(
                    `/api/dsa/patterns/${patternId}`,
                );
                const data = res.data;
                // Endpoint returns { pattern, problems }
                const problems = data?.problems || data?.data || [];
                return Array.isArray(problems) ? problems : [];
            } catch {
                return [];
            }
        }

        // Fallback — return patterns as a list
        const res = await apiClient.get("/api/dsa/patterns");
        const data = res.data;
        return Array.isArray(data) ? data : data.patterns || [];
    },

    /**
     * Get a single problem by id.
     * Returns { problem, exploration, userProgress }
     */
    async getProblemById(id) {
        const res = await apiClient.get(`/api/dsa/problems/${encodeURIComponent(id)}`);
        return res.data;
    },

    /**
     * Alias for getProblemById used by CodeEditor and SQLEditor screens.
     */
    async getProblemDetails(id) {
        const { problem } = await this.getProblemById(id);
        if (!problem) throw new Error("Problem details unavailable");
        return {
            ...problem,
            codeTemplates: problem.starter_code || problem.codeTemplates || {},
        };
    },

    /** Load the personalized DSA challenge shown on the dashboard. */
    async getDailyChallenge() {
        const { data } = await apiClient.get("/api/user/dashboard");
        if (data?.degraded) throw new Error("Daily challenge temporarily unavailable");
        const challenge = data?.dailyChallenge;
        const first = challenge?.dsa?.find((item) => item?.internalId || item?.id);
        const targetId = first?.internalId || first?.id;
        if (!targetId) return null;
        const problem = await this.getProblemDetails(targetId);
        return { ...problem, date: challenge.date, streak: data.streak };
    },

    /**
     * Submit a solution via the practice endpoint.
     * POST /api/practice/submit — requires { problemId, code, language }
     * Accepts either (problemId, code, language) or (problemId, { code, language }).
     */
    async submitSolution(problemId, codeOrPayload, maybeLanguage) {
        const payload =
            typeof codeOrPayload === "object" && codeOrPayload !== null
                ? {
                      problemId,
                      code: codeOrPayload.code,
                      language: codeOrPayload.language,
                  }
                : {
                      problemId,
                      code: codeOrPayload,
                      language: maybeLanguage,
                  };

        const res = await apiClient.post("/api/practice/submit", payload);
        return res.data;
    },

    /**
     * Get user DSA progress.
     * Returns { stats: { total_solved, problems_solved, easy_solved, medium_solved, hard_solved }, recentActivity }
     */
    async getUserProgress() {
        const res = await apiClient.get("/api/dsa/progress");
        return res.data;
    },

    /**
     * Get bookmarks for a problem (notes are stored as bookmarks in the backend).
     * GET /api/notes/bookmarks returns { bookmarks: [...] }
     */
    async getNotes(problemId) {
        return notesApi.getBookmarks(problemId == null ? {} : { type: "dsa", questionId: problemId });
    },

    async saveNote(problemId, content, title) {
        if (problemId == null || problemId === "") {
            throw new Error("Problem ID is required");
        }
        const updateExisting = async () => {
            const [existing] = await this.getNotes(problemId);
            return existing?.id != null
                ? notesApi.updateBookmarkNote(existing.id, { note: content })
                : null;
        };
        const updated = await updateExisting();
        if (updated) return updated;
        try {
            return await notesApi.addBookmark({
                questionId: problemId,
                questionTitle: title || `Problem ${problemId}`,
                questionType: "dsa",
                note: content,
            });
        } catch (error) {
            if (error.response?.data?.error !== "Already bookmarked") throw error;
            const retry = await updateExisting();
            if (retry) return retry;
            throw error;
        }
    },
};
