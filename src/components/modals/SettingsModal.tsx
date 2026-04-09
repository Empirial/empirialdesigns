import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { User, Settings, CreditCard, Bell, Shield, LogOut } from "lucide-react";
import { useState } from "react";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string | undefined;
}

export function SettingsModal({ open, onOpenChange, email }: SettingsModalProps) {
  const [activeMenu, setActiveMenu] = useState('account');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] bg-[#09090b] border-[#27272a] text-zinc-100 p-0 overflow-hidden shadow-2xl flex min-h-[500px]">
        
        {/* Sidebar */}
        <div className="w-48 bg-[#121214] border-r border-[#27272a] p-4 flex flex-col gap-1">
           <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 px-2">Settings</h3>
           
           <button 
             onClick={() => setActiveMenu('account')}
             className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors w-full text-left font-medium ${activeMenu === 'account' ? 'bg-[#27272a] text-white' : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#27272a]/50'}`}
           >
             <User className="w-4 h-4" /> Account
           </button>
           <button 
             onClick={() => setActiveMenu('billing')}
             className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors w-full text-left font-medium ${activeMenu === 'billing' ? 'bg-[#27272a] text-white' : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#27272a]/50'}`}
           >
             <CreditCard className="w-4 h-4" /> Billing
           </button>
           <button 
             className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors w-full text-left font-medium text-zinc-400 hover:text-zinc-200 hover:bg-[#27272a]/50"
           >
             <Settings className="w-4 h-4" /> Preferences
           </button>
           <button 
             className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors w-full text-left font-medium text-zinc-400 hover:text-zinc-200 hover:bg-[#27272a]/50"
           >
             <Bell className="w-4 h-4" /> Notifications
           </button>

           <div className="mt-auto shrink-0 pt-4">
              <button 
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors w-full text-left font-medium"
              >
                 <LogOut className="w-4 h-4" /> Sign Out
              </button>
           </div>
        </div>

        {/* Form Area */}
        <div className="flex-1 p-8">
           {activeMenu === 'account' && (
             <div className="animate-fade-in space-y-6">
                <h2 className="text-2xl font-bold mb-6">Account Settings</h2>
                <div className="space-y-2">
                   <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Avatar</label>
                   <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary text-primary flex items-center justify-center font-bold text-2xl uppercase shadow-[0_0_15px_rgba(251,191,36,0.2)]">
                         {email?.charAt(0) || 'E'}
                      </div>
                      <button className="px-4 py-2 border border-[#27272a] text-sm font-medium rounded-md hover:bg-[#27272a] transition-colors">
                         Upload New
                      </button>
                   </div>
                </div>

                <div className="space-y-4 mt-8">
                   <div className="space-y-2">
                      <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Email Address</label>
                      <input 
                         type="email" 
                         disabled 
                         value={email || ''} 
                         className="w-full bg-[#18181b] border border-[#27272a] rounded-lg p-2.5 text-sm text-zinc-400 cursor-not-allowed focus:outline-none" 
                      />
                   </div>
                   
                   <div className="space-y-2">
                      <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Display Name</label>
                      <input 
                         type="text" 
                         defaultValue={email?.split('@')[0] || ''}
                         className="w-full bg-[#18181b] border border-[#27272a] rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors" 
                      />
                   </div>
                </div>
                
                <button className="mt-6 bg-primary text-black font-semibold text-sm px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity">
                   Save Changes
                </button>
             </div>
           )}

           {activeMenu === 'billing' && (
              <div className="animate-fade-in flex flex-col h-full justify-center items-center text-center">
                 <Shield className="w-12 h-12 text-zinc-600 mb-4" />
                 <h2 className="text-xl font-bold mb-2">Secure Billing</h2>
                 <p className="text-sm text-zinc-400 max-w-sm mb-6">You are currently on the Free Plan. Manage your subscription and payment methods here.</p>
                 <button className="bg-white text-black font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-zinc-200 transition-colors">
                    Manage in Stripe
                 </button>
              </div>
           )}
        </div>
        
      </DialogContent>
    </Dialog>
  );
}
