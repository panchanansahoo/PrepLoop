import apiClient from './apiClient';

export const studyNotesApi = {
  /**
   * Fetch structured study notes markdown synthesized from an interview session
   */
  async getStudyNotes(interviewId) {
    const res = await apiClient.get(`/api/interview/${interviewId}/study-notes`);
    return res.data;
  },
};

