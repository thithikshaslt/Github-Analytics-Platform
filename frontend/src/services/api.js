import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:15000', 
  timeout: 5000, // 15-second timeout to avoid hanging
});

export const getUser = (username) => {
  return api.get(`/users/${username}`);
};

export const getRepos = (username) => {
  return api.get(`/repos/${username}`);
};

export const getCommits = (owner, repo) => {
  return api.get(`/commits/${owner}/`);
};

export const getPulls = (owner, repo) => {
  return api.get(`/github/pulls/${owner}/${repo}`);
};

export default api;