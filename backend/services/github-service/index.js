const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5001;

const GITHUB_API = "https://api.github.com";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const getGitHubUser = async (username) => {
  try {
    const response = await axios.get(`${GITHUB_API}/users/${username}`, {
      headers: GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {},
    });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch GitHub user: ${error.message}`);
  }
};

const getUserRepositories = async (username) => {
  try {
    const response = await axios.get(`${GITHUB_API}/users/${username}/repos`, {
      headers: GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {},
    });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch repositories: ${error.message}`);
  }
};

const saveUserToUserService = async (userData) => {
  try {
    const response = await axios.post("http://localhost:5002/users", {
      githubId: userData.id.toString(),
      username: userData.login,
      name: userData.name,
      email: userData.email,
      avatarUrl: userData.avatar_url,
      bio: userData.bio,
      createdAt: new Date(),
    });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to save user: ${error.message}`);
  }
};

const saveRepoToRepoService = async (repoData, ownerGithubId) => {
  try {
    const response = await axios.post("http://localhost:5003/repos", {
      githubId: repoData.id,
      name: repoData.name,
      owner: ownerGithubId, // Use the user's githubId
      fullName: repoData.full_name,
      description: repoData.description,
      url: repoData.html_url,
      createdAt: repoData.created_at,
      updatedAt: repoData.updated_at,
      openIssuesCount: repoData.open_issues_count,
      forksCount: repoData.forks_count,
      starsCount: repoData.stargazers_count,
    });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to save repo: ${error.message}`);
  }
};

app.get("/users/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const userData = await getGitHubUser(username);
    const savedUser = await saveUserToUserService(userData);
    res.json(savedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/repos/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const repos = await getUserRepositories(username);
    const userData = await getGitHubUser(username); // Get user to grab githubId
    const savedRepos = await Promise.all(
      repos.map((repo) => saveRepoToRepoService(repo, userData.id.toString()))
    );
    res.json(savedRepos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/test", (req, res) => {
  res.send("GitHub Service is working!");
});

app.listen(PORT, () => {
  console.log(`GitHub Service is running on port ${PORT}`);
});