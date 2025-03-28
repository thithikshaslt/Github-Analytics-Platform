const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");
const client = require("prom-client"); // Add this

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));

const PORT = 5000;

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
  console.log(`Incoming Request: ${req.method} ${req.url}`);
  res.on('finish', () => {
    httpRequestsTotal.inc({ route: req.path, status: res.statusCode });
  });
  next();
});

// Metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// Users Service Proxy
app.use(
  "/users",
  (req, res, next) => {
    console.log("Before Proxy Middleware - Request received at API Gateway for User Service");
    next();
  },
  createProxyMiddleware({
    target: "http://localhost:5002",
    changeOrigin: true,
    pathRewrite: (path, req) => {
      console.log(`Original Path: ${path}`);
      const newPath = `/users${path}`;
      console.log(`Rewritten Path: ${newPath}`);
      return newPath;
    },
    logLevel: "debug",
    onProxyReq: (proxyReq, req, res) => {
      console.log(`Forwarding request to User Service: ${req.method} ${req.originalUrl}`);
    },
    onError: (err, req, res) => {
      console.error(`Proxy error: ${err.message}`);
      res.status(500).json({ error: "Proxy failed" });
    },
  })
);

// Repos Service Proxy
app.use(
  "/repos",
  (req, res, next) => {
    console.log("Before Proxy - Request received for Repos Service");
    next();
  },
  createProxyMiddleware({
    target: "http://localhost:5003",
    changeOrigin: true,
    logLevel: "debug",
    pathRewrite: (path, req) => {
      console.log(`Original Path: ${path}`);
      const newPath = `/repos${path}`;
      console.log(`Rewritten Path: ${newPath}`);
      return newPath;
    },
    onProxyReq: (proxyReq, req) => {
      console.log(`Forwarding to Repos Service: ${req.method} ${req.originalUrl}`);
    },
    onProxyRes: (proxyRes, req) => {
      console.log(`Response from Repos Service: ${proxyRes.statusCode}`);
    },
    onError: (err, req, res) => {
      console.error(`Proxy error for Repos Service: ${err.message}`);
      res.status(500).json({ error: "Proxy failed", details: err.message });
    },
  })
);

// Commits Service Proxy
app.use(
  "/commits",
  (req, res, next) => {
    console.log("Before Proxy - Request received for Commits Service");
    next();
  },
  createProxyMiddleware({
    target: "http://localhost:5004",
    changeOrigin: true,
    logLevel: "debug",
    pathRewrite: (path, req) => {
      console.log(`Original Path: ${path}`);
      const newPath = `/commits${path}`;
      console.log(`Rewritten Path: ${newPath}`);
      return newPath;
    },
    onProxyReq: (proxyReq, req) => {
      console.log(`Forwarding to Commits Service: ${req.method} ${req.originalUrl}`);
    },
    onError: (err, req, res) => {
      console.error(`Proxy error for Commits Service: ${err.message}`);
      res.status(500).json({ error: "Proxy failed" });
    },
  })
);

// PRs Service Proxy
app.use(
  "/prs",
  (req, res, next) => {
    console.log("Before Proxy - Request received for PRs Service");
    next();
  },
  createProxyMiddleware({
    target: "http://localhost:5005",
    changeOrigin: true,
    logLevel: "debug",
    pathRewrite: (path, req) => {
      console.log(`Original Path: ${path}`);
      const newPath = `/prs${path}`;
      console.log(`Rewritten Path: ${newPath}`);
      return newPath;
    },
    onProxyReq: (proxyReq, req) => {
      console.log(`Forwarding to PRs Service: ${req.method} ${req.originalUrl}`);
    },
    onError: (err, req, res) => {
      console.error(`Proxy error for PRs Service: ${err.message}`);
      res.status(500).json({ error: "Proxy failed" });
    },
  })
);

app.listen(PORT, () => {
  console.log(`API Gateway is running on port ${PORT}`);
});