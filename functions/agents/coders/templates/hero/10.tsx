export default function Hero() {
  return (
    <section className="bg-background">
      <div className="mx-auto flex max-w-3xl flex-col items-center px-6 py-28 text-center sm:py-36">
        <span className="mb-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {{EYEBROW}}
        </span>
        <h1
          className="text-balance text-5xl font-semibold leading-[1.05] tracking-[-0.03em] text-foreground sm:text-6xl lg:text-7xl"
          style={{ textWrap: "balance" }}
        >
          {{HEADLINE}}
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
          {{SUBHEADING}}
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <a
            href="{{CTA_HREF}}"
            className="inline-flex items-center justify-center rounded-full bg-primary px-7 py-3 text-[15px] font-semibold text-primary-foreground transition-transform duration-150 ease-out hover:opacity-90 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {{CTA_TEXT}}
          </a>
          <a
            href="{{SECONDARY_CTA_HREF}}"
            className="inline-flex items-center gap-1 text-[15px] font-medium text-foreground transition-opacity duration-150 hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
          >
            {{SECONDARY_CTA_TEXT}}
            <span aria-hidden="true">›</span>
          </a>
        </div>
      </div>
    </section>
  );
}
