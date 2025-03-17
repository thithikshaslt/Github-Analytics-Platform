const fs = require("fs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

function generateGitHubAppJWT() {
    const privateKey = fs.readFileSync(process.env.GITHUB_PRIVATE_KEY_PATH, "utf8");

    const payload = {
        iat: Math.floor(Date.now() / 1000), // Issued at time
        exp: Math.floor(Date.now() / 1000) + (10 * 60), // Expiration time (10 minutes)
        iss: process.env.GITHUB_APP_ID, // GitHub App ID
    };

    return jwt.sign(payload, privateKey, { algorithm: "RS256" });
}

module.exports = { generateGitHubAppJWT };
