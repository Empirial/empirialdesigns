import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function Services() {
  const services = [
    {
      title: "{{SERVICE_1_TITLE}}",
      description: "{{SERVICE_1_DESC}}",
    },
    {
      title: "{{SERVICE_2_TITLE}}",
      description: "{{SERVICE_2_DESC}}",
    },
    {
      title: "{{SERVICE_3_TITLE}}",
      description: "{{SERVICE_3_DESC}}",
    },
  ];

  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="bg-background py-16 sm:py-20 lg:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          {{SECTION_HEADING}}
        </h2>

        <div className="mt-12 flex flex-col gap-3 sm:mt-16">
          {services.map((service, index) => {
            const isOpen = index === openIndex;
            return (
              <div
                key={service.title}
                className="overflow-hidden rounded-lg border border-border bg-card"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left sm:p-6"
                >
                  <span className="text-lg font-semibold text-card-foreground">{service.title}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-6 sm:px-6">
                    <p className="text-base leading-relaxed text-muted-foreground">{service.description}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
