const mongoose = require("mongoose");

const commitSchema = new mongoose.Schema({
  sha: { type: String, required: true, unique: true }, // Commit SHA
  repository: { type: String, required: true }, // Store repo githubId as string
  author: { type: String, required: true }, // Store user githubId as string
  message: { type: String },
  date: { type: Date },
});

module.exports = mongoose.model("Commit", commitSchema);