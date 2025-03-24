const express = require("express");
require("dotenv").config();
const mongoose = require("mongoose");
const prRoutes = require("./routes/pullRoutes");

const app = express();
const PORT = process.env.PORT || 5005;

app.use(express.json());
app.use("/prs", prRoutes);

const MONGO_URI = process.env.MONGO_URI;
mongoose
  .connect(MONGO_URI, {})
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });

app.listen(PORT, () => {
  console.log(`PR Service on ${PORT}`);
});