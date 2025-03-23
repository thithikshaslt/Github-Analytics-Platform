const express = require("express");
require("dotenv").config();
const mongoose = require("mongoose");
const commitRoutes = require("./routes/commitRoutes");

const app = express();
const PORT = process.env.PORT || 5004;

app.use(express.json());
app.use("/commits", commitRoutes);

const MONGO_URI = process.env.MONGO_URI ;

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
  })
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });

app.listen(PORT, () => {
  console.log(`Commits Service on ${PORT}`);
});