import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getUser, getRepos, getCommits } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

function Insights() {
  const { username } = useParams();
  const [user, setUser] = useState(null);
  const [repos, setRepos] = useState([]);
  const [commits, setCommits] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([getUser(username), getRepos(username), getCommits(username)])
      .then(([userResponse, reposResponse, commitsResponse]) => {
        console.log("User Data:", userResponse.data);
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
    <div className="min-h-screen bg-gray-100 p-6 w-full"> {/* Added w-full */}
      <h1 className="text-3xl text-gray-900 mb-6">Insights for {username}</h1>
      {error && <p className="text-red-500 mb-4">Error: {error}</p>}
      {user ? (
        <Card className="w-full max-w-2xl mx-auto"> {/* Changed max-w-md to max-w-2xl */}
          <CardHeader>
            <div className="flex items-center space-x-4">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={`${username}'s profile`}
                  className="w-16 h-16 rounded-full"
                  onError={(e) => console.error("Image load failed:", e)}
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
                  No Photo
                </div>
              )}
              <CardTitle>{user.username}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{user.bio || 'No bio available'}</p>
            <p className="mt-2 text-gray-600">Repositories: {repos.length}</p>
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