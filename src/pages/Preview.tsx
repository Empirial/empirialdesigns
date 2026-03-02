import { useState, useEffect, useCallback, CSSProperties } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Send, 
  LogOut, 
  RefreshCw, 
  ExternalLink, 
  ArrowLeft, 
  Crosshair, 
  FolderOpen,
  X,
  FileCode,
  Loader2,
  Check
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import type { User } from '@supabase/supabase-js';

const SUPABASE_URL = "https://vfysnkkzesbovtnmoccb.supabase.co";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  commitUrl?: string;
}

interface Repo {
  id: string;
  repo_owner: string;
  repo_name: string;
  repo_url: string;
  deploy_url?: string;
  github_token?: string;
}

interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'dir';
  children?: FileItem[];
}

const Preview = () => {
  const { repoId } = useParams<{ repoId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Core state
  const [user, setUser] = useState<User | null>(null);
  const [repo, setRepo] = useState<Repo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  // Visual Inspector state
  const [inspectorActive, setInspectorActive] = useState(false);
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null);
  const [highlightStyle, setHighlightStyle] = useState<CSSProperties>({});
  const [selectedComponent, setSelectedComponent] = useState<string>('');

  // File Selector state
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [filesLoaded, setFilesLoaded] = useState(false);

  // Auth and repo loading
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        loadRepo(session.user.id);
      } else {
        navigate('/auth');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, repoId]);

  const loadRepo = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_repos')
      .select('*')
      .eq('id', repoId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      toast({
        title: "Error",
        description: "Repository not found",
        variant: "destructive",
      });
      navigate('/repos');
      return;
    }

    setRepo(data);
  };

  // Load files when repo is available
  useEffect(() => {
    if (repo && !filesLoaded) {
      loadFiles();
    }
  }, [repo, filesLoaded]);

  const loadFiles = async () => {
    if (!repo?.github_token) {
      console.log('No GitHub token available');
      return;
    }

    setLoadingFiles(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(`${SUPABASE_URL}/functions/v1/github-repo-contents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          owner: repo.repo_owner,
          repo: repo.repo_name,
          token: repo.github_token,
          path: '',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to load files');
      }

      const data = await response.json();
      
      // Transform GitHub API response to FileItem format
      const transformedFiles: FileItem[] = Array.isArray(data) 
        ? data.map((item: any) => ({
            name: item.name,
            path: item.path,
            type: item.type === 'dir' ? 'dir' : 'file',
          }))
        : [];

      setFiles(transformedFiles);
      setFilesLoaded(true);
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const refreshPreview = () => {
    setIframeKey(prev => prev + 1);
    toast({
      title: "Preview refreshed",
      description: "Loading latest changes...",
    });
  };

  // Visual Inspector Functions
  const getElementInfo = useCallback((element: HTMLElement) => {
    const tag = element.tagName.toLowerCase();
    const classes = Array.from(element.classList).slice(0, 3).join('.');
    const id = element.id ? `#${element.id}` : '';
    const textContent = element.textContent?.slice(0, 30)?.trim() || '';
    
    // Try to infer component name from data attributes or class patterns
    let componentName = '';
    if (element.dataset.component) {
      componentName = element.dataset.component;
    } else if (classes.includes('btn') || tag === 'button') {
      componentName = 'Button';
    } else if (tag === 'input' || tag === 'textarea') {
      componentName = 'Input';
    } else if (tag === 'nav') {
      componentName = 'Navigation';
    } else if (tag === 'header') {
      componentName = 'Header';
    } else if (tag === 'footer') {
      componentName = 'Footer';
    } else if (classes.includes('card')) {
      componentName = 'Card';
    }

    return {
      tag,
      classes: classes ? `.${classes}` : '',
      id,
      textContent,
      componentName,
      fullSelector: `${tag}${id}${classes ? '.' + classes : ''}`
    };
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!inspectorActive) return;
    
    const iframe = document.querySelector('iframe');
    if (!iframe) return;

    const iframeRect = iframe.getBoundingClientRect();
    
    // Check if mouse is over the overlay area (which covers the iframe)
    const overlayElement = document.querySelector('[data-inspector-overlay]');
    if (!overlayElement) return;
    
    const overlayRect = overlayElement.getBoundingClientRect();
    
    if (
      e.clientX >= overlayRect.left &&
      e.clientX <= overlayRect.right &&
      e.clientY >= overlayRect.top &&
      e.clientY <= overlayRect.bottom
    ) {
      // Calculate position relative to iframe
      const relX = e.clientX - iframeRect.left;
      const relY = e.clientY - iframeRect.top;
      
      // Create a highlight box at cursor position (simulated)
      setHighlightStyle({
        position: 'absolute',
        left: `${e.clientX - overlayRect.left - 50}px`,
        top: `${e.clientY - overlayRect.top - 25}px`,
        width: '100px',
        height: '50px',
        border: '2px solid hsl(var(--primary))',
        backgroundColor: 'hsl(var(--primary) / 0.1)',
        pointerEvents: 'none',
        borderRadius: '4px',
        zIndex: 9999,
      });
    }
  }, [inspectorActive]);

  const handleInspectorClick = useCallback((e: MouseEvent) => {
    if (!inspectorActive) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Since we can't access iframe content directly due to cross-origin,
    // we capture the click position and create a description
    const iframe = document.querySelector('iframe');
    if (!iframe) return;

    const iframeRect = iframe.getBoundingClientRect();
    const relX = e.clientX - iframeRect.left;
    const relY = e.clientY - iframeRect.top;
    
    // Calculate percentage position for better description
    const xPercent = Math.round((relX / iframeRect.width) * 100);
    const yPercent = Math.round((relY / iframeRect.height) * 100);
    
    let location = '';
    if (yPercent < 15) location = 'header/navigation area';
    else if (yPercent > 85) location = 'footer area';
    else if (xPercent < 25) location = 'left sidebar area';
    else if (xPercent > 75) location = 'right sidebar area';
    else location = 'main content area';
    
    const description = `Element at ${location} (${xPercent}% from left, ${yPercent}% from top)`;
    
    setSelectedComponent(description);
    setInspectorActive(false);
    setHighlightStyle({});
    
    toast({
      title: "Element selected",
      description: description,
    });
  }, [inspectorActive, toast]);

  // Inspector event listeners
  useEffect(() => {
    if (inspectorActive) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('click', handleInspectorClick, true);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('click', handleInspectorClick, true);
      };
    }
  }, [inspectorActive, handleMouseMove, handleInspectorClick]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + I to toggle inspector
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        setInspectorActive(prev => !prev);
      }
      // Escape to cancel inspector
      if (e.key === 'Escape' && inspectorActive) {
        setInspectorActive(false);
        setHighlightStyle({});
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [inspectorActive]);

  const toggleFileSelection = (filePath: string) => {
    setSelectedFiles(prev => 
      prev.includes(filePath)
        ? prev.filter(f => f !== filePath)
        : [...prev, filePath]
    );
  };

  const clearAllSelections = () => {
    setSelectedFiles([]);
    setSelectedComponent('');
  };

  const handleSend = async () => {
    if (!input.trim() || !repo) return;

    // Build context message
    let contextPrefix = '';
    if (selectedFiles.length > 0 || selectedComponent) {
      contextPrefix = '[Context: ';
      if (selectedFiles.length > 0) {
        contextPrefix += `Files: ${selectedFiles.join(', ')}`;
      }
      if (selectedComponent) {
        if (selectedFiles.length > 0) contextPrefix += '; ';
        contextPrefix += `Selected: ${selectedComponent}`;
      }
      contextPrefix += ']\n\n';
    }

    const fullMessage = contextPrefix + input;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input, // Show original input in UI
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Clear selections after sending
    setSelectedFiles([]);
    setSelectedComponent('');

    try {
      const CHAT_URL = `${SUPABASE_URL}/functions/v1/ai-chat`;
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          messages: [
            ...messages.map(m => ({ role: m.role, content: m.content })), 
            { role: 'user', content: fullMessage } // Send with context
          ],
          repoOwner: repo.repo_owner,
          repoName: repo.repo_name,
          repoId: repo.id,
          selectedFiles: selectedFiles.length > 0 ? selectedFiles : undefined,
        }),
      });

      if (!response.ok) {
        let message = 'Failed to get AI response';
        try {
          const text = await response.text();
          try {
            const json = JSON.parse(text);
            message = json.error || message;
          } catch {
            message = text || message;
          }
        } catch {}
        throw new Error(message);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let textBuffer = '';
      let streamDone = false;
      let commitUrl = '';

      const assistantId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      }]);

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => prev.map(m => 
                m.id === assistantId ? { ...m, content: assistantContent } : m
              ));
            }
            
            if (parsed.commit_url) {
              commitUrl = parsed.commit_url;
            }
          } catch (e) {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      if (commitUrl) {
        setMessages(prev => prev.map(m => 
          m.id === assistantId ? { ...m, commitUrl } : m
        ));
        
        setTimeout(() => refreshPreview(), 2000);
      }

      setLoading(false);
    } catch (error: any) {
      console.error('Chat error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to get AI response",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  if (!user || !repo) {
    return null;
  }

  const previewUrl = repo.deploy_url || `https://${repo.repo_name}.netlify.app`;
  const hasSelections = selectedFiles.length > 0 || selectedComponent;

  return (
    <div className="h-screen flex bg-background">
      {/* Chat Sidebar */}
      <div className="w-96 border-r border-border bg-muted/20 flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/repos')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
          <div>
            <h2 className="font-bold text-lg truncate">{repo.repo_name}</h2>
            <p className="text-sm text-muted-foreground truncate">{repo.repo_owner}</p>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">
                  Ask me to make changes to your site
                </p>
                <p className="text-muted-foreground text-xs mt-2">
                  Use the inspector (⌘I) to select elements
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted border border-border'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    {message.commitUrl && (
                      <a
                        href={message.commitUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1 mt-2"
                      >
                        View commit <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-muted border border-border">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Selected Context Badges */}
        {hasSelections && (
          <div className="px-4 py-2 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Context:</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllSelections}
                className="h-6 px-2 text-xs"
              >
                Clear all
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {selectedFiles.map(file => (
                <Badge
                  key={file}
                  variant="secondary"
                  className="text-xs flex items-center gap-1"
                >
                  <FileCode className="h-3 w-3" />
                  {file.split('/').pop()}
                  <button
                    onClick={() => toggleFileSelection(file)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {selectedComponent && (
                <Badge
                  variant="outline"
                  className="text-xs flex items-center gap-1 border-primary"
                >
                  <Crosshair className="h-3 w-3" />
                  Element
                  <button
                    onClick={() => setSelectedComponent('')}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-border p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="space-y-3"
          >
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {/* File Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={`rounded-full ${selectedFiles.length > 0 ? 'border-primary' : ''}`}
                    disabled={loadingFiles}
                  >
                    {loadingFiles ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FolderOpen className="h-4 w-4" />
                    )}
                    <span className="ml-2">Files</span>
                    {selectedFiles.length > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                        {selectedFiles.length}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 max-h-80 overflow-auto">
                  <DropdownMenuLabel>Select files for context</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {files.length === 0 ? (
                    <div className="py-4 text-center text-sm text-muted-foreground">
                      {loadingFiles ? 'Loading files...' : 'No files available'}
                    </div>
                  ) : (
                    files.filter(f => f.type === 'file').map(file => (
                      <DropdownMenuCheckboxItem
                        key={file.path}
                        checked={selectedFiles.includes(file.path)}
                        onCheckedChange={() => toggleFileSelection(file.path)}
                      >
                        <FileCode className="h-4 w-4 mr-2 text-muted-foreground" />
                        {file.name}
                      </DropdownMenuCheckboxItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Inspector Toggle */}
              <Button
                type="button"
                variant={inspectorActive ? "default" : "outline"}
                size="sm"
                onClick={() => setInspectorActive(!inspectorActive)}
                className={`rounded-full ${selectedComponent ? 'border-primary' : ''}`}
                title="Toggle Visual Inspector (⌘I)"
              >
                <Crosshair className="h-4 w-4" />
                <span className="ml-2">Inspect</span>
                {selectedComponent && (
                  <Check className="h-4 w-4 ml-1 text-green-500" />
                )}
              </Button>
            </div>

            {/* Text Input */}
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={hasSelections ? "Describe changes to selected..." : "Describe changes..."}
                className="flex-1 rounded-full"
                disabled={loading}
              />
              <Button
                type="submit"
                size="icon"
                className="rounded-full"
                disabled={loading || !input.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 flex flex-col relative">
        <div className="h-16 border-b border-border flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">Live Preview</h1>
            {inspectorActive && (
              <Badge variant="default" className="animate-pulse">
                Inspector Active - Click to select
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshPreview}
              className="rounded-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(previewUrl, '_blank')}
              className="rounded-full"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open
            </Button>
          </div>
        </div>

        <div className="flex-1 bg-muted/20 relative">
          <iframe
            key={iframeKey}
            src={previewUrl}
            className="w-full h-full border-0"
            title="Site Preview"
          />
          
          {/* Inspector Overlay */}
          {inspectorActive && (
            <div 
              data-inspector-overlay
              className="absolute inset-0 cursor-crosshair"
              style={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
            >
              {/* Highlight Box */}
              <div style={highlightStyle} />
              
              {/* Instructions Tooltip */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background border border-border rounded-lg px-4 py-2 shadow-lg">
                <p className="text-sm text-muted-foreground">
                  Click on an element to select it • Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Esc</kbd> to cancel
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Preview;
