import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Added useNavigate
import { getUser, getRepos, getCommitsTotal, syncCommits } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

function Insights() {
  const { username } = useParams();
  const [user, setUser] = useState(null);
  const [repos, setRepos] = useState([]);
  const [totalCommits, setTotalCommits] = useState(null);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const navigate = useNavigate(); // Hook for navigation

  const fetchData = () => {
    Promise.all([getUser(username), getRepos(username), getCommitsTotal(username)])
      .then(([userResponse, reposResponse, commitsResponse]) => {
        console.log("Commits Total:", commitsResponse.data);
        setUser(userResponse.data);
        setRepos(reposResponse.data);
        setTotalCommits(commitsResponse.data.totalCommits);
      })
      .catch((err) => {
        console.error("Fetch Error:", err);
        setError(err.message);
      });
  };

  useEffect(() => {
    fetchData();
  }, [username]);

  const handleSyncCommits = async () => {
    setSyncing(true);
    try {
      const syncResponse = await syncCommits(username);
      setTotalCommits(syncResponse.data.totalCommits);
      console.log(`Synced ${syncResponse.data.totalCommits} commits`);
      fetchData(); // Refresh all data post-sync
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleViewCommits = () => {
    navigate(`/commits/${username}`); // Navigate to CommitsDashboard
  };

  return (
    <div className="min-h-screen bg-background p-6 w-full dark">
      <h1 className="text-3xl text-foreground mb-6">Insights for {username}</h1>
      {error && <p className="text-destructive mb-4">Error: {error}</p>}
      {user ? (
        <Card className="w-full max-w-2xl mx-auto bg-card text-card-foreground border-border">
          <CardHeader>
            <div className="flex items-center space-x-4">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={`${username}'s profile`} className="w-16 h-16 rounded-full" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  No Photo
                </div>
              )}
              <CardTitle className="text-foreground">{user.username}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-foreground mb-4">{user.bio || 'No bio available'}</p>
            <div className="space-y-2">
              <p className="text-muted-foreground">Repositories: {repos.length} total</p>
              {repos.length > 0 && (
                <div>
                  <p className="text-muted-foreground font-semibold">Top Repositories:</p>
                  <ul className="list-disc list-inside text-muted-foreground">
                    {repos.slice(0, 3).map((repo) => (
                      <li key={repo.githubId}>
                        <a href={repo.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          {repo.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <p className="text-muted-foreground">
                  Commits: {totalCommits !== null ? totalCommits : 'Loading...'}
                </p>
                <button
                  onClick={handleSyncCommits}
                  disabled={syncing}
                  className="bg-primary text-primary-foreground p-1 rounded hover:bg-[#4a2885] disabled:bg-muted"
                >
                  {syncing ? 'Syncing...' : 'Sync Commits'}
                </button>
                <button
                  onClick={handleViewCommits}
                  className="bg-primary text-primary-foreground p-1 rounded hover:bg-[#4a2885]"
                >
                  View Commits
                </button>
              </div>
              <p className="text-muted-foreground">PRs: Coming soon</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-foreground">Loading...</span>
        </div>
      )}
    </div>
  );
}

export default Insights;