import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderGit2, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { registerRepository } from '@/services/intelligenceApi';

export default function LocalRepoSetup() {
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState('');
  const [localPath, setLocalPath] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleUseCurrentProject = () => {
    setProjectName('Github-Analytics-Platform');
    setLocalPath('d:\\Sem 6\\20XW68\\Github-Analytics-Platform');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!projectName.trim() || !localPath.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await registerRepository({
        sourceType: 'local',
        fullName: projectName.trim(),
        name: projectName.trim(),
        owner: 'local',
        localPath: localPath.trim()
      });

      const repo = res.data;
      navigate(`/intelligence/local/${encodeURIComponent(repo.name)}?repoId=${repo.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to register local repository');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0a17] text-foreground p-6 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4 text-muted-foreground hover:text-white p-2 hover:bg-[#201a33]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
        </Button>

        <Card className="bg-[#141022] border-[#5a329f]/40 shadow-2xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-900/60 border border-purple-500/40 flex items-center justify-center">
                <FolderGit2 className="w-5 h-5 text-purple-300" />
              </div>
              <div>
                <CardTitle className="text-xl text-white">
                  Analyze Local Codebase
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Point the local LLM directly to any folder on your machine
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-purple-200 block mb-1.5">
                  Project / Repository Name
                </label>
                <Input
                  type="text"
                  placeholder="e.g. my-awesome-backend"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  required
                  className="bg-[#0e0b18] border-[#5a329f]/40 text-foreground"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-purple-200 block mb-1.5">
                  Absolute Local Folder Path
                </label>
                <Input
                  type="text"
                  placeholder="e.g. C:\Users\Projects\my-project"
                  value={localPath}
                  onChange={(e) => setLocalPath(e.target.value)}
                  required
                  className="bg-[#0e0b18] border-[#5a329f]/40 text-foreground font-mono text-xs"
                />
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleUseCurrentProject}
                  className="text-xs text-purple-300 hover:text-purple-200 flex items-center gap-1.5 underline underline-offset-4"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Or autofill this GitHub-Analytics-Platform project path
                </button>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-xs text-red-300">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#5a329f] hover:bg-[#6f3ec7] text-white font-medium mt-4"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Registering...
                  </>
                ) : (
                  'Proceed to Intelligence Dashboard'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}