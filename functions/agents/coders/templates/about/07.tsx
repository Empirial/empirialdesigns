export default function About() {
  return (
    <section
      className="relative bg-background bg-cover bg-center py-24 md:py-36"
      style={{ backgroundImage: 'url({{IMAGE_URL}})' }}
    >
      <div aria-hidden="true" className="absolute inset-0 bg-foreground/60" />
      <span className="sr-only">{{IMAGE_ALT}}</span>
      <div className="relative mx-auto max-w-3xl px-6 md:px-8">
        <div className="rounded-lg bg-background/90 p-8 backdrop-blur-sm md:p-12">
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {{HEADING}}
          </h2>
          <p className="mt-6 text-base leading-relaxed text-muted-foreground md:text-lg">
            {{BODY_PARAGRAPH_1}}
          </p>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
            {{BODY_PARAGRAPH_2}}
          </p>
        </div>
      </div>
    </section>
  );
}
