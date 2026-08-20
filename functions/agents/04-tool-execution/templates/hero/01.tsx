export default function Hero() {
  return (
    <section className="bg-background">
      <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-20 text-center sm:py-28 lg:py-32">
        <span className="mb-4 rounded-full border border-border bg-muted px-4 py-1 text-sm font-medium text-muted-foreground">
          {{EYEBROW}}
        </span>
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          {{HEADLINE}}
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground sm:text-xl">
          {{SUBHEADING}}
        </p>
        <a
          href="{{CTA_HREF}}"
          className="mt-8 inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-base font-semibold text-primary-foreground transition-colors hover:opacity-90"
        >
          {{CTA_TEXT}}
        </a>
      </div>
    </section>
  );
}
