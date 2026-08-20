import { Sparkles, ShieldCheck, Zap } from "lucide-react";

export default function Services() {
  const services = [
    { Icon: Sparkles, title: "{{SERVICE_1_TITLE}}", description: "{{SERVICE_1_DESC}}" },
    { Icon: ShieldCheck, title: "{{SERVICE_2_TITLE}}", description: "{{SERVICE_2_DESC}}" },
    { Icon: Zap, title: "{{SERVICE_3_TITLE}}", description: "{{SERVICE_3_DESC}}" },
  ];

  return (
    <section className="bg-background py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-balance text-center text-3xl font-semibold tracking-[-0.02em] text-foreground sm:text-4xl">
          {{SECTION_HEADING}}
        </h2>

        <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {services.map(({ Icon, title, description }) => (
            <div
              key={title}
              className="group rounded-3xl border border-border/60 bg-[hsl(var(--card)/0.6)] p-8 backdrop-blur-xl transition-transform duration-200 ease-out hover:-translate-y-1"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary">
                <Icon className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
              </div>
              <h3 className="mt-6 text-lg font-semibold tracking-[-0.01em] text-card-foreground">{title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
