export default function Hero() {
  return (
    <section className="bg-background">
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-20 text-center sm:py-28 lg:py-32">
        <span className="mb-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">
          {{EYEBROW}}
        </span>
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          {{HEADLINE}}
        </h1>
        <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
          {{SUBHEADING}}
        </p>
      </div>
    </section>
  );
}
