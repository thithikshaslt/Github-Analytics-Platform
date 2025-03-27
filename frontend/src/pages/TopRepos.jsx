import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRepos, getRepoCommitsTotal, getRepoPRsTotal } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function TopRepos() {
  const { username } = useParams();
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const reposResponse = await getRepos(username);
        const reposData = reposResponse.data;

        // Fetch commit and PR totals for each repo
        const enrichedRepos = await Promise.all(
          reposData.map(async (repo) => {
            const [commitsRes, prsRes] = await Promise.all([
              getRepoCommitsTotal(username, repo.githubId),
              getRepoPRsTotal(username, repo.githubId),
            ]);
            return {
              ...repo,
              commitsCount: commitsRes.data.totalCommits || 0,
              prsCount: prsRes.data.totalPRs || 0,
            };
          })
        );

        setRepos(enrichedRepos);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [username]);

  // Sort functions
  const sortByStars = (repos) => repos.sort((a, b) => b.starsCount - a.starsCount).slice(0, 3);
  const sortByForks = (repos) => repos.sort((a, b) => b.forksCount - a.forksCount).slice(0, 3);
  const sortByCommits = (repos) => repos.sort((a, b) => b.commitsCount - a.commitsCount).slice(0, 3);
  const sortByPRs = (repos) => repos.sort((a, b) => b.prsCount - a.prsCount).slice(0, 3);
  const sortByUpdated = (repos) =>
    repos.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 3);

  const sections = [
    { title: 'Top 3 by Stars', sortFn: sortByStars, stat: 'starsCount', label: 'Stars' },
    { title: 'Top 3 by Forks', sortFn: sortByForks, stat: 'forksCount', label: 'Forks' },
    { title: 'Top 3 by Commits', sortFn: sortByCommits, stat: 'commitsCount', label: 'Commits' },
    { title: 'Top 3 by PRs', sortFn: sortByPRs, stat: 'prsCount', label: 'PRs' },
    { title: 'Top 3 by Last Updated', sortFn: sortByUpdated, stat: 'updatedAt', label: 'Last Updated' },
  ];

  return (
    <div className="min-h-screen bg-background p-6 w-full dark">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl text-foreground font-bold">Top Repositories for {username}</h1>
          <Button
            onClick={() => navigate(`/insights/${username}`)}
            className="bg-primary text-primary-foreground hover:bg-[#4a2885]"
          >
            Back to Insights
          </Button>
        </div>

        {error && <p className="text-destructive mb-4">Error: {error}</p>}

        {loading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-2 text-foreground">Loading...</span>
          </div>
        ) : (
          sections.map((section) => (
            <div key={section.title} className="mb-8">
              <h2 className="text-xl text-muted-foreground font-semibold mb-4 border-b border-[#5a329f] pb-1">
                {section.title}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {sortByStars(repos).length === 0 ? (
                  <p className="text-muted-foreground col-span-full">No repositories available.</p>
                ) : (
                  section.sortFn(repos).map((repo) => (
                    <Card
                      key={repo.githubId}
                      className="bg-card text-card-foreground border-border hover:bg-[#2f2942] transition-colors"
                    >
                      <CardHeader>
                        <CardTitle className="text-foreground">
                          <a
                            href={repo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {repo.name}
                          </a>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-primary font-semibold">
                          {section.label}: {section.stat === 'updatedAt' ? new Date(repo[section.stat]).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }) : repo[section.stat]}
                        </p>
                        <p className="text-muted-foreground text-sm mt-1">
                          {section.stat !== 'updatedAt' && `Last Updated: ${new Date(repo.updatedAt).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })}`}
                        </p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default TopRepos;