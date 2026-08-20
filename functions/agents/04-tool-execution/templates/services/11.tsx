import { Sparkles, ShieldCheck, Zap } from "lucide-react";

export default function Services() {
  const services = [
    { Icon: Sparkles, title: "{{SERVICE_1_TITLE}}", description: "{{SERVICE_1_DESC}}" },
    { Icon: ShieldCheck, title: "{{SERVICE_2_TITLE}}", description: "{{SERVICE_2_DESC}}" },
    { Icon: Zap, title: "{{SERVICE_3_TITLE}}", description: "{{SERVICE_3_DESC}}" },
  ];

  return (
    <section className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-3xl font-extrabold uppercase tracking-tight text-foreground sm:text-5xl">
          {{SECTION_HEADING}}
        </h2>

        <div className="mt-12 grid grid-cols-1 border-2 border-foreground sm:grid-cols-3">
          {services.map(({ Icon, title, description }, i) => (
            <div
              key={title}
              className={`flex flex-col items-start p-8 ${i > 0 ? "border-t-2 border-foreground sm:border-l-2 sm:border-t-0" : ""}`}
            >
              <Icon className="h-8 w-8 text-foreground" aria-hidden="true" />
              <h3 className="mt-5 text-xl font-extrabold uppercase tracking-tight text-foreground">{title}</h3>
              <p className="mt-3 text-sm font-medium leading-relaxed text-foreground">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
