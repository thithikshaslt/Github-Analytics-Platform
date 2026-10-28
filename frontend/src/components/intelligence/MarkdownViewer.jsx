import React from 'react';
import ReactMarkdown from 'react-markdown';
import MermaidDiagram from './MermaidDiagram';

export default function MarkdownViewer({ content }) {
  if (!content) {
    return <p className="text-muted-foreground italic">No content available.</p>;
  }

  const parts = [];
  const mermaidRegex = /```mermaid\s*([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = mermaidRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: 'markdown',
        content: content.substring(lastIndex, match.index)
      });
    }
    parts.push({
      type: 'mermaid',
      content: match[1].trim()
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({
      type: 'markdown',
      content: content.substring(lastIndex)
    });
  }

  return (
    <div className="prose prose-invert max-w-none space-y-4 text-foreground/90 leading-relaxed">
      {parts.map((part, index) => {
        if (part.type === 'mermaid') {
          return <MermaidDiagram key={index} chartCode={part.content} />;
        }
        return (
          <div
            key={index}
            className="markdown-body space-y-3 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-white [&_h1]:border-b [&_h1]:border-[#5a329f]/40 [&_h1]:pb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-purple-300 [&_h2]:border-b [&_h2]:border-[#5a329f]/20 [&_h2]:pb-1 [&_h2]:mt-6 [&_h3]:text-lg [&_h3]:font-medium [&_h3]:text-purple-200 [&_h3]:mt-4 [&_p]:text-foreground/80 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:text-foreground/80 [&_li]:my-1 [&_pre]:bg-[#130f20] [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-[#5a329f]/30 [&_pre]:overflow-x-auto [&_code]:font-mono [&_code]:text-purple-300 [&_table]:w-full [&_table]:border-collapse [&_th]:bg-[#241c38] [&_th]:border [&_th]:border-[#5a329f]/40 [&_th]:p-2.5 [&_th]:text-left [&_th]:text-purple-200 [&_td]:border [&_td]:border-[#5a329f]/30 [&_td]:p-2.5 [&_tr:nth-child(even)]:bg-[#191428]"
          >
            <ReactMarkdown>{part.content}</ReactMarkdown>
          </div>
        );
      })}
    </div>
  );
}