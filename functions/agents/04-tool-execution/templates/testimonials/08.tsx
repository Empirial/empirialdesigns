import { Quote } from "lucide-react";

export default function Testimonials() {
  return (
    <section className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Loved by our customers
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:mt-16 md:grid-cols-3">
          <div className="flex flex-col rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm md:mt-0">
            <Quote className="h-6 w-6 text-primary" aria-hidden="true" />
            <p className="mt-4 text-sm leading-relaxed text-card-foreground">
              {"{{QUOTE_1_TEXT}}"}
            </p>
            <div className="mt-6 flex items-center gap-3">
              <img
                src="{{QUOTE_1_AVATAR_URL}}"
                alt="{{QUOTE_1_NAME}}"
                className="h-11 w-11 rounded-full object-cover"
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

          <div className="flex flex-col rounded-lg border border-border bg-card p-6 pb-10 pt-10 text-card-foreground shadow-sm md:mt-10">
            <Quote className="h-6 w-6 text-primary" aria-hidden="true" />
            <p className="mt-4 text-sm leading-relaxed text-card-foreground">
              {"{{QUOTE_2_TEXT}}"}
            </p>
            <div className="mt-6 flex items-center gap-3">
              <img
                src="{{QUOTE_2_AVATAR_URL}}"
                alt="{{QUOTE_2_NAME}}"
                className="h-11 w-11 rounded-full object-cover"
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

          <div className="flex flex-col rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm md:mt-4">
            <Quote className="h-6 w-6 text-primary" aria-hidden="true" />
            <p className="mt-4 text-sm leading-relaxed text-card-foreground">
              {"{{QUOTE_3_TEXT}}"}
            </p>
            <div className="mt-6 flex items-center gap-3">
              <img
                src="{{QUOTE_3_AVATAR_URL}}"
                alt="{{QUOTE_3_NAME}}"
                className="h-11 w-11 rounded-full object-cover"
              />
              <div>
                <p className="text-sm font-semibold text-card-foreground">
                  {"{{QUOTE_3_NAME}}"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {"{{QUOTE_3_ROLE}}"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
