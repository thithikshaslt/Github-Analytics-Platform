const mongoose = require("mongoose");

const pullRequestSchema = new mongoose.Schema(
  {
    prId: { type: String, required: true, unique: true }, // GitHub PR ID
    number: { type: Number, required: true }, // PR number in repo
    repository: { type: String, required: true }, // Repo ID
    author: { type: String, required: true }, // User’s GitHub ID
    title: { type: String, required: true },
    state: { type: String, required: true }, // "open", "closed", "merged"
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date },
    closedAt: { type: Date },
  },
  { timestamps: true, collection: "pullRequests" }
);

const PullRequest = mongoose.model("PullRequest", pullRequestSchema);
module.exports = PullRequest;