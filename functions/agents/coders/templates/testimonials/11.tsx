export default function Testimonials() {
  return (
    <section className="border-y-2 border-foreground bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-3xl font-extrabold uppercase tracking-tight text-foreground sm:text-5xl">
          {{SECTION_HEADING}}
        </h2>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="border-2 border-foreground bg-background p-6">
            <p className="text-lg font-bold leading-snug text-foreground">
              &ldquo;{"{{QUOTE_1_TEXT}}"}&rdquo;
            </p>
            <p className="mt-6 text-sm font-bold uppercase tracking-wide text-foreground">{"{{QUOTE_1_NAME}}"}</p>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{"{{QUOTE_1_ROLE}}"}</p>
          </div>
          <div className="border-2 border-foreground bg-[#FFE100] p-6">
            <p className="text-lg font-bold leading-snug text-foreground">
              &ldquo;{"{{QUOTE_2_TEXT}}"}&rdquo;
            </p>
            <p className="mt-6 text-sm font-bold uppercase tracking-wide text-foreground">{"{{QUOTE_2_NAME}}"}</p>
            <p className="text-xs font-medium uppercase tracking-wide text-foreground/70">{"{{QUOTE_2_ROLE}}"}</p>
          </div>
          <div className="border-2 border-foreground bg-background p-6">
            <p className="text-lg font-bold leading-snug text-foreground">
              &ldquo;{"{{QUOTE_3_TEXT}}"}&rdquo;
            </p>
            <p className="mt-6 text-sm font-bold uppercase tracking-wide text-foreground">{"{{QUOTE_3_NAME}}"}</p>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{"{{QUOTE_3_ROLE}}"}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
