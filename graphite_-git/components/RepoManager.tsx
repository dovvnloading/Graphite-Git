import React, { useState, useMemo, useEffect } from 'react';
import { GitHubRepo } from '../types';
import { Search, Star, GitFork, Eye, Lock, Globe, Edit2, Check, X, Filter, ChevronDown, Code2, Terminal, ArrowRight, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { GitHubService } from '../services/githubService';
import RepoViewer from './RepoViewer';

interface RepoManagerProps {
  repos: GitHubRepo[];
  service: GitHubService;
  onRefresh: () => void;
}

const ITEMS_PER_PAGE = 10;

const RepoManager: React.FC<RepoManagerProps> = ({ repos, service, onRefresh }) => {
  const [search, setSearch] = useState('');
  const [editingRepoId, setEditingRepoId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{ description: string; homepage: string }>({ description: '', homepage: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'public' | 'private' | 'forks'>('all');
  
  // Pagination State
  const [page, setPage] = useState(1);
  
  // New state for viewing repo code
  const [viewingRepo, setViewingRepo] = useState<GitHubRepo | null>(null);

  // Reset page when filter/search changes
  useEffect(() => {
    setPage(1);
  }, [search, filterType]);

  const filteredRepos = useMemo(() => {
    return repos.filter(r => {
       const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase());
       if (!matchesSearch) return false;
       
       if (filterType === 'public') return !r.private;
       if (filterType === 'private') return r.private;
       if (filterType === 'forks') return r.fork;
       return true;
    });
  }, [repos, search, filterType]);

  const totalPages = Math.ceil(filteredRepos.length / ITEMS_PER_PAGE);
  const paginatedRepos = useMemo(() => {
      const start = (page - 1) * ITEMS_PER_PAGE;
      return filteredRepos.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRepos, page]);

  const startEdit = (repo: GitHubRepo) => {
    setEditingRepoId(repo.id);
    setEditForm({
      description: repo.description || '',
      homepage: repo.homepage || '',
    });
  };

  const cancelEdit = () => {
    setEditingRepoId(null);
    setEditForm({ description: '', homepage: '' });
  };

  const saveEdit = async (repo: GitHubRepo) => {
    setIsSubmitting(true);
    try {
      await service.updateRepo(repo.owner.login, repo.name, {
        description: editForm.description,
        homepage: editForm.homepage,
      });
      onRefresh();
      setEditingRepoId(null);
    } catch (err) {
      console.error(err);
      alert('Failed to update repo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteRepo = async (repo: GitHubRepo) => {
    if (!confirm(`Are you sure you want to delete ${repo.name}? This action cannot be undone.`)) return;
    setIsSubmitting(true);
    try {
      await service.deleteRepo(repo.owner.login, repo.name);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Failed to delete repository. Check your permissions (delete_repo scope required).');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (viewingRepo) {
    return <RepoViewer repo={viewingRepo} service={service} onBack={() => setViewingRepo(null)} />;
  }

  return (
    <div className="space-y-6 flex flex-col min-h-0">
      {/* Header & Search */}
      <div className="flex flex-col gap-4 glass-panel p-4 rounded-xl sticky top-0 z-30 backdrop-blur-xl bg-background/50 border border-white/5">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-surface-highlight rounded-lg border border-white/5">
                  <Terminal className="w-5 h-5 text-accent" />
               </div>
               <div>
                 <h2 className="text-lg font-bold text-white tracking-tight">Repository Manager</h2>
                 <p className="text-muted text-xs font-mono">{filteredRepos.length} Repositories</p>
               </div>
            </div>
            {/* Mobile Filter Toggle could go here if needed, but select is fine */}
        </div>
        
        <div className="flex flex-col md:flex-row gap-3">
           <div className="relative group w-full">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                 <Search className="w-4 h-4 text-muted group-focus-within:text-accent transition-colors" />
              </div>
              <input 
                type="text" 
                placeholder="Search repos..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-lg py-3 pl-9 pr-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
              />
           </div>

           <div className="relative w-full md:w-48">
              <select 
                 value={filterType} 
                 onChange={(e: any) => setFilterType(e.target.value)}
                 className="w-full appearance-none bg-surface-highlight border border-white/10 text-sm text-white rounded-lg pl-4 pr-10 py-3 focus:outline-none focus:border-accent/50 cursor-pointer"
              >
                 <option value="all">All Repos</option>
                 <option value="public">Public</option>
                 <option value="private">Private</option>
                 <option value="forks">Forks</option>
              </select>
              <Filter className="absolute right-3 top-3.5 w-4 h-4 text-muted pointer-events-none" />
           </div>
        </div>
      </div>

      <div className="space-y-3 pb-8">
        {paginatedRepos.map(repo => {
          const isEditing = editingRepoId === repo.id;

          return (
            <div 
              key={repo.id} 
              className={`group relative z-0 glass-panel rounded-xl p-5 border transition-all duration-300 ${isEditing ? 'border-accent bg-accent/5' : 'border-transparent hover:border-white/10 hover:bg-surface-highlight/50'}`}
            >
              <div className="flex flex-col gap-4">
                {/* Header Row */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                         <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${repo.private ? 'bg-yellow-500' : 'bg-green-500'} shadow-[0_0_8px_currentColor] opacity-70`}></div>
                         <div className="min-w-0">
                             <h3 
                                className="text-base font-bold text-white hover:text-accent truncate font-mono cursor-pointer leading-tight"
                                onClick={() => setViewingRepo(repo)}
                             >
                                {repo.name}
                             </h3>
                             <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-muted border border-white/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    {repo.private ? 'Private' : 'Public'}
                                </span>
                                {repo.language && (
                                   <span className="flex items-center gap-1 text-[10px] text-gray-400">
                                      <Code2 className="w-3 h-3" /> {repo.language}
                                   </span>
                                )}
                             </div>
                         </div>
                    </div>
                </div>

                {/* Content Row */}
                <div className="pl-0 md:pl-5">
                  {isEditing ? (
                    <div className="grid grid-cols-1 gap-4 animate-fade-in mb-4">
                      <div className="space-y-1">
                         <label className="text-[10px] text-muted uppercase font-bold">Description</label>
                         <textarea
                           value={editForm.description}
                           onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                           className="w-full bg-black/40 border border-accent/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent min-h-[60px]"
                           placeholder="Repository description"
                         />
                      </div>
                      <div className="space-y-1">
                         <label className="text-[10px] text-muted uppercase font-bold">Homepage</label>
                         <input
                           type="text"
                           value={editForm.homepage}
                           onChange={(e) => setEditForm(prev => ({ ...prev, homepage: e.target.value }))}
                           className="w-full bg-black/40 border border-accent/50 rounded-lg px-3 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent"
                           placeholder="https://..."
                         />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 mb-2">
                      <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">
                        {repo.description || <span className="text-zinc-600 italic">No description provided</span>}
                      </p>
                      {repo.homepage && (
                        <a href={repo.homepage} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 hover:underline transition-colors break-all">
                          <Globe className="w-3 h-3" /> {repo.homepage}
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer / Actions Row */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-3 border-t border-white/5">
                   <div className="flex items-center gap-4 text-xs text-muted w-full md:w-auto justify-between md:justify-start">
                        <span className="flex items-center gap-1.5">
                           <Star className="w-3.5 h-3.5" /> {repo.stargazers_count}
                        </span>
                        <span className="flex items-center gap-1.5">
                           <GitFork className="w-3.5 h-3.5" /> {repo.forks_count}
                        </span>
                        <span className="text-[10px]">Updated {new Date(repo.updated_at).toLocaleDateString()}</span>
                   </div>

                   <div className="flex items-center gap-2 w-full md:w-auto">
                        {!isEditing ? (
                            <>
                                <button
                                    onClick={() => setViewingRepo(repo)}
                                    className="flex-1 md:flex-none py-2 px-3 bg-accent/10 text-accent hover:bg-accent/20 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 border border-accent/20"
                                >
                                    <Code2 size={14} /> Source
                                </button>
                                <button 
                                  onClick={() => startEdit(repo)}
                                  className="flex-1 md:flex-none py-2 px-3 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-all flex items-center justify-center gap-2 border border-white/5"
                                >
                                  <Edit2 size={14} /> Edit
                                </button>
                                <button 
                                  onClick={() => deleteRepo(repo)}
                                  className="p-2 hover:bg-red-500/10 rounded-lg text-muted hover:text-red-400 transition-all border border-transparent hover:border-red-500/10"
                                  title="Delete Repository"
                                >
                                  <Trash2 size={16} />
                                </button>
                            </>
                        ) : (
                            <div className="flex items-center gap-2 w-full">
                                <button 
                                  onClick={() => saveEdit(repo)} 
                                  disabled={isSubmitting}
                                  className="flex-1 py-2 px-3 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-green-500/20"
                                >
                                  <Check size={14} /> Save
                                </button>
                                <button 
                                  onClick={cancelEdit}
                                  disabled={isSubmitting}
                                  className="flex-1 py-2 px-3 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-red-500/20"
                                >
                                  <X size={14} /> Cancel
                                </button>
                            </div>
                        )}
                   </div>
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Pagination Controls */}
        {filteredRepos.length > 0 && (
            <div className="flex items-center justify-center gap-4 py-4 pt-6 border-t border-white/5">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-3 rounded-xl bg-surface-highlight border border-white/5 disabled:opacity-30 hover:bg-white/10 transition-colors shadow-sm"
                >
                    <ChevronLeft size={18} />
                </button>
                <span className="text-sm font-mono text-muted">
                    {page} / {totalPages}
                </span>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-3 rounded-xl bg-surface-highlight border border-white/5 disabled:opacity-30 hover:bg-white/10 transition-colors shadow-sm"
                >
                    <ChevronRight size={18} />
                </button>
            </div>
        )}

        {filteredRepos.length === 0 && (
           <div className="text-center py-20 text-muted">
              <p>No repositories found matching your filter.</p>
           </div>
        )}
      </div>
    </div>
  );
};

export default RepoManager;