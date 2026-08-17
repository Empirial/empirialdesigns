import { Sparkles, ShieldCheck, Zap } from "lucide-react";

export default function Services() {
  const otherServices = [
    {
      Icon: Sparkles,
      title: "{{SERVICE_2_TITLE}}",
      description: "{{SERVICE_2_DESC}}",
    },
    {
      Icon: ShieldCheck,
      title: "{{SERVICE_3_TITLE}}",
      description: "{{SERVICE_3_DESC}}",
    },
    {
      Icon: Zap,
      title: "{{SERVICE_4_TITLE}}",
      description: "{{SERVICE_4_DESC}}",
    },
  ];

  return (
    <section className="bg-background py-16 sm:py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          {{SECTION_HEADING}}
        </h2>

        <div className="mt-12 overflow-hidden rounded-lg border border-border bg-card sm:mt-16 lg:grid lg:grid-cols-2 lg:items-center">
          <img
            src="{{SERVICE_1_IMAGE_URL}}"
            alt="{{SERVICE_1_TITLE}}"
            className="aspect-[16/10] w-full object-cover lg:aspect-auto lg:h-full"
          />
          <div className="p-6 sm:p-10 lg:p-12">
            <h3 className="text-2xl font-semibold text-card-foreground sm:text-3xl">
              {{SERVICE_1_TITLE}}
            </h3>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              {{SERVICE_1_DESC}}
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-8">
          {otherServices.map(({ Icon, title, description }) => (
            <div
              key={title}
              className="flex flex-col items-start rounded-lg border border-border bg-card p-6"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary">
                <Icon className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
              </div>
              <h4 className="mt-4 text-lg font-semibold text-card-foreground">{title}</h4>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
