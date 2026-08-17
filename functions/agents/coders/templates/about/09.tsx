import { Check } from "lucide-react";

export default function About() {
  return (
    <section className="bg-background py-16 md:py-24">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 md:grid-cols-2 md:gap-16 md:px-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {{HEADING}}
          </h2>
          <p className="mt-6 text-base leading-relaxed text-muted-foreground md:text-lg">
            {{BODY_PARAGRAPH_1}}
          </p>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
            {{BODY_PARAGRAPH_2}}
          </p>
        </div>
        <ul className="space-y-4">
          <li className="flex items-start gap-4 rounded-lg border border-border bg-card p-4 text-card-foreground">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Check className="h-4 w-4" aria-hidden="true" />
            </span>
            <p className="pt-1 text-base leading-relaxed text-foreground">
              {{CHECKLIST_ITEM_1}}
            </p>
          </li>
          <li className="flex items-start gap-4 rounded-lg border border-border bg-card p-4 text-card-foreground">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Check className="h-4 w-4" aria-hidden="true" />
            </span>
            <p className="pt-1 text-base leading-relaxed text-foreground">
              {{CHECKLIST_ITEM_2}}
            </p>
          </li>
          <li className="flex items-start gap-4 rounded-lg border border-border bg-card p-4 text-card-foreground">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Check className="h-4 w-4" aria-hidden="true" />
            </span>
            <p className="pt-1 text-base leading-relaxed text-foreground">
              {{CHECKLIST_ITEM_3}}
            </p>
          </li>
        </ul>
      </div>
    </section>
  );
}
