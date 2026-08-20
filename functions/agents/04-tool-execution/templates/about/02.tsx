export default function About() {
  return (
    <section className="bg-background py-16 md:py-24">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 md:grid-cols-2 md:gap-16 md:px-8">
        <div>
          <img
            src="{{IMAGE_URL}}"
            alt="{{IMAGE_ALT}}"
            className="aspect-[4/3] w-full rounded-lg border border-border object-cover"
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
