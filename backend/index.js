const { getGitHubAppDetails, getUserRepositories } = require("./services/githubService");

async function testGitHubAPI() {
    try {
        const appDetails = await getGitHubAppDetails();
        console.log("GitHub App Details:", appDetails);

        // Replace 'your-github-username' with an actual GitHub username
        const repos = await getUserRepositories("thithikshaslt");
        console.log("User Repositories:", repos);
    } catch (error) {
        console.error("Failed to fetch GitHub data.");
    }
}

testGitHubAPI();
