const mongoose = require("mongoose");

const pullRequestSchema = new mongoose.Schema({
  githubId: { type: Number, required: true, unique: true }, // GitHub PR ID
  repository: { type: String, required: true }, // Store repo githubId as string
  title: { type: String },
  number: { type: Number, required: true },
  state: { type: String, required: true }, // "open", "closed", "merged"
  createdAt: { type: Date, required: true },
  mergedAt: { type: Date },
  closedAt: { type: Date },
  author: { type: String, required: true }, // Store user githubId as string
});

module.exports = mongoose.model("PullRequest", pullRequestSchema);