export default function About() {
  return (
    <section className="bg-background py-16 md:py-24">
      <div className="mx-auto max-w-4xl px-6 md:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {{HEADING}}
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            {{BODY_PARAGRAPH_1}}
          </p>
        </div>

        <div className="relative mt-16">
          <div
            aria-hidden="true"
            className="absolute left-4 top-0 h-full w-px bg-border md:left-1/2 md:-translate-x-1/2"
          />

          <ol className="space-y-12">
            <li className="relative flex flex-col gap-2 pl-12 md:grid md:grid-cols-2 md:gap-8 md:pl-0">
              <div className="absolute left-4 top-1 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-primary bg-background md:left-1/2" />
              <div className="md:pr-8 md:text-right">
                <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                  {{MILESTONE_1_YEAR}}
                </p>
                <p className="mt-1 text-base leading-relaxed text-muted-foreground">
                  {{MILESTONE_1_TEXT}}
                </p>
              </div>
              <div className="hidden md:block" />
            </li>

            <li className="relative flex flex-col gap-2 pl-12 md:grid md:grid-cols-2 md:gap-8 md:pl-0">
              <div className="absolute left-4 top-1 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-primary bg-background md:left-1/2" />
              <div className="hidden md:block" />
              <div className="md:pl-8">
                <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                  {{MILESTONE_2_YEAR}}
                </p>
                <p className="mt-1 text-base leading-relaxed text-muted-foreground">
                  {{MILESTONE_2_TEXT}}
                </p>
              </div>
            </li>

            <li className="relative flex flex-col gap-2 pl-12 md:grid md:grid-cols-2 md:gap-8 md:pl-0">
              <div className="absolute left-4 top-1 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-primary bg-background md:left-1/2" />
              <div className="md:pr-8 md:text-right">
                <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                  {{MILESTONE_3_YEAR}}
                </p>
                <p className="mt-1 text-base leading-relaxed text-muted-foreground">
                  {{MILESTONE_3_TEXT}}
                </p>
              </div>
              <div className="hidden md:block" />
            </li>
          </ol>
        </div>
      </div>
    </section>
  );
}
