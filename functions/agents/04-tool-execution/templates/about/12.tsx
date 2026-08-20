export default function About() {
  return (
    <section className="bg-background py-24">
      <div className="mx-auto max-w-2xl px-6">
        <h2 className="text-2xl font-medium leading-snug tracking-[-0.01em] text-foreground">
          {{HEADING}}
        </h2>
        <p className="mt-8 text-base leading-[1.8] text-muted-foreground">
          {{BODY_PARAGRAPH_1}}
        </p>
        <p className="mt-6 text-base leading-[1.8] text-muted-foreground">
          {{BODY_PARAGRAPH_2}}
        </p>
      </div>
    </section>
  );
}
