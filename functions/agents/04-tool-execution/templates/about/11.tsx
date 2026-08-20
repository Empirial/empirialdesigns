export default function About() {
  return (
    <section className="border-b-2 border-foreground bg-background py-16 md:py-24">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-0 px-6 md:grid-cols-[1.1fr_0.9fr]">
        <div className="border-2 border-foreground p-8 md:border-r-0 md:p-12">
          <h2 className="text-3xl font-extrabold uppercase leading-[0.95] tracking-tight text-foreground md:text-4xl">
            {{HEADING}}
          </h2>
          <p className="mt-6 text-base font-medium leading-relaxed text-foreground">
            {{BODY_PARAGRAPH_1}}
          </p>
          <p className="mt-4 text-base font-medium leading-relaxed text-foreground">
            {{BODY_PARAGRAPH_2}}
          </p>
        </div>
        <div className="border-2 border-foreground">
          <img
            src="{{IMAGE_URL}}"
            alt="{{IMAGE_ALT}}"
            width={800}
            height={800}
            loading="lazy"
            className="h-full w-full object-cover grayscale"
          />
        </div>
      </div>
    </section>
  );
}
