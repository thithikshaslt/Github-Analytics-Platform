import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUser, getRepos, getCommitsTotal, syncCommits, getPRsTotal, syncPRs } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

function Insights() {
  const { username } = useParams();
  const [user, setUser] = useState(null);
  const [repos, setRepos] = useState([]);
  const [totalCommits, setTotalCommits] = useState(null);
  const [totalPRs, setTotalPRs] = useState(null); // New state for PRs
  const [error, setError] = useState(null);
  const [syncingCommits, setSyncingCommits] = useState(false); // Renamed for clarity
  const [syncingPRs, setSyncingPRs] = useState(false); // New state for PR sync
  const navigate = useNavigate();

  const fetchData = () => {
    Promise.all([
      getUser(username),
      getRepos(username),
      getCommitsTotal(username),
      getPRsTotal(username), // Fetch PR total
    ])
      .then(([userResponse, reposResponse, commitsResponse, prsResponse]) => {
        console.log("Commits Total:", commitsResponse.data);
        console.log("PRs Total:", prsResponse.data);
        setUser(userResponse.data);
        setRepos(reposResponse.data);
        setTotalCommits(commitsResponse.data.totalCommits);
        setTotalPRs(prsResponse.data.totalPRs); // Set PR total
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
    setSyncingCommits(true);
    try {
      const syncResponse = await syncCommits(username);
      setTotalCommits(syncResponse.data.totalCommits);
      console.log(`Synced ${syncResponse.data.totalCommits} commits`);
      fetchData(); // Refresh all data
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncingCommits(false);
    }
  };

  const handleSyncPRs = async () => {
    setSyncingPRs(true);
    try {
      const syncResponse = await syncPRs(username);
      setTotalPRs(syncResponse.data.totalPRs);
      console.log(`Synced ${syncResponse.data.totalPRs} PRs`);
      fetchData(); // Refresh all data
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncingPRs(false);
    }
  };

  const handleViewCommits = () => {
    navigate(`/commits/${username}`);
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
                  disabled={syncingCommits}
                  className="bg-primary text-primary-foreground p-1 rounded hover:bg-[#4a2885] disabled:bg-muted"
                >
                  {syncingCommits ? 'Syncing...' : 'Sync Commits'}
                </button>
                <button
                  onClick={handleViewCommits}
                  className="bg-primary text-primary-foreground p-1 rounded hover:bg-[#4a2885]"
                >
                  View Commits
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <p className="text-muted-foreground">
                  PRs: {totalPRs !== null ? totalPRs : 'Loading...'} {/* Display PR total */}
                </p>
                <button
                  onClick={handleSyncPRs}
                  disabled={syncingPRs}
                  className="bg-primary text-primary-foreground p-1 rounded hover:bg-[#4a2885] disabled:bg-muted"
                >
                  {syncingPRs ? 'Syncing...' : 'Sync PRs'}
                </button>
              </div>
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