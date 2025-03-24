const express = require("express");
const axios = require("axios");
const PullRequest = require("../models/PullRequest");

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
    console.log(`Starting PR sync for ${username}`);

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

    let totalPRsSynced = 0;
    for (const repo of allRepos) {
      const repoId = repo.id.toString();
      let prPage = 1;

      while (true) {
        try {
          const prsResponse = await githubApi.get(
            `/repos/${username}/${repo.name}/pulls?state=all&per_page=100&page=${prPage}`
          );
          const prsPage = prsResponse.data;
          if (prsPage.length === 0) break;

          for (const pr of prsPage) {
            if (pr.user.id.toString() !== userGithubId) continue; // Only PRs by this user

            const prData = {
              prId: pr.id.toString(),
              number: pr.number,
              repository: repoId,
              author: userGithubId,
              title: pr.title,
              state: pr.state === "open" ? "open" : pr.merged_at ? "merged" : "closed",
              createdAt: new Date(pr.created_at),
              updatedAt: pr.updated_at ? new Date(pr.updated_at) : null,
              closedAt: pr.closed_at ? new Date(pr.closed_at) : null,
            };

            await PullRequest.updateOne(
              { prId: pr.id.toString() },
              { $set: prData },
              { upsert: true }
            );
            totalPRsSynced++;
          }

          console.log(`Synced ${prsPage.length} PRs for ${repo.name} (Total: ${totalPRsSynced})`);
          prPage++;
          await delay(1000);
        } catch (err) {
          console.error(`Error syncing PRs for ${repo.name}: ${err.message}`);
          if (err.message.includes("ETIMEDOUT")) {
            await delay(5000);
            continue;
          }
          break;
        }
      }
    }

    console.log(`Finished syncing ${totalPRsSynced} PRs for ${username}`);
    res.json({ message: `Synced ${totalPRsSynced} PRs`, totalPRs: totalPRsSynced });
  } catch (err) {
    console.error("Error syncing PRs:", err.message);
    res.status(500).json({ error: err.message });
  } finally {
    syncingUsers.delete(username);
  }
});

router.get("/:username/total", async (req, res) => {
  try {
    const { username } = req.params;
    const userResponse = await githubApi.get(`/users/${username}`);
    const userGithubId = userResponse.data.id.toString();
    const totalPRs = await PullRequest.countDocuments({ author: userGithubId });
    res.json({ totalPRs });
  } catch (err) {
    console.error("Error fetching total PRs:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get("/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 20;

    const userResponse = await githubApi.get(`/users/${username}`);
    const userGithubId = userResponse.data.id.toString();

    const prs = await PullRequest.find({ author: userGithubId })
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean();

    const totalPRs = await PullRequest.countDocuments({ author: userGithubId });

    res.json({
      pullRequests: prs,
      totalPRs,
      page,
      totalPages: Math.ceil(totalPRs / perPage),
    });
  } catch (err) {
    console.error("Error fetching PRs:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;