const express = require("express");
const Commit = require("../models/Commit");

const router = express.Router();

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

// Save or update a commit
router.post("/", async (req, res) => {
  try {
    const commitData = req.body;
    const { sha, upsert } = commitData;

    if (upsert) {
      // Upsert: update if exists, insert if not
      const commit = await Commit.findOneAndUpdate(
        { sha }, // Find by SHA
        commitData, // Update with new data
        { upsert: true, new: true } // Create if not found, return updated doc
      );
      console.log("Saved/Updated Commit:", commit);
      res.status(201).json(commit);
    } else {
      // Regular insert
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