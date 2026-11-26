import apiClient from "./apiClient";

export const sqlApi = {
    async getProblems() {
        const { data } = await apiClient.get("/api/practice/sql/problems");
        return Array.isArray(data?.problems) ? data.problems : [];
    },
    async getProblem(id) {
        const { data } = await apiClient.get(`/api/practice/sql/problems/${encodeURIComponent(id)}`);
        if (!data?.problem) {
            throw new Error("SQL problem not found");
        }
        return data.problem;
    },
    async runQuery(code, schemaId) {
        const { data } = await apiClient.post("/api/practice/execute", { code, language: "sql", schemaId });
        return data;
    },
};
