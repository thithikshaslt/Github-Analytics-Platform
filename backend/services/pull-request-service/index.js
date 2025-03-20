const express = require("express");
const mongoose = require("mongoose");
const pullRoutes = require("./routes/pullRoutes");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5005;

app.use(express.json());
app.use("/pulls", pullRoutes);

const ATLAS_URI = process.env.MONGO_URI;

const connectWithRetry = () => {
  mongoose
    .connect(ATLAS_URI, {
      bufferCommands: true, 
      bufferTimeoutMS: 30000, 
    })
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => {
      console.error("MongoDB connection error:", err);
      setTimeout(connectWithRetry, 5000); 
    });
};

connectWithRetry();

app.listen(PORT, () => {
  console.log(`Pull Request Service is running on port ${PORT}`);
});