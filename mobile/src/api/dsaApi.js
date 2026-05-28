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
        const res = await apiClient.get(`/api/dsa/problems/${id}`);
        return res.data;
    },

    /**
     * Get the daily challenge.
     * No dedicated endpoint — silently returns null (dashboard handles gracefully).
     */
    async getDailyChallenge() {
        // /api/user/daily-challenge returns { seed, dayOfYear, date } — not a problem object.
        // No mobile-usable daily challenge endpoint exists; return null gracefully.
        return null;
    },

    /**
     * Submit a solution via the practice endpoint.
     * POST /api/practice/submit — requires { problemId, code, language }
     */
    async submitSolution(problemId, code, language) {
        const res = await apiClient.post("/api/practice/submit", {
            problemId,
            code,
            language,
        });
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
        const res = await apiClient.get("/api/notes/bookmarks", {
            params: { type: "dsa" },
        });
        const bookmarks = res.data?.bookmarks || res.data || [];
        // Filter to the specific problem if provided
        if (problemId) {
            return bookmarks.filter(
                (b) =>
                    b.question_id === problemId || b.questionId === problemId,
            );
        }
        return bookmarks;
    },

    /**
     * Save a note for a problem (stored as a bookmark).
     * POST /api/notes/bookmark — requires { questionId, questionTitle, questionType, note }
     */
    async saveNote(problemId, content) {
        const res = await apiClient.post("/api/notes/bookmark", {
            questionId: problemId,
            questionTitle: `Problem ${problemId}`,
            questionType: "dsa",
            note: content,
        });
        return res.data;
    },
};
