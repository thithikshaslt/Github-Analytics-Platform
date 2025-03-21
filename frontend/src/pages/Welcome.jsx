import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

function Welcome() {
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      navigate(`/insights/${username}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl text-gray-900 mb-6">Welcome!</h1>
        <form onSubmit={handleSubmit} className="flex gap-2 max-w-md mx-auto">
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your GitHub username"
            className="border-gray-300 focus:ring-blue-600"
          />
          <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700">
            Go
          </Button>
        </form>
      </div>
    </div>
  );
}

export default Welcome;