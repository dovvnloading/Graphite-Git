import React, { useState, useRef, useEffect } from 'react';
import { useAgent } from './AgentProvider';
import { Send, X, Shield, Trash2, Edit3, ArrowRight, Check, AlertCircle, FileCode, Settings2, Database, FileText, ScanLine } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const AgentUI: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { isEnabled, enableAgent, messages, sendMessage, isThinking, pendingToolCall, approveToolCall, rejectToolCall, contextSettings, setContextSettings } = useAgent();
  const [input, setInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, pendingToolCall, isThinking]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  };

  if (!isEnabled) {
    return (
      <div className="fixed inset-0 z-[100] md:static md:z-auto w-full md:w-96 h-full flex-shrink-0 bg-[#09090b] md:border-l md:border-white/10 shadow-2xl flex flex-col p-8 items-center justify-center">
         <div className="max-w-sm w-full flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <span className="text-2xl font-black text-white tracking-tighter">AI</span>
            </div>
            <div>
                <h2 className="text-2xl font-bold text-white">Agentic Mode</h2>
                <p className="text-muted mt-2 text-sm leading-relaxed">
                    Enable autonomous AI capabilities. The agent can read, write, and manage your repositories with your explicit approval for every action.
                </p>
            </div>
            
            <button 
                onClick={enableAgent}
                className="w-full py-4 bg-white text-black rounded-xl font-bold hover:bg-accent hover:text-white transition-all flex items-center justify-center gap-2 shadow-lg"
            >
                <span>Enable Agent</span>
                <ArrowRight size={16} />
            </button>
            
            <p className="text-xs text-zinc-600">
                By enabling, you grant the agent access to your current session context.
            </p>
         </div>
         <button onClick={onClose} className="absolute top-6 right-6 p-3 text-muted hover:text-white bg-white/5 rounded-full">
             <X size={24} />
         </button>
      </div>
    );
  }

  // Mobile: Full screen fixed overlay
  // Desktop: Side panel
  return (
    <div className="fixed inset-0 z-[100] md:static md:z-auto w-full md:w-96 h-full flex-shrink-0 bg-[#09090b] md:border-l md:border-white/10 shadow-2xl flex flex-col animate-slide-up md:animate-slide-left">
      {/* Header */}
      <div className="h-16 md:h-14 border-b border-white/5 flex items-center justify-between px-4 bg-surface/50 backdrop-blur flex-shrink-0">
          <div className="flex items-center gap-2">
              <span className="font-bold text-white text-base md:text-sm">Graphite Agent</span>
              {isThinking && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                  </span>
              )}
          </div>
          <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2.5 rounded-full transition-colors ${showSettings ? 'bg-white/10 text-white' : 'text-muted hover:text-white hover:bg-white/5'}`}
                title="Context Settings"
              >
                  <Settings2 size={20} />
              </button>
              <button onClick={onClose} className="p-2.5 bg-white/5 rounded-full text-muted hover:text-white hover:bg-white/10 transition-colors">
                  <X size={20} />
              </button>
          </div>
      </div>

      {/* Settings Panel (Collapsible) */}
      {showSettings && (
          <div className="bg-surface-highlight border-b border-white/5 p-4 animate-slide-down flex-shrink-0 shadow-xl relative z-10">
              <h3 className="text-[10px] font-bold text-muted uppercase tracking-wider mb-3">Context Scope</h3>
              <div className="space-y-2">
                  <label className="flex items-center justify-between p-3 rounded-xl bg-black/20 hover:bg-black/30 cursor-pointer transition-colors border border-white/5">
                      <div className="flex items-center gap-3">
                          <Database size={16} className="text-blue-400" />
                          <span className="text-sm text-gray-300 font-medium">Repository Map</span>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={contextSettings.includeRepoMap} 
                        onChange={e => setContextSettings({ includeRepoMap: e.target.checked })} 
                        className="rounded border-white/10 bg-black/40 text-accent focus:ring-0 focus:ring-offset-0 w-5 h-5" 
                      />
                  </label>
                  <label className="flex items-center justify-between p-3 rounded-xl bg-black/20 hover:bg-black/30 cursor-pointer transition-colors border border-white/5">
                      <div className="flex items-center gap-3">
                          <FileText size={16} className="text-yellow-400" />
                          <span className="text-sm text-gray-300 font-medium">Active File</span>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={contextSettings.includeFileContent} 
                        onChange={e => setContextSettings({ includeFileContent: e.target.checked })} 
                        className="rounded border-white/10 bg-black/40 text-accent focus:ring-0 focus:ring-offset-0 w-5 h-5" 
                      />
                  </label>
                   <label className="flex items-center justify-between p-3 rounded-xl bg-black/20 hover:bg-black/30 cursor-pointer transition-colors border border-white/5">
                      <div className="flex items-center gap-3">
                          <ScanLine size={16} className="text-purple-400" />
                          <span className="text-sm text-gray-300 font-medium">Selection</span>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={contextSettings.includeSelection} 
                        onChange={e => setContextSettings({ includeSelection: e.target.checked })} 
                        className="rounded border-white/10 bg-black/40 text-accent focus:ring-0 focus:ring-offset-0 w-5 h-5" 
                      />
                  </label>
              </div>
          </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24 md:pb-4" ref={scrollRef}>
          {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted p-8">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                      <Send size={24} className="opacity-20" />
                  </div>
                  <p className="text-sm">How can I help you with your code today?</p>
              </div>
          )}
          
          {messages.map(msg => {
              if (msg.role === 'function') return null; 

              return (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[90%] md:max-w-[90%] rounded-2xl p-4 text-sm leading-relaxed overflow-hidden shadow-sm ${
                        msg.role === 'user' 
                        ? 'bg-accent text-white rounded-br-none shadow-accent/20' 
                        : msg.role === 'system'
                            ? 'bg-red-500/10 text-red-300 border border-red-500/20 text-xs'
                            : 'bg-surface-highlight text-gray-200 border border-white/5 rounded-bl-none'
                    }`}>
                        <div className="prose prose-invert prose-sm max-w-none break-words">
                            <ReactMarkdown
                                components={{
                                    code({node, inline, className, children, ...props}: any) {
                                        const match = /language-(\w+)/.exec(className || '')
                                        return !inline && match ? (
                                            <div className="my-2 rounded-lg overflow-hidden border border-white/10">
                                                <SyntaxHighlighter
                                                    {...props}
                                                    children={String(children).replace(/\n$/, '')}
                                                    style={vscDarkPlus}
                                                    language={match[1]}
                                                    PreTag="div"
                                                    customStyle={{ margin: 0, padding: '1rem', background: '#09090b' }}
                                                />
                                            </div>
                                        ) : (
                                            <code {...props} className={`${className} bg-black/20 rounded px-1.5 py-0.5 text-xs font-mono font-bold`}>
                                                {children}
                                            </code>
                                        )
                                    }
                                }}
                            >
                                {msg.text || ''}
                            </ReactMarkdown>
                        </div>

                        {msg.toolCalls && msg.toolCalls.map(tc => (
                            <div key={tc.id} className="mt-3 p-3 bg-black/30 rounded-lg border border-white/5 text-xs font-mono flex items-center gap-2">
                                <Check size={14} className="text-green-500" />
                                <span className="text-muted">Executed:</span>
                                <span className="text-accent font-bold">{tc.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
              );
          })}

          {/* Pending Approval Card */}
          {pendingToolCall && (
              <div className="bg-surface-highlight border border-accent/30 rounded-2xl p-5 animate-fade-in shadow-xl shadow-accent/5 mx-2">
                  <div className="flex items-center gap-2 mb-4 text-accent font-bold text-sm uppercase tracking-wide">
                      <Shield size={16} />
                      <span>Approval Required</span>
                  </div>
                  
                  <div className="mb-6 space-y-3">
                      <div className="flex items-center gap-3 text-white font-mono text-xs p-3 bg-black/30 rounded-xl border border-white/5">
                          {pendingToolCall.name === 'create_or_update_file' && <Edit3 size={16} className="text-blue-400"/>}
                          {pendingToolCall.name === 'delete_file' && <Trash2 size={16} className="text-red-400"/>}
                          <span className="text-purple-300 font-bold text-sm">{pendingToolCall.name}</span>
                      </div>
                      
                      <div className="text-xs space-y-3 pl-1">
                          {pendingToolCall.args.path && (
                              <div className="flex flex-col gap-1 text-gray-400">
                                  <span className="font-bold text-muted uppercase text-[10px]">Path</span>
                                  <span className="text-white font-mono text-sm break-all">{pendingToolCall.args.path}</span>
                              </div>
                          )}
                          
                          {/* Code Preview for Writes */}
                          {pendingToolCall.name === 'create_or_update_file' && pendingToolCall.args.content && (
                              <div className="mt-2">
                                  <div className="flex items-center gap-2 text-[10px] text-muted uppercase font-bold mb-2">
                                      <FileCode size={12} /> Content Preview
                                  </div>
                                  <div className="bg-[#0d0d11] rounded-lg border border-white/10 p-3 max-h-48 overflow-y-auto custom-scrollbar">
                                      <pre className="text-[11px] font-mono text-gray-300 whitespace-pre-wrap break-all leading-relaxed">
                                          {pendingToolCall.args.content}
                                      </pre>
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={approveToolCall}
                        className="py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-bold transition-colors shadow-lg shadow-green-900/20"
                      >
                          Approve
                      </button>
                      <button 
                        onClick={rejectToolCall}
                        className="py-3 bg-surface hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-sm font-bold transition-colors"
                      >
                          Deny
                      </button>
                  </div>
              </div>
          )}

          {isThinking && (
              <div className="flex justify-start">
                  <div className="bg-surface-highlight rounded-2xl p-4 flex items-center gap-2">
                      <div className="w-2 h-2 bg-accent rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-accent rounded-full animate-bounce delay-75"></div>
                      <div className="w-2 h-2 bg-accent rounded-full animate-bounce delay-150"></div>
                  </div>
              </div>
          )}
      </div>

      {/* Input - Sticky at bottom */}
      <div className="p-4 border-t border-white/10 bg-surface/90 backdrop-blur-md flex-shrink-0 safe-area-pb">
          <div className="relative flex items-center gap-2">
              <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask agent to write code..."
                  className="flex-1 bg-black/40 border border-white/10 rounded-2xl pl-5 pr-12 py-3.5 text-base md:text-sm text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all placeholder-zinc-500"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isThinking || !!pendingToolCall}
                className="absolute right-2 p-2 bg-accent text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:bg-transparent disabled:text-muted transition-colors"
              >
                  <Send size={20} />
              </button>
          </div>
      </div>
    </div>
  );
};

export default AgentUI;