import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-[hsl(var(--background)/0.72)] backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-8">
        <a href="/" className="text-[15px] font-semibold tracking-[-0.01em] text-foreground">
          {{LOGO_TEXT}}
        </a>

        <nav className="hidden flex-1 items-center justify-center gap-9 md:flex">
          <a
            href="{{NAV_LINK_1_HREF}}"
            className="rounded-sm text-[13px] font-medium tracking-[-0.01em] text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {{NAV_LINK_1_TEXT}}
          </a>
          <a
            href="{{NAV_LINK_2_HREF}}"
            className="rounded-sm text-[13px] font-medium tracking-[-0.01em] text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {{NAV_LINK_2_TEXT}}
          </a>
          <a
            href="{{NAV_LINK_3_HREF}}"
            className="rounded-sm text-[13px] font-medium tracking-[-0.01em] text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {{NAV_LINK_3_TEXT}}
          </a>
        </nav>

        <a
          href="{{CTA_HREF}}"
          className="hidden rounded-full bg-primary px-4 py-1.5 text-[13px] font-semibold text-primary-foreground transition-transform duration-150 ease-out hover:opacity-90 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:inline-block"
        >
          {{CTA_TEXT}}
        </a>

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
          aria-expanded={isOpen}
          className="inline-flex items-center justify-center rounded-full p-2 text-foreground transition-transform duration-150 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
        >
          {isOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>

      {isOpen && (
        <nav className="border-t border-border/60 bg-[hsl(var(--background)/0.92)] px-5 pb-4 pt-2 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-1">
            <a href="{{NAV_LINK_1_HREF}}" className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted">
              {{NAV_LINK_1_TEXT}}
            </a>
            <a href="{{NAV_LINK_2_HREF}}" className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted">
              {{NAV_LINK_2_TEXT}}
            </a>
            <a href="{{NAV_LINK_3_HREF}}" className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted">
              {{NAV_LINK_3_TEXT}}
            </a>
            <a
              href="{{CTA_HREF}}"
              className="mt-2 rounded-full bg-primary px-3 py-2 text-center text-sm font-semibold text-primary-foreground active:scale-[0.97]"
            >
              {{CTA_TEXT}}
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
