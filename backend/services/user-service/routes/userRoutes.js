const express = require("express");
const axios = require("axios");
const User = require("../models/User");

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

// Fetch all users
router.get("/", async (req, res) => {
  try {
    const users = await User.find();
    console.log("Fetched Users:", users);
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: err.message });
  }
});

// Fetch a single user by username, populate from GitHub if not found
router.get("/:username", async (req, res) => {
  try {
    const { username } = req.params;
    console.log(`Incoming Request: GET /users/${username}`);

    // Check DB first
    let user = await User.findOne({ username });
    if (user) {
      console.log("Found User in DB:", user);
      res.json(user);
    } else {
      console.log(`User ${username} not found in DB, fetching from GitHub`);
      
      // Fetch from GitHub
      const githubResponse = await githubApi.get(`/users/${username}`);
      const githubUser = githubResponse.data;

      // Map GitHub data to your User model
      const userData = {
        username: githubUser.login,
        githubId: githubUser.id.toString(),
        name: githubUser.name || null,
        email: githubUser.email || null,
        bio: githubUser.bio || "No bio available",
        avatar_url: githubUser.avatar_url, // Add this!
      };

      // Save to DB
      user = new User(userData);
      await user.save();
      console.log("Saved User to DB:", user);

      res.json(user);
    }
  } catch (err) {
    console.error("Error fetching user:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Create a user
router.post("/", async (req, res) => {
  try {
    const userData = req.body;
    const user = new User(userData);
    await user.save();
    console.log("Saved User:", user);
    res.status(201).json(user);
  } catch (err) {
    console.error("Error saving user:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;