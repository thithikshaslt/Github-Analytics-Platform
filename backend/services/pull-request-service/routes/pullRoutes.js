const express = require("express");
const PullRequest = require("../models/PullRequest");

const router = express.Router();

// Get all pull requests
router.get("/", async (req, res) => {
  try {
    const pulls = await PullRequest.find();
    console.log("Fetched Pull Requests:", pulls);
    res.json(pulls);
  } catch (err) {
    console.error("Error fetching pull requests:", err);
    res.status(500).json({ error: err.message });
  }
});

// Save or update a pull request
router.post("/", async (req, res) => {
  try {
    const pullData = req.body;
    const { githubId, upsert } = pullData;

    if (upsert) {
      const pull = await PullRequest.findOneAndUpdate(
        { githubId },
        pullData,
        { upsert: true, new: true }
      );
      console.log("Saved/Updated Pull Request:", pull);
      res.status(201).json(pull);
    } else {
      const pull = new PullRequest(pullData);
      await pull.save();
      console.log("Saved Pull Request:", pull);
      res.status(201).json(pull);
    }
  } catch (err) {
    console.error("Error saving pull request:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;