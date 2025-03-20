const mongoose = require("mongoose");

const repositorySchema = new mongoose.Schema({
  githubId: { type: Number, required: true, unique: true }, // GitHub repo ID
  name: { type: String, required: true },
  owner: { type: String, required: true }, // Store githubId as a string for now
  fullName: { type: String },
  description: { type: String },
  url: { type: String },
  createdAt: { type: Date },
  updatedAt: { type: Date },
  openIssuesCount: { type: Number },
  forksCount: { type: Number },
  starsCount: { type: Number },
});

module.exports = mongoose.model("Repository", repositorySchema);