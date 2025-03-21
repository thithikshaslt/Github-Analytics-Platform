import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getUser } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

function Insights() {
  const { username } = useParams();
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getUser(username)
      .then((response) => setUser(response.data))
      .catch((err) => setError(err.message));
  }, [username]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl text-gray-900 mb-6">Insights for {username}</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {user ? (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>{user.username}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{user.bio || 'No bio available'}</p>
            <p className="mt-2 text-gray-600">Repos: Coming soon</p>
            <p className="text-gray-600">Commits: Coming soon</p>
            <p className="text-gray-600">PRs: Coming soon</p>
          </CardContent>
        </Card>
      ) : (
        <p className="text-gray-900">Loading...</p>
      )}
    </div>
  );
}

export default Insights;