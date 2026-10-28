import React from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const LOCAL_STAGES = [
  { key: 'reading', label: 'Reading files' },
  { key: 'context', label: 'Preparing context' },
  { key: 'analyzing', label: 'Analyzing with Ollama' },
  { key: 'generating', label: 'Generating document' },
  { key: 'complete', label: 'Complete' }
];

const GITHUB_STAGES = [
  { key: 'validating', label: 'Validating GitHub URL' },
  { key: 'cloning', label: 'Cloning repository' },
  { key: 'reading', label: 'Reading files' },
  { key: 'context', label: 'Preparing context' },
  { key: 'analyzing', label: 'Analyzing with Ollama' },
  { key: 'generating', label: 'Generating document' },
  { key: 'complete', label: 'Complete' }
];

export default function AnalysisProgress({ currentStage, progress = 0, message = '', error = null, isGithub = false }) {
  const stages = (isGithub || currentStage === 'validating' || currentStage === 'cloning')
    ? GITHUB_STAGES
    : LOCAL_STAGES;

  const getStageStatus = (key) => {
    if (error) return 'error';
    const keys = stages.map(s => s.key);
    const currentIndex = keys.indexOf(currentStage);
    const stageIndex = keys.indexOf(key);

    if (currentStage === 'complete' || stageIndex < currentIndex) return 'done';
    if (stageIndex === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="w-full max-w-2xl mx-auto my-6 p-5 rounded-lg border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-foreground flex items-center gap-2">
          {error ? (
            <AlertCircle className="w-4 h-4 text-destructive" />
          ) : currentStage === 'complete' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          ) : (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          )}
          {error ? 'Analysis Failed' : message || 'Processing...'}
        </span>
        <span className="text-xs font-mono text-muted-foreground">
          {error ? 'Error' : `${progress}%`}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-muted rounded-full h-2 mb-4 overflow-hidden">
        <div
          className={`h-2 transition-all duration-300 rounded-full ${
            error ? 'bg-destructive' : currentStage === 'complete' ? 'bg-emerald-500' : 'bg-primary'
          }`}
          style={{ width: `${Math.max(progress, error ? 100 : 5)}%` }}
        />
      </div>

      {/* Stages Row */}
      <div className="flex justify-between items-center text-xs text-muted-foreground pt-1 border-t border-border/50">
        {stages.map((s) => {
          const status = getStageStatus(s.key);
          return (
            <div
              key={s.key}
              className={`flex items-center gap-1 ${
                status === 'active'
                  ? 'text-primary font-medium'
                  : status === 'done'
                  ? 'text-foreground'
                  : 'text-muted-foreground/60'
              }`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  status === 'active'
                    ? 'bg-primary animate-ping'
                    : status === 'done'
                    ? 'bg-emerald-500'
                    : 'bg-muted-foreground/30'
                }`}
              />
              <span className="hidden sm:inline">{s.label}</span>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="mt-3 p-3 rounded bg-destructive/10 border border-destructive/20 text-xs text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}