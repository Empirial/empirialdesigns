import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Check, Sparkles } from "lucide-react";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpgradeModal({ open, onOpenChange }: UpgradeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl bg-[#09090b] border-[#27272a] text-zinc-100 p-0 overflow-hidden shadow-2xl">
        <div className="flex flex-col md:flex-row w-full">
          
          {/* Free Tier */}
          <div className="flex-1 p-8 md:p-10 bg-[#121214] border-r border-[#27272a]/50 flex flex-col">
            <h3 className="text-xl font-bold text-zinc-100 mb-2">Free Plan</h3>
            <p className="text-sm text-zinc-400 mb-6">Perfect for testing the waters and learning how Empirial works.</p>
            <div className="text-4xl font-bold text-zinc-100 mb-8">$0<span className="text-base font-normal text-zinc-500">/mo</span></div>
            
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-3 text-sm text-zinc-300">
                <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-zinc-400" />
                </div>
                50 AI generation credits/mo
              </li>
              <li className="flex items-center gap-3 text-sm text-zinc-300">
                <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-zinc-400" />
                </div>
                Community templates
              </li>
              <li className="flex items-center gap-3 text-sm text-zinc-300">
                <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-zinc-400" />
                </div>
                Basic code exporting
              </li>
            </ul>
            <button className="w-full py-3 rounded-xl border border-zinc-700 text-zinc-300 font-semibold hover:bg-zinc-800 transition-colors"
                onClick={() => onOpenChange(false)}>
              Current Plan
            </button>
          </div>

          {/* Pro Tier */}
          <div className="flex-1 p-8 md:p-10 relative bg-lovable-gradient flex flex-col">
            <div className="absolute top-0 right-8 bg-primary text-black px-3 py-1 rounded-b-lg text-xs font-bold uppercase tracking-wider">
              Most Popular
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-bold text-white">Pro Plan</h3>
            </div>
            
            <p className="text-sm text-zinc-300 mb-6">Unleash the full power of the Super Engineer.</p>
            <div className="text-4xl font-bold text-white mb-8">$29<span className="text-base font-normal text-zinc-400">/mo</span></div>
            
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-3 text-sm text-white font-medium">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30">
                  <Check className="w-3 h-3 text-primary" />
                </div>
                Unlimited AI generation credits
              </li>
              <li className="flex items-center gap-3 text-sm text-zinc-200">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30">
                  <Check className="w-3 h-3 text-primary" />
                </div>
                Private GitHub repos integration
              </li>
              <li className="flex items-center gap-3 text-sm text-zinc-200">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30">
                  <Check className="w-3 h-3 text-primary" />
                </div>
                Priority code compilation
              </li>
              <li className="flex items-center gap-3 text-sm text-zinc-200">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30">
                  <Check className="w-3 h-3 text-primary" />
                </div>
                One-click Custom Domain Deploy
              </li>
            </ul>
            <button className="w-full py-3 rounded-xl bg-primary text-black font-bold hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(251,191,36,0.3)]">
              Upgrade to Pro
            </button>
          </div>
          
        </div>
      </DialogContent>
    </Dialog>
  );
}
