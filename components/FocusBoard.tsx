import React, { useState, useEffect } from 'react';
import { GitHubService } from '../services/githubService';
import { GitHubIssue } from '../types';
import { Target, CircleDot, GitPullRequest, MessageSquare, ExternalLink, Filter, CheckCircle2, AlertCircle, ArrowUpRight } from 'lucide-react';

interface FocusBoardProps {
  service: GitHubService;
}

const FocusBoard: React.FC<FocusBoardProps> = ({ service }) => {
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'assigned' | 'mentioned' | 'repos'>('assigned');

  useEffect(() => {
    fetchIssues();
  }, [filter]);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      // By default get 'assigned' issues (things I need to do)
      const data = await service.getIssues(filter);
      setIssues(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getRepoName = (url: string) => {
    // url is like https://api.github.com/repos/owner/repo
    const parts = url.split('/');
    return `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between glass-panel p-6 rounded-2xl relative overflow-hidden flex-shrink-0">
             <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-[80px] pointer-events-none"></div>
             
             <div className="relative z-10 flex items-center gap-4">
                 <div className="w-12 h-12 bg-gradient-to-br from-accent to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-accent/20">
                     <Target className="w-6 h-6 text-white" />
                 </div>
                 <div>
                     <h2 className="text-2xl font-bold text-white tracking-tight">Focus Board</h2>
                     <p className="text-muted text-sm">Your cross-repository unified inbox.</p>
                 </div>
             </div>

             <div className="relative z-10 flex gap-2 bg-black/20 p-1.5 rounded-xl border border-white/10">
                 {['assigned', 'mentioned', 'repos'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f as any)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border min-w-[5rem] text-center ${
                            filter === f 
                            ? 'bg-surface-highlight text-white shadow-sm border-white/5' 
                            : 'text-muted hover:text-white hover:bg-white/5 border-transparent'
                        }`}
                    >
                        {f}
                    </button>
                 ))}
             </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-[400px] pb-20">
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-surface-highlight/30 rounded-xl animate-pulse"></div>
                    ))}
                </div>
            ) : issues.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted">
                    <CheckCircle2 size={48} className="text-green-500/50 mb-4" />
                    <p className="text-lg font-medium text-white">Inbox Zero</p>
                    <p className="text-sm">No items found for this filter.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {issues.map(issue => {
                        const isPR = !!issue.pull_request;
                        return (
                            <div 
                                key={issue.id}
                                className="group glass-panel p-5 rounded-xl border border-transparent hover:border-accent/30 hover:bg-surface-highlight/50 transition-all flex items-start gap-4"
                            >
                                <div className={`mt-1 p-2 rounded-lg ${isPR ? 'bg-purple-500/10 text-purple-400' : 'bg-green-500/10 text-green-400'}`}>
                                    {isPR ? <GitPullRequest size={20} /> : <CircleDot size={20} />}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-mono text-muted uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded">
                                            {getRepoName(issue.repository_url)}
                                        </span>
                                        <span className="text-xs text-muted">#{issue.number}</span>
                                        {issue.labels.map(label => (
                                            <span 
                                                key={label.id}
                                                className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                                                style={{ backgroundColor: `#${label.color}33`, color: `#${label.color}` }}
                                            >
                                                {label.name}
                                            </span>
                                        ))}
                                    </div>
                                    
                                    <h3 className="text-base font-bold text-white mb-2 group-hover:text-accent transition-colors leading-tight">
                                        {issue.title}
                                    </h3>
                                    
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <MessageSquare size={12} /> {issue.comments} comments
                                            </span>
                                            <span>Updated {new Date(issue.updated_at).toLocaleDateString()}</span>
                                            <span className="flex items-center gap-1">
                                                by <img src={issue.user.avatar_url} className="w-4 h-4 rounded-full" alt="" /> 
                                                <span className="font-bold text-gray-400">{issue.user.login}</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <a 
                                    href={issue.html_url} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="p-3 bg-white/5 rounded-xl hover:bg-accent hover:text-white text-muted transition-colors self-center"
                                >
                                    <ArrowUpRight size={20} />
                                </a>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    </div>
  );
};

export default FocusBoard;