import React, { useState, useEffect } from 'react';
import { GitHubService } from '../services/githubService';
import { GitHubGist } from '../types';
import { ScrollText, Plus, FileCode, Lock, Globe, Loader2, Trash2, Save, X, ArrowLeft, ExternalLink } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Editor from 'react-simple-code-editor';

interface GistManagerProps {
  service: GitHubService;
}

const GistManager: React.FC<GistManagerProps> = ({ service }) => {
  const [gists, setGists] = useState<GitHubGist[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGistId, setSelectedGistId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadGists();
  }, []);

  const loadGists = async () => {
    setLoading(true);
    try {
      const data = await service.getGists();
      setGists(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = () => {
      setIsCreating(false);
      loadGists();
  };

  if (loading && !selectedGistId && !isCreating) {
    return (
        <div className="h-full flex items-center justify-center">
            <Loader2 className="animate-spin w-8 h-8 text-accent" />
        </div>
    );
  }

  if (selectedGistId) {
      return (
        <GistEditor 
            service={service} 
            gistId={selectedGistId} 
            onBack={() => { setSelectedGistId(null); loadGists(); }} 
        />
      );
  }

  if (isCreating) {
      return (
          <GistEditor
            service={service}
            onBack={() => setIsCreating(false)}
            onSuccess={handleCreateSuccess}
          />
      );
  }

  return (
    <div className="h-full flex flex-col gap-6 animate-fade-in">
        <div className="flex items-center justify-between glass-panel p-4 rounded-xl">
             <div className="flex items-center gap-3">
                 <div className="p-2 bg-surface-highlight rounded-lg border border-white/5">
                     <ScrollText className="w-5 h-5 text-accent" />
                 </div>
                 <div>
                     <h2 className="text-lg font-bold text-white tracking-tight">My Gists</h2>
                     <p className="text-muted text-xs font-mono">{gists.length} Snippets</p>
                 </div>
             </div>
             
             <button 
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-bold shadow-lg shadow-accent/20"
             >
                 <Plus size={16} /> New Gist
             </button>
        </div>

        <div className="flex-1 overflow-y-auto pb-20">
            {gists.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted">
                    <FileCode size={48} className="text-white/10 mb-4" />
                    <p className="text-lg font-medium text-white">No gists found</p>
                    <p className="text-sm">Create one to store snippets.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {gists.map(gist => {
                        const firstFileKey = Object.keys(gist.files)[0];
                        const firstFile = gist.files[firstFileKey];
                        
                        return (
                            <div 
                                key={gist.id} 
                                onClick={() => setSelectedGistId(gist.id)}
                                className="group glass-panel p-5 rounded-xl border border-transparent hover:border-accent/40 hover:bg-surface-highlight/50 transition-all cursor-pointer flex flex-col h-48"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="p-2 rounded bg-surface-highlight group-hover:bg-accent group-hover:text-white transition-colors text-muted">
                                        <FileCode size={20} />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {gist.public ? (
                                            <Globe size={14} className="text-muted" />
                                        ) : (
                                            <Lock size={14} className="text-yellow-500" />
                                        )}
                                        <span className="text-[10px] font-mono text-muted">
                                            {new Date(gist.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-bold text-white mb-1 truncate font-mono" title={firstFile?.filename}>
                                        {firstFile?.filename || 'Untitled'}
                                    </h3>
                                    <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                                        {gist.description || 'No description provided.'}
                                    </p>
                                </div>
                                
                                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-muted">
                                    <span className="flex items-center gap-1.5">
                                        <div className={`w-2 h-2 rounded-full ${firstFile?.language ? 'bg-accent' : 'bg-gray-500'}`}></div>
                                        {firstFile?.language || 'Text'}
                                    </span>
                                    <span>{Object.keys(gist.files).length} files</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    </div>
  );
};

// --- Gist Editor Sub-Component ---

const GistEditor: React.FC<{ 
    service: GitHubService; 
    gistId?: string; 
    onBack: () => void;
    onSuccess?: () => void;
}> = ({ service, gistId, onBack, onSuccess }) => {
    const [gist, setGist] = useState<GitHubGist | null>(null);
    const [description, setDescription] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    
    // Files state: simple array of objects for editing
    const [files, setFiles] = useState<{ filename: string; content: string; originalFilename?: string }[]>([
        { filename: 'script.js', content: '// New Gist' }
    ]);
    const [activeFileIndex, setActiveFileIndex] = useState(0);

    const [loading, setLoading] = useState(!!gistId);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (gistId) {
            setLoading(true);
            service.getGist(gistId).then(data => {
                setGist(data);
                setDescription(data.description || '');
                setIsPublic(data.public);
                
                const loadedFiles = Object.values(data.files).map((f: any) => ({
                    filename: f.filename,
                    content: f.content || '',
                    originalFilename: f.filename
                }));
                setFiles(loadedFiles);
                setLoading(false);
            });
        }
    }, [gistId, service]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const filesPayload: Record<string, any> = {};
            
            files.forEach(f => {
                // If editing existing gist, we need to handle renames
                if (gistId && f.originalFilename && f.originalFilename !== f.filename) {
                    // GitHub API rename: key is old name, value has filename: new name
                    filesPayload[f.originalFilename] = {
                        filename: f.filename,
                        content: f.content
                    };
                } else {
                    filesPayload[f.filename] = { content: f.content };
                }
            });

            // Handle deletions (not implemented in UI for simplicity, but API logic here)
            // If we removed a file from the array, we'd need to send null for its key.

            if (gistId) {
                await service.updateGist(gistId, { description, files: filesPayload });
            } else {
                await service.createGist({ description, public: isPublic, files: filesPayload });
            }
            
            if (onSuccess) onSuccess();
            else onBack(); // Default back behavior

        } catch (e) {
            alert('Failed to save gist');
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!gistId || !confirm('Are you sure you want to delete this gist?')) return;
        setSaving(true);
        try {
            await service.deleteGist(gistId);
            onBack();
        } catch (e) {
            alert('Failed to delete');
        } finally {
            setSaving(false);
        }
    };

    const updateActiveFile = (key: 'filename' | 'content', value: string) => {
        const newFiles = [...files];
        newFiles[activeFileIndex] = { ...newFiles[activeFileIndex], [key]: value };
        setFiles(newFiles);
    };

    if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-accent" /></div>;

    return (
        <div className="h-full flex flex-col gap-4 animate-slide-up">
            {/* Header */}
            <div className="flex flex-col md:flex-row gap-4 p-4 glass-panel rounded-xl">
                <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-lg text-muted hover:text-white transition-colors self-start">
                    <ArrowLeft size={20} />
                </button>
                
                <div className="flex-1 space-y-3">
                    <input 
                        type="text" 
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Gist description..."
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-accent outline-none"
                    />
                    <div className="flex items-center gap-4">
                        {!gistId && (
                            <div className="flex bg-black/30 rounded-lg p-1 border border-white/10">
                                <button 
                                    onClick={() => setIsPublic(false)}
                                    className={`px-3 py-1 text-xs font-bold rounded flex items-center gap-2 ${!isPublic ? 'bg-surface-highlight text-white' : 'text-muted'}`}
                                >
                                    <Lock size={12} /> Secret
                                </button>
                                <button 
                                    onClick={() => setIsPublic(true)}
                                    className={`px-3 py-1 text-xs font-bold rounded flex items-center gap-2 ${isPublic ? 'bg-surface-highlight text-white' : 'text-muted'}`}
                                >
                                    <Globe size={12} /> Public
                                </button>
                            </div>
                        )}
                        {gistId && (
                            <span className="flex items-center gap-2 text-xs font-mono text-muted bg-white/5 px-2 py-1 rounded">
                                {gist?.public ? <Globe size={12} /> : <Lock size={12} />}
                                {gist?.public ? 'Public' : 'Secret'}
                            </span>
                        )}
                        {gist?.html_url && (
                             <a href={gist.html_url} target="_blank" rel="noreferrer" className="text-xs flex items-center gap-1 text-blue-400 hover:underline">
                                 <ExternalLink size={12} /> View on GitHub
                             </a>
                        )}
                    </div>
                </div>

                <div className="flex items-start gap-2">
                    <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg hover:bg-green-500/20 transition-all font-bold text-sm"
                    >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Save
                    </button>
                    {gistId && (
                        <button 
                            onClick={handleDelete}
                            disabled={saving}
                            className="p-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 glass-panel rounded-xl overflow-hidden flex flex-col min-h-0 border border-white/5">
                {/* File Tabs */}
                <div className="flex items-center gap-1 p-2 bg-black/20 border-b border-white/5 overflow-x-auto">
                    {files.map((file, idx) => (
                        <button
                            key={idx}
                            onClick={() => setActiveFileIndex(idx)}
                            className={`px-3 py-1.5 rounded-t-lg text-xs font-mono flex items-center gap-2 border-t border-x border-transparent transition-all ${
                                activeFileIndex === idx 
                                ? 'bg-[#1e1e1e] text-accent border-white/5 border-b-[#1e1e1e] translate-y-[1px]' 
                                : 'text-muted hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <span>{file.filename || 'Untitled'}</span>
                            {files.length > 1 && (
                                <X 
                                    size={12} 
                                    className="hover:text-red-400" 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setFiles(prev => prev.filter((_, i) => i !== idx));
                                        if (activeFileIndex >= idx && activeFileIndex > 0) setActiveFileIndex(activeFileIndex - 1);
                                    }} 
                                />
                            )}
                        </button>
                    ))}
                    <button 
                        onClick={() => {
                            setFiles([...files, { filename: `file${files.length + 1}.txt`, content: '' }]);
                            setActiveFileIndex(files.length);
                        }}
                        className="p-1 hover:bg-white/10 rounded text-muted hover:text-white ml-2"
                        title="Add File"
                    >
                        <Plus size={14} />
                    </button>
                </div>

                {/* Filename Input for Active File */}
                <div className="bg-[#1e1e1e] p-2 border-b border-white/5">
                    <input 
                        type="text" 
                        value={files[activeFileIndex].filename}
                        onChange={(e) => updateActiveFile('filename', e.target.value)}
                        className="bg-transparent text-sm font-mono text-gray-300 focus:outline-none w-full placeholder-gray-600"
                        placeholder="Filename including extension..."
                    />
                </div>

                {/* Code Editor */}
                <div className="flex-1 relative bg-[#1e1e1e] overflow-auto custom-scrollbar pb-20">
                     <Editor
                        value={files[activeFileIndex].content}
                        onValueChange={(code) => updateActiveFile('content', code)}
                        highlight={code => (
                            <SyntaxHighlighter
                                language={files[activeFileIndex].filename.split('.').pop() || 'text'}
                                style={vscDarkPlus}
                                PreTag="div"
                                CodeTag="span"
                                customStyle={{ 
                                    backgroundColor: 'transparent', 
                                    margin: 0, 
                                    padding: 0 
                                }}
                            >
                                {code}
                            </SyntaxHighlighter>
                        )}
                        padding={16}
                        className="font-mono min-h-full"
                        style={{
                            fontFamily: '"JetBrains Mono", monospace',
                            fontSize: 14,
                            backgroundColor: '#1e1e1e',
                            minHeight: '100%',
                            caretColor: 'white'
                        }}
                        textareaClassName="focus:outline-none"
                    />
                </div>
            </div>
        </div>
    );
};

export default GistManager;