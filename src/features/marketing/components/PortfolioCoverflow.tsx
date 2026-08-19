import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react';

export type CoverflowProject = {
  title: string;
  category: string;
  type: string;
  image: string;
  url?: string;
};

const getVisibleOffset = (index: number, activeIndex: number, length: number) => {
  let offset = index - activeIndex;
  if (offset > length / 2) offset -= length;
  if (offset < -length / 2) offset += length;
  return offset;
};

// Card width per breakpoint, kept in sync with the Tailwind width classes
// below — the peek offset is derived from these so the side cards always
// show a consistent, deliberate sliver rather than the ~0.94x-width shift
// this used to compute (which left almost nothing peeking on mobile).
const CARD_WIDTH = { base: 208, sm: 258, lg: 300 };
const PEEK_FACTOR = 0.66;

const useBreakpoint = () => {
  const [width, setWidth] = useState(typeof window === 'undefined' ? 1280 : window.innerWidth);
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return width < 640 ? 'base' : width < 1024 ? 'sm' : 'lg';
};

const DOT_WINDOW = 7;

export default function PortfolioCoverflow({ projects }: { projects: CoverflowProject[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const breakpoint = useBreakpoint();
  const activeProject = projects[activeIndex];

  useEffect(() => {
    setActiveIndex(0);
  }, [projects]);

  if (!activeProject) return null;

  const move = (direction: 1 | -1) => setActiveIndex((current) => (current + direction + projects.length) % projects.length);

  const cardWidth = CARD_WIDTH[breakpoint];
  const step = cardWidth * PEEK_FACTOR;

  const dotCount = Math.min(projects.length, DOT_WINDOW);
  const dotStart = projects.length <= DOT_WINDOW ? 0 : Math.min(Math.max(activeIndex - Math.floor(DOT_WINDOW / 2), 0), projects.length - DOT_WINDOW);

  return (
    <div className="mx-auto max-w-[1440px] overflow-hidden px-3 sm:px-6">
      <div className="relative h-[300px] sm:h-[400px] lg:h-[460px]" aria-label="Portfolio gallery">
        {projects.map((project, index) => {
          const offset = getVisibleOffset(index, activeIndex, projects.length);
          const distance = Math.abs(offset);
          const isActive = offset === 0;
          const isVisible = distance <= 2;
          return (
            <button
              key={project.title}
              type="button"
              aria-label={`Show ${project.title}`}
              aria-current={isActive ? 'true' : undefined}
              onClick={() => setActiveIndex(index)}
              className="absolute left-1/2 top-2 h-[268px] w-[208px] -translate-x-1/2 overflow-hidden rounded-[20px] border border-black/10 bg-white shadow-2xl transition-[transform,opacity,filter] duration-500 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b56cff] dark:border-white/10 dark:bg-[#11111a] sm:top-4 sm:h-[340px] sm:w-[258px] sm:rounded-[26px] lg:h-[390px] lg:w-[300px]"
              style={{
                opacity: isVisible ? 1 : 0,
                pointerEvents: isVisible ? 'auto' : 'none',
                zIndex: 10 - distance,
                transform: `translateX(calc(-50% + ${offset * step}px)) scale(${isActive ? 1 : distance === 1 ? 0.86 : 0.74})`,
                filter: isActive ? 'none' : 'brightness(.68) saturate(.75)',
              }}
            >
              <img src={project.image} alt="" className="h-full w-full object-cover" />
              <span className={`absolute inset-0 bg-gradient-to-t from-[#050508]/80 via-transparent to-transparent transition-opacity ${isActive ? 'opacity-100' : 'opacity-40'}`} />
              <span className={`absolute inset-x-0 bottom-0 p-4 text-left transition-opacity sm:p-5 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
                <span className="block text-base font-semibold text-white sm:text-lg">{project.title}</span>
                <span className="mt-1 block text-xs text-white/60">{project.category}</span>
              </span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => move(-1)}
          aria-label="Previous project"
          className="absolute left-1 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-[#191521]/80 text-white shadow-lg backdrop-blur-md transition hover:bg-[#191521] active:scale-95 dark:bg-white/90 dark:text-black dark:hover:bg-white sm:left-3 sm:h-12 sm:w-12"
        >
          <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
        <button
          type="button"
          onClick={() => move(1)}
          aria-label="Next project"
          className="absolute right-1 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-[#191521]/80 text-white shadow-lg backdrop-blur-md transition hover:bg-[#191521] active:scale-95 dark:bg-white/90 dark:text-black dark:hover:bg-white sm:right-3 sm:h-12 sm:w-12"
        >
          <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </div>

      <div className="mt-5 flex flex-col items-center gap-4 text-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-[#7c2cff] dark:text-[#b56cff]">{activeProject.category}</p>
          <p className="mt-2 text-sm text-[#191521]/50 dark:text-white/50">{activeProject.type}</p>
          {activeProject.url && (
            <a href={activeProject.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#191521] transition hover:text-[#7c2cff] dark:text-white dark:hover:text-[#c997ff]">
              Visit project <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {Array.from({ length: dotCount }, (_, i) => dotStart + i).map((index) => {
            const isActiveDot = index === activeIndex;
            return (
              <button
                key={index}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Go to ${projects[index].title}`}
                aria-current={isActiveDot ? 'true' : undefined}
                className={`h-1.5 rounded-full transition-all duration-300 ${isActiveDot ? 'w-6 bg-[#8138ff]' : 'w-1.5 bg-black/15 hover:bg-black/30 dark:bg-white/20 dark:hover:bg-white/35'}`}
              />
            );
          })}
        </div>
        <span className="text-xs tabular-nums text-[#191521]/35 dark:text-white/35">
          {String(activeIndex + 1).padStart(2, '0')} / {String(projects.length).padStart(2, '0')}
        </span>
      </div>
    </div>
  );
}
