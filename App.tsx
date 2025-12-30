

import React, { useState, useEffect } from 'react';
import { GitHubService } from './services/githubService';
import { GitHubUser, GitHubRepo, ContributionCalendar, HeatmapTheme } from './types';
import TokenGate from './components/TokenGate';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import RepoManager from './components/RepoManager';
import ProfileEditor from './components/ProfileEditor';
import NetworkManager from './components/NetworkManager';
import Settings from './components/Settings';
import NotificationCenter from './components/NotificationCenter';
import GistManager from './components/GistManager';
import WorkflowMonitor from './components/WorkflowMonitor';
import FocusBoard from './components/FocusBoard';
import { AgentProvider } from './components/AgentProvider';
import { Loader2, AlertTriangle } from 'lucide-react';

const HEATMAP_THEMES: Record<string, HeatmapTheme> = {
  graphite: {
    label: 'Graphite',
    colors: ['bg-white/5', 'bg-blue-900/40', 'bg-blue-700/60', 'bg-blue-500/80', 'bg-blue-400'],
    glow: 'shadow-[0_0_20px_rgba(59,130,246,0.1)]'
  },
  classic: {
    label: 'GitHub Classic',
    colors: ['bg-[#161b22]', 'bg-[#0e4429]', 'bg-[#006d32]', 'bg-[#26a641]', 'bg-[#39d353]'],
    glow: 'shadow-[0_0_20px_rgba(34,197,94,0.1)]'
  },
  halloween: {
    label: 'Halloween',
    colors: ['bg-white/5', 'bg-yellow-900/40', 'bg-orange-700/60', 'bg-orange-500/80', 'bg-yellow-400'],
    glow: 'shadow-[0_0_20px_rgba(234,179,8,0.1)]'
  },
  amethyst: {
    label: 'Amethyst',
    colors: ['bg-white/5', 'bg-purple-900/40', 'bg-purple-700/60', 'bg-purple-500/80', 'bg-purple-400'],
    glow: 'shadow-[0_0_20px_rgba(168,85,247,0.1)]'
  },
  cyberpunk: {
    label: 'Cyberpunk',
    colors: ['bg-white/5', 'bg-pink-900/40', 'bg-pink-600/60', 'bg-cyan-500/80', 'bg-cyan-400'],
    glow: 'shadow-[0_0_20px_rgba(236,72,153,0.1)]'
  }
};

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('gh_token'));
  const [service, setService] = useState<GitHubService | null>(null);
  
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [contributions, setContributions] = useState<ContributionCalendar | null>(null);
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState<boolean>(!!localStorage.getItem('gh_token'));
  const [error, setError] = useState<string | null>(null);

  // Theme State
  const [activeTheme, setActiveTheme] = useState<string>(localStorage.getItem('heatmap_theme') || 'graphite');

  // Intelligent Routing: Track visited tabs to keep them mounted (preserving state)
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set(['dashboard']));

  useEffect(() => {
    if (token) {
      const srv = new GitHubService(token);
      setService(srv);
      fetchData(srv);
    } else {
        setLoading(false);
    }
  }, [token]);

  // Update visited tabs when navigation occurs
  useEffect(() => {
    setVisitedTabs(prev => {
        if (prev.has(activeTab)) return prev;
        const newSet = new Set(prev);
        newSet.add(activeTab);
        return newSet;
    });
  }, [activeTab]);

  const handleThemeChange = (newTheme: string) => {
    setActiveTheme(newTheme);
    localStorage.setItem('heatmap_theme', newTheme);
  };

  const fetchData = async (srv: GitHubService) => {
    setLoading(true);
    setError(null);
    try {
      const userData = await srv.getAuthenticatedUser();
      setUser(userData);
      
      const [repoData, contributionData] = await Promise.all([
          srv.getUserRepos(),
          srv.getContributionCalendar()
      ]);

      setRepos(repoData);
      setContributions(contributionData);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to fetch data');
      if (err.message.includes('Unauthorized')) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTokenSubmit = (newToken: string) => {
    localStorage.setItem('gh_token', newToken);
    setToken(newToken);
    setLoading(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('gh_token');
    setToken(null);
    setUser(null);
    setRepos([]);
    setContributions(null);
    setService(null);
    setLoading(false);
    setVisitedTabs(new Set(['dashboard']));
  };

  if (!token) {
    return <TokenGate onTokenSubmit={handleTokenSubmit} />;
  }

  if (loading || !user) {
    if (error) {
         return (
            <div className="h-screen w-full bg-[#09090b] flex flex-col items-center justify-center gap-6 animate-fade-in">
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500">
                <AlertTriangle size={32} />
              </div>
              <div className="text-center space-y-2">
                  <h2 className="text-xl font-bold text-white">Connection Failed</h2>
                  <p className="text-red-400 max-w-md text-sm">{error}</p>
              </div>
              <button 
                onClick={handleLogout} 
                className="px-6 py-2.5 bg-surface-highlight border border-white/10 rounded-xl text-white hover:bg-white/5 transition-colors font-medium text-sm"
              >
                Return to Login
              </button>
            </div>
         );
    }

    return (
      <div className="h-screen w-full bg-[#09090b] flex flex-col items-center justify-center text-accent gap-6">
        <div className="relative">
            <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full animate-pulse"></div>
            <Loader2 className="relative w-12 h-12 animate-spin text-accent" />
        </div>
        <div className="text-center space-y-2">
            <p className="text-white font-medium tracking-tight">Authenticating Secure Session</p>
            <p className="text-muted text-xs font-mono uppercase tracking-widest opacity-70">Connecting to GitHub API...</p>
        </div>
      </div>
    );
  }

  // Define tab content configuration
  const tabConfig = [
    { 
        id: 'dashboard', 
        content: user && (
          <Dashboard 
            user={user} 
            repos={repos} 
            contributionCalendar={contributions} 
            isVisible={activeTab === 'dashboard'}
            activeTheme={activeTheme}
            themes={HEATMAP_THEMES}
          />
        )
    },
    { 
        id: 'focus', 
        content: service && <FocusBoard service={service} /> 
    },
    { 
        id: 'workflows', 
        content: service && <WorkflowMonitor service={service} repos={repos} /> 
    },
    { 
        id: 'notifications', 
        content: service && <NotificationCenter service={service} /> 
    },
    { 
        id: 'repos', 
        content: service && <RepoManager repos={repos} service={service} onRefresh={() => service && fetchData(service)} /> 
    },
    { 
        id: 'gists', 
        content: service && <GistManager service={service} /> 
    },
    { 
        id: 'network', 
        content: service && user && <NetworkManager service={service} currentUser={user} /> 
    },
    { 
        id: 'profile', 
        content: user && service && <ProfileEditor user={user} service={service} onRefresh={() => service && fetchData(service)} /> 
    },
    { 
        id: 'settings', 
        content: (
          <Settings 
            activeTheme={activeTheme} 
            setActiveTheme={handleThemeChange} 
            themes={HEATMAP_THEMES}
          />
        )
    }
  ];

  // Enable full width for complex views like Repos (Editor) and Workflows
  const isFullWidthTab = ['repos', 'workflows', 'network'].includes(activeTab);

  return (
    <AgentProvider service={service}>
      <Layout 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onLogout={handleLogout} 
        userLogin={user.login}
        service={service!}
        isFullWidth={isFullWidthTab}
      >
        {tabConfig.map(tab => {
            // Lazy load: only render if visited at least once
            if (!visitedTabs.has(tab.id)) return null;

            const isActive = activeTab === tab.id;

            return (
                <div 
                    key={tab.id}
                    style={{ 
                        display: isActive ? 'block' : 'none',
                        height: '100%' 
                    }}
                    className="animate-fade-in h-full"
                >
                    {tab.content}
                </div>
            );
        })}
      </Layout>
    </AgentProvider>
  );
}

export default App;