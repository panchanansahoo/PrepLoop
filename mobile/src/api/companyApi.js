import apiClient from "./apiClient";

export const companyApi = {
    /** GET /api/company-interview/companies — get list of companies */
    async getCompanies() {
        const res = await apiClient.get("/api/company-interview/companies");
        return res.data;
    },

    /** GET /api/company-interview/companies/:id — get company details and questions */
    async getCompanyDetails(id) {
        const res = await apiClient.get(`/api/company-interview/companies/${id}`);
        return res.data;
    },
    
    /** GET /api/company-interview/questions — get all company questions */
    async getQuestions(params = {}) {
        const res = await apiClient.get("/api/company-interview/questions", { params });
        return res.data;
    }
};
