import apiClient from './client';

export async function importPortfolioProfile(payload) {
  const response = await apiClient.post('/api/portfolio/profiles/import', payload);
  return response.data;
}

export async function uploadResumeForPortfolio(file) {
  const form = new FormData();
  form.append('resume', file);
  const response = await apiClient.post('/api/portfolio/profiles/import-resume', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function parseLinkedinExport(exportText) {
  const response = await apiClient.post('/api/portfolio/profiles/parse-linkedin', { exportText });
  return response.data?.parsed || null;
}

export async function updatePortfolioProfile(profileId, payload) {
  const response = await apiClient.put(`/api/portfolio/profiles/${profileId}`, payload);
  return response.data;
}

export async function createPortfolioSite(payload) {
  const response = await apiClient.post('/api/portfolio/sites', payload);
  return response.data;
}

export async function listPortfolioSites() {
  const response = await apiClient.get('/api/portfolio/sites');
  return response.data?.sites || [];
}
