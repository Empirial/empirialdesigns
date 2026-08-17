import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, type NavigateFunction } from 'react-router-dom';
import '../dashboard-theme.css';
import {
  Archive, ArrowLeft, ArrowRight, Check, CircleHelp, Cloud,
  Code2, Copy, Download, Eye, FileImage, FileText, FolderOpen,
  Github, Globe2, Image as ImageIcon, LayoutDashboard, Library, LifeBuoy, LogOut,
  Menu, MessageCircle, Mic, MoreHorizontal, Palette, PanelLeftClose, PanelLeftOpen, Plus, Rocket,
  Search, Settings, Sparkles, Trash2, Upload, UserRound, Users,
  X, Zap, type LucideIcon
} from 'lucide-react';
import EmpirialIcon from '@/assets/Brand ID/empirial-icon.png';
import BrandIcon from '@/components/BrandIcon';
import BuilderPage from '@/features/builder/pages/BuilderPage';
import GrowthPage from './Growth';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { endMockSession, isMockSession, mockUser } from '@/lib/mockAuth';
import { listUserRepos, type Repo } from '@/features/repositories/lib/repos.service';
import ImportRepoDialog from '@/features/repositories/components/ImportRepoDialog';

type Project = { id: string; name: string; type: string; updated: string; color: string; image?: string };
type BuildMode = 'Website' | 'Poster' | 'Document';

interface HomeProps {
  prompt: string;
  setPrompt: (value: string) => void;
  create: (value?: string) => void;
  navigate: NavigateFunction;
  projects: Project[];
  mode: BuildMode;
  setMode: (mode: BuildMode) => void;
}

interface ScreenProps {
  path: string;
  projects: Project[];
  search: string;
  setSearch: (value: string) => void;
  filter: string;
  setFilter: (value: string) => void;
  navigate: NavigateFunction;
  create: (value?: string) => void;
  showNotice: (text: string) => void;
  userId: string;
  onProjectsChanged: () => void;
}

interface PageIntroProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  action?: string;
  onAction?: () => void;
}

interface UtilityScreenProps {
  path: string;
  connected: Record<string, boolean>;
  setConnected: (value: Record<string, boolean>) => void;
  showNotice: (text: string) => void;
}

// Visuals for projects created from the built-in templates — real projects
// otherwise render with a plain color tile (see mapRepoToProject below).
// Local assets (src/assets/Bakery.webp etc.) turned out to be corrupt —
// each one's actual file content is a WebM video mislabeled with a .webp
// extension, so every <img> using them silently failed to render. These
// picsum.photos seed URLs (deterministic per seed, per redesign-skill's
// placeholder guidance) stand in until real template photography exists.
const TEMPLATE_VISUALS: Record<string, { image: string; color: string }> = {
  template_bakery: { image: 'https://picsum.photos/seed/empirial-bakery/640/480', color: '#185c55' },
  template_coffee: { image: 'https://picsum.photos/seed/empirial-coffee/640/480', color: '#9a6b45' },
  template_food: { image: 'https://picsum.photos/seed/empirial-product-launch/640/480', color: '#2d7080' },
  template_dba: { image: 'https://picsum.photos/seed/empirial-annual-report/640/480', color: '#29263a' },
};

function mapRepoToProject(repo: Repo): Project {
  const visuals = repo.template_id ? TEMPLATE_VISUALS[repo.template_id] : undefined;
  return {
    id: repo.id,
    name: repo.repo_name || 'Untitled project',
    type: repo.type === 'document' ? 'Document' : 'Website',
    updated: new Date(repo.last_updated || repo.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    color: visuals?.color || '#7545db',
    // A real screenshot of the project's own hero section (functions/preview.js)
    // takes priority over the generic per-template stock photo — falls back
    // to that (or the plain color tile) only until the first render lands.
    image: repo.preview_image_url || visuals?.image,
  };
}
const templates = [
  ['Creative agency', 'Websites', 'https://picsum.photos/seed/empirial-agency/640/480', 'A refined, editorial home for ambitious studios.'],
  ['Coffee house', 'Websites', 'https://picsum.photos/seed/empirial-coffee/640/480', 'A warm and inviting online presence for your cafe.'],
  ['Launch your product', 'Websites', 'https://picsum.photos/seed/empirial-product-launch/640/480', 'Build momentum with a focused product launch page.'],
  ['Annual report', 'Documents', 'https://picsum.photos/seed/empirial-annual-report/640/480', 'A polished, data-led document for your next update.'],
  ['Social campaign', 'Images', 'https://picsum.photos/seed/empirial-social/640/480', 'A scroll-stopping visual system for your brand.'],
  ['Consultancy', 'Websites', 'https://picsum.photos/seed/empirial-consultancy/640/480', 'Turn expertise into a clear, confident website.'],
  ['Portfolio grid', 'Websites', 'https://picsum.photos/seed/empirial-portfolio-grid/640/480', 'Showcase your work with a beautiful visual rhythm.'],
  ['Brand moodboard', 'Images', 'https://picsum.photos/seed/empirial-moodboard/640/480', 'Find the right visual language for your next idea.'],
];
const nav = [
  { label: 'Home', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Projects', icon: FolderOpen, path: '/dashboard/projects' },
  { label: 'Templates', icon: Library, path: '/dashboard/templates' },
  { label: 'Assets', icon: ImageIcon, path: '/dashboard/assets' },
];
const moreNav = [
  { label: 'Settings', icon: Settings, path: '/dashboard/settings' },
  { label: 'Help center', icon: CircleHelp, path: '/dashboard/help' },
];

function titleFor(path: string) { return path === '/dashboard' ? 'Home' : nav.concat(moreNav).find((x) => path.startsWith(x.path))?.label || (path.includes('/editor') ? 'Editor' : path.includes('/preview') ? 'Preview' : path.includes('/publish') ? 'Publish' : 'Workspace'); }

export default function Platform() {
  const location = useLocation(); const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [prompt, setPrompt] = useState(() => localStorage.getItem('empirial_pending_prompt') || '');
  const [mobileOpen, setMobileOpen] = useState(false); const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('empirial_sidebar_collapsed') === 'true');
  const [search, setSearch] = useState(''); const [filter, setFilter] = useState('All'); const [notice, setNotice] = useState('');
  const [mode, setMode] = useState<BuildMode>('Website');
  const current = titleFor(location.pathname); const isHome = location.pathname === '/dashboard';
  const contentRef = useRef<HTMLElement>(null);

  const reloadProjects = async (uid: string) => {
    try {
      const repos = await listUserRepos(uid);
      setProjects(repos.map(mapRepoToProject));
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        // Instant Mock Login sets a localStorage flag instead of a real
        // Firebase session (see src/lib/mockAuth.ts) — honor it here so
        // the redirect to /auth doesn't immediately bounce that session out.
        if (isMockSession()) { setUser(mockUser); reloadProjects(mockUser.uid); return; }
        navigate('/auth'); return;
      }
      setUser(currentUser);
      reloadProjects(currentUser.uid);
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => { localStorage.setItem('empirial_sidebar_collapsed', String(sidebarCollapsed)); }, [sidebarCollapsed]);
  useEffect(() => { if (localStorage.getItem('empirial_pending_prompt')) localStorage.removeItem('empirial_pending_prompt'); }, []);
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // search/filter live here (not per-screen) so Projects/Templates/Assets
  // keep working after a mobile sidebar close etc. — but that means they
  // were also leaking between those screens: type something into Assets'
  // search box, then open Projects, and the leftover search text (or a
  // filter chip value from a completely different vocabulary — Templates
  // uses "Websites"/"Documents", Projects uses "Website"/"Document") hid
  // every real project behind a false "No projects found" empty state.
  // Resetting both on every route change keeps each screen's filters scoped
  // to that visit, and also resets scroll position — platform-content is
  // the actual scrolling element (see dashboard-theme.css), so switching
  // screens (e.g. into Templates) previously left it wherever the last
  // screen had scrolled to instead of landing at the top.
  useEffect(() => {
    setSearch('');
    setFilter('All');
    contentRef.current?.scrollTo({ top: 0 });
  }, [location.pathname]);

  const filtered = useMemo(() => projects.filter(p => (filter === 'All' || p.type === filter) && p.name.toLowerCase().includes(search.toLowerCase())), [projects, filter, search]);
  const showNotice = (text: string) => { setNotice(text); window.setTimeout(() => setNotice(''), 2600); };
  const create = (value = prompt) => { if (!value.trim()) return; setPrompt(''); showNotice('Opening your AI build workspace'); navigate(`/dashboard/chat?prompt=${encodeURIComponent(value.trim())}&mode=${mode}`); };
  const handleSignOut = async () => { endMockSession(); await signOut(auth); navigate('/'); };

  if (location.pathname === '/dashboard/chat') return <BuilderPage />;
  const editorMatch = location.pathname.match(/^\/dashboard\/(editor|preview|publish)\/(.+)$/);
  if (editorMatch) return <BuilderPage repoId={editorMatch[2]} />;
  const growthMatch = location.pathname.match(/^\/dashboard\/(?:seo|growth)\/(.+)$/);
  if (growthMatch) return <GrowthPage repoId={growthMatch[1]} navigate={navigate} />;
  if (!user) return null;

  const Sidebar = () => <aside className={`platform-sidebar ${mobileOpen ? 'open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}><div className="sidebar-brand"><Link to="/dashboard" className="flex items-center gap-2.5"><img src={EmpirialIcon} alt="EMPIRIAL" className="brand-image"/><span className="brand-wordmark">EMPIRIAL <span className="text-white/40">AI</span></span></Link><button className="sidebar-toggle" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} aria-label={sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}>{sidebarCollapsed ? <PanelLeftOpen size={17}/> : <PanelLeftClose size={17}/>}</button><button className="md:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={18}/></button></div><nav className="px-3 mt-4 space-y-1" aria-label="Primary navigation">{nav.map(item => <SideLink key={item.path} {...item} active={location.pathname === item.path || (item.label !== 'Home' && location.pathname.startsWith(item.path))}/>)}</nav><div className="sidebar-section-label">Workspace</div><nav className="px-3 space-y-1">{moreNav.map(item => <SideLink key={item.path} {...item} active={location.pathname.startsWith(item.path)}/>)}</nav><div className="mt-auto p-3"><div className="upgrade-card"><div className="flex items-center gap-2 text-sm font-medium"><Zap size={15} className="text-violet-300"/><span>12 credits left</span></div><button onClick={() => navigate('/dashboard/settings?tab=billing')} className="mt-2 text-xs font-medium text-violet-200">Upgrade plan <ArrowRight size={12} className="inline ml-1"/></button></div><div className="profile-row" role="button" tabIndex={0} onClick={() => navigate('/dashboard/settings')} onKeyDown={(e) => { if (e.key === 'Enter') navigate('/dashboard/settings'); }}><span className="avatar">{(user.displayName || user.email || 'U')[0].toUpperCase()}</span><span className="profile-copy min-w-0 text-left"><span className="block text-xs font-medium truncate">{user.displayName || user.email?.split('@')[0]}</span><span className="block truncate text-[10px] text-white/35">{user.email}</span></span><button type="button" onClick={(e) => { e.stopPropagation(); handleSignOut(); }} aria-label="Sign out" className="ml-auto text-white/30 hover:text-white"><LogOut size={16}/></button></div></div></aside>;
  const SideLink = ({ label, icon: Icon, path, active }: { label: string; icon: LucideIcon; path: string; active: boolean }) => <button onClick={() => navigate(path)} className={`side-link ${active ? 'active' : ''}`} title={sidebarCollapsed ? label : undefined}><Icon size={16}/><span>{label}</span></button>;
  return <div className={`platform ${sidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}><Sidebar/><div className="platform-main"><header className="platform-topbar"><button className="md:hidden icon-button" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={19}/></button></header><main className="platform-content" ref={contentRef}>{isHome ? <Home prompt={prompt} setPrompt={setPrompt} create={create} navigate={navigate} projects={projects} mode={mode} setMode={setMode}/> : <Screen path={location.pathname} projects={filtered} search={search} setSearch={setSearch} filter={filter} setFilter={setFilter} navigate={navigate} create={create} showNotice={showNotice} userId={user.uid} onProjectsChanged={() => reloadProjects(user.uid)} />}</main></div>{notice && <div className="toast-notice"><Check size={15}/>{notice}</div>}</div>;
}

function Home({ prompt, setPrompt, create, navigate, projects, mode, setMode }: HomeProps) {
  const modes: { value: BuildMode; label: string }[] = [
    { value: 'Website', label: 'Website' },
    { value: 'Poster', label: 'Image' },
    { value: 'Document', label: 'Document' },
  ];
  return <div className="dashboard-home"><section className="hero-stage"><BrandIcon size={44} className="mx-auto mb-4" /><h2 className="hero-title">Let&apos;s build something with <span>EMPIRIAL</span></h2><p className="hero-copy">Describe what you want to create — a website, an image, or a document — and watch your idea come to life.</p>
    <div className="mx-auto mt-6 flex w-full max-w-3xl justify-center gap-2">
      {modes.map(({ value, label }) => <button type="button" key={value} onClick={() => setMode(value)} className={`rounded-full px-4 py-2 text-sm font-medium transition ${mode === value ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,.15)]' : 'border border-white/12 bg-white/[.04] text-white/55 hover:border-white/25 hover:bg-white/[.09] hover:text-white'}`}>{label}</button>)}
    </div>
    <form onSubmit={e => { e.preventDefault(); create(); }} className="mx-auto mt-4 flex w-full max-w-3xl flex-col rounded-[1.6rem] border border-white/15 bg-white/[.07] p-4 text-left shadow-[0_20px_70px_rgba(0,0,0,.3)] backdrop-blur-2xl transition focus-within:border-[#a855f7]/60 focus-within:bg-white/[.1]">
      <textarea aria-label="Describe what you want to create" value={prompt} onChange={e => setPrompt(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); create(); } }} rows={2} placeholder="Ask EMPIRIAL to build a website that..." className="min-h-[78px] w-full resize-none bg-transparent px-2 pt-1 text-base text-white outline-none placeholder:text-white/35"/>
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/10 pt-3">
        <button type="button" aria-label="Add an attachment" className="grid h-9 w-9 place-items-center rounded-full text-white/45 transition hover:bg-white/10 hover:text-white"><Plus className="h-4 w-4"/></button>
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Use voice input" className="grid h-9 w-9 place-items-center rounded-full text-white/45 transition hover:bg-white/10 hover:text-white"><Mic className="h-4 w-4"/></button>
          <button type="submit" disabled={!prompt.trim()} aria-label="Create project" className="grid h-9 w-9 place-items-center rounded-full bg-white text-black transition hover:bg-[#d9c4ff] disabled:cursor-not-allowed disabled:opacity-30"><ArrowRight className="h-4 w-4"/></button>
        </div>
      </div>
    </form>
    <div className="mt-5 flex flex-wrap justify-center gap-2">
      <button type="button" onClick={() => { setMode('Website'); setPrompt('Create a premium website for my business'); }} className="rounded-full border border-white/10 bg-white/[.04] px-3.5 py-2 text-xs text-white/55 transition hover:border-white/25 hover:bg-white/[.09] hover:text-white">Build a website</button>
      <button type="button" onClick={() => { setMode('Poster'); setPrompt('Generate a bold campaign image'); }} className="rounded-full border border-white/10 bg-white/[.04] px-3.5 py-2 text-xs text-white/55 transition hover:border-white/25 hover:bg-white/[.09] hover:text-white">Generate an image</button>
      <button type="button" onClick={() => { setMode('Document'); setPrompt('Create a polished annual report'); }} className="rounded-full border border-white/10 bg-white/[.04] px-3.5 py-2 text-xs text-white/55 transition hover:border-white/25 hover:bg-white/[.09] hover:text-white">Make a document</button>
    </div>
  </section><section className="home-projects-dock"><div className="dock-toolbar"><div className="dock-tabs"><button className="dock-search"><Search size={16}/> Search</button><button className="selected">My projects</button><button onClick={() => navigate('/dashboard/projects')}>Recently viewed</button><button onClick={() => navigate('/dashboard/templates')}>EMPIRIAL templates</button></div><button onClick={() => navigate('/dashboard/projects')} className="text-button">Browse all <ArrowRight size={14}/></button></div><div className="project-dock-grid">{projects.slice(0, 3).map((p: Project) => <button key={p.id} className="project-dock-card" onClick={() => navigate(`/dashboard/editor/${p.id}`)}><div className="dock-card-image" style={{background:p.color}}>{p.image && <img src={p.image} alt=""/>}<span>{p.type}</span></div><div className="dock-card-copy"><span className="block text-sm font-medium">{p.name}</span><span className="block text-[11px] text-white/38">{p.updated}</span></div></button>)}</div></section></div> }
function ProjectRow({ project, onClick }: { project: Project; onClick: () => void }) { return <button className="project-row" onClick={onClick}><div className="project-thumb" style={{ background: project.color }}>{project.image && <img src={project.image} alt=""/>}</div><span className="min-w-0 flex-1 text-left"><span className="block truncate text-sm font-medium">{project.name}</span><span className="block text-[11px] text-white/35">{project.type} · {project.updated}</span></span><ArrowRight size={15} className="text-white/25"/></button> }


function Screen({ path, projects, search, setSearch, filter, setFilter, navigate, create, showNotice, userId, onProjectsChanged }: ScreenProps) { const isTemplates = path.endsWith('/templates'); const isAssets = path.endsWith('/assets'); const [connected, setConnected] = useState<Record<string, boolean>>({});
  if (isAssets) return <div className="page-wide"><PageIntro icon={ImageIcon} title="Assets" subtitle="Everything your brand needs, in one place." action="Upload asset" onAction={() => showNotice('Asset uploaded to your library')}/><div className="filter-bar"><Search size={16}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search assets..."/><div className="chip-row ml-auto">{['All','Images','Logos','Colors','Fonts','Files'].map(x => <button className={filter === x ? 'active' : ''} key={x} onClick={() => setFilter(x)}>{x}</button>)}</div></div><div className="asset-grid">{['Brand mark','Coffee hero','Warm palette','Pitchly icon','Team photo','Font family'].map((x,i) => <div className="asset-card" key={x}><div className="asset-preview" style={{background: i===2 ? 'linear-gradient(120deg,#d4aa7e,#6b3e35)' : i===5 ? '#f1eee8' : ['#a855f7','#713f12','#0f766e','#512da8','#334155'][i%5]}}>{i===5 ? <span className="font-preview">Aa</span> : <ImageIcon size={22}/>}</div><div className="flex items-center justify-between"><span className="text-sm">{x}</span><button aria-label={`More actions for ${x}`} className="icon-button"><MoreHorizontal size={15}/></button></div><p className="text-[11px] text-white/35">{i%2 ? 'PNG · 2.4 MB' : 'Brand library'}</p></div>)}</div></div>;
  if (isTemplates) return <div className="page-wide"><PageIntro icon={Library} title="Templates" subtitle="Start from a proven foundation, then make it yours."/><div className="chip-row mb-6">{['All','Websites','Images','Documents'].map(x => <button className={filter === x ? 'active' : ''} key={x} onClick={() => setFilter(x)}>{x}</button>)}</div><div className="template-grid">{templates.filter(t => filter === 'All' || t[1] === filter).map(t => <div className="template-card" key={t[0]}><img src={t[2] as string} alt=""/><div className="p-4"><div className="flex items-start justify-between"><div><h3 className="text-sm font-semibold">{t[0]}</h3><p className="mt-1 text-[11px] text-white/40">{t[1]}</p></div><button className="icon-button"><MoreHorizontal size={15}/></button></div><p className="mt-3 text-xs leading-relaxed text-white/50">{t[3]}</p><button className="primary-button mt-4 w-full" onClick={() => create(`Create ${t[0]}`)}>Use template <ArrowRight size={14}/></button></div></div>)}</div></div>;
  if (path.includes('/billing') || path.includes('/integrations') || path.includes('/settings') || path.includes('/help')) return <UtilityScreen path={path} connected={connected} setConnected={setConnected} showNotice={showNotice}/>;
  return <div className="page-wide"><PageIntro icon={FolderOpen} title="Projects" subtitle="Your ideas, drafts and finished work." action="New project" onAction={() => navigate('/dashboard')}/><div className="filter-bar"><Search size={16}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects..."/><div className="chip-row ml-auto">{['All','Website','Image','Document'].map(x => <button className={filter === x ? 'active' : ''} key={x} onClick={() => setFilter(x)}>{x === 'Website' ? 'Websites' : x + (x === 'All' ? '' : 's')}</button>)}</div><ImportRepoDialog userId={userId} onImported={onProjectsChanged} /></div>{projects.length ? <div className="project-grid">{projects.map((p: Project) => <div className="project-card" key={p.id}><div className="project-card-image" style={{background:p.color}}>{p.image && <img src={p.image} alt=""/>}<span className="project-type">{p.type}</span></div><div className="p-4 flex items-center"><div><h3 className="text-sm font-semibold">{p.name}</h3><p className="mt-1 text-[11px] text-white/35">Updated {p.updated}</p></div><button onClick={() => navigate(`/dashboard/editor/${p.id}`)} className="ml-auto icon-button" aria-label={`Open ${p.name}`}><ArrowRight size={16}/></button></div></div>)}</div> : <div className="empty-state"><FolderOpen size={28}/><h3>No projects found</h3><p>Try a different search or start a new project.</p></div>}</div> }

function PageIntro({ icon: Icon, title, subtitle, action, onAction }: PageIntroProps) { return <div className="page-intro"><div><div className="eyebrow"><Icon size={13}/> EMPIRIAL WORKSPACE</div><h2 className="page-title">{title}</h2><p className="page-subtitle">{subtitle}</p></div>{action && <button className="primary-button" onClick={onAction}><Plus size={16}/>{action}</button>}</div> }
function UtilityScreen({ path, connected, setConnected, showNotice }: UtilityScreenProps) {
  const kind = path.split('/').pop();
  const location = useLocation();
  // Hooks must run unconditionally, so settingsTab is computed before the
  // 'help' early return even though only the settings screens use it.
  const tabFromQuery = new URLSearchParams(location.search).get('tab');
  const initialTab = kind === 'billing' ? 'Billing' : kind === 'integrations' ? 'Integrations' : tabFromQuery === 'billing' ? 'Billing' : tabFromQuery === 'integrations' ? 'Integrations' : 'Profile';
  const [settingsTab, setSettingsTab] = useState(initialTab);
  const tabs = ['Profile', 'Billing', 'Integrations'];

  if (kind === 'help') return <div className="page-narrow"><div className="help-hero"><div className="assistant-icon mx-auto"><LifeBuoy size={21}/></div><h2 className="page-title mt-4">How can we help?</h2><p className="page-subtitle">Find answers, learn the craft, or ask the community.</p><div className="help-search"><Search size={17}/><input placeholder="Search the help center..."/></div></div><div className="help-topics">{['Getting started','Creating your first website','Working with the AI editor','Publishing your project','Billing and credits','Account settings'].map(x => <button key={x}><CircleHelp size={17}/><span>{x}</span><ArrowRight size={14}/></button>)}</div></div>;

  return <div className={settingsTab === 'Integrations' ? 'page-wide' : 'page-narrow'}>
    <PageIntro icon={Settings} title="Settings" subtitle="Make the workspace, your billing, and your connections feel like yours."/>
    <div className="generator-tabs">{tabs.map(t => <button key={t} className={settingsTab === t ? 'selected' : ''} onClick={() => setSettingsTab(t)}>{t}</button>)}</div>
    {settingsTab === 'Profile' && <div className="panel settings-panel">{[['Profile name','Empirial Studio'],['Email address','demo@empirial.com'],['Workspace URL','empirial.ai/studio']].map(([label,value]) => <label className="setting-field" key={label}>{label}<input defaultValue={value}/></label>)}<div className="setting-field"><span>Interface theme</span><div className="theme-options"><button className="theme-choice selected">Dark</button><button className="theme-choice">Light</button><button className="theme-choice">System</button></div></div><button className="primary-button" onClick={() => showNotice('Settings saved successfully')}><Check size={15}/> Save changes</button></div>}
    {settingsTab === 'Billing' && <div className="panel settings-panel"><div className="plan-head"><div><p className="eyebrow">CURRENT PLAN</p><h3 className="text-2xl font-semibold mt-2">Free <span className="text-sm text-white/35">/ month</span></h3></div><button className="primary-button" onClick={() => showNotice('Upgrade options opened')}>Upgrade plan</button></div>{['Websites','Images','Documents','AI credits'].map((x,i) => <div className="usage-row" key={x}><div className="flex justify-between text-sm"><span>{x}</span><span className="text-white/40">{i===3?'88':'2'} / {i===3?'100':'5'}</span></div><div className="usage-track"><span style={{width:`${[40,25,20,88][i]}%`}}/></div></div>)}</div>}
    {settingsTab === 'Integrations' && <div className="integration-grid">{([['GitHub',Github,'Import and sync your projects.'],['Canva',Palette,'Bring your brand assets into EMPIRIAL.'],['Firebase',Cloud,'Connect your backend services.'],['Google Drive',FolderOpen,'Store and export your files.'],['Webhooks',Code2,'Send events to your own tools.'],['Custom domain',Globe2,'Publish to a domain you own.']] as [string, LucideIcon, string][]).map(([name,Icon,desc]) => <div className="integration-card" key={name}><div className="integration-icon"><Icon size={18}/></div><h3 className="mt-4 text-sm font-semibold">{name}</h3><p className="mt-2 text-xs leading-relaxed text-white/40">{desc}</p><button className={connected[name] ? 'connected-button' : 'secondary-button'} onClick={() => { setConnected({...connected,[name]:!connected[name]}); showNotice(connected[name] ? `${name} disconnected` : `${name} connected`); }}>{connected[name] ? <><Check size={14}/> Connected</> : 'Connect'}</button></div>)}</div>}
  </div>;
}
