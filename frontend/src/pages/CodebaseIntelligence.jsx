import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Folder, Download, Play, RefreshCw, CheckCircle2 } from 'lucide-react';
import AnalysisProgress from '@/components/intelligence/AnalysisProgress';
import MarkdownViewer from '@/components/intelligence/MarkdownViewer';
import { analyzeCodebaseStream } from '@/services/intelligenceApi';

const EXCLUDE_EXTENSIONS = [
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.mp4', '.zip', '.tar',
  '.gz', '.pdf', '.exe', '.bin', '.woff', '.woff2', '.ttf', '.pyc', '.lock'
];

export default function CodebaseIntelligence() {
  const navigate = useNavigate();
  const folderInputRef = useRef(null);

  const [folderName, setFolderName] = useState('');
  const [folderPathInput, setFolderPathInput] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stage, setStage] = useState('');
  const [progress, setProgress] = useState(0);
  const [stageMessage, setStageMessage] = useState('');
  const [error, setError] = useState(null);
  
  const [markdown, setMarkdown] = useState('');
  const [analysisStats, setAnalysisStats] = useState(null);

  // Handle folder chosen via browser file dialog
  const handleFolderSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Determine root folder name
    const samplePath = files[0].webkitRelativePath || files[0].name;
    const rootName = samplePath.split('/')[0] || 'Repository';
    setFolderName(rootName);
    setFolderPathInput('');
    setError(null);

    // Filter text files under 200KB excluding obvious dependencies
    const validFiles = files.filter(f => {
      const path = (f.webkitRelativePath || f.name).replace(/\\/g, '/');
      const lower = path.toLowerCase();
      if (
        lower.includes('/node_modules/') ||
        lower.includes('/.git/') ||
        lower.includes('/dist/') ||
        lower.includes('/build/') ||
        lower.includes('/.venv/') ||
        lower.includes('/__pycache__/')
      ) {
        return false;
      }
      if (EXCLUDE_EXTENSIONS.some(ext => lower.endsWith(ext))) {
        return false;
      }
      if (f.size > 200 * 1024) return false;
      return true;
    });

    // Read file contents
    const readPromises = validFiles.slice(0, 100).map(async (file) => {
      try {
        const text = await file.text();
        return {
          path: file.webkitRelativePath || file.name,
          content: text
        };
      } catch (err) {
        return null;
      }
    });

    const loaded = (await Promise.all(readPromises)).filter(Boolean);
    setSelectedFiles(loaded);
  };

  const handleStartAnalysis = async () => {
    if (!selectedFiles.length && !folderPathInput.trim()) {
      setError('Please select a local folder or enter a folder path.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setProgress(5);
    setStage('reading');
    setStageMessage('Starting codebase analysis...');
    setMarkdown('');
    setAnalysisStats(null);

    const payload = folderPathInput.trim()
      ? { folder_path: folderPathInput.trim(), folder_name: folderPathInput.split(/[\\/]/).pop() || 'Repository' }
      : { folder_name: folderName, files: selectedFiles };

    try {
      await analyzeCodebaseStream(payload, (event) => {
        if (event.stage === 'error') {
          setError(event.message || 'Analysis failed.');
          setIsAnalyzing(false);
          return;
        }

        setStage(event.stage);
        setProgress(event.progress || 0);
        setStageMessage(event.message || '');

        if (event.stage === 'complete') {
          setMarkdown(event.markdown || '');
          setAnalysisStats(event.stats || null);
          setIsAnalyzing(false);
        }
      });
    } catch (err) {
      setError(err.message || 'Connection to intelligence service failed.');
      setIsAnalyzing(false);
    }
  };

  const handleDownload = () => {
    if (!markdown) return;
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filename = `${folderName || 'codebase'}-documentation.md`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background text-foreground dark p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Navigation & Header */}
        <div className="border-b border-border pb-6 space-y-3">
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/')}
              className="text-muted-foreground hover:text-foreground border-border flex items-center gap-2 px-3 py-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Codebase Intelligence</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Reverse-engineer technical requirements and architecture using local Ollama (qwen3:8b)
            </p>
          </div>
        </div>

        {/* Folder Selection Controls */}
        <div className="p-5 rounded-lg border border-border bg-card space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <input
              ref={folderInputRef}
              type="file"
              webkitdirectory=""
              directory=""
              multiple
              onChange={handleFolderSelect}
              className="hidden"
            />
            
            <Button
              type="button"
              variant="outline"
              onClick={() => folderInputRef.current?.click()}
              disabled={isAnalyzing}
              className="flex items-center gap-2 border-border"
            >
              <Folder className="w-4 h-4 text-primary" />
              Select Folder
            </Button>

            <div className="flex-1">
              <Input
                value={folderPathInput}
                onChange={(e) => {
                  setFolderPathInput(e.target.value);
                  setSelectedFiles([]);
                  setFolderName(e.target.value.split(/[\\/]/).pop() || '');
                }}
                disabled={isAnalyzing}
                placeholder="Or paste local disk path (e.g. D:\projects\my-repo)"
                className="bg-background border-border text-xs"
              />
            </div>

            <Button
              type="button"
              onClick={handleStartAnalysis}
              disabled={isAnalyzing || (!selectedFiles.length && !folderPathInput.trim())}
              className="bg-primary text-primary-foreground hover:bg-[#4a2885] flex items-center gap-2 px-5"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Analyze
                </>
              )}
            </Button>
          </div>

          {/* Folder Status Label */}
          {folderName && (
            <div className="text-xs text-muted-foreground flex items-center gap-2 pt-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>
                Selected folder: <strong className="text-foreground">{folderName}</strong>
                {selectedFiles.length > 0 && ` (${selectedFiles.length} source files prepared)`}
              </span>
            </div>
          )}
        </div>

        {/* Progress Indicator */}
        {(isAnalyzing || error || stage === 'complete') && (
          <AnalysisProgress
            currentStage={stage}
            progress={progress}
            message={stageMessage}
            error={error}
          />
        )}

        {/* Generated Markdown Document & Download */}
        {markdown && (
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Generated Documentation</h2>
                {analysisStats && (
                  <p className="text-xs text-muted-foreground">
                    Analyzed {analysisStats.analyzed_files} files from {analysisStats.folder_name}
                    {analysisStats.truncated && ' (representative architectural subset)'}
                  </p>
                )}
              </div>
              <Button
                onClick={handleDownload}
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-[#4a2885] flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Markdown
              </Button>
            </div>

            <div className="pt-2">
              <MarkdownViewer content={markdown} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}