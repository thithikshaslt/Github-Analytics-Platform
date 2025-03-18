const express = require("express");
const mongoose = require("mongoose");
const userRoutes = require("./routes/userRoutes"); // Ensure this file exists

const app = express();
const PORT = 5002;

app.use(express.json()); // Parse JSON request body
app.use("/users", userRoutes); // Correctly mounting the router

mongoose
  .connect("mongodb://localhost:27017/github-analytics", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.listen(PORT, () => {
  console.log(`User Service is running on port ${PORT}`);
});
