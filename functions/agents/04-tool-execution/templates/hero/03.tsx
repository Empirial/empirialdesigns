export default function Hero() {
  return (
    <section
      className="relative flex min-h-[32rem] items-center justify-center bg-cover bg-center sm:min-h-[36rem] lg:min-h-[44rem]"
      style={{ backgroundImage: `url({{IMAGE_URL}})` }}
      role="img"
      aria-label="{{IMAGE_ALT}}"
    >
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-4 py-20 text-center">
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
