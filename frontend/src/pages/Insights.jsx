import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getUser, getRepos, getCommits } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

function Insights() {
  const { username } = useParams(); // e.g., /insights/thithikshaslt
  const [user, setUser] = useState(null);
  const [repos, setRepos] = useState([]);
  const [commits, setCommits] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([getUser(username), getRepos(username), getCommits(username)])
      .then(([userResponse, reposResponse, commitsResponse]) => {
        setUser(userResponse.data);
        setRepos(reposResponse.data);
        setCommits(commitsResponse.data);
      })
      .catch((err) => {
        console.error('Fetch error:', err);
        setError(err.message);
      });
  }, [username]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl text-gray-900 mb-6">Insights for {username}</h1>
      {error && <p className="text-red-500 mb-4">Error: {error}</p>}
      {user ? (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>{user.username}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{user.bio || 'No bio available'}</p>
            <p className="mt-2 text-gray-600">Repos: {repos.length}</p>
            {repos.map((repo) => (
              <p key={repo.githubId || repo.name} className="text-gray-600 ml-4">
                - <a href={repo.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                  {repo.name}
                </a>
                {repo.description && `: ${repo.description}`}
              </p>
            ))}
            <p className="mt-2 text-gray-600">
              Commits: {commits ? commits.totalCommits : 'Loading...'}
            </p>
            <p className="mt-2 text-gray-600">PRs: Coming soon</p>
          </CardContent>
        </Card>
      ) : (
        <p className="text-gray-900">Loading...</p>
      )}
    </div>
  );
}

export default Insights;