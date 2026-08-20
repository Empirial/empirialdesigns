import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <a href="/" className="text-base font-medium tracking-[-0.01em] text-foreground">
          {{LOGO_TEXT}}
        </a>

        <nav className="hidden flex-1 items-center justify-center gap-10 md:flex">
          <a
            href="{{NAV_LINK_1_HREF}}"
            className="rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {{NAV_LINK_1_TEXT}}
          </a>
          <a
            href="{{NAV_LINK_2_HREF}}"
            className="rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {{NAV_LINK_2_TEXT}}
          </a>
          <a
            href="{{NAV_LINK_3_HREF}}"
            className="rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {{NAV_LINK_3_TEXT}}
          </a>
        </nav>

        <a
          href="{{CTA_HREF}}"
          className="hidden border-b border-foreground pb-0.5 text-sm font-medium text-foreground transition-opacity hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:inline-block"
        >
          {{CTA_TEXT}}
        </a>

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
          aria-expanded={isOpen}
          className="inline-flex items-center justify-center rounded-sm p-2 text-foreground hover:bg-muted md:hidden"
        >
          {isOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>

      {isOpen && (
        <nav className="border-t border-border bg-background px-6 pb-4 pt-2 md:hidden">
          <div className="flex flex-col gap-1">
            <a href="{{NAV_LINK_1_HREF}}" className="py-2 text-sm text-foreground">
              {{NAV_LINK_1_TEXT}}
            </a>
            <a href="{{NAV_LINK_2_HREF}}" className="py-2 text-sm text-foreground">
              {{NAV_LINK_2_TEXT}}
            </a>
            <a href="{{NAV_LINK_3_HREF}}" className="py-2 text-sm text-foreground">
              {{NAV_LINK_3_TEXT}}
            </a>
            <a href="{{CTA_HREF}}" className="mt-2 border-t border-border pt-3 text-sm font-medium text-foreground">
              {{CTA_TEXT}}
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
