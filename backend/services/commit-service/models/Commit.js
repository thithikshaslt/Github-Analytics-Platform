const mongoose = require("mongoose");

const commitSchema = new mongoose.Schema({
  sha: { type: String, required: true, unique: true }, 
  repository: { type: String, required: true },
  author: { type: String, required: true }, 
  message: { type: String },
  date: { type: Date },
});

module.exports = mongoose.model("Commit", commitSchema);