const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT;

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
    res.json(repos);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch repositories" });
  }
});

app.get("/test", (req, res) => {
  res.send("GitHub Service is working!");
});

app.listen(PORT, () => {
  console.log(`GitHub Service is running on port ${PORT}`);
});