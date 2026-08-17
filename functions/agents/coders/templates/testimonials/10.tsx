import { Quote } from "lucide-react";

export default function Testimonials() {
  return (
    <section className="bg-background py-24 sm:py-32">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-[-0.02em] text-foreground sm:text-4xl">
            {{SECTION_HEADING}}
          </h2>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="flex flex-col rounded-3xl border border-border/60 bg-[hsl(var(--card)/0.6)] p-7 backdrop-blur-xl"
            >
              <Quote className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              <p className="mt-4 flex-1 text-[15px] leading-relaxed text-card-foreground">
                {n === 1 ? "{{QUOTE_1_TEXT}}" : n === 2 ? "{{QUOTE_2_TEXT}}" : "{{QUOTE_3_TEXT}}"}
              </p>
              <div className="mt-6 flex items-center gap-3">
                <img
                  src={n === 1 ? "{{QUOTE_1_AVATAR_URL}}" : n === 2 ? "{{QUOTE_2_AVATAR_URL}}" : "{{QUOTE_3_AVATAR_URL}}"}
                  alt={n === 1 ? "{{QUOTE_1_NAME}}" : n === 2 ? "{{QUOTE_2_NAME}}" : "{{QUOTE_3_NAME}}"}
                  width={40}
                  height={40}
                  loading="lazy"
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div>
                  <p className="text-sm font-semibold text-card-foreground">
                    {n === 1 ? "{{QUOTE_1_NAME}}" : n === 2 ? "{{QUOTE_2_NAME}}" : "{{QUOTE_3_NAME}}"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {n === 1 ? "{{QUOTE_1_ROLE}}" : n === 2 ? "{{QUOTE_2_ROLE}}" : "{{QUOTE_3_ROLE}}"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
