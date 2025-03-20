const express = require("express");
const User = require("../models/User");

const router = express.Router();

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

router.get("/debug", async (req, res) => {
  try {
    const users = await User.find();
    console.log("Fetched Users:", users);
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

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