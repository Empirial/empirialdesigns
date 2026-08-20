import { Quote } from "lucide-react";

export default function Testimonials() {
  return (
    <section className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="flex flex-col justify-center rounded-lg border border-border bg-card p-8 text-card-foreground shadow-sm sm:p-10">
            <Quote className="h-8 w-8 text-primary" aria-hidden="true" />
            <p className="mt-6 text-xl font-medium leading-relaxed text-card-foreground">
              {"{{QUOTE_1_TEXT}}"}
            </p>
            <div className="mt-8 flex items-center gap-4">
              <img
                src="{{QUOTE_1_AVATAR_URL}}"
                alt="{{QUOTE_1_NAME}}"
                className="h-14 w-14 rounded-full object-cover"
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

          <div className="flex flex-col justify-center gap-6">
            <div className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm">
              <p className="text-sm leading-relaxed text-card-foreground">
                {"{{QUOTE_2_TEXT}}"}
              </p>
              <div className="mt-4 flex items-center gap-3">
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

            <div className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm">
              <p className="text-sm leading-relaxed text-card-foreground">
                {"{{QUOTE_3_TEXT}}"}
              </p>
              <div className="mt-4 flex items-center gap-3">
                <img
                  src="{{QUOTE_3_AVATAR_URL}}"
                  alt="{{QUOTE_3_NAME}}"
                  className="h-10 w-10 rounded-full object-cover"
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
      </div>
    </section>
  );
}
