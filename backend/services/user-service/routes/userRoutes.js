const express = require("express");
const User = require("../models/User");

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const users = await User.find(); // Fetch users from MongoDB
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
