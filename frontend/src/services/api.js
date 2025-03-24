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

