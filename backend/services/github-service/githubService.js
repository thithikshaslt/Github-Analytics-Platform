const axios = require("axios");
const { generateGitHubAppJWT } = require("./githubAuth");

async function getGitHubAppDetails() {
    const jwt = generateGitHubAppJWT();

    try {
        const response = await axios.get("https://api.github.com/app", {
            headers: {
                Authorization: `Bearer ${jwt}`,
                Accept: "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
            },
        });

        return response.data;
    } catch (error) {
        console.error("GitHub API Error:", error.response?.data || error.message);
        throw error;
    }
}

async function getInstallationAccessToken(installationId) {
    const jwt = generateGitHubAppJWT();

    try {
        const response = await axios.post(
            `https://api.github.com/app/installations/${installationId}/access_tokens`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${jwt}`,
                    Accept: "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28",
                },
            }
        );

        return response.data.token;
    } catch (error) {
        console.error("Error getting installation access token:", error.response?.data || error.message);
        throw error;
    }
}

async function getUserRepositories(username) {
    const installationId = process.env.GITHUB_INSTALLATION_ID; // Now configurable via .env
    const accessToken = await getInstallationAccessToken(installationId);

    try {
        const response = await axios.get(`https://api.github.com/users/${username}/repos`, {
            headers: {
                Authorization: `token ${accessToken}`,
                Accept: "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
            },
        });

        return response.data;
    } catch (error) {
        console.error("GitHub API Error:", error.response?.data || error.message);
        throw error;
    }
}

module.exports = { getGitHubAppDetails, getUserRepositories };
