const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const PORT = 5000; // API Gateway port

// Middleware to log all incoming requests
app.use((req, res, next) => {
    console.log(`Incoming Request: ${req.method} ${req.url}`);
    next();
});

// Proxy User Service with FIXED path rewrite
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

// Start API Gateway only once
app.listen(PORT, () => {
    console.log(`API Gateway is running on port ${PORT}`);
});