import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000', 
  timeout: 15000, // 15-second timeout to avoid hanging
});

export const syncCommits = (username) => api.post(`/commits/sync/${username}`);
export const getCommitsTotal = (username) => api.get(`/commits/${username}/total`);
export const getUser = (username) => {
  return api.get(`/users/${username}`);
};

export const getRepos = (username) => {
  return api.get(`/repos/${username}`);
};

export const getCommits = (owner, repo) => {
  return api.get(`/commits/${owner}`);
};

export const getPulls = (owner, repo) => {
  return api.get(`/github/pulls/${owner}/${repo}`);
};

export default api;