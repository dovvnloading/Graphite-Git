

import React, { useMemo } from 'react';
import { GitHubUser, GitHubRepo, ContributionCalendar, HeatmapTheme } from '../types';
import { Users, Star, Activity, MapPin, Link as LinkIcon, Calendar, GitPullRequest, GitCommit, TrendingUp, BarChart3, PieChart as PieChartIcon, Code2 } from 'lucide-react';

interface DashboardProps {
  user: GitHubUser;
  repos: GitHubRepo[];
  contributionCalendar: ContributionCalendar | null;
  isVisible?: boolean;
  activeTheme: string;
  themes: Record<string, HeatmapTheme>;
}

const Dashboard: React.FC<DashboardProps> = ({ user, repos, contributionCalendar, activeTheme, themes }) => {
  // --- Stats Calculation ---
  const totalStars = repos.reduce((acc, repo) => acc + repo.stargazers_count, 0);
  const totalForks = repos.reduce((acc, repo) => acc + repo.forks_count, 0);
  
  // --- Language Data (Progress Bars) ---
  const languages: Record<string, number> = {};
  let totalReposWithLang = 0;

  repos.forEach(repo => {
    if (repo.language) {
      languages[repo.language] = (languages[repo.language] || 0) + 1;
      totalReposWithLang += 1;
    }
  });
  
  // Convert to array and sort
  const languageData = Object.entries(languages)
    .map(([name, value]) => ({ 
        name, 
        value, 
        percentage: totalReposWithLang > 0 ? (value / totalReposWithLang) * 100 : 0 
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6); // Top 6

  // --- Contribution Heatmap Data ---
  const contributionGrid = useMemo(() => {
    if (!contributionCalendar) return [];
    // Display last 52 weeks (1 year) for a fuller heatmap
    const weeksToDisplay = 52; 
    return contributionCalendar.weeks.slice(-weeksToDisplay).map(week => ({
       days: week.contributionDays.map(day => ({
           date: day.date,
           count: day.contributionCount,
           // Determine color intensity based on count
           level: day.contributionCount === 0 ? 0 :
                  day.contributionCount <= 2 ? 1 :
                  day.contributionCount <= 5 ? 2 :
                  day.contributionCount <= 10 ? 3 : 4
       }))
    }));
  }, [contributionCalendar]);

  // --- Activity Trend (CSS Sparkline) ---
  const trendData = useMemo(() => {
      if (!contributionCalendar) return [];
      // Last 12 weeks for detailed trend
      return contributionCalendar.weeks.slice(-12).map((week, idx) => {
          const total = week.contributionDays.reduce((acc, day) => acc + day.contributionCount, 0);
          return {
              name: `W${idx + 1}`,
              value: total
          };
      });
  }, [contributionCalendar]);

  const maxTrend = Math.max(...trendData.map(d => d.value), 1);

  // --- Weekly Rhythm (CSS Bar Chart) ---
  const dayDistribution = useMemo(() => {
      if (!contributionCalendar) return [];
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const counts = new Array(7).fill(0);
      
      contributionCalendar.weeks.forEach(week => {
          week.contributionDays.forEach(day => {
              const d = new Date(day.date).getDay();
              counts[d] += day.contributionCount;
          });
      });
      
      const max = Math.max(...counts, 1);
      return days.map((day, i) => ({ 
          name: day, 
          value: counts[i],
          percent: (counts[i] / max) * 100 
      }));
  }, [contributionCalendar]);

  // Helpers
  const getHeatmapColor = (level: number) => {
      const currentThemeConfig = themes[activeTheme] || themes['graphite'];
      const colors = currentThemeConfig.colors;
      const index = Math.min(Math.max(level, 0), 4);
      return colors[index];
  };

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];

  const StatCard = ({ icon: Icon, label, value, trend, colorClass = "text-accent" }: any) => (
    <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:border-accent/30 transition-colors duration-300">
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-xl group-hover:bg-accent/10 transition-colors"></div>
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl bg-surface-highlight border border-white/5 group-hover:scale-110 transition-transform ${colorClass}`}>
           <Icon size={20} />
        </div>
        {trend && (
           <span className="text-[10px] font-mono bg-success/10 text-success px-2 py-1 rounded-full border border-success/20">
             {trend}
           </span>
        )}
      </div>
      <div>
         <div className="text-3xl font-bold text-white mb-1 tracking-tight">{value}</div>
         <div className="text-xs text-muted font-medium uppercase tracking-wider">{label}</div>
      </div>
    </div>
  );

  const currentThemeConfig = themes[activeTheme] || themes['graphite'];

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Hero Profile Section */}
      <div className="relative glass-panel rounded-3xl p-8 overflow-hidden border-accent/20">
         <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px] pointer-events-none"></div>
         <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="relative">
               <div className="absolute -inset-1 bg-gradient-to-br from-accent to-purple-600 rounded-full blur opacity-40"></div>
               <img src={user.avatar_url} alt="Profile" className="relative w-32 h-32 rounded-full border-4 border-surface bg-surface" />
               <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-surface" title="Hireable"></div>
            </div>
            
            <div className="flex-1 text-center md:text-left space-y-4">
               <div>
                  <h1 className="text-4xl font-bold text-white tracking-tight mb-1">{user.name}</h1>
                  <a href={user.html_url} target="_blank" rel="noreferrer" className="text-lg text-accent font-mono hover:underline">@{user.login}</a>
               </div>
               
               <p className="text-lg text-gray-300 max-w-2xl leading-relaxed">{user.bio}</p>
               
               <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-muted pt-2">
                  {user.location && <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5"><MapPin size={14} /> {user.location}</span>}
                  {user.blog && <a href={user.blog.startsWith('http') ? user.blog : `https://${user.blog}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 hover:text-white transition-colors"><LinkIcon size={14} /> Website</a>}
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5"><Calendar size={14} /> Joined {new Date(user.created_at).getFullYear()}</span>
               </div>
            </div>
         </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Followers" value={user.followers} trend="+2.4%" colorClass="text-blue-400" />
        <StatCard icon={GitPullRequest} label="Public Repos" value={user.public_repos} trend="Active" colorClass="text-purple-400" />
        <StatCard icon={Star} label="Total Stars" value={totalStars} colorClass="text-yellow-400" />
        <StatCard icon={GitCommit} label="Total Forks" value={totalForks} colorClass="text-green-400" />
      </div>

      {/* --- HEATMAP SECTION --- */}
      <div className={`glass-panel rounded-3xl p-8 border border-white/5 relative overflow-visible transition-all duration-500 z-30 ${currentThemeConfig.glow}`}>
          
          {/* Background Ambient Glow for Theme */}
          <div className={`absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-[150px] opacity-10 pointer-events-none transition-colors duration-700
             ${activeTheme === 'classic' ? 'bg-green-500' : ''}
             ${activeTheme === 'graphite' ? 'bg-blue-500' : ''}
             ${activeTheme === 'halloween' ? 'bg-orange-500' : ''}
             ${activeTheme === 'amethyst' ? 'bg-purple-500' : ''}
             ${activeTheme === 'cyberpunk' ? 'bg-pink-500' : ''}
          `}></div>

          <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-6 relative z-10">
               <div className="flex items-center gap-4">
                   <div className={`p-3.5 rounded-2xl border border-white/10 transition-colors duration-500 bg-white/5`}>
                       <Activity size={24} className="text-white" />
                   </div>
                   <div>
                       <h3 className="text-xl font-bold text-white tracking-tight">Contribution Graph</h3>
                       <p className="text-sm text-muted font-medium font-mono mt-0.5">
                           {contributionCalendar?.totalContributions || 0} contributions / year
                       </p>
                   </div>
               </div>
               
               {/* Dropdown removed as requested */}
          </div>

          {/* Grid Container */}
          <div className="w-full overflow-x-auto custom-scrollbar pb-6 relative z-10 px-1">
               <div className="flex gap-1.5 min-w-max justify-start lg:justify-center">
                   {contributionGrid.map((week, wIdx) => (
                       <div key={wIdx} className="flex flex-col gap-1.5">
                           {week.days.map((day, dIdx) => (
                               <div 
                                  key={`${wIdx}-${dIdx}`}
                                  className={`
                                    w-3.5 h-3.5 rounded-[3px] transition-all duration-300 relative group
                                    ${getHeatmapColor(day.level)}
                                    ${day.level > 0 ? 'hover:scale-110 hover:z-30 hover:brightness-125 hover:shadow-[0_0_10px_currentColor] cursor-pointer' : 'opacity-100'}
                                    border border-white/5
                                  `}
                               >
                                  {/* Tooltip */}
                                  <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-[#09090b] border border-white/10 px-3 py-2 rounded-lg shadow-2xl z-50 whitespace-nowrap flex flex-col items-center gap-1 pointer-events-none transition-opacity duration-200 min-w-[140px]">
                                      <span className="text-xs font-bold text-white tracking-tight">{day.count} contributions</span>
                                      <span className="text-[10px] text-muted font-mono">{new Date(day.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                      {/* Tiny triangle */}
                                      <div className="w-2 h-2 bg-[#09090b] border-r border-b border-white/10 absolute -bottom-1 rotate-45"></div>
                                  </div>
                               </div>
                           ))}
                       </div>
                   ))}
               </div>
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-end gap-3 text-[10px] text-muted font-mono mt-2 px-2">
               <span>Less</span>
               <div className="flex gap-1 bg-black/20 p-1.5 rounded-lg border border-white/5">
                   {currentThemeConfig.colors.map((color, i) => (
                       <div key={i} className={`w-3 h-3 rounded-[2px] ${color} ${i === 0 ? 'border border-white/10' : ''}`}></div>
                   ))}
               </div>
               <span>More</span>
           </div>
      </div>

      {/* --- METRICS & INSIGHTS GRID (CSS ONLY) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-0">
          
          {/* 1: Activity Pulse (CSS Bars) */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col hover:border-white/10 transition-colors">
             <div className="flex items-center gap-3 mb-6">
                 <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                     <TrendingUp size={18} />
                 </div>
                 <div>
                     <h3 className="font-bold text-white text-sm">Activity Pulse</h3>
                     <p className="text-[10px] text-muted">12-Week Velocity</p>
                 </div>
             </div>
             
             <div className="flex-1 flex items-end justify-between gap-1 h-[200px] w-full px-2">
                 {trendData.map((item, idx) => {
                     const heightPct = (item.value / maxTrend) * 100;
                     return (
                         <div key={idx} className="flex flex-col items-center gap-2 flex-1 group h-full justify-end">
                             <div 
                                className="w-full bg-blue-500/20 rounded-t-sm relative transition-all duration-500 group-hover:bg-blue-500/40"
                                style={{ height: `${heightPct}%` }}
                             >
                                 <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black border border-white/10 text-[10px] px-2 py-1 rounded text-white whitespace-nowrap z-10 pointer-events-none shadow-xl">
                                     {item.value} contribs
                                 </div>
                             </div>
                         </div>
                     );
                 })}
             </div>
             <div className="flex justify-between mt-2 px-2 text-[10px] text-muted font-mono">
                 <span>12 Weeks Ago</span>
                 <span>Now</span>
             </div>
          </div>

          {/* 2: Weekly Rhythm (CSS Bars) */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col hover:border-white/10 transition-colors">
             <div className="flex items-center gap-3 mb-6">
                 <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                     <BarChart3 size={18} />
                 </div>
                 <div>
                     <h3 className="font-bold text-white text-sm">Weekly Rhythm</h3>
                     <p className="text-[10px] text-muted">Productivity by Day</p>
                 </div>
             </div>
             
             <div className="flex-1 flex items-end justify-between gap-2 h-[200px] px-2">
                 {dayDistribution.map((item, idx) => (
                     <div key={idx} className="flex flex-col items-center gap-2 flex-1 group h-full justify-end">
                         <div 
                             className={`w-full rounded-t-sm relative transition-all duration-500 group-hover:opacity-80 ${idx === 0 || idx === 6 ? 'bg-purple-500/30' : 'bg-blue-500/40'}`}
                             style={{ height: `${item.percent}%` }}
                         >
                              <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black border border-white/10 text-[10px] px-2 py-1 rounded text-white whitespace-nowrap z-10 pointer-events-none shadow-xl">
                                 {item.value} contribs
                             </div>
                         </div>
                         <span className="text-[10px] text-muted uppercase font-bold">{item.name[0]}</span>
                     </div>
                 ))}
             </div>
          </div>

          {/* 3: Tech Stack (CSS Progress Bars) */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col hover:border-white/10 transition-colors">
             <div className="flex items-center gap-3 mb-6">
                 <div className="p-2 bg-orange-500/10 rounded-lg text-orange-400">
                     <PieChartIcon size={18} />
                 </div>
                 <div>
                     <h3 className="font-bold text-white text-sm">Tech Stack</h3>
                     <p className="text-[10px] text-muted">Repo Language Distribution</p>
                 </div>
             </div>
             
             <div className="flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2">
                 {languageData.length === 0 ? (
                     <div className="flex-1 flex items-center justify-center text-muted text-xs italic">
                         No language data detected.
                     </div>
                 ) : (
                     languageData.map((entry, index) => (
                         <div key={entry.name} className="space-y-1.5 group">
                             <div className="flex justify-between text-xs">
                                 <span className="text-white font-medium flex items-center gap-2">
                                    <Code2 size={12} className="text-muted" /> {entry.name}
                                 </span>
                                 <span className="text-muted font-mono">{Math.round(entry.percentage)}%</span>
                             </div>
                             <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                 <div 
                                    className="h-full rounded-full transition-all duration-1000 ease-out group-hover:opacity-80" 
                                    style={{ width: `${entry.percentage}%`, backgroundColor: COLORS[index % COLORS.length] }}
                                 ></div>
                             </div>
                         </div>
                     ))
                 )}
             </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;