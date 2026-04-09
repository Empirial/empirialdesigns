import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/integrations/firebase/config';
import type { User } from 'firebase/auth';
import { 
  History, Clock, Code, Cloud, MoreHorizontal, 
  PanelLeftClose, Share, Github, Zap, ChevronDown, 
  Plus, Mic, ArrowUp, Monitor, LayoutTemplate, Link as LinkIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UpgradeModal } from "@/components/modals/UpgradeModal";

const Preview = () => {
  const { repoId } = useParams<{ repoId: string }>();
  const [searchParams] = useSearchParams();
  const initialPrompt = searchParams.get('prompt') || '';
  
  const [user, setUser] = useState<User | null>(null);
  const [prompt, setPrompt] = useState("");
  const navigate = useNavigate();

  // Component State
  const [isThinking, setIsThinking] = useState(repoId === 'new');
  const [thoughtExpanded, setThoughtExpanded] = useState(true);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const { toast } = useToast();

  const handleShareClick = () => {
    toast({
      title: "Workspace Link Copied!",
      description: "You can now share this workspace with your team.",
    });
  };

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

  return (
    <>
    <div className="h-screen w-full flex flex-col bg-[#09090b] text-zinc-300 font-sans overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="h-14 flex items-center justify-between px-3 border-b border-[#27272a] shrink-0 bg-[#09090b]">
        {/* Left: Branding & Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 cursor-pointer hover:bg-zinc-800/50 p-1.5 rounded transition-colors">
            <div className="bg-primary/20 text-primary rounded font-semibold w-6 h-6 flex items-center justify-center text-xs">
              E
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1 text-sm font-semibold text-zinc-100">
                Fit Life Hub <ChevronDown className="w-3 h-3 text-zinc-500" />
              </div>
              <span className="text-[10px] text-zinc-500">Previewing last saved version</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-zinc-500">
            <button className="hover:text-zinc-300 transition-colors p-1"><History className="w-4 h-4" /></button>
            <button className="hover:text-zinc-300 transition-colors p-1"><Clock className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Center: Tools & URL Bar */}
        <div className="flex items-center flex-1 justify-center max-w-2xl px-4">
          <div className="flex items-center gap-1 bg-[#18181b] p-1 rounded-md border border-[#27272a]">
            {/* View toggles */}
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded text-xs font-semibold">
              <Monitor className="w-3.5 h-3.5" /> Preview
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-zinc-400 hover:text-zinc-200 transition-colors text-xs font-medium">
              <LayoutTemplate className="w-3.5 h-3.5" />
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-zinc-400 hover:text-zinc-200 transition-colors text-xs font-medium">
              <Code className="w-3.5 h-3.5" />
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-zinc-400 hover:text-zinc-200 transition-colors text-xs font-medium">
              <Cloud className="w-3.5 h-3.5" />
            </button>
            <button className="flex items-center gap-1.5 px-2 py-1.5 text-zinc-400 hover:text-zinc-200 transition-colors text-xs font-medium">
               <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
          
          <div className="ml-4 flex-1 flex items-center bg-[#18181b] border border-[#27272a] rounded-md h-9 px-3 gap-2">
            <Monitor className="w-3.5 h-3.5 text-zinc-500" />
            <div className="text-sm text-zinc-300 flex-1 truncate">/</div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <button className="text-zinc-400 hover:text-zinc-200 transition-colors p-1.5" onClick={() => navigate('/dashboard')}>
            <PanelLeftClose className="w-5 h-5" />
          </button>
          
          <div className="w-[1px] h-4 bg-zinc-700"></div>
          
          <div 
            onClick={handleShareClick}
            className="flex items-center gap-1.5 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 rounded-full px-3 py-1.5 cursor-pointer transition-colors text-xs font-medium text-zinc-300"
          >
            <div className="w-4 h-4 bg-primary text-black rounded-full flex items-center justify-center font-bold text-[8px]">
              {user?.email?.charAt(0).toUpperCase() || 'E'}
            </div>
            Share
          </div>
          
          <button className="text-zinc-400 hover:text-zinc-200 transition-colors p-1.5">
             <Github className="w-4 h-4" />
          </button>
          
          <button 
             onClick={() => setIsUpgradeOpen(true)}
             className="flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-md px-3 py-1.5 transition-colors text-xs font-bold"
          >
            <Zap className="w-3.5 h-3.5 fill-primary" /> Upgrade
          </button>
          
          <button className="bg-primary hover:bg-primary/90 text-black rounded-md px-4 py-1.5 transition-colors text-xs font-bold shadow-[0_0_15px_rgba(251,191,36,0.3)]">
            Publish
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Side: Chat Workspace */}
        <div className="w-96 min-w-[24rem] shrink-0 flex flex-col bg-[#18181b] border-r border-[#27272a]">
          
          {/* Scrollable Chat Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
            <div className="text-center text-xs text-zinc-500 pt-2 pb-4">
              Apr 3 at 9:54 PM
            </div>
            
            {/* User Message */}
            <div className="flex justify-end">
              <div className="bg-[#27272a] text-zinc-100 rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm max-w-[85%] shadow-sm leading-relaxed">
                {initialPrompt || "lets build a workout website"}
              </div>
            </div>

            {/* AI Thought Process */}
            <div className="space-y-3">
               <div 
                  className="flex items-center gap-2 cursor-pointer group"
                  onClick={() => setThoughtExpanded(!thoughtExpanded)}
               >
                 <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-300 transition-colors">
                   Thought for 13s
                 </span>
                 <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-200 ${thoughtExpanded ? 'rotate-180' : ''}`} />
               </div>
               
               {thoughtExpanded && (
                 <div className="text-[13px] text-zinc-400 leading-relaxed border-l-2 border-[#27272a] pl-3 py-1">
                   This evokes raw energy — think Nike Training Club meets brutalist fitness aesthetics. I'll draw inspiration from <strong className="text-zinc-200 font-semibold">dark, high-contrast athletic brands</strong> with bold typography and dynamic layouts.
                 </div>
               )}
            </div>

            {/* AI Response Features */}
            <div className="space-y-3 text-[13px] text-zinc-300">
               <p className="font-semibold text-zinc-100">First version features:</p>
               <ul className="space-y-2.5">
                 <li className="flex items-start gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-zinc-600 mt-1.5 shrink-0" />
                   <span className="leading-relaxed">Hero section with motivational headline and CTA</span>
                 </li>
                 <li className="flex items-start gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-zinc-600 mt-1.5 shrink-0" />
                   <span className="leading-relaxed">Featured workouts grid (cardio, strength, flexibility)</span>
                 </li>
                 <li className="flex items-start gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-zinc-600 mt-1.5 shrink-0" />
                   <span className="leading-relaxed">Stats/benefits section</span>
                 </li>
               </ul>
            </div>
            
            {/* Action Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar pt-2">
               <button className="shrink-0 bg-[#27272a] hover:bg-[#3f3f46] text-zinc-300 border border-[#3f3f46] rounded-full px-3 py-1.5 text-xs font-medium transition-colors">
                 Test responsiveness
               </button>
               <button className="shrink-0 bg-[#27272a] hover:bg-[#3f3f46] text-zinc-300 border border-[#3f3f46] rounded-full px-3 py-1.5 text-xs font-medium transition-colors">
                 Add pricing plans
               </button>
               <button className="shrink-0 bg-[#27272a] hover:bg-[#3f3f46] text-zinc-300 border border-[#3f3f46] rounded-full px-3 py-1.5 text-xs font-medium transition-colors">
                 Add user auth...
               </button>
            </div>
          </div>

          {/* Sticky Input Area */}
          <div className="p-4 bg-[#18181b] border-t border-[#27272a]">
             <form className="w-full bg-[#27272a]/50 border border-[#3f3f46] rounded-xl p-2 flex flex-col shadow-lg transition-colors focus-within:bg-[#27272a]">
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ask Empirial..."
                  className="w-full min-h-[50px] bg-transparent border-none text-zinc-200 placeholder:text-zinc-500 resize-none outline-none p-2 pb-10 text-[13px]"
                  style={{ overflow: 'hidden' }}
                />
              </div>

              {/* Input Action Bar */}
              <div className="flex items-center justify-between px-1 pb-1 mt-auto">
                <div className="flex items-center gap-1.5">
                  <button type="button" className="p-1.5 text-zinc-400 hover:text-white transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                  <button type="button" className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-700/50 rounded transition-colors">
                    <Monitor className="w-3.5 h-3.5" /> Visual edits
                  </button>
                </div>
                
                <div className="flex items-center gap-0.5">
                  <button type="button" className="flex items-center text-[11px] text-zinc-400 font-medium hover:text-white px-2 cursor-pointer transition-colors">
                    Build <ChevronDown className="w-3 h-3 ml-1 opacity-70" />
                  </button>
                  <button type="button" className="p-1.5 text-zinc-400 hover:text-white transition-colors">
                    <Mic className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    type="submit" 
                    className={`ml-1 p-1.5 rounded-full transition-colors ${prompt.trim() ? 'bg-zinc-300 text-black' : 'bg-[#3f3f46] text-zinc-500'}`}
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Right Side: Iframe/Output Container */}
        <div className="flex-1 bg-[#09090b] flex flex-col p-4 relative overflow-hidden">
          
          <div className="flex-1 w-full h-full bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden shadow-2xl relative flex flex-col items-center justify-center">
             
             {isThinking ? (
                <div className="flex flex-col items-center justify-center text-zinc-400">
                   <div className="w-12 h-12 mb-6 relative">
                     <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                     <Monitor className="w-5 h-5 absolute inset-0 m-auto text-primary" />
                   </div>
                   <h3 className="text-lg font-semibold text-zinc-200 mb-2">Building your workspace...</h3>
                   <p className="text-sm text-zinc-500 max-w-[300px] text-center">Empirial is assembling components, configuring tailwind, and preparing the layout.</p>
                </div>
             ) : (
                <iframe 
                   title="Preview Canvas"
                   className="w-full h-full bg-black border-none"
                   srcDoc={`
                     <html>
                       <head>
                         <style>
                           body { margin: 0; font-family: system-ui, sans-serif; background: #000; color: #fff; }
                           .nav { display: flex; justify-content: space-between; padding: 2rem; align-items: center; }
                           .logo { display:flex; align-items: center; gap: 8px; color: #4ade80; font-weight: 800; letter-spacing: 1px; font-size: 1.2rem; }
                           .links { display: flex; gap: 2rem; color: #a1a1aa; font-weight: 600; font-size: 0.9rem; }
                           .btn { background: #4ade80; color: #000; padding: 0.75rem 1.5rem; border-radius: 4px; font-weight: 800; border: none; font-size: 0.9rem; }
                           .btn-outline { background: transparent; border: 1px solid #333; color: #fff; padding: 0.75rem 1.5rem; border-radius: 4px; font-weight: 600; }
                           
                           .hero { padding: 4rem 2rem; max-width: 800px; }
                           .badge { color: #4ade80; font-weight: 700; letter-spacing: 3px; font-size: 0.8rem; margin-bottom: 1.5rem; display: block;}
                           .title { font-size: 5rem; font-weight: 900; line-height: 1; margin: 0 0 1.5rem; letter-spacing: -2px; }
                           .title span { color: #4ade80; display: block; }
                           .desc { color: #a1a1aa; font-size: 1.2rem; line-height: 1.6; margin-bottom: 3rem; max-width: 600px; }
                           
                           .actions { display: flex; gap: 1rem; }
                         </style>
                       </head>
                       <body>
                         <nav class="nav">
                           <div class="logo">
                             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18h12"/><path d="M6 14h12"/><path d="M6 10h12"/><path d="M6 6h12"/></svg>
                             FORGE
                           </div>
                           <div class="links">
                             <span>WORKOUTS</span>
                             <span>PROGRAMS</span>
                             <span>COMMUNITY</span>
                             <span>PRICING</span>
                           </div>
                           <button class="btn">START FREE</button>
                         </nav>
                         
                         <div class="hero">
                           <span class="badge">TRAIN. TRANSFORM. TRANSCEND.</span>
                           <h1 class="title">BUILD YOUR <span>STRONGEST</span> SELF</h1>
                           <p class="desc">Science-backed programs designed for every level. Track progress, crush goals, and join a community that pushes limits.</p>
                           <div class="actions">
                             <button class="btn">GET STARTED →</button>
                             <button class="btn-outline">BROWSE WORKOUTS</button>
                           </div>
                         </div>
                       </body>
                     </html>
                   `}
                />
             )}

          </div>

          {/* Iframe Scrollbar Fake Handle overlay as seen in picture */}
          <div className="absolute right-5 top-5 bottom-5 w-2 bg-transparent pointer-events-none z-10 flex flex-col items-center py-2 text-zinc-600">
             <div className="w-1.5 h-32 bg-zinc-500/30 rounded-full border border-zinc-500/20"></div>
          </div>
          
        </div>
        
      </div>
      
    </div>
    <UpgradeModal open={isUpgradeOpen} onOpenChange={setIsUpgradeOpen} />
    </>
  );
};

export default Preview;
