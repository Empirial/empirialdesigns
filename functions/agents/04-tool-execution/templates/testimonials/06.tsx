export default function Testimonials() {
  return (
    <section className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 text-center sm:grid-cols-3">
          <div>
            <p className="text-4xl font-bold tracking-tight text-primary">
              {"{{STAT_1_NUMBER}}"}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {"{{STAT_1_LABEL}}"}
            </p>
          </div>
          <div>
            <p className="text-4xl font-bold tracking-tight text-primary">
              {"{{STAT_2_NUMBER}}"}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {"{{STAT_2_LABEL}}"}
            </p>
          </div>
          <div>
            <p className="text-4xl font-bold tracking-tight text-primary">
              {"{{STAT_3_NUMBER}}"}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {"{{STAT_3_LABEL}}"}
            </p>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm">
            <p className="text-sm leading-relaxed text-card-foreground">
              {"{{QUOTE_1_TEXT}}"}
            </p>
            <div className="mt-5 flex items-center gap-3">
              <img
                src="{{QUOTE_1_AVATAR_URL}}"
                alt="{{QUOTE_1_NAME}}"
                className="h-10 w-10 rounded-full object-cover"
              />
              <div>
                <p className="text-sm font-semibold text-card-foreground">
                  {"{{QUOTE_1_NAME}}"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {"{{QUOTE_1_ROLE}}"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm">
            <p className="text-sm leading-relaxed text-card-foreground">
              {"{{QUOTE_2_TEXT}}"}
            </p>
            <div className="mt-5 flex items-center gap-3">
              <img
                src="{{QUOTE_2_AVATAR_URL}}"
                alt="{{QUOTE_2_NAME}}"
                className="h-10 w-10 rounded-full object-cover"
              />
              <div>
                <p className="text-sm font-semibold text-card-foreground">
                  {"{{QUOTE_2_NAME}}"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {"{{QUOTE_2_ROLE}}"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
