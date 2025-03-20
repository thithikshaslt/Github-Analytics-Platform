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

// Save a repository
router.post("/", async (req, res) => {
  try {
    const repoData = req.body;
    const repo = new Repository(repoData);
    await repo.save();
    console.log("Saved Repo:", repo);
    res.status(201).json(repo);
  } catch (err) {
    console.error("Error saving repo:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;