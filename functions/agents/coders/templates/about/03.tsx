export default function About() {
  return (
    <section className="bg-background py-16 md:py-24">
      <div className="mx-auto max-w-3xl px-6 text-center md:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          {{HEADING}}
        </h2>
        <p className="mt-6 text-base leading-relaxed text-muted-foreground md:text-lg">
          {{BODY_PARAGRAPH_1}}
        </p>
        <blockquote className="mx-auto my-10 max-w-2xl border-l-4 border-accent pl-6 text-left">
          <p className="text-xl italic leading-relaxed text-foreground md:text-2xl">
            {{PULL_QUOTE}}
          </p>
        </blockquote>
        <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
          {{BODY_PARAGRAPH_2}}
        </p>
      </div>
    </section>
  );
}
