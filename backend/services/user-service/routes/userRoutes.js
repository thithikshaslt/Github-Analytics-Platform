const express = require("express");
const axios = require("axios");
const User = require("../models/User");

require("dotenv").config();

const router = express.Router();

// GitHub API setup
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "YOUR_GITHUB_TOKEN_HERE";
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
    console.error("Error fetching users:", err.message);
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

      console.log("GitHub User Data:", githubUser);

      // Map GitHub data to User model
      const userData = {
        username: githubUser.login,
        githubId: githubUser.id.toString(),
        name: githubUser.name || githubUser.login, // Fallback to username
        email: githubUser.email || null, // Optional
        bio: githubUser.bio || "No bio available",
        avatarUrl: githubUser.avatar_url, // Matches schema
      };

      console.log("Mapped User Data:", userData);

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

// Create a user manually
router.post("/", async (req, res) => {
  try {
    const userData = req.body;
    // Validate required fields
    const requiredFields = ["username", "githubId", "name", "avatarUrl"];
    for (const field of requiredFields) {
      if (!userData[field]) {
        return res.status(400).json({ error: `${field} is required` });
      }
    }

    const user = new User(userData);
    await user.save();
    console.log("Saved User:", user);
    res.status(201).json(user);
  } catch (err) {
    console.error("Error saving user:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;