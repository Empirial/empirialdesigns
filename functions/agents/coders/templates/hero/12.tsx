export default function Hero() {
  return (
    <section className="bg-background">
      <div className="mx-auto flex max-w-2xl flex-col items-start px-6 py-24 sm:py-32">
        <span className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
          {{EYEBROW}}
        </span>
        <h1 className="mt-5 text-4xl font-medium leading-[1.15] tracking-[-0.01em] text-foreground sm:text-5xl">
          {{HEADLINE}}
        </h1>
        <p className="mt-6 max-w-lg text-base leading-[1.75] text-muted-foreground">
          {{SUBHEADING}}
        </p>
        <a
          href="{{CTA_HREF}}"
          className="mt-9 inline-flex items-center gap-2 border-b border-foreground pb-1 text-sm font-medium text-foreground transition-opacity duration-150 hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
        >
          {{CTA_TEXT}}
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </section>
  );
}
