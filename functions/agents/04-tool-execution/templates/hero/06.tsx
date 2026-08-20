export default function Hero() {
  return (
    <section className="bg-background">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 py-20 sm:py-24 lg:grid-cols-2 lg:gap-16 lg:py-28">
        <div>
          <img
            src="{{IMAGE_URL}}"
            alt="{{IMAGE_ALT}}"
            className="aspect-[4/3] w-full rounded-lg border border-border object-cover"
          />
        </div>
        <div className="flex flex-col items-start text-left">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            {{HEADLINE}}
          </h1>
          <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
            {{SUBHEADING}}
          </p>
          <a
            href="{{CTA_HREF}}"
            className="mt-8 inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-base font-semibold text-primary-foreground transition-colors hover:opacity-90"
          >
            {{CTA_TEXT}}
          </a>
        </div>
      </div>
    </section>
  );
}
