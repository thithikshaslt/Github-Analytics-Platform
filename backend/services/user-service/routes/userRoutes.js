const express = require("express");
const User = require("../models/User");

const router = express.Router();

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

// Debug route (fetch all users)
router.get("/debug", async (req, res) => {
  try {
    const users = await User.find();
    console.log("Fetched Users:", users);
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Fetch a single user by username
router.get("/:username", async (req, res) => {
  try {
    const { username } = req.params;
    console.log(`Incoming Request: GET /users/${username}`);
    const user = await User.findOne({ username });
    if (user) {
      console.log("Found User:", user);
      res.json(user);
    } else {
      console.log(`User ${username} not found`);
      res.status(404).json({ error: "User not found" });
    }
  } catch (err) {
    console.error("Error fetching user:", err);
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