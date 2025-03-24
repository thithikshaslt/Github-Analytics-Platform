const mongoose = require("mongoose");

const pullRequestSchema = new mongoose.Schema({
  githubId: { type: Number, required: true, unique: true }, 
  repository: { type: String, required: true }, 
  title: { type: String },
  number: { type: Number, required: true },
  state: { type: String, required: true }, 
  createdAt: { type: Date, required: true },
  mergedAt: { type: Date },
  closedAt: { type: Date },
  author: { type: String, required: true }, 
});

module.exports = mongoose.model("PullRequest", pullRequestSchema);