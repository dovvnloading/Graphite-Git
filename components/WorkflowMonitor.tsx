import React, { useState, useEffect } from 'react';
import { GitHubService } from '../services/githubService';
import { GitHubRepo, GitHubWorkflow, GitHubWorkflowRun } from '../types';
import { PlayCircle, Clock, CheckCircle2, XCircle, AlertCircle, Loader2, GitBranch, RefreshCw, Terminal } from 'lucide-react';

interface WorkflowMonitorProps {
  service: GitHubService;
  repos: GitHubRepo[];
}

const WorkflowMonitor: React.FC<WorkflowMonitorProps> = ({ service, repos }) => {
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [workflows, setWorkflows] = useState<GitHubWorkflow[]>([]);
  const [runs, setRuns] = useState<GitHubWorkflowRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [triggering, setTriggering] = useState<number | null>(null);

  useEffect(() => {
    if (repos.length > 0 && !selectedRepo) {
      // Default to the most recently updated repo that likely has CI
      setSelectedRepo(repos[0]);
    }
  }, [repos]);

  useEffect(() => {
    if (selectedRepo) {
      fetchWorkflowData();
    }
  }, [selectedRepo]);

  const fetchWorkflowData = async () => {
    if (!selectedRepo) return;
    setLoading(true);
    try {
      const [wfData, runData] = await Promise.all([
        service.getRepoWorkflows(selectedRepo.owner.login, selectedRepo.name),
        service.getWorkflowRuns(selectedRepo.owner.login, selectedRepo.name)
      ]);
      setWorkflows(wfData.workflows);
      setRuns(runData.workflow_runs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const triggerWorkflow = async (workflow: GitHubWorkflow) => {
    if (!selectedRepo) return;
    if (!confirm(`Manually trigger '${workflow.name}' on branch '${selectedRepo.default_branch}'?`)) return;
    
    setTriggering(workflow.id);
    try {
      await service.dispatchWorkflow(selectedRepo.owner.login, selectedRepo.name, workflow.id, selectedRepo.default_branch);
      // Wait a moment for GH to register the event
      setTimeout(() => {
         fetchWorkflowData();
         setTriggering(null);
      }, 3000);
    } catch (e) {
      alert('Failed to trigger workflow');
      setTriggering(null);
    }
  };

  const getStatusIcon = (status: string, conclusion: string | null) => {
    if (status === 'queued' || status === 'in_progress') {
        return <Loader2 className="animate-spin text-yellow-400" size={18} />;
    }
    if (conclusion === 'success') return <CheckCircle2 className="text-green-400" size={18} />;
    if (conclusion === 'failure') return <XCircle className="text-red-400" size={18} />;
    return <AlertCircle className="text-muted" size={18} />;
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-fade-in">
        <div className="flex items-center justify-between glass-panel p-4 rounded-xl">
             <div className="flex items-center gap-3">
                 <div className="p-2 bg-surface-highlight rounded-lg border border-white/5">
                     <PlayCircle className="w-5 h-5 text-accent" />
                 </div>
                 <div>
                     <h2 className="text-lg font-bold text-white tracking-tight">CI/CD Ops Center</h2>
                     <p className="text-muted text-xs font-mono">Monitor & Dispatch Actions</p>
                 </div>
             </div>
             
             <div className="flex items-center gap-3">
                 {/* Styled Select for Dark Theme */}
                 <div className="relative">
                     <select 
                       className="appearance-none bg-[#18181b] border border-white/10 rounded-lg py-2 pl-3 pr-10 text-sm text-white focus:outline-none focus:border-accent cursor-pointer min-w-[200px]"
                       value={selectedRepo?.id || ''}
                       onChange={(e) => {
                          const repo = repos.find(r => r.id === Number(e.target.value));
                          setSelectedRepo(repo || null);
                       }}
                       style={{ colorScheme: 'dark' }}
                     >
                        {repos.map(r => (
                            <option key={r.id} value={r.id} className="bg-[#18181b] text-white py-2">
                                {r.name}
                            </option>
                        ))}
                     </select>
                     <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white/50">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                     </div>
                 </div>
                 
                 <button onClick={fetchWorkflowData} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-muted hover:text-white">
                    <RefreshCw size={18} />
                 </button>
             </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
            {/* Workflows List */}
            <div className="glass-panel p-5 rounded-xl overflow-hidden flex flex-col">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-white/5 pb-2">Available Workflows</h3>
                <div className="flex-1 overflow-y-auto space-y-2 pb-20">
                    {workflows.length === 0 && !loading && (
                        <div className="text-center py-10 text-muted text-sm">No workflows found in this repo.</div>
                    )}
                    {workflows.map(wf => (
                        <div key={wf.id} className="p-3 rounded-lg bg-surface-highlight/50 border border-transparent hover:border-accent/30 flex items-center justify-between group transition-all">
                            <div className="min-w-0">
                                <div className="text-sm font-bold text-white truncate">{wf.name}</div>
                                <div className="text-[10px] text-muted font-mono">{wf.path}</div>
                            </div>
                            <button 
                                onClick={() => triggerWorkflow(wf)}
                                disabled={triggering === wf.id}
                                className="p-2 rounded bg-white/5 hover:bg-accent hover:text-white text-muted transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                title="Run Workflow"
                            >
                                {triggering === wf.id ? <Loader2 size={14} className="animate-spin" /> : <PlayCircle size={14} />}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Runs History */}
            <div className="glass-panel p-5 rounded-xl overflow-hidden flex flex-col lg:col-span-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-white/5 pb-2">Recent Activity</h3>
                <div className="flex-1 overflow-y-auto pb-20">
                    {loading ? (
                        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-accent" /></div>
                    ) : runs.length === 0 ? (
                        <div className="text-center py-20 text-muted">No recent workflow runs.</div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-surface-highlight/20 text-[10px] uppercase text-muted font-bold sticky top-0 backdrop-blur-md">
                                <tr>
                                    <th className="p-3">Status</th>
                                    <th className="p-3">Event</th>
                                    <th className="p-3">Commit</th>
                                    <th className="p-3 text-right">Duration</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {runs.map(run => (
                                    <tr key={run.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-3">
                                            <div className="flex items-center gap-3">
                                                {getStatusIcon(run.status, run.conclusion)}
                                                <div>
                                                    <div className="text-sm font-medium text-white">{run.name}</div>
                                                    <div className="text-xs text-muted flex items-center gap-1">
                                                        #{run.run_number} • <span className="capitalize">{run.event}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-2 text-xs text-gray-300">
                                                <GitBranch size={12} className="text-accent" />
                                                <span className="font-mono">{run.head_branch}</span>
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <div className="text-xs text-muted font-mono truncate max-w-[200px]">
                                                {run.display_title}
                                            </div>
                                            <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                                                {run.head_sha.substring(0, 7)}
                                            </div>
                                        </td>
                                        <td className="p-3 text-right">
                                            <div className="text-xs text-gray-400">
                                                {new Date(run.created_at).toLocaleDateString()}
                                            </div>
                                            <div className="text-[10px] text-muted">
                                                {new Date(run.created_at).toLocaleTimeString()}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default WorkflowMonitor;