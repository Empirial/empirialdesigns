import { Play } from "lucide-react";

export default function Testimonials() {
  return (
    <section className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Hear it from our clients
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:mt-16 md:grid-cols-3">
          <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
            <div className="relative flex aspect-video items-center justify-center bg-muted">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Play className="h-6 w-6" fill="currentColor" aria-hidden="true" />
              </span>
            </div>
            <div className="p-5">
              <p className="text-sm font-semibold text-card-foreground">
                {"{{QUOTE_1_NAME}}"}
              </p>
              <p className="text-xs text-muted-foreground">
                {"{{QUOTE_1_ROLE}}"}
              </p>
            </div>
          </div>

          <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
            <div className="relative flex aspect-video items-center justify-center bg-muted">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Play className="h-6 w-6" fill="currentColor" aria-hidden="true" />
              </span>
            </div>
            <div className="p-5">
              <p className="text-sm font-semibold text-card-foreground">
                {"{{QUOTE_2_NAME}}"}
              </p>
              <p className="text-xs text-muted-foreground">
                {"{{QUOTE_2_ROLE}}"}
              </p>
            </div>
          </div>

          <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
            <div className="relative flex aspect-video items-center justify-center bg-muted">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Play className="h-6 w-6" fill="currentColor" aria-hidden="true" />
              </span>
            </div>
            <div className="p-5">
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
    </section>
  );
}
