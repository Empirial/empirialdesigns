export default function Services() {
  const services = [
    {
      image: "{{SERVICE_1_IMAGE_URL}}",
      title: "{{SERVICE_1_TITLE}}",
      description: "{{SERVICE_1_DESC}}",
    },
    {
      image: "{{SERVICE_2_IMAGE_URL}}",
      title: "{{SERVICE_2_TITLE}}",
      description: "{{SERVICE_2_DESC}}",
    },
    {
      image: "{{SERVICE_3_IMAGE_URL}}",
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

        <div className="mt-12 grid grid-cols-1 gap-8 sm:mt-16 sm:grid-cols-2 lg:gap-10">
          {services.map(({ image, title, description }) => (
            <div
              key={title}
              className="overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
            >
              <img
                src={image}
                alt={title}
                className="aspect-[16/10] w-full object-cover"
              />
              <div className="p-6 sm:p-8">
                <h3 className="text-xl font-semibold text-card-foreground sm:text-2xl">{title}</h3>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
