import { FormEvent, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Mic, Plus, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SiteNavigation, SiteFooter } from '@/features/marketing/EmpirialSite';
import geometricBg from '@/assets/Brand ID/generated/empirial-geometric-bg.webp'; // 98% smaller than the original .png
import BrandIcon from '@/components/BrandIcon';

const suggestions = [
  'Build my business a modern website',
  'Create a brand that feels premium',
  'Automate my customer enquiries',
];

// The AI builder itself isn't live yet — until it is, the prompt box hands
// the idea straight to WhatsApp instead of gating it behind sign-in.
const WHATSAPP_NUMBER = '27651859143';

const PublicHome = () => {
  const [prompt, setPrompt] = useState('');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed) return;
    const message = `Hi EMPIRIAL, I'd like to build: ${trimmed}`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-[#050508] text-white">
      <SiteNavigation />
      <main>
        <section className="relative isolate flex h-screen min-h-[720px] items-center overflow-hidden px-6 pb-8 pt-24">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_25%,rgba(102,32,204,.3),transparent_38%),linear-gradient(180deg,#090811_0%,#050508_90%)]" />
          <div className="absolute inset-0 -z-10 bg-cover bg-center opacity-10" style={{ backgroundImage: `url(${geometricBg})` }} />
          <div className="mx-auto flex w-full max-w-4xl flex-col items-center text-center">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="w-full">
              <BrandIcon size={44} className="mx-auto mb-4" />
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-[.24em] text-[#b56cff]">Digital studio · South Africa</p>
              <h1 className="mx-auto max-w-3xl text-4xl font-semibold leading-[1.05] tracking-[-.05em] sm:text-6xl lg:text-7xl">What will we <span className="text-[#a855f7]">build</span> together?</h1>
              <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-white/50 sm:text-lg">Tell EMPIRIAL what you are imagining. We turn ambitious ideas into websites, apps, automation, and brands that move businesses forward.</p>
              <div className="relative mx-auto mt-6 w-full max-w-3xl">
                {/* "Sticker" badge — the AI builder itself isn't live yet, so the
                    prompt box below hands off to WhatsApp instead of pretending
                    to build anything. Pinned to the corner, slightly rotated. */}
                <span className="absolute -top-3.5 right-4 z-10 rotate-3 rounded-full bg-[#8138ff] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow-[0_8px_24px_rgba(129,56,255,.5)] sm:right-6">
                  <Sparkles className="mr-1 inline h-3 w-3 -translate-y-px" /> AI Builder — Coming Soon
                </span>
                <form onSubmit={submit} className="flex w-full flex-col rounded-[1.6rem] border border-white/15 bg-white/[.07] p-4 text-left shadow-[0_20px_70px_rgba(0,0,0,.3)] backdrop-blur-2xl transition focus-within:border-[#a855f7]/60 focus-within:bg-white/[.1]">
                  <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} aria-label="Describe what you want to build" rows={2} placeholder="Describe what you want to build..." className="min-h-[64px] w-full resize-none bg-transparent px-2 pt-1 text-base text-white outline-none placeholder:text-white/35" />
                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/10 pt-3">
                    <div className="flex items-center gap-1 text-white/45"><button type="button" aria-label="Add an attachment" className="grid h-9 w-9 place-items-center rounded-full transition hover:bg-white/10 hover:text-white"><Plus className="h-4 w-4" /></button><span className="hidden text-xs sm:inline">Start with an idea</span></div>
                    <div className="flex items-center gap-2"><button type="button" aria-label="Use voice input" className="grid h-9 w-9 place-items-center rounded-full text-white/45 transition hover:bg-white/10 hover:text-white"><Mic className="h-4 w-4" /></button><button type="submit" disabled={!prompt.trim()} aria-label="Send your idea to WhatsApp" className="grid h-9 w-9 place-items-center rounded-full bg-white text-black transition hover:bg-[#d9c4ff] disabled:cursor-not-allowed disabled:opacity-30"><ArrowRight className="h-4 w-4" /></button></div>
                  </div>
                </form>
                <p className="mt-2 text-center text-xs text-white/35">Sends straight to our WhatsApp — a real person replies.</p>
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-2">{suggestions.map((suggestion) => <button type="button" key={suggestion} onClick={() => setPrompt(suggestion)} className="rounded-full border border-white/10 bg-white/[.04] px-3.5 py-2 text-xs text-white/55 transition hover:border-white/25 hover:bg-white/[.09] hover:text-white">{suggestion}</button>)}</div>
              <Link to="/portfolio" className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-white/55 transition hover:text-white">
                Not sure yet? Check out our portfolio <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </motion.div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
};

export default PublicHome;
