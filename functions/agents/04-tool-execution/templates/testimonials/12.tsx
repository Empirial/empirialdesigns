export default function Testimonials() {
  return (
    <section className="bg-background py-24">
      <div className="mx-auto max-w-2xl px-6">
        <h2 className="text-2xl font-medium tracking-[-0.01em] text-foreground">
          {{SECTION_HEADING}}
        </h2>

        <div className="mt-10 divide-y divide-border border-t border-border">
          <div className="py-8">
            <p className="text-base leading-[1.75] text-foreground">{"{{QUOTE_1_TEXT}}"}</p>
            <p className="mt-4 text-sm text-muted-foreground">
              {"{{QUOTE_1_NAME}}"} — {"{{QUOTE_1_ROLE}}"}
            </p>
          </div>
          <div className="py-8">
            <p className="text-base leading-[1.75] text-foreground">{"{{QUOTE_2_TEXT}}"}</p>
            <p className="mt-4 text-sm text-muted-foreground">
              {"{{QUOTE_2_NAME}}"} — {"{{QUOTE_2_ROLE}}"}
            </p>
          </div>
          <div className="py-8">
            <p className="text-base leading-[1.75] text-foreground">{"{{QUOTE_3_TEXT}}"}</p>
            <p className="mt-4 text-sm text-muted-foreground">
              {"{{QUOTE_3_NAME}}"} — {"{{QUOTE_3_ROLE}}"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
