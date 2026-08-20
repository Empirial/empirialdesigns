import { Quote } from "lucide-react";

export default function Testimonials() {
  return (
    <section className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            What people are saying
          </h2>
        </div>

        <div className="mt-12 divide-y divide-border sm:mt-16">
          <div className="py-8 first:pt-0">
            <Quote className="h-6 w-6 text-primary" aria-hidden="true" />
            <p className="mt-4 text-lg leading-relaxed text-foreground">
              {"{{QUOTE_1_TEXT}}"}
            </p>
            <div className="mt-6 flex items-center gap-3">
              <img
                src="{{QUOTE_1_AVATAR_URL}}"
                alt="{{QUOTE_1_NAME}}"
                className="h-12 w-12 rounded-full object-cover"
              />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {"{{QUOTE_1_NAME}}"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {"{{QUOTE_1_ROLE}}"}
                </p>
              </div>
            </div>
          </div>

          <div className="py-8">
            <Quote className="h-6 w-6 text-primary" aria-hidden="true" />
            <p className="mt-4 text-lg leading-relaxed text-foreground">
              {"{{QUOTE_2_TEXT}}"}
            </p>
            <div className="mt-6 flex items-center gap-3">
              <img
                src="{{QUOTE_2_AVATAR_URL}}"
                alt="{{QUOTE_2_NAME}}"
                className="h-12 w-12 rounded-full object-cover"
              />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {"{{QUOTE_2_NAME}}"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {"{{QUOTE_2_ROLE}}"}
                </p>
              </div>
            </div>
          </div>

          <div className="py-8 last:pb-0">
            <Quote className="h-6 w-6 text-primary" aria-hidden="true" />
            <p className="mt-4 text-lg leading-relaxed text-foreground">
              {"{{QUOTE_3_TEXT}}"}
            </p>
            <div className="mt-6 flex items-center gap-3">
              <img
                src="{{QUOTE_3_AVATAR_URL}}"
                alt="{{QUOTE_3_NAME}}"
                className="h-12 w-12 rounded-full object-cover"
              />
              <div>
                <p className="text-sm font-semibold text-foreground">
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
