import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/integrations/firebase/config';
import type { User } from 'firebase/auth';
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Mic, ArrowUp, Plus, ChevronDown, ArrowRight, FolderOpen } from "lucide-react";
import { ProjectCard, ProjectData } from "@/components/ProjectCard";

const mockProjects: ProjectData[] = [
  { id: '1', name: 'EliteSneakers Store', updatedAt: '2 hours ago', gradientCode: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)' },
  { id: '2', name: 'Fitness Tracker App', updatedAt: 'Yesterday', gradientCode: 'linear-gradient(135deg, #10b981 0%, #047857 100%)' },
  { id: '3', name: 'Crypto Dashboard', updatedAt: '3 days ago', gradientCode: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' },
  { id: '4', name: 'Restaurant Menu', updatedAt: 'Last week', gradientCode: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)' },
  { id: '5', name: 'Task Manager MVP', updatedAt: '2 weeks ago', gradientCode: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' }
];

const mockTemplates: ProjectData[] = [
  { id: 't1', name: 'SaaS Landing Page', updatedAt: 'Template', gradientCode: 'radial-gradient(circle at top left, #6366f1 0%, #4338ca 100%)' },
  { id: 't2', name: 'Portfolio Minimalist', updatedAt: 'Template', gradientCode: 'radial-gradient(circle at top left, #14b8a6 0%, #0f766e 100%)' },
  { id: 't3', name: 'E-commerce Standard', updatedAt: 'Template', gradientCode: 'radial-gradient(circle at top left, #f43f5e 0%, #be123c 100%)' },
];

type TabId = 'projects' | 'recent' | 'shared' | 'templates';

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [prompt, setPrompt] = useState("");
  const [activeTab, setActiveTab] = useState<TabId>('projects');
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
        navigate('/auth');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await signOut(auth);
    navigate('/');
  };

  const handleBuild = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    navigate(`/preview/new?prompt=${encodeURIComponent(prompt)}`);
  };

  if (!user) return null;

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-[#09090b] text-white overflow-hidden">
        <DashboardSidebar user={user} onSignOut={handleSignOut} />

        {/* Main Content Area - Scrollable */}
        <main className="flex-1 relative bg-[#030303] overflow-y-auto custom-scrollbar">

          {/* Ambient Background Orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-primary/20 blur-[130px] mix-blend-screen opacity-70 animate-blob" style={{ animationDuration: '15s' }}></div>
            <div className="absolute top-[20%] right-[-10%] w-[35vw] h-[35vw] rounded-full bg-indigo-600/20 blur-[120px] mix-blend-screen opacity-50 animate-blob" style={{ animationDuration: '20s', animationDirection: 'alternate-reverse' }}></div>
            <div className="absolute bottom-[-10%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-rose-600/15 blur-[140px] mix-blend-screen opacity-60 animate-blob" style={{ animationDuration: '25s' }}></div>
          </div>

          <div className="w-full min-h-screen flex flex-col items-center pt-[12vh] pb-24 px-6 relative z-10">
            {/* Top Right Placeholder */}
            <div className="absolute top-4 right-4 flex gap-2">
              <div className="w-8 h-8 rounded-md bg-zinc-900/50 border border-zinc-800 flex items-center justify-center backdrop-blur-sm cursor-pointer hover:bg-zinc-800 transition-colors">
                <div className="w-4 h-4 border border-zinc-400 rounded-sm"></div>
              </div>
            </div>

            <div className="w-full max-w-3xl flex flex-col items-center animate-fade-in z-10 sticky top-0 relative">
              <h1 className="text-4xl sm:text-5xl font-black mb-8 tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-white/90 to-primary/80 drop-shadow-xl text-center">
                Let's build something, {user.email ? user.email.split('@')[0] : 'User'}
              </h1>

              {/* Prompt Input Box */}
              <form
                onSubmit={handleBuild}
                className="w-full bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-2xl p-2 flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all hover:bg-white/[0.05] group"
              >
                <div className="relative">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ask Empirial to build an internal tool that..."
                    className="w-full min-h-[80px] bg-transparent border-none text-zinc-100 placeholder:text-zinc-500 resize-none outline-none p-4 pb-12 focus:ring-0 text-base"
                    style={{ overflow: 'hidden' }}
                  />
                </div>

                {/* Input Action Bar */}
                <div className="flex items-center justify-between px-2 pb-2">
                  <button type="button" className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors">
                    <Plus className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-1 bg-[#27272a]/50 rounded-full p-1 pr-1.5 pl-3 border border-[#27272a]">
                    <button type="button" className="flex items-center text-sm text-zinc-300 font-medium hover:text-white px-2 cursor-pointer transition-colors">
                      Build <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-70" />
                    </button>
                    <div className="w-[1px] h-4 bg-zinc-700 mx-1"></div>
                    <button type="button" className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-full transition-colors mr-1">
                      <Mic className="w-4 h-4" />
                    </button>
                    <button
                      type="submit"
                      disabled={!prompt.trim()}
                      className={`p-1.5 rounded-full transition-colors ${prompt.trim() ? 'bg-primary text-black' : 'bg-zinc-700/50 text-zinc-500 cursor-not-allowed'}`}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </form>

              {/* Bottom Sub-Navigation Menu */}
              <div className="mt-8 flex items-center bg-black/40 backdrop-blur-2xl border border-white/[0.05] rounded-full px-1 py-1 text-sm shadow-[0_4px_20px_rgba(0,0,0,0.3)] z-20 overflow-x-auto no-scrollbar w-full sm:w-auto">
                <button
                  onClick={() => setActiveTab('projects')}
                  className={`shrink-0 px-4 py-1.5 rounded-full font-medium transition-all ${activeTab === 'projects' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                >
                  My projects
                </button>
                <button
                  onClick={() => setActiveTab('recent')}
                  className={`shrink-0 px-4 py-1.5 rounded-full transition-all ${activeTab === 'recent' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-white/5'} hidden sm:block`}
                >
                  Recently viewed
                </button>
                <button
                  onClick={() => setActiveTab('shared')}
                  className={`shrink-0 px-4 py-1.5 rounded-full transition-all ${activeTab === 'shared' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-white/5'} hidden sm:block`}
                >
                  Shared with me
                </button>
                <button
                  onClick={() => setActiveTab('templates')}
                  className={`shrink-0 px-4 py-1.5 rounded-full transition-all ${activeTab === 'templates' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                >
                  Templates
                </button>
                <div className="w-[1px] h-4 bg-white/10 mx-1 hidden sm:block shrink-0"></div>
                <button className="shrink-0 px-4 py-1.5 text-zinc-300 hover:text-white transition-all flex items-center hover:bg-white/5 rounded-full">
                  Browse all <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </button>
              </div>
            </div>

            {/* Rendered Project Grids Area */}
            <div className="w-full max-w-5xl mt-12 animate-[fade-in_0.3s_ease-out]">
              <h2 className="text-xl font-semibold text-zinc-100 mb-6 drop-shadow-md flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-primary" />
                {activeTab === 'projects' && "Your Workspaces"}
                {activeTab === 'recent' && "Recently Viewed"}
                {activeTab === 'shared' && "Shared with You"}
                {activeTab === 'templates' && "Starter Templates"}
              </h2>

              {activeTab === 'projects' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {mockProjects.map(project => (
                    <ProjectCard key={project.id} project={project} onClick={() => navigate(`/preview/${project.id}`)} />
                  ))}
                </div>
              )}

              {activeTab === 'templates' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {mockTemplates.map(project => (
                    <ProjectCard key={project.id} project={project} onClick={() => navigate(`/preview/${project.id}`)} />
                  ))}
                </div>
              )}

              {(activeTab === 'recent' || activeTab === 'shared') && (
                <div className="flex flex-col items-center justify-center p-12 mt-4 bg-[#18181b]/50 border border-[#27272a] border-dashed rounded-xl backdrop-blur-sm">
                  <FolderOpen className="w-12 h-12 text-zinc-600 mb-4" />
                  <p className="text-zinc-400 font-medium">No projects found in this category.</p>
                </div>
              )}

            </div>

          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
