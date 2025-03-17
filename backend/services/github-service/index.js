const express = require("express");
const { getGitHubAppDetails, getUserRepositories } = require("./githubService");

const app = express();
const PORT = process.env.PORT || 5001; // Each microservice runs on a different port

app.get("/app-details", async (req, res) => {
    try {
        const data = await getGitHubAppDetails();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch GitHub App details" });
    }
});

app.get("/test", (req, res) => {
    res.send("GitHub Service is working!");
});

app.get("/repos/:username", async (req, res) => {
    try {
        const { username } = req.params;
        const repos = await getUserRepositories(username);
        res.json(repos);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch repositories" });
    }
});

app.listen(PORT, () => {
    console.log(`GitHub Service is running on port ${PORT}`);
});
