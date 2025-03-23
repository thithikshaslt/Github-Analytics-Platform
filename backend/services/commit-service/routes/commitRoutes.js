const express = require("express");
const axios = require("axios");
const Commit = require("../models/Commit");

const router = express.Router();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "YOUR_GITHUB_TOKEN_HERE";
const githubApi = axios.create({
  baseURL: "https://api.github.com",
  headers: {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github.v3+json",
  },
});

router.get("/", async (req, res) => {
  try {
    const commits = await Commit.find();
    res.json(commits);
  } catch (err) {
    console.error("Error fetching commits:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/:username", async (req, res) => {
  try {
    const { username } = req.params;
    console.log(`Fetching commits for ${username}`);

    const userResponse = await githubApi.get(`/users/${username}`);
    const userGithubId = userResponse.data.id.toString();
    let commits = await Commit.find({ author: userGithubId });

    if (commits.length === 0) {
      console.log(`No commits in DB for ${username} (ID: ${userGithubId}), fetching from GitHub`);
      const reposResponse = await githubApi.get(`/users/${username}/repos`);
      const newCommits = [];

      for (const repo of reposResponse.data) {
        const repoId = repo.id.toString();
        const commitsResponse = await githubApi.get(
          `/repos/${username}/${repo.name}/commits?author=${username}`
        );
        for (const commit of commitsResponse.data) {
          const exists = await Commit.findOne({ sha: commit.sha });
          if (!exists) {
            newCommits.push({
              sha: commit.sha,
              repository: repoId,
              author: userGithubId,
              message: commit.commit.message,
              date: commit.commit.author.date, // Already there—keep it
            });
          }
        }
      }

      if (newCommits.length > 0) {
        await Commit.insertMany(newCommits, { ordered: false });
        console.log(`Saved ${newCommits.length} new commits for ${username}`);
      }
      commits = await Commit.find({ author: userGithubId });
    }

    // Return full commits instead of just count
    res.json({ commits }); // Array of commit objects
  } catch (err) {
    console.error("Error fetching user commits:", err.message);
    res.status(500).json({ error: err.message });
  }
});

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
      res.status(201).json(commit);
    } else {
      const commit = new Commit(commitData);
      await commit.save();
      res.status(201).json(commit);
    }
  } catch (err) {
    console.error("Error saving commit:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;