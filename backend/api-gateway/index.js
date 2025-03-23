const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors"); // Added for CORS

const app = express();
app.use(cors({ origin: "http://localhost:5173" })); // Added to allow frontend requests

const PORT = 5000; // API Gateway port

app.use((req, res, next) => {
    console.log(`Incoming Request: ${req.method} ${req.url}`);
    next();
});

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
            const newPath = `/users${path}`; // Preserve /users prefix
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

// Proxy to repos-service
app.use(
    "/repos",
    (req, res, next) => {
        console.log("Before Proxy Middleware - Request received at API Gateway for Repos Service");
        next();
    },
    createProxyMiddleware({
        target: "http://localhost:5003",
        changeOrigin: true,
        pathRewrite: (path, req) => {
            console.log(`Original Path: ${path}`);
            const newPath = `/repos${path}`; // Preserve /repos prefix
            console.log(`Rewritten Path: ${newPath}`);
            return newPath;
        },
        logLevel: "debug",
        onProxyReq: (proxyReq, req, res) => {
            console.log(`Forwarding request to Repos Service: ${req.method} ${req.originalUrl}`);
        },
        onError: (err, req, res) => {
            console.error(`Proxy error: ${err.message}`);
            res.status(500).json({ error: "Proxy failed" });
        },
    })
);

// Start API Gateway only once
app.listen(PORT, () => {
    console.log(`API Gateway is running on port ${PORT}`);
});