import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/integrations/firebase/config';
import type { User } from 'firebase/auth';
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Mic, ArrowUp, Plus, ChevronDown, ArrowRight } from "lucide-react";

const RepoManagement = () => {
  const [user, setUser] = useState<User | null>(null);
  const [prompt, setPrompt] = useState("");
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
    // For now we just route to /generate or handle logic later
    navigate('/generate');
  };

  if (!user) return null;

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-[#09090b] text-white overflow-hidden">
        <DashboardSidebar user={user} onSignOut={handleSignOut} />
        
        {/* Main Content Area */}
        <main className="flex-1 relative bg-lovable-gradient flex flex-col items-center justify-center p-6">
          {/* Top Right Buttons (Optional layout placeholder if we need them later) */}
          <div className="absolute top-4 right-4 flex gap-2">
            <div className="w-8 h-8 rounded-md bg-zinc-900/50 border border-zinc-800 flex items-center justify-center backdrop-blur-sm cursor-pointer hover:bg-zinc-800 transition-colors">
              <div className="w-4 h-4 border border-zinc-400 rounded-sm"></div>
            </div>
          </div>

          <div className="w-full max-w-3xl flex flex-col items-center animate-fade-in z-10 relative">
            <h1 className="text-4xl sm:text-5xl font-bold mb-8 tracking-tight text-white/90 drop-shadow-lg">
              Let's build something, {user.email ? user.email.split('@')[0] : 'User'}
            </h1>

            {/* Prompt Input Box */}
            <form 
              onSubmit={handleBuild}
              className="w-full bg-[#18181b]/80 backdrop-blur-lg border border-[#27272a] rounded-2xl p-2 flex flex-col shadow-2xl transition-all hover:bg-[#18181b]/95"
            >
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ask Lovable to build an internal tool that..."
                  className="w-full min-h-[80px] bg-transparent border-none text-zinc-200 placeholder:text-zinc-500 resize-none outline-none p-4 pb-12 focus:ring-0 text-base"
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
                    className={`p-1.5 rounded-full transition-colors ${prompt.trim() ? 'bg-white text-black' : 'bg-zinc-700/50 text-zinc-500 cursor-not-allowed'}`}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </form>

            {/* Bottom Sub-Navigation Menu */}
            <div className="mt-8 flex items-center bg-[#18181b]/90 backdrop-blur-md border border-[#27272a] rounded-full px-1 py-1 text-sm shadow-xl">
              <button className="px-4 py-1.5 bg-[#27272a] text-white rounded-full font-medium transition-colors">
                My projects
              </button>
              <button className="px-4 py-1.5 text-zinc-400 hover:text-zinc-200 transition-colors hidden sm:block">
                Recently viewed
              </button>
              <button className="px-4 py-1.5 text-zinc-400 hover:text-zinc-200 transition-colors hidden sm:block">
                Shared with me
              </button>
              <button className="px-4 py-1.5 text-zinc-400 hover:text-zinc-200 transition-colors hidden md:block">
                Templates
              </button>
              <div className="w-[1px] h-4 bg-zinc-700 mx-1 hidden sm:block"></div>
              <button className="px-4 py-1.5 text-zinc-300 hover:text-white transition-colors flex items-center">
                Browse all <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default RepoManagement;
