import { Sparkles, ShieldCheck, Zap } from "lucide-react";

export default function Services() {
  const services = [
    { Icon: Sparkles, title: "{{SERVICE_1_TITLE}}", description: "{{SERVICE_1_DESC}}" },
    { Icon: ShieldCheck, title: "{{SERVICE_2_TITLE}}", description: "{{SERVICE_2_DESC}}" },
    { Icon: Zap, title: "{{SERVICE_3_TITLE}}", description: "{{SERVICE_3_DESC}}" },
  ];

  return (
    <section className="bg-background py-24">
      <div className="mx-auto max-w-4xl px-6">
        <h2 className="text-2xl font-medium tracking-[-0.01em] text-foreground">
          {{SECTION_HEADING}}
        </h2>

        <div className="mt-12 divide-y divide-border border-t border-border">
          {services.map(({ Icon, title, description }) => (
            <div key={title} className="flex items-start gap-5 py-7">
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div>
                <h3 className="text-base font-medium text-foreground">{title}</h3>
                <p className="mt-2 text-[15px] leading-[1.7] text-muted-foreground">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
