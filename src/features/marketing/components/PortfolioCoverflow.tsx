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

// Coverflow-style horizontal gallery: the card nearest the viewport centre
// sits at full size/opacity, neighbours shrink and fade the further they
// are from centre. Pure CSS scroll-snap + a scroll-linked transform pass —
// no animation library, no WebGL. Style is set directly on the card refs
// (not via React state) so it updates every scroll frame without a
// re-render per tick. Card width is fluid (see .coverflow-card in the
// style block below) rather than a fixed px constant, so "step" and
// "active card" are measured off the actual rendered card each time.
export default function PortfolioCoverflow({ projects }: { projects: CoverflowProject[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const applyTransforms = () => {
      const trackRect = track.getBoundingClientRect();
      const viewportCenter = trackRect.left + trackRect.width / 2;
      const step = (cardRefs.current[0]?.getBoundingClientRect().width ?? 0) + GAP_PX;
      let nearestIndex = 0;
      let nearestDistance = Infinity;

      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        const cardRect = card.getBoundingClientRect();
        const cardCenter = cardRect.left + cardRect.width / 2;
        const distance = Math.abs(cardCenter - viewportCenter);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
        const normalized = step > 0 ? Math.min(distance / step, 1.6) : 0;
        const scale = 1 - normalized * 0.16;
        const opacity = 1 - normalized * 0.55;
        card.style.transform = `scale(${scale})`;
        card.style.opacity = String(Math.max(0.35, opacity));
      });

      setActiveIndex((prev) => (prev === nearestIndex ? prev : nearestIndex));
    };

    // Side padding so the first/last card can each reach dead centre.
    const applyPadding = () => {
      const cardWidth = cardRefs.current[0]?.getBoundingClientRect().width ?? 0;
      const pad = Math.max(16, (track.clientWidth - cardWidth) / 2);
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
    const step = (cardRefs.current[0]?.getBoundingClientRect().width ?? 0) + GAP_PX;
    trackRef.current?.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  const scrollToIndex = (index: number) => {
    const card = cardRefs.current[index];
    if (!card || !trackRef.current) return;
    const trackRect = trackRef.current.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const delta = (cardRect.left + cardRect.width / 2) - (trackRect.left + trackRect.width / 2);
    trackRef.current.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className="coverflow-track flex snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ gap: GAP_PX }}
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

      {projects.length > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2" role="tablist" aria-label="Portfolio pagination">
          {projects.map((project, i) => (
            <button
              key={project.title}
              type="button"
              role="tab"
              aria-selected={i === activeIndex}
              aria-label={`Show ${project.title}`}
              onClick={() => scrollToIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === activeIndex ? 'w-6 bg-[#a855f7]' : 'w-1.5 bg-white/20 hover:bg-white/35'}`}
            />
          ))}
        </div>
      )}

      {/* Fluid card width: roomy and cinematic on desktop, still nearly
          full-bleed on mobile — replaces the old fixed 320px card so the
          gallery reads as one long sliding strip rather than a stack of
          small tiles. */}
      <style>{`
        .coverflow-card { width: clamp(280px, 72vw, 860px); height: clamp(240px, 30vw, 360px); }
      `}</style>
    </div>
  );
}

const GAP_PX = 20;

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
      className="coverflow-card group relative shrink-0 snap-center overflow-hidden rounded-[28px] border border-white/10 bg-white/[.03] shadow-[0_20px_60px_rgba(0,0,0,.4)] transition-transform duration-300 ease-out"
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

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5 sm:p-7">
          <div className="min-w-0">
            <h3 className="truncate text-xl font-semibold text-white sm:text-2xl">{project.title}</h3>
            <p className="mt-1.5 line-clamp-2 max-w-md text-sm leading-snug text-white/55">{description}</p>
          </div>
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border transition ${project.url ? 'border-white/25 bg-white/10 text-white group-hover:border-white/40 group-hover:bg-white/20' : 'border-white/10 bg-white/5 text-white/30'}`}>
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </Wrapper>
    </div>
  );
};
