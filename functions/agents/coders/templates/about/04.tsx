export default function About() {
  return (
    <section className="bg-background py-16 md:py-24">
      <div className="mx-auto max-w-4xl px-6 text-center md:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          {{HEADING}}
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
          {{BODY_PARAGRAPH_1}}
        </p>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
          {{BODY_PARAGRAPH_2}}
        </p>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-card px-6 py-8 text-card-foreground">
            <p className="text-4xl font-bold text-primary md:text-5xl">{{STAT_1_NUMBER}}</p>
            <p className="mt-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
              {{STAT_1_LABEL}}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card px-6 py-8 text-card-foreground">
            <p className="text-4xl font-bold text-primary md:text-5xl">{{STAT_2_NUMBER}}</p>
            <p className="mt-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
              {{STAT_2_LABEL}}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card px-6 py-8 text-card-foreground">
            <p className="text-4xl font-bold text-primary md:text-5xl">{{STAT_3_NUMBER}}</p>
            <p className="mt-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
              {{STAT_3_LABEL}}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
