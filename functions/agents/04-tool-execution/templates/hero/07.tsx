export default function Hero() {
  return (
    <section className="bg-background">
      <div className="mx-auto flex max-w-4xl flex-col items-start px-4 py-20 text-left sm:py-24 lg:py-28">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          {{HEADLINE}}
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
          {{SUBHEADING}}
        </p>
        <a
          href="{{CTA_HREF}}"
          className="mt-8 inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-base font-semibold text-primary-foreground transition-colors hover:opacity-90"
        >
          {{CTA_TEXT}}
        </a>
        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-border pt-6">
          <span className="rounded-md bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
            {{BADGE_1_TEXT}}
          </span>
          <span className="rounded-md bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
            {{BADGE_2_TEXT}}
          </span>
        </div>
      </div>
    </section>
  );
}
