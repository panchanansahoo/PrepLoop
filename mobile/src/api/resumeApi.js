import apiClient from "./apiClient";
import * as FileSystem from "expo-file-system";

export const resumeApi = {
    /**
     * Upload and analyze a resume.
     * POST /api/resume/analyze — multipart/form-data with 'resume' file field.
     * Returns { analysis: {...}, id, resumeText, resumeProfile }
     */
    async analyzeResume(fileUri) {
        // Build FormData with the file
        const filename = fileUri.split("/").pop() || "resume.pdf";
        const match = /\.(\w+)$/.exec(filename);
        const mimeType = match?.[1] === "pdf" ? "application/pdf" : "text/plain";

        const formData = new FormData();
        formData.append("resume", {
            uri: fileUri,
            name: filename,
            type: mimeType,
        });

        const res = await apiClient.post("/api/resume/analyze", formData, {
            headers: { "Content-Type": "multipart/form-data" },
            timeout: 60000, // 60s — AI analysis can be slow
        });
        return res.data;
    },

    /**
     * Analyze resume from pasted text.
     * POST /api/resume/analyze — JSON body with resumeText field.
     */
    async analyzeText(resumeText) {
        const res = await apiClient.post("/api/resume/analyze", { resumeText }, {
            timeout: 60000,
        });
        return res.data;
    },

    /**
     * Get resume analysis history.
     * GET /api/resume/history
     * Returns { analyses: [{ id, ats_score, analyzed_at }] }
     */
    async getHistory() {
        const res = await apiClient.get("/api/resume/history");
        return res.data?.analyses || res.data || [];
    },

    /**
     * Get latest resume analysis.
     * GET /api/resume/latest
     */
    async getLatest() {
        const res = await apiClient.get("/api/resume/latest");
        return res.data;
    },

    /**
     * Get a specific analysis by ID.
     * GET /api/resume/:id
     */
    async getAnalysis(id) {
        const res = await apiClient.get(`/api/resume/${id}`);
        return res.data;
    },
};
