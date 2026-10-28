import React, { useState, useEffect } from 'react';
import { Send, Bot, User, FileCode, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { askCodebaseQuestion, listRepoQA } from '@/services/intelligenceApi';

const QUICK_QUESTIONS = [
  "What is the core architecture and request flow?",
  "What are the main database models and fields?",
  "List all API endpoints and their HTTP methods.",
  "How does error handling and validation work?"
];

export default function CodebaseChat({ repositoryId }) {
  const [messages, setMessages] = useState([]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(true);

  useEffect(() => {
    if (!repositoryId) return;
    const fetchHistory = async () => {
      try {
        const res = await listRepoQA(repositoryId);
        if (res.data) {
          const history = [];
          res.data.reverse().forEach((item) => {
            history.push({ role: 'user', content: item.question });
            history.push({
              role: 'assistant',
              content: item.answer,
              relevantFiles: item.relevantFiles
            });
          });
          setMessages(history);
        }
      } catch (err) {
        console.warn('Could not load Q&A history:', err);
      } finally {
        setFetchingHistory(false);
      }
    };
    fetchHistory();
  }, [repositoryId]);

  const handleSend = async (queryToSend) => {
    const query = queryToSend || inputQuery;
    if (!query || !query.trim() || loading) return;

    const userMessage = { role: 'user', content: query.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await askCodebaseQuestion(repositoryId, query.trim());
      const botMessage = {
        role: 'assistant',
        content: res.data.answer,
        relevantFiles: res.data.relevantFiles || []
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: ` Failed to get answer: ${err.response?.data?.detail || err.message}. Make sure Ollama is running.`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[650px] rounded-xl border border-[#5a329f]/40 bg-[#141022] shadow-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-[#5a329f]/30 bg-[#1b152e] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-purple-400" />
          <h4 className="text-sm font-semibold text-white">Codebase Q&A Assistant</h4>
        </div>
        <span className="text-xs text-purple-300/80 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-500/20">
          Grounded with repository source files
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !fetchingHistory && (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground">
            <Sparkles className="w-8 h-8 text-purple-400 mb-2 opacity-80" />
            <p className="text-sm font-medium text-foreground">Ask anything about this codebase</p>
            <p className="text-xs max-w-sm mt-1">
              The assistant searches the repository source files to answer questions about logic, architecture, and APIs.
            </p>

            <div className="mt-6 flex flex-wrap gap-2 justify-center max-w-lg">
              {QUICK_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q)}
                  className="text-xs bg-[#241d38] hover:bg-[#32274e] border border-[#5a329f]/30 text-purple-200 px-3 py-1.5 rounded-full transition-colors text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-purple-900/60 border border-purple-500/30 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-purple-300" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-xl p-3 text-sm ${
                msg.role === 'user'
                  ? 'bg-[#5a329f] text-white'
                  : 'bg-[#1e1832] text-foreground/90 border border-[#5a329f]/20'
              }`}
            >
              <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>

              {msg.relevantFiles && msg.relevantFiles.length > 0 && (
                <div className="mt-3 pt-2 border-t border-purple-500/20">
                  <span className="text-[10px] uppercase font-mono text-purple-300 block mb-1">
                    Context Source Files:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.relevantFiles.map((file, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 text-[11px] font-mono bg-[#110d1f] text-purple-200 px-2 py-0.5 rounded border border-purple-500/30"
                      >
                        <FileCode className="w-3 h-3 text-purple-400" />
                        {file}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-full bg-[#5a329f] flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 items-center text-muted-foreground text-xs p-2">
            <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
            <span>Searching codebase and generating answer with local LLM...</span>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-[#5a329f]/30 bg-[#171228]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask about this codebase (e.g. 'How are commits synced?')..."
            className="flex-1 bg-[#0f0c1b] border border-[#5a329f]/40 rounded-lg px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-purple-500 transition-colors"
          />
          <Button
            type="submit"
            disabled={loading || !inputQuery.trim()}
            className="bg-[#5a329f] hover:bg-[#6c3dbf] text-white px-4"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}