import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react';
import { useLinkPreview } from '@/features/marketing/lib/linkPreview';

export type CoverflowProject = {
  title: string;
  category: string;
  type: string;
  image: string;
  url?: string;
};

const CARD_W = 320;
const CARD_H = 400;
const GAP = 24;
const STEP = CARD_W + GAP;

// Coverflow-style horizontal gallery: the card nearest the viewport centre
// sits at full size/opacity, neighbours shrink and fade the further they
// are from centre. Pure CSS scroll-snap + a scroll-linked transform pass —
// no animation library, no WebGL. Style is set directly on the card refs
// (not via React state) so it updates every scroll frame without a
// re-render per tick.
export default function PortfolioCoverflow({ projects }: { projects: CoverflowProject[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const applyTransforms = () => {
      const trackRect = track.getBoundingClientRect();
      const viewportCenter = trackRect.left + trackRect.width / 2;
      cardRefs.current.forEach((card) => {
        if (!card) return;
        const cardRect = card.getBoundingClientRect();
        const cardCenter = cardRect.left + cardRect.width / 2;
        const distance = Math.abs(cardCenter - viewportCenter);
        const normalized = Math.min(distance / STEP, 1.6);
        const scale = 1 - normalized * 0.16;
        const opacity = 1 - normalized * 0.55;
        card.style.transform = `scale(${scale})`;
        card.style.opacity = String(Math.max(0.35, opacity));
      });
    };

    // Side padding so the first/last card can each reach dead centre.
    const applyPadding = () => {
      const pad = Math.max(16, (track.clientWidth - CARD_W) / 2);
      track.style.paddingLeft = `${pad}px`;
      track.style.paddingRight = `${pad}px`;
    };

    applyPadding();
    applyTransforms();

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { applyTransforms(); ticking = false; });
    };

    const onResize = () => { applyPadding(); applyTransforms(); };

    track.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      track.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
    // Re-run when the visible project set changes (filter switch) so
    // padding/transforms match the new, shorter or longer, track.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects]);

  const scrollByStep = (dir: 1 | -1) => {
    trackRef.current?.scrollBy({ left: dir * STEP, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ gap: GAP }}
      >
        {projects.map((project, i) => (
          <CoverflowCard
            key={project.title}
            project={project}
            innerRef={(el) => { cardRefs.current[i] = el; }}
          />
        ))}
      </div>

      <button
        type="button"
        aria-label="Previous project"
        onClick={() => scrollByStep(-1)}
        className="absolute left-2 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-[#07070c]/80 text-white/70 shadow-xl backdrop-blur-xl transition hover:border-white/30 hover:text-white sm:flex"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        aria-label="Next project"
        onClick={() => scrollByStep(1)}
        className="absolute right-2 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-[#07070c]/80 text-white/70 shadow-xl backdrop-blur-xl transition hover:border-white/30 hover:text-white sm:flex"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}

const CoverflowCard = ({ project, innerRef }: { project: CoverflowProject; innerRef: (el: HTMLDivElement | null) => void }) => {
  // Cast: which of the two tags (`a`/`div`) we're rendering is only known
  // at runtime, and they don't share a props type to spread against.
  const Wrapper = (project.url ? 'a' : 'div') as any;
  const wrapperProps = project.url ? { href: project.url, target: '_blank', rel: 'noreferrer' } : {};

  // Live SEO metadata pulled off project.url (see functions/index.js's
  // fetchLinkPreview) — falls back to the curated copy below until it
  // resolves, or forever if the target site has none / is unreachable.
  const preview = useLinkPreview(project.url);
  const [faviconFailed, setFaviconFailed] = useState(false);
  const description = preview?.description || project.type;

  return (
    <div
      ref={innerRef}
      className="group relative shrink-0 snap-center overflow-hidden rounded-[28px] border border-white/10 bg-white/[.03] shadow-[0_20px_60px_rgba(0,0,0,.4)] transition-transform duration-300 ease-out"
      style={{ width: CARD_W, height: CARD_H }}
    >
      <Wrapper {...wrapperProps} className="absolute inset-0 block">
        <img src={project.image} alt={`${project.title} project`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

        {/* Site favicon, pulled live from the URL's own SEO metadata —
            sits up front on the card like a link-preview chip. */}
        {preview?.favicon && !faviconFailed && (
          <span className="absolute left-4 top-4 grid h-8 w-8 place-items-center rounded-[10px] bg-white/95 shadow-lg ring-1 ring-black/10">
            <img src={preview.favicon} alt="" className="h-[18px] w-[18px] object-contain" onError={() => setFaviconFailed(true)} />
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-white">{project.title}</h3>
            <p className="mt-1 line-clamp-2 text-xs leading-snug text-white/55">{description}</p>
          </div>
          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border transition ${project.url ? 'border-white/25 bg-white/10 text-white group-hover:border-white/40 group-hover:bg-white/20' : 'border-white/10 bg-white/5 text-white/30'}`}>
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </Wrapper>
    </div>
  );
};
