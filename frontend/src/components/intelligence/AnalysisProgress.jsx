import React from 'react';
import { Loader2, CheckCircle2, AlertCircle, GitBranch, FolderSearch, Cpu, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AnalysisProgress({ analysis, onRetry }) {
  if (!analysis) return null;

  const { status, progressMessage, errorMessage, fileCount, totalSizeKb } = analysis;
  const stages = [
    { key: 'cloning', label: 'Acquisition', desc: 'Cloning / accessing repository files', icon: GitBranch },
    { key: 'reading', label: 'Codebase Scan', desc: 'Filtering & categorizing source code', icon: FolderSearch },
    { key: 'generating', label: 'LLM Generation', desc: 'Reverse-engineering docs & diagrams', icon: Cpu },
    { key: 'completed', label: 'Completed', desc: 'Intelligence artifacts ready', icon: Sparkles }
  ];

  const getStageState = (stageKey) => {
    if (status === 'failed') return 'failed';
    if (status === 'completed') return 'completed';
    
    const stageOrder = ['queued', 'cloning', 'reading', 'generating', 'completed'];
    const currentIndex = stageOrder.indexOf(status);
    const targetIndex = stageOrder.indexOf(stageKey);

    if (currentIndex > targetIndex) return 'completed';
    if (currentIndex === targetIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="rounded-xl border border-[#5a329f]/50 bg-[#171226] p-6 shadow-2xl max-w-2xl mx-auto my-8">
      <div className="flex items-center justify-between border-b border-[#5a329f]/30 pb-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            {status !== 'failed' && status !== 'completed' && (
              <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
            )}
            {status === 'completed' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            {status === 'failed' && <AlertCircle className="w-5 h-5 text-red-400" />}
            Codebase Reverse Engineering
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Powered by on-premise local LLM (Ollama)
          </p>
        </div>
        {fileCount && (
          <div className="text-right">
            <span className="text-xs font-mono text-purple-300 bg-[#2b2144] px-2.5 py-1 rounded-full border border-purple-500/20">
              {fileCount} files ({totalSizeKb} KB)
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
        {stages.map((stage) => {
          const state = getStageState(stage.key);
          const Icon = stage.icon;

          let badgeBg = 'bg-[#1e1933] border-border text-muted-foreground';
          if (state === 'active') {
            badgeBg = 'bg-[#3b2169] border-[#8b5cf6] text-purple-200 ring-2 ring-purple-500/30';
          } else if (state === 'completed') {
            badgeBg = 'bg-[#153427] border-emerald-500/40 text-emerald-300';
          } else if (state === 'failed') {
            badgeBg = 'bg-[#321319] border-red-500/30 text-red-400';
          }

          return (
            <div
              key={stage.key}
              className={`flex flex-col p-3 rounded-lg border transition-all ${badgeBg}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <Icon className="w-4 h-4" />
                {state === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                {state === 'active' && <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-300" />}
              </div>
              <span className="text-xs font-semibold">{stage.label}</span>
              <span className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                {stage.desc}
              </span>
            </div>
          );
        })}
      </div>

      <div className="p-3.5 rounded-lg bg-[#0e0b17] border border-[#5a329f]/20 flex items-center justify-between">
        <span className="text-xs text-purple-200 font-mono flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
          {progressMessage || 'Processing codebase...'}
        </span>
      </div>

      {status === 'failed' && (
        <div className="mt-4 p-4 rounded-lg bg-red-950/40 border border-red-500/40 text-red-200 text-sm">
          <p className="font-semibold mb-1">Analysis Failed</p>
          <p className="text-xs opacity-90">{errorMessage || 'An unexpected error occurred during processing.'}</p>
          {onRetry && (
            <Button
              onClick={onRetry}
              className="mt-3 bg-red-600 hover:bg-red-700 text-white text-xs h-8"
            >
              Retry Analysis
            </Button>
          )}
        </div>
      )}
    </div>
  );
}