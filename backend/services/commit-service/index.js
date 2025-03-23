require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const commitRoutes = require("./routes/commitRoutes");

const app = express();
app.use(express.json());
app.use("/commits", commitRoutes);

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true })
  .then(() => console.log("MongoDB connected successfully"))
  .catch(err => console.error("MongoDB connection failed:", err.message));

app.listen(5004, () => console.log("Commits Service on 5004"));