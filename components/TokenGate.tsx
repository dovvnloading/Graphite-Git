import React, { useState } from 'react';
import { Key, ShieldCheck, ChevronRight, Terminal, Lock } from 'lucide-react';

interface TokenGateProps {
  onTokenSubmit: (token: string) => void;
}

const TokenGate: React.FC<TokenGateProps> = ({ onTokenSubmit }) => {
  const [inputToken, setInputToken] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputToken.trim().length > 0) {
      onTokenSubmit(inputToken.trim());
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#09090b] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[800px] h-[800px] bg-accent/5 rounded-full blur-[150px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[150px]" />
        
        {/* Grid lines */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)]"></div>
      </div>

      <div className="z-10 w-full max-w-lg relative animate-slide-up">
        {/* Header Icon */}
        <div className="flex justify-center mb-8">
            <div className="relative group">
                <div className="absolute inset-0 bg-accent blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 rounded-full"></div>
                <div className="relative w-20 h-20 bg-surface border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl backdrop-blur-xl">
                    <Terminal className="w-10 h-10 text-white" strokeWidth={1.5} />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-black rounded-full border border-border flex items-center justify-center">
                    <Lock className="w-4 h-4 text-accent" />
                </div>
            </div>
        </div>

        <div className="text-center mb-8 space-y-2">
            <h1 className="text-4xl font-bold text-white tracking-tight glow-text">&lt;Graphite:Git&gt;</h1>
            <p className="text-muted text-lg">Initialize your secure local workspace.</p>
        </div>

        {/* Card */}
        <div className="glass-panel rounded-2xl p-8 backdrop-blur-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label className="flex items-center justify-between text-xs font-medium text-muted uppercase tracking-widest">
                <span>Access Key</span>
                <span className="text-accent/80 hover:text-accent cursor-pointer transition-colors">How to generate?</span>
              </label>
              
              <div className={`relative group transition-all duration-300 ${isFocused ? 'scale-[1.01]' : ''}`}>
                <div className={`absolute -inset-0.5 bg-gradient-to-r from-accent to-purple-500 rounded-xl opacity-0 group-hover:opacity-30 transition duration-500 ${isFocused ? 'opacity-50 blur-sm' : ''}`} />
                <div className="relative flex items-center bg-[#09090b] rounded-xl border border-white/10 focus-within:border-accent/50 transition-colors h-14 overflow-hidden">
                  <div className="pl-4 pr-3 text-muted">
                    <Key className="w-5 h-5" />
                  </div>
                  <div className="h-6 w-px bg-white/10 mr-3"></div>
                  <input
                    type="password"
                    value={inputToken}
                    onChange={(e) => setInputToken(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="ghp_..."
                    className="flex-1 bg-transparent border-none text-white placeholder-zinc-700 focus:ring-0 font-mono text-sm h-full"
                    autoFocus
                  />
                  {inputToken.length > 0 && (
                      <div className="pr-4 animate-fade-in">
                          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                      </div>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={!inputToken}
              className="group w-full flex items-center justify-center gap-2 py-4 px-4 bg-white text-black hover:bg-accent hover:text-white rounded-xl font-semibold transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-black shadow-lg hover:shadow-accent/25"
            >
              <span>Authenticate</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          {/* Privacy Notice */}
          <div className="mt-8 pt-6 border-t border-white/5">
            <div className="flex items-start gap-4">
               <div className="p-2 bg-white/5 rounded-lg">
                   <ShieldCheck className="w-5 h-5 text-accent" />
               </div>
               <div className="space-y-1">
                   <h4 className="text-sm font-medium text-white">Local-Only Storage</h4>
                   <p className="text-xs text-muted leading-relaxed">
                       Your Access Token is stored exclusively in your browser's <code className="bg-white/10 px-1 py-0.5 rounded text-white">localStorage</code>. 
                       Graphite communicates directly with the GitHub API. No intermediate servers. No tracking.
                   </p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenGate;