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

const getRepoCommits = async (owner, repo) => {
  try {
    const response = await axios.get(`${GITHUB_API}/repos/${owner}/${repo}/commits`, {
      headers: GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {},
    });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch commits: ${error.message}`);
  }
};

const getRepoPullRequests = async (owner, repo) => {
  try {
    const response = await axios.get(`${GITHUB_API}/repos/${owner}/${repo}/pulls?state=all&per_page=10`, {
      headers: GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {},
    });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch pull requests: ${error.message}`);
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
      owner: ownerGithubId,
      fullName: repoData.full_name,
      description: repoData.description,
      url: repoData.html_url,
      createdAt: repoData.created_at,
      updatedAt: repoData.updated_at,
      openIssuesCount: repoData.open_issues_count,
      forksCount: repoData.forks_count,
      starsCount: repoData.stargazers_count,
      upsert: true,
    });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to save repo: ${error.message}`);
  }
};

const saveCommitToCommitService = async (commitData, repoGithubId) => {
  try {
    const response = await axios.post("http://localhost:5004/commits", {
      sha: commitData.sha,
      repository: repoGithubId.toString(),
      author: commitData.author ? commitData.author.id.toString() : commitData.commit.author.name,
      message: commitData.commit.message,
      date: commitData.commit.author.date,
      upsert: true,
    });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to save commit: ${error.message}`);
  }
};

const savePullToPullService = async (pullData, repoGithubId) => {
  try {
    const response = await axios.post("http://localhost:5005/pulls", {
      githubId: pullData.id,
      repository: repoGithubId.toString(),
      title: pullData.title,
      number: pullData.number,
      state: pullData.state === "closed" && pullData.merged_at ? "merged" : pullData.state,
      createdAt: pullData.created_at,
      mergedAt: pullData.merged_at,
      closedAt: pullData.closed_at,
      author: pullData.user.id.toString(),
      upsert: true,
    });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to save pull request: ${error.message}`);
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
    const userData = await getGitHubUser(username);
    const savedRepos = await Promise.all(
      repos.map((repo) => saveRepoToRepoService(repo, userData.id.toString()))
    );
    res.json(savedRepos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/commits/:owner/:repo", async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const commits = await getRepoCommits(owner, repo);
    const repoResponse = await axios.get(`http://localhost:5003/repos?fullName=${owner}/${repo}`);
    const repoGithubId = repoResponse.data[0]?.githubId;
    if (!repoGithubId) throw new Error("Repository not found in Repository Service");

    const savedCommits = await Promise.all(
      commits.map((commit) => saveCommitToCommitService(commit, repoGithubId))
    );
    res.json(savedCommits);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/pulls/:owner/:repo", async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const pulls = await getRepoPullRequests(owner, repo);
    const repoResponse = await axios.get(`http://localhost:5003/repos?fullName=${owner}/${repo}`);
    const repoGithubId = repoResponse.data[0]?.githubId;
    if (!repoGithubId) throw new Error("Repository not found in Repository Service");

    const savedPulls = await Promise.all(
      pulls.map((pull) => savePullToPullService(pull, repoGithubId))
    );
    res.json(savedPulls);
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