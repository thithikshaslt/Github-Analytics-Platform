const express = require("express");
const axios = require("axios");
const Repository = require("../models/Repository");
require("dotenv").config(); 
const router = express.Router();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const githubApi = axios.create({
  baseURL: "https://api.github.com",
  headers: GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {},
});

// Get all repositories
router.get("/", async (req, res) => {
  try {
    const repos = await Repository.find();
    console.log("Fetched Repos:", repos);
    res.json(repos);
  } catch (err) {
    console.error("Error fetching repos:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get and sync ALL repositories for a specific user
router.get("/:username", async (req, res) => {
  try {
    const { username } = req.params;
    console.log(`Fetching ALL repos for user: ${username}`);

    let allGithubRepos = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const response = await githubApi.get(`/users/${username}/repos`, {
        params: {
          per_page: perPage,
          page: page,
        },
      });
      const reposPage = response.data;

      if (reposPage.length === 0) break;

      const mappedRepos = reposPage.map(repo => ({
        githubId: repo.id.toString(),
        name: repo.name,
        owner: repo.owner.login,
        description: repo.description || "No description",
        url: repo.html_url,
        fullName: repo.full_name,
        starsCount: repo.stargazers_count,
        forksCount: repo.forks_count,
        createdAt: repo.created_at,
        updatedAt: repo.updated_at,
      }));

      allGithubRepos = allGithubRepos.concat(mappedRepos);
      console.log(`Fetched page ${page}: ${reposPage.length} repos (Total so far: ${allGithubRepos.length})`);
      page++;

      if (reposPage.length < perPage) break; 
    }

    const upsertPromises = allGithubRepos.map(async (repoData) => {
      return Repository.findOneAndUpdate(
        { githubId: repoData.githubId }, // Find by githubId
        repoData,                        // Update with GitHub data
        { upsert: true, new: true,sanitizeFilter: true  }      // Insert if not found, return updated doc
      );
    });
    await Promise.all(upsertPromises);
    console.log(`Synced ${allGithubRepos.length} repos for ${username} into DB`);

    // Fetch the updated list from DB
    const dbRepos = await Repository.find({ owner: username });
    res.json(dbRepos);
  } catch (err) {
    console.error("Error fetching/syncing user repos:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const repoData = req.body;
    const { githubId } = repoData;

    const repo = await Repository.findOneAndUpdate(
      { githubId },
      repoData,
      { upsert: true, new: true }
    );
    console.log("Saved/Updated Repo:", repo);
    res.status(201).json(repo);
  } catch (err) {
    console.error("Error saving/updating repo:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;