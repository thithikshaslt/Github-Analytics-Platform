import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getUser, getRepos, getCommitsTotal, syncCommits } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

function Insights() {
  const { username } = useParams();
  const [user, setUser] = useState(null);
  const [repos, setRepos] = useState([]);
  const [totalCommits, setTotalCommits] = useState(null);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);

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

  return (
    <div className="min-h-screen bg-gray-100 p-6 w-full">
      <h1 className="text-3xl text-gray-900 mb-6">Insights for {username}</h1>
      {error && <p className="text-red-500 mb-4">Error: {error}</p>}
      {user ? (
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center space-x-4">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={`${username}'s profile`} className="w-16 h-16 rounded-full" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
                  No Photo
                </div>
              )}
              <CardTitle>{user.username}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">{user.bio || 'No bio available'}</p>
            <div className="space-y-2">
              <p className="text-gray-600">Repositories: {repos.length} total</p>
              {repos.length > 0 && (
                <div>
                  <p className="text-gray-600 font-semibold">Top Repositories:</p>
                  <ul className="list-disc list-inside text-gray-600">
                    {repos.slice(0, 3).map((repo) => (
                      <li key={repo.githubId}>
                        <a href={repo.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                          {repo.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <p className="text-gray-600">
                  Commits: {totalCommits !== null ? totalCommits : 'Loading...'}
                </p>
                <button
                  onClick={handleSyncCommits}
                  disabled={syncing}
                  className="bg-blue-500 text-white p-1 rounded hover:bg-blue-600 disabled:bg-gray-400"
                >
                  {syncing ? 'Syncing...' : 'Sync Commits'}
                </button>
              </div>
              <p className="text-gray-600">PRs: Coming soon</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-gray-900">Loading...</span>
        </div>
      )}
    </div>
  );
}

export default Insights;