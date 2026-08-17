export default function About() {
  return (
    <section className="bg-background py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-6 md:px-8">
        <div className="mx-auto max-w-2xl text-center">
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

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-6 text-card-foreground">
            <h3 className="text-lg font-semibold text-foreground">{{VALUE_1_TITLE}}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {{VALUE_1_TEXT}}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-6 text-card-foreground">
            <h3 className="text-lg font-semibold text-foreground">{{VALUE_2_TITLE}}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {{VALUE_2_TEXT}}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-6 text-card-foreground">
            <h3 className="text-lg font-semibold text-foreground">{{VALUE_3_TITLE}}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {{VALUE_3_TEXT}}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
