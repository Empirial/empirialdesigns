import { Sparkles, ShieldCheck, Zap } from "lucide-react";

export default function Services() {
  const services = [
    {
      Icon: Sparkles,
      title: "{{SERVICE_1_TITLE}}",
      description: "{{SERVICE_1_DESC}}",
    },
    {
      Icon: ShieldCheck,
      title: "{{SERVICE_2_TITLE}}",
      description: "{{SERVICE_2_DESC}}",
    },
    {
      Icon: Zap,
      title: "{{SERVICE_3_TITLE}}",
      description: "{{SERVICE_3_DESC}}",
    },
  ];

  return (
    <section className="bg-background py-16 sm:py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          {{SECTION_HEADING}}
        </h2>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:mt-16 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
          {services.map(({ Icon, title, description }) => (
            <div
              key={title}
              className="flex flex-col items-start rounded-lg border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md sm:p-8"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary sm:h-14 sm:w-14">
                <Icon className="h-6 w-6 text-primary-foreground sm:h-7 sm:w-7" aria-hidden="true" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-card-foreground">{title}</h3>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
