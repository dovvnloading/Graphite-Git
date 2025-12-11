import React, { useState, useEffect } from 'react';
import { GitHubService } from '../services/githubService';
import { GitHubNotification } from '../types';
import { Bell, CheckCircle2, CircleDot, GitPullRequest, GitMerge, MessageSquare, AlertCircle, ExternalLink, Loader2, Filter } from 'lucide-react';

interface NotificationCenterProps {
  service: GitHubService;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ service }) => {
  const [notifications, setNotifications] = useState<GitHubNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('unread');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await service.getNotifications(filter === 'all');
      setNotifications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    setProcessingId(id);
    try {
      await service.markNotificationAsRead(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PullRequest': return <GitPullRequest size={18} className="text-purple-400" />;
      case 'Issue': return <CircleDot size={18} className="text-green-400" />;
      case 'Commit': return <GitMerge size={18} className="text-blue-400" />;
      case 'Release': return <AlertCircle size={18} className="text-yellow-400" />;
      default: return <MessageSquare size={18} className="text-muted" />;
    }
  };

  const getTargetUrl = (notification: GitHubNotification) => {
      // Best effort URL construction
      // notification.subject.url looks like: https://api.github.com/repos/owner/repo/pulls/123
      const api_url = notification.subject.url;
      if (!api_url) return notification.repository.html_url;

      try {
          const match = api_url.match(/repos\/(.+?)\/(.+?)\/(issues|pulls|releases|commits)\/([a-zA-Z0-9]+)/);
          if (match) {
              const [, owner, repo, type, id] = match;
              const webType = type === 'pulls' ? 'pull' : type;
              return `https://github.com/${owner}/${repo}/${webType}/${id}`;
          }
      } catch(e) {}
      
      return notification.repository.html_url;
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-fade-in">
        <div className="flex items-center justify-between glass-panel p-4 rounded-xl">
             <div className="flex items-center gap-3">
                 <div className="p-2 bg-surface-highlight rounded-lg border border-white/5">
                     <Bell className="w-5 h-5 text-accent" />
                 </div>
                 <div>
                     <h2 className="text-lg font-bold text-white tracking-tight">Notifications</h2>
                     <p className="text-muted text-xs font-mono">
                         {loading ? 'Syncing...' : `${notifications.length} ${filter} items`}
                     </p>
                 </div>
             </div>
             
             <div className="flex items-center gap-2 bg-black/20 p-1 rounded-lg border border-white/10">
                 <button 
                    onClick={() => setFilter('unread')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filter === 'unread' ? 'bg-surface-highlight text-white shadow-sm' : 'text-muted hover:text-white'}`}
                 >
                     Unread
                 </button>
                 <button 
                    onClick={() => setFilter('all')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filter === 'all' ? 'bg-surface-highlight text-white shadow-sm' : 'text-muted hover:text-white'}`}
                 >
                     All
                 </button>
             </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-20">
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 text-accent animate-spin" />
                </div>
            ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted">
                    <CheckCircle2 size={48} className="text-green-500/50 mb-4" />
                    <p className="text-lg font-medium text-white">All caught up!</p>
                    <p className="text-sm">No {filter} notifications found.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {notifications.map(n => (
                        <div key={n.id} className="group glass-panel p-4 rounded-xl border border-transparent hover:border-white/10 transition-all flex gap-4">
                            <div className="pt-1">
                                <div className="p-2 rounded-lg bg-surface-highlight border border-white/5">
                                    {getTypeIcon(n.subject.type)}
                                </div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline justify-between mb-1">
                                    <div className="flex items-center gap-2 text-xs text-muted">
                                        <img src={n.repository.owner.avatar_url} className="w-4 h-4 rounded-full" alt="" />
                                        <span className="font-mono">{n.repository.full_name}</span>
                                        <span>•</span>
                                        <span>{new Date(n.updated_at).toLocaleDateString()}</span>
                                    </div>
                                    <span className="text-[10px] uppercase tracking-wider text-muted font-bold bg-white/5 px-2 py-0.5 rounded">
                                        {n.reason.replace('_', ' ')}
                                    </span>
                                </div>
                                
                                <a 
                                    href={getTargetUrl(n)} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="text-base font-medium text-white group-hover:text-accent transition-colors block truncate pr-8"
                                >
                                    {n.subject.title}
                                </a>
                            </div>

                            <div className="flex flex-col gap-2 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => markAsRead(n.id)} 
                                    disabled={processingId === n.id}
                                    className="p-2 rounded-lg hover:bg-white/10 text-muted hover:text-green-400 transition-colors"
                                    title="Mark as read"
                                >
                                    {processingId === n.id ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                                </button>
                                <a 
                                    href={getTargetUrl(n)} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="p-2 rounded-lg hover:bg-white/10 text-muted hover:text-blue-400 transition-colors"
                                >
                                    <ExternalLink size={18} />
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
};

export default NotificationCenter;