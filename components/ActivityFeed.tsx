import React, { useEffect, useState } from 'react';
import { GitHubService } from '../services/githubService';
import { GitHubEvent } from '../types';
import { 
  GitCommit, Star, GitBranch, GitPullRequest, CircleDot, 
  Activity, X, MessageSquare, RefreshCw, User, GitFork, 
  Globe, Zap
} from 'lucide-react';

interface ActivityFeedProps {
  service: GitHubService;
  username: string;
  onClose: () => void;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ service, username, onClose }) => {
  const [activeTab, setActiveTab] = useState<'my' | 'network'>('my');
  const [events, setEvents] = useState<GitHubEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, [activeTab]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      let data: GitHubEvent[] = [];
      if (activeTab === 'my') {
        data = await service.getUserEvents(username);
      } else {
        data = await service.getReceivedEvents(username);
      }
      setEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d`;
    return date.toLocaleDateString();
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'PushEvent': return <GitCommit size={14} className="text-purple-400" />;
      case 'WatchEvent': return <Star size={14} className="text-yellow-400" />;
      case 'CreateEvent': return <GitBranch size={14} className="text-green-400" />;
      case 'PullRequestEvent': return <GitPullRequest size={14} className="text-blue-400" />;
      case 'IssuesEvent': return <CircleDot size={14} className="text-green-400" />;
      case 'IssueCommentEvent': return <MessageSquare size={14} className="text-gray-400" />;
      case 'ForkEvent': return <GitFork size={14} className="text-gray-400" />;
      default: return <Activity size={14} className="text-muted" />;
    }
  };

  const getEventDescription = (event: GitHubEvent) => {
    switch (event.type) {
      case 'PushEvent':
        const count = event.payload.size || 0;
        return (
          <div className="space-y-2">
            <span className="text-sm text-gray-300">
               Pushed <span className="text-white font-bold">{count}</span> commits to 
               <code className="mx-1 bg-white/10 px-1 rounded text-xs">{event.payload.ref.replace('refs/heads/', '')}</code>
            </span>
            <div className="space-y-1">
                {event.payload.commits?.slice(0, 3).map((c: any) => (
                    <div key={c.sha} className="text-xs font-mono text-muted truncate border-l-2 border-white/10 pl-2">
                        {c.message}
                    </div>
                ))}
            </div>
          </div>
        );
      case 'WatchEvent':
        return <span className="text-sm text-gray-300">Starred repository</span>;
      case 'CreateEvent':
        return <span className="text-sm text-gray-300">Created {event.payload.ref_type} <code className="mx-1 bg-white/10 px-1 rounded text-xs">{event.payload.ref || event.repo.name}</code></span>;
      case 'PullRequestEvent':
        return (
            <div className="space-y-1">
                <span className="text-sm text-gray-300">
                    <span className="capitalize">{event.payload.action}</span> pull request
                </span>
                <div className="text-sm font-bold text-white leading-tight">
                    {event.payload.pull_request.title}
                </div>
            </div>
        );
      case 'IssuesEvent':
        return (
            <div className="space-y-1">
                <span className="text-sm text-gray-300">
                    <span className="capitalize">{event.payload.action}</span> issue
                </span>
                <div className="text-sm font-bold text-white leading-tight">
                    {event.payload.issue.title}
                </div>
            </div>
        );
      case 'IssueCommentEvent':
        return <span className="text-sm text-gray-300">Commented on issue <span className="text-white font-bold">#{event.payload.issue.number}</span></span>;
      case 'ForkEvent':
        return <span className="text-sm text-gray-300">Forked repository</span>;
      default:
        return <span className="text-sm text-gray-300">Activity in {event.repo.name}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] w-full h-full md:absolute md:top-0 md:right-0 md:h-full md:w-96 bg-[#09090b] md:border-l md:border-white/10 shadow-2xl flex flex-col animate-slide-up md:animate-slide-left">
      {/* Header */}
      <div className="h-16 md:h-14 border-b border-white/5 flex items-center justify-between px-4 bg-surface/50 backdrop-blur safe-area-pt">
          <div className="flex items-center gap-2">
              <Activity size={20} className="text-accent" />
              <span className="font-bold text-white text-base md:text-sm">Activity Stream</span>
          </div>
          <button onClick={onClose} className="p-2 text-muted hover:text-white rounded-full bg-white/5 md:bg-transparent">
              <X size={20} />
          </button>
      </div>

      {/* Tabs */}
      <div className="flex p-3 gap-3 border-b border-white/5 bg-surface/20">
          <button 
            onClick={() => setActiveTab('my')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'my' ? 'bg-surface-highlight text-white shadow-sm' : 'text-muted hover:text-white bg-black/20'}`}
          >
              <Zap size={16} /> My Timeline
          </button>
          <button 
            onClick={() => setActiveTab('network')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'network' ? 'bg-surface-highlight text-white shadow-sm' : 'text-muted hover:text-white bg-black/20'}`}
          >
              <Globe size={16} /> Network
          </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-0 pb-24 md:pb-0">
          {loading ? (
             <div className="space-y-4 p-4">
                 {[1, 2, 3, 4, 5].map(i => (
                     <div key={i} className="h-24 bg-surface-highlight/20 rounded-xl animate-pulse"></div>
                 ))}
             </div>
          ) : events.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-64 text-muted gap-2">
                 <Activity size={48} className="opacity-10" />
                 <p className="text-sm">No recent activity found.</p>
             </div>
          ) : (
             <div className="divide-y divide-white/5">
                 {events.map(event => (
                     <div key={event.id} className="p-5 md:p-4 hover:bg-white/5 transition-colors group">
                         <div className="flex items-start gap-4">
                             {/* Avatar */}
                             <div className="relative flex-shrink-0">
                                 <img src={event.actor.avatar_url} alt="" className="w-10 h-10 rounded-full border border-white/10 bg-surface" />
                                 <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-surface border border-white/10 flex items-center justify-center shadow-sm">
                                     {getEventIcon(event.type)}
                                 </div>
                             </div>

                             {/* Content */}
                             <div className="flex-1 min-w-0">
                                 <div className="flex items-baseline justify-between mb-2">
                                     <span className="text-sm font-bold text-white hover:text-accent cursor-pointer truncate">
                                         {event.actor.display_login}
                                     </span>
                                     <span className="text-[10px] text-muted font-mono whitespace-nowrap ml-2">
                                         {timeAgo(event.created_at)}
                                     </span>
                                 </div>
                                 
                                 <div className="mb-2">
                                     {getEventDescription(event)}
                                 </div>
                                 
                                 <div className="flex items-center gap-2">
                                     <div className="text-[10px] text-muted font-mono bg-white/5 px-2 py-1 rounded truncate max-w-[200px] border border-white/5">
                                         {event.repo.name}
                                     </div>
                                 </div>
                             </div>
                         </div>
                     </div>
                 ))}
             </div>
          )}
      </div>
      
      {/* Footer */}
      <div className="p-4 border-t border-white/5 bg-surface/30 flex justify-center safe-area-pb md:pb-3">
          <button 
             onClick={fetchEvents}
             disabled={loading}
             className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-colors disabled:opacity-50"
          >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh Feed
          </button>
      </div>
    </div>
  );
};

export default ActivityFeed;