const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        githubId: { type: String, required: true, unique: true }, // GitHub User ID
        username: { type: String, required: true, unique: true }, // GitHub Username
        name: { type: String, required: true }, // Full name of the user
        email: { type: String, required: false}, // User's email
        avatarUrl: { type: String, required: true }, // URL to the user's avatar/profile picture
        bio: { type: String }, // User's bio/description
        createdAt: { type: Date, default: Date.now }, // Timestamp of when the user was created
    },
    { timestamps: true, collection: "users" } // Adds `createdAt` and `updatedAt` fields automatically
);

const User = mongoose.model("User", userSchema);
module.exports = User;