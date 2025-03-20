const express = require("express");
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