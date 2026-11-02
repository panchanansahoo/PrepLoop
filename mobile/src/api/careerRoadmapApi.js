import apiClient from './apiClient';

export const careerRoadmapApi = {
  /**
   * Fetch tailored 4-week preparation roadmap based on historical diagnostics
   */
  async getRoadmap(targetRole = 'Software Engineer', targetCompany = 'Top Tech') {
    const res = await apiClient.post('/api/career/roadmap', {
      targetRole,
      targetCompany,
    });
    return res.data?.roadmap || null;
  },

  /**
   * Generate custom prep plan by matching resume against a target JD
   */
  async generateJdPrepPlan(jobDescription, targetRole = 'Software Engineer', company = 'Target Company') {
    const res = await apiClient.post('/api/career/jd-prep-plan', {
      jobDescription,
      targetRole,
      company,
    });
    return res.data?.prepPlan || null;
  },
};

