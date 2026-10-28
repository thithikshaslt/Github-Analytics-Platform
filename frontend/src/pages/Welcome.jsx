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
      <div className="text-center w-full max-w-md mx-auto p-6 space-y-6">
        <h1 className="text-4xl text-foreground font-semibold tracking-tight">Welcome!</h1>
        
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

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-border"></div>
          <span className="flex-shrink mx-4 text-xs text-muted-foreground uppercase">or</span>
          <div className="flex-grow border-t border-border"></div>
        </div>

        <div>
          <Button
            onClick={() => navigate('/intelligence')}
            variant="outline"
            className="w-full border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground py-2"
          >
            Codebase Intelligence
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Welcome;