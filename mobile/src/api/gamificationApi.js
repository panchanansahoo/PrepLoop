import apiClient from './apiClient';

export const gamificationApi = {
  /**
   * Get user streak, freeze token count, and unlocked badges
   */
  async getStatus() {
    const res = await apiClient.get('/api/gamification/status');
    return res.data;
  },

  /**
   * Record practice or interview activity to maintain streak
   */
  async recordActivity(activityType = 'practice') {
    const res = await apiClient.post('/api/gamification/activity', { activityType });
    return res.data;
  },

  /**
   * Purchase a streak freeze token with coins
   */
  async buyFreeze() {
    const res = await apiClient.post('/api/gamification/buy-freeze');
    return res.data;
  },
};

