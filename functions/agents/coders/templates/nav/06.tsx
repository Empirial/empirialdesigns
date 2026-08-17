export default function Navigation() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="/" className="text-xl font-bold text-foreground">
          {{LOGO_TEXT}}
        </a>

        <a
          href="{{CTA_HREF}}"
          className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          {{CTA_TEXT}}
        </a>
      </div>
    </header>
  );
}
