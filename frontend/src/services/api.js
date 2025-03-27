import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000',
});

export const getUser = (username) => api.get(`/users/${username}`);
export const getRepos = (username) => api.get(`/repos/${username}`);
export const getCommitsTotal = (username) => api.get(`/commits/${username}/total`);
export const syncCommits = (username) => api.post(`/commits/sync/${username}`);
export const getCommits = (username, page = 1, perPage = 20) =>
  api.get(`/commits/${username}`, { params: { page, perPage } });

export const getPRsTotal = (username) => api.get(`/prs/${username}/total`);
export const syncPRs = (username) => api.post(`/prs/sync/${username}`);
export const getPRs = (username, page = 1, perPage = 20) =>
  api.get(`/prs/${username}`, { params: { page, perPage } });

export const getRepoCommitsTotal = (username, repoId) =>
  api.get(`/commits/${username}/repo/${repoId}/total`);
export const getRepoPRsTotal = (username, repoId) =>
  api.get(`/prs/${username}/repo/${repoId}/total`);