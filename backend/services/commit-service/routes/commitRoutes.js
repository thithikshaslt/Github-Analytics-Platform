const express = require("express");
const axios = require("axios");
const Commit = require("../models/Commit");

const router = express.Router();

// GitHub Personal Access Token (add to .env as GITHUB_TOKEN)
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "YOUR_GITHUB_TOKEN_HERE";

// Axios instance with token
const githubApi = axios.create({
  baseURL: "https://api.github.com",
  headers: {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github.v3+json",
  },
});

// Get all commits
router.get("/", async (req, res) => {
  try {
    const commits = await Commit.find();
    console.log("Fetched Commits:", commits);
    res.json(commits);
  } catch (err) {
    console.error("Error fetching commits:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get total commits for a user, populate DB if needed
router.get("/:username", async (req, res) => {
  try {
    const { username } = req.params;
    console.log(`Fetching commits for ${username}`);

    // Fetch user’s GitHub ID
    const userResponse = await githubApi.get(`/users/${username}`);
    const userGithubId = userResponse.data.id.toString();
    console.log(`GitHub ID for ${username}: ${userGithubId}`);

    // Check DB for commits by GitHub ID
    let commits = await Commit.find({ author: userGithubId });
    console.log(`Found ${commits.length} commits in DB for ID ${userGithubId}`);

    if (commits.length === 0) {
      console.log(`No commits in DB for ${username} (ID: ${userGithubId}), fetching from GitHub`);
      
      // Fetch repos from GitHub
      const reposResponse = await githubApi.get(`/users/${username}/repos`);
      const newCommits = [];

      // Fetch commits for each repo
      for (const repo of reposResponse.data) {
        const repoId = repo.id.toString();
        console.log(`Fetching commits for repo ${repo.name} (ID: ${repoId})`);
        const commitsResponse = await githubApi.get(
          `/repos/${username}/${repo.name}/commits?author=${username}`
        );
        
        // Map GitHub commits to your Commit model
        for (const commit of commitsResponse.data) {
          const exists = await Commit.findOne({ sha: commit.sha });
          if (!exists) {
            newCommits.push({
              sha: commit.sha,
              repository: repoId, // Repo GitHub ID
              author: userGithubId, // User GitHub ID
              message: commit.commit.message,
              date: commit.commit.author.date,
            });
          }
        }
      }

      // Save new commits to DB
      if (newCommits.length > 0) {
        await Commit.insertMany(newCommits, { ordered: false })
          .then(() => console.log(`Saved ${newCommits.length} new commits to DB for ${username}`))
          .catch(err => console.error("Error saving commits:", err.message));
      } else {
        console.log(`No new commits found on GitHub for ${username}`);
      }

      // Re-fetch from DB after saving
      commits = await Commit.find({ author: userGithubId });
    }

    res.json({ totalCommits: commits.length });
  } catch (err) {
    console.error("Error fetching user commits:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Save or update a commit
router.post("/", async (req, res) => {
  try {
    const commitData = req.body;
    const { sha, upsert } = commitData;

    if (upsert) {
      const commit = await Commit.findOneAndUpdate(
        { sha },
        commitData,
        { upsert: true, new: true }
      );
      console.log("Saved/Updated Commit:", commit);
      res.status(201).json(commit);
    } else {
      const commit = new Commit(commitData);
      await commit.save();
      console.log("Saved Commit:", commit);
      res.status(201).json(commit);
    }
  } catch (err) {
    console.error("Error saving commit:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;