import { ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="bg-background">
      <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-20 text-center sm:py-28 lg:py-32">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          {{HEADLINE}}
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground sm:text-xl">
          {{SUBHEADING}}
        </p>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row">
          <a
            href="{{CTA_HREF}}"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-8 py-3 text-base font-semibold text-primary-foreground transition-colors hover:opacity-90"
          >
            {{CTA_TEXT}}
            <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="{{CTA_SECONDARY_HREF}}"
            className="inline-flex items-center justify-center rounded-md border border-border bg-transparent px-8 py-3 text-base font-semibold text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {{CTA_SECONDARY_TEXT}}
          </a>
        </div>
      </div>
    </section>
  );
}
