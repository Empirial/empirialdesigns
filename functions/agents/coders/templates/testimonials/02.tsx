import { Quote } from "lucide-react";

export default function Testimonials() {
  return (
    <section className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <Quote
          className="mx-auto h-10 w-10 text-primary"
          aria-hidden="true"
        />

        <blockquote className="mt-6">
          <p className="text-xl font-medium leading-relaxed text-foreground sm:text-2xl">
            {"{{QUOTE_1_TEXT}}"}
          </p>
        </blockquote>

        <div className="mt-8 flex flex-col items-center gap-3">
          <img
            src="{{QUOTE_1_AVATAR_URL}}"
            alt="{{QUOTE_1_NAME}}"
            className="h-16 w-16 rounded-full object-cover"
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

        <div className="mt-10 flex items-center justify-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-primary" aria-hidden="true" />
          <span className="h-2.5 w-2.5 rounded-full bg-muted" aria-hidden="true" />
          <span className="h-2.5 w-2.5 rounded-full bg-muted" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
