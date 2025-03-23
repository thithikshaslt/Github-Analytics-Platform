const express = require("express");
const axios = require("axios");
const Repository = require("../models/Repository");

const router = express.Router();

// Get all repositories
router.get("/", async (req, res) => {
  try {
    const repos = await Repository.find();
    console.log("Fetched Repos:", repos);
    res.json(repos);
  } catch (err) {
    console.error("Error fetching repos:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get repositories for a specific user
router.get("/:username", async (req, res) => {
  try {
    const { username } = req.params;
    console.log(`Fetching repos for user: ${username}`);

    // Check MongoDB for user's repos
    const repos = await Repository.find({ owner: username });
    if (repos.length > 0) {
      console.log(`Found ${repos.length} repos in DB for ${username}`);
      res.json(repos);
    } else {
      // Fallback to GitHub API if no data in DB
      console.log(`No repos in DB, fetching from GitHub for ${username}`);
      const response = await axios.get(`https://api.github.com/users/${username}/repos`);
      const githubRepos = response.data.map(repo => ({
        githubId: repo.id.toString(),
        name: repo.name,
        owner: repo.owner.login,
        description: repo.description || "No description",
        url: repo.html_url,
      }));
      res.json(githubRepos);
    }
  } catch (err) {
    console.error("Error fetching user repos:", err);
    res.status(500).json({ error: err.message });
  }
});

// Save or update a repository
router.post("/", async (req, res) => {
  try {
    const repoData = req.body;
    const { githubId } = repoData;

    // Always upsert: update if exists, insert if not
    const repo = await Repository.findOneAndUpdate(
      { githubId }, // Find by githubId
      repoData,     // Update with new data
      { upsert: true, new: true } // Create if not found, return updated doc
    );
    console.log("Saved/Updated Repo:", repo);
    res.status(201).json(repo);
  } catch (err) {
    console.error("Error saving/updating repo:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;