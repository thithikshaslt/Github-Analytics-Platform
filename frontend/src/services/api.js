import axios from 'axios';

// Create an Axios instance with a base URL and configuration
const api = axios.create({
  baseURL: 'http://localhost:5000', // Your API Gateway URL
  timeout: 5000, // Optional: 5-second timeout to avoid hanging
});

// Function to fetch user data from the user-service via the API Gateway
export const getUser = (username) => {
  return api.get(`/users/${username}`);
};

// Placeholder functions for future endpoints
export const getRepos = (username) => {
  return api.get(`/repos/${username}`);
};

export const getCommits = (owner, repo) => {
  return api.get(`/github/commits/${owner}/${repo}`);
};

export const getPulls = (owner, repo) => {
  return api.get(`/github/pulls/${owner}/${repo}`);
};

// Export the Axios instance for flexibility (optional)
export default api;