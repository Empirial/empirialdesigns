import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/integrations/firebase/config';
import { ArrowLeft, Sparkles, Code, Zap } from 'lucide-react';

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        const user = credential.user;

        // Initialize user record or repo collection if needed here
        
        toast({ title: 'Account created!', description: 'You are now signed in.' });
        navigate('/dashboard');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: 'Welcome back!', description: "You've successfully signed in." });
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast({ title: 'Auth Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#09090b] text-white font-sans selection:bg-primary/30">
      
      {/* Left Pane - Marketing/Abstract Visual (Hidden on smaller screens) */}
      <div className="hidden lg:flex flex-col w-1/2 relative bg-lovable-gradient items-start justify-between p-12 overflow-hidden border-r border-[#27272a]/50 border-r-primary/20">
        <div className="relative z-10 flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
           <div className="bg-primary/20 text-primary border border-primary rounded font-bold w-10 h-10 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(251,191,36,0.3)]">
             E
           </div>
           <span className="text-2xl font-black text-white tracking-tight">Empirial</span>
        </div>

        <div className="relative z-10 max-w-lg mb-20 animate-fade-in drop-shadow-xl">
           <h1 className="text-6xl font-black leading-[1.1] tracking-tighter mb-6">
             <span className="text-white">Build faster</span><br/>
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-200">with a Super Engineer.</span>
           </h1>
           <p className="text-zinc-300 text-xl font-medium leading-relaxed">
             Describe your dream website. Empirial writes the code, spins up the database, and deploys it while you watch.
           </p>
           
           <div className="flex flex-col gap-4 mt-12 bg-[#09090b]/40 backdrop-blur-md p-6 rounded-2xl border border-white/5 shadow-2xl">
              <div className="flex items-center gap-4 text-zinc-200 font-medium">
                 <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-primary" />
                 </div>
                 Instant full-stack application generation
              </div>
              <div className="flex items-center gap-4 text-zinc-200 font-medium">
                 <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <Code className="w-5 h-5 text-primary" />
                 </div>
                 Clean, scalable React & Tailwind code exported
              </div>
              <div className="flex items-center gap-4 text-zinc-200 font-medium">
                 <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5 text-primary" />
                 </div>
                 Live visual editing architecture
              </div>
           </div>
        </div>
      </div>

      {/* Right Pane - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#09090b] relative">
         <button 
           onClick={() => navigate('/')}
           className="absolute top-8 left-8 lg:hidden text-zinc-400 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors"
         >
           <ArrowLeft className="w-4 h-4" /> Back
         </button>
         
         <div className="w-full max-w-[400px] animate-fade-in">
            <h2 className="text-3xl font-bold mb-2 tracking-tight">
               {isSignUp ? 'Create your account' : 'Welcome back'}
            </h2>
            <p className="text-zinc-400 mb-8">
               {isSignUp ? "Enter your details to get started building." : "Sign in to your Empirial workspace."}
            </p>

            <form onSubmit={handleAuth} className="space-y-5">
               <div className="space-y-2">
                 <label className="text-sm font-medium text-zinc-300">Email Address</label>
                 <input 
                   type="email" 
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   required
                   placeholder="you@company.com"
                   className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium"
                 />
               </div>

               <div className="space-y-2">
                 <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-zinc-300">Password</label>
                    {!isSignUp && (
                      <button type="button" className="text-xs text-primary hover:text-primary/80 font-medium transition-colors">
                        Forgot password?
                      </button>
                    )}
                 </div>
                 <input 
                   type="password" 
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   required
                   placeholder="••••••••"
                   className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium tracking-widest"
                 />
               </div>

               <button 
                 type="submit"
                 disabled={loading}
                 className="w-full bg-primary hover:bg-primary/90 text-black font-black text-sm uppercase tracking-wide py-3.5 rounded-xl shadow-[0_0_20px_rgba(251,191,36,0.3)] transition-all flex items-center justify-center mt-4"
               >
                 {loading ? (
                   <div className="w-5 h-5 rounded-full border-2 border-black/20 border-t-black animate-spin" />
                 ) : (
                   isSignUp ? 'Initialize Workspace' : 'Sign In'
                 )}
               </button>
            </form>

            <div className="mt-8 text-center text-sm text-zinc-400">
               {isSignUp ? "Already have an account? " : "Don't have an account? "}
               <button 
                 onClick={() => setIsSignUp(!isSignUp)}
                 className="text-white hover:text-primary font-bold transition-colors"
               >
                 {isSignUp ? "Sign in" : "Sign up"}
               </button>
            </div>
         </div>
      </div>

    </div>
  );
};

export default Auth;
