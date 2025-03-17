const express = require("express");
const User = require("../models/User");

const router = express.Router();

// Create or update a user
router.post("/", async (req, res) => {
    try {
        const { githubId, username, name, avatarUrl, email, bio } = req.body;

        let user = await User.findOneAndUpdate(
            { githubId },
            { username, name, avatarUrl, email, bio },
            { new: true, upsert: true }
        );

        res.status(200).json(user);
    } catch (error) {
        console.error("Error saving user:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Get user by GitHub ID
router.get("/:githubId", async (req, res) => {
    try {
        const user = await User.findOne({ githubId });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;
