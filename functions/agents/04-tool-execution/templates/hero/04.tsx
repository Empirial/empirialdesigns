export default function Hero() {
  return (
    <section className="bg-background">
      <div className="mx-auto flex max-w-5xl flex-col items-center px-4 py-20 text-center sm:py-24 lg:py-28">
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          {{HEADLINE}}
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
          {{SUBHEADING}}
        </p>
        <img
          src="{{IMAGE_URL}}"
          alt="{{IMAGE_ALT}}"
          className="mt-10 aspect-video w-full rounded-lg border border-border object-cover"
        />
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
