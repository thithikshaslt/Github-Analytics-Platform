import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000',
});
export const getIntelligenceHealth = () => api.get('/intelligence/health');

export const registerRepository = (payload) =>
  api.post('/intelligence/repositories', payload);

export const listRepositories = () =>
  api.get('/intelligence/repositories');

export const getRepository = (repoId) =>
  api.get(`/intelligence/repositories/${repoId}`);

export const createAnalysis = (repositoryId) =>
  api.post('/intelligence/analyses', { repositoryId });

export const getAnalysis = (analysisId) =>
  api.get(`/intelligence/analyses/${analysisId}`);

export const getLatestRepoAnalysis = (repoId) =>
  api.get(`/intelligence/repositories/${repoId}/analyses/latest`);

export const listRepoAnalyses = (repoId) =>
  api.get(`/intelligence/repositories/${repoId}/analyses`);

export const askCodebaseQuestion = (repositoryId, question) =>
  api.post('/intelligence/qa', { repositoryId, question });

export const listRepoQA = (repoId) =>
  api.get(`/intelligence/repositories/${repoId}/qa`);