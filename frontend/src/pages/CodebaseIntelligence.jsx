import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  BookOpen, FileText, Compass, Network, MessageSquare, Play,
  RefreshCw, Download, ArrowLeft, CheckCircle2, AlertCircle, Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  registerRepository,
  createAnalysis,
  getAnalysis,
  getLatestRepoAnalysis,
  getRepository,
  getIntelligenceHealth
} from '@/services/intelligenceApi';
import MarkdownViewer from '@/components/intelligence/MarkdownViewer';
import AnalysisProgress from '@/components/intelligence/AnalysisProgress';
import CodebaseChat from '@/components/intelligence/CodebaseChat';

export default function CodebaseIntelligence() {
  const { owner, repo } = useParams();
  const [searchParams] = useSearchParams();
  const repoIdParam = searchParams.get('repoId');
  const navigate = useNavigate();

  const [repository, setRepository] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loadingRepo, setLoadingRepo] = useState(true);
  const [startingAnalysis, setStartingAnalysis] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [health, setHealth] = useState(null);
  const pollTimerRef = useRef(null);

  useEffect(() => {
    getIntelligenceHealth()
      .then((res) => setHealth(res.data))
      .catch(() => setHealth({ status: 'offline', ollama: { connected: false } }));
  }, []);

  useEffect(() => {
    const initRepo = async () => {
      setLoadingRepo(true);
      try {
        let repoData = null;
        if (repoIdParam) {
          const res = await getRepository(repoIdParam);
          repoData = res.data;
        } else if (owner && repo) {
          const res = await registerRepository({
            sourceType: 'github',
            fullName: `${owner}/${repo}`,
            name: repo,
            owner: owner,
            cloneUrl: `https://github.com/${owner}/${repo}.git`
          });
          repoData = res.data;
        }

        setRepository(repoData);

        if (repoData?.id) {
          try {
            const analysisRes = await getLatestRepoAnalysis(repoData.id);
            setAnalysis(analysisRes.data);
          } catch (err) {
            setAnalysis(null);
          }
        }
      } catch (err) {
        console.error('Failed to initialize repository:', err);
      } finally {
        setLoadingRepo(false);
      }
    };
    initRepo();
  }, [owner, repo, repoIdParam]);

  useEffect(() => {
    if (!analysis || !analysis.id) return;

    const isRunning = ['queued', 'cloning', 'reading', 'generating'].includes(analysis.status);
    if (isRunning) {
      pollTimerRef.current = setInterval(async () => {
        try {
          const res = await getAnalysis(analysis.id);
          setAnalysis(res.data);
          if (res.data.status === 'completed' || res.data.status === 'failed') {
            clearInterval(pollTimerRef.current);
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 3000);
    }
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [analysis?.id, analysis?.status]);

  const handleStartAnalysis = async () => {
    if (!repository?.id || startingAnalysis) return;
    setStartingAnalysis(true);
    try {
      const res = await createAnalysis(repository.id);
      setAnalysis(res.data);
    } catch (err) {
      alert(`Could not start analysis: ${err.response?.data?.detail || err.message}`);
    } finally {
      setStartingAnalysis(false);
    }
  };

  const handleDownloadMarkdown = () => {
    if (!analysis) return;
    const markdownContent = `# Codebase Intelligence & Reverse Documentation: ${repository?.fullName || 'Project'}

Generated on: ${new Date().toLocaleString()}

---

## 1. Codebase Overview
${analysis.overview || 'N/A'}

---

## 2. Functional Requirements Document (FRD)
${analysis.requirements || 'N/A'}

---

## 3. Software Design Document (SDD)
${analysis.designDoc || 'N/A'}

---

## 4. Architecture & Workflow Diagrams
${analysis.diagrams || 'N/A'}
`;

    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${(repository?.name || 'codebase')}-documentation.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isAnalyzing = analysis && ['queued', 'cloning', 'reading', 'generating'].includes(analysis.status);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'requirements', label: 'Requirements (FRD)', icon: FileText },
    { id: 'design', label: 'Design Doc (SDD)', icon: Compass },
    { id: 'diagrams', label: 'Diagrams (Mermaid)', icon: Network },
    { id: 'qa', label: 'Codebase Q&A', icon: MessageSquare }
  ];

  return (
    <div className="min-h-screen bg-[#0d0a17] text-foreground p-6 md:p-8">
      <div className="max-w-7xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#5a329f]/30 pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-white p-2 hover:bg-[#201a33]"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-400" />
              <h1 className="text-xl md:text-2xl font-bold text-white">
                {repository ? repository.fullName : 'Codebase Intelligence'}
              </h1>
              {repository?.sourceType && (
                <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-[#281f40] text-purple-300 border border-[#5a329f]/40 uppercase">
                  {repository.sourceType}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Automated source code reverse engineering and architectural analysis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {health?.ollama?.connected ? (
            <span className="flex items-center gap-1.5 text-xs text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" /> Ollama Ready ({health.ollama.configuredModel})
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-950/60 border border-amber-500/30 px-3 py-1 rounded-full" title="Make sure Ollama is running (`ollama serve`)">
              <AlertCircle className="w-3.5 h-3.5" /> Ollama Offline
            </span>
          )}

          {analysis?.status === 'completed' && (
            <Button
              onClick={handleDownloadMarkdown}
              variant="outline"
              className="text-xs border-[#5a329f]/50 bg-[#1c162e] hover:bg-[#2b2144] text-purple-200"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" /> Export Docs (.md)
            </Button>
          )}

          <Button
            onClick={handleStartAnalysis}
            disabled={isAnalyzing || startingAnalysis}
            className="bg-[#5a329f] hover:bg-[#6c3dbf] text-white text-xs px-4"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Analyzing...
              </>
            ) : analysis?.status === 'completed' ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Re-analyze
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 mr-1.5" /> Start Analysis
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {isAnalyzing && (
          <AnalysisProgress analysis={analysis} onRetry={handleStartAnalysis} />
        )}

        {analysis?.status === 'failed' && !isAnalyzing && (
          <AnalysisProgress analysis={analysis} onRetry={handleStartAnalysis} />
        )}

        {!analysis && !loadingRepo && !isAnalyzing && (
          <div className="text-center py-20 px-4 rounded-2xl border border-[#5a329f]/30 bg-[#151124] shadow-xl max-w-2xl mx-auto my-12">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#5a329f] to-[#8b5cf6] flex items-center justify-center mx-auto mb-5 shadow-lg">
              <Compass className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Ready to Reverse-Engineer Codebase
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              Our local AI will scan repository files, reconstruct functional specifications, architectural designs, and Mermaid workflow diagrams.
            </p>
            <Button
              onClick={handleStartAnalysis}
              disabled={startingAnalysis}
              className="bg-[#5a329f] hover:bg-[#7442cc] text-white font-medium px-6 py-2.5 shadow-lg shadow-purple-900/30"
            >
              <Play className="w-4 h-4 mr-2" /> Start Codebase Reverse Engineering
            </Button>
          </div>
        )}

        {analysis?.status === 'completed' && (
          <div className="space-y-6">
            <div className="flex border-b border-[#5a329f]/40 gap-2 overflow-x-auto pb-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
                      isActive
                        ? 'border-[#a78bfa] text-white bg-[#221a36]'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-[#1a142b]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-purple-400' : 'text-muted-foreground'}`} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="bg-[#141022] rounded-xl border border-[#5a329f]/30 p-6 md:p-8 shadow-xl min-h-[500px]">
              {activeTab === 'overview' && (
                <div>
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-purple-400" />
                    Codebase Overview & Architecture Summary
                  </h3>
                  <MarkdownViewer content={analysis.overview} />
                </div>
              )}

              {activeTab === 'requirements' && (
                <div>
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-400" />
                    Functional Requirements Document (FRD)
                  </h3>
                  <MarkdownViewer content={analysis.requirements} />
                </div>
              )}

              {activeTab === 'design' && (
                <div>
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Compass className="w-5 h-5 text-purple-400" />
                    Software Design Document (SDD)
                  </h3>
                  <MarkdownViewer content={analysis.designDoc} />
                </div>
              )}

              {activeTab === 'diagrams' && (
                <div>
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Network className="w-5 h-5 text-purple-400" />
                    Workflow & Architectural Diagrams (Mermaid)
                  </h3>
                  <MarkdownViewer content={analysis.diagrams} />
                </div>
              )}

              {activeTab === 'qa' && (
                <div>
                  <CodebaseChat repositoryId={repository?.id} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}