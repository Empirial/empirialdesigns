export default function About() {
  return (
    <section className="bg-background py-24 md:py-32">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-balance text-3xl font-semibold leading-tight tracking-[-0.02em] text-foreground md:text-5xl">
          {{HEADING}}
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          {{BODY_PARAGRAPH_1}}
        </p>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          {{BODY_PARAGRAPH_2}}
        </p>
        <div className="mx-auto mt-14 aspect-[16/9] w-full overflow-hidden rounded-[28px] border border-border/60 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_40px_rgba(0,0,0,0.08)]">
          <img
            src="{{IMAGE_URL}}"
            alt="{{IMAGE_ALT}}"
            width={1280}
            height={720}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}
