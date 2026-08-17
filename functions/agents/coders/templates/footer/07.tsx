import { Mail, Phone, Facebook, Instagram, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          <div>
            <span className="text-xl font-bold tracking-tight">
              {{COMPANY_NAME}}
            </span>
            <p className="mt-3 text-sm text-muted-foreground">
              {{TAGLINE}}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide">
              Sitemap
            </h3>
            <nav className="mt-4">
              <ul className="space-y-3">
                <li>
                  <a
                    href={`{{NAV_LINK_1_HREF}}`}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {{NAV_LINK_1_TEXT}}
                  </a>
                </li>
                <li>
                  <a
                    href={`{{NAV_LINK_2_HREF}}`}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {{NAV_LINK_2_TEXT}}
                  </a>
                </li>
                <li>
                  <a
                    href={`{{NAV_LINK_3_HREF}}`}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {{NAV_LINK_3_TEXT}}
                  </a>
                </li>
              </ul>
            </nav>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide">
              Contact
            </h3>
            <ul className="mt-4 space-y-3">
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <a
                  href={`mailto:{{EMAIL}}`}
                  className="transition-colors hover:text-foreground"
                >
                  {{EMAIL}}
                </a>
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <Phone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <a
                  href={`tel:{{PHONE}}`}
                  className="transition-colors hover:text-foreground"
                >
                  {{PHONE}}
                </a>
              </li>
            </ul>
            <div className="mt-4 flex items-center gap-3">
              <a
                href="#"
                aria-label="Facebook"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-accent-foreground transition-opacity hover:opacity-80"
              >
                <Facebook className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-accent-foreground transition-opacity hover:opacity-80"
              >
                <Instagram className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href="#"
                aria-label="Twitter"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-accent-foreground transition-opacity hover:opacity-80"
              >
                <Twitter className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-6">
          <p className="text-sm text-muted-foreground">
            © {{COPYRIGHT_YEAR}} {{COMPANY_NAME}}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
