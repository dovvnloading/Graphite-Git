import React, { useState, useRef, useLayoutEffect } from 'react';
import { LayoutDashboard, Book, User, LogOut, Github, Users, Settings, Bell, ScrollText, PlayCircle, Target, Activity, Sparkles, Menu, X } from 'lucide-react';
import AgentUI from './AgentUI';
import ActivityFeed from './ActivityFeed';
import { useAgent } from './AgentProvider';
import { GitHubService } from '../services/githubService';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  userLogin?: string;
  service?: GitHubService;
  isFullWidth?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  onTabChange, 
  onLogout, 
  userLogin, 
  service,
  isFullWidth = false 
}) => {
  const { isPanelOpen, setPanelOpen } = useAgent();
  const [isFeedOpen, setIsFeedOpen] = useState(false);

  // --- Intelligent Scroll Management ---
  const mainRef = useRef<HTMLElement>(null);
  const scrollPositions = useRef<Record<string, number>>({});

  // Capture scroll position before switching tabs
  const handleTabChange = (newTab: string) => {
    if (mainRef.current) {
        scrollPositions.current[activeTab] = mainRef.current.scrollTop;
    }
    onTabChange(newTab);
  };

  // Restore scroll position when activeTab changes
  useLayoutEffect(() => {
    if (mainRef.current) {
        // Use requestAnimationFrame to ensure we scroll after layout update
        requestAnimationFrame(() => {
            const savedPosition = scrollPositions.current[activeTab] || 0;
            if (mainRef.current) {
                mainRef.current.scrollTop = savedPosition;
            }
        });
    }
  }, [activeTab]);
  // -------------------------------------

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'focus', label: 'Focus', icon: Target },
    { id: 'notifications', label: 'Inbox', icon: Bell },
    { id: 'repos', label: 'Repos', icon: Book },
    { id: 'profile', label: 'Me', icon: User },
  ];

  const desktopNavItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'focus', label: 'Focus', icon: Target },
    { id: 'workflows', label: 'CI/CD', icon: PlayCircle },
    { id: 'notifications', label: 'Inbox', icon: Bell },
    { id: 'repos', label: 'Repos', icon: Book },
    { id: 'gists', label: 'Gists', icon: ScrollText },
    { id: 'network', label: 'Network', icon: Users },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const toggleFeed = () => {
    if (isFeedOpen) setIsFeedOpen(false);
    else {
        setIsFeedOpen(true);
        setPanelOpen(false); // Close Agent if opening Feed
    }
  };

  const toggleAgent = () => {
    if (isPanelOpen) setPanelOpen(false);
    else {
        setPanelOpen(true);
        setIsFeedOpen(false); // Close Feed if opening Agent
    }
  };

  return (
    <div className="flex h-screen w-full bg-background text-text overflow-hidden selection:bg-accent selection:text-white">
      {/* DESKTOP SIDEBAR - Hidden on mobile */}
      <aside className="hidden md:flex w-16 flex-shrink-0 flex-col items-center py-4 border-r border-border bg-surface z-50 overflow-visible">
        <div className="mb-6">
          <Github className="w-8 h-8 text-white hover:text-accent transition-colors cursor-pointer" />
        </div>
        
        <nav className="flex-1 flex flex-col gap-4 w-full px-2">
          {desktopNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <div key={item.id} className="relative group flex justify-center">
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-accent rounded-r-full" />
                )}
                <button
                  onClick={() => handleTabChange(item.id)}
                  className={`p-3 rounded-xl transition-all duration-300 group
                    ${isActive 
                      ? 'text-accent bg-accent-dim' 
                      : 'text-muted hover:text-white hover:bg-white/5'
                    }`}
                >
                  <Icon size={24} strokeWidth={1.5} />
                </button>
                {/* Tooltip */}
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-2.5 py-1.5 bg-surface-highlight border border-white/10 text-xs font-medium text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-[100]">
                  {item.label}
                  <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-surface-highlight border-l border-b border-white/10 rotate-45 transform"></div>
                </div>
              </div>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-4 px-2 w-full pt-4 border-t border-white/5">
           {/* Activity Feed Toggle */}
           <div className="relative group flex justify-center">
            <button
                onClick={toggleFeed}
                className={`p-3 rounded-xl transition-colors flex justify-center items-center relative group ${isFeedOpen ? 'text-white bg-white/10' : 'text-muted hover:text-white hover:bg-white/5'}`}
            >
                <Activity size={24} strokeWidth={1.5} />
            </button>
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-2.5 py-1.5 bg-surface-highlight border border-white/10 text-xs font-medium text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-[100]">
                Activity Stream
                <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-surface-highlight border-l border-b border-white/10 rotate-45 transform"></div>
            </div>
           </div>

           {/* Agent Toggle */}
           <button
            onClick={toggleAgent}
            className={`p-3 rounded-xl transition-colors flex justify-center items-center relative group ${isPanelOpen ? 'text-purple-400 bg-purple-500/10' : 'text-muted hover:text-purple-400 hover:bg-purple-500/10'}`}
          >
            <span className="font-black text-xs tracking-tighter">AI</span>
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-2.5 py-1.5 bg-surface-highlight border border-white/10 text-xs font-medium text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-[100]">
                Agent
                <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-surface-highlight border-l border-b border-white/10 rotate-45 transform"></div>
            </div>
          </button>

          <div className="relative group flex justify-center">
            <button
                onClick={onLogout}
                className="p-3 rounded-xl text-muted hover:text-error hover:bg-error/10 transition-colors flex justify-center"
            >
                <LogOut size={24} strokeWidth={1.5} />
            </button>
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-2.5 py-1.5 bg-surface-highlight border border-white/10 text-xs font-medium text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-[100]">
                Sign Out
                <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-surface-highlight border-l border-b border-white/10 rotate-45 transform"></div>
            </div>
          </div>
        </div>
      </aside>

      {/* --- MOBILE THUMB UI LAYOUT --- */}
      
      {/* 1. Mobile Top Header (Minimal) */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/5 z-40 flex items-center justify-between px-4">
         <div className="flex items-center gap-2">
            <Github size={20} className="text-white" />
            <span className="font-bold text-white tracking-tight">Graphite</span>
         </div>
         <div className="flex items-center gap-3">
             <button 
                onClick={toggleFeed}
                className={`p-2 rounded-full transition-colors ${isFeedOpen ? 'bg-accent/20 text-accent' : 'text-muted hover:text-white'}`}
             >
                <Activity size={20} />
             </button>
             <button 
                onClick={() => handleTabChange('settings')}
                className={`p-2 rounded-full transition-colors ${activeTab === 'settings' ? 'text-white' : 'text-muted'}`}
             >
                <Settings size={20} />
             </button>
         </div>
      </header>

      {/* 2. Mobile Bottom Nav (Thumb Zone) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#09090b]/90 backdrop-blur-2xl border-t border-white/10 z-50 h-[88px] pb-6 px-4">
        <div className="flex items-center justify-between h-full max-w-sm mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className="flex flex-col items-center justify-center gap-1 w-14 h-full relative group"
              >
                 <div className={`p-2 rounded-2xl transition-all duration-300 ${isActive ? 'bg-accent text-white shadow-[0_0_15px_rgba(59,130,246,0.4)] translate-y-[-4px]' : 'text-muted group-active:scale-95'}`}>
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                 </div>
                 {isActive && <div className="w-1 h-1 bg-accent rounded-full absolute bottom-3"></div>}
              </button>
            );
          })}
        </div>
      </nav>

      {/* 3. Mobile Agent FAB (Floating Action Button) */}
      {/* Positioned just above the bottom nav */}
      <div className="md:hidden fixed bottom-24 right-5 z-[60]">
         <button
            onClick={toggleAgent}
            className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 active:scale-90 ${
                isPanelOpen 
                ? 'bg-surface border border-white/10 text-white rotate-90 shadow-none' 
                : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-purple-500/30 animate-pulse-slow'
            }`}
         >
            {isPanelOpen ? <X size={24} /> : <Sparkles size={24} />}
         </button>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-background">
        {/* Desktop Header - Hidden on Mobile */}
        <header className="hidden md:flex h-14 border-b border-border bg-surface/50 backdrop-blur-md items-center justify-between px-6 z-10 flex-shrink-0">
           <div className="flex items-center gap-4 text-sm text-muted">
              <span className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface-highlight/50 border border-white/5">
                 <span className="font-mono text-xs text-accent">&lt;Graphite:Git&gt;</span>
                 <span className="text-zinc-600">/</span>
                 <span className="text-white capitalize font-bold">{activeTab}</span>
              </span>
           </div>
           <div className="flex items-center gap-3">
              <div className="text-xs text-right">
                 <div className="text-white font-medium">{userLogin}</div>
              </div>
           </div>
        </header>

        {/* Content Viewport */}
        <div className="flex-1 flex overflow-hidden relative">
            {/* Main Content */}
            <main 
                ref={mainRef}
                className="flex-1 overflow-y-auto relative min-w-0 pt-16 md:pt-4 pb-28 md:pb-4 scroll-smooth" // Mobile: pt-16 (header), pb-28 (nav+fab space)
            >
               {/* Background Gradient Orbs */}
               <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                  <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px]" />
                  <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px]" />
               </div>

               <div className={`mx-auto min-h-full flex flex-col p-4 md:p-10 h-full ${isFullWidth ? 'max-w-full' : 'max-w-7xl'}`}>
                 {children}
               </div>
            </main>
            
            {/* Agent Sidebar / Overlay */}
            {isPanelOpen && <AgentUI onClose={() => setPanelOpen(false)} />}
            
            {/* Activity Feed Overlay */}
            {isFeedOpen && service && userLogin && (
                <ActivityFeed 
                    service={service} 
                    username={userLogin} 
                    onClose={() => setIsFeedOpen(false)} 
                />
            )}
        </div>
      </div>
    </div>
  );
};

export default Layout;