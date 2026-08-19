import { FormEvent, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Bot, Check, ChevronDown, Code2, Globe2, Megaphone, Menu, MessageCircle, Palette, ShieldCheck, ShoppingCart, Smartphone, Sparkles, X } from 'lucide-react';
import robotPortraits from '@/assets/Brand ID/generated/empirial-robot-closeup.webp';
import humanRobot from '@/assets/Brand ID/generated/empirial-human-robot.webp';
import workspace from '@/assets/Brand ID/generated/empirial-workspace.webp';
import brandBoard from '@/assets/Brand ID/generated/empirial-brand-stage.webp';
import aiAutomation from '@/assets/Brand ID/generated/empirial-ai-automation.webp';
import portfolioVisual from '@/assets/Brand ID/generated/empirial-portfolio.webp';
import BrandIcon from '@/components/BrandIcon';
import PortfolioCoverflow from '@/features/marketing/components/PortfolioCoverflow';

const purple = 'text-[#a855f7]';

const Logo = () => (
  <Link to="/" className="flex items-center gap-3" aria-label="EMPIRIAL home">
    <BrandIcon size={36} />
    <span className="text-sm font-semibold tracking-[.36em] text-white">EMPIRIAL</span>
  </Link>
);

export const SiteNavigation = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const items = [['Services', '/services'], ['Portfolio', '/portfolio'], ['About', '/about'], ['Contact', '/contact']];
  return <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6">
    {/* grid-cols-[1fr_auto_1fr] keeps the link group visually centered in
        the bar regardless of how wide the logo vs. Staff/Sign In side is —
        a plain flex justify-between can't center a middle group like that.
        Below md:, the middle links div is display:none, which removes it
        from grid auto-placement entirely (a display:none box isn't a grid
        item) — without explicit col-start-* on the other two, the logo and
        hamburger get shoved into columns 1 and 2 instead of 1 and 3, leaving
        the hamburger stranded left of an empty column instead of flush right. */}
    <nav className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 rounded-2xl border border-white/10 bg-[#07070c]/80 px-5 py-4 shadow-2xl backdrop-blur-xl">
      <div className="col-start-1 justify-self-start"><Logo /></div>
      <div className="col-start-2 hidden items-center gap-7 md:flex">
        {items.map(([label, href]) => <Link key={href} to={href} className={`text-sm transition ${location.pathname === href ? 'text-white' : 'text-white/55 hover:text-white'}`}>{label}</Link>)}
      </div>
      <div className="col-start-3 flex items-center justify-self-end gap-3">
        {/* /staff is a real in-app route (StaffPortal, mounted in App.tsx) —
            plain <Link>, same as every other nav item. */}
        <div className="hidden items-center gap-3 md:flex">
          <Link to="/staff" className="rounded-full border border-white/15 px-4 py-2.5 text-sm font-semibold text-white/80 transition hover:border-white/30 hover:text-white">Staff</Link>
          <Link to="/auth" className="rounded-full bg-[#8138ff] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(129,56,255,.4)] transition hover:bg-[#9858ff]">Sign In <ArrowRight className="ml-1 inline h-4 w-4" /></Link>
        </div>
        <button className="text-white md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">{open ? <X /> : <Menu />}</button>
      </div>
      {open && <div className="absolute inset-x-3 top-16 rounded-2xl border border-white/10 bg-[#0d0d15] p-4 md:hidden">{items.map(([label, href]) => <Link onClick={() => setOpen(false)} key={href} to={href} className="block border-b border-white/5 px-3 py-3 text-white/75 last:border-0">{label}</Link>)}<Link onClick={() => setOpen(false)} to="/staff" className="mt-3 block rounded-full border border-white/15 px-3 py-3 text-center font-semibold text-white/80">Staff</Link><Link onClick={() => setOpen(false)} to="/auth" className="mt-3 block rounded-full bg-[#8138ff] px-3 py-3 text-center font-semibold text-white">Sign In</Link></div>}
    </nav>
  </header>;
};

export const SiteFooter = () => <footer className="border-t border-white/10 bg-[#050508] px-6 py-14">
  <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.5fr_1fr_1fr_1.2fr]">
    <div><Logo /><p className="mt-5 max-w-xs text-sm leading-6 text-white/45">Intelligent digital solutions that move ambitious businesses forward.</p></div>
    <div><p className="mb-4 text-xs uppercase tracking-[.2em] text-white/40">Explore</p><div className="grid gap-3 text-sm text-white/65"><Link to="/services">Services</Link><Link to="/portfolio">Portfolio</Link><Link to="/about">About</Link><Link to="/contact">Contact</Link></div></div>
    <div><p className="mb-4 text-xs uppercase tracking-[.2em] text-white/40">Capabilities</p><div className="grid gap-3 text-sm text-white/65"><span>Web & apps</span><span>AI automation</span><span>Brand systems</span><span>Growth</span></div></div>
    <div><p className="mb-4 text-xs uppercase tracking-[.2em] text-white/40">Start a conversation</p><p className="text-sm text-white/70">hello@empirialdesigns.com</p><p className="mt-2 text-sm text-white/45">Polokwane, South Africa</p><a href="https://wa.me/27651859143" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#b56cff]">WhatsApp us <ArrowRight className="h-4 w-4" /></a></div>
  </div>
  <div className="mx-auto mt-12 max-w-7xl border-t border-white/10 pt-6 text-xs text-white/35">© 2026 EMPIRIAL. All rights reserved.</div>
</footer>;

const Page = ({ children }: { children: ReactNode }) => <div className="min-h-screen bg-[#050508] text-white"><SiteNavigation /><main>{children}</main><SiteFooter /></div>;
const Eyebrow = ({ children }: { children: ReactNode }) => <p className="mb-4 text-xs font-semibold uppercase tracking-[.24em] text-[#b56cff]">{children}</p>;

const services = [
  { icon: Globe2, title: 'Business Website', text: 'A professional home online — core pages, a Google listing set up properly, map integration, and a quote form. Once-off, from R2,500.' },
  { icon: ShoppingCart, title: 'E-Commerce Website', text: 'Everything in the Business Website, plus a full catalog, secure payments, receipts, and an owner dashboard to run it yourself. Once-off, priced per project.' },
  { icon: Smartphone, title: 'Application Development', text: 'A web or mobile app built around how you work — accounts, an admin dashboard, integrations, and full hosting and launch. Once-off, priced per project.' },
  { icon: Code2, title: 'Custom Software Development', text: 'A system designed around your exact workflow — reporting, a client/staff portal, integrations, and automation. Once-off, priced per project.' },
  { icon: Bot, title: 'AI Automation', text: 'Custom AI agents that do real work, from one automated task to a full multi-agent system. Monthly, Starter / Smart / Elite.' },
  { icon: Megaphone, title: 'SEO & Social Media Management', text: 'Get found on Google and stay visible on social — listing management, posting, rank tracking, and reporting. Monthly, three packages.' },
  { icon: Palette, title: 'Poster Design', text: 'A single professionally designed poster, flyer or social graphic — print-ready and social-ready. Once-off, from R250.' },
];

const Process = () => <section className="mx-auto max-w-7xl px-6 py-24"><Eyebrow>Our approach</Eyebrow><div className="grid gap-10 md:grid-cols-[.8fr_1.2fr]"><h2 className="text-4xl font-semibold tracking-tight md:text-5xl">Strategy. Design. Build. <span className={purple}>Scale.</span></h2><div className="grid gap-5 sm:grid-cols-4">{[['01','Discover','We learn your goals, audience, and opportunity.'],['02','Design','We shape the right experience and visual system.'],['03','Build','We create clean, fast, robust digital products.'],['04','Scale','We launch, optimise, and help you grow.']].map(([n,t,d]) => <div key={n} className="border-t border-white/15 pt-4"><span className="text-sm text-[#b56cff]">{n}</span><h3 className="mt-5 font-semibold">{t}</h3><p className="mt-2 text-sm leading-6 text-white/45">{d}</p></div>)}</div></div></section>;

export const ServicesPage = () => <Page><section className="px-6 pb-20 pt-36"><div className="mx-auto max-w-7xl"><Eyebrow>Capabilities</Eyebrow><h1 className="max-w-4xl text-5xl font-semibold tracking-tight sm:text-7xl">Digital solutions built for <span className={purple}>ambitious businesses.</span></h1><p className="mt-7 max-w-2xl text-lg leading-8 text-white/55">From your first landing page to the systems that run your growth, EMPIRIAL brings strategy, design, and technology together.</p></div></section><section className="mx-auto max-w-7xl px-6 pb-24"><div className="grid gap-4">{services.map(({icon: Icon,title,text},i) => <div key={title} className="grid gap-6 rounded-2xl border border-white/10 bg-white/[.03] p-7 md:grid-cols-[80px_1fr_auto] md:items-center"><div className="grid h-14 w-14 place-items-center rounded-xl bg-[#7c2cff]/15 text-[#b56cff]"><Icon /></div><div><p className="mb-2 text-xs text-[#b56cff]">0{i+1}</p><h2 className="text-2xl font-semibold">{title}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">{text}</p></div><Link to="/contact" className="text-sm font-semibold text-white/70 hover:text-white">Discuss this <ArrowRight className="ml-1 inline h-4 w-4" /></Link></div>)}</div></section><Process /></Page>;

const projects = [
  { title: 'Smite Trade', category: 'Websites', type: 'Trading platform · Website · Product design', image: portfolioVisual, url: 'https://smitetratde.co.za' },
  { title: 'MrPDF', category: 'Apps', type: 'Document platform · Website · App', image: aiAutomation, url: 'https://mrpdf.co.za' },
  { title: 'CareerGate', category: 'Websites', type: 'Career platform · Website · Digital experience', image: humanRobot, url: 'https://careergate.co.za' },
  { title: 'Pitchly AI', category: 'AI & Automation', type: 'AI product · Website · Systems', image: workspace },
  { title: 'EMPIRIAL', category: 'Branding', type: 'Brand identity · Digital studio', image: brandBoard },
  { title: 'Zion', category: 'Websites', type: 'Trading platform · Product design', image: robotPortraits },
  { title: 'Samtambani', category: 'Websites', type: 'Business website · Digital experience', image: workspace, url: 'https://samtambani.netlify.app' },
  { title: 'Little Saints', category: 'Websites', type: 'Business website · Brand experience', image: brandBoard, url: 'https://littlesaints.co.za' },
  { title: 'M Bendla-M Attorneys', category: 'Websites', type: 'Legal website · Professional services', image: portfolioVisual, url: 'https://www.mbendelamtattorneys.co.za' },
  { title: 'NNA Electricals', category: 'Websites', type: 'Business website · Services', image: workspace, url: 'https://nnaelectricals.co.za' },
  { title: 'Mphela Industries', category: 'Websites', type: 'Business website · Digital presence', image: humanRobot, url: 'https://mphelaindus.co.za' },
  { title: 'GoGo Carwash', category: 'Websites', type: 'Service website · Local business', image: portfolioVisual, url: 'https://gogocarwash1.netlify.app' },
  { title: "Bong's Kitchen", category: 'E-commerce', type: 'Food brand · Website · Menu experience', image: brandBoard, url: 'https://bongskitchen.netlify.app' },
  { title: 'Empirial Quizines', category: 'Branding', type: 'Food brand · Visual identity · Website', image: aiAutomation, url: 'https://empirialquizines.netlify.app' },
  { title: 'Empirial Academy', category: 'Websites', type: 'Education platform · Website', image: workspace, url: 'https://empirialacademy.netlify.app' },
  { title: 'UreSure', category: 'Apps', type: 'Digital product · App concept', image: robotPortraits, url: 'https://uresure.netlify.app' },
  { title: 'YT Shika Attorneys', category: 'Websites', type: 'Legal website · Professional services', image: portfolioVisual, url: 'https://ytshikaattorneys.netlify.app' },
  { title: 'Empirial Coffee', category: 'E-commerce', type: 'Coffee brand · Website · E-commerce', image: brandBoard, url: 'https://empirialcoffee.netlify.app' },
  { title: 'Empirial Estate', category: 'Websites', type: 'Property website · Digital experience', image: humanRobot, url: 'https://empirialestate.netlify.app' },
  { title: 'Empirial Pastry', category: 'E-commerce', type: 'Food brand · Website · E-commerce', image: workspace, url: 'https://empirialpastry.netlify.app' },
  { title: 'Empirial Attorneys', category: 'Websites', type: 'Legal website · Professional services', image: portfolioVisual, url: 'https://empirialattorneys.netlify.app' },
  { title: 'Miss Empirial SA', category: 'Branding', type: 'Personal brand · Campaign website', image: brandBoard, url: 'https://missempirialsa.netlify.app' },
  { title: 'Siyalele Projects', category: 'Websites', type: 'Business website · Project showcase', image: humanRobot, url: 'https://siyaleleprojects.netlify.app' },
  { title: 'Pitchly', category: 'AI & Automation', type: 'AI product · Firebase app', image: aiAutomation, url: 'https://pitchly-5e336.web.app' },
];
export const PortfolioPage = () => { const [filter, setFilter] = useState('All'); const filters = ['All', 'Websites', 'Apps', 'AI & Automation', 'Branding', 'E-commerce']; const visibleProjects = filter === 'All' ? projects : projects.filter((project) => project.category === filter); return <Page><section className="px-6 pb-10 pt-36 text-center"><div className="mx-auto max-w-2xl"><h1 className="text-5xl font-semibold tracking-tight sm:text-7xl">Portfolio</h1><p className="mt-5 text-lg leading-8 text-white/55">Explore work built by <span className={purple}>EMPIRIAL</span> across industries.</p></div><div className="mx-auto mt-8 flex max-w-fit flex-wrap justify-center gap-1.5 rounded-full border border-white/10 bg-white/[.025] p-1.5" aria-label="Filter portfolio projects">{filters.map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${filter === item ? 'bg-[#8138ff] text-white shadow-[0_0_20px_rgba(129,56,255,.25)]' : 'text-white/50 hover:bg-white/10 hover:text-white'}`}>{item}</button>)}</div></section><section className="pb-24 pt-8"><PortfolioCoverflow projects={visibleProjects} /></section><section className="mx-auto max-w-7xl px-6 pb-24"><div className="rounded-2xl border border-dashed border-white/15 p-8 text-center"><Sparkles className="mx-auto mb-4 text-[#b56cff]" /><p className="text-sm text-white/50">More work is coming as the EMPIRIAL family grows.</p><p className="mt-2 text-xl font-semibold">Your project could be next.</p></div></section></Page>; };

export const AboutPage = () => <Page><section className="px-6 pb-24 pt-36"><div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.1fr_.9fr]"><div><Eyebrow>About EMPIRIAL</Eyebrow><h1 className="text-5xl font-semibold tracking-tight sm:text-7xl">Building intelligent digital <span className={purple}>businesses.</span></h1><p className="mt-7 max-w-xl text-lg leading-8 text-white/55">EMPIRIAL exists to help ambitious people turn good ideas into clear, credible, useful digital experiences.</p></div><img src={humanRobot} alt="Human and EMPIRIAL robot collaborating" className="aspect-[4/3] w-full max-w-xl rounded-2xl object-cover" /></div></section><section className="mx-auto grid max-w-7xl gap-12 border-t border-white/10 px-6 py-24 lg:grid-cols-2"><div><Eyebrow>Your story, made digital</Eyebrow><h2 className="text-4xl font-semibold">The best work sits where <span className={purple}>human thinking</span> meets useful technology.</h2></div><div className="space-y-5 text-white/55"><p className="leading-8">We started EMPIRIAL because too many businesses are forced to choose between beautiful design and technology that works. We believe the best digital products need both.</p><p className="leading-8">Our job is to bring clarity to complex ideas, create experiences people trust, and build systems that help your business keep moving after launch.</p></div></section><section className="mx-auto max-w-7xl px-6 pb-24"><img src={workspace} alt="EMPIRIAL futuristic workspace" className="mb-8 h-72 w-full rounded-2xl object-cover opacity-80" /><div className="grid gap-4 md:grid-cols-4">{[['01','Ideas into reality.'],['02','Human + AI connection.'],['03','Signal of intelligence.'],['04','Forward momentum.']].map(([n,t]) => <div key={n} className="rounded-2xl border border-white/10 p-6"><p className="text-sm text-[#b56cff]">{n}</p><p className="mt-14 text-lg font-semibold">{t}</p></div>)}</div></section></Page>;

// Shared field styling for the contact form below. Was a bare `.form-input`
// class with no CSS behind it anywhere in the codebase — every input
// rendered with no border/padding/background, and because each <label> had
// no display/gap rule either, the label text and the (invisible-but-present)
// input box occupied the same inline flow and visually overlapped.
const formInputCls = 'w-full rounded-lg border border-white/10 bg-white/[.04] px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#8138ff]/60 focus:bg-white/[.07]';
const formLabelCls = 'flex flex-col gap-1.5 text-sm text-white/65';

export const ContactPage = () => { const [sent,setSent] = useState(false); const submit = (e: FormEvent) => { e.preventDefault(); setSent(true); }; return <Page><section className="px-6 pb-24 pt-36"><div className="mx-auto max-w-7xl"><div className="max-w-3xl"><Eyebrow>Start a conversation</Eyebrow><h1 className="text-5xl font-semibold tracking-tight sm:text-7xl">Let's build something <span className={purple}>incredible.</span></h1><p className="mt-7 text-lg leading-8 text-white/55">Tell us what you are working towards and we will help you work out the smartest next step.</p></div><div className="mt-16 grid gap-12 lg:grid-cols-[1fr_.55fr]"><form onSubmit={submit} className="rounded-2xl border border-white/10 bg-white/[.03] p-6 sm:p-8"><div className="grid gap-5 sm:grid-cols-2"><label className={formLabelCls}>Name<input required className={formInputCls} /></label><label className={formLabelCls}>Company<input className={formInputCls} /></label><label className={formLabelCls}>Email<input required type="email" className={formInputCls} /></label><label className={formLabelCls}>Phone<input className={formInputCls} /></label></div><label className={`mt-5 ${formLabelCls}`}>Budget<select className={formInputCls}><option>Let's discuss</option><option>R10k – R25k</option><option>R25k – R50k</option><option>R50k+</option></select></label><label className={`mt-5 ${formLabelCls}`}>Project description<textarea required rows={5} className={`${formInputCls} resize-none`} placeholder="What are you trying to build or improve?" /></label><button className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#8138ff] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#8138ff]/85 active:scale-[0.98]">{sent ? 'Enquiry received' : 'Send enquiry'}{sent ? <Check className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}</button>{sent && <p className="mt-4 text-sm text-[#b56cff]">Thank you — we will be in touch soon.</p>}</form><div className="space-y-8"><div><ShieldCheck className="mb-4 text-[#b56cff]" /><h2 className="text-xl font-semibold">A clear next step</h2><p className="mt-3 text-sm leading-7 text-white/50">We will review your brief, ask the important questions, and recommend a practical way forward.</p></div><div><MessageCircle className="mb-4 text-[#b56cff]" /><h2 className="text-xl font-semibold">Prefer WhatsApp?</h2><p className="mt-3 text-sm leading-7 text-white/50">Reach us directly for a quick conversation about your project.</p><a href="https://wa.me/27651859143" className="mt-4 inline-block text-sm font-semibold text-[#b56cff]">Message EMPIRIAL <ArrowRight className="ml-1 inline h-4 w-4" /></a></div><div><Globe2 className="mb-4 text-[#b56cff]" /><h2 className="text-xl font-semibold">Based in South Africa</h2><p className="mt-3 text-sm leading-7 text-white/50">Working remotely with ambitious businesses locally and globally.</p></div></div></div></div></section></Page>; };
