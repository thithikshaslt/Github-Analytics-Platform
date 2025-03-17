const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

const userRoutes = require("./routes/userRoutes");

dotenv.config();
const app = express();

app.use(express.json());

// Routes
app.use("/users", userRoutes);

app.get('/test', (req, res) => {
    res.send("User Service is working!");
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {})
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("MongoDB Connection Error:", err));

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
    console.log(`User Service is running on port ${PORT}`);
});
