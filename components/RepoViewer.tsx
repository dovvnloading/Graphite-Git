import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { GitHubRepo, GitHubFile } from '../types';
import { GitHubService } from '../services/githubService';
import { useAgent } from './AgentProvider';
import { Folder, FileCode, File, ArrowLeft, ChevronRight, Copy, Download, Loader2, Home, FileText, Image as ImageIcon, Edit2, Save, X, BrainCircuit, Eye, Code, RefreshCw, Plus, CornerUpLeft, Check, Sparkles, MessageSquarePlus, Zap, Wand2, Menu, FolderOpen, FileWarning, ShieldCheck, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Editor from 'react-simple-code-editor';

interface RepoViewerProps {
  repo: GitHubRepo;
  service: GitHubService;
  onBack: () => void;
}

const RepoViewer: React.FC<RepoViewerProps> = ({ repo, service, onBack }) => {
  // --- Navigation State (Sidebar) ---
  const [currentPath, setCurrentPath] = useState('');
  const [files, setFiles] = useState<GitHubFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  
  // --- Editor State (Main Pane) ---
  const [selectedFile, setSelectedFile] = useState<GitHubFile | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBinaryFile, setIsBinaryFile] = useState(false);

  // --- UI/Editing State ---
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false); // New: Mobile Sidebar Toggle
  
  // Copy Feedback State
  const [copied, setCopied] = useState(false);

  // --- Context Menu State ---
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; show: boolean; selection: string } | null>(null);

  // --- Agent Context ---
  const { setContextState, setPanelOpen, sendMessage, lastActionTimestamp, htmlSafetyMode } = useAgent();

  // Track the last timestamp we processed to avoid loops
  const lastProcessedTimestamp = useRef(0);

  // HTML Blob URL state
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);

  // 1. Fetch Directory Contents (Sidebar)
  const loadDirectory = useCallback(async (path: string) => {
    setLoadingFiles(true);
    try {
      const result = await service.getRepoContents(repo.owner.login, repo.name, path);
      if (Array.isArray(result)) {
        // Sort: Folders first, then files
        const sorted = result.sort((a, b) => {
           if (a.type === b.type) return a.name.localeCompare(b.name);
           return a.type === 'dir' ? -1 : 1;
        });
        setFiles(sorted);
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to load directory.');
    } finally {
      setLoadingFiles(false);
    }
  }, [repo, service]);

  // 2. Fetch File Content (Editor)
  const loadFile = useCallback(async (file: GitHubFile) => {
    setLoadingContent(true);
    setError(null);
    setIsBinaryFile(false);
    setFileContent(null);
    setEditedContent('');
    
    try {
      // We fetch the specific file to get the latest content (and SHA)
      const result = await service.getRepoContents(repo.owner.login, repo.name, file.path);
      
      // Handle single file response
      if (!Array.isArray(result)) {
         // Update selected file with latest metadata (crucial for SHA)
         setSelectedFile(result);

         // 1. Check if it is an image (handled by isImage logic in render)
         if (result.name.match(/\.(png|jpg|jpeg|gif|svg)$/i)) {
             return;
         }

         // 2. Check for known binary extensions
         const knownBinaryExts = ['.pdf', '.exe', '.bin', '.zip', '.gz', '.tar', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.mp4', '.webm', '.mp3', '.wav', '.ogg', '.apk', '.dmg', '.pkg'];
         if (knownBinaryExts.some(ext => result.name.toLowerCase().endsWith(ext))) {
             setIsBinaryFile(true);
             return;
         }
         
         if (result.content && result.encoding === 'base64') {
             try {
                // Decode base64
                const raw = window.atob(result.content.replace(/\s/g, ''));
                
                // 3. Heuristic: Check for null bytes in the first 1024 chars
                if (raw.substring(0, 1024).includes('\u0000')) {
                    setIsBinaryFile(true);
                    return;
                }

                const decoded = decodeURIComponent(escape(raw));
                setFileContent(decoded);
                setEditedContent(decoded);
             } catch (e) {
                // 4. Fallback: Decoding failed (likely binary)
                console.warn("Decoding failed, treating as binary.");
                setIsBinaryFile(true);
             }
         } else {
             // Empty file or text content (rarely GH returns text encoding directly)
             const contentStr = typeof result.content === 'string' ? result.content : '';
             setFileContent(contentStr);
             setEditedContent(contentStr);
         }
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to load file content.');
    } finally {
      setLoadingContent(false);
    }
  }, [repo, service]);

  // Initial Load & Path Changes
  useEffect(() => {
    loadDirectory(currentPath);
  }, [currentPath, loadDirectory]);

  // Auto-Refresh on Agent Action
  useEffect(() => {
      // Only run if the timestamp has actually changed and is newer than what we processed
      if (lastActionTimestamp > lastProcessedTimestamp.current) {
          lastProcessedTimestamp.current = lastActionTimestamp;
          
          // Always reload directory to show new/deleted files
          loadDirectory(currentPath);
          // If we have an open file, reload it too to show changes
          if (selectedFile) {
               loadFile(selectedFile);
          }
      }
  }, [lastActionTimestamp, currentPath, selectedFile, loadDirectory, loadFile]);

  // Update Agent Context on Navigation
  useEffect(() => {
    setContextState({
        currentRepo: repo,
        currentPath: currentPath,
        currentFile: selectedFile || undefined,
        fileContent: fileContent || undefined
    });
  }, [repo, currentPath, selectedFile, fileContent, setContextState]);

  // Handle Blob URL generation for HTML previews
  useEffect(() => {
      const isHtml = selectedFile && selectedFile.name.toLowerCase().endsWith('.html');
      
      if (isHtml && fileContent && htmlSafetyMode) {
          const blob = new Blob([fileContent], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          setPreviewBlobUrl(url);
          
          return () => {
              URL.revokeObjectURL(url);
          };
      } else {
          setPreviewBlobUrl(null);
      }
  }, [selectedFile, fileContent, htmlSafetyMode]);

  // --- Handlers ---

  const handleNavigate = (path: string) => {
      setCurrentPath(path);
      // We DO NOT clear selectedFile here, allowing the user to browse while editing
  };

  const handleFileClick = (file: GitHubFile) => {
      if (file.type === 'dir') {
          handleNavigate(file.path);
      } else {
          // Switch active file
          setSelectedFile(file);
          setIsEditing(false);
          setCommitMessage('');
          // Auto-enable preview for Markdown or HTML
          setIsPreviewMode(file.name.toLowerCase().endsWith('.md') || file.name.toLowerCase().endsWith('.html'));
          loadFile(file);
          setShowMobileSidebar(false); // Close sidebar on mobile on file select
      }
  };

  const handleSave = async () => {
    if (!selectedFile) return;
    setIsSaving(true);
    try {
      const message = commitMessage.trim() || `Update ${selectedFile.name}`;
      const response = await service.updateFile(
        repo.owner.login, 
        repo.name, 
        selectedFile.path, 
        editedContent, 
        selectedFile.sha, 
        message
      );
      
      // Update local state
      setFileContent(editedContent);
      setSelectedFile(prev => prev ? ({ ...prev, sha: response.content.sha }) : null);
      setIsEditing(false);
      setCommitMessage('');
      
      // Refresh directory in case metadata changed
      loadDirectory(currentPath);
    } catch (e: any) {
      alert(`Failed to save: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // --- Context Menu Handlers ---

  const handleContextMenu = (e: React.MouseEvent) => {
    // Disable OS context menu
    e.preventDefault();

    // Only allow if editing or viewing code (not preview, not image, not binary)
    if (isImage || isBinaryFile || (isPreviewMode && !isEditing)) return;
    if (!selectedFile) return;

    const selection = window.getSelection();
    const text = selection?.toString() || '';

    // If text is selected within our editor area
    if (text.length > 0) {
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            show: true,
            selection: text
        });
    }
  };

  const handleAgentAction = (action: 'Refactor' | 'Explain' | 'Comment' | 'Simplify') => {
      if (!contextMenu) return;

      // 1. Update Context with Selection
      setContextState({
          currentSelection: contextMenu.selection,
          currentFile: selectedFile || undefined,
          fileContent: isEditing ? editedContent : fileContent || undefined
      });

      // 2. Open Panel
      setPanelOpen(true);

      // 3. Construct Prompt
      const snippet = `\`\`\`
${contextMenu.selection}
\`\`\``;

      let prompt = "";
      
      switch(action) {
          case 'Refactor':
              prompt = `I have selected this code:\n${snippet}\n\nPlease refactor it to be cleaner. Use the 'replace_in_file' tool to update the file efficiently.`;
              break;
          case 'Explain':
              prompt = `I have selected this code:\n${snippet}\n\nPlease explain what this specific logic does in plain English.`;
              break;
          case 'Comment':
              prompt = `I have selected this code:\n${snippet}\n\nPlease add helpful JSDoc or inline comments to this selection. Use the 'replace_in_file' tool to apply the changes.`;
              break;
          case 'Simplify':
              prompt = `I have selected this code:\n${snippet}\n\nPlease simplify this logic to reduce complexity. Use 'replace_in_file' if possible.`;
              break;
      }

      // 4. Send
      sendMessage(prompt);
      setContextMenu(null);
  };

  // --- Utilities ---

  const breadcrumbs = currentPath ? currentPath.split('/') : [];
  
  const getLanguage = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const map: Record<string, string> = {
      ts: 'typescript', tsx: 'tsx', js: 'javascript', jsx: 'jsx',
      py: 'python', html: 'html', css: 'css', json: 'json',
      md: 'markdown', yml: 'yaml', yaml: 'yaml',
      xml: 'xml', sql: 'sql', java: 'java', go: 'go', rs: 'rust',
      c: 'c', cpp: 'cpp', h: 'cpp', cs: 'csharp', sh: 'bash', bash: 'bash',
      txt: 'text'
    };
    return map[ext] || 'text';
  };

  const handleCopy = async () => {
    const textToCopy = isEditing ? editedContent : fileContent;
    if (textToCopy) {
      try {
        await navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy', err);
      }
    }
  };

  const getFileIcon = (name: string, isDir: boolean) => {
      if (isDir) return <Folder size={16} className="text-accent fill-accent/10" />;
      if (name.endsWith('.tsx') || name.endsWith('.ts') || name.endsWith('.js') || name.endsWith('.jsx')) return <FileCode size={16} className="text-blue-400" />;
      if (name.endsWith('.css') || name.endsWith('.html')) return <FileCode size={16} className="text-orange-400" />;
      if (name.endsWith('.json') || name.endsWith('.yml')) return <FileCode size={16} className="text-yellow-400" />;
      if (name.endsWith('.md')) return <FileText size={16} className="text-gray-300" />;
      if (name.match(/\.(png|jpg|jpeg|gif|svg)$/)) return <ImageIcon size={16} className="text-purple-400" />;
      return <File size={16} className="text-muted" />;
  };

  const isEditable = selectedFile && !isBinaryFile && !selectedFile.name.match(/\.(png|jpg|jpeg|gif|svg|pdf|zip|exe|bin|gz|tar|ico|woff|woff2|ttf|eot|mp4|webm|mp3|wav|ogg|apk|dmg|pkg)$/i);
  const isImage = selectedFile && selectedFile.name.match(/\.(png|jpg|jpeg|gif|svg)$/i);
  const isMarkdown = selectedFile && selectedFile.name.toLowerCase().endsWith('.md');
  const isHtml = selectedFile && selectedFile.name.toLowerCase().endsWith('.html');

  // --- Render ---

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-9rem)] rounded-xl overflow-hidden glass-panel border border-white/5 animate-fade-in shadow-2xl relative">
        <style>{`
            .force-editor-font {
                font-family: "JetBrains Mono", monospace !important;
                font-size: 14px !important;
                line-height: 21px !important;
                font-variant-ligatures: none !important;
                white-space: pre !important;
                tab-size: 2 !important;
            }
            .force-editor-font * {
                font-family: inherit !important;
                font-size: inherit !important;
                line-height: inherit !important;
            }
        `}</style>

        {/* === Context Menu === */}
        {contextMenu && contextMenu.show && createPortal(
            <>
                <div className="fixed inset-0 z-[9999]" onClick={() => setContextMenu(null)} />
                <div 
                    className="fixed z-[10000] bg-[#18181b] border border-white/10 rounded-xl shadow-2xl p-1.5 flex flex-col min-w-[180px] animate-fade-in backdrop-blur-xl"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onContextMenu={(e) => e.preventDefault()}
                >
                    <div className="px-2 py-1.5 text-[10px] uppercase text-muted font-bold tracking-wider border-b border-white/5 mb-1">
                        AI Actions
                    </div>
                    <button onClick={() => handleAgentAction('Refactor')} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-left">
                        <Wand2 size={14} className="text-purple-400" /> Refactor
                    </button>
                    <button onClick={() => handleAgentAction('Explain')} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-left">
                        <Sparkles size={14} className="text-yellow-400" /> Explain
                    </button>
                    <button onClick={() => handleAgentAction('Comment')} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-left">
                        <MessageSquarePlus size={14} className="text-green-400" /> Add Comment
                    </button>
                    <button onClick={() => handleAgentAction('Simplify')} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-left">
                        <Zap size={14} className="text-blue-400" /> Simplify
                    </button>
                </div>
            </>,
            document.body
        )}

        {/* === Sidebar: File Explorer (Desktop + Mobile Drawer) === */}
        <div className={`
            fixed inset-0 z-50 bg-[#09090b] md:static md:bg-black/20 md:w-72 md:border-r md:border-white/5 flex flex-col flex-shrink-0 transition-transform duration-300
            ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
            {/* Mobile Sidebar Close Button */}
            <div className="md:hidden absolute top-4 right-4 z-[60]">
                <button onClick={() => setShowMobileSidebar(false)} className="p-2 bg-white/10 rounded-full text-white">
                    <X size={20} />
                </button>
            </div>

            {/* Repo Header */}
            <div className="p-4 border-b border-white/5 bg-white/5 flex flex-col gap-3">
                 <div className="flex items-center gap-3 pr-8 md:pr-0">
                     <button 
                        onClick={onBack} 
                        className="p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-white transition-colors"
                        title="Exit Workspace"
                     >
                        <ArrowLeft size={18} />
                     </button>
                     <div className="min-w-0">
                         <h2 className="text-sm font-bold text-white truncate">{repo.name}</h2>
                         <p className="text-muted text-[10px] font-mono truncate">@{repo.owner.login}</p>
                     </div>
                 </div>
                 
                 <button 
                    onClick={() => {
                        setPanelOpen(true);
                        setShowMobileSidebar(false);
                    }}
                    className="w-full py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
                 >
                    <BrainCircuit size={14} /> Ask Agent
                 </button>
            </div>

            {/* Navigation & Breadcrumbs */}
            <div className="p-2 border-b border-white/5 bg-[#121214] flex items-center justify-between">
                <div className="flex items-center gap-1 overflow-hidden">
                    <button 
                        onClick={() => handleNavigate('')}
                        className={`p-1 rounded hover:bg-white/5 transition-colors ${currentPath === '' ? 'text-white' : 'text-muted'}`}
                    >
                        <Home size={14} />
                    </button>
                    {breadcrumbs.map((part, i) => (
                        <React.Fragment key={i}>
                            <ChevronRight size={12} className="text-white/20 flex-shrink-0" />
                            <button 
                                onClick={() => handleNavigate(breadcrumbs.slice(0, i + 1).join('/'))}
                                className="text-xs text-muted hover:text-white truncate max-w-[80px]"
                                title={part}
                            >
                                {part}
                            </button>
                        </React.Fragment>
                    ))}
                </div>
                {currentPath && (
                    <button 
                        onClick={() => handleNavigate(breadcrumbs.slice(0, -1).join('/'))}
                        className="p-1 text-muted hover:text-white hover:bg-white/5 rounded"
                        title="Up one level"
                    >
                        <CornerUpLeft size={14} />
                    </button>
                )}
            </div>

            {/* File List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 pb-20 space-y-0.5">
                {loadingFiles ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="animate-spin text-muted w-5 h-5" />
                    </div>
                ) : files.length === 0 ? (
                    <div className="text-center py-10 text-xs text-muted italic">Empty directory</div>
                ) : (
                    files.map(file => {
                        const isActive = selectedFile?.path === file.path;
                        return (
                            <div 
                                key={file.sha + file.path}
                                onClick={() => handleFileClick(file)}
                                className={`flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-all text-sm font-medium truncate select-none
                                    ${isActive 
                                        ? 'bg-accent/10 text-accent border border-accent/20' 
                                        : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                                    }
                                `}
                            >
                                {getFileIcon(file.name, file.type === 'dir')}
                                <span className="truncate flex-1">{file.name}</span>
                            </div>
                        );
                    })
                )}
            </div>
            
            {/* Footer Stats */}
            <div className="p-2 border-t border-white/5 bg-[#09090b] text-[10px] text-muted font-mono flex justify-between px-4 pb-8 md:pb-2">
                <span>{files.length} items</span>
                <span>{repo.default_branch}</span>
            </div>
        </div>

        {/* === Main Pane: Editor === */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
            {/* Mobile Header for Sidebar Toggle */}
            <div className="md:hidden h-12 flex items-center justify-between px-4 border-b border-white/5 bg-[#121214]">
                 <div className="flex items-center gap-2">
                     <button onClick={onBack} className="text-muted hover:text-white"><ArrowLeft size={18} /></button>
                     <span className="text-sm font-bold text-white truncate max-w-[150px]">{selectedFile ? selectedFile.name : repo.name}</span>
                 </div>
                 <button 
                    onClick={() => setShowMobileSidebar(true)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-highlight border border-white/10 text-xs font-bold text-white"
                 >
                    <FolderOpen size={14} /> Files
                 </button>
            </div>

            {selectedFile ? (
                <>
                    {/* File Header (Desktop Only, merged into mobile toggle above) */}
                    <div className="hidden md:flex h-12 items-center justify-between px-4 border-b border-white/5 bg-[#18181b]">
                        <div className="flex items-center gap-3 overflow-hidden">
                             {getFileIcon(selectedFile.name, false)}
                             <span className="text-sm font-bold text-gray-200 truncate">{selectedFile.name}</span>
                             {isEditing && <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded border border-yellow-500/20">Unsaved</span>}
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Toggle Preview/Code */}
                            {(isMarkdown || isHtml) && !isEditing && (
                                <div className="flex items-center mr-2">
                                    <div className="flex bg-black/30 rounded-lg p-0.5 border border-white/10">
                                        <button
                                            onClick={() => setIsPreviewMode(false)}
                                            className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all flex items-center gap-1.5 ${!isPreviewMode ? 'bg-surface-highlight text-white shadow-sm' : 'text-muted hover:text-white'}`}
                                        >
                                            <Code size={12} /> Code
                                        </button>
                                        <button
                                            onClick={() => setIsPreviewMode(true)}
                                            className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all flex items-center gap-1.5 ${isPreviewMode ? 'bg-surface-highlight text-white shadow-sm' : 'text-muted hover:text-white'}`}
                                        >
                                            <Eye size={12} /> Preview
                                        </button>
                                    </div>
                                    {isHtml && isPreviewMode && (
                                        <div className="ml-2">
                                            {htmlSafetyMode ? (
                                                <div className="p-1 text-green-400 bg-green-500/10 rounded border border-green-500/20" title="Secure Mode: Blob URL">
                                                    <ShieldCheck size={14} />
                                                </div>
                                            ) : (
                                                <div className="p-1 text-yellow-400 bg-yellow-500/10 rounded border border-yellow-500/20" title="Unsafe Mode: srcDoc">
                                                    <AlertTriangle size={14} />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                             )}

                             {isEditable && (
                                 isEditing ? (
                                    <div className="flex items-center gap-2 animate-fade-in">
                                       <input 
                                          type="text" 
                                          placeholder="Commit message..."
                                          value={commitMessage}
                                          onChange={e => setCommitMessage(e.target.value)}
                                          className="bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:border-accent outline-none w-48"
                                       />
                                       <button 
                                          onClick={handleSave}
                                          disabled={isSaving}
                                          className="px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold disabled:opacity-50"
                                       >
                                          {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                          Save
                                       </button>
                                       <button 
                                          onClick={() => setIsEditing(false)}
                                          disabled={isSaving}
                                          className="p-1.5 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 rounded-lg transition-colors"
                                          title="Cancel"
                                       >
                                          <X size={14} />
                                       </button>
                                    </div>
                                 ) : (
                                    <button 
                                        onClick={() => { setIsEditing(true); setIsPreviewMode(false); }}
                                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-bold border border-white/5"
                                    >
                                        <Edit2 size={14} />
                                        <span>Edit</span>
                                    </button>
                                 )
                             )}

                             {/* Copy Actions */}
                             <div className="h-6 w-px bg-white/10 mx-1"></div>
                             
                             <button
                                onClick={handleCopy}
                                className="p-1.5 hover:bg-white/10 rounded-lg text-muted hover:text-white transition-colors"
                                title="Copy content"
                             >
                                {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                             </button>

                             <div className="h-6 w-px bg-white/10 mx-1"></div>

                             <a 
                                href={selectedFile.download_url || '#'} 
                                download={selectedFile.name}
                                className="p-1.5 hover:bg-white/10 rounded-lg text-muted hover:text-white transition-colors"
                                title="Download"
                             >
                                 <Download size={16} />
                             </a>
                        </div>
                    </div>

                    {/* Mobile Editor Toolbar */}
                    <div className="md:hidden h-10 bg-[#1e1e1e] border-b border-white/5 flex items-center px-4 gap-2 overflow-x-auto">
                        {isEditable && !isEditing && (
                            <button onClick={() => setIsEditing(true)} className="text-xs font-bold text-accent bg-accent/10 px-3 py-1 rounded">Edit</button>
                        )}
                        {isEditing && (
                            <>
                                <button onClick={handleSave} className="text-xs font-bold text-green-400 bg-green-400/10 px-3 py-1 rounded">Save</button>
                                <button onClick={() => setIsEditing(false)} className="text-xs font-bold text-red-400 bg-red-400/10 px-3 py-1 rounded">Cancel</button>
                            </>
                        )}
                        <button onClick={handleCopy} className="text-xs font-bold text-gray-400 bg-white/5 px-3 py-1 rounded">Copy</button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 relative overflow-hidden" onContextMenu={handleContextMenu}>
                        {loadingContent ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted">
                                <Loader2 size={32} className="animate-spin text-accent" />
                                <span className="text-xs uppercase tracking-widest">Loading content...</span>
                            </div>
                        ) : error ? (
                             <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-red-400 p-8 text-center">
                                <span className="text-sm">{error}</span>
                            </div>
                        ) : isImage ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-[#121214] p-8 overflow-auto pb-20">
                                <img src={selectedFile.download_url || ''} alt={selectedFile.name} className="max-w-full max-h-full rounded shadow-2xl border border-white/5" />
                            </div>
                        ) : isBinaryFile ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-muted p-8 text-center bg-[#121214]">
                                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                                    <FileWarning size={32} className="text-orange-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Binary File Detected</h3>
                                    <p className="text-sm mt-1 max-w-md">
                                        This file contains binary data or uses an encoding that cannot be displayed in the editor.
                                    </p>
                                </div>
                                <a 
                                    href={selectedFile?.download_url || '#'} 
                                    download={selectedFile?.name}
                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white text-sm font-bold transition-colors border border-white/5"
                                >
                                    Download File
                                </a>
                            </div>
                        ) : isEditing ? (
                             <div className="absolute inset-0 overflow-auto custom-scrollbar bg-[#1e1e1e] pb-20">
                                <Editor
                                    value={editedContent}
                                    onValueChange={setEditedContent}
                                    highlight={code => (
                                        <SyntaxHighlighter
                                            language={getLanguage(selectedFile?.name || '')}
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
                                    padding={24}
                                    className="force-editor-font min-h-full"
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
                        ) : isPreviewMode ? (
                             <div className={`absolute inset-0 ${isHtml ? 'overflow-hidden bg-[#1e1e1e]' : 'overflow-auto custom-scrollbar bg-white pb-20'}`}>
                                {isHtml ? (
                                    htmlSafetyMode && previewBlobUrl ? (
                                        <iframe
                                            src={previewBlobUrl}
                                            className="w-full h-full border-none"
                                            title="HTML Preview (Safe)"
                                            sandbox="allow-scripts allow-forms allow-popups"
                                        />
                                    ) : (
                                        <iframe
                                            srcDoc={fileContent || ''}
                                            className="w-full h-full border-none"
                                            title="HTML Preview (Unsafe)"
                                            sandbox="allow-scripts allow-forms allow-popups"
                                        />
                                    )
                                ) : (
                                    <div className="prose prose-sm max-w-none p-8 text-black bg-white min-h-full">
                                        <ReactMarkdown 
                                            rehypePlugins={[rehypeRaw]} 
                                            remarkPlugins={[remarkGfm]}
                                        >
                                            {fileContent || ''}
                                        </ReactMarkdown>
                                    </div>
                                )}
                             </div>
                        ) : (
                             <div className="absolute inset-0 overflow-auto custom-scrollbar bg-[#1e1e1e] pb-20">
                                <SyntaxHighlighter
                                    language={getLanguage(selectedFile.name)}
                                    style={vscDarkPlus}
                                    showLineNumbers={true}
                                    wrapLines={true}
                                    customStyle={{ margin: 0, padding: '1.5rem', backgroundColor: '#1e1e1e', minHeight: '100%', fontSize: '14px', lineHeight: '21px' }}
                                    lineNumberStyle={{ color: '#6e7681', minWidth: '2.5em' }}
                                >
                                    {fileContent || ''}
                                </SyntaxHighlighter>
                             </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5">
                        <FolderOpen size={40} className="opacity-20" />
                    </div>
                    <p className="text-sm">Select a file to view or edit</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default RepoViewer;