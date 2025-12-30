import React, { useState } from 'react';
import { GitHubUser } from '../types';
import { GitHubService } from '../services/githubService';
import { Save, Loader2, MapPin, Link as LinkIcon, Building, Mail, User, Info, CheckCircle2 } from 'lucide-react';

interface ProfileEditorProps {
  user: GitHubUser;
  service: GitHubService;
  onRefresh: () => void;
}

const ProfileEditor: React.FC<ProfileEditorProps> = ({ user, service, onRefresh }) => {
  const [formData, setFormData] = useState({
    name: user.name || '',
    bio: user.bio || '',
    company: user.company || '',
    location: user.location || '',
    blog: user.blog || '',
    hireable: true 
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await service.updateAuthenticatedUser(formData);
      setMessage({ type: 'success', text: 'Changes deployed to GitHub successfully.' });
      onRefresh();
    } catch (err) {
      setMessage({ type: 'error', text: 'Deployment failed. Check your token permissions.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
       <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Profile Configuration</h2>
            <p className="text-muted text-xs font-mono">Sync your public developer identity.</p>
          </div>
          {message && (
             <div className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 animate-fade-in ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                {message.type === 'success' && <CheckCircle2 size={16} />}
                {message.text}
             </div>
          )}
       </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-8 min-h-0">
        {/* Left: Form */}
        <div className="flex-1 glass-panel rounded-2xl p-8 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
             
            <div className="space-y-4">
               <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">Basic Info</h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <label className="text-xs font-medium text-muted flex items-center gap-2">
                        <User size={12} /> Display Name
                     </label>
                     <input
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder-zinc-700"
                        placeholder="John Doe"
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-xs font-medium text-muted flex items-center gap-2">
                        <Building size={12} /> Company
                     </label>
                     <input
                        type="text"
                        value={formData.company}
                        onChange={e => setFormData({ ...formData, company: e.target.value })}
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder-zinc-700"
                        placeholder="@Company"
                     />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-xs font-medium text-muted flex items-center gap-2">
                     <Info size={12} /> Bio
                  </label>
                  <textarea
                     value={formData.bio}
                     onChange={e => setFormData({ ...formData, bio: e.target.value })}
                     rows={4}
                     className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all resize-none placeholder-zinc-700 leading-relaxed"
                     placeholder="Senior Software Engineer..."
                  />
                  <div className="flex justify-end">
                     <span className={`text-[10px] ${formData.bio.length > 160 ? 'text-red-400' : 'text-zinc-600'}`}>
                        {formData.bio.length} / 160
                     </span>
                  </div>
               </div>
            </div>

            <div className="space-y-4 pt-2">
               <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">Contact & Location</h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <label className="text-xs font-medium text-muted flex items-center gap-2">
                        <MapPin size={12} /> Location
                     </label>
                     <input
                        type="text"
                        value={formData.location}
                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder-zinc-700"
                        placeholder="San Francisco, CA"
                     />
                  </div>

                  <div className="space-y-2">
                     <label className="text-xs font-medium text-muted flex items-center gap-2">
                        <LinkIcon size={12} /> Website
                     </label>
                     <input
                        type="text"
                        value={formData.blog}
                        onChange={e => setFormData({ ...formData, blog: e.target.value })}
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder-zinc-700"
                        placeholder="https://..."
                     />
                  </div>
               </div>
            </div>

            <div className="pt-6 border-t border-white/5 flex justify-end">
                <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-8 py-3 bg-white text-black hover:bg-accent hover:text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-accent/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                    <span>Deploy Changes</span>
                </button>
            </div>
          </form>
        </div>

        {/* Right: Live Preview */}
        <div className="w-full lg:w-96 flex-shrink-0">
           <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-4">Live Preview</h3>
           
           <div className="glass-panel p-6 rounded-3xl border border-white/10 relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
               
               <div className="flex flex-col items-center text-center">
                  <div className="relative mb-4">
                     <div className="absolute -inset-0.5 bg-gradient-to-r from-accent to-purple-600 rounded-full blur opacity-75"></div>
                     <img src={user.avatar_url} alt="Preview" className="relative w-24 h-24 rounded-full border-4 border-[#18181b] bg-surface" />
                  </div>
                  
                  <h2 className="text-2xl font-bold text-white mb-1">{formData.name || user.login}</h2>
                  <p className="text-muted text-sm font-mono mb-4">@{user.login}</p>
                  
                  <p className="text-sm text-gray-300 leading-relaxed mb-6 w-full break-words">
                     {formData.bio || <span className="text-zinc-600 italic">No bio content...</span>}
                  </p>
                  
                  <div className="w-full space-y-3 text-sm border-t border-white/5 pt-4">
                     {formData.company && (
                        <div className="flex items-center gap-3 text-gray-400">
                           <Building size={16} /> <span>{formData.company}</span>
                        </div>
                     )}
                     {formData.location && (
                        <div className="flex items-center gap-3 text-gray-400">
                           <MapPin size={16} /> <span>{formData.location}</span>
                        </div>
                     )}
                     {formData.blog && (
                        <div className="flex items-center gap-3 text-accent truncate">
                           <LinkIcon size={16} /> <span className="truncate">{formData.blog}</span>
                        </div>
                     )}
                  </div>
               </div>
           </div>
           
           <div className="mt-6 p-4 rounded-xl bg-accent/5 border border-accent/10">
              <p className="text-xs text-accent/80 leading-relaxed">
                 <span className="font-bold">Note:</span> Updates are pushed directly to the GitHub API. Caching may cause a slight delay in visibility on github.com.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditor;