const express = require("express");
const mongoose = require("mongoose");
const userRoutes = require("./routes/userRoutes"); 
require("dotenv").config(); 

const app = express();
const PORT = process.env.PORT || 5002;

app.use(express.json());
app.use("/users", userRoutes); 

const ATLAS_URI = process.env.MONGO_URI;

mongoose
  .connect(ATLAS_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.listen(PORT, () => {
  console.log(`User Service is running on port ${PORT}`);
});
