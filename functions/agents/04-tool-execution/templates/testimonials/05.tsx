import { Quote } from "lucide-react";

export default function Testimonials() {
  return (
    <section className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
          <div className="flex h-16 items-center justify-center rounded-lg border border-border bg-muted text-sm font-medium text-muted-foreground sm:h-20">
            Partner
          </div>
          <div className="flex h-16 items-center justify-center rounded-lg border border-border bg-muted text-sm font-medium text-muted-foreground sm:h-20">
            Partner
          </div>
          <div className="flex h-16 items-center justify-center rounded-lg border border-border bg-muted text-sm font-medium text-muted-foreground sm:h-20">
            Partner
          </div>
          <div className="flex h-16 items-center justify-center rounded-lg border border-border bg-muted text-sm font-medium text-muted-foreground sm:h-20">
            Partner
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-2xl text-center">
          <Quote className="mx-auto h-9 w-9 text-primary" aria-hidden="true" />
          <blockquote className="mt-6">
            <p className="text-xl font-medium leading-relaxed text-foreground sm:text-2xl">
              {"{{QUOTE_1_TEXT}}"}
            </p>
          </blockquote>
          <div className="mt-8 flex flex-col items-center gap-3">
            <img
              src="{{QUOTE_1_AVATAR_URL}}"
              alt="{{QUOTE_1_NAME}}"
              className="h-14 w-14 rounded-full object-cover"
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
      </div>
    </section>
  );
}
