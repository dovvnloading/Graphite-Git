

import React, { useState, useEffect } from 'react';
import { GitHubUser } from '../types';
import { GitHubService } from '../services/githubService';
import { ShieldCheck, ShieldAlert, UserMinus, RefreshCw, Search, Shield, Loader2, Users, UserPlus, ArrowRightLeft, UserCheck, ChevronLeft, ChevronRight, Zap } from 'lucide-react';

interface NetworkManagerProps {
  service: GitHubService;
  currentUser: GitHubUser;
}

const STORAGE_KEY_WHITELIST = 'graphite_whitelist';
const PER_PAGE = 48;

const NetworkManager: React.FC<NetworkManagerProps> = ({ service, currentUser }) => {
  // --- State ---
  const [activeTab, setActiveTab] = useState<'followers' | 'following' | 'audit' | 'safetynet'>('followers');
  
  // Data State
  const [pageUsers, setPageUsers] = useState<GitHubUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  
  // Audit/Sync State
  const [isSynced, setIsSynced] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [allFollowers, setAllFollowers] = useState<Set<string>>(new Set());
  const [allFollowing, setAllFollowing] = useState<Set<string>>(new Set());
  const [auditNonFollowers, setAuditNonFollowers] = useState<GitHubUser[]>([]);

  // Whitelist State
  const [whitelist, setWhitelist] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  
  // --- Effects ---

  useEffect(() => {
    loadPersistedData();
  }, []);

  useEffect(() => {
      // Reset page when tab changes
      setPage(1);
      setSearch('');
  }, [activeTab]);

  useEffect(() => {
      loadTabContent();
  }, [activeTab, page]);

  // --- Helpers ---

  const loadPersistedData = () => {
    try {
      const savedWhitelist = localStorage.getItem(STORAGE_KEY_WHITELIST);
      if (savedWhitelist) {
        setWhitelist(new Set(JSON.parse(savedWhitelist) as string[]));
      }
    } catch (e) {
      console.error("Error loading persisted network data:", e);
    }
  };

  const toggleWhitelist = (username: string) => {
    const newWhitelist = new Set(whitelist);
    if (newWhitelist.has(username)) {
      newWhitelist.delete(username);
    } else {
      newWhitelist.add(username);
    }
    setWhitelist(newWhitelist);
    localStorage.setItem(STORAGE_KEY_WHITELIST, JSON.stringify(Array.from(newWhitelist)));
  };

  // --- Data Loading ---

  const loadTabContent = async () => {
      if (activeTab === 'audit' || activeTab === 'safetynet') return; // Handled differently

      setLoading(true);
      try {
          let data: GitHubUser[] = [];
          if (activeTab === 'followers') {
              data = await service.getFollowersPage(page, PER_PAGE);
          } else if (activeTab === 'following') {
              data = await service.getFollowingPage(page, PER_PAGE);
          }
          setPageUsers(data);
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  const syncNetwork = async () => {
      setSyncLoading(true);
      try {
          // Execute sequentially to prevent API Rate Limit bombing
          const followers = await service.getAllFollowers();
          
          // Small pause between large operations
          await new Promise(r => setTimeout(r, 1000));
          
          const following = await service.getAllFollowing();
          
          const followerSet = new Set(followers.map(u => u.login));
          const followingSet = new Set(following.map(u => u.login));
          
          setAllFollowers(followerSet);
          setAllFollowing(followingSet);
          
          // Calculate Non-Followers for Audit
          const nonFollowers = following.filter(u => !followerSet.has(u.login));
          setAuditNonFollowers(nonFollowers);
          
          setIsSynced(true);
      } catch (e) {
          console.error("Sync failed", e);
          alert("Network sync failed or hit rate limits. Check console.");
      } finally {
          setSyncLoading(false);
      }
  };

  // --- Actions ---

  const handleFollow = async (username: string) => {
      try {
          await service.followUser(username);
          // Optimistic updates
          if (activeTab === 'following') {
               // Rare case, but reload page
               loadTabContent();
          }
          // If synced, update sets
          if (isSynced) {
              setAllFollowing(prev => new Set(prev).add(username));
          }
      } catch (e) {
          alert(`Failed to follow ${username}`);
      }
  };

  const handleUnfollow = async (username: string) => {
      try {
          await service.unfollowUser(username);
          // Optimistic remove from list if in Following tab
          if (activeTab === 'following') {
              setPageUsers(prev => prev.filter(u => u.login !== username));
          }
          // If synced, update sets
          if (isSynced) {
              const next = new Set(allFollowing);
              next.delete(username);
              setAllFollowing(next);
          }
      } catch (e) {
          alert(`Failed to unfollow ${username}`);
      }
  };

  // --- Rendering Helpers ---

  const renderPagination = (totalItems: number) => {
      const totalPages = Math.ceil(totalItems / PER_PAGE);
      if (totalPages <= 1) return null;

      return (
          <div className="flex items-center justify-center gap-4 py-4">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="p-2 rounded-lg bg-surface-highlight border border-white/5 disabled:opacity-30 hover:bg-white/10 transition-colors"
              >
                  <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-mono text-muted">
                  Page {page} of {totalPages}
              </span>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="p-2 rounded-lg bg-surface-highlight border border-white/5 disabled:opacity-30 hover:bg-white/10 transition-colors"
              >
                  <ChevronRight size={16} />
              </button>
          </div>
      );
  };

  const renderUserCard = (user: GitHubUser, context: 'follower' | 'following' | 'audit') => {
      const isWhitelisted = whitelist.has(user.login);
      
      // Mutual Logic:
      // If Synced:
      // - In Followers Tab: Mutual if user is in allFollowing set.
      // - In Following Tab: Mutual if user is in allFollowers set.
      // - In Audit Tab: By definition NOT mutual (they don't follow me).
      
      let isMutual = false;
      let amIFollowing = false;
      
      if (isSynced) {
          if (context === 'follower') {
              isMutual = allFollowing.has(user.login);
              amIFollowing = isMutual;
          } else if (context === 'following') {
              isMutual = allFollowers.has(user.login);
              amIFollowing = true;
          }
      }

      return (
        <div key={user.id} className="relative group glass-panel p-4 rounded-xl border border-transparent hover:border-white/10 hover:bg-surface-highlight/40 transition-all flex flex-col gap-3">
             <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 min-w-0">
                    <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full border border-white/10 bg-surface" />
                    <div className="min-w-0">
                        <h4 className="text-sm font-bold text-white truncate max-w-[140px]" title={user.login}>{user.login}</h4>
                        <a href={user.html_url} target="_blank" rel="noreferrer" className="text-[10px] text-accent hover:underline block truncate">
                             View Profile
                        </a>
                    </div>
                </div>
                
                {isSynced && isMutual && (
                     <div className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-green-500/10 text-green-400 border border-green-500/20 flex items-center gap-1" title="You follow each other">
                         <ArrowRightLeft size={10} /> Mutual
                     </div>
                )}
             </div>

             <div className="flex items-center gap-2 mt-auto pt-2">
                 <button 
                    onClick={() => toggleWhitelist(user.login)}
                    className={`p-2 rounded-lg transition-colors border ${isWhitelisted ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-surface-highlight text-muted border-transparent hover:text-white'}`}
                    title="Add/Remove from Safety Net"
                 >
                     {isWhitelisted ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                 </button>

                 {context === 'follower' && (
                     !amIFollowing && isSynced ? (
                         <button 
                             onClick={() => handleFollow(user.login)}
                             className="flex-1 py-1.5 px-3 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors flex items-center justify-center gap-2 text-xs font-bold"
                         >
                             <UserPlus size={14} /> Follow Back
                         </button>
                     ) : (
                         // If we are unsynced, we don't show Follow Back because we don't know if we follow them.
                         // Or we show generic "View" or just nothing.
                         // Let's assume generic Follow is safer to hide if unsure, or just show if not synced
                         !isSynced && (
                             <button 
                                 onClick={() => handleFollow(user.login)}
                                 className="flex-1 py-1.5 px-3 rounded-lg bg-white/5 text-muted border border-white/5 hover:bg-white/10 hover:text-white transition-colors flex items-center justify-center gap-2 text-xs font-bold"
                             >
                                 <UserPlus size={14} /> Follow
                             </button>
                         )
                     )
                 )}

                 {(context === 'following' || context === 'audit') && !isWhitelisted && (
                     <button 
                         onClick={() => handleUnfollow(user.login)}
                         className="flex-1 py-1.5 px-3 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2 text-xs font-bold"
                     >
                         <UserMinus size={14} /> Unfollow
                     </button>
                 )}
                 
                 {isWhitelisted && context !== 'follower' && (
                     <div className="flex-1 flex items-center justify-center text-[10px] text-muted italic bg-white/5 rounded-lg py-1.5">
                         Protected
                     </div>
                 )}
             </div>
        </div>
      );
  };

  const getDisplayedUsers = () => {
      if (activeTab === 'followers') return pageUsers;
      if (activeTab === 'following') return pageUsers;
      if (activeTab === 'audit') return auditNonFollowers;
      // Safety Net: Need to reconstruct user objects or store them. 
      // For simplicity in this version, Safety Net only shows if we have data.
      return []; 
  };

  const displayedUsers = getDisplayedUsers().filter(u => 
      u.login.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col gap-6 animate-fade-in">
      {/* Top Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <div className="glass-panel p-4 rounded-xl flex items-center gap-4">
             <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20">
                 <Users size={20} />
             </div>
             <div>
                 <div className="text-2xl font-bold text-white">{currentUser.followers}</div>
                 <div className="text-xs text-muted uppercase tracking-wider">Followers</div>
             </div>
         </div>
         <div className="glass-panel p-4 rounded-xl flex items-center gap-4">
             <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400 border border-purple-500/20">
                 <UserCheck size={20} />
             </div>
             <div>
                 <div className="text-2xl font-bold text-white">{currentUser.following}</div>
                 <div className="text-xs text-muted uppercase tracking-wider">Following</div>
             </div>
         </div>
         <div className="glass-panel p-4 rounded-xl flex items-center gap-4">
             <div className="p-3 bg-red-500/10 rounded-lg text-red-400 border border-red-500/20">
                 <UserMinus size={20} />
             </div>
             <div>
                 <div className="text-2xl font-bold text-white">
                     {isSynced ? auditNonFollowers.length : '-'}
                 </div>
                 <div className="text-xs text-muted uppercase tracking-wider">Unrequited</div>
             </div>
         </div>
         <div className="glass-panel p-4 rounded-xl flex items-center gap-4">
             <div className="p-3 bg-green-500/10 rounded-lg text-green-400 border border-green-500/20">
                 <ShieldCheck size={20} />
             </div>
             <div>
                 <div className="text-2xl font-bold text-white">{whitelist.size}</div>
                 <div className="text-xs text-muted uppercase tracking-wider">Safety Net</div>
             </div>
         </div>
      </div>

      {/* Main Control Panel */}
      <div className="flex-1 glass-panel rounded-2xl flex flex-col overflow-hidden border-accent/10 min-h-0">
         {/* Toolbar */}
         <div className="p-4 border-b border-white/5 flex flex-col xl:flex-row items-center justify-between gap-4 bg-surface/30">
             <div className="flex items-center gap-2 w-full overflow-x-auto pb-2 xl:pb-0 scrollbar-hide">
                <button 
                  onClick={() => setActiveTab('followers')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'followers' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-muted hover:text-white hover:bg-white/5'}`}
                >
                    Followers
                </button>
                <button 
                  onClick={() => setActiveTab('following')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'following' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-muted hover:text-white hover:bg-white/5'}`}
                >
                    Following
                </button>
                <div className="w-px h-6 bg-white/10 mx-1"></div>
                <button 
                  onClick={() => setActiveTab('audit')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'audit' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-muted hover:text-white hover:bg-white/5'}`}
                >
                    Audit
                </button>
                <button 
                  onClick={() => setActiveTab('safetynet')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'safetynet' ? 'bg-green-600 text-white shadow-lg shadow-green-600/20' : 'text-muted hover:text-white hover:bg-white/5'}`}
                >
                    <Shield size={14} />
                    Safety Net
                </button>
             </div>

             <div className="flex items-center gap-3 w-full xl:w-auto">
                 {/* Only show search on current page for unsynced, or global for synced? For now purely local filter */}
                 <div className="relative group flex-1 md:w-64">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted group-focus-within:text-accent" />
                    <input 
                      type="text" 
                      placeholder="Filter current view..." 
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-accent/50 transition-all"
                    />
                 </div>
                 
                 {!isSynced && (
                     <button 
                        onClick={syncNetwork} 
                        disabled={syncLoading}
                        className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-accent transition-colors border border-accent/20"
                        title="Scan entire network for Mutual/Audit data"
                     >
                        <RefreshCw size={14} className={syncLoading ? 'animate-spin' : ''} />
                        {syncLoading ? 'Scanning...' : 'Sync Network'}
                     </button>
                 )}
                 {isSynced && (
                    <div className="px-3 py-2 bg-green-500/10 rounded-lg text-green-400 text-xs font-bold border border-green-500/20 flex items-center gap-2">
                        <Zap size={14} /> Synced
                    </div>
                 )}
             </div>
         </div>
         
         {/* Main Content Area */}
         <div className="flex-1 overflow-y-auto p-4 pb-20">
             {loading ? (
                 <div className="h-full flex items-center justify-center">
                     <Loader2 className="w-8 h-8 text-accent animate-spin" />
                 </div>
             ) : (
                 <>
                     {/* Empty States / Special Views */}
                     {activeTab === 'audit' && !isSynced && (
                         <div className="flex flex-col items-center justify-center h-64 text-center p-8">
                             <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mb-4">
                                 <RefreshCw size={32} className="text-accent" />
                             </div>
                             <h3 className="text-xl font-bold text-white mb-2">Network Sync Required</h3>
                             <p className="text-muted text-sm max-w-md mb-6 leading-relaxed">
                                 To identify users who don't follow you back, Graphite needs to compare your entire Followers list against your Following list.
                             </p>
                             <button 
                                onClick={syncNetwork}
                                disabled={syncLoading}
                                className="px-6 py-3 bg-accent text-white rounded-xl font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-accent/20 flex items-center gap-2"
                             >
                                 {syncLoading ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                                 Start Network Scan
                             </button>
                         </div>
                     )}

                     {activeTab === 'safetynet' && whitelist.size === 0 && (
                         <div className="flex flex-col items-center justify-center h-64 text-center text-muted">
                             <Shield size={48} className="opacity-20 mb-4" />
                             <p>Your Safety Net is empty.</p>
                             <p className="text-xs mt-2">Add users to the whitelist to prevent accidental unfollowing.</p>
                         </div>
                     )}
                     
                     {/* User Grid */}
                     {(activeTab !== 'audit' || isSynced) && (
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {activeTab === 'safetynet' 
                                ? Array.from(whitelist).filter((u: string) => u.toLowerCase().includes(search.toLowerCase())).map((login: string) => (
                                    <div key={login} className="p-4 rounded-xl border border-white/10 bg-surface flex items-center justify-between">
                                        <span className="font-bold text-white">{login}</span>
                                        <button onClick={() => toggleWhitelist(login)} className="text-green-400 hover:text-red-400 p-2">
                                            <ShieldCheck size={18} />
                                        </button>
                                    </div>
                                ))
                                : displayedUsers.map(user => renderUserCard(user, activeTab as any))
                            }
                         </div>
                     )}

                     {/* Pagination Controls (Only for Follower/Following pages) */}
                     {(activeTab === 'followers' || activeTab === 'following') && !loading && (
                         renderPagination(activeTab === 'followers' ? currentUser.followers : currentUser.following)
                     )}
                 </>
             )}
         </div>
      </div>
    </div>
  );
};

export default NetworkManager;
