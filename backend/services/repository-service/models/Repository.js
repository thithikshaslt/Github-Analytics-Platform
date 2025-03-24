const mongoose = require("mongoose");

const repositorySchema = new mongoose.Schema({
  githubId: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  owner: { type: String, required: true }, 
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