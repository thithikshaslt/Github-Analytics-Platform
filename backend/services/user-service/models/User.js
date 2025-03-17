const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        githubId: { type: String, required: true, unique: true }, // GitHub User ID
        username: { type: String, required: true, unique: true }, // GitHub Username
        name: { type: String },
        avatarUrl: { type: String },
        email: { type: String },
        bio: { type: String },
        createdAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

const User = mongoose.model("User", userSchema);
module.exports = User;
