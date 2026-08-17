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

        <div className="flex items-center gap-3">
          <a
            href="{{CTA_HREF}}"
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            {{CTA_TEXT}}
          </a>

          {/* Menu control is the only way to reach nav links at every breakpoint, including desktop */}
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            aria-expanded={isOpen}
            className="inline-flex items-center justify-center rounded-md border border-border p-2 text-foreground hover:bg-muted"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <nav className="border-t border-border bg-background px-4 pb-4 pt-2">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 sm:items-end">
            <a
              href="{{NAV_LINK_1_HREF}}"
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted sm:text-right"
            >
              {{NAV_LINK_1_TEXT}}
            </a>
            <a
              href="{{NAV_LINK_2_HREF}}"
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted sm:text-right"
            >
              {{NAV_LINK_2_TEXT}}
            </a>
            <a
              href="{{NAV_LINK_3_HREF}}"
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted sm:text-right"
            >
              {{NAV_LINK_3_TEXT}}
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
