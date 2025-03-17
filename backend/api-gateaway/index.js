const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const PORT = 5000; // API Gateway port

// Proxy requests to GitHub Microservice
app.use(
    "/github",
    createProxyMiddleware({
        target: "http://localhost:5001", // GitHub microservice URL
        changeOrigin: true,
        pathRewrite: { "^/github": "" },
    })
);

// Proxy User Service
app.use(
    "/users",
    createProxyMiddleware({
        target: "http://localhost:5002", // User microservice URL
        changeOrigin: true,
    })
);

// Start API Gateway only once
app.listen(PORT, () => {
    console.log(`API Gateway is running on port ${PORT}`);
});
