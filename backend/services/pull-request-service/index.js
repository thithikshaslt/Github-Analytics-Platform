const express = require("express");
require("dotenv").config();
const mongoose = require("mongoose");
const prRoutes = require("./routes/pullRoutes");
const client = require("prom-client"); // Add this

const app = express();
const PORT = process.env.PORT || 5005;

// Collect default metrics (CPU, memory, etc.)
client.collectDefaultMetrics();

// Custom metric: HTTP requests counter
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['route', 'status'],
});

// Middleware to track requests
app.use((req, res, next) => {
  res.on('finish', () => {
    httpRequestsTotal.inc({ route: req.path, status: res.statusCode });
  });
  next();
});

app.use(express.json());
app.use("/prs", prRoutes);

// Metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

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