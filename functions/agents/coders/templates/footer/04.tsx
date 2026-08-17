import { Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground border-t border-border">
      <div className="border-b border-border bg-primary">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 py-12 text-center md:flex-row md:text-left">
          <h2 className="text-2xl font-bold text-primary-foreground md:text-3xl">
            Ready to get started?
          </h2>
          <a
            href={`{{NAV_LINK_1_HREF}}`}
            className="shrink-0 rounded-md bg-background px-6 py-3 text-sm font-semibold text-foreground transition-opacity hover:opacity-90"
          >
            {{NAV_LINK_1_TEXT}}
          </a>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          <div>
            <span className="text-xl font-bold tracking-tight">
              {{COMPANY_NAME}}
            </span>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              {{TAGLINE}}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide">
              Navigation
            </h3>
            <nav className="mt-4">
              <ul className="space-y-3">
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
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{{ADDRESS}}</span>
              </li>
            </ul>
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
