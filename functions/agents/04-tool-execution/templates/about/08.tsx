export default function About() {
  return (
    <section className="bg-background py-16 md:py-24">
      <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-10 px-6 md:grid-cols-[minmax(0,280px)_1fr] md:gap-16 md:px-8">
        <div className="flex justify-center md:justify-start">
          <img
            src="{{IMAGE_URL}}"
            alt="{{IMAGE_ALT}}"
            className="h-48 w-48 rounded-full border border-border object-cover md:h-64 md:w-64"
          />
        </div>
        <div>
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
