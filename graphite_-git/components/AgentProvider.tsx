import React, { createContext, useContext, useState, useEffect } from 'react';
import { AgentContextType, AgentContextState, ChatMessage, ToolCall, AgentContextSettings } from '../types';
import { GeminiService } from '../services/geminiService';
import { GitHubService } from '../services/githubService';

const AgentContext = createContext<AgentContextType | null>(null);

export const useAgent = () => {
  const context = useContext(AgentContext);
  if (!context) throw new Error('useAgent must be used within AgentProvider');
  return context;
};

export const AgentProvider: React.FC<{ children: React.ReactNode; service: GitHubService | null }> = ({ children, service }) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [contextState, setContextStateInternal] = useState<AgentContextState>({ activeTab: 'dashboard' });
  
  // New: Context Control Settings
  const [contextSettings, setContextSettingsInternal] = useState<AgentContextSettings>({
      includeRepoMap: true,
      includeFileContent: true,
      includeSelection: true
  });

  const [pendingToolCall, setPendingToolCall] = useState<ToolCall | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [isPanelOpen, setPanelOpen] = useState(false);
  const [lastActionTimestamp, setLastActionTimestamp] = useState(0);
  const [selectedModel, setSelectedModelInternal] = useState(localStorage.getItem('agent_model') || 'gemini-3-pro-preview');
  
  // Security Setting: HTML Preview Mode (Default: True/Safe)
  const [htmlSafetyMode, setHtmlSafetyModeInternal] = useState(localStorage.getItem('html_safety_mode') !== 'false');
  
  // API Key Management
  const [geminiApiKey, setGeminiApiKeyInternal] = useState(localStorage.getItem('gemini_api_key') || '');
  const [gemini, setGemini] = useState<GeminiService | null>(null);

  useEffect(() => {
    if (geminiApiKey) {
      setGemini(new GeminiService(geminiApiKey));
    } else {
      // Fallback to env if available, or null
      if (process.env.API_KEY) {
           setGemini(new GeminiService(process.env.API_KEY));
      } else {
           setGemini(null);
      }
    }
  }, [geminiApiKey]);

  const setGeminiApiKey = (key: string) => {
      setGeminiApiKeyInternal(key);
      localStorage.setItem('gemini_api_key', key);
  };

  const setSelectedModel = (model: string) => {
    setSelectedModelInternal(model);
    localStorage.setItem('agent_model', model);
  };

  const setHtmlSafetyMode = (enabled: boolean) => {
    setHtmlSafetyModeInternal(enabled);
    localStorage.setItem('html_safety_mode', String(enabled));
  };

  const setContextState = (newState: Partial<AgentContextState>) => {
    setContextStateInternal(prev => ({ ...prev, ...newState }));
  };

  const setContextSettings = (settings: Partial<AgentContextSettings>) => {
    setContextSettingsInternal(prev => ({ ...prev, ...settings }));
  };

  const enableAgent = () => setIsEnabled(true);

  const getGeminiHistory = (msgs: ChatMessage[]) => {
    return msgs.map(m => {
        if (m.role === 'user') {
            return { role: 'user', parts: [{ text: m.text || '' }] };
        }
        if (m.role === 'model') {
            const parts: any[] = [];
            if (m.text) parts.push({ text: m.text });
            if (m.toolCalls) {
                m.toolCalls.forEach(tc => {
                    parts.push({
                        functionCall: {
                            name: tc.name,
                            args: tc.args
                        }
                    });
                });
            }
            return { role: 'model', parts };
        }
        if (m.role === 'function' && m.toolResponse) {
             return {
                 role: 'user',
                 parts: [{
                     functionResponse: {
                         name: m.toolResponse.name,
                         response: m.toolResponse.response
                     }
                 }]
             };
        }
        return { role: 'user', parts: [{ text: m.text || '' }] };
    });
  };

  // Helper to construct context based on user settings
  const getFilteredContext = () => {
      const ctx: any = { activeTab: contextState.activeTab };
      
      if (contextSettings.includeRepoMap) {
          ctx.currentRepo = contextState.currentRepo;
          ctx.currentPath = contextState.currentPath;
      }
      
      if (contextSettings.includeFileContent) {
          ctx.currentFile = contextState.currentFile;
          ctx.fileContent = contextState.fileContent;
      }
      
      if (contextSettings.includeSelection) {
          ctx.currentSelection = contextState.currentSelection;
      }
      
      return ctx;
  };

  const sendMessage = async (text: string) => {
    if (!isEnabled || !service) return;

    if (!gemini) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', text: 'Error: Gemini API Key not configured. Please add it in Settings > Intelligence Engine.', timestamp: Date.now() }]);
        return;
    }

    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: Date.now()
    };
    
    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    setIsThinking(true);

    try {
        const history = getGeminiHistory(updatedMessages);
        
        // Use the filtered context
        const filteredContext = getFilteredContext();
        
        const response = await gemini.generateResponse(history, "", filteredContext, selectedModel);
        
        processModelResponse(response);

    } catch (e: any) {
        console.error(e);
        const errorMsg = e.message || JSON.stringify(e);
        setMessages(prev => [...prev, { 
            id: Date.now().toString(), 
            role: 'system', 
            text: `DEBUG ERROR: ${errorMsg}`, 
            timestamp: Date.now() 
        }]);
        setIsThinking(false);
    }
  };

  const processModelResponse = (response: any) => {
    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
        const content = candidates[0].content;
        const parts = content.parts;
        
        let modelText = "";
        let tools: ToolCall[] = [];

        for (const part of parts) {
            if (part.text) modelText += part.text;
            if (part.functionCall) {
                tools.push({
                    id: Date.now().toString() + Math.random(),
                    name: part.functionCall.name,
                    args: part.functionCall.args,
                    status: 'pending'
                });
            }
        }

        const newModelMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: modelText,
            timestamp: Date.now(),
            toolCalls: tools.length > 0 ? tools : undefined
        };

        setMessages(prev => [...prev, newModelMsg]);

        if (tools.length > 0) {
            setPendingToolCall(tools[0]);
        }
        setIsThinking(false);
    } else {
        setIsThinking(false);
    }
  };

  const executeTool = async (tool: ToolCall) => {
      if (!service) return { result: "Error: No GitHub service connection." };
      
      const { name, args } = tool;
      let result = '';

      // Infer context if missing
      const owner = args.owner || contextState.currentRepo?.owner.login;
      const repo = args.repo || contextState.currentRepo?.name;
      const path = args.path || contextState.currentPath || '';

      if (!owner || !repo) {
          return { result: "Error: Context (owner/repo) is missing and not provided." };
      }

      try {
          switch (name) {
              case 'list_files':
                  const files = await service.getRepoContents(owner, repo, path);
                  result = JSON.stringify(files);
                  break;
              case 'read_file':
                  const file = await service.getRepoContents(owner, repo, path);
                  // @ts-ignore
                  if (file.content) {
                      // @ts-ignore
                       result = decodeURIComponent(escape(window.atob(file.content.replace(/\s/g, ''))));
                  } else {
                      result = "File is empty or a directory.";
                  }
                  break;
              case 'create_or_update_file': {
                  // Check if file exists to get SHA for update
                  let sha = undefined;
                  try {
                      // @ts-ignore
                      const existing = await service.getRepoContents(owner, repo, path);
                      // @ts-ignore
                      if (existing && existing.sha) sha = existing.sha;
                  } catch (e) { /* ignore, it's a create */ }
                  
                  await service.updateFile(owner, repo, path, args.content, sha, args.message);
                  result = "Success: File created/updated.";
                  // CRITICAL: Trigger refresh
                  setLastActionTimestamp(Date.now());
                  break;
              }
              case 'replace_in_file': {
                  // 1. Read file
                  const fileObj = await service.getRepoContents(owner, repo, path);
                  // @ts-ignore
                  if (!fileObj.content) throw new Error("File is empty or not found");
                  
                  // @ts-ignore
                  const currentContent = decodeURIComponent(escape(window.atob(fileObj.content.replace(/\s/g, ''))));
                  
                  // 2. Perform replacement
                  // Use simple string replace. The AI should provide the exact block to replace.
                  // We use replaceAll to be safe if the selection appears multiple times, 
                  // but ideally the AI should provide enough context in the search string.
                  if (!currentContent.includes(args.search)) {
                      throw new Error("Could not find the 'search' text in the file. Ensure the search block matches the file content exactly.");
                  }
                  
                  const newContent = currentContent.replace(args.search, args.replace);
                  
                  // 3. Update file
                  // @ts-ignore
                  await service.updateFile(owner, repo, path, newContent, fileObj.sha, args.message);
                  result = "Success: Content replaced.";
                  setLastActionTimestamp(Date.now());
                  break;
              }
              case 'delete_file':
                  await service.deleteFile(owner, repo, path, args.message);
                  result = "Success: File deleted.";
                  // CRITICAL: Trigger refresh
                  setLastActionTimestamp(Date.now());
                  break;
              default:
                  result = "Error: Unknown tool.";
          }
      } catch (e: any) {
          result = `Error: ${e.message}`;
      }
      return { result };
  };

  const approveToolCall = async () => {
    if (!pendingToolCall) return;
    if (!gemini) return;
    
    // 1. Mark as executed in UI
    setMessages(prev => {
        const last = prev[prev.length - 1];
        if (!last || !last.toolCalls) return prev;
        const updatedTools = last.toolCalls.map(t => t.id === pendingToolCall.id ? { ...t, status: 'executed' as const } : t);
        // @ts-ignore
        return [...prev.slice(0, -1), { ...last, toolCalls: updatedTools }];
    });

    setPendingToolCall(null);
    setIsThinking(true);

    // 2. Execute
    const { result } = await executeTool(pendingToolCall);

    // 3. Add Function Response to History
    const functionResponseMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'function',
        timestamp: Date.now(),
        toolResponse: {
            name: pendingToolCall.name,
            response: { result }
        }
    };

    const updatedMessages = [...messages, functionResponseMsg];
    setMessages(updatedMessages);

    // 4. Send back to model to get final confirmation text
    try {
        const history = getGeminiHistory(updatedMessages);
        
        // Also use filtered context for tool confirmation response
        const filteredContext = getFilteredContext();
        
        const response = await gemini.generateResponse(history, "", filteredContext, selectedModel);
        processModelResponse(response);
    } catch(e: any) { 
        console.error(e);
        const errorMsg = e.message || JSON.stringify(e);
        setMessages(prev => [...prev, { 
            id: Date.now().toString(), 
            role: 'system', 
            text: `DEBUG ERROR: ${errorMsg}`, 
            timestamp: Date.now() 
        }]);
        setIsThinking(false);
    }
  };

  const rejectToolCall = () => {
     setPendingToolCall(null);
     setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', text: 'Tool execution cancelled by user.', timestamp: Date.now() }]);
  };

  return (
    <AgentContext.Provider value={{
      isEnabled,
      enableAgent,
      messages,
      sendMessage,
      contextState,
      setContextState,
      contextSettings,
      setContextSettings,
      pendingToolCall,
      approveToolCall,
      rejectToolCall,
      isThinking,
      isPanelOpen,
      setPanelOpen,
      lastActionTimestamp,
      selectedModel,
      setSelectedModel,
      htmlSafetyMode,
      setHtmlSafetyMode,
      geminiApiKey,
      setGeminiApiKey
    }}>
      {children}
    </AgentContext.Provider>
  );
};