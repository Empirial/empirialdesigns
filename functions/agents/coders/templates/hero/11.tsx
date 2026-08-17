export default function Hero() {
  return (
    <section className="border-b-2 border-foreground bg-background">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <span className="inline-block border-2 border-foreground bg-[#FFE100] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-foreground">
          {{EYEBROW}}
        </span>
        <h1 className="mt-6 max-w-4xl text-5xl font-extrabold uppercase leading-[0.95] tracking-tight text-foreground sm:text-7xl">
          {{HEADLINE}}
        </h1>
        <p className="mt-6 max-w-xl border-l-2 border-foreground pl-4 text-lg font-medium leading-relaxed text-foreground">
          {{SUBHEADING}}
        </p>
        <a
          href="{{CTA_HREF}}"
          className="mt-10 inline-flex items-center justify-center border-2 border-foreground bg-foreground px-8 py-4 text-base font-bold uppercase tracking-wide text-background shadow-[6px_6px_0_0_hsl(var(--foreground))] transition-all duration-100 ease-out hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[7px_7px_0_0_hsl(var(--foreground))] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {{CTA_TEXT}}
        </a>
      </div>
    </section>
  );
}
