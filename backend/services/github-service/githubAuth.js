const fs = require("fs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

function generateGitHubAppJWT() {
    const privateKey = fs.readFileSync(process.env.GITHUB_PRIVATE_KEY_PATH, "utf8");

    const payload = {
        iat: Math.floor(Date.now() / 1000), 
        exp: Math.floor(Date.now() / 1000) + (10 * 60), 
        iss: process.env.GITHUB_APP_ID,
    };

    return jwt.sign(payload, privateKey, { algorithm: "RS256" });
}

module.exports = { generateGitHubAppJWT };
