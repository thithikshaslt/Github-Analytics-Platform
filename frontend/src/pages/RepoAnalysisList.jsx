import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Compass, Calendar, GitBranch, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { listRepositories } from '@/services/intelligenceApi';

export default function RepoAnalysisList() {
  const navigate = useNavigate();
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listRepositories()
      .then((res) => setRepositories(res.data || []))
      .catch((err) => console.error('Failed to list repositories:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#0d0a17] text-foreground p-6 md:p-8">
      <div className="max-w-6xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#5a329f]/30 pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-muted-foreground hover:text-white p-2 hover:bg-[#201a33]"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
              <Compass className="w-6 h-6 text-purple-400" />
              Codebase Intelligence Projects
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              All registered repositories and reverse-engineered documentation
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link to="/intelligence/local">
            <Button className="bg-[#5a329f] hover:bg-[#6f3ec7] text-white text-xs">
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Analyze Local Folder
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        {loading ? (
          <p className="text-muted-foreground text-sm">Loading projects...</p>
        ) : repositories.length === 0 ? (
          <div className="text-center py-16 border border-[#5a329f]/30 rounded-xl bg-[#141022]">
            <p className="text-foreground text-sm font-medium">No repositories registered yet.</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              Analyze a GitHub user's top repositories or register a local codebase folder.
            </p>
            <Link to="/intelligence/local">
              <Button className="bg-[#5a329f] text-white text-xs">
                Analyze Local Codebase
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {repositories.map((repo) => (
              <Card
                key={repo.id}
                className="bg-[#141022] border-[#5a329f]/30 hover:bg-[#1d1730] transition-colors"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded uppercase bg-[#2b2144] text-purple-300 border border-purple-500/20">
                      {repo.sourceType}
                    </span>
                    {repo.lastAnalyzedAt && (
                      <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                        ● Analyzed
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-base text-white mt-2">
                    {repo.fullName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-xs text-muted-foreground space-y-1 mb-4">
                    <div className="flex items-center gap-1.5">
                      <GitBranch className="w-3.5 h-3.5 text-purple-400" />
                      <span>Branch: {repo.defaultBranch}</span>
                    </div>
                    {repo.lastAnalyzedAt && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-purple-400" />
                        <span>Last Analyzed: {new Date(repo.lastAnalyzedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  <Link
                    to={
                      repo.sourceType === 'local'
                        ? `/intelligence/local/${encodeURIComponent(repo.name)}?repoId=${repo.id}`
                        : `/intelligence/${repo.owner}/${repo.name}?repoId=${repo.id}`
                    }
                  >
                    <Button className="w-full bg-[#5a329f]/80 hover:bg-[#5a329f] text-white text-xs h-8">
                      <Compass className="w-3.5 h-3.5 mr-1.5" /> Open Intelligence Dashboard
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}