export default function Hero() {
  return (
    <section
      className="relative flex min-h-[32rem] items-center bg-cover bg-center px-4 py-20 sm:min-h-[36rem] lg:min-h-[40rem]"
      style={{ backgroundImage: `url({{IMAGE_URL}})` }}
      role="img"
      aria-label="{{IMAGE_ALT}}"
    >
      <div className="absolute inset-0 bg-background/40" />
      <div className="relative z-10 mx-auto w-full max-w-md rounded-lg border border-border bg-card p-8 text-card-foreground shadow-lg sm:p-10">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {{HEADLINE}}
        </h1>
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">
          {{SUBHEADING}}
        </p>
        <a
          href="{{CTA_HREF}}"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-base font-semibold text-primary-foreground transition-colors hover:opacity-90"
        >
          {{CTA_TEXT}}
        </a>
      </div>
    </section>
  );
}
