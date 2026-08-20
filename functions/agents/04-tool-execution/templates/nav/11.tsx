import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-foreground bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <a href="/" className="text-lg font-extrabold uppercase tracking-tight text-foreground">
          {{LOGO_TEXT}}
        </a>

        <nav className="hidden flex-1 items-center justify-center gap-8 md:flex">
          <a
            href="{{NAV_LINK_1_HREF}}"
            className="rounded-sm text-sm font-bold uppercase tracking-wide text-foreground transition-colors hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {{NAV_LINK_1_TEXT}}
          </a>
          <a
            href="{{NAV_LINK_2_HREF}}"
            className="rounded-sm text-sm font-bold uppercase tracking-wide text-foreground transition-colors hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {{NAV_LINK_2_TEXT}}
          </a>
          <a
            href="{{NAV_LINK_3_HREF}}"
            className="rounded-sm text-sm font-bold uppercase tracking-wide text-foreground transition-colors hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {{NAV_LINK_3_TEXT}}
          </a>
        </nav>

        <a
          href="{{CTA_HREF}}"
          className="hidden border-2 border-foreground bg-[#FFE100] px-5 py-2 text-sm font-bold uppercase tracking-wide text-foreground shadow-[3px_3px_0_0_hsl(var(--foreground))] transition-all duration-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:inline-block"
        >
          {{CTA_TEXT}}
        </a>

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
          aria-expanded={isOpen}
          className="inline-flex items-center justify-center border-2 border-foreground p-1.5 text-foreground md:hidden"
        >
          {isOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
        </button>
      </div>

      {isOpen && (
        <nav className="border-t-2 border-foreground bg-background px-5 pb-4 pt-2 md:hidden">
          <div className="flex flex-col gap-1">
            <a href="{{NAV_LINK_1_HREF}}" className="border-b border-foreground/20 py-2 text-sm font-bold uppercase tracking-wide text-foreground">
              {{NAV_LINK_1_TEXT}}
            </a>
            <a href="{{NAV_LINK_2_HREF}}" className="border-b border-foreground/20 py-2 text-sm font-bold uppercase tracking-wide text-foreground">
              {{NAV_LINK_2_TEXT}}
            </a>
            <a href="{{NAV_LINK_3_HREF}}" className="border-b border-foreground/20 py-2 text-sm font-bold uppercase tracking-wide text-foreground">
              {{NAV_LINK_3_TEXT}}
            </a>
            <a
              href="{{CTA_HREF}}"
              className="mt-2 border-2 border-foreground bg-[#FFE100] px-3 py-2 text-center text-sm font-bold uppercase tracking-wide text-foreground"
            >
              {{CTA_TEXT}}
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
