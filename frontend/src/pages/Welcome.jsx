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
    <div className="min-h-screen bg-background flex items-center justify-center w-full dark">
      <div className="text-center w-full max-w-md mx-auto p-6">
        <h1 className="text-4xl text-foreground mb-6">Welcome!</h1>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your GitHub username"
            className="border-border bg-card text-foreground placeholder-muted-foreground focus:ring-primary focus:border-primary"
          />
          <Button type="submit" className="bg-primary text-primary-foreground hover:bg-[#4a2885]">
            Go
          </Button>
        </form>
      </div>
    </div>
  );
}

export default Welcome;