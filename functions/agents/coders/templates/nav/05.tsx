import { useState } from "react";
import { Menu, X, Mail, Phone, Facebook, Instagram } from "lucide-react";

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <div className="hidden border-b border-border bg-muted md:block">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-end gap-6 px-4 sm:px-6 lg:px-8">
          <a
            href={`mailto:{{EMAIL}}`}
            className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <Mail className="h-3.5 w-3.5" aria-hidden="true" />
            {{EMAIL}}
          </a>
          <a
            href={`tel:{{PHONE}}`}
            className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <Phone className="h-3.5 w-3.5" aria-hidden="true" />
            {{PHONE}}
          </a>
          <div className="flex items-center gap-3">
            <a
              href="https://facebook.com"
              aria-label="Facebook"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <Facebook className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
            <a
              href="https://instagram.com"
              aria-label="Instagram"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <Instagram className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="/" className="text-xl font-bold text-foreground">
          {{LOGO_TEXT}}
        </a>

        <nav className="hidden items-center gap-8 md:flex">
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
          <a
            href="{{CTA_HREF}}"
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            {{CTA_TEXT}}
          </a>
        </nav>

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
            <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
              <a
                href={`mailto:{{EMAIL}}`}
                className="flex items-center gap-2 px-3 text-sm text-muted-foreground"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                {{EMAIL}}
              </a>
              <a
                href={`tel:{{PHONE}}`}
                className="flex items-center gap-2 px-3 text-sm text-muted-foreground"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                {{PHONE}}
              </a>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
