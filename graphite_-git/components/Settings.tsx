

import React, { useState, useEffect } from 'react';
import { useAgent } from './AgentProvider';
import { HeatmapTheme } from '../types';
import { 
  BrainCircuit, Zap, Shield, AlertTriangle, 
  Check, ChevronRight, Terminal, Command, 
  Cpu, Layout, Globe, Github, LogOut,
  Sparkles, Lock, Book, Info, Layers, 
  CheckCircle2, AlertCircle, Share2, Palette, Key
} from 'lucide-react';

interface SettingsProps {
  activeTheme?: string;
  setActiveTheme?: (theme: string) => void;
  themes?: Record<string, HeatmapTheme>;
}

const Settings: React.FC<SettingsProps> = ({ activeTheme, setActiveTheme, themes }) => {
  const { selectedModel, setSelectedModel, htmlSafetyMode, setHtmlSafetyMode, geminiApiKey, setGeminiApiKey } = useAgent();
  const [apiKeyInput, setApiKeyInput] = useState(geminiApiKey);

  useEffect(() => {
    setApiKeyInput(geminiApiKey);
  }, [geminiApiKey]);

  const handleKeySave = () => {
      setGeminiApiKey(apiKeyInput);
  };

  const models = [
    {
      id: 'gemini-3-pro-preview',
      name: 'Gemini 3 Pro',
      description: 'Maximum reasoning capability. Best for complex architecture and logic.',
      icon: BrainCircuit,
      color: 'text-purple-400',
      gradient: 'from-purple-500/20 to-blue-500/20',
      badge: 'Reasoning'
    },
    {
      id: 'gemini-2.5-flash',
      name: 'Gemini 2.5 Flash',
      description: 'Optimized for speed. Ideal for quick refactors and simple queries.',
      icon: Zap,
      color: 'text-yellow-400',
      gradient: 'from-yellow-500/20 to-orange-500/20',
      badge: 'Fast'
    }
  ];

  const features = [
    {
      title: 'Local-First Security',
      icon: Lock,
      desc: 'Your API Token stays in localStorage. Zero intermediary servers.'
    },
    {
      title: 'Contextual Agent',
      icon: Sparkles,
      desc: 'AI reads your active file & repo map to give relevant answers.'
    },
    {
      title: 'Human-in-the-Loop',
      icon: CheckCircle2,
      desc: 'All write/delete operations require your explicit approval.'
    },
    {
      title: 'Network Safety',
      icon: Shield,
      desc: 'Whitelist important users to prevent accidental unfollowing.'
    }
  ];

  return (
    <div className="h-full flex flex-col animate-fade-in overflow-y-auto pb-20 scroll-smooth">
      <div className="max-w-5xl mx-auto w-full space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-white/5">
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight mb-2">
              System <span className="text-muted">Preferences</span>
            </h1>
            <p className="text-muted text-sm max-w-lg leading-relaxed">
              Configure your intelligence engine, security protocols, and view system status.
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-muted">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
             System Operational
          </div>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* --- AI Model Configuration (Span 8) --- */}
          <div className="md:col-span-8 glass-panel rounded-3xl p-1 border border-white/10 relative overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent opacity-50 pointer-events-none" />
             
             <div className="relative p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                   <div className="p-2.5 bg-accent/10 rounded-xl border border-accent/20">
                      <Cpu size={20} className="text-accent" />
                   </div>
                   <div>
                      <h2 className="text-lg font-bold text-white">Intelligence Engine</h2>
                      <p className="text-xs text-muted font-mono">Select active model architecture</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                   {models.map((model) => {
                      const isSelected = selectedModel === model.id;
                      const Icon = model.icon;
                      
                      return (
                        <button
                          key={model.id}
                          onClick={() => setSelectedModel(model.id)}
                          className={`relative text-left p-5 rounded-2xl border transition-all duration-300 overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
                            isSelected 
                              ? 'bg-surface-highlight border-accent/50 shadow-lg shadow-accent/10' 
                              : 'bg-black/20 border-white/5 hover:bg-black/40 hover:border-white/10'
                          }`}
                        >
                           {/* Active Gradient Background */}
                           {isSelected && (
                              <div className={`absolute inset-0 bg-gradient-to-br ${model.gradient} opacity-20 pointer-events-none`} />
                           )}

                           <div className="relative z-10 flex flex-col h-full">
                              <div className="flex justify-between items-start mb-4">
                                 <div className={`p-3 rounded-xl ${isSelected ? 'bg-white/10 text-white' : 'bg-black/40 text-muted'} transition-colors`}>
                                    <Icon size={24} className={isSelected ? 'text-white' : model.color} />
                                 </div>
                                 {isSelected && (
                                    <div className="bg-accent text-white p-1 rounded-full shadow-lg shadow-accent/40 animate-scale-in">
                                       <Check size={14} strokeWidth={3} />
                                    </div>
                                 )}
                              </div>
                              
                              <div className="mt-auto">
                                 <h3 className={`font-bold text-base mb-1 ${isSelected ? 'text-white' : 'text-gray-300'}`}>{model.name}</h3>
                                 <p className="text-xs text-muted leading-relaxed mb-3">{model.description}</p>
                                 <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                    isSelected 
                                    ? 'bg-white/10 border-white/10 text-white' 
                                    : 'bg-black/30 border-white/5 text-zinc-600'
                                 }`}>
                                    {model.badge}
                                 </span>
                              </div>
                           </div>
                        </button>
                      );
                   })}
                </div>

                {/* API Configuration */}
                <div className="border-t border-white/5 pt-6">
                    <div className="flex items-center gap-2 mb-3">
                         <Key size={16} className="text-muted" />
                         <span className="text-sm font-bold text-white uppercase tracking-wider">System Access</span>
                    </div>
                    <div className="bg-black/30 border border-white/10 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center">
                        <div className="flex-1 w-full">
                             <label className="text-xs text-muted font-medium mb-1.5 block">Gemini API Key</label>
                             <input 
                                type="password"
                                value={apiKeyInput}
                                onChange={(e) => setApiKeyInput(e.target.value)}
                                placeholder="sk-..."
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-accent focus:ring-1 focus:ring-accent outline-none font-mono"
                             />
                        </div>
                        <button 
                             onClick={handleKeySave}
                             className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-sm font-bold transition-colors h-full mt-auto"
                        >
                            Save Key
                        </button>
                    </div>
                    <p className="text-[10px] text-muted mt-2 pl-1">
                        Your API key is stored locally in your browser and used directly to communicate with Google's generative AI services.
                    </p>
                </div>
             </div>
          </div>

          {/* --- Theme Selector (Span 4) --- */}
          {themes && setActiveTheme && (
            <div className="md:col-span-4 glass-panel rounded-3xl p-6 md:p-8 border border-white/10 flex flex-col relative">
                <div className="flex items-center gap-3 mb-6 relative z-10">
                   <div className="p-2.5 bg-pink-500/10 rounded-xl border border-pink-500/20">
                      <Palette size={20} className="text-pink-400" />
                   </div>
                   <div>
                      <h2 className="text-lg font-bold text-white">Visual Theme</h2>
                      <p className="text-xs text-muted font-mono">Heatmap aesthetics</p>
                   </div>
                </div>

                {/* Static Grid Layout - No Hover Effects */}
                <div className="flex-1 flex flex-col gap-2 relative z-10 overflow-y-auto max-h-[300px] pr-2">
                    {Object.entries(themes).map(([key, theme]) => {
                         const themeData = theme as HeatmapTheme;
                         const isActive = activeTheme === key;
                         return (
                             <button
                                 key={key}
                                 onClick={() => setActiveTheme(key)}
                                 className={`w-full flex items-center justify-between p-4 rounded-xl border outline-none ${
                                     isActive 
                                         ? 'border-accent bg-accent/10' 
                                         : 'border-white/5 bg-black/20'
                                 }`}
                             >
                                 <div className="flex items-center gap-3">
                                     <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isActive ? 'border-accent' : 'border-white/20'}`}>
                                        {isActive && <div className="w-2 h-2 rounded-full bg-accent" />}
                                     </div>
                                     <div className="flex flex-col items-start">
                                         <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-zinc-400'}`}>
                                             {themeData.label}
                                         </span>
                                     </div>
                                 </div>
                                 <div className="flex gap-1">
                                     {themeData.colors.map((c, i) => (
                                         <div key={i} className={`w-2 h-2 rounded-full ${c}`} />
                                     ))}
                                 </div>
                             </button>
                         );
                    })}
                </div>
            </div>
          )}

          {/* --- Security Settings (Span 6) --- */}
          <div className="md:col-span-6 glass-panel rounded-3xl p-6 md:p-8 border border-white/10 flex flex-col relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-[50px] pointer-events-none" />
             
             <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="p-2.5 bg-green-500/10 rounded-xl border border-green-500/20">
                   <Shield size={20} className="text-green-400" />
                </div>
                <div>
                   <h2 className="text-lg font-bold text-white">Sandbox</h2>
                   <p className="text-xs text-muted font-mono">Security protocols</p>
                </div>
             </div>

             <div className="flex-1 flex flex-col justify-center space-y-6 relative z-10">
                <div className="space-y-3">
                   <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-200">HTML Safe Mode</span>
                      <button 
                          onClick={() => setHtmlSafetyMode(!htmlSafetyMode)}
                          className={`w-12 h-7 rounded-full p-1 transition-colors relative focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 ${htmlSafetyMode ? 'bg-green-500' : 'bg-white/10'}`}
                      >
                          <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform transform ${htmlSafetyMode ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                   </div>
                   <p className="text-xs text-muted leading-relaxed">
                      Renders HTML previews using <code className="text-white">Blob URLs</code> to isolate execution context. Prevents access to localStorage tokens.
                   </p>
                </div>

                {!htmlSafetyMode && (
                   <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-3 items-start animate-fade-in">
                      <AlertTriangle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                      <div className="space-y-1">
                         <p className="text-xs font-bold text-red-300">Security Warning</p>
                         <p className="text-[10px] text-red-400/80 leading-relaxed">
                            Disabling Safe Mode allows scripts in previews to access your active session. Use with caution.
                         </p>
                      </div>
                   </div>
                )}
             </div>
          </div>

          {/* --- System Info (Span 6) --- */}
          <div className="md:col-span-6 glass-panel rounded-3xl p-6 border border-white/10 flex flex-col justify-between">
             <div className="mb-6">
                <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                   <Layers size={14} /> Application Stack
                </h3>
                <div className="space-y-4">
                   <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-sm text-gray-300">Version</span>
                      <span className="font-mono text-xs text-accent">v2.1.0-beta</span>
                   </div>
                   <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-sm text-gray-300">Environment</span>
                      <span className="font-mono text-xs text-white">Production</span>
                   </div>
                   <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-sm text-gray-300">Engine</span>
                      <span className="font-mono text-xs text-white">React 19</span>
                   </div>
                </div>
             </div>
             
             <div className="text-[10px] text-muted text-center pt-4 border-t border-white/5">
                Session ID: <span className="font-mono text-zinc-600">{Math.random().toString(36).substring(7)}</span>
             </div>
          </div>

          {/* --- Feature Grid (Span 12) --- */}
          <div className="md:col-span-12 glass-panel rounded-3xl p-6 md:p-8 border border-white/10">
             <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
                   <Book size={20} className="text-blue-400" />
                </div>
                <div>
                   <h2 className="text-lg font-bold text-white">Capabilities</h2>
                   <p className="text-xs text-muted font-mono">System features overview</p>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {features.map((feat, idx) => (
                   <div key={idx} className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
                      <div className="flex items-center gap-3 mb-2">
                         <feat.icon size={18} className="text-gray-400 group-hover:text-white transition-colors" />
                         <span className="text-sm font-bold text-white">{feat.title}</span>
                      </div>
                      <p className="text-xs text-muted leading-relaxed pl-7 md:pl-0">
                         {feat.desc}
                      </p>
                   </div>
                ))}
             </div>
             
             {/* Developer Credit */}
             <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs text-muted">Developed with <span className="text-red-500">♥</span> for developers.</span>
                <a href="https://github.com/dovvnloading" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/30 hover:bg-black/50 transition-colors border border-white/5 group">
                   <Github size={14} className="text-white" />
                   <span className="text-xs font-medium text-gray-300 group-hover:text-white">@dovvnloading</span>
                </a>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Settings;