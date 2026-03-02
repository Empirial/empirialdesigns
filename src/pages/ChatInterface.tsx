import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Send, FileCode, GitCommit, Loader2, File, X, Menu, Target, Crosshair, Eye } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useConversations } from "@/hooks/useConversations";

interface ToolCall {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'complete' | 'error';
  input?: any;
  output?: any;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolCalls?: ToolCall[];
  commitUrl?: string;
}

interface Repo {
  id: string;
  repo_owner: string;
  repo_name: string;
  github_token: string | null;
}

interface FileItem {
  type: 'file' | 'dir';
  path: string;
  name: string;
  size?: number;
}

const ChatInterface = () => {
  const [user, setUser] = useState<User | null>(null);
  const [repo, setRepo] = useState<Repo | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [repoFiles, setRepoFiles] = useState<FileItem[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<string>('');
  const [inspectorActive, setInspectorActive] = useState(false);
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null);
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({});
  const navigate = useNavigate();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    conversations,
    currentConversationId,
    messages,
    setMessages,
    setCurrentConversationId,
    createConversation,
    saveMessage,
    deleteConversation,
  } = useConversations(user?.id, repo?.id);

  // Fetch repository files
  const fetchRepoFiles = async (repoData: Repo) => {
    setLoadingFiles(true);
    try {
      const { data, error } = await supabase.functions.invoke('github-repo-contents', {
        body: {
          owner: repoData.repo_owner,
          repo: repoData.repo_name,
          path: '',
        },
      });

      if (error) throw error;

      if (Array.isArray(data)) {
        const files = data
          .filter((item: any) => item.type === 'file' || item.type === 'dir')
          .map((item: any) => ({
            type: item.type,
            path: item.path,
            name: item.name,
            size: item.size,
          }));
        setRepoFiles(files);
      }
    } catch (error: any) {
      console.error('Failed to fetch files:', error);
      toast({
        title: "Failed to load files",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    // Check authentication and load repo
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        
        // Fetch user's repository
        const { data: repoData, error } = await supabase
          .from('user_repos')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (!error && repoData) {
          setRepo(repoData);
          fetchRepoFiles(repoData);
        }
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
  }, [navigate]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Auto-create first conversation if none exists
  useEffect(() => {
    if (user && conversations.length === 0 && !currentConversationId) {
      createConversation();
    }
  }, [user, conversations, currentConversationId]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You've been successfully signed out.",
    });
    navigate('/');
  };

  const handleNewConversation = async () => {
    await createConversation();
  };

  // Visual Inspector Logic
  const getElementInfo = useCallback((element: HTMLElement) => {
    const tag = element.tagName.toLowerCase();
    const classes = Array.from(element.classList);
    const id = element.id || undefined;
    const text = element.textContent?.slice(0, 50) || undefined;
    
    let component = element.getAttribute('data-component');
    if (!component) {
      const componentClasses = classes.find(c => 
        c.includes('Hero') || c.includes('Navigation') || c.includes('Footer') || 
        c.includes('Sidebar') || c.includes('Contact') || c.includes('About') ||
        c.includes('Services') || c.includes('Portfolio') || c.includes('Testimonials') ||
        c.includes('Pricing') || c.includes('FAQ') || c.includes('Blog') || c.includes('CTA')
      );
      component = componentClasses;
    }
    
    return { tag, classes, id, text, component };
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!inspectorActive) return;
    
    const elements = document.elementsFromPoint(e.clientX, e.clientY);
    const targetElement = elements.find(el => 
      !el.closest('.visual-inspector-overlay') && 
      !el.closest('.visual-inspector-controls')
    ) as HTMLElement;
    
    if (!targetElement || targetElement === hoveredElement) return;
    
    setHoveredElement(targetElement);
    
    const rect = targetElement.getBoundingClientRect();
    setHighlightStyle({
      position: 'fixed',
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      pointerEvents: 'none',
      transition: 'all 0.1s ease',
    });
  }, [inspectorActive, hoveredElement]);

  const handleInspectorClick = useCallback((e: MouseEvent) => {
    if (!inspectorActive || !hoveredElement) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const elementInfo = getElementInfo(hoveredElement);
    let description = '';
    
    if (elementInfo.component) {
      description = elementInfo.component;
    } else if (elementInfo.id) {
      description = `#${elementInfo.id}`;
    } else if (elementInfo.classes.length > 0) {
      const meaningfulClasses = elementInfo.classes.filter(c => 
        !c.startsWith('text-') && 
        !c.startsWith('bg-') && 
        !c.startsWith('p-') && 
        !c.startsWith('m-') &&
        !c.startsWith('w-') &&
        !c.startsWith('h-') &&
        !c.startsWith('flex') &&
        !c.startsWith('grid')
      );
      description = meaningfulClasses.join(' ') || elementInfo.tag;
    } else {
      description = `${elementInfo.tag} element`;
    }
    
    if (elementInfo.text) {
      description += ` ("${elementInfo.text}")`;
    }
    
    setSelectedComponent(description);
    setInspectorActive(false);
    toast({
      title: "Element selected",
      description: `Selected: ${description}`,
    });
  }, [inspectorActive, hoveredElement, getElementInfo, toast]);

  useEffect(() => {
    if (!inspectorActive) {
      setHoveredElement(null);
      return;
    }

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleInspectorClick, true);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleInspectorClick, true);
    };
  }, [inspectorActive, handleMouseMove, handleInspectorClick]);

  const handleSend = async () => {
    if (!input.trim()) return;
    if (!currentConversationId) {
      toast({
        title: "No conversation",
        description: "Please start a new conversation first.",
        variant: "destructive",
      });
      return;
    }

    // Build context message if files or component are selected
    let contextMessage = input;
    const contextParts: string[] = [];
    
    if (selectedFiles.length > 0) {
      contextParts.push(`Files to edit: ${selectedFiles.join(', ')}`);
    }
    if (selectedComponent) {
      contextParts.push(`Component/Section to edit: ${selectedComponent}`);
    }
    
    if (contextParts.length > 0) {
      contextMessage = `Context: ${contextParts.join(' | ')}\n\nRequest: ${input}`;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSelectedFiles([]);
    setSelectedComponent('');
    setLoading(true);

    // Save user message
    await saveMessage(userMessage);

    try {
      const CHAT_URL = `https://vfysnkkzesbovtnmoccb.supabase.co/functions/v1/ai-chat`;
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
          messages: [...messages.map(m => ({ role: m.role, content: m.content })).filter(m => m.role !== 'assistant' || m.content), { role: 'user', content: contextMessage }],
          repoOwner: repo?.repo_owner,
          repoName: repo?.repo_name,
          repoId: repo?.id,
          selectedFiles: selectedFiles.length > 0 ? selectedFiles : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get AI response');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let textBuffer = '';
      let streamDone = false;
      const toolCalls: ToolCall[] = [];
      let commitUrl = '';

      // Create initial assistant message
      const assistantId = (Date.now() + 1).toString();
      const assistantMessage: Message = {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        toolCalls: [],
      };
      setMessages(prev => [...prev, assistantMessage]);

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
            
            // Handle tool calls
            if (parsed.type === 'tool_call') {
              const toolCall: ToolCall = {
                id: parsed.id || `tool_${Date.now()}`,
                name: parsed.name,
                status: parsed.status || 'running',
                input: parsed.input,
                output: parsed.output,
              };
              toolCalls.push(toolCall);
              setMessages(prev => prev.map(m => 
                m.id === assistantId ? { ...m, toolCalls: [...(m.toolCalls || []), toolCall] } : m
              ));
            }
            
            // Handle commit URL
            if (parsed.type === 'commit') {
              commitUrl = parsed.url;
              setMessages(prev => prev.map(m => 
                m.id === assistantId ? { ...m, commitUrl } : m
              ));
            }
            
            // Handle regular content
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => prev.map(m => 
                m.id === assistantId ? { ...m, content: assistantContent } : m
              ));
            }
          } catch (e) {
            // Incomplete JSON, put it back
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Save complete assistant message
      await saveMessage({
        role: 'assistant',
        content: assistantContent,
        toolCalls,
        commitUrl: commitUrl || undefined,
      });

      setLoading(false);

      if (commitUrl) {
        toast({
          title: "Code committed!",
          description: "Your changes have been pushed to GitHub",
        });
      }
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

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      {/* Visual Inspector Overlay */}
      {inspectorActive && (
        <>
          <div 
            className="fixed inset-0 bg-primary/5 backdrop-blur-[1px] z-[9998]"
            style={{ pointerEvents: 'none' }}
          />
          
          {hoveredElement && (
            <div
              style={highlightStyle}
              className="border-2 border-primary bg-primary/10 z-[9999] rounded"
            />
          )}
          
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[10000] flex items-center gap-3 bg-background border-2 border-primary rounded-full px-6 py-3 shadow-2xl">
            <Eye className="h-5 w-5 text-primary animate-pulse" />
            <span className="text-sm font-medium">Click any element to select it</span>
            {hoveredElement && (
              <Badge variant="secondary" className="ml-2">
                {getElementInfo(hoveredElement).component || getElementInfo(hoveredElement).tag}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setInspectorActive(false)}
              className="h-8 w-8 rounded-full ml-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}

      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar
          user={user}
          conversations={conversations}
          currentConversationId={currentConversationId}
          onNewConversation={handleNewConversation}
          onSelectConversation={setCurrentConversationId}
          onDeleteConversation={deleteConversation}
          onSignOut={handleSignOut}
        />

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="h-16 border-b border-border flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div>
                <h1 className="text-xl font-bold text-gradient">Empirial AI Assistant</h1>
                {repo && (
                  <p className="text-xs text-muted-foreground">
                    Connected to: {repo.repo_owner}/{repo.repo_name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-6">
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold text-gradient mb-4">
                    Welcome to Empirial AI
                  </h2>
                  <p className="text-muted-foreground">
                    {repo 
                      ? "I'm ready to help with your repository!" 
                      : "Please connect a repository to get started."}
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-6 py-4 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground elegant-shadow'
                          : 'bg-muted/50 border border-border'
                      }`}
                    >
                      {message.role === 'user' ? (
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      ) : (
                        <div className="space-y-4">
                          {/* Tool calls */}
                          {message.toolCalls && message.toolCalls.length > 0 && (
                            <div className="space-y-2 pb-4 border-b border-border/50">
                              {message.toolCalls.map((tool) => (
                                <div key={tool.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                                  {tool.status === 'running' && <Loader2 className="h-3 w-3 animate-spin" />}
                                  {tool.status === 'complete' && <FileCode className="h-3 w-3 text-green-500" />}
                                  {tool.status === 'error' && <FileCode className="h-3 w-3 text-destructive" />}
                                  <span className="font-medium">{tool.name}</span>
                                  {tool.input && <span className="text-xs opacity-70">({JSON.stringify(tool.input).slice(0, 50)}...)</span>}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Message content with markdown */}
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown
                              components={{
                                code: ({ node, className, children, ...props }: any) => {
                                  const match = /language-(\w+)/.exec(className || '');
                                  const inline = !match;
                                  return !inline && match ? (
                                    <SyntaxHighlighter
                                      style={vscDarkPlus as any}
                                      language={match[1]}
                                      PreTag="div"
                                    >
                                      {String(children).replace(/\n$/, '')}
                                    </SyntaxHighlighter>
                                  ) : (
                                    <code className={className} {...props}>
                                      {children}
                                    </code>
                                  );
                                },
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>

                          {/* Commit link */}
                          {message.commitUrl && (
                            <div className="pt-4 border-t border-border/50">
                              <a 
                                href={message.commitUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-xs text-primary hover:underline"
                              >
                                <GitCommit className="h-3 w-3" />
                                View commit on GitHub
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-2xl px-6 py-4 bg-muted/50 border border-border">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t border-border p-6 shrink-0">
            <div className="max-w-3xl mx-auto space-y-3">
              {/* Selected Context Display */}
              {(selectedFiles.length > 0 || selectedComponent) && (
                <div className="flex flex-wrap gap-2">
                  {selectedFiles.map((file) => (
                    <Badge key={file} variant="secondary" className="gap-1">
                      <File className="h-3 w-3" />
                      {file.split('/').pop()}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-destructive"
                        onClick={() => setSelectedFiles(prev => prev.filter(f => f !== file))}
                      />
                    </Badge>
                  ))}
                  {selectedComponent && (
                    <Badge variant="default" className="gap-1">
                      <Target className="h-3 w-3" />
                      {selectedComponent}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-destructive"
                        onClick={() => setSelectedComponent('')}
                      />
                    </Badge>
                  )}
                </div>
              )}
              
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-3"
              >
                {/* File Selector Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-12 w-12 rounded-full shrink-0"
                      disabled={loading || loadingFiles}
                      type="button"
                    >
                      {loadingFiles ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <FileCode className="h-5 w-5" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-80 max-h-96 overflow-y-auto">
                    {repoFiles.length === 0 ? (
                      <div className="p-4 text-sm text-muted-foreground text-center">
                        No files found
                      </div>
                    ) : (
                      <>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                          Select files to edit
                        </div>
                        {repoFiles
                          .filter(file => file.type === 'file')
                          .map((file) => (
                            <DropdownMenuItem
                              key={file.path}
                              onClick={() => {
                                setSelectedFiles(prev => 
                                  prev.includes(file.path)
                                    ? prev.filter(f => f !== file.path)
                                    : [...prev, file.path]
                                );
                              }}
                              className="cursor-pointer"
                            >
                              <div className="flex items-center gap-2 w-full">
                                <File className="h-4 w-4 shrink-0" />
                                <span className="flex-1 truncate text-sm">{file.path}</span>
                                {selectedFiles.includes(file.path) && (
                                  <Badge variant="secondary" className="shrink-0">Selected</Badge>
                                )}
                              </div>
                            </DropdownMenuItem>
                          ))}
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Visual Inspector Toggle */}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full shrink-0"
                  disabled={loading}
                  type="button"
                  onClick={() => setInspectorActive(true)}
                  title="Visual Element Inspector"
                >
                  <Crosshair className="h-5 w-5" />
                </Button>

                {/* Component Selector Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-12 w-12 rounded-full shrink-0"
                      disabled={loading}
                      type="button"
                    >
                      <Target className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-64">
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      Select component to edit
                    </div>
                    {[
                      'Header/Navigation',
                      'Hero Section',
                      'Footer',
                      'Sidebar',
                      'Contact Form',
                      'About Section',
                      'Services Section',
                      'Portfolio/Gallery',
                      'Testimonials',
                      'Pricing Section',
                      'FAQ Section',
                      'Blog Section',
                      'CTA Buttons',
                    ].map((component) => (
                      <DropdownMenuItem
                        key={component}
                        onClick={() => setSelectedComponent(component)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <Target className="h-4 w-4 shrink-0" />
                          <span className="flex-1 text-sm">{component}</span>
                          {selectedComponent === component && (
                            <Badge variant="default" className="shrink-0">Selected</Badge>
                          )}
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    selectedComponent 
                      ? `Editing ${selectedComponent}...` 
                      : selectedFiles.length > 0 
                        ? `Editing ${selectedFiles.length} file(s)...` 
                        : "Type your message..."
                  }
                  className="flex-1 h-12 rounded-full"
                  disabled={loading}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="h-12 w-12 rounded-full elegant-shadow shrink-0"
                  disabled={loading || !input.trim()}
                >
                  <Send className="h-5 w-5" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default ChatInterface;
