const express = require("express");
const axios = require("axios");
const Commit = require("../models/Commit");

const router = express.Router();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const githubApi = axios.create({
  baseURL: "https://api.github.com",
  headers: GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {},
});

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const syncingUsers = new Set();

router.post("/sync/:username", async (req, res) => {
  const { username } = req.params;
  if (syncingUsers.has(username)) {
    return res.status(409).json({ message: `Sync already in progress for ${username}` });
  }
  syncingUsers.add(username);
  try {
    console.log(`Starting full commit sync for ${username}`);
    const userResponse = await githubApi.get(`/users/${username}`);
    const userGithubId = userResponse.data.id.toString();

    let allRepos = [];
    let page = 1;
    while (true) {
      const reposResponse = await githubApi.get(`/users/${username}/repos`, {
        params: { per_page: 100, page },
      });
      const reposPage = reposResponse.data;
      if (reposPage.length === 0) break;
      allRepos = allRepos.concat(reposPage);
      console.log(`Fetched ${allRepos.length} repos so far`);
      page++;
      await delay(500);
    }

    let totalCommitsSynced = 0;
    for (const repo of allRepos) {
      const repoId = repo.id.toString();
      let commitPage = 1;
      while (true) {
        try {
          const commitsResponse = await githubApi.get(
            `/repos/${username}/${repo.name}/commits?author=${username}&per_page=100&page=${commitPage}`
          );
          const commitsPage = commitsResponse.data;
          if (commitsPage.length === 0) break;

          for (const commit of commitsPage) {
            const commitData = {
              sha: commit.sha,
              repository: repoId,
              author: userGithubId,
              message: commit.commit.message,
              date: commit.commit.author.date,
            };
            await Commit.updateOne(
              { sha: commit.sha },
              { $set: commitData },
              { upsert: true }
            );
            totalCommitsSynced++;
          }
          console.log(`Synced ${commitsPage.length} commits for ${repo.name} (Total: ${totalCommitsSynced})`);
          commitPage++;
          await delay(1000);
        } catch (err) {
          console.error(`Error syncing commits for ${repo.name}: ${err.message}`);
          if (err.message.includes("ETIMEDOUT")) {
            await delay(5000);
            continue;
          }
          break;
        }
      }
    }
    console.log(`Finished syncing ${totalCommitsSynced} commits for ${username}`);
    res.json({ message: `Synced ${totalCommitsSynced} commits`, totalCommits: totalCommitsSynced });
  } catch (err) {
    console.error("Error syncing commits:", err.message);
    res.status(500).json({ error: err.message });
  } finally {
    syncingUsers.delete(username);
  }
});

router.get("/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 20;
    console.log(`Fetching commits for ${username}, page ${page}`);

    const userResponse = await githubApi.get(`/users/${username}`);
    const userGithubId = userResponse.data.id.toString();

    const commits = await Commit.find({ author: userGithubId })
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean(); 

    const totalCommits = await Commit.countDocuments({ author: userGithubId });

    res.json({
      commits,
      totalCommits,
      page,
      totalPages: Math.ceil(totalCommits / perPage),
    });
  } catch (err) {
    console.error("Error fetching commits:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get("/:username/total", async (req, res) => {
  try {
    const { username } = req.params;
    const userResponse = await githubApi.get(`/users/${username}`);
    const userGithubId = userResponse.data.id.toString();
    const totalCommits = await Commit.countDocuments({ author: userGithubId });
    res.json({ totalCommits });
  } catch (err) {
    console.error("Error fetching total commits:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;