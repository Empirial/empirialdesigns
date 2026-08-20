import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="/" className="text-xl font-bold text-foreground">
          {{LOGO_TEXT}}
        </a>

        <nav className="hidden flex-1 items-center justify-center gap-8 md:flex">
          <a
            href="{{NAV_LINK_1_HREF}}"
            className="text-sm font-medium text-foreground transition-colors hover:text-primary"
          >
            {{NAV_LINK_1_TEXT}}
          </a>
          <a
            href="{{NAV_LINK_2_HREF}}"
            className="text-sm font-medium text-foreground transition-colors hover:text-primary"
          >
            {{NAV_LINK_2_TEXT}}
          </a>
          <a
            href="{{NAV_LINK_3_HREF}}"
            className="text-sm font-medium text-foreground transition-colors hover:text-primary"
          >
            {{NAV_LINK_3_TEXT}}
          </a>
        </nav>

        <a
          href="{{CTA_HREF}}"
          className="hidden rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 md:inline-block"
        >
          {{CTA_TEXT}}
        </a>

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
          aria-expanded={isOpen}
          className="inline-flex items-center justify-center rounded-md p-2 text-foreground hover:bg-muted md:hidden"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {isOpen && (
        <nav className="border-t border-border bg-background px-4 pb-4 pt-2 md:hidden">
          <div className="flex flex-col gap-1">
            <a
              href="{{NAV_LINK_1_HREF}}"
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              {{NAV_LINK_1_TEXT}}
            </a>
            <a
              href="{{NAV_LINK_2_HREF}}"
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              {{NAV_LINK_2_TEXT}}
            </a>
            <a
              href="{{NAV_LINK_3_HREF}}"
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              {{NAV_LINK_3_TEXT}}
            </a>
            <a
              href="{{CTA_HREF}}"
              className="mt-2 rounded-md bg-primary px-3 py-2 text-center text-sm font-semibold text-primary-foreground"
            >
              {{CTA_TEXT}}
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
