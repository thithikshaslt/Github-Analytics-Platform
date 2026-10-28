import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Code, Eye } from 'lucide-react';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    darkMode: true,
    background: '#1b1726',
    primaryColor: '#5a329f',
    primaryTextColor: '#f8fafc',
    primaryBorderColor: '#7c3aed',
    lineColor: '#a78bfa',
    secondaryColor: '#2b2340',
    tertiaryColor: '#201a30'
  },
  securityLevel: 'loose'
});

let diagramIdCounter = 0;

export default function MermaidDiagram({ chartCode, title }) {
  const [svgContent, setSvgContent] = useState('');
  const [error, setError] = useState(null);
  const [showRaw, setShowRaw] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    if (!chartCode) return;

    const renderDiagram = async () => {
      try {
        setError(null);
        let cleanCode = chartCode.trim();
        if (cleanCode.startsWith('```mermaid')) {
          cleanCode = cleanCode.replace(/^```mermaid\s*/i, '').replace(/```$/, '').trim();
        } else if (cleanCode.startsWith('```')) {
          cleanCode = cleanCode.replace(/^```\s*/, '').replace(/```$/, '').trim();
        }

        const id = `mermaid-svg-${diagramIdCounter++}`;
        const { svg } = await mermaid.render(id, cleanCode);
        if (isMounted) {
          setSvgContent(svg);
        }
      } catch (err) {
        if (isMounted) {
          console.warn('Mermaid rendering issue:', err);
          setError('Could not render graphic diagram. Showing raw definition below.');
          setShowRaw(true);
        }
      }
    };

    renderDiagram();

    return () => {
      isMounted = false;
    };
  }, [chartCode]);

  return (
    <div className="my-6 rounded-lg border border-[#5a329f]/40 bg-[#161224] p-4 shadow-lg overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#5a329f]/30 pb-2 mb-3">
        <h4 className="text-sm font-semibold text-purple-300">
          {title || 'Workflow Diagram'}
        </h4>
        <div className="flex gap-2">
          <button
            onClick={() => setShowRaw(!showRaw)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-white px-2 py-1 rounded bg-[#251f38] transition-colors"
          >
            {showRaw ? <Eye className="w-3.5 h-3.5" /> : <Code className="w-3.5 h-3.5" />}
            {showRaw ? 'View Diagram' : 'View Code'}
          </button>
        </div>
      </div>

      {showRaw ? (
        <pre className="p-3 bg-[#0d0b14] text-xs text-purple-200 font-mono rounded overflow-x-auto max-h-96">
          {chartCode}
        </pre>
      ) : error ? (
        <div className="p-4 bg-red-950/30 border border-red-500/30 rounded text-xs text-red-300">
          <p>{error}</p>
          <pre className="mt-2 p-2 bg-[#0d0b14] font-mono rounded overflow-x-auto">
            {chartCode}
          </pre>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="mermaid-wrapper flex justify-center items-center py-4 overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      )}
    </div>
  );
}